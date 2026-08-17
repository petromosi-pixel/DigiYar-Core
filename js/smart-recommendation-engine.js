/* =========================================================
   DigiYar V4
   Smart Recommendation Engine
   Build 12 — Retrieval integrated
   ========================================================= */
(function () {
  "use strict";

  const VERSION = "4.0.0-alpha.5";
  const DEFAULT_LIMIT = 3;
  const MAX_PRODUCTS = 50;

  function safeNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function clone(value) {
    try { return JSON.parse(JSON.stringify(value)); }
    catch (error) { return value || null; }
  }

  function toArray(value) {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === "string") {
      return value.split(/[،,]/).map(function (v) { return v.trim(); }).filter(Boolean);
    }
    return [];
  }

  function normalizeText(value) {
    return String(value || "").trim().toLowerCase().replace(/ي/g, "ی").replace(/ك/g, "ک");
  }

  function needValues(need) {
    const declared = need && need.declared ? need.declared : {};
    const context = need && need.context ? need.context : {};
    return {
      category: need && need.category ? need.category : declared.category || "",
      usage: toArray(context.usage || need.usage || declared.usage),
      priorities: toArray(need.priorities || declared.priorities),
      requirements: toArray(need.requirements || declared.requirements),
      constraints: toArray(need.constraints || declared.constraints)
    };
  }

  function buildSearchQuery(need) {
    const values = needValues(need);
    const categoryMap = {
      mobile: "گوشی موبایل",
      laptop: "لپ تاپ",
      tablet: "تبلت",
      general: "محصول دیجیتال"
    };
    const parts = [];
    parts.push(categoryMap[normalizeText(values.category)] || values.category);
    values.usage.slice(0, 2).forEach(function (v) { parts.push(v); });
    values.priorities.slice(0, 3).forEach(function (v) { parts.push(v); });
    values.requirements.slice(0, 2).forEach(function (v) { parts.push(v); });
    return parts.filter(Boolean).join(" ").trim();
  }

  function normalizeProducts(products) {
    return Array.isArray(products) ? products.slice(0, MAX_PRODUCTS).filter(function (p) { return p && typeof p === "object"; }) : [];
  }

  function scoreProduct(product, need) {
    const scoring = window.DigiYarProductScoring;
    if (!scoring) return { score: 0, reasons: [] };
    try {
      let result = null;
      if (typeof scoring.score === "function") result = scoring.score(product, need);
      else if (typeof scoring.scoreProduct === "function") result = scoring.scoreProduct(product, need);
      else if (typeof scoring.calculateScore === "function") result = scoring.calculateScore(product, need);
      if (typeof result === "number") return { score: safeNumber(result), reasons: [] };
      if (!result || typeof result !== "object") return { score: 0, reasons: [] };
      return {
        score: safeNumber(result.score ?? result.totalScore ?? result.finalScore ?? result.value),
        reasons: Array.isArray(result.reasons) ? result.reasons.filter(Boolean) : Array.isArray(result.explanations) ? result.explanations.filter(Boolean) : []
      };
    } catch (error) {
      console.warn("DigiYar Product Scoring:", error);
      return { score: 0, reasons: [] };
    }
  }

  function basicSignals(product, need) {
    const values = needValues(need);
    const text = JSON.stringify(product).toLowerCase();
    let bonus = 0;
    if (normalizeText(product.category) === normalizeText(values.category)) bonus += 10;
    const price = safeNumber(product.price);
    const max = safeNumber(need && need.budget && need.budget.max);
    const min = safeNumber(need && need.budget && need.budget.min);
    if (max > 0 && price > 0 && price <= max) bonus += 15;
    if (min > 0 && price >= min) bonus += 5;
    if (max > 0 && price > max) bonus -= 15;
    values.usage.forEach(function (v) { if (normalizeText(v) && text.includes(normalizeText(v))) bonus += 10; });
    values.priorities.forEach(function (v) { if (normalizeText(v) && text.includes(normalizeText(v))) bonus += 7; });
    values.requirements.forEach(function (v) { if (normalizeText(v) && text.includes(normalizeText(v))) bonus += 8; });
    return bonus;
  }

  function rankProducts(products, need) {
    return normalizeProducts(products).map(function (product, index) {
      const scoring = scoreProduct(product, need);
      const fallback = basicSignals(product, need);
      return { product: product, score: scoring.score > 0 ? scoring.score : fallback, reasons: scoring.reasons, originalIndex: index, rank: 0 };
    }).sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      const priceA = safeNumber(a.product.price);
      const priceB = safeNumber(b.product.price);
      if (priceA !== priceB) return priceA - priceB;
      return a.originalIndex - b.originalIndex;
    }).map(function (item, index) {
      item.rank = index + 1;
      return item;
    });
  }

  async function getProducts(need, suppliedProducts, options) {
    if (Array.isArray(suppliedProducts) && suppliedProducts.length) return { products: normalizeProducts(suppliedProducts), source: "supplied" };

    const retrieval = window.DigiYarProductRetrieval;
    const query = buildSearchQuery(need);

    if (retrieval && typeof retrieval.search === "function" && query) {
      try {
        const results = await retrieval.search(query, options || {});
        if (Array.isArray(results) && results.length) return { products: normalizeProducts(results), source: "retrieval" };
      } catch (error) {
        console.warn("DigiYar Product Retrieval:", error);
      }
    }

    if (window.DigiYarProductData && typeof window.DigiYarProductData.getAll === "function") {
      return { products: normalizeProducts(window.DigiYarProductData.getAll()), source: "local-fallback" };
    }

    return { products: [], source: "none" };
  }

  async function recommend(need, productsOrOptions, maybeOptions) {
    let suppliedProducts = null;
    let options = {};
    if (Array.isArray(productsOrOptions)) {
      suppliedProducts = productsOrOptions;
      options = maybeOptions || {};
    } else if (productsOrOptions && typeof productsOrOptions === "object") {
      options = productsOrOptions;
    }

    if (!window.DigiYarProductScoring) return { version: VERSION, status: "error", need: clone(need), recommendations: [], count: 0, error: "Product Scoring Engine is not available." };
    if (!need || !need.category) return { version: VERSION, status: "waiting_for_answer", need: clone(need), recommendations: [], count: 0, error: null };

    const result = await getProducts(need, suppliedProducts, options);
    if (!result.products.length) return { version: VERSION, status: "no_products", need: clone(need), products: [], rankedProducts: [], recommendations: [], count: 0, error: null };

    const rankedProducts = rankProducts(result.products, need);
    const limit = Math.max(1, safeNumber(options.limit || DEFAULT_LIMIT));
    const recommendations = rankedProducts.slice(0, limit).map(function (item) {
      return Object.assign({}, item.product, { rank: item.rank, score: item.score, reasons: item.reasons, retrievalSource: result.source });
    });

    return {
      version: VERSION,
      status: "recommendations_ready",
      source: result.source,
      query: buildSearchQuery(need),
      need: clone(need),
      products: result.products,
      rankedProducts: rankedProducts,
      recommendations: recommendations,
      count: recommendations.length,
      totalProducts: result.products.length,
      error: null
    };
  }

  function explain(recommendation) {
    if (recommendation && Array.isArray(recommendation.reasons) && recommendation.reasons.length) return recommendation.reasons.join("؛ ");
    return "این محصول بر اساس تطبیق با نیاز و اولویت‌های انتخابی رتبه‌بندی شده است.";
  }

  const api = {
    version: VERSION,
    dependenciesReady: function () { return !!window.DigiYarProductScoring; },
    isNeedReady: function (need) { return !!need && !!need.category; },
    buildSearchQuery: buildSearchQuery,
    rankProducts: rankProducts,
    recommend: recommend,
    explain: explain
  };

  window.DigiYarSmartRecommendation = api;
  window.DigiYarSmartRecommendationEngine = api;
})();
