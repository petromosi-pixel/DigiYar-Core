export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          ok: true,
          service: "DigiYar Search Proxy",
          version: "4.0.0-alpha.1"
        }, null, 2),
        {
          headers: {
            "Content-Type": "application/json; charset=UTF-8",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }

    return new Response("DigiYar Worker is connected to GitHub!", {
      headers: {
        "Content-Type": "text/plain; charset=UTF-8"
      }
    });
  }
};
