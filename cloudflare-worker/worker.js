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
      return json({
        ok: true,
        service: "DigiYar Search Proxy",
        version: "4.0.0-alpha.9",
        upstream: "digikala"
      }, 200, cors);
    }

    if (url.pathname === "/search" || url.pathname === "/autocomplete") {
      const query = url.searchParams.get("q");
      if (!query || !query.trim()) return json({ ok: false, error: "Missing q parameter" }, 400, cors);
      return proxySearch(query.trim(), cors, url.pathname);
    }

    return json({
      ok: false,
      error: "Unknown endpoint",
      endpoints: ["/health", "/search?q=گوشی", "/autocomplete?q=گوشی"]
    }, 404, cors);
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
    // Try current API first. DigiKala has historically exposed multiple search
    // API generations, so v2 is attempted before the legacy v1 endpoint.
    const apiPaths = endpoint === "/autocomplete"
      ? ["/v2/autocomplete/", "/v1/autocomplete/"]
      : ["/v2/search/", "/v1/search/"];

    for (const path of apiPaths) {
      const result = await fetchDigiApi(
        `https://api.digikala.com${path}?q=${encodeURIComponent(query)}`
      );
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

    // API challenge/fallback: fetch the public search surface and extract
    // product objects from JSON-LD, Next data, or embedded application JSON.
    const page = await fetchDigikalaWeb(query);
    if (page.ok) {
      const products = extractProductsFromHtml(page.html);
      if (products.length) {
        return json({
          ok: true,
          status: 200,
          endpoint,
          query,
          source: "digikala-web",
          cookieEstablished: Boolean(cachedDigiCdnCookie),
          rawCount: products.length,
          data: { products }
        }, 200, cors);
      }
    }

    return json({
      ok: false,
      status: page.status || 307,
      endpoint,
      query,
      source: "digikala",
      cookieEstablished: Boolean(cachedDigiCdnCookie),
      diagnostics: {
        apiTried: apiPaths,
        webFallbackStatus: page.status || null,
        webFallbackUrl: page.url || null,
        extraction: "no_product_objects_found"
      },
      data: page.html ? { raw: page.html.slice(0, 4000) } : null
    }, 502, cors);
  } catch (error) {
    return json({
      ok: false,
      endpoint,
      query,
      source: "digikala",
      cookieEstablished: Boolean(cachedDigiCdnCookie),
      error: error instanceof Error ? error.message : String(error)
    }, 502, cors);
  }
}

async function fetchDigiApi(targetUrl) {
  let response = await fetch(targetUrl, {
    method: "GET",
    redirect: "manual",
    headers: buildHeaders()
  });
  updateCookieFromResponse(response);

  for (let attempt = 0; attempt < 2 && (response.status === 307 || response.status === 308); attempt++) {
    const location = response.headers.get("location");
    const nextUrl = location ? new URL(location, targetUrl).toString() : targetUrl;
    response = await fetch(nextUrl, {
      method: "GET",
      redirect: "manual",
      headers: buildHeaders()
    });
    updateCookieFromResponse(response);
  }

  if (!response.ok) return { ok: false, status: response.status, location: response.headers.get("location") };

  const text = await response.text();
  try {
    return { ok: true, status: response.status, data: JSON.parse(text) };
  } catch {
    return { ok: false, status: response.status, location: response.headers.get("location") };
  }
}

async function fetchDigikalaWeb(query) {
  const url = `https://www.digikala.com/search/?q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    method: "GET",
    redirect: "follow",
    headers: {
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "fa-IR,fa;q=0.9,en;q=0.8",
      "User-Agent": buildHeaders()["User-Agent"]
    }
  });
  return { ok: response.ok, status: response.status, url: response.url, html: await response.text() };
}

function extractProductsFromHtml(html) {
  const products = [];
  const seen = new Set();

  const add = (item) => {
    if (!item || typeof item !== "object") return;
    const title = item.title || item.name || item.productTitle || item.displayName;
    const offer = item.offers || item.offer || {};
    const priceValue = item.price ?? item.finalPrice ?? item.salePrice ?? item.defaultPrice ?? offer.price ?? offer.lowPrice;
    const price = Number(String(priceValue ?? "").replace(/[^0-9]/g, ""));
    const url = item.url || item.productUrl || item.link || "";
    const image = item.image || item.imageUrl || item.thumbnail || (Array.isArray(item.images) ? item.images[0] : null);
    if (!title || (!price && !url)) return;
    const key = String(item.id || item.productId || url || title);
    if (seen.has(key)) return;
    seen.add(key);
    products.push({
      id: item.id ?? item.productId ?? null,
      title: String(title),
      price: price || null,
      currency: item.currency || offer.priceCurrency || "IRR",
      url: url ? normalizeProductUrl(url) : null,
      image: typeof image === "string" ? image : null
    });
  };

  // JSON-LD
  const jsonLdMatches = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const block of jsonLdMatches) {
    const body = block.replace(/^.*?>/s, "").replace(/<\/script>$/i, "");
    try { walk(JSON.parse(body), add, 0); } catch (_) {}
  }

  // Next/embedded JSON. This catches product payloads that are not exposed as JSON-LD.
  const scriptMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const block of scriptMatches) {
    if (products.length >= 20) break;
    const body = block.replace(/^.*?>/s, "").replace(/<\/script>$/i, "").trim();
    if (!body || (!body.includes("product") && !body.includes("price") && !body.includes("title"))) continue;
    try { walk(JSON.parse(body), add, 0); } catch (_) {}
  }

  return products.slice(0, 20);
}

function walk(value, add, depth) {
  if (depth > 12 || value == null) return;
  if (Array.isArray(value)) {
    for (const item of value) walk(item, add, depth + 1);
    return;
  }
  if (typeof value !== "object") return;
  add(value);
  for (const child of Object.values(value)) walk(child, add, depth + 1);
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
    if ((v.productId || v.id) && (v.title || v.name || v.productTitle)) count++;
    for (const x of Object.values(v)) visit(x, depth + 1);
  };
  visit(value, 0);
  return count;
}

function json(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": "no-store",
      ...extraHeaders
    }
  });
}