/* =========================================================
   DigiYar V4 — Question Engine
   Build 2 — Alpha 1
   ========================================================= */

(function (window) {
  "use strict";

  const VERSION = "4.0.0-alpha.1";

  /* ---------------------------------------------------------
     Question Definitions
     --------------------------------------------------------- */

  const QUESTIONS = {

    category: {
      id: "category",
      priority: 100,
      question: "دقیقاً دنبال چه محصولی هستی؟",
      type: "category"
    },

    budget: {
      id: "budget",
      priority: 90,
      question: "حدود بودجه‌ات چقدره؟",
      type: "budget"
    },

    usage: {
      id: "usage",
      priority: 80,
      question: "بیشتر برای چه کاری می‌خوایش؟",
      type: "usage"
    }

  };

  /* ---------------------------------------------------------
     Normalize Need
     --------------------------------------------------------- */

  function normalizeNeed(need) {

    return need || {
      category: null,
      budget: null,
      usage: [],
      decisionElements: [],
      tradeoffs: [],
      unknown: [],
      ready: false
    };

  }

  /* ---------------------------------------------------------
     Determine Missing Fields
     --------------------------------------------------------- */

  function getMissingFields(need) {

    const missing = [];

    if (!need.category) {
      missing.push("category");
    }

    if (!need.budget) {
      missing.push("budget");
    }

    if (
      !Array.isArray(need.usage) ||
      need.usage.length === 0
    ) {
      missing.push("usage");
    }

    return missing;
  }

  /* ---------------------------------------------------------
     Question Selection
     --------------------------------------------------------- */

  function selectQuestion(need) {

    need = normalizeNeed(need);

    if (need.ready === true) {

      return {
        ready: true,
        question: null,
        questionId: null,
        reason: "need_complete"
      };

    }

    const missing =
      getMissingFields(need);

    if (missing.length === 0) {

      return {
        ready: true,
        question: null,
        questionId: null,
        reason: "required_fields_complete"
      };

    }

    /*
      Priority rule:

      1. Category
      2. Budget
      3. Usage
    */

    let selected = null;

    missing.forEach(function (field) {

      const candidate =
        QUESTIONS[field];

      if (!candidate) {
        return;
      }

      if (
        !selected ||
        candidate.priority > selected.priority
      ) {
        selected = candidate;
      }

    });

    if (!selected) {

      return {
        ready: false,
        question: null,
        questionId: null,
        reason: "no_question_available"
      };

    }

    return {

      ready: false,

      question:
        selected.question,

      questionId:
        selected.id,

      type:
        selected.type,

      reason:
        "missing_" + selected.id,

      missingFields:
        missing

    };

  }

  /* ---------------------------------------------------------
     Public API
     --------------------------------------------------------- */

  window.DigiYarQuestionEngine = {

    version: VERSION,

    selectQuestion: selectQuestion,

    getMissingFields: getMissingFields

  };

})(window);
