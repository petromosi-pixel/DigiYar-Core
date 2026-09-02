/* =========================================================
   DigiYar V5.1 — Housh Yar Candidate Retrieval
   Phase 2 — retrieve a compact, relevant candidate set from
   the local V5.1 catalog. No provider/API calls.
   This layer retrieves; it does not make the final recommendation.
   ========================================================= */
(function (window) {
  'use strict';

  const VERSION = '5.1.0-alpha.1';

  function normalizeText(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[يى]/g, 'ی')
      .replace(/ك/g, 'ک')
      .replace(/[\u200c\s_-]+/g, ' ')
      .trim();
  }

  function tokens(value) {
    return normalizeText(value)
      .split(/[^\p{L}\p{N}.]+/u)
      .filter(function (item) { return item.length > 1; });
  }

  function unique(values) {
    return Array.from(new Set((Array.isArray(values) ? values : []).filter(Boolean)));
  }

  function textOf(product) {
    return normalizeText([
      product.name,
      product.brand,
      product.model,
      product.subcategory,
      product.category,
      Array.isArray(product.keywords) ? product.keywords.join(' ') : ''
    ].join(' '));
  }

  function getNeedTokens(need) {
    const values = []
      .concat(need && need.keywords || [])
      .concat(need && need.requirements || [])
      .concat(need && need.priorities || [])
      .concat(need && need.usage || []);
    return unique(values.flatMap(tokens));
  }

  function matchesBudget(product, need) {
    const budget = need && need.budget || {};
    const min = Number(budget.min) || 0;
    const max = Number(budget.max) || 0;
    if (!min && !max) return true;
    return (product.offers || []).some(function (offer) {
      const price = Number(offer.priceToman) || 0;
      if (!price) return false;
      if (min && price < min) return false;
      if (max && price > max) return false;
      return true;
    });
  }

  function lexicalScore(product, needTokens) {
    if (!needTokens.length) return 0;
    const haystack = textOf(product);
    let hits = 0;
    needTokens.forEach(function (token) {
      if (haystack.includes(token)) hits += 1;
    });
    return hits / needTokens.length;
  }

  function retrieve(need, products, options) {
    const settings = options || {};
    const limit = Math.max(1, Number(settings.limit) || 30);
    const requestedCategory = normalizeText(need && need.category || '');
    const requestedBrand = normalizeText(need && need.brand || '');
    const needTokens = getNeedTokens(need || {});
    const diagnostics = {
      inputCategory: requestedCategory || null,
      inputBrand: requestedBrand || null,
      inputBudget: need && need.budget || null,
      totalCatalogProducts: Array.isArray(products) ? products.length : 0,
      categoryMatches: 0,
      brandMatches: 0,
      budgetMatches: 0,
      keywordMatches: 0,
      returned: 0,
      rejected: { category: 0, brand: 0, budget: 0, relevance: 0 }
    };

    const candidates = [];
    (Array.isArray(products) ? products : []).forEach(function (product) {
      if (!product || !product.id) return;

      if (requestedCategory && normalizeText(product.category) !== requestedCategory) {
        diagnostics.rejected.category += 1;
        return;
      }
      diagnostics.categoryMatches += 1;

      if (requestedBrand && normalizeText(product.brand) !== requestedBrand) {
        diagnostics.rejected.brand += 1;
        return;
      }
      diagnostics.brandMatches += 1;

      if (!matchesBudget(product, need || {})) {
        diagnostics.rejected.budget += 1;
        return;
      }
      diagnostics.budgetMatches += 1;

      const relevance = lexicalScore(product, needTokens);
      if (needTokens.length && relevance === 0) {
        diagnostics.rejected.relevance += 1;
        return;
      }
      if (relevance > 0) diagnostics.keywordMatches += 1;

      candidates.push({
        product: product,
        retrievalScore: Number(relevance.toFixed(4)),
        matchedTokens: needTokens.filter(function (token) {
          return textOf(product).includes(token);
        })
      });
    });

    candidates.sort(function (a, b) {
      if (b.retrievalScore !== a.retrievalScore) return b.retrievalScore - a.retrievalScore;
      const aPrice = a.product.bestOffer && a.product.bestOffer.priceToman || Infinity;
      const bPrice = b.product.bestOffer && b.product.bestOffer.priceToman || Infinity;
      return aPrice - bPrice;
    });

    diagnostics.returned = Math.min(candidates.length, limit);

    return {
      version: VERSION,
      ready: Boolean(need && need.category),
      count: diagnostics.returned,
      candidates: candidates.slice(0, limit),
      diagnostics: diagnostics
    };
  }

  async function find(need, options) {
    const settings = options || {};
    if (!window.DigiYarV5CatalogAdapter) {
      throw Error('DigiYarV5CatalogAdapter is required');
    }

    const products = await window.DigiYarV5CatalogAdapter.getProducts({
      categories: settings.categories
    });

    return retrieve(need || {}, products, settings);
  }

  window.DigiYarV5CandidateRetrieval = {
    version: VERSION,
    normalizeText: normalizeText,
    retrieve: retrieve,
    find: find
  };
})(window);
