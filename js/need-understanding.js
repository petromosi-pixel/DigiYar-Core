/* =========================================================
   DigiYar V4 — Need Understanding Engine
   Build 1.1 — Alpha
   ========================================================= */

(function (window) {
  "use strict";

  const VERSION = "4.0.0-alpha.1";

  function normalize(text) {
    return String(text || "")
      .trim()
      .replace(/ي/g, "ی")
      .replace(/ك/g, "ک")
      .replace(/[‌]/g, " ")
      .replace(/\s+/g, " ");
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

    if (
      has(text, [
        "گوشی",
        "موبایل",
        "تلفن همراه",
        "آیفون"
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
        "تلویزیون",
        "تلویزیون"
      ])
    ) {
      return "tv";
    }

    return null;
  }

  /* ---------------------------------------------------------
     Budget
     --------------------------------------------------------- */

  function detectBudget(text) {

    const normalized =
      normalizeDigits(text).replace(/,/g, "");

    const match = normalized.match(
      /(?:تا|حداکثر|نهایت(?:اً)?|زیر|کمتر از)\s*([0-9]+(?:\.[0-9]+)?)\s*(میلیون|میلیارد|هزار)?/
    );

    if (!match) return null;

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
     Usage
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

      field,

      type,

      importance,

      source: "declared",

      confidence: 0.90

    }, extra || {});
  }

  /* ---------------------------------------------------------
     Decision Elements
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
          "مهمتره"
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

    /* Exclusion — Brand / Product */

    if (
      has(text, [
        "آیفون نمیخوام",
        "آیفون نمی‌خوام",
        "آیفون رو نمیخوام",
        "آیفون رو نمی‌خوام",
        "آیفون را نمیخوام",
        "آیفون را نمی‌خوام",
        "آیفون نمی خواهم",
        "آیفون رو نمی خواهم",
        "آیفون را نمی خواهم"
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
     Trade-off Detection
     --------------------------------------------------------- */

  function detectTradeoffs(text) {

    const result = [];

    /*
      حالت صریح:

      دوربین مهم‌تر از باتری است
      دوربین برام مهم‌تره
    */

    if (
      has(text, [
        "دوربین برام مهم‌تره",
        "دوربین مهمتره",
        "دوربین مهم‌تر از باتری",
        "دوربین از باتری مهم‌تره",
        "دوربین از باتری مهمتره"
      ])
    ) {

      result.push({

        preferred: "camera",

        over: "battery",

        source: "declared",

        confidence: 0.96
      });

      return result;
    }

    /*
      حالت طبیعی‌تر:

      دوربین برام مهم‌تره
      و باتری هم خوب باشه

      در این حالت «مهم‌تر» برای دوربین
      نشان‌دهنده اولویت نسبی است.
    */

    if (
      has(text, [
        "دوربین برام مهم‌تره",
        "دوربین مهم‌تره",
        "دوربین مهمتره"
      ]) &&
      has(text, [
        "باتری"
      ])
    ) {

      result.push({

        preferred: "camera",

        over: "battery",

        source: "declared",

        confidence: 0.92
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

    /*
      این موارد فقط وقتی
      برای یک Need مستقل ضروری باشند
      به عنوان unknown ثبت می‌شوند.
    */

    if (!category) {
      unknown.push("category");
    }

    if (!budget) {
      unknown.push("budget");
    }

    if (!usage.length) {
      unknown.push("usage");
    }

    /*
      اگر فقط بخشی از اطلاعات موجود باشد،
      هنوز Need ناقص است.
    */

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

      category,

      intent: "purchase",

      budget,

      usage,

      decisionElements,

      tradeoffs,

      unknown,

      confidence,

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

    analyze

  };

})(window);
