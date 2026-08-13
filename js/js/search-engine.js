/* DigiYar V3 - Search Engine */

(function () {
  "use strict";


  /*
   * Search Engine
   *
   * وظیفه این لایه:
   *
   * 1. دریافت عبارت جستجوی کاربر
   * 2. جستجو در Product Data Layer
   * 3. تحویل نتایج استاندارد
   *
   * فعلاً منبع داده داخلی است.
   *
   * در مراحل بعد می‌توانیم منابع واقعی
   * مثل API یا Search Provider را به آن وصل کنیم.
   */


  function normalizeQuery(query) {

    return String(
      query || ""
    )
      .trim()
      .toLowerCase();

  }


  function search(query) {

    const normalizedQuery =
      normalizeQuery(query);


    /*
     * اگر عبارت جستجو خالی باشد،
     * نتیجه‌ای برنمی‌گردانیم.
     */

    if (!normalizedQuery) {

      return [];

    }


    /*
     * بررسی وجود Product Data Layer
     */

    if (
      !window.DigiYarProductData ||
      typeof
        window.DigiYarProductData.search !==
        "function"
    ) {

      console.error(
        "DigiYarProductData is not available."
      );

      return [];

    }


    /*
     * دریافت نتایج از لایه داده
     */

    const results =
      window.DigiYarProductData
        .search(
          normalizedQuery
        );


    /*
     * استانداردسازی خروجی
     *
     * موتورهای بعدی دیجی‌یار
     * فقط با این ساختار کار می‌کنند.
     */

    return results.map(
      function (product) {

        return {

          id:
            product.id || "",

          name:
            product.name || "",

          category:
            product.category || "general",

          price:
            Number(
              product.price || 0
            ),

          store:
            product.store || "",

          productUrl:
            product.productUrl ||
            product.url ||
            "",

          image:
            product.image ||
            "",

          features:
            Array.isArray(
              product.features
            )
              ? product.features.slice()
              : []

        };

      }
    );

  }


  const DigiYarSearchEngine = {

    version: "1.0.0",

    search:
      search

  };


  window.DigiYarSearchEngine =
    DigiYarSearchEngine;


})();
