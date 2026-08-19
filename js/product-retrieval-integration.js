/* =========================================================
   DigiYar V4 — Product Retrieval Integration
   Build 8 — broad Persian retrieval queries
   ========================================================= */
(function (window) {
  "use strict";

  const VERSION = "4.0.0-alpha.2";

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
      mobile: "گوشی موبایل",
      laptop: "لپ تاپ",
      tablet: "تبلت",
      tv: "تلویزیون",
      camera: "دوربین",
      headphones: "هدفون",
      smartwatch: "ساعت هوشمند",
      monitor: "مانیتور",
      general: "محصول"
    };
    return map[String(category || "").toLowerCase()] || String(category || "محصول");
  }

  function usageQuery(usage) {
    const map = {
      photography: "دوربین عکاسی فیلمبرداری",
      gaming: "گیمینگ بازی",
      work: "کار اداری",
      study: "دانشجویی مطالعه",
      battery: "باتری",
      travel: "سفر",
      music: "موسیقی"
    };
    return map[String(usage || "").toLowerCase()] || String(usage || "");
  }

  /* Retrieval query must describe the product class in natural Persian.
     Budget is deliberately NOT sent as a search keyword; it is a canonical
     post-retrieval constraint, so API search cannot eliminate valid products. */
  function buildQuery(need) {
    if (!need || typeof need !== "object") return "";
    const parts = [categoryQuery(need.category)];
    if (Array.isArray(need.usage)) {
      need.usage.forEach(function (item) {
        const q = usageQuery(item);
        if (q && !parts.includes(q)) parts.push(q);
      });
    }
    if (Array.isArray(need.decisionElements)) {
      need.decisionElements.forEach(function (element) {
        if (!element || !element.field) return;
        const fieldMap = { camera: "دوربین", battery: "باتری", display: "نمایشگر", performance: "پردازنده" };
        const q = fieldMap[element.field] || String(element.field);
        if (q && !parts.includes(q)) parts.push(q);
      });
    }
    return parts.join(" ").trim();
  }

  async function retrieve(need, options) {
    if (!need || !isNeedReady(need)) {
      return { version: VERSION, status: "waiting_for_answer", need: clone(need || null), query: "", products: [], count: 0, error: null };
    }

    if (!window.DigiYarProductRetrieval || typeof window.DigiYarProductRetrieval.search !== "function") {
      return { version: VERSION, status: "retrieval_error", need: clone(need), query: "", products: [], count: 0, error: "DigiYarProductRetrieval.search is not available." };
    }

    const query = buildQuery(need);
    if (!query) {
      return { version: VERSION, status: "retrieval_error", need: clone(need), query: "", products: [], count: 0, error: "Unable to build retrieval query." };
    }

    try {
      const products = await window.DigiYarProductRetrieval.search(query, options || {});
      const normalizedProducts = Array.isArray(products) ? products : [];
      return {
        version: VERSION,
        status: normalizedProducts.length ? "products_retrieved" : "no_products",
        need: clone(need),
        query: query,
        products: clone(normalizedProducts),
        count: normalizedProducts.length,
        error: null
      };
    } catch (error) {
      return {
        version: VERSION,
        status: "retrieval_error",
        need: clone(need),
        query: query,
        products: [],
        count: 0,
        error: error && error.message ? error.message : String(error)
      };
    }
  }

  window.DigiyarProductRetrievalIntegration = {
    version: VERSION,
    isNeedReady: isNeedReady,
    buildQuery: buildQuery,
    retrieve: retrieve,
    integrate: retrieve
  };
})(window);
