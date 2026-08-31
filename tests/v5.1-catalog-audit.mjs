import { PRODUCT_INDEX } from '../js/product-index-generated-v5.1.js';

const failures=[]; const warn=[];
const nav=/^(قیمت \(تومان\)|گارانتی|فروشگاه|استان|تاریخ|برندهای موبایل|موبایل یاب|برندها|مقایسه گوشی های موبایل|بررسی تخصصی گوشی های موبایل|گوشی موبایل)$/i;
const badUrl=/\/search(?:\/|\?|$)|\/phones\/(?:index|brands|finder|reviews|addtocompare|prices)(?:\.aspx)?(?:\?|$)|\/product-category(?:\/|$)|\/category(?:\/|$)|\/tag(?:\/|$)|\/brand(?:\/|$)|\/finder(?:\/|$)|\/reviews?(?:\/|$)|\/addtocompare(?:\/|$)|\/prices?(?:\/|$)/i;
const cats=new Map(); const ids=new Set();
for(const p of PRODUCT_INDEX){
 const id=String(p.productId||p.id||''); if(!id) failures.push('missing productId'); else if(ids.has(id)) failures.push(`duplicate productId: ${id}`); else ids.add(id);
 if(!p.name) failures.push(`missing name: ${id}`); if(!p.category) failures.push(`missing category: ${id}`); if(!p.productUrl) failures.push(`missing productUrl: ${id}`);
 if(nav.test(String(p.name||'').trim())) failures.push(`navigation record: ${p.name}`);
 if(badUrl.test(String(p.productUrl||''))) failures.push(`non-product URL: ${p.productUrl}`);
 const c=String(p.category||'unknown'); cats.set(c,(cats.get(c)||0)+1);
 if(p.category==='mobile' && /لپ\s*تاپ|laptop/i.test(String(p.name))) failures.push(`category leakage mobile/laptop: ${id}`);
 if(p.category==='laptop' && /گوشی|موبایل|iphone|galaxy|redmi|poco/i.test(String(p.name))) failures.push(`category leakage laptop/mobile: ${id}`);
 if(p.price!=null && Number(p.price)<0) failures.push(`negative price: ${id}`);
 if(p.availability && !['in_stock','out_of_stock','unknown'].includes(p.availability)) failures.push(`invalid availability: ${id}`);
}
for(const [c,n] of cats) if(n>500) failures.push(`category over cap: ${c}=${n}`);
for(const [c,n] of cats) if(n<10) warn.push(`small category: ${c}=${n}`);
console.log(JSON.stringify({ok:failures.length===0,total:PRODUCT_INDEX.length,categories:Object.fromEntries(cats),failures,warnings:warn},null,2));
if(failures.length) process.exitCode=1;
