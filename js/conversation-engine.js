/* =========================================================
   DigiYar V4 — Conversation Engine
   Build 3 — Alpha 3
   ========================================================= */

(function (window) {
  "use strict";

  const VERSION = "4.0.0-alpha.3";

  function getNeedEngine() {
    return window.DigiYarNeedUnderstanding;
  }

  function getQuestionEngine() {
    return window.DigiYarQuestionEngine;
  }

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
     Merge new Need into previous Need
     --------------------------------------------------------- */

  function mergeNeeds(previous, current) {

    if (!previous) {
      return current;
    }

    const merged = {
      ...current
    };

    /* Category */

    if (
      !current.category &&
      previous.category
    ) {
      merged.category =
        previous.category;
    }

    /* Intent */

    if (
      !current.intent &&
      previous.intent
    ) {
      merged.intent =
        previous.intent;
    }

    /* Budget */

    if (
      !current.budget &&
      previous.budget
    ) {
      merged.budget =
        previous.budget;
    }

    /* Usage */

    const previousUsage =
      Array.isArray(previous.usage)
        ? previous.usage
        : [];

    const currentUsage =
      Array.isArray(current.usage)
        ? current.usage
        : [];

    merged.usage =
      [...new Set([
        ...previousUsage,
        ...currentUsage
      ])];

    /* Decision Elements */

    const previousElements =
      Array.isArray(previous.decisionElements)
        ? previous.decisionElements
        : [];

    const currentElements =
      Array.isArray(current.decisionElements)
        ? current.decisionElements
        : [];

    merged.decisionElements =
      [
        ...previousElements,
        ...currentElements
      ];

    /* Tradeoffs */

    const previousTradeoffs =
      Array.isArray(previous.tradeoffs)
        ? previous.tradeoffs
        : [];

    const currentTradeoffs =
      Array.isArray(current.tradeoffs)
        ? current.tradeoffs
        : [];

    merged.tradeoffs =
      [
        ...previousTradeoffs,
        ...currentTradeoffs
      ];

    /* Unknown */

    const unknown = [];

    if (!merged.category) {
      unknown.push("category");
    }

    if (!merged.budget) {
      unknown.push("budget");
    }

    if (
      !merged.usage ||
      merged.usage.length === 0
    ) {
      unknown.push("usage");
    }

    merged.unknown = unknown;

    /* Readiness */

    merged.ready =
      unknown.length === 0;

    merged.nextAction =
      merged.ready
        ? "retrieve_products"
        : "ask_user";

    /* Confidence */

    if (merged.ready) {
      merged.confidence = 1;
    }

    return merged;
  }

  /* ---------------------------------------------------------
     Analyze one turn
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

    /* Analyze only the current message */

    const currentNeed =
      needEngine.analyze(text);

    /* Merge with conversation state */

    const need =
      mergeNeeds(
        state.need,
        currentNeed
      );

    /* Ask the next required question */

    const question =
      questionEngine.selectQuestion(
        need
      );

    const nextTurn =
      state.turn + 1;

    const historyEntry = {

      turn: nextTurn,

      input: text,

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
     Start
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
     Continue
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
     Helpers
     --------------------------------------------------------- */

  function getCurrentQuestion(state) {

    if (!state) {
      return null;
    }

    return state.question || null;
  }

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
      isComplete,

    mergeNeeds:
      mergeNeeds
  };

})(window);
