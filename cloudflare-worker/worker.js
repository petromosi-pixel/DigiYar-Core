let cachedDigiCdnCookie = null;

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "GET") return json({ ok: false, error: "Method not allowed" }, 405, cors);

    if (url.pathname === "/health") {
      return json({ ok: true, service: "DigiYar Search Proxy", version: "4.0.0-alpha.12", upstream: "digikala" }, 200, cors);
    }

    if (url.pathname === "/search" || url.pathname === "/autocomplete") {
      const query = url.searchParams.get("q");
      if (!query || !query.trim()) return json({ ok: false, error: "Missing q parameter" }, 400, cors);
      return proxySearch(query.trim(), cors, url.pathname);
    }

    return json({ ok: false, error: "Unknown endpoint", endpoints: ["/health", "/search?q=گوشی", "/autocomplete?q=گوشی"] }, 404, cors);
  }
};

function buildHeaders() {
  return {
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "fa-IR,fa;q=0.9,en-US;q=0.8,en;q=0.7",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
    "X-Web-Client-Id": "web",
    "X-Web-Client": "desktop",
    "X-Web-Optimize-Response": "1",
    "Origin": "https://www.digikala.com",
    "Referer": "https://www.digikala.com/",
    ...(cachedDigiCdnCookie ? { "Cookie": `digicdn_cookie=${cachedDigiCdnCookie}` } : {})
  };
}

function updateCookieFromResponse(response) {
  const setCookie = response.headers.get("set-cookie");
  if (!setCookie) return false;
  const match = setCookie.match(/(?:^|,\s*)digicdn_cookie=([^;\s,]+)/i);
  if (match?.[1]) {
    cachedDigiCdnCookie = match[1];
    return true;
  }
  return false;
}

async function proxySearch(query, cors, endpoint) {
  try {
    const apiPaths = endpoint === "/autocomplete" ? ["/v2/autocomplete/", "/v1/autocomplete/"] : ["/v2/search/", "/v1/search/"];

    for (const path of apiPaths) {
      const result = await fetchDigiApi(`https://api.digikala.com${path}?q=${encodeURIComponent(query)}`);
      if (!result.ok) continue;

      const products = endpoint === "/search" ? extractProductsFromApi(result.data) : [];
      return json({
        ok: true,
        status: result.status,
        endpoint,
        query,
        source: "digikala",
        apiPath: path,
        cookieEstablished: Boolean(cachedDigiCdnCookie),
        rawCount: products.length,
        products,
        diagnostics: {
          extraction: endpoint === "/search" ? (products.length ? "api_products" : "no_product_objects_found") : "autocomplete",
          apiPayloadStatus: result.data?.status ?? null,
          apiProductCandidates: endpoint === "/search" ? countProductCandidates(result.data) : 0
        }
      }, 200, cors);
    }

    const page = await fetchDigikalaWeb(query);
    const products = page.ok ? extractProductsFromHtml(page.html) : [];
    if (products.length) {
      return json({
        ok: true,
        status: 200,
        endpoint,
        query,
        source: "digikala-web",
        cookieEstablished: Boolean(cachedDigiCdnCookie),
        diagnostics: { webFallbackStatus: page.status, webFallbackUrl: page.url, extraction: "product_links" },
        rawCount: products.length,
        products
      }, 200, cors);
    }

    return json({
      ok: false,
      status: page.status || 502,
      endpoint,
      query,
      source: "digikala",
      cookieEstablished: Boolean(cachedDigiCdnCookie),
      diagnostics: { apiTried: apiPaths, webFallbackStatus: page.status || null, webFallbackUrl: page.url || null, extraction: "no_products" }
    }, 502, cors);
  } catch (error) {
    return json({ ok: false, endpoint, query, source: "digikala", error: error instanceof Error ? error.message : String(error) }, 502, cors);
  }
}

async function fetchDigiApi(targetUrl) {
  let response = await fetch(targetUrl, { method: "GET", redirect: "manual", headers: buildHeaders() });
  updateCookieFromResponse(response);

  for (let attempt = 0; attempt < 2 && (response.status === 307 || response.status === 308); attempt++) {
    const location = response.headers.get("location");
    const nextUrl = location ? new URL(location, targetUrl).toString() : targetUrl;
    response = await fetch(nextUrl, { method: "GET", redirect: "manual", headers: buildHeaders() });
    updateCookieFromResponse(response);
  }

  if (!response.ok) return { ok: false, status: response.status, location: response.headers.get("location") };
  const text = await response.text();
  try { return { ok: true, status: response.status, data: JSON.parse(text) }; }
  catch { return { ok: false, status: response.status }; }
}

function extractProductsFromApi(payload) {
  const products = [];
  const seen = new Set();
  walkForProducts(payload, products, seen, 0);
  return products.slice(0, 20);
}

function walkForProducts(value, products, seen, depth) {
  if (depth > 18 || value == null || products.length >= 20) return;
  if (Array.isArray(value)) {
    for (const item of value) walkForProducts(item, products, seen, depth + 1);
    return;
  }
  if (typeof value !== "object") return;

  const product = normalizeApiProduct(value);
  if (product && !seen.has(String(product.id))) {
    seen.add(String(product.id));
    products.push(product);
    if (products.length >= 20) return;
  }

  for (const child of Object.values(value)) walkForProducts(child, products, seen, depth + 1);
}

