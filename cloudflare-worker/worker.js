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
        version: "4.0.0-alpha.7",
        upstream: "digikala"
      }, 200, cors);
    }

    if (url.pathname === "/search" || url.pathname === "/autocomplete") {
      const query = url.searchParams.get("q");
      if (!query || !query.trim()) {
        return json({ ok: false, error: "Missing q parameter" }, 400, cors);
      }

      const path = url.pathname === "/search" ? "/v1/search/" : "/v1/autocomplete/";
      const target = "https://api.digikala.com" + path + "?q=" + encodeURIComponent(query.trim());
      return proxyJson(target, query.trim(), cors, url.pathname);
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
    "Accept": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/143 Safari/537.36",
    "X-Web-Client-Id": "web",
    "X-Web-Client": "desktop",
    "X-Web-Optimize-Response": "1",
    "Referer": "https://www.digikala.com/",
    ...(cachedDigiCdnCookie ? { "Cookie": `digicdn_cookie=${cachedDigiCdnCookie};` } : {})
  };
}

function updateCookieFromResponse(response) {
  const setCookie = response.headers.get("set-cookie");
  if (!setCookie) return;
  const match = setCookie.match(/digicdn_cookie=([^;\s]+)/);
  if (match?.[1]) cachedDigiCdnCookie = match[1];
}

async function proxyJson(targetUrl, query, cors, endpoint) {
  try {
    let upstream = await fetch(targetUrl, {
      method: "GET",
      redirect: "manual",
      headers: buildHeaders()
    });

    updateCookieFromResponse(upstream);

    // DigiKala may issue a 307 redirect to the same URL while establishing
    // digicdn_cookie. Retry once with the cookie instead of following the
    // redirect blindly, which causes Cloudflare's "Too many redirects".
    if (upstream.status === 307 || upstream.status === 308) {
      upstream = await fetch(targetUrl, {
        method: "GET",
        redirect: "manual",
        headers: buildHeaders()
      });
      updateCookieFromResponse(upstream);
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
