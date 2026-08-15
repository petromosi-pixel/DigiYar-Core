/**
 * DigiYar — Conversation State Manager
 * V4 — Build 6.1 — Alpha 1
 *
 * وظیفه:
 * مدیریت State گفتگو و اتصال:
 *
 * Turn 1:
 * Conversation Engine
 *        ↓
 * Need Integration
 *
 * Turnهای بعد:
 * Answer Interpreter
 *        ↓
 * Need Integration
 *
 * بدون از بین بردن اطلاعات قبلی گفتگو.
 */

const DigiyarConversationState = (() => {

  const VERSION = "4.0.0-alpha.1";

  /**
   * Deep clone
   */
  function clone(value) {
    return value === undefined
      ? undefined
      : JSON.parse(JSON.stringify(value));
  }

  /**
   * ساخت State اولیه
   */
  function create(initialNeed = null) {

    return {
      version: VERSION,
      turn: 0,
      status: "active",
      need: clone(initialNeed),
      history: [],
      lastQuestion: null
    };
  }

  /**
   * بررسی وجود Engineهای مورد نیاز
   */
  function dependenciesReady() {

    return (
      typeof DigiyarConversationEngine !== "undefined" &&
      typeof DigiyarAnswerInterpreter !== "undefined" &&
      typeof DigiyarNeedIntegration !== "undefined"
    );
  }

  /**
   * ثبت Turn در History
   */
  function addHistory(state, input, result) {

    const history = Array.isArray(state.history)
      ? clone(state.history)
      : [];

    history.push({
      turn: state.turn,
      input: input,
      need: clone(result.need),
      question: clone(result.question),
      status: result.status
    });

    return history;
  }

  /**
   * تعیین سؤال بعدی بر اساس Need
   */
  function buildQuestion(need, previousQuestion, answer) {

    /*
     * اگر Need کامل شده، سؤال نداریم.
     */
    if (need && need.ready === true) {
      return null;
    }

    /*
     * اگر پاسخ قبلی نامفهوم بوده،
     * همان سؤال قبلی را دوباره مطرح می‌کنیم.
     */
    if (
      answer &&
      answer.understood === false &&
      previousQuestion
    ) {

      return {
        ready: false,
        question:
          previousQuestion.question || null,
        questionId:
          previousQuestion.questionId || null,
        type:
          previousQuestion.type || null,
        reason: "answer_not_understood",
        missingFields:
          clone(need.unknown || [])
      };
    }

    /*
     * اگر Conversation Engine سؤال ساخته باشد
     * از همان استفاده می‌کنیم.
     */
    if (
      previousQuestion &&
      previousQuestion.question
    ) {
      return clone(previousQuestion);
    }

    /*
     * ساخت سؤال fallback
     */
    const missing =
      Array.isArray(need.unknown)
        ? need.unknown
        : [];

    const field =
      missing.length > 0
        ? missing[0]
        : null;

    return {
      ready: false,
      questionId: field,
      type: field,
      reason: "missing_information",
      missingFields: clone(missing)
    };
  }

  /**
   * شروع / ادامه گفتگو
   */
  function process(state, input) {

    const currentState =
      clone(state) || create();

    if (!dependenciesReady()) {

      return {
        state: currentState,
        status: "error",
        error:
          "Required conversation engines are not available."
      };
    }

    if (
      input === null ||
      input === undefined ||
      String(input).trim() === ""
    ) {

      return {
        state: currentState,
        status: "waiting_for_input",
        error: null
      };
    }

    const userInput =
      String(input).trim();

    currentState.turn += 1;

    let need = clone(currentState.need);
    let question = null;
    let answer = null;

    /*
     * =====================================================
     * TURN 1
     * =====================================================
     *
     * در اولین پیام، Conversation Engine وظیفه
     * تحلیل کامل پیام را دارد.
     */

    if (
      currentState.turn === 1 &&
      !currentState.need
    ) {

      try {

        const conversationResult =
          DigiyarConversationEngine.start(
            userInput
          );

        if (
          conversationResult &&
          conversationResult.need
        ) {

          need =
            clone(conversationResult.need);

        }

        if (
          conversationResult &&
          conversationResult.question
        ) {

          question =
            clone(conversationResult.question);

        }

      } catch (error) {

        return {
          state: currentState,
          status: "error",
          error:
            error.message || String(error)
        };
      }

    }

    /*
     * =====================================================
     * TURNهای بعدی
     * =====================================================
     *
     * پاسخ کاربر به سؤال قبلی:
     *
     * Answer Interpreter
     *        ↓
     * Need Integration
     */

    else {

      if (!currentState.lastQuestion) {

        /*
         * اگر سؤال قبلی وجود نداشت،
         * پیام جدید را به عنوان یک ورودی مستقل
         * به Conversation Engine می‌دهیم.
         */

        try {

          const conversationResult =
            DigiyarConversationEngine.continueConversation(
              currentState,
              userInput
            );

          if (
            conversationResult &&
            conversationResult.need
          ) {

            need =
              clone(conversationResult.need);

          }

          if (
            conversationResult &&
            conversationResult.question
          ) {

            question =
              clone(conversationResult.question);

          }

        } catch (error) {

          /*
           * اگر Conversation Engine نتوانست
           * ورودی را پردازش کند، Need قبلی حفظ می‌شود.
           */
          need =
            clone(currentState.need);
        }

      }

      else {

        /*
         * ---------------------------------------------
         * Answer Interpreter
         * ---------------------------------------------
         */

        try {

          answer =
            DigiyarAnswerInterpreter.interpret(
              userInput,
              currentState.lastQuestion
            );

        } catch (error) {

          return {
            state: currentState,
            status: "error",
            error:
              error.message || String(error)
          };
        }

        /*
         * ---------------------------------------------
         * Need Integration
         * ---------------------------------------------
         */

        try {

          need =
            DigiyarNeedIntegration.integrate(
              currentState.need,
              answer
            );

        } catch (error) {

          return {
            state: currentState,
            status: "error",
            error:
              error.message || String(error)
          };
        }
      }
    }

    /*
     * =====================================================
     * ارزیابی نهایی Need
     * =====================================================
     */

    if (!need) {
      need = {};
    }

    try {

      need =
        DigiyarNeedIntegration.evaluate(
          need
        );

    } catch (error) {

      return {
        state: currentState,
        status: "error",
        error:
          error.message || String(error)
      };
    }

    /*
     * =====================================================
     * تعیین وضعیت گفتگو
     * =====================================================
     */

    if (need.ready === true) {

      currentState.status =
        "complete";

      currentState.lastQuestion =
        null;

      question = null;

    } else {

      currentState.status =
        "waiting_for_answer";

      /*
       * اگر Conversation Engine در Turn اول
       * سؤال ساخته باشد، همان سؤال را حفظ می‌کنیم.
       */
      if (!question) {

        question =
          buildQuestion(
            need,
            currentState.lastQuestion
              ? {
                  questionId:
                    currentState.lastQuestion
                }
              : null,
            answer
          );
      }

      currentState.lastQuestion =
        question &&
        question.questionId
          ? question.questionId
          : null;
    }

    /*
     * =====================================================
     * ذخیره Need
     * =====================================================
     */

    currentState.need =
      clone(need);

    /*
     * =====================================================
     * ثبت History
     * =====================================================
     */

    const result = {

      need:
        clone(need),

      question:
        clone(question),

      status:
        currentState.status
    };

    currentState.history =
      addHistory(
        currentState,
        userInput,
        result
      );

    /*
     * =====================================================
     * خروجی استاندارد
     * =====================================================
     */

    return {

      state:
        currentState,

      need:
        clone(need),

      question:
        clone(question),

      status:
        currentState.status,

      turn:
        currentState.turn
    };
  }

  /**
   * ادامه گفتگو
   */
  function continueConversation(
    state,
    input
  ) {

    return process(
      state,
      input
    );
  }

  /**
   * Reset
   */
  function reset() {

    return create();

  }

  return {

    VERSION,

    create,

    process,

    continueConversation,

    reset,

    dependenciesReady

  };

})();

/*
 * Browser compatibility
 */
if (typeof window !== "undefined") {

  window.DigiyarConversationState =
    DigiyarConversationState;

}
