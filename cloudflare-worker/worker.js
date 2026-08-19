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
        version: "4.0.0-alpha.8",
        upstream: "digikala"
      }, 200, cors);
    }

    if (url.pathname === "/search" || url.pathname === "/autocomplete") {
      const query = url.searchParams.get("q");
      if (!query || !query.trim()) {
        return json({ ok: false, error: "Missing q parameter" }, 400, cors);
      }

      const endpoint = url.pathname;
      const path = endpoint === "/search" ? "/v1/search/" : "/v1/autocomplete/";
      const target = "https://api.digikala.com" + path + "?q=" + encodeURIComponent(query.trim());
      return proxyJson(target, query.trim(), cors, endpoint);
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
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site",
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

async function proxyJson(targetUrl, query, cors, endpoint) {
  try {
    let upstream = await fetch(targetUrl, {
      method: "GET",
      redirect: "manual",
      headers: buildHeaders()
    });

    updateCookieFromResponse(upstream);
    const firstLocation = upstream.headers.get("location");

    // Retry the API after establishing digicdn_cookie. Do not follow a
    // self-redirect indefinitely; DigiKala can return a 307 challenge page.
    for (let attempt = 0; attempt < 2 && (upstream.status === 307 || upstream.status === 308); attempt++) {
      const location = upstream.headers.get("location");
      const nextUrl = location ? new URL(location, targetUrl).toString() : targetUrl;
      upstream = await fetch(nextUrl, {
        method: "GET",
        redirect: "manual",
        headers: buildHeaders()
      });
      updateCookieFromResponse(upstream);
    }

    if (!upstream.ok && (upstream.status === 307 || upstream.status === 308)) {
      // API challenge remains unresolved. Fall back to the public search page,
      // which is the same product surface used by the web application.
      const fallback = await fetch(
        "https://www.digikala.com/search/?q=" + encodeURIComponent(query),
        {
          method: "GET",
          redirect: "follow",
          headers: {
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "fa-IR,fa;q=0.9,en;q=0.8",
            "User-Agent": buildHeaders()["User-Agent"]
          }
        }
      );

      const html = await fallback.text();
      const products = extractProductsFromHtml(html);
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

    const text = await upstream.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text.slice(0, 4000) };
    }

    return json({
      ok: upstream.ok,
      status: upstream.status,
      endpoint,
      query,
      source: "digikala",
      cookieEstablished: Boolean(cachedDigiCdnCookie),
      location: upstream.headers.get("location") || firstLocation || null,
      data
    }, upstream.ok ? 200 : upstream.status, cors);
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

function extractProductsFromHtml(html) {
  const products = [];
  const seen = new Set();

  // Prefer JSON-LD product objects when available.
  const jsonLdMatches = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const block of jsonLdMatches) {
    const body = block.replace(/^.*?>/s, "").replace(/<\/script>$/i, "");
    try {
      const value = JSON.parse(body);
      const items = Array.isArray(value) ? value : [value];
      for (const item of items) {
        if (item?.['@type'] === 'Product' && item.name) {
          const price = Number(item.offers?.price || item.offers?.lowPrice || 0);
          const url = item.url || "";
          const key = url || item.name;
          if (!seen.has(key)) {
            seen.add(key);
            products.push({
              id: null,
              title: item.name,
              price,
              currency: item.offers?.priceCurrency || "IRR",
              url,
              image: Array.isArray(item.image) ? item.image[0] : item.image || null
            });
          }
        }
      }
    } catch (_) {}
  }

  return products.slice(0, 20);
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