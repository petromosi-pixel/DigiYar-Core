/**
 * =========================================================
 * DigiYar V4
 * Smart Recommendation Engine
 * Build 10 — Alpha 3
 * =========================================================
 *
 * Need
 *   ↓
 * Product Data
 *   ↓
 * Product Scoring
 *   ↓
 * Smart Signals
 *   ↓
 * Ranking
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

  const VERSION = "4.0.0-alpha.3";

  const DEFAULT_LIMIT = 3;

  const MAX_PRODUCTS = 50;


  /* =======================================================
     Dependency Check
     ======================================================= */

  function dependenciesReady() {

    return (
      typeof window !== "undefined" &&
      !!window.DigiYarProductScoring
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


  function normalizeText(value) {

    return String(
      value ?? ""
    )
      .trim()
      .toLowerCase();

  }


  function toArray(value) {

    if (Array.isArray(value)) {

      return value
        .filter(Boolean);

    }


    if (
      typeof value === "string" &&
      value.trim()
    ) {

      return value
        .split(/[،,]/)
        .map(function (item) {

          return item.trim();

        })
        .filter(Boolean);

    }


    return [];

  }


  function getNeedUsage(need) {

    if (!need) {

      return [];

    }


    /*
     * ساختار اصلی V4
     */

    if (
      need.context &&
      need.context.usage
    ) {

      return toArray(
        need.context.usage
      );

    }


    /*
     * سازگاری با ساختارهای قبلی
     */

    if (need.usage) {

      return toArray(
        need.usage
      );

    }


    if (
      need.declared &&
      need.declared.usage
    ) {

      return toArray(
        need.declared.usage
      );

    }


    return [];

  }


  function getNeedPriorities(need) {

    if (!need) {

      return [];

    }


    return toArray(
      need.priorities ||
      (
        need.declared &&
        need.declared.priorities
      )
    );

  }


  function getNeedRequirements(need) {

    if (!need) {

      return [];

    }


    return toArray(
      need.requirements ||
      (
        need.declared &&
        need.declared.requirements
      )
    );

  }


  function getNeedConstraints(need) {

    if (!need) {

      return [];

    }


    return toArray(
      need.constraints ||
      (
        need.declared &&
        need.declared.constraints
      )
    );

  }


  /* =======================================================
     Need Validation
     ======================================================= */

  function isNeedReady(need) {

    return (
      !!need &&
      (
        need.ready === true ||
        safeNumber(
          need.completeness
        ) > 0
      ) &&
      !!need.category
    );

  }


  /* =======================================================
     Product Source
     ======================================================= */

  function getProducts(products) {

    /*
     * محصولات ارسال‌شده مستقیم
     */

    if (
      Array.isArray(products)
    ) {

      return normalizeProducts(
        products
      );

    }


    /*
     * Product Data
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
     Score Result Normalizer
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
        result.reasons
          .filter(Boolean)
          .slice();

    }

    else if (
      Array.isArray(
        result.explanations
      )
    ) {

      reasons =
        result.explanations
          .filter(Boolean)
          .slice();

    }


    return {

      score:
        score,

      reasons:
        reasons

    };

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
       * API اصلی
       */

      if (
        typeof scoring.score ===
        "function"
      ) {

        return normalizeScoreResult(
          scoring.score(
            product,
            need
          )
        );

      }


      /*
       * APIهای سازگار
       */

      if (
        typeof scoring.scoreProduct ===
        "function"
      ) {

        return normalizeScoreResult(
          scoring.scoreProduct(
            product,
            need
          )
        );

      }


      if (
        typeof scoring.calculateScore ===
        "function"
      ) {

        return normalizeScoreResult(
          scoring.calculateScore(
            product,
            need
          )
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
     Intelligent Signals
     ======================================================= */

  function calculateBasicSignals(
    product,
    need
  ) {

    const signals = [];

    let bonus = 0;


    /* -----------------------------------------------------
       Category
       ----------------------------------------------------- */

    if (
      product.category &&
      need.category
    ) {

      const productCategory =
        normalizeText(
          product.category
        );


      const needCategory =
        normalizeText(
          need.category
        );


      if (
        productCategory ===
        needCategory
      ) {

        bonus += 10;

        signals.push(
          "دسته‌بندی محصول با نیاز کاربر مطابقت دارد"
        );

      }

    }


    /* -----------------------------------------------------
       Budget
       ----------------------------------------------------- */

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


      /*
       * اگر حداقل بودجه تعریف شده باشد
       */

      if (
        min > 0 &&
        price >= min
      ) {

        bonus += 5;

      }


      /*
       * محصول گران‌تر از سقف بودجه
       */

      if (
        max > 0 &&
        price > max
      ) {

        bonus -= 15;

        signals.push(
          "قیمت محصول از سقف بودجه بیشتر است"
        );

      }

    }


    /* -----------------------------------------------------
       Usage
       ----------------------------------------------------- */

    const usage =
      getNeedUsage(
        need
      );


    const productText =
      JSON.stringify(
        product
      ).toLowerCase();


    usage.forEach(
      function (item) {

        const normalized =
          normalizeText(
            item
          );


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


    /* -----------------------------------------------------
       Priorities
       ----------------------------------------------------- */

    const priorities =
      getNeedPriorities(
        need
      );


    priorities.forEach(
      function (priority) {

        const normalized =
          normalizeText(
            priority
          );


        if (
          normalized &&
          productText.includes(
            normalized
          )
        ) {

          bonus += 7;

          signals.push(
            "یکی از اولویت‌های کاربر در محصول دیده می‌شود"
          );

        }

      }
    );


    /* -----------------------------------------------------
       Requirements
       ----------------------------------------------------- */

    const requirements =
      getNeedRequirements(
        need
      );


    requirements.forEach(
      function (requirement) {

        const normalized =
          normalizeText(
            requirement
          );


        if (
          normalized &&
          productText.includes(
            normalized
          )
        ) {

          bonus += 8;

          signals.push(
            "یکی از نیازهای ضروری کاربر با محصول مطابقت دارد"
          );

        }

      }
    );


    /* -----------------------------------------------------
       Constraints
       ----------------------------------------------------- */

    const constraints =
      getNeedConstraints(
        need
      );


    constraints.forEach(
      function (constraint) {

        const normalized =
          normalizeText(
            constraint
          );


        /*
         * اگر محدودیت مستقیماً در محصول
         * دیده شود، فعلاً امتیاز منفی نمی‌دهیم.
         *
         * این بخش در نسخه‌های بعدی می‌تواند
         * به Constraint Engine مستقل متصل شود.
         */

        if (
          normalized &&
          productText.includes(
            normalized
          )
        ) {

          signals.push(
            "محدودیت ثبت‌شده در اطلاعات محصول بررسی شد"
          );

        }

      }
    );


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
           * Product Scoring موتور اصلی است.
           *
           * fallback فقط زمانی وارد می‌شود
           * که Product Scoring امتیاز معتبری
           * تولید نکرده باشد.
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


    /* -----------------------------------------------------
       Sort
       ----------------------------------------------------- */

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
         * امتیاز برابر:
         * محصول ارزان‌تر اول
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


    /* -----------------------------------------------------
       Rank Number
       ----------------------------------------------------- */

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
          limit ||
          DEFAULT_LIMIT
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

            ...item.product,

            rank:
              item.rank,

            score:
              item.score,

            reasons:
              item.reasons,

            explanation:
              item.reasons &&
              item.reasons.length
                ? item.reasons.join("؛ ")
                : ""

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

    let products =
      null;


    let options =
      {};


    /*
     * recommend(need, products)
     * recommend(need, products, options)
     */

    if (
      Array.isArray(
        productsOrOptions
      )
    ) {

      products =
        productsOrOptions;

      options =
        maybeOptions ||
        {};

    }


    /*
     * recommend(need, options)
     */

    else if (
      productsOrOptions &&
      typeof productsOrOptions ===
        "object"
    ) {

      options =
        productsOrOptions;

    }


    /* -----------------------------------------------------
       Dependency Guard
       ----------------------------------------------------- */

    if (
      !dependenciesReady()
    ) {

      return {

        version:
          VERSION,

        status:
          "error",

        need:
          cloneNeed(
            need
          ),

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


    /* -----------------------------------------------------
       Need Guard
       ----------------------------------------------------- */

    if (
      !isNeedReady(
        need
      )
    ) {

      return {

        version:
          VERSION,

        status:
          "waiting_for_answer",

        need:
          cloneNeed(
            need
          ),

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


    /* -----------------------------------------------------
       Product Source
       ----------------------------------------------------- */

    const normalizedProducts =
      getProducts(
        products
      );


    /* -----------------------------------------------------
       Product Guard
       ----------------------------------------------------- */

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
          cloneNeed(
            need
          ),

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


    /* -----------------------------------------------------
       Ranking
       ----------------------------------------------------- */

    const rankedProducts =
      rankProducts(
        normalizedProducts,
        need
      );


    /* -----------------------------------------------------
       Recommendations
       ----------------------------------------------------- */

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
        cloneNeed(
          need
        ),

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


    if (
      typeof recommendation.explanation ===
      "string" &&
      recommendation.explanation.trim()
    ) {

      return recommendation.explanation;

    }


    if (
      need
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
      "این محصول بر اساس میزان تطبیق با نیاز کاربر رتبه‌بندی شده است."
    );

  }


  /* =======================================================
     Public API
     ======================================================= */

   const DigiYarSmartRecommendation = {

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
     * نام اصلی V4
     */

    window.DigiYarSmartRecommendation =
      DigiYarSmartRecommendation;


    /*
     * نام Engine
     */

    window.DigiYarSmartRecommendationEngine =
      DigiYarSmartRecommendation;


    /*
     * سازگاری با نسخه قبلی
     */

    window.DigiyarSmartRecommendation =
      DigiYarSmartRecommendation;

  }


})();
