/* =========================================================
   DigiYar V3
   Affiliate Link Manager
   Version: 1.0.0
   ========================================================= */

(function () {

  "use strict";

  const AFFILIATE_CONFIG = {

    digikala: {
      name: "دیجی‌کالا",
      affiliateUrl:
        "https://aflo.ir/V5hl8DUI?p={redirect_to}"
    },

    snappshop: {
      name: "اسنپ‌شاپ",
      affiliateUrl:
        "https://aflo.ir/1COBTqeMV?p={redirect_to}"
    }

  };

  function buildAffiliateLink(store, productUrl) {

    if (!store || !productUrl) {
      return productUrl || "";
    }

    const config = AFFILIATE_CONFIG[
      String(store).toLowerCase()
    ];

    if (!config || !config.affiliateUrl) {
      return productUrl;
    }

    const encodedUrl = encodeURIComponent(productUrl);

    return config.affiliateUrl.replace(
      "{redirect_to}",
      encodedUrl
    );

  }

  function hasAffiliate(store) {

    if (!store) {
      return false;
    }

    return Boolean(
      AFFILIATE_CONFIG[String(store).toLowerCase()]
    );

  }

  function getStoreConfig(store) {

    if (!store) {
      return null;
    }

    return (
      AFFILIATE_CONFIG[String(store).toLowerCase()] ||
      null
    );

  }

  window.DigiYarAffiliate = {
    version: "1.0.0",
    buildLink: buildAffiliateLink,
    hasAffiliate: hasAffiliate,
    getStoreConfig: getStoreConfig
  };

})();
