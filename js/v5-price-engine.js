/* =========================================================
   DigiYar V5.1 — Price Intent & Proximity Engine
   Currency-safe normalization + target-price ordering.
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
      .replace(/[۰-۹]/g, function (d) { return String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)); })
      .trim();
  }

  function parseNumber(raw) {
    const normalized = normalizeText(raw).replace(/,/g, '');
    const value = Number(normalized);
    return Number.isFinite(value) ? value : null;
  }

  function detectScale(text) {
    if (/میلیارد|billion/.test(text)) return 1000000000;
    if (/میلیون|million|\bm\b/.test(text)) return 1000000;
    if (/هزار|thousand|\bk\b/.test(text)) return 1000;
    return 1;
  }

  function detectCurrency(text) {
    if (/ریال|rial|rials/.test(text)) return 'rial';
    if (/تومان|تومن|toman|tomans/.test(text)) return 'toman';
    return 'unknown';
  }

  function detectMode(text) {
    if (/تا|زیر|کمتر از|حداکثر|حدود سقف|بیشتر از این نباشد|نهایتاً|نهایتا/.test(text)) return 'MAX_PRICE';
    if (/حدود|تقریباً|تقریبا|نزدیک|در حدود|اطراف|around|about/.test(text)) return 'TARGET_PRICE';
    return 'TARGET_PRICE';
  }

  function parseBudget(input) {
    const text = normalizeText(input);
    const matches = text.match(/\d+(?:\.\d+)?/g) || [];
    if (!matches.length) return null;

    const scale = detectScale(text);
    const currency = detectCurrency(text);
    const mode = detectMode(text);
    const values = matches.map(function (raw) {
      const amount = parseNumber(raw) * scale;
      return {
        amount: Math.round(amount),
        currency: currency,
        amountToman: currency === 'rial' ? Math.round(amount / 10) : currency === 'toman' ? Math.round(amount) : null
      };
    });

    const isRange = values.length >= 2 && /تا|بین|الی|-/.test(text);
    const ordered = values.slice(0, 2).sort(function (a, b) { return a.amount - b.amount; });
    const minValue = isRange ? ordered[0] : null;
    const maxValue = isRange ? ordered[1] : values[0];

    return {
      mode: mode,
      min: isRange ? minValue.amountToman : null,
      max: maxValue.amountToman,
      currency: currency,
      currencyExplicit: currency !== 'unknown',
      scale: scale,
      rawValues: values.map(function (v) { return v.amount; }),
      amount: values[0].amount,
      amountToman: values[0].amountToman,
      normalized: Boolean(values.every(function (v) { return v.amountToman != null; })),
      source: 'text',
      confidence: currency === 'unknown' ? 0.65 : 0.98
    };
  }

  function offerPrice(product) {
    const offer = product && product.bestOffer;
    const price = offer && Number(offer.priceToman);
    return Number.isFinite(price) && price > 0 ? price : null;
  }

  function rankByTarget(products, targetPrice, limit) {
    const items = (Array.isArray(products) ? products : [])
      .map(function (product) {
        const price = offerPrice(product);
        return price == null ? null : { product: product, price: price, distance: Math.abs(price - targetPrice) };
      })
      .filter(Boolean);

    const exact = items.filter(function (x) { return x.price === targetPrice; })
      .sort(function (a, b) { return a.distance - b.distance; });
    const below = items.filter(function (x) { return x.price < targetPrice; })
      .sort(function (a, b) { return b.price - a.price; });
    const above = items.filter(function (x) { return x.price > targetPrice; })
      .sort(function (a, b) { return a.price - b.price; });

    const selected = [];
    const used = new Set();
    function add(item) {
      if (!item || selected.length >= limit) return;
      const id = String(item.product.id || item.product.productId || item.price);
      if (used.has(id)) return;
      used.add(id);
      selected.push(item);
    }

    exact.forEach(add);
    below.forEach(function (item) { if (selected.length < Math.min(2, limit)) add(item); });
    above.forEach(function (item) { if (selected.length < limit) add(item); });
    below.forEach(function (item) { if (selected.length < limit) add(item); });
    above.forEach(function (item) { if (selected.length < limit) add(item); });

    return selected.slice(0, limit).map(function (item, index) {
      return {
        product: item.product,
        price: item.price,
        priceDistance: item.distance,
        pricePriority: index + 1
      };
    });
  }

  window.DigiYarV5PriceEngine = {
    version: VERSION,
    normalizeText: normalizeText,
    detectCurrency: detectCurrency,
    detectMode: detectMode,
    parseBudget: parseBudget,
    offerPrice: offerPrice,
    rankByTarget: rankByTarget
  };
})(window);
