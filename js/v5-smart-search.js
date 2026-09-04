/* DigiYar V5.1 — Housh Yar internal Product Search UI */
(function(){'use strict';
const hints=['چی می‌خوای بخری؟','مثلاً: گوشی سامسونگ تا ۱۵ میلیون','دنبال لپ‌تاپ مناسب می‌گردی؟','اسم محصولت رو بنویس...'];
let i=0,timer,retrievalReady=null;
function ensureRetrieval(){
 if(window.DigiYarProductRetrieval)return Promise.resolve();
 if(retrievalReady)return retrievalReady;
 retrievalReady=new Promise((resolve,reject)=>{
  const s=document.createElement('script');
  s.src=new URL('js/product-retrieval.js',document.baseURI).href;
  s.async=false;
  s.onload=()=>window.DigiYarProductRetrieval?resolve():reject(Error('Product Retrieval engine unavailable'));
  s.onerror=()=>reject(Error('Product Retrieval engine failed to load: '+s.src));
  document.head.appendChild(s);
 });
 return retrievalReady;
}
function isDirectProductUrl(url){
 const engine=window.DigiYarOfferAffiliate;
 if(engine&&typeof engine.isDirectProductUrl==='function')return engine.isDirectProductUrl(url);
 return /^https:\/\/(?:www\.)?(?:digikala\.com|snappshop\.ir|torobshop\.com|technolife\.com|digizo\.shop|mobile\.ir|bprshop\.com|basalam\.com|elecamp\.ir)\/(?!search(?:\/|\?|$)|category(?:\/|\?|$))/i.test(String(url||''));
}
function purchaseUrl(product){
 const affiliate=String(product&&product.affiliateUrl||'').trim();
 const direct=String(product&&product.productUrl||'').trim();
 return affiliate|| (isDirectProductUrl(direct)?direct:'');
}
function priceValue(product){
 const value=Number(product&&product.priceToman);
 if(Number.isFinite(value)&&value>0)return value;
 const fallback=Number(product&&product.price);
 return Number.isFinite(fallback)&&fallback>0?fallback:0;
}
function init(){
 const form=document.getElementById('v5SmartSearchForm'),input=document.getElementById('v5SmartSearchInput'),hint=document.getElementById('v5SmartSearchHint');
 if(!form||!input||!hint)return;
 const stale=document.getElementById('v5SmartSearchResults');if(stale)stale.remove();
 hint.textContent=hints[0];
 timer=setInterval(()=>{if(!input.value.trim()){i=(i+1)%hints.length;hint.classList.remove('v5-hint-show');void hint.offsetWidth;hint.textContent=hints[i];hint.classList.add('v5-hint-show')}},2600);
 const syncHint=()=>{const hasText=!!input.value.trim();hint.style.opacity=hasText?'0':'1';hint.style.visibility=hasText?'hidden':'visible'};
 input.addEventListener('input',syncHint);input.addEventListener('focus',syncHint);input.addEventListener('blur',syncHint);syncHint();
 form.addEventListener('submit',async e=>{
  e.preventDefault();const q=input.value.trim();if(!q)return;
  hint.style.opacity='0';hint.style.visibility='hidden';const old=input.placeholder;input.placeholder='در حال جستجو در بازار...';input.disabled=true;
  let box=document.getElementById('v5SmartSearchResults');if(!box){box=document.createElement('div');box.id='v5SmartSearchResults';box.className='v5-smart-search-results';form.parentElement.appendChild(box)}
  box.innerHTML='<div class="v5-smart-search-loading">🔎 در حال بررسی نتایج زنده بازار...</div>';
  try{
   await ensureRetrieval();
   const products=await DigiYarProductRetrieval.search(q,{remote:true});
   if(!products.length){box.innerHTML='<div class="v5-smart-search-empty">برای «'+esc(q)+'» فعلاً نتیجه قابل استفاده‌ای پیدا نشد.</div>';return}
   const usable=products.filter(p=>priceValue(p)>0&&purchaseUrl(p));
   if(!usable.length){box.innerHTML='<div class="v5-smart-search-empty">برای «'+esc(q)+'» محصول قابل خرید با قیمت و لینک مستقیم پیدا نشد.</div>';return}
   box.innerHTML='<div class="v5-smart-search-result-head">نتایج هوش‌یار برای «'+esc(q)+'»</div>'+usable.slice(0,8).map(renderProduct).join('');
  }catch(err){
   console.error('DigiYar live smart search:',err);
   box.innerHTML='<div class="v5-smart-search-empty">اتصال به جستجوی هوش‌یار برقرار نشد. دوباره امتحان کن.</div>';
  }finally{input.disabled=false;input.placeholder=old;syncHint()}
 });
}
function renderProduct(p){
 const attrs=Object.entries(p.features||p.attributes||{}).slice(0,4).map(([k,v])=>esc(k)+': '+esc(v)).join(' · ');
 const url=purchaseUrl(p),price=priceValue(p);
 const storeName={digikala:'دیجی‌کالا',snappshop:'اسنپ‌شاپ',torobshop:'ترب'}[String(p.store||p.storeId||'').toLowerCase()]||'فروشگاه متصل';
 const category=p.category==='mobile'?'موبایل':p.category==='laptop'?'لپ‌تاپ':p.category||'محصول';
 return '<article class="v5-smart-result"><div class="v5-smart-result-title">'+esc(p.name)+'</div><div class="v5-smart-result-meta">'+esc(category)+(p.brand?' · '+esc(p.brand):'')+'</div><div class="v5-smart-result-price"><strong>'+esc(price.toLocaleString('fa-IR'))+' تومان</strong> · '+esc(storeName)+'</div><div class="v5-smart-result-meta">'+(attrs||'اطلاعات محصول موجود است')+'</div><a target="_blank" rel="noopener noreferrer" href="'+esc(url)+'">مشاهده و خرید</a></article>';
}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();