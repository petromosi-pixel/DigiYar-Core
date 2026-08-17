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
        version: "4.0.0-alpha.3"
      });
    }

    const query = url.searchParams.get("q");

    if (!query || !query.trim()) {
      return json({
        ok: false,
        error: "Missing q parameter",
        usage: "/?q=گوشی سامسونگ"
      }, 400);
    }

    const targetUrl =
      "https://api.digikala.com/v2/category/22/" +
      "?q=" + encodeURIComponent(query.trim()) +
      "&page=1";

    try {
      const upstream = await fetch(targetUrl, {
        method: "GET",
        redirect: "manual",
        headers: {
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0"
        }
      });

      const location = upstream.headers.get("location");
      const text = await upstream.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }

      return json({
        ok: upstream.ok,
        status: upstream.status,
        query: query.trim(),
        source: targetUrl,
        redirect: location,
        data
      });
    } catch (error) {
      return json({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        query: query.trim()
      }, 502);
    }
  }
};

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