function normalizeApiProduct(item) {
  if (!item || typeof item !== "object" || Array.isArray(item)) return null;

  const id = item.id ?? item.productId ?? item.product_id ?? extractId(item.url);
  const title = item.title_fa || item.product_title_fa || item.name_fa || item.title || item.name || item.productTitle || item.displayName;
  if (!id || !title) return null;

  const price = findPrice(item, 0);
  if (!price) return null;

  const url = normalizeProductUrl(item.url || item.productUrl || item.link || `/product/dkp-${id}/`);
  const image = findImage(item, 0);
  const rrpPrice = findRrp(item, 0);
  const rating = item.rating?.rate ?? item.rating?.stars ?? item.rating_stars ?? item.rating ?? null;
  const ratingCount = item.rating?.count ?? item.rating_count ?? null;
  const brand = item.brand?.title_fa ?? item.brand?.title ?? item.brand ?? null;

  return {
    id: Number(id) || id,
    title: String(title).trim(),
    price,
    rrpPrice: rrpPrice || null,
    currency: "IRR",
    url,
    image,
    rating,
    ratingCount,
    brand,
    status: item.status ?? null
  };
}

function findPrice(value, depth) {
  if (depth > 8 || value == null) return 0;
  if (typeof value === "number") return value >= 10000 ? value : 0;
  if (typeof value === "string") {
    const n = parseMoney(value);
    return n >= 10000 ? n : 0;
  }
  if (typeof value !== "object") return 0;

  const directKeys = ["selling_price", "sellingPrice", "selling_price_rial", "finalPrice", "salePrice", "defaultPrice", "price"];
  for (const key of directKeys) {
    if (value[key] != null) {
      const n = parseMoney(value[key]);
      if (n >= 10000) return n;
    }
  }

  const priorityKeys = ["default_variant", "defaultVariant", "variants", "variant", "offers", "offer", "prices", "price"];
  for (const key of priorityKeys) {
    if (value[key] != null) {
      const n = findPrice(value[key], depth + 1);
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

function findImage(value, depth) {
  if (depth > 8 || value == null || typeof value !== "object") return null;
  const direct = value.image_url || value.imageUrl || value.thumbnail || value.image;
  if (typeof direct === "string" && direct.startsWith("http")) return direct;
  if (Array.isArray(direct)) {
    for (const x of direct) if (typeof x === "string" && x.startsWith("http")) return x;
  }
  if (value.images) {
    if (Array.isArray(value.images)) {
      for (const x of value.images) {
        if (typeof x === "string" && x.startsWith("http")) return x;
        if (x?.url?.[0]) return x.url[0];
        if (typeof x?.url === "string") return x.url;
      }
    }
    if (value.images?.url?.[0]) return value.images.url[0];
  }
  for (const key of ["default_variant", "defaultVariant", "variant", "variants", "images"]) {
    if (value[key] != null) {
      const found = findImage(value[key], depth + 1);
      if (found) return found;
    }
  }
  return null;
}

function countProductCandidates(payload) {
  let count = 0;
  const visit = (value, depth) => {
    if (depth > 18 || value == null) return;
    if (Array.isArray(value)) { for (const x of value) visit(x, depth + 1); return; }
    if (typeof value !== "object") return;
    const id = value.id ?? value.productId ?? value.product_id;
    const title = value.title_fa || value.product_title_fa || value.name_fa || value.title || value.name;
    if (id && title) count++;
    for (const x of Object.values(value)) visit(x, depth + 1);
  };
  visit(payload, 0);
  return count;
}

async function fetchDigikalaWeb(query) {
  const url = `https://www.digikala.com/search/?q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    method: "GET",
    redirect: "follow",
    headers: { "Accept": "text/html,application/xhtml+xml", "Accept-Language": "fa-IR,fa;q=0.9,en;q=0.8", "User-Agent": buildHeaders()["User-Agent"], "Referer": "https://www.digikala.com/" }
  });
  return { ok: response.ok, status: response.status, url: response.url, html: await response.text() };
}

function extractProductsFromHtml(html) {
  const products = [];
  const seen = new Set();
  const anchorRe = /<a\b[^>]*href=["']([^"']*\/product\/dkp-\d+[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = anchorRe.exec(html)) !== null && products.length < 20) {
    const url = decodeHtml(match[1]);
    const idMatch = url.match(/dkp-(\d+)/i);
    if (!idMatch || seen.has(idMatch[1])) continue;
    const text = cleanText(match[2]);
    const price = extractPriceFromText(text);
    const title = extractTitleFromText(text);
    if (!title || !price) continue;
    seen.add(idMatch[1]);
    products.push({ id: Number(idMatch[1]), title, price, currency: "IRR", url: normalizeProductUrl(url), image: null });
  }
  return products;
}

function normalizeDigits(value) {
  return String(value || "").replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

function parseMoney(value) {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  const digits = normalizeDigits(String(value)).replace(/[^0-9]/g, "");
  return digits ? Number(digits) : 0;
}

function extractPriceFromText(text) {
  const candidates = normalizeDigits(text).match(/(?:\d{1,3}(?:,\d{3})+|\d{7,15})/g) || [];
  const values = candidates.map(v => Number(v.replace(/,/g, ""))).filter(v => v >= 100000);
  return values.length ? values[values.length - 1] : 0;
}

function extractTitleFromText(text) {
  const cleaned = cleanText(text);
  const normalized = normalizeDigits(cleaned);
  const index = normalized.search(/(?:\d{1,3}(?:,\d{3})+|\d{7,15})/);
  return (index >= 0 ? cleaned.slice(0, index) : cleaned).trim();
}

function cleanText(value) {
  return decodeHtml(String(value || "").replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function decodeHtml(value) {
  return String(value || "").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&#x27;/gi, "'").replace(/&#x2F;/gi, "/").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function extractId(url) {
  const match = String(url || "").match(/dkp-(\d+)/i);
  return match ? match[1] : null;
}

function normalizeProductUrl(url) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return "https://www.digikala.com" + url;
  return url;
}

function json(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store", ...extraHeaders }
  });
}
