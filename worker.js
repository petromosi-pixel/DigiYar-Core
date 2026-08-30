const CORS = { 'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Content-Type' };
const STORES = { digikala:{id:'digikala',name:'دیجی‌کالا'}, snappshop:{id:'snappshop',name:'اسنپ‌شاپ'} };

export default { async fetch(request){
  if(request.method==='OPTIONS') return new Response(null,{headers:CORS});
  const u=new URL(request.url), q=(u.searchParams.get('q')||'').trim();
  if(u.pathname==='/health') return json({status:'ok',version:'v5-multi-affiliate'},CORS);
  if(u.pathname!=='/api/search') return json({error:'Unknown endpoint'},CORS);
  if(!q) return json({success:false,error:'Missing q',results:[],total:0},CORS);
  const [digikala,snappshop]=await Promise.allSettled([searchDigikala(q),searchSnappShop(q)]);
  const results=[...(digikala.status==='fulfilled'?digikala.value:[]),...(snappshop.status==='fulfilled'?snappshop.value:[])].slice(0,6);
  return json({success:true,results,total:results.length,query:q,sources:{digikala:digikala.status,snappshop:snappshop.status}},CORS);
} };

function json(data,headers){return new Response(JSON.stringify(data),{headers:{...headers,'Content-Type':'application/json'}})}

async function fetchJson(url){const r=await fetch(url,{headers:{'Accept':'application/json','Accept-Language':'fa-IR,fa;q=0.9','User-Agent':'Mozilla/5.0'},redirect:'follow'});if(!r.ok) throw new Error('HTTP '+r.status);return r.json()}

async function searchDigikala(q){
  const urls=[
    `https://api.digikala.com/v1/search/?q=${encodeURIComponent(q)}&page=1`,
    `https://api.digikala.com/v2/search/?q=${encodeURIComponent(q)}&page=1`
  ];
  for(const url of urls){try{const d=await fetchJson(url);const ps=d?.data?.products||d?.data?.data?.products;if(Array.isArray(ps)&&ps.length)return ps.slice(0,3).map(normalizeDigikala)}catch(e){}}
  return [];
}
function normalizeDigikala(p){const id=p?.id||p?.product_id;const productUrl=id?`https://www.digikala.com/product/dkp-${id}`:'';return {id:String(id||''),name:p?.title_fa||p?.title_en||'بدون عنوان',price:p?.default_variant?.price?.selling_price||p?.price?.selling_price||0,image:p?.images?.main?.url?.[0]||'',productUrl,url:productUrl,affiliateUrl:'',available:!!id,store:STORES.digikala.id,storeName:STORES.digikala.name};}

async function searchSnappShop(q){
  // Verified product-search endpoint must be wired here before emitting SnappShop product URLs.
  // Never fabricate a product id or product URL from a search URL.
  return [];
}
