export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const query = url.searchParams.get('q');

    if (path === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (path === '/api/search') {
      if (!query) {
        return new Response(JSON.stringify({ error: 'Missing q' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        query: query,
        message: 'Search endpoint works!'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown endpoint' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
