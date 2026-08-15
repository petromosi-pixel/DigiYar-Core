/* =========================================================
   DigiYar V4 — Product Retrieval Integration
   Build 7 — Alpha 1

   وظیفه:
   اتصال Need Engine / Conversation State
   به Product Retrieval Layer

   Flow:

   Conversation State
          ↓
         Need
          ↓
   Product Retrieval Integration
          ↓
   DigiYarProductRetrieval.search()
          ↓
       Products

   نکته:
   این فایل مسئول Scoring یا Ranking نیست.
   ========================================================= */

(function (window) {

  "use strict";


  /* =======================================================
     Configuration
     ======================================================= */

  const VERSION =
    "4.0.0-alpha.1";


  /* =======================================================
     Helpers
     ======================================================= */

  function clone(value) {

    if (value === undefined) {
      return undefined;
    }

    return JSON.parse(
      JSON.stringify(value)
    );

  }


  function hasValue(value) {

    if (
      value === null ||
      value === undefined
    ) {

      return false;

    }


    if (
      typeof value === "string"
    ) {

      return value.trim().length > 0;

    }


    if (
      Array.isArray(value)
    ) {

      return value.length > 0;

    }


    if (
      typeof value === "object"
    ) {

      return Object.keys(value).length > 0;

    }


    return true;

  }


  /* =======================================================
     Need Validation
     ======================================================= */

  function isNeedReady(need) {

    if (
      !need ||
      typeof need !== "object"
    ) {

      return false;

    }


    /*
     * اگر Need توسط Need Engine
     * قبلاً آماده اعلام شده باشد.
     */

    if (
      need.ready === true &&
      need.nextAction ===
        "retrieve_products"
    ) {

      return true;

    }


    /*
     * بررسی مستقل برای اطمینان
     */

    if (
      !hasValue(
        need.category
      )
    ) {

      return false;

    }


    if (
      !hasValue(
        need.budget
      )
    ) {

      return false;

    }


    if (
      !Array.isArray(
        need.usage
      ) ||
      need.usage.length === 0
    ) {

      return false;

    }


    return true;

  }


  /* =======================================================
     Query Builder
     ======================================================= */

  function buildQuery(need) {

    if (
      !need ||
      typeof need !== "object"
    ) {

      return "";

    }


    const parts = [];


    /*
     * Category
     */

    if (
      hasValue(
        need.category
      )
    ) {

      parts.push(
        String(
          need.category
        )
      );

    }


    /*
     * Usage
     */

    if (
      Array.isArray(
        need.usage
      )
    ) {

      need.usage.forEach(
        function (usage) {

          if (
            hasValue(usage)
          ) {

            parts.push(
              String(usage)
            );

          }

        }
      );

    }


    /*
     * Decision Elements
     */

    if (
      Array.isArray(
        need.decisionElements
      )
    ) {

      need.decisionElements.forEach(
        function (element) {

          if (
            element &&
            hasValue(
              element.field
            )
          ) {

            parts.push(
              String(
                element.field
              )
            );

          }

        }
      );

    }


    return parts
      .join(" ")
      .trim();

  }


  /* =======================================================
     Retrieve Products
     ======================================================= */

  async function retrieve(
    need,
    options
  ) {

    /*
     * Need وجود ندارد
     */

    if (
      !need
    ) {

      return {

        version:
          VERSION,

        status:
          "waiting_for_answer",

        need:
          null,

        query:
          "",

        products:
          [],

        error:
          null

      };

    }


    /*
     * Need ناقص است
     */

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
          clone(need),

        query:
          "",

        products:
          [],

        error:
          null

      };

    }


    /*
     * بررسی وجود Retrieval Engine
     */

    if (
      !window.DigiYarProductRetrieval ||
      typeof
        window.DigiYarProductRetrieval.search !==
        "function"
    ) {

      return {

        version:
          VERSION,

        status:
          "retrieval_error",

        need:
          clone(need),

        query:
          "",

        products:
          [],

        error:
          "DigiYarProductRetrieval.search is not available."

      };

    }


    /*
     * ساخت Query
     */

    const query =
      buildQuery(
        need
      );


    if (
      !query
    ) {

      return {

        version:
          VERSION,

        status:
          "retrieval_error",

        need:
          clone(need),

        query:
          "",

        products:
          [],

        error:
          "Unable to build retrieval query."

      };

    }


    /*
     * اجرای Retrieval
     */

    try {

      const settings =
        options || {};


      const products =
        await window
          .DigiYarProductRetrieval
          .search(
            query,
            settings
          );


      /*
       * Retrieval باید Array
       * برگرداند.
       */

      const normalizedProducts =
        Array.isArray(
          products
        )
          ? products
          : [];


      return {

        version:
          VERSION,

        status:
          "products_retrieved",

        need:
          clone(need),

        query:
          query,

        products:
          clone(
            normalizedProducts
          ),

        count:
          normalizedProducts.length,

        error:
          null

      };

    }

    catch (error) {

      /*
       * خطای Retrieval نباید
       * Need را خراب کند.
       */

      return {

        version:
          VERSION,

        status:
          "retrieval_error",

        need:
          clone(need),

        query:
          query,

        products:
          [],

        count:
          0,

        error:
          error.message ||
          String(error)

      };

    }

  }


  /* =======================================================
     Integration Alias
     ======================================================= */

  async function integrate(
    need,
    options
  ) {

    return retrieve(
      need,
      options
    );

  }


  /* =======================================================
     Public API
     ======================================================= */

  const DigiyarProductRetrievalIntegration = {

    version:
      VERSION,

    isNeedReady:
      isNeedReady,

    buildQuery:
      buildQuery,

    retrieve:
      retrieve,

    integrate:
      integrate

  };


  /* =======================================================
     Browser Export
     ======================================================= */

  window.DigiyarProductRetrievalIntegration =
    DigiyarProductRetrievalIntegration;


})(window);
