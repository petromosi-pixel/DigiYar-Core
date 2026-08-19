export default {
  async fetch(request) {
    const url = new URL(request.url);
    const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "GET") return json({ ok:false, error:"Method not allowed" },405,cors);
    if (url.pathname === "/health") return json({ ok:true, service:"DigiYar Search Proxy", version:"4.0.0-alpha.6" },200,cors);
    if (url.pathname === "/search") {
      const query=url.searchParams.get("q");
      if(!query||!query.trim())return json({ok:false,error:"Missing q parameter"},400,cors);
      const target="https://api.digikala.com/v1/search/?q="+encodeURIComponent(query.trim());
      return proxyJson(target,query.trim(),cors);
    }
    if (url.pathname === "/autocomplete") {
      const query=url.searchParams.get("q");
      if(!query||!query.trim())return json({ok:false,error:"Missing q parameter"},400,cors);
      const target="https://api.digikala.com/v1/autocomplete/?q="+encodeURIComponent(query.trim());
      return proxyJson(target,query.trim(),cors);
    }
    return json({ok:false,error:"Unknown endpoint",endpoints:["/health","/search?q=گوشی","/autocomplete?q=گوشی"]},404,cors);
  }
};

async function proxyJson(targetUrl, query, cors) {
  try {
    const upstream=await fetch(targetUrl,{method:"GET",redirect:"follow",headers:{"Accept":"application/json","User-Agent":"Mozilla/5.0 (compatible; DigiYar/4.0)"}});
    const text=await upstream.text(); let data;
    try{data=JSON.parse(text);}catch{data={raw:text};}
    return json({ok:upstream.ok,status:upstream.status,query,source:targetUrl,data},upstream.ok?200:upstream.status,cors);
  } catch(error) { return json({ok:false,error:error instanceof Error?error.message:String(error),query},502,cors); }
}
function json(payload,status=200,extraHeaders={}) {
  return new Response(JSON.stringify(payload,null,2),{status,headers:{"Content-Type":"application/json; charset=UTF-8","Cache-Control":"no-store",...extraHeaders}});
}
