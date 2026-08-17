/* =========================================================
   DigiYar V4
   Product Retrieval Layer
   Build 14 — Cloudflare Worker live source
   ========================================================= */

(function () {
  "use strict";

  const CONFIG = {
    /* Live Cloudflare Worker proxy */
    proxyEndpoint: "https://digiyar-search-proxy.petromosi.workers.dev",
    digikalaSearchEndpoint: "https://api.digikala.com/v1/search/?q=",
    digikalaBaseUrl: "https://www.digikala.com",
    timeout: 8000,
    maxResults: 20
  };

  function normalizeText(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/ي/g, "ی")
      .replace(/ك/g, "ک");
  }

  function safeNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function firstNonEmpty(values) {
    for (let i = 0; i < values.length; i++) {
      const value = values[i];

      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }

      if (value && typeof value === "object") {
        const nested =
          value.url ||
          value.src ||
          value.href ||
          value.link ||
          "";

        if (typeof nested === "string" && nested.trim()) {
          return nested.trim();
        }
      }
    }

    return "";
  }

  function absoluteDigikalaUrl(value) {
    if (!value) return "";

    const text = String(value).trim();
    if (!text) return "";

    if (/^https?:\/\//i.test(text)) return text;
    if (text.charAt(0) === "/") return CONFIG.digikalaBaseUrl + text;
    return CONFIG.digikalaBaseUrl + "/" + text;
  }

  function resolveImage(product) {
    if (!product || typeof product !== "object") return "";

    const images = product.images;
    const values = [
      product.image_url,
      product.imageUrl,
      product.image,
      product.thumbnail_url,
      product.thumbnailUrl,
      product.thumbnail,
      product.photo,
      product.cover
    ];

    if (Array.isArray(images)) {
      values.push.apply(values, images);
    } else if (images && typeof images === "object") {
      values.push(
        images.main,
        images.primary,
        images.thumbnail,
        images.large,
        images.medium,
        images.small
      );
    }

    return firstNonEmpty(values);
  }

  function resolveProductUrl(product) {
    if (!product || typeof product !== "object") return "";

    return absoluteDigikalaUrl(
      firstNonEmpty([
        product.productUrl,
        product.product_url,
        product.url,
        product.web_url,
        product.link
      ])
    );
  }

  function resolvePrice(product) {
    if (!product || typeof product !== "object") return 0;

    const price = product.price;
    const variant = product.default_variant;

    if (price && typeof price === "object") {
      const value =
        safeNumber(price.selling_price) ||
        safeNumber(price.value) ||
        safeNumber(price.amount) ||
        safeNumber(price.final_price);

      if (value > 0) return value;
    }

    return (
      safeNumber(product.selling_price) ||
      safeNumber(product.default_variant_price) ||
      safeNumber(product.price) ||
      safeNumber(variant && variant.selling_price) ||
      safeNumber(variant && variant.price)
    );
  }

  function resolveName(product) {
    return firstNonEmpty([
      product && product.title_fa,
      product && product.name,
      product && product.title,
      product && product.product_name,
      product && product.title_en
    ]);
  }

  function resolveFeatures(product) {
    const features = [];

    if (Array.isArray(product.features)) {
      product.features.forEach(function (item) {
        if (typeof item === "string" && item.trim()) {
          features.push(item.trim());
        }
      });
    }

    if (product.brand && typeof product.brand === "object") {
      const brand = product.brand.title_fa || product.brand.title;
      if (brand) features.push(brand);
    } else if (typeof product.brand === "string" && product.brand.trim()) {
      features.push(product.brand.trim());
    }

    if (product.rating && typeof product.rating === "object") {
      const rate = safeNumber(product.rating.rate);
      if (rate > 0) {
        features.push("امتیاز " + (rate / 20).toFixed(1) + " از ۵");
      }
    }

    return features.slice(0, 5);
  }

  function normalizeProduct(product) {
    if (!product || typeof product !== "object") return null;

    const id =
      product.id ||
      product.pk ||
      product.product_id ||
      product.code ||
      "";

    const name = resolveName(product);
    const image = resolveImage(product);
    const productUrl = resolveProductUrl(product);

    return {
      id: String(id),
      name: String(name || ""),
      category: typeof product.category === "string" ? product.category : "general",
      price: resolvePrice(product),
      store: "digikala",
      productUrl: productUrl,
      affiliateUrl: product.affiliateUrl || "",
      image: image,
      features: resolveFeatures(product),
      rating: product.rating || null,
      seller: product.seller || null,
      status: product.status || ""
    };
  }

  function localSearch(query, options) {
    if (!window.DigiYarProductData || typeof window.DigiYarProductData.search !== "function") {
      return [];
    }

    const results = window.DigiYarProductData.search(query, options || {});
    if (!Array.isArray(results)) return [];

    return results
      .map(normalizeProduct)
      .filter(function (product) {
        return product && product.name;
      })
      .slice(0, CONFIG.maxResults);
  }

  async function fetchWithTimeout(url, timeout) {
    const controller = new AbortController();
    const timer = setTimeout(function () {
      controller.abort();
    }, timeout);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error("HTTP " + response.status);
      }

      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  }

  function extractDigikalaProducts(data) {
    if (!data) return [];

    const candidates = [
      data.data && data.data.products,
      data.data && data.data.items,
      data.products,
      data.items,
      data.data && data.data.products && data.data.products.data,
      data.data && data.data.products && data.data.products.items
    ];

    let products = [];

    for (let i = 0; i < candidates.length; i++) {
      if (Array.isArray(candidates[i])) {
        products = candidates[i];
        break;
      }
    }

    return products
      .map(normalizeProduct)
      .filter(function (product) {
        return product && product.name;
      })
      .slice(0, CONFIG.maxResults);
  }

  function buildProxyUrl(query) {
    const base = String(CONFIG.proxyEndpoint || "").trim();
    if (!base) return "";

    const separator = base.indexOf("?") >= 0 ? "&" : "?";
    return base.replace(/\/$/, "") + separator + "q=" + encodeURIComponent(query);
  }

  async function searchRemote(query) {
    const normalizedQuery = normalizeText(query);
    if (!normalizedQuery) return [];

    const proxyUrl = buildProxyUrl(normalizedQuery);

    /* Preferred path: Cloudflare Worker proxy. */
    if (proxyUrl) {
      try {
        const data = await fetchWithTimeout(proxyUrl, CONFIG.timeout);
        const proxyResults = extractDigikalaProducts(data);

        if (proxyResults.length) {
          return proxyResults;
        }
      } catch (error) {
        console.warn(
          "DigiYar Product Retrieval: proxy unavailable.",
          error
        );
      }
    }

    /* Development fallback: direct Digikala API. */
    const directUrl =
      CONFIG.digikalaSearchEndpoint + encodeURIComponent(normalizedQuery);

    const data = await fetchWithTimeout(directUrl, CONFIG.timeout);
    return extractDigikalaProducts(data);
  }

  async function search(query, options) {
    const normalizedQuery = normalizeText(query);
    if (!normalizedQuery) return [];

    const settings = options || {};

    if (settings.remote === false) {
      return localSearch(normalizedQuery, settings);
    }

    try {
      const remoteResults = await searchRemote(normalizedQuery);

      if (remoteResults.length) {
        return remoteResults;
      }
    } catch (error) {
      console.warn(
        "DigiYar Product Retrieval: live source unavailable; using local fallback.",
        error
      );
    }

    return localSearch(normalizedQuery, settings);
  }

  function setProxyEndpoint(url) {
    CONFIG.proxyEndpoint = String(url || "").trim().replace(/\/$/, "");
    return CONFIG.proxyEndpoint;
  }

  const DigiYarProductRetrieval = {
    version: "4.0.0-alpha.7",
    config: CONFIG,
    setProxyEndpoint: setProxyEndpoint,
    normalizeText: normalizeText,
    normalizeProduct: normalizeProduct,
    resolveImage: resolveImage,
    resolveProductUrl: resolveProductUrl,
    resolvePrice: resolvePrice,
    search: search,
    searchRemote: searchRemote,
    localSearch: localSearch
  };

  window.DigiYarProductRetrieval = DigiYarProductRetrieval;
})();
