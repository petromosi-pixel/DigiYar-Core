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
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      try {
        const response = await fetch(
          `https://api.digikala.com/v1/search/?q=${encodeURIComponent(query)}&page=1`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36',
              'Accept-Language': 'fa-IR,fa;q=0.9'
            },
            redirect: 'manual'
          }
        );

        console.log('Status:', response.status);

        if ([301, 302, 307, 308].includes(response.status)) {
          const location = response.headers.get('location');
          console.log('Redirect to:', location);

          if (location) {
            const finalResponse = await fetch(location, {
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36'
              }
            });

            console.log('Final status:', finalResponse.status);

            if (finalResponse.ok) {
              const data = await finalResponse.json();
              const products = extractProducts(data);

              return new Response(JSON.stringify({
                success: true,
                results: products,
                total: products.length,
                query: query
              }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              });
            }
          }
        }

        if (response.ok) {
          const data = await response.json();
          const products = extractProducts(data);

          return new Response(JSON.stringify({
            success: true,
            results: products,
            total: products.length,
            query: query
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({
          success: false,
          error: 'API error: ' + response.status,
          status: response.status
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Unknown endpoint' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

function extractProducts(data) {
  if (!data || !data.data || !data.data.products) {
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
      storeName: 'دیجی‌کالا'
    };
  });
}