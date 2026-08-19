/* =========================================================
   DigiYar V4 — Product Price Bridge
   Canonical product price: Toman
   Filters live inventory by the user's real budget.
   ========================================================= */
(function (window) {
  "use strict";

  function boot() {
    const Retrieval = window.DigiYarProductRetrieval;
    const Policy = window.DigiYarPricePolicy;
    if (!Retrieval || !Policy || Retrieval.__pricePolicyBridge) return;

    const originalSearch = Retrieval.search;

    Retrieval.search = async function (query, options) {
      const settings = options || {};
      const rawItems = await originalSearch.call(Retrieval, query, settings);
      const items = Array.isArray(rawItems) ? rawItems : [];

      const normalized = items.map(function (item) {
        const copy = Object.assign({}, item);
        copy.price = Policy.productPriceToToman(
          copy.price,
          copy.store || "digikala",
          copy.priceUnit
        );
        copy.currency = "toman";
        return copy;
      });

      const max = Number(settings.maxPrice);
      const filtered = Number.isFinite(max) && max > 0
        ? normalized.filter(function (item) {
            return item.price > 0 && item.price <= max;
          })
        : normalized;

      return filtered.slice(0, 3);
    };

    Retrieval.__pricePolicyBridge = true;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window);
