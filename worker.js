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
  const methods = [
    async function() {
      const response = await fetch(
        `https://api.digikala.com/v1/search/?q=${encodeURIComponent(query)}&page=1&size=10`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          redirect: 'follow'
        }
      );

      if (!response.ok) return [];
      const data = await response.json();
      return extractProducts(data);
    },

    async function() {
      const response = await fetch(
        `https://api.digikala.com/v2/search/?q=${encodeURIComponent(query)}&page=1`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0'
          },
          redirect: 'follow'
        }
      );

      if (!response.ok) return [];
      const data = await response.json();
      return extractProducts(data);
    },

    async function() {
      const response = await fetch(
        `https://www.digikala.com/search/?q=${encodeURIComponent(query)}`,
        {
          headers: {
            'Accept': 'text/html',
            'User-Agent': 'Mozilla/5.0'
          }
        }
      );

      if (!response.ok) return [];
      const text = await response.text();
      const match = text.match(/__NEXT_DATA__\s*=\s*({.*?})\s*<\/script>/);

      if (match) {
        const data = JSON.parse(match[1]);
        return extractProductsFromNextData(data);
      }

      return [];
    }
  ];

  for (const method of methods) {
    try {
      const products = await method();
      if (products.length > 0) return products;
    } catch (e) {
      console.error('Method failed:', e.message);
    }
  }

  return [];
}

function extractProducts(data) {
  if (!data?.data?.products || !Array.isArray(data.data.products)) return [];

  return data.data.products.slice(0, 3).map(function(p) {
    let image = '';
    const imageUrl = p?.images?.main?.url;

    if (Array.isArray(imageUrl) && imageUrl.length > 0) {
      image = imageUrl[0];
    } else if (typeof imageUrl === 'string') {
      image = imageUrl;
    }

    const price = p?.default_variant?.price?.selling_price || 0;

    return {
      id: p.id,
      title: p.title_fa || p.title_en || 'بدون عنوان',
      price: price,
      originalPrice: p?.default_variant?.price?.rrp_price || price,
      image: image,
      url: `https://www.digikala.com/product/dkp-${p.id}`,
      available: price > 0,
      rating: p?.rating?.rate || 0,
      reviews: p?.rating?.count || 0,
      store: 'digikala',
      storeName: 'دیجی‌کالا'
    };
  });
}

function extractProductsFromNextData(data) {
  try {
    const products = data?.props?.pageProps?.data?.products || [];

    return products.slice(0, 3).map(function(p) {
      const imageUrl = p?.images?.main?.url;
      let image = '';

      if (Array.isArray(imageUrl) && imageUrl.length > 0) {
        image = imageUrl[0];
      } else if (typeof imageUrl === 'string') {
        image = imageUrl;
      }

      const price = p?.default_variant?.price?.selling_price || 0;

      return {
        id: p.id,
        title: p.title_fa || p.title_en || 'بدون عنوان',
        price: price,
        originalPrice: p?.default_variant?.price?.rrp_price || price,
        image: image,
        url: `https://www.digikala.com/product/dkp-${p.id}`,
        available: price > 0,
        rating: p?.rating?.rate || 0,
        reviews: p?.rating?.count || 0,
        store: 'digikala',
        storeName: 'دیجی‌کالا'
      };
    });
  } catch (e) {
    return [];
  }
}
