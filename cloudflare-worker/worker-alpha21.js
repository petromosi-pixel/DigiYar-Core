const VERSION = "4.0.0-alpha.21.1";
const API_BASE = "https://api.digikala.com";
const DIGI_BASE = "https://www.digikala.com";
const CORS = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET, OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"no-store"};

export default { async fetch(request) {
  const url = new URL(request.url);
  if (request.method === "OPTIONS") return new Response(null,{status:204,headers:CORS});
  if (request.method !== "GET") return json({ok:false,error:"Method not allowed"},405);
  if (url.pathname === "/health") return json({ok:true,service:"DigiYar Search Proxy",version:VERSION,upstream:"digikala",strategy:"live_api_then_search_page_forensics"});
  const q = String(url.searchParams.get("q")||"").trim();
  if (!q) return json({ok:false,error:"Missing q parameter"},400);
  if (url.pathname === "/forensics") return forensics(q);
  if (url.pathname === "/discovery") return discovery(q);
  if (url.pathname === "/search") return search(q);
  if (url.pathname === "/autocomplete") return json({ok:false,error:"Autocomplete disabled in alpha.21.1"},501);
  return json({ok:false,error:"Unknown endpoint",endpoints:["/health","/forensics?q=گوشی","/search?q=گوشی","/discovery?q=گوشی"]},404);
} };

function headers(){return {"Accept":"application/json,text/html,application/xhtml+xml,text/plain,*/*","Accept-Language":"fa-IR,fa;q=0.9,en;q=0.8","User-Agent":"Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 Chrome/143 Mobile Safari/537.36","Referer":DIGI_BASE+"/","Origin":DIGI_BASE};}
async function fetchPage(q){const page=`${DIGI_BASE}/search/?q=${encodeURIComponent(q)}`;const r=await fetch(page,{redirect:"follow",headers:headers()});return {r,html:await r.text(),page};}

async function apiSearch(q){
  const candidates=[`${API_BASE}/v1/search/text-lenz/?q=${encodeURIComponent(q)}`,`${DIGI_BASE}/api/search/?q=${encodeURIComponent(q)}`];
  const attempts=[];
  for(const endpoint of candidates){
    try{const r=await fetch(endpoint,{redirect:"follow",headers:headers()});const text=await r.text();attempts.push({endpoint,status:r.status,contentType:r.headers.get("content-type")||"",bytes:text.length});if(!r.ok)continue;let data;try{data=JSON.parse(text);}catch(_){continue;}const products=normalizeProducts(data);if(products.length)return {products,attempts,rawShape:shape(data)};}
    catch(e){attempts.push({endpoint,error:e instanceof Error?e.message:String(e)});}
  }
  return {products:[],attempts};
}
function normalizeProducts(data){
  const pools=[];
  const walk=(x,depth=0)=>{if(depth>7||x==null)return;if(Array.isArray(x)){for(const v of x)walk(v,depth+1);return;}if(typeof x!=="object")return;if((x.id||x.product_id||x.pk)&&((x.title_fa||x.title||x.name||x.title_en)&&(x.url||x.uri||x.product_url||x.images||x.image)))pools.push(x);for(const k of Object.keys(x))walk(x[k],depth+1);};
  walk(data);const seen=new Set();
  return pools.map(x=>{const id=Number(x.id||x.product_id||x.pk);const title=x.title_fa||x.title||x.name||x.title_en||"";const uri=x.url?.uri||x.uri||x.product_url||x.url;const image=x.images?.main?.url?.[0]||x.images?.main?.webp_url?.[0]||x.image||x.images?.[0]?.url||x.thumbnail||null;const price=x.price?.selling_price??x.selling_price??x.selling_price_rial??x.price?.rrp_price??null;if(!id||seen.has(id))return null;seen.add(id);return {id,title_fa:title,url:typeof uri==="string"?(uri.startsWith("http")?uri:DIGI_BASE+uri):`${DIGI_BASE}/product/dkp-${id}/`,image,price};}).filter(Boolean).slice(0,20);
}
function shape(x){if(Array.isArray(x))return "array";if(x&&typeof x==="object")return Object.keys(x).slice(0,20);return typeof x;}

