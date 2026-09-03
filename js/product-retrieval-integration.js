/* =========================================================
   DigiYar V5.1 — Product Retrieval Integration
   Candidate Retrieval -> Product URL -> Live Resolver -> Offer
   ========================================================= */
(function (window) {
  'use strict';

  const VERSION = '5.1.0-alpha.1';
  const DEFAULT_RESOLVER = 'https://digiyar-v5.petromosi.workers.dev/api/resolve';

  function clone(value) { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)); }
  function hasValue(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  }
  function isNeedReady(need) { return !!(need && hasValue(need.category) && hasValue(need.budget) && Array.isArray(need.usage) && need.usage.length); }

  function categoryQuery(category) {
    const map = { mobile:'گوشی موبایل', laptop:'لپ تاپ', tablet:'تبلت', tv:'تلویزیون', camera:'دوربین', headphones:'هدفون', smartwatch:'ساعت هوشمند', monitor:'مانیتور', general:'محصول' };
    return map[String(category || '').toLowerCase()] || String(category || 'محصول');
  }
  function usageQuery(usage) {
    const map = { photography:'دوربین عکاسی فیلمبرداری', gaming:'گیمینگ بازی', work:'کار اداری', study:'دانشجویی مطالعه', battery:'باتری', travel:'سفر', music:'موسیقی' };
    return map[String(usage || '').toLowerCase()] || String(usage || '');
  }
  function buildQuery(need) {
    if (!need) return '';
    const parts = [categoryQuery(need.category)];
    (Array.isArray(need.usage) ? need.usage : []).forEach(function (item) { const q = usageQuery(item); if (q && !parts.includes(q)) parts.push(q); });
    const fieldMap = { camera:'دوربین', battery:'باتری', display:'نمایشگر', performance:'پردازنده' };
    (Array.isArray(need.decisionElements) ? need.decisionElements : []).forEach(function (e) { if (!e || !e.field) return; const q = fieldMap[e.field] || String(e.field); if (q && !parts.includes(q)) parts.push(q); });
    return parts.join(' ').trim();
  }

  function unwrap(data) {
    let payload = data;
    if (payload && payload.data && typeof payload.data === 'object') payload = payload.data;
    if (payload && payload.data && typeof payload.data === 'object') payload = payload.data;
    return payload;
  }
  function extractRawProducts(data) {
    const payload = unwrap(data); if (!payload) return [];
    const candidates = [payload.products, payload.items, payload.data && payload.data.products, payload.data && payload.data.items, payload.products && payload.products.data, payload.products && payload.products.items];
    for (let i = 0; i < candidates.length; i++) if (Array.isArray(candidates[i])) return candidates[i];
    return [];
  }
  async function fetchJson(url, timeout) {
    const controller = new AbortController(); const timer = setTimeout(function () { controller.abort(); }, timeout || 8000);
    try {
      const response = await fetch(url, { method:'GET', headers:{ Accept:'application/json' }, signal:controller.signal });
      const text = await response.text(); let data = null; try { data = JSON.parse(text); } catch (e) { data = { raw:text }; }
      return { response:response, data:data, text:text };
    } finally { clearTimeout(timer); }
  }

  async function diagnose(query) {
    const retrieval = window.DigiYarProductRetrieval, config = retrieval && retrieval.config ? retrieval.config : {};
    const result = { query:query || '', source:'none', httpStatus:null, rawCount:0, normalizedCount:0, pricedCount:0, products:[], error:null, upstreamStatus:null };
    const endpoints = [];
    if (config.proxyEndpoint) endpoints.push({ name:'proxy', url:String(config.proxyEndpoint).replace(/\/$/,'') + '?q=' + encodeURIComponent(query) });
    if (config.digikalaSearchEndpoint) endpoints.push({ name:'digikala', url:config.digikalaSearchEndpoint + encodeURIComponent(query) });
    for (let i = 0; i < endpoints.length; i++) {
      try {
        const packet = await fetchJson(endpoints[i].url, config.timeout || 8000), body = packet.data || {};
        result.httpStatus = packet.response.status; result.upstreamStatus = body.status || null;
        if (!packet.response.ok) { result.error = body.error || ('HTTP ' + packet.response.status); continue; }
        const raw = extractRawProducts(body); result.source = endpoints[i].name; result.rawCount = raw.length;
        if (retrieval && typeof retrieval.normalizeProduct === 'function') result.products = raw.map(function (p) { return retrieval.normalizeProduct(p, { currency:'rial', store:'digikala' }); }).filter(function (p) { return p && p.name; });
        result.normalizedCount = result.products.length; result.pricedCount = result.products.filter(function (p) { return Number(p.price) > 0; }).length;
        if (raw.length || endpoints[i].name === 'proxy') return result;
      } catch (error) { result.error = error && error.message ? error.message : String(error); }
    }
    return result;
  }

  function resolverEndpoint() {
    const retrieval = window.DigiYarProductRetrieval, endpoint = retrieval && retrieval.config && retrieval.config.resolverEndpoint;
    if (endpoint) return String(endpoint).replace(/\/$/, '');
    if (retrieval && retrieval.config && retrieval.config.proxyEndpoint) return String(retrieval.config.proxyEndpoint).replace(/\/api\/search\/?$/, '/api/resolve');
    return DEFAULT_RESOLVER;
  }

  async function resolveCandidate(item, timeout) {
    const product = item && item.product ? item.product : item;
    const url = product && (product.productUrl || product.url || product.sourceUrl);
    if (!url) return null;
    const packet = await fetchJson(resolverEndpoint() + '?url=' + encodeURIComponent(url), timeout || 10000);
    if (!packet.response.ok || !packet.data || !packet.data.resolved) return null;
    const r = packet.data;
    const previous = product.bestOffer || (Array.isArray(product.offers) ? product.offers[0] : null) || {};
    const offer = {
      id: String(previous.id || product.id || ''), productId:String(product.id || product.productId || ''),
      storeId:String(previous.storeId || product.sourceId || product.source || ''), storeName:previous.storeName || product.source || '',
      price:Number(r.price || 0), priceToman:Number(r.priceToman || 0), currency:r.currency || 'IRT',
      availability:r.availability || 'unknown', available:r.availability === 'in_stock',
      productUrl:r.productUrl || url, affiliateUrl:previous.affiliateUrl || '', source:product.source || previous.source || '', observedAt:new Date().toISOString()
    };
    return Object.assign({}, product, { price:offer.priceToman, currency:offer.currency, availability:offer.availability, productUrl:offer.productUrl, offers:[offer], bestOffer:offer.available && offer.priceToman > 0 ? offer : null, resolver:{ resolved:true, extraction:r.extraction || 'unknown' } });
  }

  function applyLiveBudget(products, budget) {
    const mode = budget && budget.mode || '';
    if (mode !== 'MAX_PRICE') return products;
    const min = Number(budget.min) || 0, max = Number(budget.max) || 0;
    return products.filter(function (p) { const price = Number(p.bestOffer && p.bestOffer.priceToman) || 0; return price > 0 && (!min || price >= min) && (!max || price <= max); });
  }

  function rankResolved(products, need) {
    const budget = need && need.budget || {};
    if (budget.mode === 'TARGET_PRICE' && Number(budget.amountToman) > 0 && window.DigiYarV5PriceEngine) {
      return window.DigiYarV5PriceEngine.rankByTarget(products, Number(budget.amountToman), 10).map(function (x) { return x.product; });
    }
    return products;
  }

  async function retrieveViaCandidates(need, options) {
    const retrieval = window.DigiYarV5CandidateRetrieval;
    if (!retrieval || typeof retrieval.find !== 'function') return null;
    const settings = options || {}, candidates = await retrieval.find(need, { limit:Number(settings.candidateLimit) || 10 });
    const resolved = [];
    const errors = [];
    await Promise.all(candidates.candidates.map(async function (candidate) {
      try { const product = await resolveCandidate(candidate, settings.resolverTimeout || 10000); if (product) resolved.push(product); }
      catch (error) { errors.push(error && error.message ? error.message : String(error)); }
    }));
    const live = applyLiveBudget(resolved, candidates.diagnostics && candidates.diagnostics.inputBudget || need.budget || {});
    const ranked = rankResolved(live, need).slice(0, Number(settings.limit) || 3);
    return {
      version:VERSION, status:ranked.length ? 'products_retrieved' : 'no_products', need:clone(need), query:buildQuery(need), products:ranked,
      count:ranked.length, candidateDiagnostics:candidates.diagnostics,
      resolver:{ attempted:candidates.candidates.length, resolved:resolved.length, accepted:ranked.length, errors:errors.slice(0,3) }, diagnostic:null, error:null
    };
  }

  async function retrieve(need, options) {
    if (!need || !isNeedReady(need)) return { version:VERSION, status:'waiting_for_answer', need:clone(need || null), query:'', products:[], count:0, diagnostic:null, error:null };
    try {
      const candidateResult = await retrieveViaCandidates(need, options || {});
      if (candidateResult) return candidateResult;
    } catch (error) {
      console.warn('DigiYar V5.1 candidate/resolver path failed:', error);
    }
    if (!window.DigiYarProductRetrieval || typeof window.DigiYarProductRetrieval.search !== 'function') return { version:VERSION, status:'retrieval_error', need:clone(need), query:'', products:[], count:0, diagnostic:null, error:'DigiYarProductRetrieval.search is not available.' };
    const query = buildQuery(need); if (!query) return { version:VERSION, status:'retrieval_error', need:clone(need), query:'', products:[], count:0, diagnostic:null, error:'Unable to build retrieval query.' };
    try {
      const products = await window.DigiYarProductRetrieval.search(query, options || {}), normalized = Array.isArray(products) ? products : [];
      const diagnostic = (!normalized.length || (options && options.diagnostic === true)) ? await diagnose(query) : null;
      return { version:VERSION, status:normalized.length ? 'products_retrieved' : 'no_products', need:clone(need), query:query, products:clone(normalized), count:normalized.length, diagnostic:diagnostic, error:null };
    } catch (error) {
      const diagnostic = await diagnose(query);
      return { version:VERSION, status:'retrieval_error', need:clone(need), query:query, products:[], count:0, diagnostic:diagnostic, error:error && error.message ? error.message : String(error) };
    }
  }

  window.DigiyarProductRetrievalIntegration = { version:VERSION, isNeedReady:isNeedReady, buildQuery:buildQuery, diagnose:diagnose, resolveCandidate:resolveCandidate, retrieve:retrieve, integrate:retrieve };
})(window);
