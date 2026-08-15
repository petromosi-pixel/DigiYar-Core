/* =========================================================
   DigiYar V4 — Conversation Engine
   Build 3 — Alpha 2
   ========================================================= */

(function (window) {
  "use strict";

  const VERSION = "4.0.0-alpha.2";

  /* ---------------------------------------------------------
     Dependencies
     --------------------------------------------------------- */

  function getNeedEngine() {
    return window.DigiYarNeedUnderstanding;
  }

  function getQuestionEngine() {
    return window.DigiYarQuestionEngine;
  }

  /* ---------------------------------------------------------
     Empty Conversation State
     --------------------------------------------------------- */

  function createEmptyState() {

    return {
      input: "",
      need: null,
      question: null,
      status: "idle",
      history: [],
      turn: 0
    };

  }

  /* ---------------------------------------------------------
     Build Full Conversation Input
     --------------------------------------------------------- */

  function buildConversationInput(state, newInput) {

    const previousInputs =
      state.history.map(function (item) {
        return item.input;
      });

    previousInputs.push(newInput);

    return previousInputs
      .filter(Boolean)
      .join(" ");

  }

  /* ---------------------------------------------------------
     Analyze Conversation
     --------------------------------------------------------- */

  function analyzeInput(state, input) {

    const needEngine =
      getNeedEngine();

    const questionEngine =
      getQuestionEngine();

    if (!needEngine) {

      throw new Error(
        "DigiYarNeedUnderstanding is not loaded."
      );

    }

    if (!questionEngine) {

      throw new Error(
        "DigiYarQuestionEngine is not loaded."
      );

    }

    const text =
      String(input || "").trim();

    if (!text) {

      throw new Error(
        "User input cannot be empty."
      );

    }

    /*
      IMPORTANT:
      Need Understanding must receive the
      complete conversation, not only the
      latest user message.
    */

    const conversationInput =
      buildConversationInput(
        state,
        text
      );

    const need =
      needEngine.analyze(
        conversationInput
      );

    const question =
      questionEngine.selectQuestion(
        need
      );

    const nextTurn =
      state.turn + 1;

    const historyEntry = {

      turn: nextTurn,

      input: text,

      conversationInput:
        conversationInput,

      need: need,

      question: question

    };

    state.input =
      text;

    state.need =
      need;

    state.question =
      question;

    state.turn =
      nextTurn;

    state.history.push(
      historyEntry
    );

    state.status =
      question.ready
        ? "complete"
        : "waiting_for_answer";

    return state;

  }

  /* ---------------------------------------------------------
     Start Conversation
     --------------------------------------------------------- */

  function start(input) {

    const state =
      createEmptyState();

    return analyzeInput(
      state,
      input
    );

  }

  /* ---------------------------------------------------------
     Continue Conversation
     --------------------------------------------------------- */

  function continueConversation(
    state,
    input
  ) {

    if (!state) {

      throw new Error(
        "Conversation state is required."
      );

    }

    if (
      state.status === "complete"
    ) {

      return state;

    }

    return analyzeInput(
      state,
      input
    );

  }

  /* ---------------------------------------------------------
     Get Current Question
     --------------------------------------------------------- */

  function getCurrentQuestion(state) {

    if (!state) {
      return null;
    }

    return state.question || null;

  }

  /* ---------------------------------------------------------
     Is Complete?
     --------------------------------------------------------- */

  function isComplete(state) {

    return Boolean(
      state &&
      state.status === "complete"
    );

  }

  /* ---------------------------------------------------------
     Public API
     --------------------------------------------------------- */

  window.DigiYarConversationEngine = {

    version: VERSION,

    createEmptyState:
      createEmptyState,

    start:
      start,

    continueConversation:
      continueConversation,

    getCurrentQuestion:
      getCurrentQuestion,

    isComplete:
      isComplete

  };

})(window);
