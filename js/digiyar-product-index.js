// DigiYar V5 — local Product Index pilot
(function(){'use strict';
const INDEX_URL='data/product-index.json';
const FA_DIGITS='۰۱۲۳۴۵۶۷۸۹';
const norm=s=>String(s||'').toLowerCase().replace(/[\u200c\s_-]+/g,'').replace(/[۰-۹]/g,d=>String(FA_DIGITS.indexOf(d)));
const tokenize=s=>norm(s).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
async function loadIndex(){if(window.DigiYarProductIndex)return window.DigiYarProductIndex;const r=await fetch(INDEX_URL,{cache:'no-cache'});if(!r.ok)throw Error('Product Index HTTP '+r.status);return window.DigiYarProductIndex=await r.json();}
function scoreProduct(p,q){const nq=norm(q);let score=0;const name=norm(p.name),brand=norm(p.brand),keys=(p.keywords||[]).map(norm),cat=norm(p.category),sub=norm(p.subcategory);if(name===nq)score+=100;if(name.includes(nq))score+=45;if(brand&&nq.includes(brand))score+=18;if(keys.some(k=>nq.includes(k)||k.includes(nq)))score+=12;if(cat==='mobile'&&/(گوشی|موبایل|iphone|آیفون|سامسونگ|شیائومی|پوکو|samsung|xiaomi)/i.test(q))score+=18;if(cat==='laptop'&&/(لپ\s*تاپ|لپتاپ|لنوو|ایسوس|ایسر|lenovo|asus|acer)/i.test(q))score+=18;if(sub&&nq.includes(sub))score+=8;for(const t of tokenize(q)){if(name.includes(t))score+=7;for(const k of keys)if(k.includes(t)||t.includes(k)){score+=4;break;}}return score;}
function parseFilters(q){const s=norm(q);const max=s.match(/(?:تا|زیر|حداکثر)(\d+(?:\.\d+)?)(میلیون|م|هزار|تومان)?/);let maxPrice=null;if(max){let n=Number(max[1]);if(max[2]==='میلیون'||max[2]==='م')n*=10000000;else if(max[2]==='هزار')n*=1000;else if(max[2]==='تومان')n=n;maxPrice=n;}return {maxPrice};}
function search(q,index){const f=parseFilters(q);return index.products.map(p=>{let s=scoreProduct(p,q);const offers=(p.offers||[]).filter(o=>o.available!==false);if(f.maxPrice!==null){const prices=offers.map(o=>Number(o.price)).filter(Boolean);if(prices.length&&!prices.some(x=>x<=f.maxPrice))s-=40;}return {product:p,score:s};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,8).map(x=>({...x.product,_score:x.score}));}
window.DigiYarInternalSearch={loadIndex,search};
})();
