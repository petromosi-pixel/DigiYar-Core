/**
 * DigiYar — Shopping Flow
 * V4 — Build 8 — Alpha 1
 *
 * وظیفه:
 * هماهنگ‌سازی کل مسیر خرید:
 *
 * User Input
 *      ↓
 * Conversation State
 *      ↓
 * Need
 *      ↓
 * Need Ready?
 *   ↙          ↘
 * سؤال        Product Retrieval
 *                ↓
 *             Products
 *
 * این فایل Engineهای قبلی را تغییر نمی‌دهد.
 */

const DigiyarShoppingFlow = (() => {

  const VERSION = "4.0.0-alpha.1";


  /* =====================================================
     Dependency Check
     ===================================================== */

  function dependenciesReady() {

    return (
      typeof DigiyarConversationState !== "undefined" &&
      typeof DigiyarProductRetrievalIntegration !== "undefined"
    );

  }


  /* =====================================================
     Create Session
     ===================================================== */

  function createSession(initialNeed = null) {

    if (
      typeof DigiyarConversationState === "undefined"
    ) {

      return null;

    }

    return DigiyarConversationState.create(
      initialNeed
    );

  }


  /* =====================================================
     Process User Input
     ===================================================== */

  async function process(
    state,
    input,
    options
  ) {

    const settings =
      options || {};


    /*
     * -----------------------------------------
     * Dependency Guard
     * -----------------------------------------
     */

    if (!dependenciesReady()) {

      return {

        version:
          VERSION,

        status:
          "error",

        state:
          state || null,

        need:
          null,

        question:
          null,

        products:
          [],

        count:
          0,

        error:
          "Required shopping flow dependencies are not available."

      };

    }


    /*
     * -----------------------------------------
     * Input Guard
     * -----------------------------------------
     */

    if (
      input === null ||
      input === undefined ||
      String(input).trim() === ""
    ) {

      return {

        version:
          VERSION,

        status:
          "waiting_for_input",

        state:
          state || null,

        need:
          state && state.need
            ? state.need
            : null,

        question:
          null,

        products:
          [],

        count:
          0,

        error:
          null

      };

    }


    /*
     * -----------------------------------------
     * STEP 1
     * Conversation State
     * -----------------------------------------
     */

    let conversationResult;

    try {

      conversationResult =
        DigiyarConversationState.process(
          state,
          input
        );

    }

    catch (error) {

      return {

        version:
          VERSION,

        status:
          "error",

        state:
          state || null,

        need:
          null,

        question:
          null,

        products:
          [],

        count:
          0,

        error:
          error.message ||
          String(error)

      };

    }


    /*
     * Conversation Engine Error
     */

    if (
      !conversationResult ||
      conversationResult.status === "error"
    ) {

      return {

        version:
          VERSION,

        status:
          "error",

        state:
          conversationResult
            ? conversationResult.state
            : state,

        need:
          conversationResult
            ? conversationResult.need
            : null,

        question:
          conversationResult
            ? conversationResult.question
            : null,

        products:
          [],

        count:
          0,

        error:
          conversationResult &&
          conversationResult.error
            ? conversationResult.error
            : "Conversation processing failed."

      };

    }


    const nextState =
      conversationResult.state;

    const need =
      conversationResult.need;


    /*
     * -----------------------------------------
     * STEP 2
     * Need Incomplete
     * -----------------------------------------
     */

    if (
      !need ||
      need.ready !== true
    ) {

      return {

        version:
          VERSION,

        status:
          conversationResult.status ||
          "waiting_for_answer",

        state:
          nextState,

        need:
          need,

        question:
          conversationResult.question ||
          null,

        products:
          [],

        count:
          0,

        error:
          null

      };

    }


    /*
     * -----------------------------------------
     * STEP 3
     * Need Complete
     *
     * Activate Product Retrieval
     * -----------------------------------------
     */

    let retrievalResult;

    try {

      retrievalResult =
        await DigiyarProductRetrievalIntegration
          .retrieve(
            need,
            settings.retrieval || {}
          );

    }

    catch (error) {

      return {

        version:
          VERSION,

        status:
          "retrieval_error",

        state:
          nextState,

        need:
          need,

        question:
          null,

        products:
          [],

        count:
          0,

        error:
          error.message ||
          String(error)

      };

    }


    /*
     * -----------------------------------------
     * STEP 4
     * Normalize Retrieval Output
     * -----------------------------------------
     */

    if (!retrievalResult) {

      return {

        version:
          VERSION,

        status:
          "retrieval_error",

        state:
          nextState,

        need:
          need,

        question:
          null,

        products:
          [],

        count:
          0,

        error:
          "Product Retrieval returned no result."

      };

    }


    /*
     * -----------------------------------------
     * STEP 5
     * Final Flow Result
     * -----------------------------------------
     */

    return {

      version:
        VERSION,

      status:
        retrievalResult.status ||
        "products_retrieved",

      state:
        nextState,

      need:
        need,

      question:
        null,

      query:
        retrievalResult.query ||
        "",

      products:
        Array.isArray(
          retrievalResult.products
        )
          ? retrievalResult.products
          : [],

      count:
        Array.isArray(
          retrievalResult.products
        )
          ? retrievalResult.products.length
          : 0,

      error:
        retrievalResult.error ||
        null

    };

  }


  /* =====================================================
     Continue Existing Session
     ===================================================== */

  async function continueSession(
    state,
    input,
    options
  ) {

    return process(
      state,
      input,
      options
    );

  }


  /* =====================================================
     Reset Session
     ===================================================== */

  function resetSession() {

    return createSession();

  }


  /* =====================================================
     Public API
     ===================================================== */

  const DigiyarShoppingFlow = {

    version:
      VERSION,

    dependenciesReady:
      dependenciesReady,

    createSession:
      createSession,

    process:
      process,

    continueSession:
      continueSession,

    resetSession:
      resetSession

  };


  return DigiyarShoppingFlow;

})();


/* =========================================================
   Browser Compatibility
   ========================================================= */

if (
  typeof window !== "undefined"
) {

  window.DigiyarShoppingFlow =
    DigiyarShoppingFlow;

}
