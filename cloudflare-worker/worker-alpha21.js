const VERSION = "4.0.0-alpha.21";
const API_BASE = "https://api.digikala.com";
const DIGI_BASE = "https://www.digikala.com";
const MAX_PRODUCTS = 10;
const DETAIL_LIMIT = 3;

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
      return json({ ok: true, service: "DigiYar Search Proxy", version: VERSION, upstream: "digikala", strategy: "search_page_product_id_discovery_v2" });
    }

    const query = String(url.searchParams.get("q") || "").trim();
    if (!query) return json({ ok: false, error: "Missing q parameter" }, 400);

    if (url.pathname === "/discovery") return discover(query);
    if (url.pathname === "/search") return search(query);
    if (url.pathname === "/autocomplete") return json({ ok: false, endpoint: "/autocomplete", query, error: "Autocomplete disabled in alpha.21 discovery build", diagnostics: { strategy: "search_page_product_id_discovery_v2" } }, 501);

    return json({ ok: false, error: "Unknown endpoint", endpoints: ["/health", "/search?q=گوشی", "/discovery?q=گوشی"] }, 404);
  }
};

function browserHeaders() {
  return { "Accept": "text/html,application/xhtml+xml,application/json,text/plain,*/*", "Accept-Language": "fa-IR,fa;q=0.9,en;q=0.8", "User-Agent": "Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 Chrome/143 Mobile Safari/537.36", "Referer": DIGI_BASE + "/", "Origin": DIGI_BASE };
}

function apiHeaders() {
  return { "Accept": "application/json, text/plain, */*", "Accept-Language": "fa-IR,fa;q=0.9,en;q=0.8", "User-Agent": "Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 Chrome/143 Mobile Safari/537.36", "X-Web-Client-Id": "web", "X-Web-Client": "desktop", "X-Web-Optimize-Response": "1", "Origin": DIGI_BASE, "Referer": DIGI_BASE + "/" };
}

async function discover(query) {
  const pageUrl = `${DIGI_BASE}/search/?q=${encodeURIComponent(query)}`;
  try {
    const response = await fetch(pageUrl, { method: "GET", redirect: "follow", headers: browserHeaders() });
    const finalUrl = response.url;
    const contentType = response.headers.get("content-type") || "";
    const html = await response.text();
    const ids = extractProductIds(html).slice(0, MAX_PRODUCTS);
    return json({ ok: response.ok && ids.length > 0, endpoint: "/discovery", query, source: "digikala", diagnostics: { stage: "search_page", pageUrl, finalUrl, upstreamStatus: response.status, contentType, htmlBytes: html.length, productIdCount: ids.length, strategy: "fetch_search_page_extract_dkp_ids" }, productIds: ids }, response.ok && ids.length > 0 ? 200 : 502);
  } catch (error) {
    return json({ ok: false, endpoint: "/discovery", query, source: "digikala", error: error instanceof Error ? error.message : String(error), diagnostics: { stage: "search_page", pageUrl, strategy: "fetch_search_page_extract_dkp_ids" } }, 502);
  }
}

async function search(query) {
  const pageUrl = `${DIGI_BASE}/search/?q=${encodeURIComponent(query)}`;
  try {
    const response = await fetch(pageUrl, { method: "GET", redirect: "follow", headers: browserHeaders() });
    const finalUrl = response.url;
    const contentType = response.headers.get("content-type") || "";
    const html = await response.text();
    const ids = extractProductIds(html).slice(0, MAX_PRODUCTS);
    if (!response.ok || ids.length === 0) return json({ ok: false, endpoint: "/search", query, source: "digikala", error: response.ok ? "No product IDs found in search page" : "Search page unavailable", diagnostics: { stage: "search_page", pageUrl, finalUrl, upstreamStatus: response.status, contentType, htmlBytes: html.length, productIdCount: ids.length, strategy: "search_page_product_id_discovery_v2" } }, 502);

    const products = [];
    for (const id of ids.slice(0, DETAIL_LIMIT)) {
      const detail = await getProductDetail(id);
      if (detail) products.push(normalizeProduct(detail, id));
    }
    return json({ ok: products.length > 0, endpoint: "/search", query, source: "digikala", products, rawProductIds: ids, diagnostics: { stage: "product_detail_v2", pageUrl, searchPageStatus: response.status, searchPageHtmlBytes: html.length, discoveredIds: ids.length, detailLimit: DETAIL_LIMIT, completedDetails: products.length, strategy: "search_page_product_id_discovery_v2", subrequests: 1 + Math.min(ids.length, DETAIL_LIMIT) } });
  } catch (error) {
    return json({ ok: false, endpoint: "/search", query, source: "digikala", error: error instanceof Error ? error.message : String(error) }, 502);
  }
}

function extractProductIds(html) {
  const out = [];
  const seen = new Set();
  const patterns = [/\/product\/dkp-(\d+)/gi, /dkp-(\d+)/gi];
  for (const re of patterns) {
    let match;
    while ((match = re.exec(html)) !== null && out.length < MAX_PRODUCTS * 5) {
      const id = match[1];
      if (!seen.has(id)) { seen.add(id); out.push(Number(id)); }
    }
  }
  return out;
}

async function getProductDetail(id) {
  const response = await fetch(`${API_BASE}/v2/product/${id}/`, { method: "GET", redirect: "follow", headers: apiHeaders() });
  if (!response.ok) return null;
  try { return await response.json(); } catch { return null; }
}

function normalizeProduct(payload, fallbackId) {
  const p = payload?.data?.product || payload?.product || payload?.data || {};
  const variant = p.default_variant || {};
  const price = variant.price || p.price || {};
  const images = p.images || {};
  const mainImage = images.main?.url?.[0] || images.main?.webp_url?.[0] || images.main?.url || null;
  const id = p.id || fallbackId;
  return { id, variantId: variant.id ?? null, title: p.title_fa || p.title_en || "", price: price.selling_price ?? variant.price?.selling_price ?? null, rrpPrice: price.rrp_price ?? variant.price?.rrp_price ?? null, discountPercent: price.discount_percent ?? variant.price?.discount_percent ?? null, currency: "IRR", url: p.url?.uri ? DIGI_BASE + p.url.uri : `${DIGI_BASE}/product/dkp-${id}/`, image: mainImage, brand: p.data_layer?.brand || null, category: p.data_layer?.item_category3 || p.data_layer?.item_category2 || null, rating: p.rating?.rate ?? null, ratingCount: p.rating?.count ?? null, status: p.status || variant.status || null, stock: price.marketable_stock ?? null };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" } });
}
