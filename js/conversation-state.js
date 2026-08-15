/**
 * DigiYar — Conversation State Manager
 * V4 — Build 6 — Alpha 1
 *
 * وظیفه:
 * مدیریت State گفتگو و اتصال:
 *
 * Conversation Engine
 *        ↓
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
   * شروع / ادامه گفتگو
   */
  function process(state, input) {

    const currentState = clone(state) || create();

    if (!dependenciesReady()) {

      return {
        state: currentState,
        status: "error",
        error: "Required conversation engines are not available."
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

    const userInput = String(input).trim();

    currentState.turn += 1;

    /*
     * -----------------------------------------
     * STEP 1
     * Conversation Engine
     * -----------------------------------------
     */

    let conversationResult;

    try {

      conversationResult =
        DigiyarConversationEngine.process(
          currentState.need,
          userInput
        );

    } catch (error) {

      return {
        state: currentState,
        status: "error",
        error: error.message || String(error)
      };
    }

    /*
     * اگر Conversation Engine مستقیماً Need
     * را تولید کرده باشد، آن را حفظ می‌کنیم.
     */

    let need =
      conversationResult &&
      conversationResult.need
        ? clone(conversationResult.need)
        : clone(currentState.need);

    /*
     * -----------------------------------------
     * STEP 2
     * اگر سؤال قبلی وجود داشته باشد،
     * پاسخ کاربر را با Answer Interpreter
     * تفسیر می‌کنیم.
     * -----------------------------------------
     */

    let answer = null;

    if (currentState.lastQuestion) {

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
          error: error.message || String(error)
        };
      }

      /*
       * ---------------------------------------
       * STEP 3
       * اتصال Answer به Need
       * ---------------------------------------
       */

      try {

        need =
          DigiyarNeedIntegration.integrate(
            need,
            answer
          );

      } catch (error) {

        return {
          state: currentState,
          status: "error",
          error: error.message || String(error)
        };
      }
    }

    /*
     * اگر Answer Interpreter استفاده نشده،
     * Need موجود را ارزیابی می‌کنیم.
     */

    else {

      try {

        need =
          DigiyarNeedIntegration.evaluate(
            need
          );

      } catch (error) {

        return {
          state: currentState,
          status: "error",
          error: error.message || String(error)
        };
      }
    }

    /*
     * -----------------------------------------
     * STEP 4
     * تعیین سؤال / وضعیت نهایی
     * -----------------------------------------
     */

    let question = null;

    if (need.ready === true) {

      currentState.status = "complete";
      currentState.lastQuestion = null;

    } else {

      currentState.status = "waiting_for_answer";

      if (
        conversationResult &&
        conversationResult.question
      ) {

        question =
          clone(conversationResult.question);

      } else if (
        answer &&
        answer.understood === false
      ) {

        question = {
          ready: false,
          questionId: currentState.lastQuestion,
          type: currentState.lastQuestion,
          reason: "answer_not_understood"
        };

      } else {

        question = {
          ready: false,
          questionId:
            Array.isArray(need.unknown) &&
            need.unknown.length > 0
              ? need.unknown[0]
              : null,
          type:
            Array.isArray(need.unknown) &&
            need.unknown.length > 0
              ? need.unknown[0]
              : null,
          reason: "missing_information",
          missingFields:
            clone(need.unknown || [])
        };
      }

      currentState.lastQuestion =
        question &&
        question.questionId
          ? question.questionId
          : null;
    }

    /*
     * -----------------------------------------
     * STEP 5
     * به‌روزرسانی State
     * -----------------------------------------
     */

    currentState.need = clone(need);

    const result = {
      need: clone(need),
      question: clone(question),
      status: currentState.status
    };

    currentState.history =
      addHistory(
        currentState,
        userInput,
        result
      );

    /*
     * -----------------------------------------
     * خروجی نهایی
     * -----------------------------------------
     */

    return {
      state: currentState,
      need: clone(need),
      question: clone(question),
      status: currentState.status,
      turn: currentState.turn
    };
  }

  /**
   * ادامه گفتگو با State موجود
   */
  function continueConversation(state, input) {

    return process(
      state,
      input
    );
  }

  /**
   * پاک کردن گفتگو و ساخت Session جدید
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
