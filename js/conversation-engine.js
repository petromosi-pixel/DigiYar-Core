/* =========================================================
   DigiYar V4 — Conversation Engine
   Build 6 — Alpha 1
   ========================================================= */

(function (window) {
  "use strict";

  const VERSION = "4.0.0-alpha.1";

  /* ---------------------------------------------------------
     Dependency Access
  --------------------------------------------------------- */

  function getAnswerInterpreter() {
    return (
      window.DigiyarAnswerInterpreter ||
      window.DigiYarAnswerInterpreter ||
      null
    );
  }

  function getNeedIntegration() {
    return (
      window.DigiyarNeedIntegration ||
      window.DigiYarNeedIntegration ||
      null
    );
  }

  /* ---------------------------------------------------------
     Empty Conversation State
  --------------------------------------------------------- */

  function createEmptyState() {
    return {
      version: VERSION,
      turn: 0,
      status: "active",
      need: null,
      history: [],
      lastQuestion: null
    };
  }

  /* ---------------------------------------------------------
     Clone
  --------------------------------------------------------- */

  function clone(value) {
    if (value === undefined) {
      return undefined;
    }

    return JSON.parse(
      JSON.stringify(value)
    );
  }

  /* ---------------------------------------------------------
     Build Question
  --------------------------------------------------------- */

  function buildQuestion(need) {

    if (!need) {
      return null;
    }

    if (need.ready === true) {
      return {
        ready: true,
        question: null,
        questionId: null,
        type: null,
        reason: "need_complete"
      };
    }

    const missing =
      Array.isArray(need.unknown)
        ? need.unknown
        : [];

    if (missing.includes("budget")) {
      return {
        ready: false,
        question: "حدود بودجه‌ات چقدره؟",
        questionId: "budget",
        type: "budget",
        reason: "missing_budget",
        missingFields: missing
      };
    }

    if (missing.includes("category")) {
      return {
        ready: false,
        question: "دقیقاً دنبال چه محصولی هستی؟",
        questionId: "category",
        type: "category",
        reason: "missing_category",
        missingFields: missing
      };
    }

    if (missing.includes("usage")) {
      return {
        ready: false,
        question: "بیشتر برای چه کاری می‌خوایش؟",
        questionId: "usage",
        type: "usage",
        reason: "missing_usage",
        missingFields: missing
      };
    }

    return {
      ready: false,
      question: "برای اینکه بهتر راهنمایی‌ات کنم، یکم بیشتر درباره نیازت بگو.",
      questionId: null,
      type: null,
      reason: "missing_information",
      missingFields: missing
    };
  }

  /* ---------------------------------------------------------
     Analyze First Message
  --------------------------------------------------------- */

  function analyzeInitialInput(input) {

    const text =
      String(input || "").trim();

    if (!text) {
      throw new Error(
        "User input cannot be empty."
      );
    }

    /*
     * برای پیام اول، Answer Interpreter
     * مستقیماً درگیر سؤال نیست؛
     * نیاز اولیه را از متن استخراج می‌کنیم.
     *
     * Build 6 برای استقلال بیشتر، تشخیص‌های
     * پایه را داخل Engine نیز پوشش می‌دهد.
     */

    const need = {
      version: "4.0.0-alpha.3",
      input: text,
      category: null,
      intent: "purchase",
      budget: null,
      usage: [],
      decisionElements: [],
      tradeoffs: [],
      unknown: [],
      confidence: 0,
      ready: false,
      nextAction: "ask_user"
    };

    const normalized =
      text
        .replace(/ي/g, "ی")
        .replace(/ك/g, "ک");

    /* Category */

    if (
      /گوشی|موبایل|تلفن همراه/i.test(
        normalized
      )
    ) {
      need.category = "mobile";
    }

    else if (
      /لپ\s*تاپ|لپتاپ|نوت\s*بوک/i.test(
        normalized
      )
    ) {
      need.category = "laptop";
    }

    /* Budget */

    const budgetMatch =
      normalized.match(
        /(?:تا|حدود|زیر)\s*([۰-۹0-9]+)\s*(?:میلیون|میلیارد)?/
      );

    if (budgetMatch) {

      const raw =
        budgetMatch[1]
          .replace(/[۰-۹]/g, function (d) {
            return "۰۱۲۳۴۵۶۷۸۹".indexOf(d);
          });

      const number =
        Number(raw);

      if (!isNaN(number)) {

        const multiplier =
          normalized.includes("میلیارد")
            ? 1000000000
            : 1000000;

        need.budget = {
          min: null,
          max: number * multiplier,
          type: "hard_constraint",
          source: "declared",
          confidence: 0.98
        };
      }
    }

    /* Usage */

    if (
      /عکاسی|عکس گرفتن|دوربین/i.test(
        normalized
      )
    ) {
      need.usage.push(
        "photography"
      );

      need.decisionElements.push({
        field: "camera",
        type: "requirement",
        importance: 8,
        source: "declared",
        confidence: 0.9
      });
    }

    if (
      /بازی|گیم|گیمینگ/i.test(
        normalized
      )
    ) {
      if (
        !need.usage.includes("gaming")
      ) {
        need.usage.push("gaming");
      }
    }

    evaluateNeed(need);

    return need;
  }

  /* ---------------------------------------------------------
     Evaluate Need
  --------------------------------------------------------- */

  function evaluateNeed(need) {

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

    need.unknown = missing;

    if (missing.length === 0) {

      need.confidence = 1;
      need.ready = true;
      need.nextAction =
        "retrieve_products";

    } else {

      need.ready = false;
      need.nextAction =
        "ask_user";

      const completed =
        3 - missing.length;

      need.confidence =
        Number(
          (completed / 3).toFixed(2)
        );
    }

    return need;
  }

  /* ---------------------------------------------------------
     Apply Answer
  --------------------------------------------------------- */

  function applyAnswer(
    previousNeed,
    input,
    question
  ) {

    const interpreter =
      getAnswerInterpreter();

    const integration =
      getNeedIntegration();

    /*
     * اگر Answer Interpreter موجود باشد،
     * پاسخ را به شکل استاندارد تفسیر می‌کنیم.
     */

    if (
      interpreter &&
      integration &&
      question
    ) {

      let answer = null;

      try {

        if (
          typeof interpreter.interpret ===
          "function"
        ) {
          answer =
            interpreter.interpret(
              input,
              question
            );
        }

        else if (
          typeof interpreter.process ===
          "function"
        ) {
          answer =
            interpreter.process(
              input,
              question
            );
        }

      } catch (error) {

        answer = null;
      }

      if (answer) {

        try {

          return integration.integrate(
            previousNeed,
            answer
          );

        } catch (error) {
          /* fallback below */
        }
      }
    }

    /*
     * Fallback داخلی برای حفظ عملکرد Engine
     * حتی اگر Interpreter API متفاوت باشد.
     */

    const answerText =
      String(input || "").trim();

    const current =
      analyzeInitialInput(
        answerText
      );

    const merged =
      clone(previousNeed) ||
      {};

    if (
      current.category &&
      !merged.category
    ) {
      merged.category =
        current.category;
    }

    if (
      current.budget
    ) {
      merged.budget =
        current.budget;
    }

    if (
      Array.isArray(current.usage)
    ) {

      if (!Array.isArray(
        merged.usage
      )) {
        merged.usage = [];
      }

      current.usage.forEach(
        function (item) {

          if (
            !merged.usage.includes(item)
          ) {
            merged.usage.push(item);
          }

        }
      );
    }

    if (
      Array.isArray(
        current.decisionElements
      )
    ) {

      if (
        !Array.isArray(
          merged.decisionElements
        )
      ) {
        merged.decisionElements = [];
      }

      current.decisionElements.forEach(
        function (element) {

          const exists =
            merged.decisionElements
              .some(
                function (item) {
                  return (
                    item.field ===
                    element.field
                  );
                }
              );

          if (!exists) {
            merged.decisionElements.push(
              element
            );
          }
        }
      );
    }

    return evaluateNeed(
      merged
    );
  }

  /* ---------------------------------------------------------
     Process Turn
  --------------------------------------------------------- */

  function process(
    state,
    input
  ) {

    const conversation =
      state ||
      createEmptyState();

    const text =
      String(input || "").trim();

    if (!text) {
      throw new Error(
        "User input cannot be empty."
      );
    }

    let need;

    /*
     * Turn 1
     */

    if (!conversation.need) {

      need =
        analyzeInitialInput(
          text
        );

    }

    /*
     * Turn 2+
     */

    else {

      need =
        applyAnswer(
          conversation.need,
          text,
          conversation.lastQuestion
        );
    }

    const question =
      buildQuestion(
        need
      );

    const turn =
      conversation.turn + 1;

    const historyEntry = {
      turn: turn,
      input: text,
      need: clone(need),
      question: clone(question)
    };

    conversation.version =
      VERSION;

    conversation.turn =
      turn;

    conversation.need =
      need;

    conversation.lastQuestion =
      question;

    conversation.history.push(
      historyEntry
    );

    conversation.status =
      need.ready
        ? "complete"
        : "active";

    return {
      state: conversation,
      need: need,
      question: question,
      status:
        need.ready
          ? "complete"
          : "waiting_for_answer",
      turn: turn,
      history:
        conversation.history
    };
  }

  /* ---------------------------------------------------------
     Create
  --------------------------------------------------------- */

  function create() {
    return createEmptyState();
  }

  /* ---------------------------------------------------------
     Public API
  --------------------------------------------------------- */

  const engine = {

    VERSION: VERSION,

    version: VERSION,

    create:
      create,

    createEmptyState:
      createEmptyState,

    process:
      process,

    start:
      function (input) {
        return process(
          create(),
          input
        );
      },

    continueConversation:
      function (
        state,
        input
      ) {
        return process(
          state,
          input
        );
      },

    buildQuestion:
      buildQuestion,

    evaluateNeed:
      evaluateNeed
  };

  /*
   * نامی که تست Build 6 انتظار دارد
   */
  window.DigiyarConversationEngine =
    engine;

  /*
   * نام سازگار برای استفاده احتمالی
   */
  window.DigiYarConversationEngine =
    engine;

  window.DigiYarConversationEngine =
    engine;

})(window);
