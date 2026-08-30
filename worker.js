export default {
  async fetch(request) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
    const url = new URL(request.url);
    const path = url.pathname;
    const query = url.searchParams.get('q');

    if (path === '/health') return json({ status: 'ok' }, corsHeaders);
    if (path === '/api/search') {
      if (!query) return json({ error: 'Missing q' }, corsHeaders);
      try {
        const [digikala, snappshop] = await Promise.all([searchDigikala(query), searchSnappShop(query)]);
        const products = [...digikala, ...snappshop].slice(0, 6);
        return json({ success: true, results: products, total: products.length, query }, corsHeaders);
      } catch (error) {
        return json({ success: false, error: error.message }, corsHeaders);
      }
    }
    return json({ error: 'Unknown endpoint' }, corsHeaders);
  }
};

function json(data, corsHeaders) {
  return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function searchDigikala(query) {
  const urls = [
    `https://api.digikala.com/v1/search/?q=${encodeURIComponent(query)}&page=1`,
    `https://api.digikala.com/v2/search/?q=${encodeURIComponent(query)}&page=1`,
    `https://digikala.com/api/search/?q=${encodeURIComponent(query)}&page=1`,
    `https://www.digikala.com/api/search/?q=${encodeURIComponent(query)}&page=1`,
    `https://search.digikala.com/api/search/?q=${encodeURIComponent(query)}&page=1`
  ];
  for (const apiUrl of urls) {
    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
          'Accept-Language': 'fa-IR,fa;q=0.9',
          'Origin': 'https://www.digikala.com'
        },
        redirect: 'follow'
      });
      if (!response.ok) continue;
      const data = await response.json();
      const source = data?.data?.products;
      if (!Array.isArray(source) || !source.length) continue;
      return source.slice(0, 3).map(function (p) {
        const image = p?.images?.main?.url?.[0] || '';
        const price = p?.default_variant?.price?.selling_price || 0;
        const productUrl = `https://www.digikala.com/product/dkp-${p.id}`;
        return {
          id: p.id,
          name: p.title_fa || p.title_en || 'بدون عنوان',
          price,
          image,
          productUrl,
          url: productUrl,
          available: price > 0,
          rating: p?.rating?.rate || 0,
          reviews: p?.rating?.count || 0,
          store: 'digikala',
          storeName: 'دیجی‌کالا'
        };
      });
    } catch (e) { console.error('Digikala URL failed:', apiUrl, e.message); }
  }
  return [];
}

async function searchSnappShop(query) {
  // Adapter boundary for V5. No unverified product IDs/URLs are fabricated.
  // This remains empty until a verified SnappShop product-search source is wired in.
  return [];
}
