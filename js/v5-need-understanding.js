/* =========================================================
   DigiYar V5.1 — Housh Yar Need Understanding Core
   Phase 1 — deterministic Persian intent extraction
   ========================================================= */
(function (window) {
  "use strict";

  const VERSION = "5.1.0-alpha.1";
  const DIGITS = "۰۱۲۳۴۵۶۷۸۹";

  const CATEGORY_ALIASES = [
    ["mobile", ["گوشی", "موبایل", "تلفن همراه", "آیفون", "iphone", "سامسونگ", "شیائومی", "پوکو"]],
    ["laptop-computer", ["لپ تاپ", "لپتاپ", "نوت بوک", "کامپیوتر", "لنوو", "ایسوس", "ایسر"]],
    ["home-appliances", ["لوازم خانگی", "یخچال", "لباسشویی", "ظرفشویی", "جاروبرقی", "سرخ کن", "قهوه ساز", "اسپرسوساز"]],
    ["digital", ["کالای دیجیتال", "لوازم جانبی دیجیتال", "هارد", "فلش", "اس اس دی", "ssd", "پرینتر"]],
    ["audio-video", ["تلویزیون", "سیستم صوتی", "اسپیکر", "هدفون", "هندزفری", "پروژکتور"]],
    ["fashion", ["لباس", "پوشاک", "کفش", "کیف", "عینک", "پوشاک مردانه", "پوشاک زنانه"]],
    ["beauty-health", ["آرایشی", "بهداشتی", "ماشین اصلاح", "ریش تراش", "سشوار", "اتو مو", "مسواک برقی"]],
    ["supermarket", ["خوراکی", "مواد غذایی", "برنج", "روغن", "قهوه", "چای", "نوشیدنی", "تنقلات"]],
    ["sports-travel", ["ورزشی", "کتانی", "کفش ورزشی", "کوهنوردی", "کمپینگ", "چمدان"]],
    ["tools-industrial", ["ابزار", "دریل", "پیچ گوشتی", "فرز", "اره", "باغبانی", "روشنایی"]],
    ["books-stationery", ["کتاب", "لوازم تحریر", "دفتر", "نوشت افزار", "نقاشی", "آلات موسیقی"]],
    ["kids-toys", ["اسباب بازی", "لگو", "عروسک", "ماشین بازی", "بازی فکری", "پازل", "کودک", "نوزاد"]],
    ["auto", ["خودرو", "ماشین", "لاستیک", "قطعات خودرو", "لوازم جانبی خودرو", "موتورسیکلت"]]
  ];

  const USAGE_ALIASES = [
    ["gaming", ["بازی", "گیم", "گیمینگ", "بازی کردن"]],
    ["photography", ["عکاسی", "عکس", "دوربین", "فیلمبرداری"]],
    ["work", ["کار", "اداری", "برنامه نویسی", "برنامه‌نویسی", "حسابداری"]],
    ["study", ["درس", "دانشگاه", "دانشجویی", "مطالعه", "مدرسه"]],
    ["content", ["تولید محتوا", "ادیت", "تدوین", "طراحی", "فتوشاپ"]],
    ["everyday", ["روزمره", "استفاده معمولی", "مصرف روزانه"]],
    ["travel", ["سفر", "مسافرت"]]
  ];

  const PRIORITY_ALIASES = [
    ["camera", ["دوربین", "عکاسی", "عکس"]],
    ["battery", ["باتری", "شارژدهی", "باتری قوی"]],
    ["performance", ["قدرت", "عملکرد", "سریع", "پردازنده", "پردازش"]],
    ["display", ["صفحه نمایش", "صفحه‌نمایش", "نمایشگر", "کیفیت صفحه"]],
    ["storage", ["حافظه", "فضای ذخیره سازی", "فضای ذخیره‌سازی"]],
    ["ram", ["رم", "ram"]],
    ["price", ["ارزان", "قیمت مناسب", "اقتصادی", "به صرفه", "به‌صرفه"]],
    ["quality", ["کیفیت", "با کیفیت", "باکیفیت"]]
  ];

  const BRAND_ALIASES = [
    ["Samsung", ["سامسونگ", "samsung"]],
    ["Xiaomi", ["شیائومی", "xiaomi", "پوکو", "poco"]],
    ["Apple", ["اپل", "آیفون", "iphone"]],
    ["Lenovo", ["لنوو", "lenovo"]],
    ["ASUS", ["ایسوس", "asus"]],
    ["Acer", ["ایسر", "acer"]]
  ];

  const STOP_WORDS = new Set([
    "میخوام", "می‌خوام", "میخواهم", "می‌خواهم", "میخوام", "میخوامش", "می‌خوامش",
    "دنبال", "برای", "مناسب", "مناسبه", "باشه", "باشد", "یه", "یک", "تا", "زیر",
    "حداکثر", "حدود", "حدودا", "حدوداً", "میلیون", "م", "هزار", "تومان", "ریال",
    "بین", "از", "و", "با", "که", "رو", "را", "من", "می", "کنم", "کنه", "میخوام"
  ]);

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[يى]/g, "ی")
      .replace(/ك/g, "ک")
      .replace(/[\u200c\s_-]+/g, " ")
      .replace(/[۰-۹]/g, function (d) { return String(DIGITS.indexOf(d)); })
      .trim();
  }

  function containsAny(text, aliases) {
    return aliases.some(function (alias) {
      return text.includes(normalizeText(alias));
    });
  }

  function firstHit(text, table) {
    for (let i = 0; i < table.length; i++) {
      if (containsAny(text, table[i][1])) return table[i][0];
    }
    return null;
  }

  function allHits(text, table) {
    return table.filter(function (item) {
      return containsAny(text, item[1]);
    }).map(function (item) { return item[0]; });
  }

  function parseBudget(text) {
    const raw = normalizeText(text);
    const numbers = (raw.match(/\d+(?:\.\d+)?/g) || []).map(Number);
    if (!numbers.length) return null;

    const isRial = /ریال|rials?/.test(raw);
    const isBillion = /میلیارد|billion/.test(raw);
    const isMillion = /میلیون|\bm\b|million/.test(raw);
    const isThousand = /هزار|thousand/.test(raw);
    const multiplier = isRial ? 0.1 : isBillion ? 1000000000 : isMillion ? 10000000 : isThousand ? 1000 : 1;
    const values = numbers.map(function (n) { return Math.round(n * multiplier); });
    const isRange = values.length >= 2 && /تا|بین|الی|-/.test(raw);

    return {
      min: isRange ? Math.min(values[0], values[1]) : null,
      max: isRange ? Math.max(values[0], values[1]) : values[0],
      currency: "toman",
      source: "text",
      confidence: isRial || isMillion || isBillion || isThousand ? 0.98 : 0.82
    };
  }

  function extractKeywords(text) {
    return normalizeText(text)
      .split(/[^\p{L}\p{N}.]+/u)
      .filter(function (token) {
        return token.length > 1 && !STOP_WORDS.has(token) && !/^\d+(?:\.\d+)?$/.test(token);
      })
      .slice(0, 12);
  }

  function buildDecisionElements(text, usage, priorities) {
    const elements = [];
    priorities.forEach(function (item) {
      elements.push({ field: item, type: "priority", importance: 8, source: "text", confidence: 0.9 });
    });
    usage.forEach(function (item) {
      elements.push({ field: item, type: "usage", importance: 7, source: "text", confidence: 0.9 });
    });
    if (/ضد آب|مقاوم در برابر آب|waterproof/.test(text)) {
      elements.push({ field: "water_resistance", type: "requirement", importance: 8, source: "text", confidence: 0.95 });
    }
    return elements;
  }

  function analyze(input) {
    const original = String(input || "").trim();
    if (!original) {
      return {
        version: VERSION,
        input: "",
        intent: "unknown",
        category: null,
        subcategory: null,
        brand: null,
        budget: null,
        usage: [],
        priorities: [],
        requirements: [],
        constraints: [],
        keywords: [],
        decisionElements: [],
        unknown: ["category"],
        confidence: 0,
        ready: false,
        nextAction: "ask_user"
      };
    }

    const text = normalizeText(original);
    const category = firstHit(text, CATEGORY_ALIASES);
    const brand = firstHit(text, BRAND_ALIASES);
    const usage = allHits(text, USAGE_ALIASES);
    const priorities = allHits(text, PRIORITY_ALIASES);
    const budget = parseBudget(text);
    const requirements = [];
    const constraints = [];

    if (/ضد آب|مقاوم در برابر آب|waterproof/.test(text)) requirements.push("water_resistance");
    if (/سبک|وزن کم|کم وزن/.test(text)) priorities.push("lightweight");
    if (/ارزان|اقتصادی|قیمت مناسب|به صرفه|به‌صرفه/.test(text)) priorities.push("price");
    if (/نه|نمیخوام|نمی‌خوام|بدون/.test(text) && /گیمینگ|گیم/.test(text)) constraints.push("gaming");

    const uniquePriorities = Array.from(new Set(priorities));
    const uniqueUsage = Array.from(new Set(usage));
    const uniqueRequirements = Array.from(new Set(requirements));
    const uniqueConstraints = Array.from(new Set(constraints));
    const keywords = extractKeywords(text);
    const unknown = [];
    if (!category) unknown.push("category");
    if (!budget) unknown.push("budget");
    if (!uniqueUsage.length) unknown.push("usage");

    const detected = 3 - unknown.length;
    const confidence = Number((detected / 3).toFixed(2));

    return {
      version: VERSION,
      input: original,
      intent: "purchase",
      category: category,
      subcategory: null,
      brand: brand,
      budget: budget,
      usage: uniqueUsage,
      priorities: uniquePriorities,
      requirements: uniqueRequirements,
      constraints: uniqueConstraints,
      keywords: keywords,
      decisionElements: buildDecisionElements(text, uniqueUsage, uniquePriorities),
      unknown: unknown,
      confidence: confidence,
      ready: unknown.length === 0,
      nextAction: unknown.length === 0 ? "retrieve_products" : "ask_user"
    };
  }

  function merge(previous, input) {
    const current = typeof input === "string" ? analyze(input) : (input || {});
    const base = previous && typeof previous === "object" ? JSON.parse(JSON.stringify(previous)) : analyze("");
    ["category", "brand", "subcategory", "budget"].forEach(function (field) {
      if (current[field] != null) base[field] = current[field];
    });
    ["usage", "priorities", "requirements", "constraints", "keywords", "decisionElements"].forEach(function (field) {
      const oldValues = Array.isArray(base[field]) ? base[field] : [];
      const newValues = Array.isArray(current[field]) ? current[field] : [];
      base[field] = oldValues.concat(newValues.filter(function (value) {
        return !oldValues.some(function (oldValue) {
          return JSON.stringify(oldValue) === JSON.stringify(value);
        });
      }));
    });
    base.input = current.input || base.input || "";
    base.unknown = [];
    if (!base.category) base.unknown.push("category");
    if (!base.budget) base.unknown.push("budget");
    if (!Array.isArray(base.usage) || !base.usage.length) base.unknown.push("usage");
    base.confidence = Number(((3 - base.unknown.length) / 3).toFixed(2));
    base.ready = base.unknown.length === 0;
    base.nextAction = base.ready ? "retrieve_products" : "ask_user";
    base.version = VERSION;
    return base;
  }

  window.DigiYarV5NeedUnderstanding = {
    version: VERSION,
    normalizeText: normalizeText,
    parseBudget: parseBudget,
    analyze: analyze,
    merge: merge
  };
})(window);
