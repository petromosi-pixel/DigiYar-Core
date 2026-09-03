/* DigiYar V5.1 — Offer / Affiliate Engine
 * Keeps live offer selection, affiliate-link construction, and final ranking
 * outside the UI layer. No layout or catalog mutation belongs here.
 */
(function (root) {
  'use strict';
  const VERSION = '5.1.0-alpha.1';
  const AFFILIATE_CONFIG = {
    digikala: { name: 'دیجی‌کالا', campaignUrl: 'https://aflo.ir/TrvNHEN8' },
    snappshop: { name: 'اسنپ‌شاپ', campaignUrl: 'https://aflo.ir/YPN05dL7' }
  };
  const DIRECT_PRODUCT_RE = /^https:\/\/(?:www\.)?(?:digikala\.com|snappshop\.ir|torobshop\.com)\/(?!search(?:\/|\?|$))/i;
  function normalizeStore(value) { return String(value || '').trim().toLowerCase().replace(/[\s_-]+/g, ''); }
  function normalizeCurrency(value) {
    const c = String(value || '').trim().toUpperCase();
    if (c === 'IRR' || /ریال|RIAL/.test(c)) return 'IRR';
    if (c === 'IRT' || /تومان|TOMAN/.test(c)) return 'IRT';
    return c || '';
  }
  function toToman(value, currency) {
    const n = Number(String(value == null ? '' : value).replace(/[٬,\s]/g, ''));
    if (!Number.isFinite(n) || n <= 0) return 0;
    return normalizeCurrency(currency) === 'IRR' ? Math.round(n / 10) : Math.round(n);
  }
  function isDirectProductUrl(url) { return DIRECT_PRODUCT_RE.test(String(url || '')); }
  function isUsableOffer(offer) {
    if (!offer || offer.available === false || offer.availability === 'out_of_stock') return false;
    const url = offer.productUrl || offer.url || '';
    const price = Number(offer.priceToman) || toToman(offer.price, offer.currency);
    return isDirectProductUrl(url) && price > 0;
  }
  function buildAffiliateUrl(store, productUrl, explicitAffiliateUrl) {
    if (explicitAffiliateUrl) return String(explicitAffiliateUrl);
    if (!isDirectProductUrl(productUrl)) return '';
    const cfg = AFFILIATE_CONFIG[normalizeStore(store)];
    if (!cfg || !cfg.campaignUrl) return String(productUrl);
    const separator = cfg.campaignUrl.includes('?') ? '&' : '?';
    return cfg.campaignUrl + separator + 'p=' + encodeURIComponent(productUrl);
  }
  function normalizeOffer(offer) {
    const raw = offer || {};
    const productUrl = raw.productUrl || raw.url || '';
    const currency = normalizeCurrency(raw.currency || '');
    const priceToman = Number(raw.priceToman) > 0 ? Math.round(Number(raw.priceToman)) : toToman(raw.price, currency);
    const affiliateUrl = buildAffiliateUrl(raw.storeId || raw.store, productUrl, raw.affiliateUrl);
    return {
      id: String(raw.id || raw.offerId || raw.productId || ''), productId: String(raw.productId || raw.id || ''),
      storeId: String(raw.storeId || raw.store || ''), store: String(raw.store || raw.storeId || ''),
      storeName: raw.storeName || (AFFILIATE_CONFIG[normalizeStore(raw.store || raw.storeId)] || {}).name || raw.store || '',
      price: Number(raw.price || 0), priceToman, currency: currency || 'IRT',
      availability: raw.availability || (raw.available === true ? 'in_stock' : raw.available === false ? 'out_of_stock' : 'unknown'),
      available: raw.available !== false && raw.availability !== 'out_of_stock', productUrl, affiliateUrl,
      isAffiliate: Boolean(affiliateUrl && affiliateUrl !== productUrl), source: raw.source || '', fetchedAt: raw.fetchedAt || raw.observedAt || ''
    };
  }
  function selectBestOffer(offers) {
    return (Array.isArray(offers) ? offers : []).map(normalizeOffer).filter(isUsableOffer).sort(function (a, b) {
      if (a.available !== b.available) return a.available ? -1 : 1;
      if (a.priceToman !== b.priceToman) return a.priceToman - b.priceToman;
      if (a.isAffiliate !== b.isAffiliate) return a.isAffiliate ? -1 : 1;
      return String(a.storeName).localeCompare(String(b.storeName));
    })[0] || null;
  }
  function prepareProduct(product) {
    const p = product || {};
    const bestOffer = selectBestOffer(p.offers || (p.bestOffer ? [p.bestOffer] : []));
    if (!bestOffer) return null;
    return Object.assign({}, p, { bestOffer, price:bestOffer.priceToman, priceToman:bestOffer.priceToman, store:bestOffer.store, storeName:bestOffer.storeName, productUrl:bestOffer.productUrl, affiliateUrl:bestOffer.affiliateUrl, available:bestOffer.available });
  }
  function scoreItem(product) {
    const baseScore = Number(product._score || product.retrievalScore || product.score || 0);
    const affiliateBonus = product.bestOffer.isAffiliate ? 2 : 0;
    const availabilityBonus = product.bestOffer.availability === 'in_stock' ? 8 : 0;
    return baseScore + affiliateBonus + availabilityBonus;
  }
  function rankProducts(products, options) {
    const opts = options || {};
    const target = Number(opts.targetPriceToman) > 0 ? Number(opts.targetPriceToman) : null;
    return (Array.isArray(products) ? products : []).map(prepareProduct).filter(Boolean).map(function (product) {
      return { product, offer:product.bestOffer, score:scoreItem(product), priceDistance:target == null ? 0 : Math.abs(product.bestOffer.priceToman - target) };
    }).sort(function (a, b) {
      if (target != null && a.priceDistance !== b.priceDistance) return a.priceDistance - b.priceDistance;
      if (b.score !== a.score) return b.score - a.score;
      return a.offer.priceToman - b.offer.priceToman;
    });
  }
  function finalizeOrdered(products, limit) {
    const max = Number(limit) > 0 ? Number(limit) : 8;
    return (Array.isArray(products) ? products : []).map(prepareProduct).filter(Boolean).slice(0, max).map(function (product, index) {
      return Object.assign({}, product, { offer:product.bestOffer, finalScore:Math.round(scoreItem(product) * 100) / 100, rank:index + 1 });
    });
  }
  function finalize(products, options) {
    const ranked = rankProducts(products, options);
    return finalizeOrdered(ranked.map(function (x) { return x.product; }), options && options.limit);
  }
  const api = { version:VERSION, affiliateConfig:AFFILIATE_CONFIG, normalizeCurrency, toToman, isDirectProductUrl, buildAffiliateUrl, normalizeOffer, selectBestOffer, prepareProduct, rankProducts, finalizeOrdered, finalize };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.DigiYarOfferAffiliate = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
