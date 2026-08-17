/* =========================================================
   DigiYar V4
   Product Retrieval Layer
   Build 11 — real product identity + image resolver
   ========================================================= */

(function () {

  "use strict";

  const CONFIG = {
    digikalaSearchEndpoint:
      "https://api.digikala.com/v1/search/?q=",
    timeout: 7000,
    maxResults: 20
  };


  /* =======================================================
     Helpers
     ======================================================= */

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


  function firstNonEmpty(values) {

    for (let i = 0; i < values.length; i++) {

      const value = values[i];

      if (
        typeof value === "string" &&
        value.trim()
      ) {
        return value.trim();
      }

      if (
        value &&
        typeof value === "object" &&
        typeof value.url === "string" &&
        value.url.trim()
      ) {
        return value.url.trim();
      }

    }

    return "";

  }


  /* =======================================================
     Image Resolver
     ======================================================= */

  function resolveImage(product) {

    if (!product || typeof product !== "object") {
      return "";
    }

    const images = product.images;

    const imageCollections = [];

    if (Array.isArray(images)) {
      imageCollections.push(images);
    }

    if (images && typeof images === "object") {

      imageCollections.push(
        images.main,
        images.primary,
        images.thumbnail,
        images.large,
        images.medium,
        images.small
      );

    }

    const collectionValues = [];

    imageCollections.forEach(function (collection) {

      if (Array.isArray(collection)) {
        collection.forEach(function (item) {
          collectionValues.push(item);
        });
      } else if (collection) {
        collectionValues.push(collection);
      }

    });

    return firstNonEmpty([
      product.image,
      product.image_url,
      product.imageUrl,
      product.thumbnail,
      product.thumbnail_url,
      product.thumbnailUrl,
      product.photo,
      product.cover,
      ...collectionValues
    ]);

  }


  function resolveProductUrl(product) {

    if (!product || typeof product !== "object") {
      return "";
    }

    return firstNonEmpty([
      product.productUrl,
      product.product_url,
      product.url,
      product.web_url,
      product.link
    ]);

  }


  function resolvePrice(product) {

    if (!product || typeof product !== "object") {
      return 0;
    }

    const variant = product.default_variant;
    const priceObject = product.price;

    return safeNumber(
      typeof priceObject === "object"
        ? (
            priceObject.selling_price ||
            priceObject.value ||
            priceObject.amount
          )
        : priceObject
    ) || safeNumber(
      product.default_variant_price
    ) || safeNumber(
      product.selling_price
    ) || safeNumber(
      variant && (
        variant.price ||
        variant.selling_price
      )
    );

  }


  /* =======================================================
     Product Normalization
     ======================================================= */

  function normalizeProduct(product) {

    if (!product || typeof product !== "object") {
      return null;
    }

    const id =
      product.id ||
      product.pk ||
      product.product_id ||
      product.code ||
      "";

    const name =
      product.name ||
      product.title ||
      product.product_name ||
      "";

    const productUrl =
      resolveProductUrl(product);

    const image =
      resolveImage(product);

    const features = Array.isArray(product.features)
      ? product.features.slice()
      : [];

    return {
      id: String(id),
      name: String(name),
      category: product.category || "general",
      price: resolvePrice(product),
      store: product.store || "digikala",
      productUrl: productUrl,
      affiliateUrl: product.affiliateUrl || "",
      image: image,
      features: features
    };

  }


  /* =======================================================
     Local Search
     ======================================================= */

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
      .filter(function (product) {
        return (
          product &&
          product.name
        );
      })
      .slice(0, CONFIG.maxResults);

  }


  /* =======================================================
     Remote Fetch
     ======================================================= */

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


  /* =======================================================
     Digikala Response Extraction
     ======================================================= */

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
        data.data.products.data,
      data.data &&
        data.data.products &&
        data.data.products.items
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
        return normalizeProduct(product);
      })
      .filter(function (product) {
        return (
          product &&
          product.name
        );
      })
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


  /* =======================================================
     Unified Search
     ======================================================= */

  async function search(query, options) {

    const normalizedQuery = normalizeText(query);

    if (!normalizedQuery) {
      return [];
    }

    const settings = options || {};

    if (settings.remote === false) {
      return localSearch(normalizedQuery, settings);
    }

    try {

      const remoteResults = await searchRemote(
        normalizedQuery
      );

      if (remoteResults.length) {
        return remoteResults;
      }

    } catch (error) {

      console.warn(
        "DigiYar Product Retrieval: remote source unavailable; using local fallback.",
        error
      );

    }

    return localSearch(
      normalizedQuery,
      settings
    );

  }


  /* =======================================================
     Public API
     ======================================================= */

  const DigiYarProductRetrieval = {
    version: "4.0.0-alpha.4",
    config: CONFIG,
    normalizeText: normalizeText,
    normalizeProduct: normalizeProduct,
    resolveImage: resolveImage,
    resolveProductUrl: resolveProductUrl,
    search: search,
    searchRemote: searchRemote,
    localSearch: localSearch
  };


  window.DigiYarProductRetrieval =
    DigiYarProductRetrieval;

})();
