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

  const BRAND_ALIASES = {
    samsung: 'سامسونگ', سامسونگ: 'سامسونگ', xiaomi: 'شیائومی', شیائومی: 'شیائومی',
    apple: 'اپل', اپل: 'اپل', iphone: 'اپل', آیفون: 'اپل', huawei: 'هواوی', هواوی: 'هواوی',
    honor: 'آنر', آنر: 'آنر', oneplus: 'وان پلاس', 'وان پلاس': 'وان پلاس', nokia: 'نوکیا', نوکیا: 'نوکیا',
    motorola: 'موتورولا', موتورولا: 'موتورولا', realme: 'ریلمی', ریلمی: 'ریلمی', poco: 'پوکو', پوکو: 'پوکو',
    google: 'گوگل', گوگل: 'گوگل', sony: 'سونی', سونی: 'سونی', asus: 'ایسوس', ایسوس: 'ایسوس',
    lenovo: 'لنوو', لنوو: 'لنوو', acer: 'ایسر', ایسر: 'ایسر', hp: 'اچ پی', 'اچ پی': 'اچ پی',
    'اچ‌پی': 'اچ پی', microsoft: 'مایکروسافت', مایکروسافت: 'مایکروسافت', doogee: 'دوجی', دوجی: 'دوجی',
    zte: 'زد تی ای', 'زد تی ای': 'زد تی ای', tcl: 'tcl', تکنو: 'تکنو', tecno: 'تکنو'
  };

  function normalizeBrand(value) {
    const normalized = normalizeText(value).replace(/\s+/g, '');
    const key = Object.keys(BRAND_ALIASES).find(function (alias) {
      return normalizeText(alias).replace(/\s+/g, '') === normalized;
    });
    return key ? BRAND_ALIASES[key] : normalizeText(value);
  }

  function tokens(value) {
    return normalizeText(value).split(/[^\p{L}\p{N}.]+/u).filter(function (item) { return item.length > 1; });
  }

  function unique(values) {
    return Array.from(new Set((Array.isArray(values) ? values : []).filter(Boolean)));
  }

  function textOf(product) {
    return normalizeText([
      product.name, product.brand, product.model, product.subcategory, product.category,
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
    needTokens.forEach(function (token) { if (haystack.includes(token)) hits += 1; });
    return hits / needTokens.length;
  }

  // Category files are broad buckets. Enforce the requested product type inside
  // those buckets so accessories cannot masquerade as the requested product.
  const PRODUCT_TYPE_RULES = {
    mobile: {
      includeSubcategories: ['گوشی موبایل', 'گوشی هوشمند', 'موبایل'],
      excludeSubcategories: ['لوازم جانبی موبایل', 'تبلت', 'قطعات موبایل'],
      nameSignals: ['گوشی موبایل', 'گوشی هوشمند', 'اسمارت فون']
    },
    laptop: {
      includeSubcategories: ['لپ تاپ', 'لپ‌تاپ', 'نوت بوک'],
      excludeSubcategories: ['لوازم جانبی لپ تاپ', 'کیف لپ تاپ'],
      nameSignals: ['لپ تاپ', 'لپ‌تاپ', 'نوت بوک']
    },
    tablet: {
      includeSubcategories: ['تبلت'],
      excludeSubcategories: ['لوازم جانبی تبلت'],
      nameSignals: ['تبلت']
    }
  };

  function isProductTypeCompatible(product, category) {
    const rule = PRODUCT_TYPE_RULES[category];
    if (!rule) return true;
    const subcategory = normalizeText(product.subcategory);
    const name = normalizeText(product.name);
    if (rule.excludeSubcategories.some(function (x) { return subcategory === normalizeText(x); })) return false;
    if (rule.includeSubcategories.some(function (x) { return subcategory === normalizeText(x); })) return true;
    return rule.nameSignals.some(function (x) { return name.includes(normalizeText(x)); });
  }

  function retrieve(need, products, options) {
    const settings = options || {};
    const limit = Math.max(1, Number(settings.limit) || 30);
    const requestedCategory = normalizeText(need && need.category || '');
    const requestedBrand = normalizeBrand(need && need.brand || '');
    const needTokens = getNeedTokens(need || {});
    const diagnostics = {
      inputCategory: requestedCategory || null,
      inputBrand: requestedBrand || null,
      inputBudget: need && need.budget || null,
      totalCatalogProducts: Array.isArray(products) ? products.length : 0,
      categoryMatches: 0,
      productTypeMatches: 0,
      brandMatches: 0,
      budgetMatches: 0,
      keywordMatches: 0,
      returned: 0,
      rejected: { category: 0, productType: 0, brand: 0, budget: 0, relevance: 0 }
    };

    const candidates = [];
    (Array.isArray(products) ? products : []).forEach(function (product) {
      if (!product || !product.id) return;

      if (requestedCategory && normalizeText(product.category) !== requestedCategory) {
        diagnostics.rejected.category += 1;
        return;
      }
      diagnostics.categoryMatches += 1;

      if (!isProductTypeCompatible(product, requestedCategory)) {
        diagnostics.rejected.productType += 1;
        return;
      }
      diagnostics.productTypeMatches += 1;

      if (requestedBrand && normalizeBrand(product.brand) !== requestedBrand) {
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
        matchedTokens: needTokens.filter(function (token) { return textOf(product).includes(token); })
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
    if (!window.DigiYarV5CatalogAdapter) throw Error('DigiYarV5CatalogAdapter is required');
    const products = await window.DigiYarV5CatalogAdapter.getProducts({ categories: settings.categories });
    return retrieve(need || {}, products, settings);
  }

  window.DigiYarV5CandidateRetrieval = {
    version: VERSION,
    normalizeText: normalizeText,
    normalizeBrand: normalizeBrand,
    retrieve: retrieve,
    find: find,
    isProductTypeCompatible: isProductTypeCompatible
  };
})(window);
