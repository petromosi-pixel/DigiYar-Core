/* DigiYar V5 — Housh Yar inline search */
(function(){'use strict';
const API_URL='https://digiyar-v5.petromosi.workers.dev/api/search';
const hints=['چی می‌خوای بخری؟','مثلاً: گوشی سامسونگ تا ۱۵ میلیون','دنبال لپ‌تاپ مناسب می‌گردی؟','اسم محصولت رو بنویس...'];
let i=0,timer;
function init(){
 const form=document.getElementById('v5SmartSearchForm'),input=document.getElementById('v5SmartSearchInput'),hint=document.getElementById('v5SmartSearchHint');
 if(!form||!input||!hint)return;
 hint.textContent=hints[0];
 timer=setInterval(()=>{if(!input.value.trim()){i=(i+1)%hints.length;hint.classList.remove('v5-hint-show');void hint.offsetWidth;hint.textContent=hints[i];hint.classList.add('v5-hint-show');}},2600);
 const syncHint=()=>{const hasText=!!input.value.trim();hint.style.opacity=hasText?'0':'1';hint.style.visibility=hasText?'hidden':'visible';};
 input.addEventListener('input',syncHint); input.addEventListener('focus',syncHint); input.addEventListener('blur',syncHint); syncHint();
 form.addEventListener('submit',async e=>{e.preventDefault();const q=input.value.trim();if(!q)return;hint.style.opacity='0';hint.style.visibility='hidden';const old=input.placeholder;input.placeholder='در حال جستجوی زنده...';input.disabled=true;
  let box=document.getElementById('v5SmartSearchResults');if(!box){box=document.createElement('div');box.id='v5SmartSearchResults';box.className='v5-smart-search-results';form.parentElement.appendChild(box)}
  box.innerHTML='<div class="v5-smart-search-loading">🔎 در حال پیدا کردن گزینه‌های مناسب...</div>';
  try{const r=await fetch(API_URL+'?q='+encodeURIComponent(q));const d=await r.json();if(!d.success||!d.results?.length){box.innerHTML='<div class="v5-smart-search-empty">برای این جستجو نتیجه‌ای پیدا نشد. عبارت دیگه‌ای رو امتحان کن.</div>';return;}
   box.innerHTML='<div class="v5-smart-search-result-head">نتایج زنده برای «'+esc(q)+'»</div>'+d.results.map(p=>'<article class="v5-smart-result"><div class="v5-smart-result-title">'+esc(p.name||p.title)+'</div><div class="v5-smart-result-meta">'+esc(p.storeName||p.store||'فروشگاه')+' · '+price(p.price)+'</div><a target="_blank" rel="noopener noreferrer" href="'+esc(affiliate(p))+'">مشاهده و خرید</a></article>').join('');
  }catch(err){box.innerHTML='<div class="v5-smart-search-empty">ارتباط با جستجوی زنده برقرار نشد؛ دوباره امتحان کن.</div>';console.error(err)}finally{input.disabled=false;input.placeholder=old;syncHint();}
 });
}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function price(v){return v?new Intl.NumberFormat('fa-IR').format(v)+' تومان':'نامشخص'}
function affiliate(p){const base=p.store==='digikala'?'https://aflo.ir/TrvNHEN8':p.store==='snappshop'?'https://aflo.ir/1COBTqeMV':'';const target=p.affiliateUrl||p.productUrl||p.url||'#';if(!base)return target;return base+'?p='+encodeURIComponent(target)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
