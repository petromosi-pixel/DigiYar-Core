/**
 * DigiYar V4
 * Cloudflare Search Proxy
 * Diagnostic / API bridge
 *
 * Routes:
 *   /health
 *   /?q=<search term>
 */

const DIGIKALA_SEARCH_ENDPOINT = "https://api.digikala.com/v1/search/?q=";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store"
    }
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method !== "GET") {
      return jsonResponse({
        ok: false,
        error: "Only GET requests are supported."
      }, 405);
    }

    if (url.pathname === "/health") {
      return jsonResponse({
        ok: true,
        service: "DigiYar Search Proxy",
        version: "4.0.0-alpha.1",
        worker: "digiyar-search-proxy"
      });
    }

    const query = (url.searchParams.get("q") || "").trim();

    if (!query) {
      return jsonResponse({
        ok: false,
        error: "Missing q parameter.",
        usage: "/?q=گوشی سامسونگ"
      }, 400);
    }

    const targetUrl = DIGIKALA_SEARCH_ENDPOINT + encodeURIComponent(query);

    try {
      const response = await fetch(targetUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "User-Agent": "DigiYar/4.0"
        }
      });

      const raw = await response.text();
      let data = null;

      try {
        data = JSON.parse(raw);
      } catch (_) {
        data = null;
      }

      return jsonResponse({
        ok: response.ok,
        status: response.status,
        query,
        source: targetUrl,
        data,
        raw: data === null ? raw : null
      }, 200);
    } catch (error) {
      return jsonResponse({
        ok: false,
        query,
        error: error && error.message ? error.message : String(error)
      }, 502);
    }
  }
};
