let cachedDigiCdnCookie = null;
const VERSION = "4.0.0-alpha.20";
const API_BASE = "https://api.digikala.com";
const DIGI_BASE = "https://www.digikala.com";
const MAX_PRODUCTS = 20;
const DETAIL_LIMIT = 2;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store"
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    if (request.method !== "GET") return json({ ok: false, error: "Method not allowed" }, 405);

    if (url.pathname === "/health") {
      return json({
        ok: true,
        service: "DigiYar Search Proxy",
        version: VERSION,
        upstream: "digikala",
        strategy: "direct_v2_search_with_single_redirect_retry"
      });
    }

    const query = String(url.searchParams.get("q") || "").trim();
    if (url.pathname === "/autocomplete") {
      if (!query) return json({ ok: false, error: "Missing q parameter" }, 400);
      return autocomplete(query);
    }

    if (url.pathname === "/search") {
      if (!query) return json({ ok: false, error: "Missing q parameter" }, 400);
      return search(query);
    }

    return json({ ok: false, error: "Unknown endpoint", endpoints: ["/health", "/search?q=گوشی", "/autocomplete?q=گوشی"] }, 404);
  }
};

function requestHeaders() {
  return {
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "fa-IR,fa;q=0.9,en;q=0.8",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/143 Safari/537.36",
    "X-Web-Client-Id": "web",
    "X-Web-Client": "desktop",
    "X-Web-Optimize-Response": "1",
    "Origin": DIGI_BASE,
    "Referer": DIGI_BASE + "/",
    ...(cachedDigiCdnCookie ? { "Cookie": `digicdn_cookie=${cachedDigiCdnCookie}` } : {})
  };
}

function updateCookie(response) {
  const value = response.headers.get("set-cookie") || "";
  const match = value.match(/(?:^|,\s*)digicdn_cookie=([^;\s,]+)/i);
  if (match?.[1]) cachedDigiCdnCookie = match[1];
}

function sameUrl(a, b) {
  try {
    return new URL(a).href === new URL(b).href;
  } catch {
    return String(a) === String(b);
  }
}

async function fetchJson(target, redirectDepth = 0) {
  const response = await fetch(target, {
    method: "GET",
    redirect: "manual",
    headers: requestHeaders()
  });
  updateCookie(response);

  const location = response.headers.get("location");
  if (response.status >= 300 && response.status < 400) {
    if (!location) return { ok: false, status: response.status, location: null, redirectDepth };
    const nextUrl = new URL(location, target).href;
    if (redirectDepth >= 1 || sameUrl(target, nextUrl)) {
      return {
        ok: false,
        status: response.status,
        location: nextUrl,
        redirectDepth,
        redirectLoop: sameUrl(target, nextUrl)
      };
    }
    return fetchJson(nextUrl, redirectDepth + 1);
  }

  if (!response.ok) {
    return { ok: false, status: response.status, location: location || null, redirectDepth };
  }

  const text = await response.text();
  try {
    return { ok: true, status: response.status, data: JSON.parse(text), finalUrl: target, redirectDepth };
  } catch {
    return { ok: false, status: response.status, location: location || null, parseError: true, redirectDepth };
  }
}

async function autocomplete(query) {
  const apiPath = `/v1/autocomplete/?q=${encodeURIComponent(query)}`;
  try {
    const result = await fetchJson(API_BASE + apiPath);
    if (!result.ok) {
      return json({
        ok: false,
        endpoint: "/autocomplete",
        query,
        source: "digikala",
        error: "Autocomplete unavailable",
        diagnostics: {
          apiPath,
          upstreamStatus: result.status ?? null,
          redirectLocation: result.location ?? null,
          redirectDepth: result.redirectDepth ?? 0,
          redirectLoop: Boolean(result.redirectLoop)
        }
      }, 502);
    }

    const data = result.data?.data || {};
    const suggestions = Array.isArray(data.auto_complete)
      ? data.auto_complete.map(x => x?.keyword).filter(Boolean).slice(0, 10)
      : [];
    const categories = Array.isArray(data.categories)
      ? data.categories.map(x => {
          const c = x?.category || {};
          return {
            id: c.id ?? null,
            title_fa: c.title_fa || "",
            title_en: c.title_en || "",
            code: c.code || "",
            query: x?.keyword || query
          };
        }).filter(x => x.id).slice(0, 10)
      : [];

    return json({
      ok: true,
      endpoint: "/autocomplete",
      query,
      source: "digikala",
      suggestions,
      categories,
      textLenzEligible: Boolean(data.is_text_lenz_eligible),
      diagnostics: { apiPath, upstreamStatus: result.status, redirectDepth: result.redirectDepth }
    });
  } catch (error) {
    return json({ ok: false, endpoint: "/autocomplete", query, source: "digikala", error: error instanceof Error ? error.message : String(error) }, 502);
  }
}

