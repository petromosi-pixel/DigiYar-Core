// DigiYar V5.1 — Product Resolver v1
// Resolves a normalized Product into a store-specific product URL when a
// verified product URL/ID is available. It deliberately never fabricates URLs.

const DigiYarProductResolver = (() => {
  const adapters = {
    digikala: {
      name: 'دیجی‌کالا',
      buildSearchUrl(query) {
        return `https://www.digikala.com/search/?q=${encodeURIComponent(query)}`;
      },
      normalize(raw = {}) {
        return {
          store: 'digikala',
          productId: raw.productId || raw.id || null,
          productName: raw.productName || raw.title || raw.name || null,
          productUrl: raw.productUrl || raw.url || null,
          price: Number.isFinite(Number(raw.price)) ? Number(raw.price) : null,
          available: raw.available !== false,
          image: raw.image || raw.imageUrl || null,
          source: raw.source || 'digikala'
        };
      }
    },
    snappshop: {
      name: 'اسنپ‌شاپ',
      buildSearchUrl(query) {
        return `https://snappshop.ir/search?q=${encodeURIComponent(query)}`;
      },
      normalize(raw = {}) {
        return {
          store: 'snappshop',
          productId: raw.productId || raw.id || null,
          productName: raw.productName || raw.title || raw.name || null,
          productUrl: raw.productUrl || raw.url || null,
          price: Number.isFinite(Number(raw.price)) ? Number(raw.price) : null,
          available: raw.available !== false,
          image: raw.image || raw.imageUrl || null,
          source: raw.source || 'snappshop'
        };
      }
    }
  };

  function getAdapter(store) {
    return adapters[String(store || '').toLowerCase()] || null;
  }

  function isProductUrl(url) {
    if (!url) return false;
    try {
      const u = new URL(url);
      if (!/^https?:$/.test(u.protocol)) return false;
      const path = u.pathname.toLowerCase();
      if (path === '/search' || path === '/search/' || path.includes('/search/')) return false;
      return true;
    } catch {
      return false;
    }
  }

  function resolveOffer(offer) {
    const normalized = getAdapter(offer?.store)?.normalize(offer) || offer;
    if (!normalized) return { resolved: false, reason: 'missing_offer', offer: null };
    if (!normalized.productId && !isProductUrl(normalized.productUrl)) {
      return { resolved: false, reason: 'no_verified_product_identity', offer: normalized };
    }
    if (!isProductUrl(normalized.productUrl)) {
      return { resolved: false, reason: 'product_url_not_verified', offer: normalized };
    }
    return { resolved: true, reason: 'verified_product_url', offer: normalized };
  }

  function resolveProduct(product) {
    const offers = Array.isArray(product?.offers) ? product.offers : [];
    return {
      productId: product?.id || null,
      productName: product?.name || null,
      resolvedOffers: offers.map(resolveOffer).filter(r => r.resolved),
      unresolvedOffers: offers.map(resolveOffer).filter(r => !r.resolved)
    };
  }

  return { adapters, getAdapter, isProductUrl, resolveOffer, resolveProduct };
})();

if (typeof window !== 'undefined') window.DigiYarProductResolver = DigiYarProductResolver;
if (typeof module !== 'undefined' && module.exports) module.exports = DigiYarProductResolver;