async function search(q){
  try{const api=await apiSearch(q);if(api.products.length)return json({ok:true,endpoint:"/search",query:q,source:"digikala",strategy:"live_api",products:api.products,diagnostics:{attempts:api.attempts,rawShape:api.rawShape}});const d=await discovery(q);if(d.ok)return d.response;return json({ok:false,endpoint:"/search",query:q,source:"digikala",error:"Search unavailable",diagnostics:{apiAttempts:api.attempts,discovery:d.diagnostics}},502);}
  catch(e){return json({ok:false,endpoint:"/search",query:q,error:e instanceof Error?e.message:String(e)},502);}
}
async function discovery(q){try{const {r,html,page}=await fetchPage(q);const ids=[...html.matchAll(/(?:\/product\/)?dkp-(\d+)/gi)].map(m=>Number(m[1])).filter((v,i,a)=>a.indexOf(v)===i).slice(0,10);const diagnostics={stage:"search_page",pageUrl:page,finalUrl:r.url,upstreamStatus:r.status,htmlBytes:html.length,productIdCount:ids.length};if(r.ok&&ids.length>0){const products=await hydrate(ids);return {ok:true,response:json({ok:true,endpoint:"/discovery",query:q,source:"digikala",strategy:"search_page_then_product",diagnostics,products})};}return {ok:false,diagnostics};}catch(e){return {ok:false,diagnostics:{error:e instanceof Error?e.message:String(e)}};}}
async function hydrate(ids){const out=[];for(const id of ids.slice(0,10)){try{const r=await fetch(`${API_BASE}/v2/product/${id}/`,{redirect:"follow",headers:headers()});if(!r.ok)continue;const d=await r.json();const p=d?.data?.product||d?.product||d?.data||d;const n=normalizeProducts(p);if(n[0])out.push(n[0]);}catch(_){} }return out;}

async function forensics(q){try{const {r,html,page}=await fetchPage(q);const scripts=[...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(m=>m[1]).slice(0,40);const urls=[...html.matchAll(/https?:[^"'\s<>]+/gi)].map(m=>m[0]).filter(x=>/api|search|product|autocomplete|graphql/i.test(x)).slice(0,60);const paths=[...html.matchAll(/(?:https?:\/\/[^"'\s<>]+)?\/(?:api|v\d+|search|product|autocomplete|graphql)[^"'\s<>]*/gi)].map(m=>m[0]).filter(Boolean).slice(0,60);const ids=[...html.matchAll(/dkp-(\d+)/gi)].map(m=>m[1]).filter((v,i,a)=>a.indexOf(v)===i).slice(0,30);const markers={nextData:/__NEXT_DATA__/i.test(html),initialState:/__INITIAL_STATE__/i.test(html),api:/api/i.test(html),search:/search/i.test(html),product:/product/i.test(html),graphql:/graphql/i.test(html),dkp:ids.length>0};return json({ok:r.ok,endpoint:"/forensics",query:q,source:"digikala",diagnostics:{stage:"search_page_html_forensics",pageUrl:page,finalUrl:r.url,upstreamStatus:r.status,contentType:r.headers.get("content-type")||"",htmlBytes:html.length,strategy:"script_url_marker_path_extraction"},markers,scriptSrcs:scripts,candidateUrls:[...new Set([...urls,...paths])].slice(0,100),productIds:ids,snippets:{api:snip(html,/api/i),search:snip(html,/search/i),product:snip(html,/product/i),dkp:snip(html,/dkp-\d+/i)}});}catch(e){return json({ok:false,endpoint:"/forensics",query:q,error:e instanceof Error?e.message:String(e)},502);}}
function snip(html,re){const out=[];let m;while((m=re.exec(html))&&out.length<5){const start=Math.max(0,m.index-140);out.push(html.slice(start,Math.min(html.length,m.index+260)).replace(/\s+/g," "));}return out;}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{...CORS,"Content-Type":"application/json; charset=utf-8"}});}
