/* =========================================================
   DigiYar V4
   Cloudflare Worker — Digikala Search Proxy
   =========================================================

   Purpose:
   Browser → Cloudflare Worker → Digikala API

   This removes the browser-side CORS limitation while keeping
   the Digikala endpoint out of the browser request path.

   Deploy this file as a Cloudflare Worker, then put the Worker
   URL in js/product-retrieval.js as proxyEndpoint.
   ========================================================= */

const DIGIKALA_ENDPOINT = "https://api.digikala.com/v1/search/?q=";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Cache-Control": "no-store"
};

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
      });
    }

    if (request.method !== "GET") {
      return json({ error: "Method not allowed" }, 405);
    }

    const incomingUrl = new URL(request.url);
    const query = String(incomingUrl.searchParams.get("q") || "").trim();

    if (!query) {
      return json({ error: "Missing q parameter" }, 400);
    }

    const targetUrl = DIGIKALA_ENDPOINT + encodeURIComponent(query);

    try {
      const response = await fetch(targetUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "User-Agent": "DigiYar/4.0"
        }
      });

      const body = await response.text();
      const headers = new Headers(CORS_HEADERS);
      headers.set(
        "Content-Type",
        response.headers.get("Content-Type") || "application/json; charset=utf-8"
      );

      return new Response(body, {
        status: response.status,
        headers
      });
    } catch (error) {
      return json({
        error: "Upstream Digikala request failed",
        message: error && error.message ? error.message : String(error)
      }, 502);
    }
  }
};

function json(payload, status) {
  return new Response(JSON.stringify(payload), {
    status: status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}
