/* =========================================================
   DigiYar V3
   Search Engine
   ========================================================= */

(function () {

  "use strict";


  /* =======================================================
     Helpers
     ======================================================= */

  function normalizeQuery(query) {

    return String(
      query || ""
    )
      .trim()
      .toLowerCase()
      .replace(/ي/g, "ی")
      .replace(/ك/g, "ک");

  }


  /* =======================================================
     Search
     ======================================================= */

  async function search(
    query,
    options
  ) {

    const normalizedQuery =
      normalizeQuery(query);


    if (!normalizedQuery) {

      return [];

    }


    /*
     * اولویت با Product Retrieval
     */

    if (
      window.DigiYarProductRetrieval &&
      typeof
        window.DigiYarProductRetrieval.search ===
        "function"
    ) {

      return
        await window.DigiYarProductRetrieval
          .search(
            normalizedQuery,
            options
          );

    }


    /*
     * Fallback نهایی
     */

    if (
      window.DigiYarProductData &&
      typeof
        window.DigiYarProductData.search ===
        "function"
    ) {

      return
        window.DigiYarProductData
          .search(
            normalizedQuery
          );

    }


    return [];

  }


  /* =======================================================
     Public API
     ======================================================= */

  const DigiYarSearchEngine = {

    version:
      "2.0.0",

    search:
      search

  };


  window.DigiYarSearchEngine =
    DigiYarSearchEngine;


})();
