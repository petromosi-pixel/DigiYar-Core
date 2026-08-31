// DigiYar V5.1 — internal Product Search Core
(function(){'use strict';
const INDEX_URL='data/product-index.json';
const FA_DIGITS='۰۱۲۳۴۵۶۷۸۹';
const norm=s=>String(s??'').toLowerCase().replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[\u200c\s_-]+/g,' ').replace(/[۰-۹]/g,d=>String(FA_DIGITS.indexOf(d))).trim();
const tokens=s=>norm(s).split(/[^\p{L}\p{N}.]+/u).filter(Boolean);
const money=n=>{const x=Number(String(n).replace(/,/g,''));return Number.isFinite(x)&&x>0?x:null;};
async function loadIndex(){if(window.DigiYarProductIndex)return window.DigiYarProductIndex;const r=await fetch(INDEX_URL,{cache:'no-cache'});if(!r.ok)throw Error('Product Index HTTP '+r.status);return window.DigiYarProductIndex=await r.json();}
function parseQuery(q){const s=norm(q), filters={minPrice:null,maxPrice:null,category:null,brand:null,keywords:[]};
 let m=s.match(/(?:تا|زیر|حداکثر)\s*(\d+(?:\.\d+)?)\s*(میلیون|م|هزار|تومان)?/); if(m){let n=Number(m[1]);if(m[2]==='میلیون'||m[2]==='م')n*=10000000;else if(m[2]==='هزار')n*=1000;filters.maxPrice=n;}
 m=s.match(/(?:بین|از)\s*(\d+(?:\.\d+)?)\s*(?:تا|و)\s*(\d+(?:\.\d+)?)\s*(میلیون|م|هزار|تومان)?/);if(m){let a=Number(m[1]),b=Number(m[2]);if(m[3]==='میلیون'||m[3]==='م'){a*=10000000;b*=10000000}else if(m[3]==='هزار'){a*=1000;b*=1000}filters.minPrice=a;filters.maxPrice=b;}
 if(/گوشی|موبایل|iphone|آیفون|سامسونگ|شیائومی|پوکو|اپل/i.test(q))filters.category='mobile';
 if(/لپ\s*تاپ|لپتاپ|لنوو|ایسوس|ایسر|lenovo|asus|acer/i.test(q))filters.category='laptop';
 const brands=[['سامسونگ','Samsung'],['samsung','Samsung'],['شیائومی','Xiaomi'],['xiaomi','Xiaomi'],['پوکو','Xiaomi'],['اپل','Apple'],['آیفون','Apple'],['iphone','Apple'],['لنوو','Lenovo'],['lenovo','Lenovo'],['ایسوس','ASUS'],['asus','ASUS'],['ایسر','Acer'],['acer','Acer']];const hit=brands.find(([k])=>s.includes(norm(k)));if(hit)filters.brand=hit[1];
 filters.keywords=tokens(s).filter(t=>!['تا','زیر','حداکثر','میلیون','م','هزار','تومان','بین','از','و'].includes(t));return filters;}
function offerPrices(p){return (p.offers||[]).filter(o=>o.available!==false).map(o=>money(o.price)).filter(Boolean);}
function matchesHard(p,f){if(f.category&&p.category!==f.category)return false;if(f.brand&&p.brand!==f.brand)return false;const prices=offerPrices(p);if(f.minPrice!==null||f.maxPrice!==null){if(!prices.length)return false;if(f.minPrice!==null&&!prices.some(x=>x>=f.minPrice))return false;if(f.maxPrice!==null&&!prices.some(x=>x<=f.maxPrice))return false;}return true;}
function score(p,f,q){let s=0,nq=norm(q),name=norm(p.name),brand=norm(p.brand);if(f.brand&&p.brand===f.brand)s+=45;if(f.category&&p.category===f.category)s+=30;if(name===nq)s+=100;if(name.includes(nq))s+=35;for(const t of f.keywords){if(t.length<2)continue;if(name.includes(t))s+=9;for(const k of (p.keywords||[]).map(norm))if(k.includes(t)||t.includes(k)){s+=5;break;}}const prices=offerPrices(p);if(f.maxPrice!==null&&prices.length){const best=Math.min(...prices.filter(x=>x<=f.maxPrice));s+=Math.max(0,10-(best/f.maxPrice)*10);}return s;}
function search(q,index){const f=parseQuery(q);return index.products.filter(p=>matchesHard(p,f)).map(p=>({...p,_score:score(p,f,q),_filters:f,_bestPrice:offerPrices(p).length?Math.min(...offerPrices(p)):null})).filter(x=>x._score>0).sort((a,b)=>b._score-a._score).slice(0,8);}
window.DigiYarInternalSearch={loadIndex,parseQuery,search};
})();