async function search(query) {
  const apiPath = `/v2/search/?q=${encodeURIComponent(query)}`;
  try {
    // Search is intentionally independent of autocomplete. Autocomplete is a
    // convenience endpoint and must never block the primary product-search path.
    const result = await fetchJson(API_BASE + apiPath);
    if (!result.ok) {
      return json({
        ok: false,
        endpoint: "/search",
        query,
        source: "digikala",
        error: "Search API unavailable",
        diagnostics: {
          stage: "direct_search",
          apiPath,
          upstreamStatus: result.status ?? null,
          redirectLocation: result.location ?? null,
          redirectDepth: result.redirectDepth ?? 0,
          redirectLoop: Boolean(result.redirectLoop),
          strategy: "v2_search_single_redirect_retry"
        }
      }, 502);
    }

    const baseProducts = extractProducts(result.data).slice(0, MAX_PRODUCTS);
    const products = await enrichProducts(baseProducts);

    return json({
      ok: true,
      status: result.status,
      endpoint: "/search",
      query,
      source: "digikala",
      apiPath,
      rawCount: products.length,
      products,
      diagnostics: {
        strategy: "direct_v2_search_single_redirect_retry",
        redirectDepth: result.redirectDepth,
        apiPayloadStatus: result.data?.status ?? null,
        apiProductCandidates: countCandidates(result.data),
        enrichment: {
          candidates: baseProducts.length,
          detailLimit: DETAIL_LIMIT,
          attempted: Math.min(baseProducts.length, DETAIL_LIMIT),
          completed: products.slice(0, DETAIL_LIMIT).filter(p => p.image).length
        },
        subrequests: 1 + Math.min(baseProducts.length, DETAIL_LIMIT)
      }
    });
  } catch (error) {
    return json({ ok: false, endpoint: "/search", query, source: "digikala", error: error instanceof Error ? error.message : String(error) }, 502);
  }
}

function extractProducts(payload) {
  const out = [];
  const seen = new Set();
  walk(payload, out, seen, 0);
  return out;
}

function walk(value, out, seen, depth) {
  if (depth > 18 || value == null || out.length >= MAX_PRODUCTS) return;
  if (Array.isArray(value)) {
    for (const x of value) walk(x, out, seen, depth + 1);
    return;
  }
  if (typeof value !== "object") return;

  const product = normalizeProduct(value);
  if (product && !seen.has(String(product.id))) {
    seen.add(String(product.id));
    out.push(product);
  }
  for (const x of Object.values(value)) walk(x, out, seen, depth + 1);
}

function normalizeProduct(item) {
  if (!item || typeof item !== "object" || Array.isArray(item)) return null;
  const id = item.id ?? item.productId ?? item.product_id ?? extractId(item.url);
  const title = item.title_fa || item.product_title_fa || item.name_fa || item.title || item.name || item.productTitle || item.displayName;
  const price = findMoney(item, 0);
  if (!id || !title || !price) return null;

  return {
    id: Number(id) || id,
    title: String(title).trim(),
    price,
    rrpPrice: findRrp(item, 0) || null,
    discountPercent: findDiscount(item, 0) || null,
    currency: "IRR",
    url: productUrl(id, item.url || item.productUrl || item.link),
    image: findImage(item, 0),
    rating: item.rating?.rate ?? item.rating?.stars ?? item.rating_stars ?? item.rating ?? null,
    ratingCount: item.rating?.count ?? item.rating_count ?? null,
    brand: item.brand?.title_fa ?? item.brand?.title ?? item.brand ?? null,
    status: item.status ?? null
  };
}

