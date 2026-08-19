export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method !== "GET") {
      return json({ ok: false, error: "Method not allowed" }, 405);
    }

    if (url.pathname === "/health") {
      return json({
        ok: true,
        service: "DigiYar Search Proxy",
        version: "4.0.0-alpha.5"
      });
    }

    if (url.pathname === "/search") {
      const query = url.searchParams.get("q");
      if (!query || !query.trim()) {
        return json({ ok: false, error: "Missing q parameter" }, 400);
      }

      const targetUrl =
        "https://api.digikala.com/v1/search/?q=" +
        encodeURIComponent(query.trim());

      return proxyJson(targetUrl, query.trim());
    }

    if (url.pathname === "/autocomplete") {
      const query = url.searchParams.get("q");
      if (!query || !query.trim()) {
        return json({ ok: false, error: "Missing q parameter" }, 400);
      }

      const targetUrl =
        "https://api.digikala.com/v1/autocomplete/?q=" +
        encodeURIComponent(query.trim());

      return proxyJson(targetUrl, query.trim());
    }

    return json({
      ok: false,
      error: "Unknown endpoint",
      endpoints: ["/health", "/search?q=گوشی", "/autocomplete?q=گوشی"]
    }, 404);
  }
};

async function proxyJson(targetUrl, query) {
  try {
    const upstream = await fetch(targetUrl, {
      method: "GET",
      redirect: "follow",
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; DigiYar/4.0)"
      }
    });

    const text = await upstream.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    return json({
      ok: upstream.ok,
      status: upstream.status,
      query,
      source: targetUrl,
      data
    }, upstream.ok ? 200 : upstream.status);
  } catch (error) {
    return json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      query
    }, 502);
  }
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store"
    }
  });
}
