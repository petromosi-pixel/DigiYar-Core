/* =========================================================
   DigiYar V4 — Product Retrieval Integration
   Build 9 — live pipeline diagnostics
   ========================================================= */
(function (window) {
  "use strict";

  const VERSION = "4.0.0-alpha.3";

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function hasValue(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return Object.keys(value).length > 0;
    return true;
  }

  function isNeedReady(need) {
    return !!(need && typeof need === "object" &&
      hasValue(need.category) && hasValue(need.budget) &&
      Array.isArray(need.usage) && need.usage.length > 0);
  }

  function categoryQuery(category) {
    const map = {
      mobile: "گوشی موبایل", laptop: "لپ تاپ", tablet: "تبلت", tv: "تلویزیون",
      camera: "دوربین", headphones: "هدفون", smartwatch: "ساعت هوشمند",
      monitor: "مانیتور", general: "محصول"
    };
    return map[String(category || "").toLowerCase()] || String(category || "محصول");
  }

  function usageQuery(usage) {
    const map = {
      photography: "دوربین عکاسی فیلمبرداری", gaming: "گیمینگ بازی", work: "کار اداری",
      study: "دانشجویی مطالعه", battery: "باتری", travel: "سفر", music: "موسیقی"
    };
    return map[String(usage || "").toLowerCase()] || String(usage || "");
  }

  function buildQuery(need) {
    if (!need || typeof need !== "object") return "";
    const parts = [categoryQuery(need.category)];
    if (Array.isArray(need.usage)) need.usage.forEach(function (item) {
      const q = usageQuery(item);
      if (q && !parts.includes(q)) parts.push(q);
    });
    if (Array.isArray(need.decisionElements)) need.decisionElements.forEach(function (element) {
      if (!element || !element.field) return;
      const fieldMap = { camera: "دوربین", battery: "باتری", display: "نمایشگر", performance: "پردازنده" };
      const q = fieldMap[element.field] || String(element.field);
      if (q && !parts.includes(q)) parts.push(q);
    });
    return parts.join(" ").trim();
  }

  function extractRawProducts(data) {
    if (!data) return [];
    const candidates = [
      data.data && data.data.products,
      data.data && data.data.items,
      data.products,
      data.items,
      data.data && data.data.products && data.data.products.data,
      data.data && data.data.products && data.data.products.items
    ];
    for (let i = 0; i < candidates.length; i++) {
      if (Array.isArray(candidates[i])) return candidates[i];
    }
    return [];
  }

  async function fetchJson(url, timeout) {
    const controller = new AbortController();
    const timer = setTimeout(function () { controller.abort(); }, timeout || 8000);
    try {
      const response = await fetch(url, { method: "GET", headers: { Accept: "application/json" }, signal: controller.signal });
      if (!response.ok) throw new Error("HTTP " + response.status);
      return await response.json();
    } finally { clearTimeout(timer); }
  }

  async function diagnose(query) {
    const retrieval = window.DigiYarProductRetrieval;
    const config = retrieval && retrieval.config ? retrieval.config : {};
    const result = {
      query: query || "",
      source: "none",
      rawCount: 0,
      normalizedCount: 0,
      pricedCount: 0,
      products: [],
      error: null
    };

    const endpoints = [];
    if (config.proxyEndpoint) endpoints.push({ name: "proxy", url: String(config.proxyEndpoint).replace(/\/$/, "") + "?q=" + encodeURIComponent(query) });
    if (config.digikalaSearchEndpoint) endpoints.push({ name: "digikala", url: config.digikalaSearchEndpoint + encodeURIComponent(query) });

    for (let i = 0; i < endpoints.length; i++) {
      try {
        const data = await fetchJson(endpoints[i].url, config.timeout || 8000);
        const raw = extractRawProducts(data);
        result.source = endpoints[i].name;
        result.rawCount = raw.length;
        if (retrieval && typeof retrieval.normalizeProduct === "function") {
          result.products = raw.map(function (p) {
            return retrieval.normalizeProduct(p, { currency: "rial", store: "digikala" });
          }).filter(function (p) { return p && p.name; });
        }
        result.normalizedCount = result.products.length;
        result.pricedCount = result.products.filter(function (p) { return Number(p.price) > 0; }).length;
        return result;
      } catch (error) {
        result.error = error && error.message ? error.message : String(error);
      }
    }
    return result;
  }

  async function retrieve(need, options) {
    if (!need || !isNeedReady(need)) {
      return { version: VERSION, status: "waiting_for_answer", need: clone(need || null), query: "", products: [], count: 0, diagnostic: null, error: null };
    }
    if (!window.DigiYarProductRetrieval || typeof window.DigiYarProductRetrieval.search !== "function") {
      return { version: VERSION, status: "retrieval_error", need: clone(need), query: "", products: [], count: 0, diagnostic: null, error: "DigiYarProductRetrieval.search is not available." };
    }

    const query = buildQuery(need);
    if (!query) return { version: VERSION, status: "retrieval_error", need: clone(need), query: "", products: [], count: 0, diagnostic: null, error: "Unable to build retrieval query." };

    try {
      const products = await window.DigiYarProductRetrieval.search(query, options || {});
      const normalizedProducts = Array.isArray(products) ? products : [];
      let diagnostic = null;
      if (!normalizedProducts.length || (options && options.diagnostic === true)) diagnostic = await diagnose(query);
      return {
        version: VERSION,
        status: normalizedProducts.length ? "products_retrieved" : "no_products",
        need: clone(need), query: query, products: clone(normalizedProducts), count: normalizedProducts.length,
        diagnostic: diagnostic, error: null
      };
    } catch (error) {
      const diagnostic = await diagnose(query);
      return {
        version: VERSION, status: "retrieval_error", need: clone(need), query: query, products: [], count: 0,
        diagnostic: diagnostic, error: error && error.message ? error.message : String(error)
      };
    }
  }

  window.DigiyarProductRetrievalIntegration = {
    version: VERSION,
    isNeedReady: isNeedReady,
    buildQuery: buildQuery,
    diagnose: diagnose,
    retrieve: retrieve,
    integrate: retrieve
  };
})(window);
