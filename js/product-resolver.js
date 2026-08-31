// DigiYar V5.1 — Product Resolver v2
const DigiYarProductResolver=(()=>{
 const adapters={
  digikala:{name:'دیجی‌کالا',buildSearchUrl:q=>`https://www.digikala.com/search/?q=${encodeURIComponent(q)}`},
  snappshop:{name:'اسنپ‌شاپ',buildSearchUrl:q=>`https://snappshop.ir/search?q=${encodeURIComponent(q)}`}
 };
 function getAdapter(store){return adapters[String(store||'').toLowerCase()]||null;}
 function isProductUrl(url){if(!url)return false;try{const u=new URL(url);return /^https?:$/.test(u.protocol)&&!/\/search(?:\/|\?|$)/i.test(u.pathname)}catch{return false}}
 function normalizeOffer(raw={}){const store=String(raw.store||'').toLowerCase();return{store,productId:raw.productId||raw.id||null,productName:raw.productName||raw.title||raw.name||null,productUrl:raw.productUrl||raw.url||null,price:Number.isFinite(Number(raw.price))?Number(raw.price):null,available:raw.available!==false,image:raw.image||raw.imageUrl||null,affiliateUrl:raw.affiliateUrl||null,source:raw.source||store,lastUpdated:raw.lastUpdated||null}}
 function resolveOffer(raw){const o=normalizeOffer(raw);if(!o.store)return{resolved:false,reason:'missing_store',offer:o};if(!o.productId)return{resolved:false,reason:'missing_product_id',offer:o};if(!isProductUrl(o.productUrl))return{resolved:false,reason:'product_url_not_verified',offer:o};return{resolved:true,reason:'verified_product_identity',offer:o}}
 function resolveProduct(product){const offers=Array.isArray(product?.offers)?product.offers:[];const resolved=[],unresolved=[];for(const raw of offers){const r=resolveOffer(raw);(r.resolved?resolved:unresolved).push(r)}return{productId:product?.id||null,productName:product?.name||null,resolvedOffers:resolved,unresolvedOffers:unresolved}}
 async function resolveQuery(query,endpoint){if(!query||!endpoint)throw Error('query_and_endpoint_required');const u=new URL(endpoint);u.searchParams.set('q',query);const r=await fetch(u.toString(),{headers:{Accept:'application/json'}});if(!r.ok)throw Error('resolver_http_'+r.status);const data=await r.json();const offers=Array.isArray(data?.results)?data.results.map(resolveOffer).filter(x=>x.resolved).map(x=>x.offer):[];return{query,success:data?.success===true,offers,total:offers.length,sources:data?.sources||{}}}
 return{adapters,getAdapter,isProductUrl,normalizeOffer,resolveOffer,resolveProduct,resolveQuery};
})();
if(typeof window!=='undefined')window.DigiYarProductResolver=DigiYarProductResolver;
if(typeof module!=='undefined'&&module.exports)module.exports=DigiYarProductResolver;
