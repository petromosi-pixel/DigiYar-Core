/* =========================================================
   DigiYar V4 — Need Understanding Engine
   Build 1.3 — Alpha
   ========================================================= */

(function (window) {
  "use strict";

  const VERSION = "4.0.0-alpha.3";

  /* ---------------------------------------------------------
     Text Normalization
     --------------------------------------------------------- */

  function normalize(text) {
    return String(text || "")
      .trim()
      .replace(/ي/g, "ی")
      .replace(/ى/g, "ی")
      .replace(/ك/g, "ک")
      .replace(/[‌]/g, " ")
      .replace(/\s+/g, " ");
  }

  function compact(text) {
    return normalize(text).replace(/\s+/g, "");
  }

  function normalizeDigits(text) {
    return String(text || "")
      .replace(/[۰-۹]/g, function (d) {
        return "۰۱۲۳۴۵۶۷۸۹".indexOf(d);
      })
      .replace(/[٠-٩]/g, function (d) {
        return "٠١٢٣٤٥٦٧٨٩".indexOf(d);
      });
  }

  function has(text, words) {
    return words.some(function (word) {
      return text.includes(word);
    });
  }

  /* ---------------------------------------------------------
     Category Detection
     --------------------------------------------------------- */

  function detectCategory(text) {

    if (
      has(text, [
        "گوشی",
        "موبایل",
        "تلفن همراه",
        "آیفون",
        "ایفون",
        "iphone"
      ])
    ) {
      return "mobile";
    }

    if (
      has(text, [
        "لپ تاپ",
        "لپتاپ",
        "لپ‌تاپ",
        "نوت بوک"
      ])
    ) {
      return "laptop";
    }

    if (
      has(text, [
        "هدفون",
        "هندزفری",
        "ایرباد"
      ])
    ) {
      return "audio";
    }

    if (
      has(text, [
        "تلویزیون"
      ])
    ) {
      return "tv";
    }

    return null;
  }

  /* ---------------------------------------------------------
     Budget Detection
     --------------------------------------------------------- */

  function detectBudget(text) {

    const normalized =
      normalizeDigits(text).replace(/,/g, "");

    const match = normalized.match(
      /(?:تا|حداکثر|نهایت(?:اً)?|زیر|کمتر از)\s*([0-9]+(?:\.[0-9]+)?)\s*(میلیون|میلیارد|هزار)?/
    );

    if (!match) {
      return null;
    }

    let value = Number(match[1]);

    if (match[2] === "میلیون") {
      value *= 1000000;
    }

    else if (match[2] === "میلیارد") {
      value *= 1000000000;
    }

    else if (match[2] === "هزار") {
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
     Usage Detection
     --------------------------------------------------------- */

  function detectUsage(text) {

    const usage = [];

    if (
      has(text, [
        "عکاسی",
        "عکس",
        "فیلمبرداری",
        "فیلم‌برداری"
      ])
    ) {
      usage.push("photography");
    }

    if (
      has(text, [
        "بازی",
        "گیم",
        "گیمینگ"
      ])
    ) {
      usage.push("gaming");
    }

    if (
      has(text, [
        "روزمره",
        "استفاده روزمره",
        "استفاده روزانه"
      ])
    ) {
      usage.push("daily");
    }

    if (
      has(text, [
        "کار",
        "کاری",
        "اداری"
      ])
    ) {
      usage.push("work");
    }

    return usage;
  }

  /* ---------------------------------------------------------
     Decision Element
     --------------------------------------------------------- */

  function element(
    field,
    type,
    importance,
    extra
  ) {

    return Object.assign({

      field: field,

      type: type,

      importance: importance,

      source: "declared",

      confidence: 0.90

    }, extra || {});
  }

  /* ---------------------------------------------------------
     iPhone Exclusion Detection
     --------------------------------------------------------- */

  function detectIphoneExclusion(text) {

    const normalized =
      normalize(text);

    const compactText =
      compact(text);

    const hasIphone =
      compactText.includes("آیفون") ||
      compactText.includes("ایفون") ||
      compactText.includes("iphone");

    if (!hasIphone) {
      return false;
    }

    const negativePatterns = [

      "نمیخوام",
      "نمیخواهم",
      "نمیخوامش",
      "نمیخواهمش",

      "نمی خواهم",
      "نمی خواهمش",

      "نمی‌خواهم",

      "نمیخوام",
      "نمی‌خوام"

    ];

    if (
      negativePatterns.some(function (pattern) {
        return normalized.includes(pattern);
      })
    ) {
      return true;
    }

    if (
      normalized.includes("آیفون نمی") ||
      normalized.includes("ایفون نمی") ||
      normalized.includes("iphone نمی")
    ) {
      return true;
    }

    return false;
  }

  /* ---------------------------------------------------------
     Decision Elements Detection
     --------------------------------------------------------- */

  function detectElements(text) {

    const elements = [];

    /* Camera */

    if (
      has(text, [
        "دوربین",
        "عکاسی"
      ])
    ) {

      let importance = 8;

      if (
        has(text, [
          "خیلی مهم",
          "بسیار مهم",
          "مهمه",
          "مهم است",
          "مهم‌تره",
          "مهمتره",
          "مهم تره",
          "مهم تر"
        ])
      ) {
        importance = 10;
      }

      elements.push(
        element(
          "camera",
          "requirement",
          importance
        )
      );
    }

    /* Battery */

    if (
      has(text, [
        "باتری",
        "شارژدهی"
      ])
    ) {

      let importance = 7;

      if (
        has(text, [
          "خیلی مهم",
          "بسیار مهم",
          "مهمه",
          "مهم است"
        ])
      ) {
        importance = 8;
      }

      elements.push(
        element(
          "battery",
          "requirement",
          importance
        )
      );
    }

    /* Weight */

    if (
      has(text, [
        "سبک",
        "وزن کم",
        "سبک‌تر",
        "سبک تر"
      ])
    ) {

      const flexible =
        has(text, [
          "ترجیحاً",
          "ترجیح میدم",
          "ترجیح می‌دم",
          "اگر",
          "اگه",
          "اشکالی نداره"
        ]);

      elements.push(
        element(
          "weight",
          flexible
            ? "preference"
            : "requirement",
          flexible
            ? 5
            : 7,
          {
            flexibility:
              flexible
                ? "high"
                : "medium"
          }
        )
      );
    }

    /* Hard Weight Constraint */

    const weightMatch =
      normalizeDigits(text).match(
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

              value:
                Number(weightMatch[1]),

              unit: "gram"
            },

            flexibility: "none",

            confidence: 0.98
          }
        )
      );
    }

    /* iPhone Exclusion */

    if (
      detectIphoneExclusion(text)
    ) {

      elements.push(
        element(
          "brand_or_os",
          "exclusion",
          10,
          {
            value: "iphone",
            confidence: 0.99
          }
        )
      );
    }

    return elements;
  }

  /* ---------------------------------------------------------
     Trade-off Detection
     --------------------------------------------------------- */

  function detectTradeoffs(text) {

    const result = [];

    const normalized =
      normalize(text);

    /*
      حالت‌های مختلف نوشتاری:

      مهم‌تره
      مهمتره
      مهم تره
      مهم‌تر
      مهمتر
      مهم تر
    */

    const cameraPriority =
      normalized.includes("دوربین برام مهم") &&
      (
        normalized.includes("مهم‌تر") ||
        normalized.includes("مهمتر") ||
        normalized.includes("مهم تر") ||
        normalized.includes("مهم‌تره") ||
        normalized.includes("مهمتره") ||
        normalized.includes("مهم تره")
      );

    /*
      حالت صریح:

      دوربین از باتری مهم‌تره
      دوربین مهم‌تر از باتریه
    */

    const cameraVsBattery =
      (
        normalized.includes("دوربین از باتری") ||
        normalized.includes("دوربین مهم‌تر از باتری") ||
        normalized.includes("دوربین مهمتر از باتری") ||
        normalized.includes("دوربین مهم تر از باتری")
      );

    const batteryMentioned =
      normalized.includes("باتری");

    /*
      اگر کاربر دوربین را مهم‌تر اعلام کرده
      و باتری را هم در همان درخواست ذکر کرده،
      دوربین نسبت به باتری اولویت بالاتری دارد.
    */

    if (
      (cameraPriority && batteryMentioned) ||
      cameraVsBattery
    ) {

      result.push({

        preferred: "camera",

        over: "battery",

        source: "declared",

        confidence:
          cameraVsBattery
            ? 0.98
            : 0.92
      });
    }

    return result;
  }

  /* ---------------------------------------------------------
     Main Analyzer
     --------------------------------------------------------- */

  function analyze(input) {

    const text =
      normalize(input);

    const category =
      detectCategory(text);

    const budget =
      detectBudget(text);

    const usage =
      detectUsage(text);

    const decisionElements =
      detectElements(text);

    const tradeoffs =
      detectTradeoffs(text);

    const unknown = [];

    if (!category) {
      unknown.push("category");
    }

    if (!budget) {
      unknown.push("budget");
    }

    if (!usage.length) {
      unknown.push("usage");
    }

    const ready =
      unknown.length === 0;

    let confidence = 0;

    if (category) {
      confidence += 0.34;
    }

    if (budget) {
      confidence += 0.33;
    }

    if (usage.length) {
      confidence += 0.33;
    }

    confidence =
      Number(
        confidence.toFixed(2)
      );

    return {

      version: VERSION,

      input: text,

      category: category,

      intent: "purchase",

      budget: budget,

      usage: usage,

      decisionElements:
        decisionElements,

      tradeoffs:
        tradeoffs,

      unknown:
        unknown,

      confidence:
        confidence,

      ready:
        ready,

      nextAction:
        ready
          ? "retrieve_products"
          : "ask_user"
    };
  }

  /* ---------------------------------------------------------
     Public API
     --------------------------------------------------------- */

  window.DigiYarNeedUnderstanding = {

    version: VERSION,

    analyze: analyze

  };

})(window);
