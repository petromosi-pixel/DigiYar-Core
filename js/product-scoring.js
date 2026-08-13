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
   * 2. بررسی دسته محصول
   * 3. اعمال سقف بودجه به عنوان محدودیت سخت
   * 4. امتیازدهی بر اساس اولویت‌ها
   * 5. امتیازدهی بر اساس نیازهای ضروری
   * 6. بررسی محدودیت‌ها
   * 7. ساخت لینک افیلیت
   *
   * =========================================================
   */


  /*
   * =========================================================
   * ابزار نرمال‌سازی متن
   * =========================================================
   */

  function normalizeText(value) {

    return String(
      value || ""
    )
      .trim()
      .toLowerCase();

  }


  /*
   * =========================================================
   * دریافت اولویت‌ها و نیازهای ضروری
   * =========================================================
   */

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
   * محاسبه امتیاز محصول
   * =========================================================
   */

  function calculateScore(
    product,
    need
  ) {

    if (
      !product ||
      !need
    ) {

      return 0;

    }


    let score = 0;


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
     *
     * بودجه در این نسخه «معیار برتری» نیست.
     *
     * فقط مشخص می‌کند محصول اجازه ورود
     * به لیست پیشنهادها را دارد یا خیر.
     *
     * فیلتر سخت بودجه در recommend()
     * انجام می‌شود.
     *
     * -------------------------------------------------------
     */


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
            Array.isArray(
              product.features
            )
              ? product.features
              : []
          )
          .some(
            function (feature) {

              const featureText =
                normalizeText(
                  feature
                );


              if (
                !featureText
              ) {

                return false;

              }


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
            Array.isArray(
              product.features
            )
              ? product.features
              : []
          )
          .some(
            function (feature) {

              return (
                normalizeText(
                  feature
                ) ===
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
     * 5. محدود کردن امتیاز
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
     * تبدیل لینک عادی به لینک افیلیت
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
     * اگر فروشگاه هنوز افیلیت نداشته باشد،
     * لینک مستقیم حفظ می‌شود.
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
      "4.3.0",


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
         * دریافت کل محصولات
         */

        const products =
          window.DigiYarProductData
            .getAll();


        /*
         * =================================================
         * فیلتر سخت
         * =================================================
         *
         * محصول خارج از دسته یا سقف بودجه
         * اصلاً وارد مرحله امتیازدهی نمی‌شود.
         */

        const filteredProducts =
          products.filter(
            function (product) {

              /*
               * تطابق دسته
               */

              if (
                need.category &&
                product.category !==
                need.category
              ) {

                return false;

              }


              /*
               * سقف بودجه
               */

              const maxBudget =
                Number(
                  need.budget &&
                  need.budget.max
                ) || 0;


              if (
                maxBudget > 0 &&
                Number(
                  product.price || 0
                ) > maxBudget
              ) {

                return false;

              }


              return true;

            }
          );


        /*
         * =================================================
         * امتیازدهی
         * =================================================
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
           * =================================================
           * مرتب‌سازی
           * =================================================
           *
           * اول:
           * امتیاز بیشتر
           *
           * دوم:
           * قیمت کمتر
           *
           * سوم:
           * ID محصول برای جلوگیری از ترتیب تصادفی
           *
           * =================================================
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


              const priceDifference =
                Number(
                  a.price || 0
                ) -
                Number(
                  b.price || 0
                );


              if (
                priceDifference !== 0
              ) {

                return priceDifference;

              }


              return String(
                a.id || ""
              ).localeCompare(
                String(
                  b.id || ""
                )
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
   * =========================================================
   * انتشار موتور
   * =========================================================
   */

  window.DigiYarProductScoring =
    DigiYarProductScoring;


})();
