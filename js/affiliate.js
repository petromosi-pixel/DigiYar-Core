/* =========================================================
   DigiYar V3
   Affiliate Link Manager
   Version: 1.0.0
   ========================================================= */

(function () {

  "use strict";


  /*
   * =======================================================
   * تنظیمات فروشگاه‌ها
   * =======================================================
   *
   * برای اضافه کردن فروشگاه جدید، فقط یک مورد جدید
   * به این بخش اضافه می‌کنیم.
   *
   * redirect_to با لینک واقعی محصول جایگزین می‌شود.
   */

  const AFFILIATE_CONFIG = {

    digikala: {

      name: "دیجی‌کالا",

      affiliateUrl:
        "https://aflo.ir/TrvNHEN8?p={redirect_to}"

    },


    snappshop: {

      name: "اسنپ‌شاپ",

      affiliateUrl:
        "https://aflo.ir/1COBTqeMV?p={redirect_to}"

    }

  };


  /*
   * =======================================================
   * ساخت لینک افیلیت
   * =======================================================
   */

  function buildAffiliateLink(
    store,
    productUrl
  ) {

    if (
      !store ||
      !productUrl
    ) {

      return productUrl || "";

    }


    const config =
      AFFILIATE_CONFIG[
        String(store).toLowerCase()
      ];


    /*
     * اگر فروشگاه هنوز سیستم افیلیت نداشته باشد،
     * لینک مستقیم محصول برگردانده می‌شود.
     */

    if (
      !config ||
      !config.affiliateUrl
    ) {

      return productUrl;

    }


    /*
     * لینک واقعی محصول را Encode می‌کنیم
     * تا داخل پارامتر redirect_to
     * به‌درستی منتقل شود.
     */

    const encodedUrl =
      encodeURIComponent(
        productUrl
      );


    return config.affiliateUrl.replace(
      "{redirect_to}",
      encodedUrl
    );

  }


  /*
   * =======================================================
   * بررسی وجود فروشگاه
   * =======================================================
   */

  function hasAffiliate(
    store
  ) {

    if (!store) {
      return false;
    }

    return Boolean(
      AFFILIATE_CONFIG[
        String(store).toLowerCase()
      ]
    );

  }


  /*
   * =======================================================
   * دریافت تنظیمات فروشگاه
   * =======================================================
   */

  function getStoreConfig(
    store
  ) {

    if (!store) {
      return null;
    }

    return (
      AFFILIATE_CONFIG[
        String(store).toLowerCase()
      ] ||
      null
    );

  }


  /*
   * =======================================================
   * API عمومی DigiYar
   * =======================================================
   */

  window.DigiYarAffiliate = {

    version: "1.0.0",

    buildLink:
      buildAffiliateLink,

    hasAffiliate:
      hasAffiliate,

    getStoreConfig:
      getStoreConfig

  };


})();