function productUrl(id, value) {
  const text = String(value || "").trim();
  if (/^https?:\/\//i.test(text)) return text;
  if (text) return DIGI_BASE + (text.startsWith("/") ? text : "/" + text);
  return `${DIGI_BASE}/product/dkp-${id}/`;
}

function findMoney(value, depth) {
  if (depth > 8 || value == null) return 0;
  if (typeof value === "number") return value >= 10000 ? value : 0;
  if (typeof value === "string") {
    const n = parseMoney(value);
    return n >= 10000 ? n : 0;
  }
  if (typeof value !== "object") return 0;
  for (const key of ["selling_price", "sellingPrice", "selling_price_rial", "finalPrice", "salePrice", "defaultPrice"]) {
    if (value[key] != null) {
      const n = parseMoney(value[key]);
      if (n >= 10000) return n;
    }
  }
  for (const key of ["default_variant", "defaultVariant", "variants", "variant", "offers", "offer", "prices", "price"]) {
    if (value[key] != null) {
      const n = findMoney(value[key], depth + 1);
      if (n) return n;
    }
  }
  return 0;
}

function findRrp(value, depth) {
  if (depth > 8 || value == null || typeof value !== "object") return 0;
  for (const key of ["rrp_price", "rrpPrice", "rrp_price_rial", "original_price", "originalPrice"]) {
    if (value[key] != null) {
      const n = parseMoney(value[key]);
      if (n) return n;
    }
  }
  for (const key of ["default_variant", "defaultVariant", "variants", "variant", "offers", "offer", "prices", "price"]) {
    if (value[key] != null) {
      const n = findRrp(value[key], depth + 1);
      if (n) return n;
    }
  }
  return 0;
}

function findDiscount(value, depth) {
  if (depth > 8 || value == null || typeof value !== "object") return 0;
  for (const key of ["discount_percent", "discountPercent", "discount_percentage"]) {
    if (value[key] != null) {
      const n = Number(value[key]);
      if (Number.isFinite(n) && n >= 0) return n;
    }
  }
  for (const key of ["default_variant", "defaultVariant", "variants", "variant", "offers", "offer", "prices", "price"]) {
    if (value[key] != null) {
      const n = findDiscount(value[key], depth + 1);
      if (n) return n;
    }
  }
  return 0;
}

function findImage(value, depth) {
  if (depth > 10 || value == null) return null;
  if (typeof value === "string") return /^https?:\/\//i.test(value) ? value : null;
  if (typeof value !== "object") return null;
  for (const key of ["image_url", "imageUrl", "thumbnail_url", "thumbnailUrl", "thumbnail", "image", "photo", "cover"]) {
    const found = extractUrl(value[key]);
    if (found) return found;
  }
  for (const key of ["images", "default_variant", "defaultVariant", "variant", "variants", "media"]) {
    if (value[key] != null) {
      const found = findImage(value[key], depth + 1);
      if (found) return found;
    }
  }
  return null;
}

function extractUrl(value) {
  if (typeof value === "string") return /^https?:\/\//i.test(value) ? value : null;
  if (Array.isArray(value)) {
    for (const x of value) {
      const u = extractUrl(x);
      if (u) return u;
    }
    return null;
  }
  if (!value || typeof value !== "object") return null;
  for (const key of ["url", "uri", "src", "href", "image_url", "imageUrl"]) {
    if (value[key] != null) {
      const u = extractUrl(value[key]);
      if (u) return u;
    }
  }
  return null;
}

async function enrichProducts(products) {
  const results = products.slice();
  const candidates = results.slice(0, DETAIL_LIMIT);
  for (const p of candidates) {
    const detail = await getProductDetail(p.id);
    if (detail) {
      p.image = findImage(detail, 0) || p.image || null;
      const detailUrl = extractProductUrl(detail);
      if (detailUrl) p.url = detailUrl;
    }
    p.url = p.url || productUrl(p.id, null);
  }
  return results;
}

async function getProductDetail(id) {
  const path = `/v1/product/${id}/`;
  const result = await fetchJson(API_BASE + path);
  return result.ok ? result.data : null;
}

function extractProductUrl(payload) {
  const product = payload?.data?.product || payload?.product || payload?.data;
  if (!product || typeof product !== "object") return null;
  const raw = product.url || product.product_url || product.web_url || product.link;
  return raw ? productUrl(product.id, raw) : null;
}

function extractId(value) {
  const m = String(value || "").match(/dkp-(\d+)/i);
  return m ? m[1] : null;
}

function parseMoney(value) {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  const s = String(value)
    .replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
    .replace(/[^0-9]/g, "");
  return s ? Number(s) : 0;
}

function countCandidates(payload) {
  let count = 0;
  const visit = (v, d) => {
    if (d > 18 || v == null) return;
    if (Array.isArray(v)) {
      v.forEach(x => visit(x, d + 1));
      return;
    }
    if (typeof v !== "object") return;
    const id = v.id ?? v.productId ?? v.product_id;
    const title = v.title_fa || v.product_title_fa || v.name_fa || v.title || v.name;
    if (id && title) count++;
    Object.values(v).forEach(x => visit(x, d + 1));
  };
  visit(payload, 0);
  return count;
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" }
  });
}
