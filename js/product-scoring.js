/* DigiYar V3 - Product Scoring Engine */

(function () {
  "use strict";


  /*
   * =========================================================
   * DigiYar Product Scoring Engine
   * Version 4.3.0
   * =========================================================
   *
   * امتیازدهی:
   *
   * Category       = +30
   * Priority       = +8
   * Requirement    = +15
   * Constraint     = -10
   *
   * محصول خارج از سقف بودجه:
   * حذف کامل از پیشنهادها
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
   * استخراج Priority ها
   * =========================================================
   */

  function getPriorities(need) {

    if (
      !need ||
      !Array.isArray(
        need.priorities
      )
    ) {

      return [];

    }


    return need.priorities;

  }


  /*
   * =========================================================
   * استخراج Requirement ها
   * =========================================================
   */

  function getRequirements(need) {

    if (
      !need ||
      !Array.isArray(
        need.requirements
      )
    ) {

      return [];

    }


    return need.requirements.map(
      function (item) {

        return (
          item &&
          item.value
        ) || "";

      }
    );

  }


  /*
   * =========================================================
   * بررسی تطابق ویژگی
   * =========================================================
   */

  function hasFeature(
    product,
    wantedItem
  ) {

    const wantedText =
      normalizeText(
        wantedItem
      );


    if (!wantedText) {

      return false;

    }


    const features =
      Array.isArray(
        product.features
      )
        ? product.features
        : [];


    return features.some(
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


    if (
      !product ||
      !need
    ) {

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
     *
     * محصول خارج از سقف بودجه
     * اصلاً امتیاز نمی‌گیرد.
     *
     * recommend() نیز این محصولات
     * را قبل از امتیازدهی حذف می‌کند.
     * -------------------------------------------------------
     */

    const maxBudget =
      Number(
        need.budget &&
        need.budget.max
      ) || 0;


    const productPrice =
      Number(
        product.price
      ) || 0;


    if (
      maxBudget > 0 &&
      productPrice > maxBudget
    ) {

      return 0;

    }


    /*
     * -------------------------------------------------------
     * 3. Priority
     * -------------------------------------------------------
     *
     * هر Priority منطبق:
     * +8
     * -------------------------------------------------------
     */

    const priorities =
      getPriorities(
        need
      );


    priorities.forEach(
      function (priority) {

        if (
          hasFeature(
            product,
            priority
          )
        ) {

          score += 8;

        }

      }
    );


    /*
     * -------------------------------------------------------
     * 4. Requirement
     * -------------------------------------------------------
     *
     * هر Requirement منطبق:
     * +15
     *
     * Requirement عمداً وزن بیشتری
     * از Priority دارد.
     * -------------------------------------------------------
     */

    const requirements =
      getRequirements(
        need
      );


    requirements.forEach(
      function (requirement) {

        if (
          hasFeature(
            product,
            requirement
          )
        ) {

          score += 15;

        }

      }
    );


    /*
     * -------------------------------------------------------
     * 5. Constraint
     * -------------------------------------------------------
     *
     * اگر ویژگی محصول با یک Constraint
     * تعارض داشته باشد:
     *
     * -10
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
     * 6. محدود کردن امتیاز
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
     * تبدیل به لینک افیلیت
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
     * اگر افیلیت موجود نبود،
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
         * دریافت محصولات
         */

        const products =
          window.DigiYarProductData
            .getAll();


        /*
         * ---------------------------------------------------
         * فیلتر دسته و بودجه
         * ---------------------------------------------------
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
         * ---------------------------------------------------
         * امتیازدهی و مرتب‌سازی
         * ---------------------------------------------------
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


          .sort(
            function (a, b) {

              /*
               * اول امتیاز بالاتر
               */

              if (
                b.score !==
                a.score
              ) {

                return (
                  b.score -
                  a.score
                );

              }


              /*
               * در امتیاز برابر:
               * محصول ارزان‌تر بالاتر
               */

              return (
                Number(
                  a.price || 0
                ) -
                Number(
                  b.price || 0
                )
              );

            }
          )


          /*
           * حداکثر ۳ پیشنهاد
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
