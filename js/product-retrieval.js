/* =========================================================
   DigiYar V4
   Product Retrieval Layer
   Build 10 — unified retrieval API
   ========================================================= */

(function () {

  "use strict";

  const CONFIG = {
    digikalaSearchEndpoint:
      "https://api.digikala.com/v1/search/?q=",
    timeout: 7000,
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

    return Number.isFinite(number)
      ? number
      : 0;

  }


  function normalizeProduct(product) {

    if (!product || typeof product !== "object") {
      return null;
    }

    const id =
      product.id ||
      product.pk ||
      product.product_id ||
      "";

    const name =
      product.name ||
      product.title ||
      "";

    const price = safeNumber(
      product.price ??
      product.default_variant_price ??
      product.selling_price ??
      (
        product.default_variant &&
        product.default_variant.price
      )
    );

    const productUrl =
      product.productUrl ||
      product.url ||
      product.product_url ||
      "";

    const image =
      product.image ||
      product.image_url ||
      product.thumbnail ||
      (
        product.images &&
        product.images.main
      ) ||
      "";

    const features = Array.isArray(product.features)
      ? product.features.slice()
      : [];

    return {
      id: String(id),
      name: String(name),
      category: product.category || "general",
      price: price,
      store: product.store || "digikala",
      productUrl: productUrl,
      affiliateUrl: product.affiliateUrl || "",
      image: image,
      features: features
    };

  }


  function localSearch(query, options) {

    if (
      !window.DigiYarProductData ||
      typeof window.DigiYarProductData.search !== "function"
    ) {
      return [];
    }

    const results =
      window.DigiYarProductData.search(
        query,
        options || {}
      );

    if (!Array.isArray(results)) {
      return [];
    }

    return results
      .map(normalizeProduct)
      .filter(Boolean)
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
        headers: {
          "Accept": "application/json"
        },
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new Error("HTTP " + response.status);
      }

      return await response.json();

    } catch (error) {

      clearTimeout(timer);
      throw error;

    }

  }


  function extractDigikalaProducts(data) {

    if (!data) {
      return [];
    }

    const candidates = [
      data.data && data.data.products,
      data.data && data.data.items,
      data.products,
      data.items,
      data.data &&
        data.data.products &&
        data.data.products.data
    ];

    let products = [];

    for (let i = 0; i < candidates.length; i++) {

      if (Array.isArray(candidates[i])) {
        products = candidates[i];
        break;
      }

    }

    return products
      .map(function (product) {

        return normalizeProduct({
          id: product.id || product.pk,
          name: product.title || product.name,
          category: product.category || "general",
          price:
            product.price ||
            (
              product.default_variant &&
              product.default_variant.price
            ),
          store: "digikala",
          productUrl:
            product.url ||
            product.product_url ||
            "",
          image:
            product.image ||
            product.image_url ||
            (
              product.images &&
              product.images.main
            ),
          features: product.features || []
        });

      })
      .filter(Boolean)
      .slice(0, CONFIG.maxResults);

  }


  async function searchRemote(query) {

    const normalizedQuery = normalizeText(query);

    if (!normalizedQuery) {
      return [];
    }

    const url =
      CONFIG.digikalaSearchEndpoint +
      encodeURIComponent(normalizedQuery);

    const data = await fetchWithTimeout(
      url,
      CONFIG.timeout
    );

    return extractDigikalaProducts(data);

  }


  async function search(query, options) {

    const normalizedQuery = normalizeText(query);

    if (!normalizedQuery) {
      return [];
    }

    const settings = options || {};

    /*
     * Local mode is deterministic and is used by the current
     * Smart Recommendation pipeline and tests.
     */
    if (settings.remote === false) {
      return localSearch(normalizedQuery, settings);
    }

    /*
     * Remote source is optional. If CORS/network/API access fails,
     * the same normalized local schema is returned.
     */
    try {

      const remoteResults = await searchRemote(
        normalizedQuery
      );

      if (remoteResults.length) {
        return remoteResults;
      }

    } catch (error) {

      console.warn(
        "DigiYar Product Retrieval: remote source unavailable.",
        error
      );

    }

    return localSearch(
      normalizedQuery,
      settings
    );

  }


  const DigiYarProductRetrieval = {
    version: "4.0.0-alpha.3",
    config: CONFIG,
    normalizeProduct: normalizeProduct,
    search: search,
    searchRemote: searchRemote,
    localSearch: localSearch
  };

  window.DigiYarProductRetrieval =
    DigiYarProductRetrieval;

})();
