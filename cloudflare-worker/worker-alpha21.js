const VERSION = "4.0.0-alpha.21.1";
const API_BASE = "https://api.digikala.com";
const DIGI_BASE = "https://www.digikala.com";
const CORS = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET, OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"no-store"};

export default { async fetch(request) {
  const url = new URL(request.url);
  if (request.method === "OPTIONS") return new Response(null,{status:204,headers:CORS});
  if (request.method !== "GET") return json({ok:false,error:"Method not allowed"},405);
  if (url.pathname === "/health") return json({ok:true,service:"DigiYar Search Proxy",version:VERSION,upstream:"digikala",strategy:"search_page_html_forensics"});
  const q = String(url.searchParams.get("q")||"").trim();
  if (!q) return json({ok:false,error:"Missing q parameter"},400);
  if (url.pathname === "/forensics") return forensics(q);
  if (url.pathname === "/discovery") return discovery(q);
  if (url.pathname === "/search") return search(q);
  if (url.pathname === "/autocomplete") return json({ok:false,error:"Autocomplete disabled in alpha.21.1 forensics build"},501);
  return json({ok:false,error:"Unknown endpoint",endpoints:["/health","/forensics?q=گوشی","/search?q=گوشی","/discovery?q=گوشی"]},404);
} };

function headers(){return {"Accept":"text/html,application/xhtml+xml,application/json,text/plain,*/*","Accept-Language":"fa-IR,fa;q=0.9,en;q=0.8","User-Agent":"Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 Chrome/143 Mobile Safari/537.36","Referer":DIGI_BASE+"/","Origin":DIGI_BASE};}
async function fetchPage(q){const page=`${DIGI_BASE}/search/?q=${encodeURIComponent(q)}`;const r=await fetch(page,{redirect:"follow",headers:headers()});return {r,html:await r.text(),page};}

async function forensics(q){try{const {r,html,page}=await fetchPage(q);const scripts=[...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(m=>m[1]).slice(0,40);const urls=[...html.matchAll(/https?:[^"'\s<>]+/gi)].map(m=>m[0]).filter(x=>/api|search|product|autocomplete|graphql/i.test(x)).slice(0,60);const paths=[...html.matchAll(/(?:https?:\/\/[^"'\s<>]+)?\/(?:api|v\d+|search|product|autocomplete|graphql)[^"'\s<>]*/gi)].map(m=>m[0]).filter(Boolean).slice(0,60);const ids=[...html.matchAll(/dkp-(\d+)/gi)].map(m=>m[1]).filter((v,i,a)=>a.indexOf(v)===i).slice(0,30);const markers={nextData:/__NEXT_DATA__/i.test(html),initialState:/__INITIAL_STATE__/i.test(html),api:/api/i.test(html),search:/search/i.test(html),product:/product/i.test(html),graphql:/graphql/i.test(html),dkp:ids.length>0};const candidates=[...new Set([...urls,...paths])].slice(0,100);return json({ok:r.ok,endpoint:"/forensics",query:q,source:"digikala",diagnostics:{stage:"search_page_html_forensics",pageUrl:page,finalUrl:r.url,upstreamStatus:r.status,contentType:r.headers.get("content-type")||"",htmlBytes:html.length,strategy:"script_url_marker_path_extraction"},markers,scriptSrcs:scripts,candidateUrls:candidates,productIds:ids,snippets:{api:snip(html,/api/i),search:snip(html,/search/i),product:snip(html,/product/i),dkp:snip(html,/dkp-\d+/i)}});}catch(e){return json({ok:false,endpoint:"/forensics",query:q,error:e instanceof Error?e.message:String(e)},502);}}
function snip(html,re){const out=[];let m;while((m=re.exec(html))&&out.length<5){const start=Math.max(0,m.index-140);out.push(html.slice(start,Math.min(html.length,m.index+260)).replace(/\s+/g," "));}return out;}
async function discovery(q){try{const {r,html,page}=await fetchPage(q);const ids=[...html.matchAll(/(?:\/product\/)?dkp-(\d+)/gi)].map(m=>Number(m[1])).filter((v,i,a)=>a.indexOf(v)===i).slice(0,10);return json({ok:r.ok&&ids.length>0,endpoint:"/discovery",query:q,source:"digikala",diagnostics:{stage:"search_page",pageUrl:page,finalUrl:r.url,upstreamStatus:r.status,htmlBytes:html.length,productIdCount:ids.length},productIds:ids},r.ok&&ids.length>0?200:502);}catch(e){return json({ok:false,endpoint:"/discovery",query:q,error:e instanceof Error?e.message:String(e)},502);}}
async function search(q){return discovery(q);}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{...CORS,"Content-Type":"application/json; charset=utf-8"}});}
