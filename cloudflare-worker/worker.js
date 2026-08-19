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
      return json({ ok: true, service: "DigiYar Search Proxy", version: "4.0.0-alpha.10", upstream: "digikala" }, 200, cors);
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
      if (result.ok) {
        return json({
          ok: true,
          status: result.status,
          endpoint,
          query,
          source: "digikala",
          apiPath: path,
          cookieEstablished: Boolean(cachedDigiCdnCookie),
          rawCount: countProducts(result.data),
          data: result.data
        }, 200, cors);
      }
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
        diagnostics: {
          apiTried: apiPaths,
          webFallbackStatus: page.status,
          webFallbackUrl: page.url,
          extraction: "product_links"
        },
        rawCount: products.length,
        data: { products }
      }, 200, cors);
    }

    return json({
      ok: false,
      status: page.status || 502,
      endpoint,
      query,
      source: "digikala",
      cookieEstablished: Boolean(cachedDigiCdnCookie),
      diagnostics: {
        apiTried: apiPaths,
        webFallbackStatus: page.status || null,
        webFallbackUrl: page.url || null,
        extraction: "no_product_links_found"
      },
      data: page.html ? { raw: page.html.slice(0, 4000) } : null
    }, 502, cors);
  } catch (error) {
    return json({ ok: false, endpoint, query, source: "digikala", cookieEstablished: Boolean(cachedDigiCdnCookie), error: error instanceof Error ? error.message : String(error) }, 502, cors);
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
  catch { return { ok: false, status: response.status, location: response.headers.get("location") }; }
}

async function fetchDigikalaWeb(query) {
  const url = `https://www.digikala.com/search/?q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    method: "GET",
    redirect: "follow",
    headers: {
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "fa-IR,fa;q=0.9,en;q=0.8",
      "User-Agent": buildHeaders()["User-Agent"],
      "Referer": "https://www.digikala.com/"
    }
  });
  return { ok: response.ok, status: response.status, url: response.url, html: await response.text() };
}

function extractProductsFromHtml(html) {
  const products = [];
  const seen = new Set();

  const add = (item) => {
    if (!item || typeof item !== "object") return;
    const title = item.title || item.name || item.productTitle || item.displayName || item.title_fa;
    const offer = item.offers || item.offer || item.price || {};
    const priceValue = typeof offer === "object" ? (item.finalPrice ?? item.salePrice ?? item.defaultPrice ?? offer.price ?? offer.lowPrice ?? offer.selling_price) : offer;
    const price = parseMoney(priceValue);
    const url = item.url || item.productUrl || item.link || "";
    const image = item.image || item.imageUrl || item.thumbnail || (Array.isArray(item.images) ? item.images[0] : null);
    if (!title || (!price && !url)) return;
    const key = String(item.id || item.productId || url || title);
    if (seen.has(key)) return;
    seen.add(key);
    products.push({ id: item.id ?? item.productId ?? null, title: String(title), price: price || null, currency: item.currency || (typeof offer === "object" ? offer.priceCurrency : null) || "IRR", url: url ? normalizeProductUrl(url) : null, image: typeof image === "string" ? image : null });
  };

  // JSON-LD / embedded JSON objects.
  const jsonLdMatches = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const block of jsonLdMatches) {
    const body = block.replace(/^.*?>/s, "").replace(/<\/script>$/i, "");
    try { walk(JSON.parse(body), add, 0); } catch (_) {}
  }

  const scriptMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const block of scriptMatches) {
    if (products.length >= 20) break;
    const body = block.replace(/^.*?>/s, "").replace(/<\/script>$/i, "").trim();
    if (!body || (!body.includes("product") && !body.includes("price") && !body.includes("title"))) continue;
    try { walk(JSON.parse(body), add, 0); } catch (_) {}
  }

  // Current public DigiKala HTML exposes product cards as links. This is the
  // reliable fallback when the API is challenged and product JSON is absent.
  const anchorRe = /<a\b[^>]*href=["']([^"']*\/product\/dkp-\d+[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = anchorRe.exec(html)) !== null && products.length < 20) {
    const url = decodeHtml(match[1]);
    const text = cleanText(match[2]);
    const idMatch = url.match(/dkp-(\d+)/i);
    if (!idMatch || seen.has(idMatch[1])) continue;

    const price = extractPriceFromText(text);
    const title = extractTitleFromText(text);
    if (!title || !price) continue;

    seen.add(idMatch[1]);
    products.push({ id: Number(idMatch[1]), title, price, currency: "IRR", url: normalizeProductUrl(url), image: null });
  }

  return products.slice(0, 20);
}

function walk(value, add, depth) {
  if (depth > 12 || value == null) return;
  if (Array.isArray(value)) { for (const item of value) walk(item, add, depth + 1); return; }
  if (typeof value !== "object") return;
  add(value);
  for (const child of Object.values(value)) walk(child, add, depth + 1);
}

function cleanText(value) {
  return decodeHtml(String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\\u[0-9a-fA-F]{4}/g, " ")
    .replace(/\s+/g, " ")
    .trim());
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, "/")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function normalizeDigits(value) {
  return String(value || "")
    .replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

function parseMoney(value) {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  const normalized = normalizeDigits(String(value));
  const digits = normalized.replace(/[^0-9]/g, "");
  return digits ? Number(digits) : 0;
}

function extractPriceFromText(text) {
  const normalized = normalizeDigits(text).replace(/\u066C/g, ",");
  const candidates = normalized.match(/(?:\d{1,3}(?:,\d{3})+|\d{7,15})/g) || [];
  const values = candidates.map(v => Number(v.replace(/,/g, ""))).filter(v => v >= 100000);
  return values.length ? values[values.length - 1] : 0;
}

function extractTitleFromText(text) {
  const cleaned = cleanText(text);
  if (!cleaned) return "";
  const normalized = normalizeDigits(cleaned);
  const priceIndex = normalized.search(/(?:\d{1,3}(?:,\d{3})+|\d{7,15})/);
  const beforePrice = priceIndex >= 0 ? cleaned.slice(0, priceIndex).trim() : cleaned;
  return beforePrice
    .replace(/^(ارسال سریع دیجی‌کالا|موجود در انبار دیجی کالا|موجود در انبار دیجی‌کالا)\s*/i, "")
    .trim();
}

function normalizeProductUrl(url) {
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return "https://www.digikala.com" + url;
  return url;
}

function countProducts(value) {
  let count = 0;
  const visit = (v, depth) => {
    if (depth > 8 || v == null) return;
    if (Array.isArray(v)) { for (const x of v) visit(x, depth + 1); return; }
    if (typeof v !== "object") return;
    if ((v.productId || v.id) && (v.title || v.name || v.productTitle || v.title_fa)) count++;
    for (const x of Object.values(v)) visit(x, depth + 1);
  };
  visit(value, 0);
  return count;
}

function json(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store", ...extraHeaders }
  });
}
