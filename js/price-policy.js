/* =========================================================
   DigiYar V4 — Unified Price Policy
   Canonical internal unit: Toman
   Supported planning range: 15M .. 500M Toman
   ========================================================= */
(function (window) {
  "use strict";

  const PRICE_POLICY = {
    version: "4.0.0-alpha.1",
    currency: "IRR_TOMAN",
    minPlanningBudget: 15000000,
    maxPlanningBudget: 500000000
  };

  function digits(value) {
    return String(value || "")
      .replace(/[۰-۹]/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹".indexOf(d); })
      .replace(/[٠-٩]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩".indexOf(d); });
  }

  function parseNumber(value) {
    const text = digits(value)
      .replace(/,/g, "")
      .replace(/٬/g, "")
      .replace(/٫/g, ".")
      .replace(/\s+/g, " ")
      .trim();
    const match = text.match(/\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : null;
  }

  function unitOf(text) {
    const value = String(text || "").toLowerCase();
    if (/ریال|ريال|rials?/.test(value)) return "rial";
    if (/میلیارد|billion/.test(value)) return "billion_toman";
    if (/میلیون|million/.test(value)) return "million_toman";
    if (/هزار|thousand/.test(value)) return "thousand_toman";
    return "toman";
  }

  function toToman(value, unit) {
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) return null;
    switch (unit) {
      case "rial": return number / 10;
      case "billion_toman": return number * 1000000000;
      case "million_toman": return number * 1000000;
      case "thousand_toman": return number * 1000;
      default: return number;
    }
  }

  function parseBudget(text) {
    const raw = String(text || "").trim();
    if (!raw) return null;

    const normalized = digits(raw)
      .replace(/,/g, "")
      .replace(/٬/g, "")
      .replace(/٫/g, ".");

    const numbers = (normalized.match(/\d+(?:\.\d+)?/g) || []).map(Number);
    if (!numbers.length) return null;

    const unit = unitOf(normalized);
    const multiplier = {
      rial: 0.1,
      billion_toman: 1000000000,
      million_toman: 1000000,
      thousand_toman: 1000,
      toman: 1
    }[unit];

    const values = numbers.map(function (n) { return n * multiplier; });
    const isRange = numbers.length >= 2 && /تا|بین|الی|-/.test(normalized);

    let min = null;
    let max = values[0];

    if (isRange) {
      min = Math.min(values[0], values[1]);
      max = Math.max(values[0], values[1]);
    }

    return {
      min: min,
      max: max,
      type: "hard_constraint",
      source: "declared",
      confidence: unit === "toman" ? 0.95 : 0.99,
      currency: "toman",
      planningRange: {
        min: PRICE_POLICY.minPlanningBudget,
        max: PRICE_POLICY.maxPlanningBudget,
        withinRange: max >= PRICE_POLICY.minPlanningBudget && max <= PRICE_POLICY.maxPlanningBudget
      }
    };
  }

  /* Digikala's API price fields are Rial. Local/future adapters may already
     provide Toman; an explicit unit is preferred, otherwise use the live
     Digikala source convention. */
  function productPriceToToman(value, source, unit) {
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0) return 0;
    if (unit === "rial") return number / 10;
    if (unit === "toman") return number;
    if (String(source || "").toLowerCase() === "digikala" && number >= 1000000) {
      return number / 10;
    }
    return number;
  }

  function normalizeBudgetObject(budget) {
    if (!budget || typeof budget !== "object") return null;
    const min = budget.min == null ? null : Number(budget.min);
    const max = budget.max == null ? null : Number(budget.max);
    if (max != null && !Number.isFinite(max)) return null;
    return Object.assign({}, budget, {
      min: min,
      max: max,
      currency: "toman"
    });
  }

  window.DigiYarPricePolicy = {
    config: PRICE_POLICY,
    digits: digits,
    parseNumber: parseNumber,
    parseBudget: parseBudget,
    toToman: toToman,
    productPriceToToman: productPriceToToman,
    normalizeBudgetObject: normalizeBudgetObject
  };
})(window);
