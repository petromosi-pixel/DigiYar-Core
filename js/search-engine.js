/* =========================================================
   DigiYar V4 — Search Engine
   Build 3 — fixed async retrieval bridge
   ========================================================= */
(function () {
  "use strict";

  function normalizeQuery(query) {
    return String(query || "")
      .trim()
      .toLowerCase()
      .replace(/ي/g, "ی")
      .replace(/ك/g, "ک");
  }

  async function search(query, options) {
    const normalizedQuery = normalizeQuery(query);
    if (!normalizedQuery) return [];

    if (window.DigiYarProductRetrieval && typeof window.DigiYarProductRetrieval.search === "function") {
      return await window.DigiYarProductRetrieval.search(normalizedQuery, options || {});
    }

    if (window.DigiYarProductData && typeof window.DigiYarProductData.search === "function") {
      return window.DigiYarProductData.search(normalizedQuery, options || {});
    }

    return [];
  }

  window.DigiYarSearchEngine = {
    version: "4.0.0-alpha.3",
    search: search
  };
})();
