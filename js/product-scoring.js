/* DigiYar V3 - Product Scoring Engine */

(function () {
  "use strict";


  /*
   * =========================================================
   * DigiYar Product Scoring Engine
   * =========================================================
   *
   * وظایف:
   *
   * 1. دریافت محصولات از Product Data Layer
   * 2. محاسبه میزان تناسب محصول با نیاز کاربر
   * 3. بررسی بودجه
   * 4. بررسی اولویت‌ها
   * 5. بررسی نیازهای ضروری
   * 6. بررسی محدودیت‌ها
   * 7. ساخت لینک افیلیت
   *
   * =========================================================
   */


  /*
   * =========================================================
   * ابزارها
   * =========================================================
   */

  function normalizeText(value) {

    return String(
      value || ""
    )
      .trim()
      .toLowerCase();

  }


  function getWantedItems(need) {

    if (!need) {

      return [];

    }


    const priorities =
      Array.isArray(
        need.priorities
      )
        ? need.priorities
        : [];


    const requirements =
      Array.isArray(
        need.requirements
      )
        ? need.requirements
            .map(
              function (item) {

                return (
                  item &&
                  item.value
                ) || "";

              }
            )
        : [];


    return [
      ...priorities,
      ...requirements
    ];

  }


  /*
   * =========================================================
   * محاسبه امتیاز
   * =========================================================
   */

  function calculateScore(
    product,
    need
  ) {

    let score = 0;


    if (!product || !need) {

      return 0;

    }


    /*
     * -------------------------------------------------------
     * 1. تطابق دسته
     * -------------------------------------------------------
     */

    if (
      need.category &&
      product.category ===
      need.category
    ) {

      score += 30;

    }


    /*
     * -------------------------------------------------------
     * 2. بودجه
     * -------------------------------------------------------
     */

    const maxBudget =
      Number(
        need.budget &&
        need.budget.max
      ) || 0;


    if (maxBudget > 0) {

      const productPrice =
        Number(
          product.price
        ) || 0;


      if (
        productPrice <=
        maxBudget
      ) {

        /*
         * محصول داخل بودجه است.
         *
         * هرچه قیمت محصول نسبت به سقف بودجه
         * منطقی‌تر باشد، امتیاز بیشتری می‌گیرد.
         *
         * اما محصول صرفاً به خاطر گران‌تر بودن
         * برنده نمی‌شود.
         */

        const budgetUsage =
          productPrice /
          maxBudget;


        if (
          budgetUsage >= 0.80
        ) {

          score += 30;

        } else if (
          budgetUsage >= 0.60
        ) {

          score += 27;

        } else if (
          budgetUsage >= 0.40
        ) {

          score += 24;

        } else if (
          budgetUsage >= 0.20
        ) {

          score += 21;

        } else {

          score += 18;

        }

      } else {

        /*
         * محصول خارج از سقف بودجه
         */

        score -= 30;

      }

    }


    /*
     * -------------------------------------------------------
     * 3. اولویت‌ها و نیازهای ضروری
     * -------------------------------------------------------
     */

    const wanted =
      getWantedItems(
        need
      );


    wanted.forEach(
      function (wantedItem) {

        const wantedText =
          normalizeText(
            wantedItem
          );


        if (!wantedText) {

          return;

        }


        const matched =
          (
            product.features || []
          ).some(
            function (feature) {

              const featureText =
                normalizeText(
                  feature
                );


              return (

                featureText.includes(
                  wantedText
                ) ||

                wantedText.includes(
                  featureText
                )

              );

            }
          );


        if (matched) {

          score += 8;

        }

      }
    );


    /*
     * -------------------------------------------------------
     * 4. محدودیت‌ها
     * -------------------------------------------------------
     */

    const constraints =
      Array.isArray(
        need.constraints
      )
        ? need.constraints
        : [];


    constraints.forEach(
      function (constraint) {

        const value =
          normalizeText(
            constraint &&
            constraint.value
          );


        if (!value) {

          return;

        }


        const conflict =
          (
            product.features || []
          ).some(
            function (feature) {

              const featureText =
                normalizeText(
                  feature
                );


              return (
                featureText ===
                value
              );

            }
          );


        if (conflict) {

          score -= 10;

        }

      }
    );


    /*
     * -------------------------------------------------------
     * 5. محدود کردن بازه امتیاز
     * -------------------------------------------------------
     */

    return Math.max(
      0,
      Math.min(
        100,
        Math.round(score)
      )
    );

  }


  /*
   * =========================================================
   * ساخت لینک محصول
   * =========================================================
   */

  function buildProductUrl(
    product
  ) {

    if (!product) {

      return "";

    }


    const productUrl =
      product.productUrl ||
      product.url ||
      "";


    if (!productUrl) {

      return "";

    }


    /*
     * اگر Affiliate Manager وجود داشته باشد،
     * لینک محصول را به لینک افیلیت تبدیل می‌کنیم.
     */

    if (
      window.DigiYarAffiliate &&
      typeof
        window.DigiYarAffiliate.buildLink ===
        "function"
    ) {

      const affiliateUrl =
        window.DigiYarAffiliate.buildLink(
          product.store,
          productUrl
        );


      if (affiliateUrl) {

        return affiliateUrl;

      }

    }


    /*
     * اگر افیلیت برای فروشگاه وجود نداشت،
     * لینک مستقیم محصول حفظ می‌شود.
     */

    return productUrl;

  }


  /*
   * =========================================================
   * آماده‌سازی محصول
   * =========================================================
   */

  function prepareProduct(
    product,
    need
  ) {

    return {

      ...product,

      url:
        buildProductUrl(
          product
        ),

      score:
        calculateScore(
          product,
          need
        )

    };

  }


  /*
   * =========================================================
   * API اصلی
   * =========================================================
   */

  const DigiYarProductScoring = {

    version:
      "4.1.0",


    score:
      calculateScore,


    prepare:
      prepareProduct,


    recommend:
      function (need) {

        if (!need) {

          return [];

        }


        /*
         * بررسی Product Data Layer
         */

        if (
          !window.DigiYarProductData ||
          typeof
            window.DigiYarProductData.getAll !==
            "function"
        ) {

          console.error(
            "DigiYarProductData is not available."
          );

          return [];

        }


        /*
         * دریافت کل کاتالوگ
         */

        const products =
          window.DigiYarProductData
            .getAll();


        /*
         * فیلتر دسته
         */

        const filteredProducts =
  products.filter(
    function (product) {

      /*
       * تطابق دسته
       */

      if (
        need.category &&
        need.category !==
        product.category
      ) {

        return false;

      }


      /*
       * اگر سقف بودجه مشخص شده،
       * محصول گران‌تر اصلاً پیشنهاد نشود.
       */

      const maxBudget =
        Number(
          need.budget &&
          need.budget.max
        ) || 0;


      if (
        maxBudget > 0 &&
        Number(product.price || 0) >
        maxBudget
      ) {

        return false;

      }


      return true;

    }
  );

        /*
         * امتیازدهی
         */

        return filteredProducts

          .map(
            function (product) {

              return prepareProduct(
                product,
                need
              );

            }
          )


          /*
           * مرتب‌سازی:
           *
           * 1. امتیاز بالاتر
           * 2. اگر امتیاز برابر بود،
           *    محصول ارزان‌تر
           */

          .sort(
            function (a, b) {

              if (
                b.score !==
                a.score
              ) {

                return (
                  b.score -
                  a.score
                );

              }


              return (
                Number(a.price || 0) -
                Number(b.price || 0)
              );

            }
          )

          /*
           * فعلاً حداکثر ۳ پیشنهاد
           */

          .slice(
            0,
            3
          );

      }

  };


  /*
   * انتشار موتور
   */

  window.DigiYarProductScoring =
    DigiYarProductScoring;


})();
