/* =========================================================
   DigiYar V4
   Product Retrieval Layer
   Build 16 — proxy envelope handling
   ========================================================= */

(function () {
  "use strict";

  const CONFIG = {
    proxyEndpoint: "https://digiyar-search-proxy.petromosi.workers.dev/search",
    digikalaSearchEndpoint: "https://api.digikala.com/v1/search/?q=",
    digikalaBaseUrl: "https://www.digikala.com",
    timeout: 8000,
    maxResults: 20,
    canonicalCurrency: "toman",
    digikalaRemoteCurrency: "rial"
  };

  function normalizeText(value) { return String(value || "").trim().toLowerCase().replace(/ي/g, "ی").replace(/ك/g, "ک"); }
  function safeNumber(value) { const number = Number(value); return Number.isFinite(number) ? number : 0; }
  function firstNonEmpty(values) {
    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      if (typeof value === "string" && value.trim()) return value.trim();
      if (value && typeof value === "object") {
        const nested = value.url || value.src || value.href || value.link || "";
        if (typeof nested === "string" && nested.trim()) return nested.trim();
      }
    }
    return "";
  }
  function absoluteDigikalaUrl(value) {
    if (!value) return "";
    const text = String(value).trim();
    if (!text) return "";
    if (/^https?:\/\//i.test(text)) return text;
    return CONFIG.digikalaBaseUrl + (text.charAt(0) === "/" ? text : "/" + text);
  }
  function resolveImage(product) {
    if (!product || typeof product !== "object") return "";
    const values = [product.image_url, product.imageUrl, product.image, product.thumbnail_url, product.thumbnailUrl, product.thumbnail, product.photo, product.cover];
    if (Array.isArray(product.images)) values.push.apply(values, product.images);
    else if (product.images && typeof product.images === "object") values.push(product.images.main, product.images.primary, product.images.thumbnail, product.images.large, product.images.medium, product.images.small);
    return firstNonEmpty(values);
  }
  function resolveProductUrl(product) { return absoluteDigikalaUrl(firstNonEmpty([product && product.productUrl, product && product.product_url, product && product.url, product && product.web_url, product && product.link])); }
  function rawPrice(product) {
    if (!product || typeof product !== "object") return 0;
    const price = product.price, variant = product.default_variant;
    if (price && typeof price === "object") {
      const value = safeNumber(price.selling_price) || safeNumber(price.value) || safeNumber(price.amount) || safeNumber(price.final_price);
      if (value > 0) return value;
    }
    return safeNumber(product.selling_price) || safeNumber(product.default_variant_price) || safeNumber(product.price) || safeNumber(variant && variant.selling_price) || safeNumber(variant && variant.price);
  }
  function normalizePrice(value, currency) { const number = safeNumber(value); if (number <= 0) return 0; return currency === "rial" ? Math.round(number / 10) : Math.round(number); }
  function resolvePrice(product, currency) { return normalizePrice(rawPrice(product), currency || "toman"); }
  function resolveName(product) { return firstNonEmpty([product && product.title_fa, product && product.name, product && product.title, product && product.product_name, product && product.title_en]); }
  function resolveFeatures(product) {
    const features = [];
    if (Array.isArray(product.features)) product.features.forEach(function (item) { if (typeof item === "string" && item.trim()) features.push(item.trim()); });
    if (product.brand && typeof product.brand === "object") { const brand = product.brand.title_fa || product.brand.title; if (brand) features.push(brand); }
    else if (typeof product.brand === "string" && product.brand.trim()) features.push(product.brand.trim());
    return features.slice(0, 5);
  }
  function normalizeProduct(product, options) {
    if (!product || typeof product !== "object") return null;
    const settings = options || {};
    return {
      id: String(product.id || product.pk || product.product_id || product.code || ""),
      name: String(resolveName(product) || ""), category: typeof product.category === "string" ? product.category : "general",
      price: resolvePrice(product, settings.currency || "toman"), store: settings.store || "digikala",
      productUrl: resolveProductUrl(product), affiliateUrl: product.affiliateUrl || "", image: resolveImage(product),
      features: resolveFeatures(product), rating: product.rating || null, seller: product.seller || null, status: product.status || ""
    };
  }
  function localSearch(query, options) {
    if (!window.DigiYarProductData || typeof window.DigiYarProductData.search !== "function") return [];
    const results = window.DigiYarProductData.search(query, options || {});
    return Array.isArray(results) ? results.map(function (p) { return normalizeProduct(p, { currency: "toman", store: "local" }); }).filter(function (p) { return p && p.name; }).slice(0, CONFIG.maxResults) : [];
  }
  async function fetchWithTimeout(url, timeout) {
    const controller = new AbortController(), timer = setTimeout(function () { controller.abort(); }, timeout);
    try { const response = await fetch(url, { method: "GET", headers: { Accept: "application/json" }, signal: controller.signal }); if (!response.ok) throw new Error("HTTP " + response.status); return await response.json(); }
    finally { clearTimeout(timer); }
  }
  function unwrapProxy(data) { return data && data.data && typeof data.data === "object" ? data.data : data; }
  function extractDigikalaProducts(data) {
    const payload = unwrapProxy(data);
    if (!payload) return [];
    const candidates = [payload.data && payload.data.products, payload.data && payload.data.items, payload.products, payload.items, payload.data && payload.data.products && payload.data.products.data, payload.data && payload.data.products && payload.data.products.items];
    let products = [];
    for (let i = 0; i < candidates.length; i++) if (Array.isArray(candidates[i])) { products = candidates[i]; break; }
    return products.map(function (p) { return normalizeProduct(p, { currency: CONFIG.digikalaRemoteCurrency, store: "digikala" }); }).filter(function (p) { return p && p.name; }).slice(0, CONFIG.maxResults);
  }
  async function searchRemote(query) {
    const normalizedQuery = normalizeText(query);
    if (!normalizedQuery) return [];
    if (CONFIG.proxyEndpoint) {
      try { const proxyResults = extractDigikalaProducts(await fetchWithTimeout(CONFIG.proxyEndpoint + "?q=" + encodeURIComponent(normalizedQuery), CONFIG.timeout)); if (proxyResults.length) return proxyResults; }
      catch (error) { console.warn("DigiYar Product Retrieval: proxy unavailable.", error); }
    }
    return extractDigikalaProducts(await fetchWithTimeout(CONFIG.digikalaSearchEndpoint + encodeURIComponent(normalizedQuery), CONFIG.timeout));
  }
  async function search(query, options) {
    const normalizedQuery = normalizeText(query); if (!normalizedQuery) return [];
    const settings = options || {};
    if (settings.remote === false) return localSearch(normalizedQuery, settings);
    try { const remoteResults = await searchRemote(normalizedQuery); if (remoteResults.length) return remoteResults; }
    catch (error) { console.warn("DigiYar Product Retrieval: live source unavailable; using local fallback.", error); }
    return localSearch(normalizedQuery, settings);
  }
  function setProxyEndpoint(url) { CONFIG.proxyEndpoint = String(url || "").trim().replace(/\/$/, ""); return CONFIG.proxyEndpoint; }

  window.DigiYarProductRetrieval = { version: "4.0.0-alpha.8", config: CONFIG, setProxyEndpoint, normalizeText, normalizeProduct, normalizePrice, resolveImage, resolveProductUrl, resolvePrice, search, searchRemote, localSearch };
})();
