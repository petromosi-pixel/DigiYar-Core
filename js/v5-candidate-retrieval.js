/* =========================================================
   DigiYar V5.1 — Housh Yar Candidate Retrieval
   Phase 2 — retrieve a compact, relevant candidate set from
   the local V5.1 catalog. No provider/API calls.
   This layer retrieves; it does not make the final recommendation.
   ========================================================= */
(function (window) {
  'use strict';
  const VERSION = '5.1.0-alpha.1';
  function normalizeText(value) { return String(value || '').toLowerCase().replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/[\u200c\s_-]+/g, ' ').trim(); }
  const BRAND_ALIASES = { samsung:'سامسونگ', سامسونگ:'سامسونگ', xiaomi:'شیائومی', شیائومی:'شیائومی', apple:'اپل', اپل:'اپل', iphone:'اپل', آیفون:'اپل', huawei:'هواوی', هواوی:'هواوی', honor:'آنر', آنر:'آنر', oneplus:'وان پلاس', 'وان پلاس':'وان پلاس', nokia:'نوکیا', نوکیا:'نوکیا', motorola:'موتورولا', موتورولا:'موتورولا', realme:'ریلمی', ریلمی:'ریلمی', poco:'پوکو', پوکو:'پوکو', google:'گوگل', گوگل:'گوگل', sony:'سونی', سونی:'سونی', asus:'ایسوس', ایسوس:'ایسوس', lenovo:'لنوو', لنوو:'لنوو', acer:'ایسر', ایسر:'ایسر', hp:'اچ پی', 'اچ پی':'اچ پی', 'اچ‌پی':'اچ پی', microsoft:'مایکروسافت', مایکروسافت:'مایکروسافت', doogee:'دوجی', دوجی:'دوجی', zte:'زد تی ای', 'زد تی ای':'زد تی ای', tcl:'tcl', تکنو:'تکنو', tecno:'تکنو' };
  function normalizeBrand(value) { const normalized = normalizeText(value).replace(/\s+/g, ''); const key = Object.keys(BRAND_ALIASES).find(function (alias) { return normalizeText(alias).replace(/\s+/g, '') === normalized; }); return key ? BRAND_ALIASES[key] : normalizeText(value); }
  function tokens(value) { return normalizeText(value).split(/[^\p{L}\p{N}.]+/u).filter(function (item) { return item.length > 1; }); }
  function unique(values) { return Array.from(new Set((Array.isArray(values) ? values : []).filter(Boolean))); }
  function textOf(product) { return normalizeText([product.name, product.brand, product.model, product.subcategory, product.category, Array.isArray(product.keywords) ? product.keywords.join(' ') : ''].join(' ')); }
  function getNeedTokens(need) { return unique([].concat(need && need.keywords || []).concat(need && need.requirements || []).concat(need && need.priorities || []).concat(need && need.usage || []).flatMap(tokens)); }
  function getBudget(need) { const budget = need && need.budget || {}; if (window.DigiYarV5PriceEngine && need && need.input) return window.DigiYarV5PriceEngine.parseBudget(need.input) || budget; return budget; }
  function matchesBudget(product, budget) { const min = Number(budget.min) || 0, max = Number(budget.max) || 0; if (!min && !max) return true; return (product.offers || []).some(function (offer) { const price = Number(offer.priceToman) || 0; return price > 0 && (!min || price >= min) && (!max || price <= max); }); }
  function lexicalScore(product, needTokens) { if (!needTokens.length) return 0; const haystack = textOf(product); let hits = 0; needTokens.forEach(function (token) { if (haystack.includes(token)) hits += 1; }); return hits / needTokens.length; }
  const PRODUCT_TYPE_RULES = { mobile:{includeSubcategories:['گوشی موبایل','گوشی هوشمند','موبایل'],excludeSubcategories:['لوازم جانبی موبایل','تبلت','قطعات موبایل'],nameSignals:['گوشی موبایل','گوشی هوشمند','اسمارت فون']}, laptop:{includeSubcategories:['لپ تاپ','لپ‌تاپ','نوت بوک'],excludeSubcategories:['لوازم جانبی لپ تاپ','کیف لپ تاپ'],nameSignals:['لپ تاپ','لپ‌تاپ','نوت بوک']}, tablet:{includeSubcategories:['تبلت'],excludeSubcategories:['لوازم جانبی تبلت'],nameSignals:['تبلت']} };
  function isProductTypeCompatible(product, category) { const rule = PRODUCT_TYPE_RULES[category]; if (!rule) return true; const subcategory = normalizeText(product.subcategory), name = normalizeText(product.name); if (rule.excludeSubcategories.some(function (x) { return subcategory === normalizeText(x); })) return false; if (rule.includeSubcategories.some(function (x) { return subcategory === normalizeText(x); })) return true; return rule.nameSignals.some(function (x) { return name.includes(normalizeText(x)); }); }
  function retrieve(need, products, options) {
    const settings = options || {}, limit = Math.max(1, Number(settings.limit) || 30), requestedCategory = normalizeText(need && need.category || ''), requestedBrand = normalizeBrand(need && need.brand || ''), needTokens = getNeedTokens(need || {}), budget = getBudget(need || {}), isTargetPrice = budget && budget.mode === 'TARGET_PRICE' && Number(budget.amountToman) > 0;
    const diagnostics = { inputCategory:requestedCategory || null, inputBrand:requestedBrand || null, inputBudget:budget || null, priceMode:budget && budget.mode || null, targetPriceToman:isTargetPrice ? Number(budget.amountToman) : null, totalCatalogProducts:Array.isArray(products) ? products.length : 0, categoryMatches:0, productTypeMatches:0, brandMatches:0, budgetMatches:0, keywordMatches:0, returned:0, rejected:{category:0,productType:0,brand:0,budget:0,relevance:0}, priceRanking:[] };
    const candidates=[];
    (Array.isArray(products)?products:[]).forEach(function(product){
      if(!product||!product.id)return;
      if(requestedCategory&&normalizeText(product.category)!==requestedCategory){diagnostics.rejected.category++;return;} diagnostics.categoryMatches++;
      if(!isProductTypeCompatible(product,requestedCategory)){diagnostics.rejected.productType++;return;} diagnostics.productTypeMatches++;
      if(requestedBrand&&normalizeBrand(product.brand)!==requestedBrand){diagnostics.rejected.brand++;return;} diagnostics.brandMatches++;
      if(!isTargetPrice&&!matchesBudget(product,budget)){diagnostics.rejected.budget++;return;} diagnostics.budgetMatches++;
      const relevance=lexicalScore(product,needTokens); if(needTokens.length&&relevance===0){diagnostics.rejected.relevance++;return;} if(relevance>0)diagnostics.keywordMatches++;
      candidates.push({product:product,retrievalScore:Number(relevance.toFixed(4)),matchedTokens:needTokens.filter(function(token){return textOf(product).includes(token);})});
    });
    if(isTargetPrice&&window.DigiYarV5PriceEngine){
      const ranked=window.DigiYarV5PriceEngine.rankByTarget(candidates.map(function(item){return item.product;}),Number(budget.amountToman),Math.min(3,limit));
      const rankMap=new Map(ranked.map(function(item){return [String(item.product.id),item];}));
      candidates.sort(function(a,b){const ar=rankMap.get(String(a.product.id)),br=rankMap.get(String(b.product.id)); if(ar&&br)return ar.pricePriority-br.pricePriority; if(ar)return -1; if(br)return 1; return b.retrievalScore-a.retrievalScore;});
      diagnostics.priceRanking=ranked.map(function(item){return {productId:item.product.id,priceToman:item.price,distanceToman:item.priceDistance,priority:item.pricePriority};});
    } else candidates.sort(function(a,b){if(b.retrievalScore!==a.retrievalScore)return b.retrievalScore-a.retrievalScore; const ap=a.product.bestOffer&&a.product.bestOffer.priceToman||Infinity,bp=b.product.bestOffer&&b.product.bestOffer.priceToman||Infinity; return ap-bp;});
    diagnostics.returned=Math.min(candidates.length,limit);
    return {version:VERSION,ready:Boolean(need&&need.category),count:diagnostics.returned,candidates:candidates.slice(0,limit),diagnostics:diagnostics};
  }
  async function find(need,options){const settings=options||{};if(!window.DigiYarV5CatalogAdapter)throw Error('DigiYarV5CatalogAdapter is required');const products=await window.DigiYarV5CatalogAdapter.getProducts({categories:settings.categories});return retrieve(need||{},products,settings);}
  window.DigiYarV5CandidateRetrieval={version:VERSION,normalizeText:normalizeText,normalizeBrand:normalizeBrand,retrieve:retrieve,find:find,isProductTypeCompatible:isProductTypeCompatible};
})(window);
