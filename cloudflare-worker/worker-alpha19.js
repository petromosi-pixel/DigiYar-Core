const VERSION = "4.0.0-alpha.19";
const API_BASE = "https://api.digikala.com";
const DIGI_BASE = "https://www.digikala.com";
const MAX_PRODUCTS = 20;

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
      return json({ ok: true, service: "DigiYar Search Proxy", version: VERSION, upstream: "digikala", strategy: "autocomplete_then_category_search" });
    }

    if (url.pathname === "/autocomplete") {
      const query = String(url.searchParams.get("q") || "").trim();
      if (!query) return json({ ok: false, error: "Missing q parameter" }, 400);
      return autocomplete(query);
    }

    if (url.pathname === "/search") {
      const query = String(url.searchParams.get("q") || "").trim();
      if (!query) return json({ ok: false, error: "Missing q parameter" }, 400);
      return search(query);
    }

    return json({ ok: false, error: "Unknown endpoint", endpoints: ["/health", "/search?q=گوشی", "/autocomplete?q=گوشی"] }, 404);
  }
};

async function upstream(path) {
  const response = await fetch(API_BASE + path, {
    method: "GET",
    redirect: "manual",
    headers: {
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "fa-IR,fa;q=0.9,en;q=0.8",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/143 Safari/537.36",
      "Referer": DIGI_BASE + "/",
      "Origin": DIGI_BASE
    }
  });

  const location = response.headers.get("location");
  if (!response.ok) return { ok: false, status: response.status, location };

  const text = await response.text();
  try {
    return { ok: true, status: response.status, data: JSON.parse(text) };
  } catch {
    return { ok: false, status: response.status, location, parseError: true };
  }
}

async function autocomplete(query) {
  try {
    const result = await upstream(`/v1/autocomplete/?q=${encodeURIComponent(query)}`);
    if (!result.ok) {
      return json({ ok: false, endpoint: "/autocomplete", query, source: "digikala", error: "Autocomplete unavailable", diagnostics: { upstreamStatus: result.status ?? null, redirectLocation: result.location ?? null, strategy: "real_autocomplete_no_follow" } }, 502);
    }

    const data = result.data?.data || {};
    const suggestions = Array.isArray(data.auto_complete)
      ? data.auto_complete.map(x => x?.keyword).filter(Boolean).slice(0, 10)
      : [];

    const categories = Array.isArray(data.categories)
      ? data.categories.map(x => {
          const c = x?.category || {};
          return { id: c.id ?? null, title_fa: c.title_fa || "", title_en: c.title_en || "", code: c.code || "", query: x?.keyword || query };
        }).filter(x => x.id).slice(0, 10)
      : [];

    return json({ ok: true, endpoint: "/autocomplete", query, source: "digikala", suggestions, categories, textLenzEligible: Boolean(data.is_text_lenz_eligible), diagnostics: { strategy: "real_autocomplete_no_follow", upstreamStatus: result.status } });
  } catch (error) {
    return json({ ok: false, endpoint: "/autocomplete", query, source: "digikala", error: error instanceof Error ? error.message : String(error) }, 502);
  }
}

async function search(query) {
  try {
    // The current Digikala search flow is category-scoped: autocomplete supplies
    // the category id and keyword, then v2/category/{id}/ returns the products.
    const auto = await upstream(`/v1/autocomplete/?q=${encodeURIComponent(query)}`);
    if (!auto.ok) {
      return json({ ok: false, endpoint: "/search", query, source: "digikala", error: "Autocomplete unavailable", diagnostics: { stage: "autocomplete", upstreamStatus: auto.status ?? null, redirectLocation: auto.location ?? null } }, 502);
    }

    const categories = Array.isArray(auto.data?.data?.categories) ? auto.data.data.categories : [];
    const candidate = categories.find(x => x?.category?.id) || null;
    if (!candidate) {
      return json({ ok: false, endpoint: "/search", query, source: "digikala", error: "No search category found", diagnostics: { stage: "autocomplete", suggestions: auto.data?.data?.auto_complete?.slice?.(0, 10) || [], categoryCount: categories.length } }, 404);
    }

    const categoryId = candidate.category.id;
    const keyword = candidate.keyword || query;
    const path = `/v2/category/${categoryId}/?q=${encodeURIComponent(keyword)}&page=1&sort=1`;
    const result = await upstream(path);
    if (!result.ok) {
      return json({ ok: false, endpoint: "/search", query, source: "digikala", error: "Category Search API unavailable", diagnostics: { stage: "category_search", apiPath: path, categoryId, keyword, upstreamStatus: result.status ?? null, redirectLocation: result.location ?? null, strategy: "autocomplete_then_v2_category_no_follow" } }, 502);
    }

    const products = extractProducts(result.data).slice(0, MAX_PRODUCTS);
    return json({
      ok: true,
      status: result.status,
      endpoint: "/search",
      query,
      source: "digikala",
      apiPath: path,
      category: { id: categoryId, title_fa: candidate.category.title_fa || "", title_en: candidate.category.title_en || "", code: candidate.category.code || "", keyword },
      rawCount: products.length,
      products,
      diagnostics: { strategy: "autocomplete_then_v2_category", upstreamSearchStatus: result.status, subrequests: 2 }
    });
  } catch (error) {
    return json({ ok: false, endpoint: "/search", query, source: "digikala", error: error instanceof Error ? error.message : String(error) }, 502);
  }
}

function extractProducts(payload) {
  const widgets = payload?.data?.widgets;
  if (!Array.isArray(widgets)) return [];

  const listing = widgets.find(w => w?.type === "vertical_product_listing");
  const productWidgets = listing?.data?.widgets;
  if (!Array.isArray(productWidgets)) return [];

  return productWidgets
    .filter(w => w?.type === "product" && w?.data?.status === "marketable")
    .map(w => normalizeProduct(w.data))
    .filter(Boolean);
}

function normalizeProduct(p) {
  const variant = p.default_variant || {};
  const price = variant.price || {};
  const rating = p.rating || {};
  const url = p.url?.uri || p.url?.url || `/product/dkp-${p.id}/`;
  const image = findImage(p);

  if (!p.id || !p.title_fa) return null;
  return {
    id: p.id,
    title: String(p.title_fa).trim(),
    title_en: p.title_en || null,
    price: price.selling_price ?? 0,
    rrpPrice: price.rrp_price ?? 0,
    discountPercent: price.discount_percent ?? 0,
    currency: "IRR",
    url: /^https?:\/\//i.test(url) ? url : DIGI_BASE + (String(url).startsWith("/") ? url : "/" + url),
    image,
    rating: rating.rate ?? null,
    ratingCount: rating.count ?? null,
    brand: p.data_layer?.brand ?? null,
    category: p.data_layer?.category ?? null,
    status: p.status
  };
}

function findImage(value, depth = 0) {
  if (depth > 8 || value == null) return null;
  if (typeof value === "string") return /^https?:\/\//i.test(value) ? value : null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findImage(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  if (typeof value !== "object") return null;

  for (const key of ["image_url", "imageUrl", "thumbnail_url", "thumbnailUrl", "thumbnail", "image", "photo", "cover", "src", "url"]) {
    const found = findImage(value[key], depth + 1);
    if (found) return found;
  }
  for (const child of Object.values(value)) {
    const found = findImage(child, depth + 1);
    if (found) return found;
  }
  return null;
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" }
  });
}
