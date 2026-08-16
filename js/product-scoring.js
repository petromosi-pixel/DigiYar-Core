/* DigiYar V4 - Product Scoring Engine */

(function () {

  "use strict";


  /*
   * =========================================================
   * DigiYar Product Scoring Engine
   * Version 4.4.0
   * =========================================================
   *
   * API:
   *
   * score(product, need)
   *   → number
   *
   * scoreDetailed(product, need)
   *   → {
   *       score,
   *       reasons
   *     }
   *
   * =========================================================
   */


  /* =========================================================
     Text Normalization
     ========================================================= */

  function normalizeText(value) {

    return String(
      value || ""
    )
      .trim()
      .toLowerCase();

  }


  /* =========================================================
     Priorities
     ========================================================= */

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


  /* =========================================================
     Requirements
     ========================================================= */

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

        if (
          item &&
          typeof item === "object"
        ) {

          return (
            item.value ||
            ""
          );

        }


        return item || "";

      }
    );

  }


  /* =========================================================
     Constraints
     ========================================================= */

  function getConstraints(need) {

    if (
      !need ||
      !Array.isArray(
        need.constraints
      )
    ) {

      return [];

    }


    return need.constraints.map(
      function (item) {

        if (
          item &&
          typeof item === "object"
        ) {

          return (
            item.value ||
            ""
          );

        }


        return item || "";

      }
    );

  }


  /* =========================================================
     Feature Matching
     ========================================================= */

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
        product &&
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


        if (!featureText) {

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

  }


  /* =========================================================
     Detailed Score
     ========================================================= */

  function calculateDetailedScore(
    product,
    need
  ) {

    let score = 0;

    const reasons = [];


    if (
      !product ||
      !need
    ) {

      return {

        score: 0,

        reasons: []

      };

    }


    /* =======================================================
       1. Category
       ======================================================= */

    if (
      need.category &&
      product.category ===
      need.category
    ) {

      score += 30;

      reasons.push(
        "دسته‌بندی محصول با نیاز کاربر مطابقت دارد"
      );

    }


    /* =======================================================
       2. Budget
       ======================================================= */

    const maxBudget =
      Number(
        need.budget &&
        need.budget.max
      ) || 0;


    const minBudget =
      Number(
        need.budget &&
        need.budget.min
      ) || 0;


    const productPrice =
      Number(
        product.price
      ) || 0;


    /*
     * خارج از سقف بودجه:
     * محصول از پیشنهاد حذف می‌شود.
     */

    if (
      maxBudget > 0 &&
      productPrice > maxBudget
    ) {

      return {

        score: 0,

        reasons: [

          "قیمت محصول بالاتر از سقف بودجه است"

        ],

        excluded:
          true

      };

    }


    /*
     * داخل سقف بودجه
     */

    if (
      maxBudget > 0 &&
      productPrice <= maxBudget
    ) {

      reasons.push(
        "قیمت محصول در محدوده بودجه قرار دارد"
      );

    }


    /*
     * داخل بازه کامل بودجه
     */

    if (
      minBudget > 0 &&
      maxBudget > 0 &&
      productPrice >= minBudget &&
      productPrice <= maxBudget
    ) {

      reasons.push(
        "قیمت محصول در بازه بودجه تعیین‌شده قرار دارد"
      );

    }


    /* =======================================================
       3. Priorities
       ======================================================= */

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

          reasons.push(
            "ویژگی «" +
            priority +
            "» با اولویت کاربر مطابقت دارد"
          );

        }

      }
    );


    /* =======================================================
       4. Requirements
       ======================================================= */

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

          reasons.push(
            "نیازمندی «" +
            requirement +
            "» توسط محصول برآورده می‌شود"
          );

        }

      }
    );


    /* =======================================================
       5. Constraints
       ======================================================= */

    const constraints =
      getConstraints(
        need
      );


    constraints.forEach(
      function (constraint) {

        if (
          hasFeature(
            product,
            constraint
          )
        ) {

          score -= 10;

          reasons.push(
            "ویژگی «" +
            constraint +
            "» با محدودیت کاربر تعارض دارد"
          );

        }

      }
    );


    /* =======================================================
       6. Final Score
       ======================================================= */

    const finalScore =
      Math.max(
        0,
        Math.min(
          100,
          Math.round(
            score
          )
        )
      );


    return {

      score:
        finalScore,

      reasons:
        reasons,

      excluded:
        false

    };

  }


  /* =========================================================
     Legacy Score API
     =========================================================
     
     این API عمداً عدد برمی‌گرداند تا سازگاری
     با نسخه‌های قبلی حفظ شود.
     
     ========================================================= */

  function calculateScore(
    product,
    need
  ) {

    const result =
      calculateDetailedScore(
        product,
        need
      );


    return result.score;

  }


  /* =========================================================
     Product URL
     ========================================================= */

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
     * Affiliate Layer
     */

    if (
      typeof window !== "undefined" &&
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


    return productUrl;

  }


  /* =========================================================
     Prepare Product
     ========================================================= */

  function prepareProduct(
    product,
    need
  ) {

    const detailed =
      calculateDetailedScore(
        product,
        need
      );


    return {

      ...product,

      url:
        buildProductUrl(
          product
        ),

      score:
        detailed.score,

      reasons:
        detailed.reasons,

      excluded:
        detailed.excluded === true

    };

  }


  /* =========================================================
     API
     ========================================================= */

  const DigiYarProductScoring = {

    version:
      "4.4.0",


    /*
     * Legacy API
     */

    score:
      calculateScore,


    /*
     * New detailed API
     */

    scoreDetailed:
      calculateDetailedScore,


    /*
     * Prepare product
     */

    prepare:
      prepareProduct,


    /*
     * Recommendation helper
     */

    recommend:
      function (need) {

        if (!need) {

          return [];

        }


        /*
         * Product Data Dependency
         */

        if (
          typeof window === "undefined" ||
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


        const products =
          window.DigiYarProductData
            .getAll();


        /*
         * Category + Budget Filter
         */

        const filteredProducts =
          products.filter(
            function (product) {

              /*
               * Category
               */

              if (
                need.category &&
                need.category !==
                product.category
              ) {

                return false;

              }


              /*
               * Budget
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
         * Score + Prepare
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
                Number(
                  a.price || 0
                ) -
                Number(
                  b.price || 0
                )
              );

            }
          )

          .slice(
            0,
            3
          );

      }

  };


  /* =========================================================
     Browser Export
     ========================================================= */

  if (
    typeof window !== "undefined"
  ) {

    window.DigiYarProductScoring =
      DigiYarProductScoring;

  }


})();
