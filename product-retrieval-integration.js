/**
 * DigiYar — Product Retrieval Integration
 * V4 — Build 7 — Alpha 1
 *
 * وظیفه:
 * اتصال Need آماده به Product Retrieval Engine
 *
 * مسیر:
 *
 * Conversation State
 *        ↓
 *       Need
 *        ↓
 * Product Retrieval Integration
 *        ↓
 * Product Retrieval
 *
 * نکته:
 * این Engine مسئول Scoring یا Ranking نیست.
 * فقط Need را به Retrieval تحویل می‌دهد
 * و نتیجه را در یک ساختار استاندارد برمی‌گرداند.
 */

const DigiyarProductRetrievalIntegration = (() => {

  const VERSION = "4.0.0-alpha.1";


  /* =========================================================
     Deep Clone
     ========================================================= */

  function clone(value) {

    return value === undefined
      ? undefined
      : JSON.parse(JSON.stringify(value));

  }


  /* =========================================================
     بررسی مقدار
     ========================================================= */

  function hasValue(value) {

    if (
      value === null ||
      value === undefined
    ) {
      return false;
    }

    if (typeof value === "string") {
      return value.trim().length > 0;
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (typeof value === "object") {
      return Object.keys(value).length > 0;
    }

    return true;

  }


  /* =========================================================
     بررسی کامل بودن Need
     ========================================================= */

  function isNeedReady(need) {

    if (!need || typeof need !== "object") {
      return false;
    }

    /*
     * اگر خود Need قبلاً ready شده باشد،
     * همان را معتبر می‌دانیم.
     */

    if (need.ready === true) {
      return true;
    }

    /*
     * بررسی مستقل برای جلوگیری از وابستگی
     * کامل به یک Engine دیگر.
     */

    if (!hasValue(need.category)) {
      return false;
    }

    if (!hasValue(need.budget)) {
      return false;
    }

    if (
      !Array.isArray(need.usage) ||
      need.usage.length === 0
    ) {
      return false;
    }

    return true;

  }


  /* =========================================================
     ساخت Query برای Retrieval
     ========================================================= */

  function buildQuery(need) {

    const parts = [];

    /*
     * Category
     */

    if (hasValue(need.category)) {

      parts.push(
        String(need.category)
      );

    }


    /*
     * Usage
     */

    if (
      Array.isArray(need.usage) &&
      need.usage.length > 0
    ) {

      need.usage.forEach(item => {

        if (hasValue(item)) {

          parts.push(
            String(item)
          );

        }

      });

    }


    /*
     * Decision Elements
     */

    if (
      Array.isArray(need.decisionElements)
    ) {

      need.decisionElements.forEach(item => {

        if (
          item &&
          hasValue(item.field)
        ) {

          parts.push(
            String(item.field)
          );

        }

      });

    }


    return parts.join(" ").trim();

  }


  /* =========================================================
     پیدا کردن Retrieval Engine
     ========================================================= */

  function getRetrievalEngine() {

    /*
     * نام اصلی Engine پروژه
     */

    if (
      typeof DigiyarProductRetrieval !== "undefined"
    ) {

      return DigiyarProductRetrieval;

    }


    /*
     * سازگاری با window
     */

    if (
      typeof window !== "undefined" &&
      window.DigiyarProductRetrieval
    ) {

      return window.DigiyarProductRetrieval;

    }


    return null;

  }


  /* =========================================================
     اجرای Retrieval
     ========================================================= */

  async function retrieve(need) {

    /*
     * Need نامعتبر
     */

    if (!need) {

      return {

        status: "waiting_for_answer",

        need: null,

        products: [],

        error: null

      };

    }


    /*
     * Need ناقص
     */

    if (!isNeedReady(need)) {

      return {

        status: "waiting_for_answer",

        need: clone(need),

        products: [],

        error: null

      };

    }


    /*
     * بررسی Retrieval Engine
     */

    const engine =
      getRetrievalEngine();

    if (!engine) {

      return {

        status: "retrieval_error",

        need: clone(need),

        products: [],

        error:
          "DigiyarProductRetrieval is not loaded."

      };

    }


    /*
     * ساخت Query
     */

    const query =
      buildQuery(need);


    if (!query) {

      return {

        status: "retrieval_error",

        need: clone(need),

        products: [],

        error:
          "Unable to build retrieval query."

      };

    }


    /*
     * اجرای Retrieval
     *
     * تلاش برای پشتیبانی از API فعلی
     */

    try {

      let result;


      /*
       * API پیشنهادی:
       * search(query)
       */

      if (
        typeof engine.search === "function"
      ) {

        result =
          await engine.search(query);

      }


      /*
       * API جایگزین:
       * retrieve(query)
       */

      else if (
        typeof engine.retrieve === "function"
      ) {

        result =
          await engine.retrieve(query);

      }


      /*
       * API جایگزین:
       * getProducts(query)
       */

      else if (
        typeof engine.getProducts === "function"
      ) {

        result =
          await engine.getProducts(query);

      }


      /*
       * هیچ API معتبر پیدا نشد
       */

      else {

        return {

          status: "retrieval_error",

          need: clone(need),

          products: [],

          error:
            "No supported retrieval method found."

        };

      }


      /*
       * استخراج محصولات
       */

      let products = [];


      if (Array.isArray(result)) {

        products = result;

      }

      else if (
        result &&
        Array.isArray(result.products)
      ) {

        products =
          result.products;

      }

      else if (
        result &&
        Array.isArray(result.results)
      ) {

        products =
          result.results;

      }


      /*
       * خروجی استاندارد
       */

      return {

        status: "products_retrieved",

        need: clone(need),

        query: query,

        products: clone(products),

        error: null

      };

    }

    catch (error) {

      /*
       * خطای Retrieval نباید
       * Need یا Conversation State
       * را خراب کند.
       */

      return {

        status: "retrieval_error",

        need: clone(need),

        query: query,

        products: [],

        error:
          error.message ||
          String(error)

      };

    }

  }


  /* =========================================================
     Integration
     ========================================================= */

  async function integrate(need) {

    return retrieve(need);

  }


  /* =========================================================
     Public API
     ========================================================= */

  return {

    VERSION,

    isNeedReady,

    buildQuery,

    retrieve,

    integrate

  };

})();


/* =========================================================
   Browser Compatibility
   ========================================================= */

if (typeof window !== "undefined") {

  window.DigiyarProductRetrievalIntegration =
    DigiyarProductRetrievalIntegration;

}
