/* =========================================================
   DigiYar V5.1 — Housh Yar Catalog Adapter
   Reads the generated local V5.1 catalogs directly.
   No provider/API calls. No mutation of source catalog files.
   ========================================================= */
(function (window) {
  'use strict';

  const VERSION = '5.1.0-alpha.1';
  const REGISTRY_URL = 'data/category-registry-v5.1.json';
  const CATALOG_BASE = 'data/catalog/';
  let registryPromise = null;
  const catalogPromises = new Map();

  function normalizeText(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[يى]/g, 'ی')
      .replace(/ك/g, 'ک')
      .replace(/[\u200c\s_-]+/g, ' ')
      .trim();
  }

  function toToman(value, currency) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return 0;
    const c = String(currency || '').toUpperCase();
    return c === 'IRR' || c === 'ریال' ? Math.round(n / 10) : Math.round(n);
  }

  function normalizeAvailability(offer) {
    if (offer && offer.available === true) return 'in_stock';
    if (offer && offer.available === false) return 'out_of_stock';
    const value = String(offer && offer.availability || '').toLowerCase();
    if (/in.?stock|موجود/.test(value)) return 'in_stock';
    if (/out.?of.?stock|ناموجود|تمام شده/.test(value)) return 'out_of_stock';
    return 'unknown';
  }

  function normalizeOffer(raw, product) {
    const source = raw || {};
    const price = Number(source.price || source.sellingPrice || 0);
    const currency = source.currency || source.priceCurrency || product.currency || 'IRR';
    return {
      id: String(source.id || source.offerId || source.productId || product.productId || product.id || ''),
      productId: String(source.productId || product.productId || product.id || ''),
      storeId: String(source.storeId || source.store || source.sourceId || ''),
      storeName: source.storeName || source.store || source.sourceId || '',
      price: Number.isFinite(price) ? price : 0,
      priceToman: toToman(price, currency),
      currency: currency,
      availability: normalizeAvailability(source),
      available: normalizeAvailability(source) === 'in_stock',
      productUrl: source.productUrl || source.url || product.productUrl || '',
      affiliateUrl: source.affiliateUrl || '',
      source: source.source || product.source || '',
      observedAt: source.observedAt || product.observedAt || ''
    };
  }

  function normalizeProduct(raw) {
    const p = raw || {};
    let offers = Array.isArray(p.offers) ? p.offers.map(function (o) {
      return normalizeOffer(o, p);
    }) : [];

    if (!offers.length && Number(p.price) > 0) {
      offers = [normalizeOffer({
        productId: p.productId || p.id,
        storeId: p.storeId || p.store || p.sourceId || p.source || '',
        storeName: p.storeName || p.store || p.sourceId || '',
        price: p.price,
        currency: p.currency || 'IRR',
        availability: p.availability,
        available: p.available,
        productUrl: p.productUrl || p.url || '',
        affiliateUrl: p.affiliateUrl || '',
        source: p.source || '',
        observedAt: p.observedAt || ''
      }, p)];
    }

    return {
      id: String(p.productId || p.id || ''),
      productId: String(p.productId || p.id || ''),
      name: p.name || '',
      brand: p.brand || '',
      model: p.model || '',
      category: p.category || '',
      subcategory: p.subcategory || '',
      attributes: p.attributes && typeof p.attributes === 'object' ? p.attributes : {},
      image: p.image || '',
      keywords: Array.isArray(p.keywords) ? p.keywords.slice() : [],
      source: p.source || '',
      sourceId: p.sourceId || '',
      sourceUrl: p.sourceUrl || '',
      observedAt: p.observedAt || '',
      offers: offers,
      bestOffer: bestOffer(offers)
    };
  }

  function bestOffer(offers) {
    return (Array.isArray(offers) ? offers : [])
      .filter(function (o) {
        return o.available && o.priceToman > 0 && o.productUrl;
      })
      .sort(function (a, b) {
        return a.priceToman - b.priceToman;
      })[0] || null;
  }

  async function loadRegistry() {
    if (registryPromise) return registryPromise;
    registryPromise = fetch(new URL(REGISTRY_URL, document.baseURI), { cache: 'no-cache' })
      .then(function (response) {
        if (!response.ok) throw Error('Catalog registry HTTP ' + response.status);
        return response.json();
      });
    return registryPromise;
  }

  async function loadCategory(category) {
    const key = String(category || '').trim();
    if (!key) return { products: [] };
    if (catalogPromises.has(key)) return catalogPromises.get(key);
    const promise = fetch(new URL(CATALOG_BASE + encodeURIComponent(key) + '.json', document.baseURI), { cache: 'no-cache' })
      .then(function (response) {
        if (!response.ok) throw Error('Catalog HTTP ' + response.status + ' for ' + key);
        return response.json();
      });
    catalogPromises.set(key, promise);
    return promise;
  }

  async function getCategories() {
    const registry = await loadRegistry();
    return Array.isArray(registry.categories) ? registry.categories.slice() : [];
  }

  async function getProducts(options) {
    const settings = options || {};
    let categories = settings.categories;
    if (!Array.isArray(categories) || !categories.length) {
      const registry = await loadRegistry();
      categories = (registry.categories || []).map(function (c) { return c.id; });
    }

    const chunks = await Promise.all(categories.map(loadCategory));
    const products = [];
    const seen = new Map();

    chunks.forEach(function (catalog) {
      (Array.isArray(catalog.products) ? catalog.products : []).forEach(function (raw) {
        const product = normalizeProduct(raw);
        if (!product.id || !product.name) return;
        const key = product.id || (normalizeText(product.name) + '|' + product.category);
        const existing = seen.get(key);
        if (!existing) {
          seen.set(key, product);
          products.push(product);
          return;
        }
        const merged = existing.offers.concat(product.offers);
        const offerMap = new Map();
        merged.forEach(function (offer) {
          const offerKey = (offer.storeId || '') + '|' + (offer.productUrl || '');
          offerMap.set(offerKey, offer);
        });
        existing.offers = Array.from(offerMap.values());
        existing.bestOffer = bestOffer(existing.offers);
        existing.brand = existing.brand || product.brand;
        existing.model = existing.model || product.model;
        existing.subcategory = existing.subcategory || product.subcategory;
        existing.image = existing.image || product.image;
      });
    });

    return products;
  }

  async function findCandidates(need, options) {
    const products = await getProducts(options);
    const n = need || {};
    const budget = n.budget || {};
    const min = Number(budget.min) || 0;
    const max = Number(budget.max) || 0;
    const category = n.category || '';
    const brand = normalizeText(n.brand || '');

    return products.filter(function (p) {
      if (category && p.category !== category) return false;
      if (brand && normalizeText(p.brand) !== brand) return false;
      if (max > 0) {
        const prices = p.offers.map(function (o) { return o.priceToman; }).filter(Boolean);
        if (!prices.length || !prices.some(function (price) { return price <= max && (min <= 0 || price >= min); })) return false;
      }
      return true;
    });
  }

  window.DigiYarV5CatalogAdapter = {
    version: VERSION,
    loadRegistry: loadRegistry,
    getCategories: getCategories,
    loadCategory: loadCategory,
    getProducts: getProducts,
    findCandidates: findCandidates,
    normalizeProduct: normalizeProduct,
    normalizeOffer: normalizeOffer,
    toToman: toToman,
    bestOffer: bestOffer
  };
})(window);
