/**
 * DigiYar — Need Integration Engine
 * V4 — Build 5 — Alpha 1
 *
 * وظیفه:
 * اتصال خروجی Answer Interpreter به Need موجود
 * بدون از بین بردن اطلاعات قبلی.
 */

const DigiyarNeedIntegration = (() => {

  const VERSION = "4.0.0-alpha.1";

  /**
   * Deep clone ساده برای جلوگیری از تغییر مستقیم آبجکت اصلی
   */
  function clone(value) {
    return value === undefined
      ? undefined
      : JSON.parse(JSON.stringify(value));
  }

  /**
   * بررسی معتبر بودن مقدار
   */
  function hasValue(value) {
    if (value === null || value === undefined) return false;

    if (typeof value === "string") {
      return value.trim().length > 0;
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (typeof value === "object") {
      return Object.keys(value).length > 0;
    }

    return true;
  }

  /**
   * حذف یک مورد از unknown
   */
  function removeUnknown(unknown, field) {
    if (!Array.isArray(unknown)) return [];

    return unknown.filter(item => item !== field);
  }

  /**
   * Merge اطلاعات Answer Interpreter با Need قبلی
   */
  function mergeAnswer(need, answer) {

    const result = clone(need) || {};

    result.version = result.version || "4.0.0-alpha.3";

    if (!Array.isArray(result.unknown)) {
      result.unknown = [];
    }

    if (!Array.isArray(result.usage)) {
      result.usage = [];
    }

    if (!Array.isArray(result.decisionElements)) {
      result.decisionElements = [];
    }

    if (!Array.isArray(result.tradeoffs)) {
      result.tradeoffs = [];
    }

    // اگر پاسخ نامعتبر باشد، Need قبلی بدون تغییر حفظ می‌شود
    if (!answer || answer.understood !== true) {
      return result;
    }

    const type = answer.type;
    const value = clone(answer.value);

    if (!hasValue(value)) {
      return result;
    }

    // -----------------------------------------
    // CATEGORY
    // -----------------------------------------
    if (type === "category") {

      result.category = value;

      result.unknown = removeUnknown(
        result.unknown,
        "category"
      );
    }

    // -----------------------------------------
    // BUDGET
    // -----------------------------------------
    else if (type === "budget") {

      result.budget = value;

      result.unknown = removeUnknown(
        result.unknown,
        "budget"
      );
    }

    // -----------------------------------------
    // USAGE
    // -----------------------------------------
    else if (type === "usage") {

      const usages = Array.isArray(value)
        ? value
        : [value];

      usages.forEach(item => {
        if (
          hasValue(item) &&
          !result.usage.includes(item)
        ) {
          result.usage.push(item);
        }
      });

      if (result.usage.length > 0) {
        result.unknown = removeUnknown(
          result.unknown,
          "usage"
        );
      }
    }

    // -----------------------------------------
    // DECISION ELEMENT
    // -----------------------------------------
    else if (type === "decisionElement") {

      if (typeof value === "object" && value.field) {

        const existingIndex =
          result.decisionElements.findIndex(
            item => item.field === value.field
          );

        if (existingIndex >= 0) {
          result.decisionElements[existingIndex] = {
            ...result.decisionElements[existingIndex],
            ...value
          };
        } else {
          result.decisionElements.push(value);
        }
      }
    }

    // -----------------------------------------
    // UNKNOWN / UNSUPPORTED
    // -----------------------------------------
    else {
      return result;
    }

    return result;
  }

  /**
   * محاسبه مجدد وضعیت Need
   */
  function evaluate(need) {

    const result = clone(need) || {};

    const missing = [];

    if (!hasValue(result.category)) {
      missing.push("category");
    }

    if (!hasValue(result.budget)) {
      missing.push("budget");
    }

    if (
      !Array.isArray(result.usage) ||
      result.usage.length === 0
    ) {
      missing.push("usage");
    }

    result.unknown = missing;

    if (missing.length === 0) {

      result.confidence = 1;
      result.ready = true;
      result.nextAction = "retrieve_products";

    } else {

      result.ready = false;
      result.nextAction = "ask_user";

      /*
       * Confidence پایه بر اساس تعداد
       * فیلدهای اصلی تکمیل‌شده
       */
      const completed =
        3 - missing.length;

      result.confidence =
        Number((completed / 3).toFixed(2));
    }

    return result;
  }

  /**
   * نقطه ورود اصلی
   *
   * need   = Need فعلی
   * answer = خروجی Answer Interpreter
   */
  function integrate(need, answer) {

    const merged = mergeAnswer(
      need,
      answer
    );

    return evaluate(merged);
  }

  return {
    VERSION,
    integrate,
    mergeAnswer,
    evaluate
  };

})();

// سازگاری با مرورگر
if (typeof window !== "undefined") {
  window.DigiyarNeedIntegration =
    DigiyarNeedIntegration;
}
