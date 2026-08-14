/* =========================================================
   DigiYar V4 — Need Understanding Engine
   Build 1 — Alpha 0.1
   ========================================================= */

(function (window) {
  "use strict";

  const VERSION = "4.0.0-alpha.1";

  function normalize(text) {
    return String(text || "")
      .trim()
      .replace(/ي/g, "ی")
      .replace(/ك/g, "ک")
      .replace(/[‌]/g, " ");
  }

  function normalizeDigits(text) {
    return String(text || "")
      .replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
      .replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
  }

  function has(text, words) {
    return words.some(word => text.includes(word));
  }

  /* ---------------------------------------------------------
     Category
     --------------------------------------------------------- */

  function detectCategory(text) {
    if (has(text, ["گوشی", "موبایل", "تلفن همراه"])) {
      return "mobile";
    }

    if (has(text, ["لپ تاپ", "لپ‌تاپ", "لپتاپ", "نوت بوک"])) {
      return "laptop";
    }

    if (has(text, ["هدفون", "هندزفری", "ایرباد"])) {
      return "audio";
    }

    if (has(text, ["تلویزیون", "تلویزیون"])) {
      return "tv";
    }

    return null;
  }

  /* ---------------------------------------------------------
     Budget
     --------------------------------------------------------- */

  function detectBudget(text) {
    const normalized = normalizeDigits(text).replace(/,/g, "");

    const match = normalized.match(
      /(?:تا|حداکثر|نهایت(?:اً)?|زیر|کمتر از)\s*([0-9]+(?:\.[0-9]+)?)\s*(میلیون|میلیارد|هزار)?/
    );

    if (!match) return null;

    let value = Number(match[1]);

    if (match[2] === "میلیون") {
      value *= 1000000;
    } else if (match[2] === "میلیارد") {
      value *= 1000000000;
    } else if (match[2] === "هزار") {
      value *= 1000;
    }

    return {
      min: null,
      max: value,
      type: "hard_constraint",
      source: "declared",
      confidence: 0.98
    };
  }

  /* ---------------------------------------------------------
     Usage
     --------------------------------------------------------- */

  function detectUsage(text) {
    const usage = [];

    if (has(text, ["عکاسی", "عکس", "فیلمبرداری", "فیلم‌برداری"])) {
      usage.push("photography");
    }

    if (has(text, ["بازی", "گیم", "گیمینگ"])) {
      usage.push("gaming");
    }

    if (has(text, ["روزمره", "استفاده روزمره", "استفاده روزانه"])) {
      usage.push("daily");
    }

    if (has(text, ["کار", "کاری", "اداری"])) {
      usage.push("work");
    }

    return usage;
  }

  /* ---------------------------------------------------------
     Decision Elements
     --------------------------------------------------------- */

  function element(field, type, importance, extra) {
    return Object.assign({
      field,
      type,
      importance,
      source: "declared",
      confidence: 0.90
    }, extra || {});
  }

  function detectElements(text) {
    const elements = [];

    /* Camera */
    if (has(text, ["دوربین", "عکاسی"])) {
      elements.push(
        element(
          "camera",
          "requirement",
          has(text, ["خیلی مهم", "بسیار مهم", "مهمه", "مهم است"])
            ? 10
            : 8
        )
      );
    }

    /* Battery */
    if (has(text, ["باتری", "شارژدهی"])) {
      elements.push(
        element(
          "battery",
          "requirement",
          has(text, ["خیلی مهم", "بسیار مهم", "مهمه", "مهم است"])
            ? 8
            : 7
        )
      );
    }

    /* Weight preference */
    if (has(text, ["سبک", "وزن کم", "سبک‌تر", "سبک تر"])) {
      const flexible = has(text, [
        "ترجیحاً",
        "ترجیح میدم",
        "اگر",
        "اگه",
        "اشکالی نداره"
      ]);

      elements.push(
        element(
          "weight",
          flexible ? "preference" : "requirement",
          flexible ? 5 : 7,
          {
            flexibility: flexible ? "high" : "medium"
          }
        )
      );
    }

    /* Hard weight constraint */
    const weightMatch = normalizeDigits(text).match(
      /(?:زیر|حداکثر|کمتر از)\s*(\d+)\s*گرم/
    );

    if (weightMatch) {
      elements.push(
        element(
          "weight",
          "hard_constraint",
          10,
          {
            threshold: {
              operator: "<=",
              value: Number(weightMatch[1]),
              unit: "gram"
            },
            flexibility: "none",
            confidence: 0.98
          }
        )
      );
    }

    /* Exclusion */
    if (
      has(text, [
        "آیفون نمی‌خوام",
        "آیفون نمیخوام",
        "آیفون رو نمی‌خوام",
        "آیفون را نمی‌خوام"
      ])
    ) {
      elements.push(
        element(
          "brand_or_os",
          "exclusion",
          10,
          {
            value: "iphone",
            confidence: 0.98
          }
        )
      );
    }

    return elements;
  }

  /* ---------------------------------------------------------
     Trade-offs
     --------------------------------------------------------- */

  function detectTradeoffs(text) {
    const result = [];

    if (
      has(text, [
        "دوربین برام مهم‌تره",
        "دوربین مهمتره",
        "دوربین مهم‌تر از باتری",
        "دوربین از باتری مهم‌تره"
      ])
    ) {
      result.push({
        preferred: "camera",
        over: "battery",
        source: "declared",
        confidence: 0.96
      });
    }

    return result;
  }

  /* ---------------------------------------------------------
     Main Analyzer
     --------------------------------------------------------- */

  function analyze(input) {
    const text = normalize(input);

    const category = detectCategory(text);
    const budget = detectBudget(text);
    const usage = detectUsage(text);
    const decisionElements = detectElements(text);
    const tradeoffs = detectTradeoffs(text);

    const unknown = [];

    if (!category) unknown.push("category");
    if (!budget) unknown.push("budget");
    if (!usage.length) unknown.push("usage");

    const ready = unknown.length === 0;

    return {
      version: VERSION,

      input: text,

      category,

      intent: "purchase",

      budget,

      usage,

      decisionElements,

      tradeoffs,

      unknown,

      confidence:
        (category ? 0.34 : 0) +
        (budget ? 0.33 : 0) +
        (usage.length ? 0.33 : 0),

      ready,

      nextAction: ready
        ? "retrieve_products"
        : "ask_user"
    };
  }

  /* ---------------------------------------------------------
     Public API
     --------------------------------------------------------- */

  window.DigiYarNeedUnderstanding = {
    version: VERSION,
    analyze
  };

})(window);
