/* =========================================================
   DigiYar V4 — Price Policy Bridge
   Keeps the existing Conversation Engine intact while enforcing
   one canonical budget unit (Toman) at the Web App boundary.
   ========================================================= */
(function (window) {
  "use strict";

  function boot() {
    const Engine = window.DigiYarConversationEngine || window.DigiyarConversationEngine;
    const Policy = window.DigiYarPricePolicy;
    if (!Engine || !Policy || Engine.__pricePolicyBridge) return;

    const originalStart = Engine.start;
    const originalContinue = Engine.continueConversation;

    function friendlyQuestion(result) {
      if (!result || !result.question || result.question.questionId !== "budget") return result;
      result.question.question = "حدوداً چقدر می‌خوای هزینه کنی؟ مثلاً ۱۵، ۳۰ یا ۵۰ میلیون.";
      return result;
    }

    function applyBudget(result, input) {
      if (!result || !result.need) return friendlyQuestion(result);
      const parsed = Policy.parseBudget(input);
      if (parsed) {
        result.need.budget = parsed;
        if (result.state && result.state.need) result.state.need.budget = parsed;
        if (result.history && result.history.length) {
          const last = result.history[result.history.length - 1];
          if (last.need) last.need.budget = JSON.parse(JSON.stringify(parsed));
        }
        if (result.need.category && result.need.usage && result.need.usage.length) {
          result.need.ready = true;
          result.need.unknown = [];
          result.need.nextAction = "retrieve_products";
          result.need.confidence = 1;
          result.status = "complete";
          if (result.state) result.state.status = "complete";
        }
      }
      return friendlyQuestion(result);
    }

    Engine.start = function (input) {
      return applyBudget(originalStart.call(Engine, input), input);
    };

    Engine.continueConversation = function (state, input) {
      return applyBudget(originalContinue.call(Engine, state, input), input);
    };

    Engine.__pricePolicyBridge = true;
    Engine.pricePolicy = Policy.config;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window);
