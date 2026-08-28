/* =========================================================
   DigiYar V5
   Affiliate Link Manager
   ========================================================= */

(function () {

  "use strict";

  const AFFILIATE_CONFIG = {

    digikala: {
      name: "دیجی‌کالا",
      affiliateUrl: "https://aflo.ir/TrvNHEN8"
    },

    snappshop: {
      name: "اسنپ‌شاپ",
      affiliateUrl: "https://aflo.ir/1COBTqeMV"
    }

  };

  function buildAffiliateLink(store, productUrl) {

    if (!store || !productUrl) {
      return productUrl || "";
    }

    const config = AFFILIATE_CONFIG[String(store).toLowerCase()];

    if (!config || !config.affiliateUrl) {
      return productUrl;
    }

    return `${config.affiliateUrl}?p=${encodeURIComponent(productUrl)}`;
  }

  function hasAffiliate(store) {
    if (!store) return false;
    return Boolean(AFFILIATE_CONFIG[String(store).toLowerCase()]);
  }

  function getStoreConfig(store) {
    if (!store) return null;
    return AFFILIATE_CONFIG[String(store).toLowerCase()] || null;
  }

  window.DigiYarAffiliate = {
    version: "5.0.1",
    buildLink: buildAffiliateLink,
    hasAffiliate: hasAffiliate,
    getStoreConfig: getStoreConfig
  };

})();
