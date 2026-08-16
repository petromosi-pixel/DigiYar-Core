/**
 * =========================================================
 * DigiYar V4
 * Smart Recommendation Engine
 * Build 9 — Alpha 2
 * =========================================================
 *
 * وظیفه:
 *
 * Need
 *   ↓
 * Product Data
 *   ↓
 * Product Scoring
 *   ↓
 * Smart Ranking
 *   ↓
 * Recommendations
 *
 * =========================================================
 */

(function () {

  "use strict";


  /* =======================================================
     Configuration
     ======================================================= */

  const VERSION = "4.0.0-alpha.2";

  const DEFAULT_LIMIT = 3;

  const MAX_PRODUCTS = 50;


  /* =======================================================
     Dependency Check
     ======================================================= */

  function dependenciesReady() {

    return (
      typeof window !== "undefined" &&
      typeof window.DigiYarProductScoring !== "undefined"
    );

  }


  /* =======================================================
     Helpers
     ======================================================= */

  function safeNumber(value) {

    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : 0;

  }


  function cloneNeed(need) {

    if (
      !need ||
      typeof need !== "object"
    ) {

      return null;

    }


    try {

      return JSON.parse(
        JSON.stringify(need)
      );

    }

    catch (error) {

      return need;

    }

  }


  function normalizeProducts(products) {

    if (!Array.isArray(products)) {

      return [];

    }


    return products
      .slice(0, MAX_PRODUCTS)
      .filter(function (product) {

        return (
          product &&
          typeof product === "object"
        );

      });

  }


  /* =======================================================
     Need Validation
     ======================================================= */

  function isNeedReady(need) {

    return (
      !!need &&
      need.ready === true &&
      !!need.category
    );

  }


  /* =======================================================
     Product Source
     ======================================================= */

  function getProducts(products) {

    /*
     * اگر محصولات مستقیماً ارسال شده باشند،
     * همان‌ها استفاده می‌شوند.
     */

    if (
      Array.isArray(products)
    ) {

      return normalizeProducts(
        products
      );

    }


    /*
     * در حالت عادی:
     *
     * Smart Recommendation
     * مستقیماً از Product Data
     * محصولات را دریافت می‌کند.
     */

    if (
      typeof window !== "undefined" &&
      window.DigiYarProductData &&
      typeof window.DigiYarProductData.getAll ===
        "function"
    ) {

      return normalizeProducts(
        window.DigiYarProductData.getAll()
      );

    }


    return [];

  }


  /* =======================================================
     Product Scoring
     ======================================================= */

  function scoreProduct(
    product,
    need
  ) {

    if (
      !dependenciesReady()
    ) {

      return {
        score: 0,
        reasons: []
      };

    }


    try {

      const scoring =
        window.DigiYarProductScoring;


      /*
       * API اصلی فعلی Product Scoring
       */

      if (
        typeof scoring.score ===
        "function"
      ) {

        const score =
          scoring.score(
            product,
            need
          );


        return {

          score:
            safeNumber(score),

          reasons:
            []

        };

      }


      /*
       * پشتیبانی از APIهای احتمالی آینده
       */

      if (
        typeof scoring.scoreProduct ===
        "function"
      ) {

        const result =
          scoring.scoreProduct(
            product,
            need
          );


        return normalizeScoreResult(
          result
        );

      }


      if (
        typeof scoring.calculateScore ===
        "function"
      ) {

        const result =
          scoring.calculateScore(
            product,
            need
          );


        return normalizeScoreResult(
          result
        );

      }


      return {

        score: 0,

        reasons: []

      };

    }

    catch (error) {

      return {

        score: 0,

        reasons: [],

        error:
          error.message ||
          String(error)

      };

    }

  }


  /* =======================================================
     Normalize Score Result
     ======================================================= */

  function normalizeScoreResult(result) {

    if (
      typeof result === "number"
    ) {

      return {

        score:
          safeNumber(result),

        reasons:
          []

      };

    }


    if (
      !result ||
      typeof result !== "object"
    ) {

      return {

        score: 0,

        reasons: []

      };

    }


    const score =
      safeNumber(
        result.score ??
        result.totalScore ??
        result.finalScore ??
        result.value
      );


    let reasons = [];


    if (
      Array.isArray(
        result.reasons
      )
    ) {

      reasons =
        result.reasons.slice();

    }

    else if (
      Array.isArray(
        result.explanations
      )
    ) {

      reasons =
        result.explanations.slice();

    }


    return {

      score:
        score,

      reasons:
        reasons

    };

  }


  /* =======================================================
     Intelligent Signals
     ======================================================= */

  function calculateBasicSignals(
    product,
    need
  ) {

    const signals = [];

    let bonus = 0;


    /*
     * Category
     */

    if (
      product.category &&
      need.category &&
      String(product.category)
        .toLowerCase() ===
      String(need.category)
        .toLowerCase()
    ) {

      bonus += 10;

      signals.push(
        "دسته‌بندی محصول با نیاز کاربر مطابقت دارد"
      );

    }


    /*
     * Budget
     */

    const price =
      safeNumber(
        product.price
      );


    if (
      price > 0 &&
      need.budget
    ) {

      const max =
        safeNumber(
          need.budget.max
        );


      const min =
        safeNumber(
          need.budget.min
        );


      if (
        max > 0 &&
        price <= max
      ) {

        bonus += 15;

        signals.push(
          "قیمت محصول در محدوده بودجه قرار دارد"
        );

      }


      if (
        min > 0 &&
        price >= min
      ) {

        bonus += 5;

      }

    }


    /*
     * Usage
     */

    const productText =
      JSON.stringify(
        product
      ).toLowerCase();


    if (
      Array.isArray(
        need.usage
      )
    ) {

      need.usage.forEach(
        function (usage) {

          const normalized =
            String(
              usage || ""
            ).toLowerCase();


          if (
            normalized &&
            productText.includes(
              normalized
            )
          ) {

            bonus += 10;

            signals.push(
              "ویژگی‌های محصول با کاربرد موردنظر کاربر همخوانی دارد"
            );

          }

        }
      );

    }


    return {

      bonus:
        bonus,

      reasons:
        signals

    };

  }


  /* =======================================================
     Rank Products
     ======================================================= */

  function rankProducts(
    products,
    need
  ) {

    const normalizedProducts =
      normalizeProducts(
        products
      );


    const scored =
      normalizedProducts.map(
        function (
          product,
          index
        ) {

          const scoring =
            scoreProduct(
              product,
              need
            );


          const fallback =
            calculateBasicSignals(
              product,
              need
            );


          /*
           * Product Scoring مرجع اصلی است.
           *
           * اگر امتیاز معتبر داشت:
           * همان امتیاز استفاده می‌شود.
           *
           * در غیر این صورت:
           * fallback فعال می‌شود.
           */

          const finalScore =
            scoring.score > 0
              ? scoring.score
              : fallback.bonus;


          const reasons = [
            ...scoring.reasons,
            ...fallback.reasons
          ];


          return {

            product:
              product,

            score:
              finalScore,

            rank:
              0,

            reasons:
              reasons,

            originalIndex:
              index

          };

        }
      );


    /*
     * Ranking
     */

    scored.sort(
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


        /*
         * در امتیاز برابر:
         * محصول ارزان‌تر بالاتر
         */

        const priceA =
          safeNumber(
            a.product.price
          );


        const priceB =
          safeNumber(
            b.product.price
          );


        if (
          priceA !== priceB
        ) {

          return (
            priceA -
            priceB
          );

        }


        /*
         * در نهایت ترتیب اصلی
         */

        return (
          a.originalIndex -
          b.originalIndex
        );

      }
    );


    /*
     * Rank Number
     */

    scored.forEach(
      function (
        item,
        index
      ) {

        item.rank =
          index + 1;

      }
    );


    return scored;

  }


  /* =======================================================
     Build Recommendations
     ======================================================= */

  function buildRecommendations(
    rankedProducts,
    limit
  ) {

    const safeLimit =
      Math.max(
        1,
        safeNumber(
          limit || DEFAULT_LIMIT
        )
      );


    return rankedProducts
      .slice(
        0,
        safeLimit
      )
      .map(
        function (item) {

          /*
           * محصول مستقیماً در خروجی قرار می‌گیرد
           * تا API ساده و قابل استفاده باشد.
           */

          return {

            ...item.product,

            rank:
              item.rank,

            score:
              item.score,

            reasons:
              item.reasons

          };

        }
      );

  }


  /* =======================================================
     Main Recommendation
     ======================================================= */

  function recommend(
    need,
    productsOrOptions,
    maybeOptions
  ) {

    /*
     * تشخیص نوع آرگومان دوم
     *
     * recommend(need)
     * recommend(need, products)
     * recommend(need, options)
     * recommend(need, products, options)
     */

    let products = null;

    let options = {};


    if (
      Array.isArray(
        productsOrOptions
      )
    ) {

      products =
        productsOrOptions;

      options =
        maybeOptions || {};

    }

    else if (
      productsOrOptions &&
      typeof productsOrOptions ===
        "object"
    ) {

      options =
        productsOrOptions;

    }


    /*
     * Dependency Guard
     */

    if (
      !dependenciesReady()
    ) {

      return {

        version:
          VERSION,

        status:
          "error",

        need:
          cloneNeed(need),

        products:
          [],

        rankedProducts:
          [],

        recommendations:
          [],

        count:
          0,

        error:
          "Product Scoring Engine is not available."

      };

    }


    /*
     * Need Guard
     */

    if (
      !isNeedReady(need)
    ) {

      return {

        version:
          VERSION,

        status:
          "waiting_for_answer",

        need:
          cloneNeed(need),

        products:
          [],

        rankedProducts:
          [],

        recommendations:
          [],

        count:
          0,

        error:
          null

      };

    }


    /*
     * Product Source
     */

    const normalizedProducts =
      getProducts(
        products
      );


    /*
     * Product Guard
     */

    if (
      normalizedProducts.length ===
      0
    ) {

      return {

        version:
          VERSION,

        status:
          "no_products",

        need:
          cloneNeed(need),

        products:
          [],

        rankedProducts:
          [],

        recommendations:
          [],

        count:
          0,

        error:
          null

      };

    }


    /*
     * Ranking
     */

    const rankedProducts =
      rankProducts(
        normalizedProducts,
        need
      );


    /*
     * Recommendations
     */

    const recommendations =
      buildRecommendations(
        rankedProducts,
        options.limit ||
        DEFAULT_LIMIT
      );


    return {

      version:
        VERSION,

      status:
        "recommendations_ready",

      need:
        cloneNeed(need),

      products:
        normalizedProducts,

      rankedProducts:
        rankedProducts,

      recommendations:
        recommendations,

      count:
        recommendations.length,

      totalProducts:
        normalizedProducts.length,

      error:
        null

    };

  }


  /* =======================================================
     Explain Recommendation
     ======================================================= */

  function explain(
    recommendation,
    need
  ) {

    if (
      !recommendation
    ) {

      return "";

    }


    /*
     * حالت استاندارد:
     *
     * explain(recommendation)
     */

    if (
      Array.isArray(
        recommendation.reasons
      ) &&
      recommendation.reasons.length
    ) {

      return recommendation.reasons.join(
        "؛ "
      );

    }


    /*
     * حالت مستقیم:
     *
     * explain(product, need)
     *
     * برای تست و استفاده‌های آینده
     */

    if (
      need &&
      recommendation
    ) {

      const signals =
        calculateBasicSignals(
          recommendation,
          need
        );


      if (
        signals.reasons.length
      ) {

        return signals.reasons.join(
          "؛ "
        );

      }

    }


    return (
      "این محصول بر اساس امتیاز تطبیق با نیاز کاربر رتبه‌بندی شده است."
    );

  }


  /* =======================================================
     Public API
     ======================================================= */

  const DigiyarSmartRecommendation = {

    version:
      VERSION,

    dependenciesReady:
      dependenciesReady,

    isNeedReady:
      isNeedReady,

    rankProducts:
      rankProducts,

    recommend:
      recommend,

    explain:
      explain

  };


  /* =======================================================
     Browser Export
     ======================================================= */

  if (
    typeof window !== "undefined"
  ) {

    /*
     * نام مورد انتظار Test
     */

    window.DigiyarSmartRecommendation =
      DigiyarSmartRecommendation;


    /*
     * نام کامل‌تر برای استفاده آینده
     */

    window.DigiyarSmartRecommendationEngine =
      DigiyarSmartRecommendation;

  }


})();
