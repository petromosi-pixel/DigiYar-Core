/**
 * =========================================================
 * DigiYar V4
 * Smart Recommendation Engine
 * Build 9 — Alpha 1
 * =========================================================
 *
 * وظیفه:
 *
 * Need
 *   ↓
 * Retrieved Products
 *   ↓
 * Product Scoring
 *   ↓
 * Ranking
 *   ↓
 * Recommendations
 *
 * این Engine:
 * - Need را تغییر نمی‌دهد
 * - Product Retrieval را تغییر نمی‌دهد
 * - Product Scoring موجود را جایگزین نمی‌کند
 * - فقط لایه هوشمند انتخاب و رتبه‌بندی را اضافه می‌کند
 *
 * =========================================================
 */

(function () {

  "use strict";


  /* =======================================================
     Configuration
     ======================================================= */

  const VERSION = "4.0.0-alpha.1";

  const DEFAULT_LIMIT = 3;

  const MAX_PRODUCTS = 50;


  /* =======================================================
     Dependency Check
     ======================================================= */

  function dependenciesReady() {

    return (
      typeof DigiyarProductScoring !== "undefined"
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

    if (!need || typeof need !== "object") {
      return null;
    }

    try {

      return JSON.parse(
        JSON.stringify(need)
      );

    } catch (error) {

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
     Product Scoring Adapter
     ======================================================= */

  function scoreProduct(product, need) {

    /*
     * Product Scoring Engine نسخه‌های مختلفی
     * ممکن است API متفاوت داشته باشند.
     *
     * بنابراین چند API رایج را پشتیبانی می‌کنیم.
     */

    if (
      typeof DigiyarProductScoring === "undefined"
    ) {

      return {
        score: 0,
        reasons: [],
        raw: null
      };

    }


    try {

      if (
        typeof DigiyarProductScoring.scoreProduct ===
        "function"
      ) {

        const result =
          DigiyarProductScoring.scoreProduct(
            product,
            need
          );

        return normalizeScoreResult(result);

      }


      if (
        typeof DigiyarProductScoring.score ===
        "function"
      ) {

        const result =
          DigiyarProductScoring.score(
            product,
            need
          );

        return normalizeScoreResult(result);

      }


      if (
        typeof DigiyarProductScoring.calculateScore ===
        "function"
      ) {

        const result =
          DigiyarProductScoring.calculateScore(
            product,
            need
          );

        return normalizeScoreResult(result);

      }


      return {
        score: 0,
        reasons: [],
        raw: null
      };

    }

    catch (error) {

      return {
        score: 0,
        reasons: [],
        raw: null,
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

        reasons: [],

        raw:
          result

      };

    }


    if (
      !result ||
      typeof result !== "object"
    ) {

      return {
        score: 0,
        reasons: [],
        raw: result
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
      Array.isArray(result.reasons)
    ) {

      reasons =
        result.reasons.slice();

    }

    else if (
      Array.isArray(result.explanations)
    ) {

      reasons =
        result.explanations.slice();

    }


    return {

      score:
        score,

      reasons:
        reasons,

      raw:
        result

    };

  }


  /* =======================================================
     Fallback Intelligent Signals
     ======================================================= */

  function calculateBasicSignals(
    product,
    need
  ) {

    const signals = [];

    let bonus = 0;


    /*
     * Category Match
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
     * Budget Match
     */

    const price =
      safeNumber(product.price);


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
     * Usage / Feature Signals
     */

    const productText =
      JSON.stringify(product)
        .toLowerCase();


    if (
      Array.isArray(need.usage)
    ) {

      need.usage.forEach(
        function (usage) {

          const normalized =
            String(usage)
              .toLowerCase();

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
      normalizeProducts(products);


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
     * Stable ranking:
     * اگر امتیاز برابر بود ترتیب اصلی حفظ می‌شود.
     */

    scored.sort(
      function (a, b) {

        if (
          b.score !== a.score
        ) {

          return b.score - a.score;

        }


        return (
          a.originalIndex -
          b.originalIndex
        );

      }
    );


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

          return {

            rank:
              item.rank,

            score:
              item.score,

            product:
              item.product,

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
    products,
    options
  ) {

    const settings =
      options || {};


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
          "waiting_for_need",

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
     * Product Guard
     */

    const normalizedProducts =
      normalizeProducts(
        products
      );


    if (
      normalizedProducts.length === 0
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
        settings.limit ||
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
    recommendation
  ) {

    if (
      !recommendation
    ) {

      return "";

    }


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


    return (
      "این محصول بر اساس امتیاز تطبیق با نیاز کاربر رتبه‌بندی شده است."
    );

  }


  /* =======================================================
     Public API
     ======================================================= */

  const DigiyarSmartRecommendationEngine = {

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

    window.DigiyarSmartRecommendationEngine =
      DigiyarSmartRecommendationEngine;

  }


})();
