/* =========================================================
   DigiYar V4 — Conversation Engine
   Build 6 — Alpha 1
   ========================================================= */
(function (window) {
  "use strict";

  const VERSION = "4.0.0-alpha.1";
  const MIN_BUDGET = 15000000;
  const MAX_BUDGET = 500000000;

  function getAnswerInterpreter() {
    return window.DigiyarAnswerInterpreter || window.DigiYarAnswerInterpreter || null;
  }
  function getNeedIntegration() {
    return window.DigiyarNeedIntegration || window.DigiYarNeedIntegration || null;
  }
  function createEmptyState() {
    return { version: VERSION, turn: 0, status: "active", need: null, history: [], lastQuestion: null };
  }
  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }
  function normalizeDigits(value) {
    return String(value || "")
      .replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
      .replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
      .replace(/,/g, "").replace(/٬/g, "").replace(/٫/g, ".");
  }
  function parseBudgetLocal(text) {
    const raw = normalizeDigits(text).trim();
    if (!raw) return null;
    const nums = (raw.match(/\d+(?:\.\d+)?/g) || []).map(Number);
    if (!nums.length) return null;
    const isRial = /ریال|ريال|rials?/i.test(raw);
    const isBillion = /میلیارد|billion/i.test(raw);
    const isMillion = /میلیون|million/i.test(raw);
    const isThousand = /هزار|thousand/i.test(raw);
    const multiplier = isRial ? 0.1 : isBillion ? 1e9 : isMillion ? 1e6 : isThousand ? 1e3 : 1;
    const values = nums.map(n => n * multiplier);
    const range = nums.length >= 2 && /تا|بین|الی|-/i.test(raw);
    let min = null, max = values[0];
    if (range) { min = Math.min(values[0], values[1]); max = Math.max(values[0], values[1]); }
    return { min, max, type: "hard_constraint", source: "declared", confidence: isRial ? 0.99 : 0.95, currency: "toman", planningRange: { min: MIN_BUDGET, max: MAX_BUDGET, withinRange: max >= MIN_BUDGET && max <= MAX_BUDGET } };
  }
  function buildQuestion(need) {
    if (!need) return null;
    if (need.ready === true) return { ready: true, question: null, questionId: null, type: null, reason: "need_complete" };
    const missing = Array.isArray(need.unknown) ? need.unknown : [];
    if (missing.includes("budget")) return { ready: false, question: "حدوداً چقدر می‌خوای هزینه کنی؟ مثلاً ۱۵، ۳۰ یا ۵۰ میلیون.", questionId: "budget", type: "budget", reason: "missing_budget", missingFields: missing };
    if (missing.includes("category")) return { ready: false, question: "دقیقاً دنبال چه محصولی هستی؟", questionId: "category", type: "category", reason: "missing_category", missingFields: missing };
    if (missing.includes("usage")) return { ready: false, question: "بیشتر برای چه کاری می‌خوایش؟", questionId: "usage", type: "usage", reason: "missing_usage", missingFields: missing };
    return { ready: false, question: "برای اینکه بهتر راهنمایی‌ات کنم، یکم بیشتر درباره نیازت بگو.", questionId: null, type: null, reason: "missing_information", missingFields: missing };
  }
  function analyzeInitialInput(input) {
    const text = String(input || "").trim();
    if (!text) throw new Error("User input cannot be empty.");
    const need = { version: "4.0.0-alpha.3", input: text, category: null, intent: "purchase", budget: null, usage: [], decisionElements: [], tradeoffs: [], unknown: [], confidence: 0, ready: false, nextAction: "ask_user" };
    const normalized = text.replace(/ي/g, "ی").replace(/ك/g, "ک");
    if (/گوشی|موبایل|تلفن همراه/i.test(normalized)) need.category = "mobile";
    else if (/لپ\s*تاپ|لپتاپ|نوت\s*بوک/i.test(normalized)) need.category = "laptop";
    const budget = parseBudgetLocal(normalized);
    if (budget) need.budget = budget;
    if (/عکاسی|عکس گرفتن|دوربین/i.test(normalized)) {
      need.usage.push("photography");
      need.decisionElements.push({ field: "camera", type: "requirement", importance: 8, source: "declared", confidence: 0.9 });
    }
    if (/بازی|گیم|گیمینگ/i.test(normalized) && !need.usage.includes("gaming")) need.usage.push("gaming");
    evaluateNeed(need);
    return need;
  }
  function evaluateNeed(need) {
    const missing = [];
    if (!need.category) missing.push("category");
    if (!need.budget) missing.push("budget");
    if (!Array.isArray(need.usage) || !need.usage.length) missing.push("usage");
    need.unknown = missing;
    if (!missing.length) { need.confidence = 1; need.ready = true; need.nextAction = "retrieve_products"; }
    else { need.ready = false; need.nextAction = "ask_user"; need.confidence = Number(((3 - missing.length) / 3).toFixed(2)); }
    return need;
  }
  function applyAnswer(previousNeed, input, question) {
    const interpreter = getAnswerInterpreter();
    const integration = getNeedIntegration();
    if (interpreter && integration && question) {
      let answer = null;
      try {
        if (typeof interpreter.interpret === "function") answer = interpreter.interpret(input, question);
        else if (typeof interpreter.process === "function") answer = interpreter.process(input, question);
      } catch (e) { answer = null; }
      if (answer) { try { return integration.integrate(previousNeed, answer); } catch (e) {} }
    }
    const current = analyzeInitialInput(input);
    const merged = clone(previousNeed) || {};
    if (current.category && !merged.category) merged.category = current.category;
    if (current.budget) merged.budget = current.budget;
    if (!Array.isArray(merged.usage)) merged.usage = [];
    current.usage.forEach(item => { if (!merged.usage.includes(item)) merged.usage.push(item); });
    if (!Array.isArray(merged.decisionElements)) merged.decisionElements = [];
    current.decisionElements.forEach(element => { if (!merged.decisionElements.some(item => item.field === element.field)) merged.decisionElements.push(element); });
    return evaluateNeed(merged);
  }
  function process(state, input) {
    const conversation = state || createEmptyState();
    const text = String(input || "").trim();
    if (!text) throw new Error("User input cannot be empty.");
    const need = conversation.need ? applyAnswer(conversation.need, text, conversation.lastQuestion) : analyzeInitialInput(text);
    const question = buildQuestion(need);
    const turn = conversation.turn + 1;
    conversation.version = VERSION;
    conversation.turn = turn;
    conversation.need = need;
    conversation.lastQuestion = question;
    conversation.history.push({ turn, input: text, need: clone(need), question: clone(question) });
    conversation.status = need.ready ? "complete" : "active";
    return { state: conversation, need, question, status: need.ready ? "complete" : "waiting_for_answer", turn, history: conversation.history };
  }
  const engine = { VERSION, version: VERSION, create: createEmptyState, createEmptyState, process, start: input => process(createEmptyState(), input), continueConversation: (state, input) => process(state, input), buildQuestion, evaluateNeed };
  window.DigiyarConversationEngine = engine;
  window.DigiYarConversationEngine = engine;
  window.DigiYarConversationEngine = engine;
})(window);
