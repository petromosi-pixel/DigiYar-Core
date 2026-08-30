export default {
  async fetch(request) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const query = url.searchParams.get('q');

    if (path === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (path === '/api/search') {
      if (!query) {
        return new Response(JSON.stringify({ error: 'Missing q' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      try {
        const products = await searchDigikala(query);

        return new Response(JSON.stringify({
          success: true,
          results: products,
          total: products.length,
          query: query
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Unknown endpoint' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

async function searchDigikala(query) {
  const url = `https://api.digikala.com/v1/search/?q=${encodeURIComponent(query)}&page=1&size=10`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
        'Accept-Language': 'fa'
      },
      redirect: 'error'
    });

    if (!response.ok) {
      throw new Error('API error: ' + response.status);
    }

    const data = await response.json();

    if (!data.data || !data.data.products) {
      return [];
    }

    return data.data.products.slice(0, 3).map(function(p) {
      let image = '';
      if (p.images && p.images.main && p.images.main.url && p.images.main.url.length > 0) {
        image = p.images.main.url[0];
      }

      let price = 0;
      if (p.default_variant && p.default_variant.price) {
        price = p.default_variant.price.selling_price || 0;
      }

      return {
        id: p.id,
        title: p.title_fa || p.title_en || 'بدون عنوان',
        price: price,
        originalPrice: price,
        image: image,
        url: `https://www.digikala.com/product/dkp-${p.id}`,
        available: price > 0,
        rating: p.rating?.rate || 0,
        reviews: p.rating?.count || 0,
        store: 'digikala',
        storeName: 'دیجیکالا'
      };
    });

  } catch (error) {
    console.error('Search error:', error.message);
    return [];
  }
}
