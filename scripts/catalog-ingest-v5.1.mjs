import fs from 'node:fs/promises';
import crypto from 'node:crypto';

const MAX=500;
const UA='DigiYar-Catalog-Ingest/5.1 (+https://digiyar-v5.petromosi.workers.dev/)';
const SOURCES={
 mobile:[
  {id:'mobile-ir',url:'https://www.mobile.ir/phones/prices.aspx?brandid=0&duration=14&pagesize=200&price_from=-1&price_to=-1&provinceid=0&shopid=0&sort=warranty&terms=',kind:'market'},
  {id:'digizo',url:'https://digizo.shop/product-category/mobile/',kind:'shop',pages:4},
  {id:'bprshop',url:'https://www.bprshop.com/mobile',kind:'shop'}
 ],
 laptop:[
  {id:'technolife',url:'https://www.technolife.com/category/laptop-equipment/laptop',kind:'shop'},
  {id:'digizo',url:'https://digizo.shop/product-category/laptop/',kind:'shop',pages:10},
  {id:'elecamp',url:'https://elecamp.ir/',kind:'shop'}
 ]
};
const norm=s=>String(s||'').replace(/&amp;/g,'&').replace(/&#x27;|&#39;/g,"'").replace(/\s+/g,' ').trim();
const money=s=>{const m=String(s||'').replace(/[٬,\s]/g,'').match(/\d+/);return m?Number(m[0]):0};
const hash=s=>crypto.createHash('sha1').update(s).digest('hex').slice(0,16);
function abs(base,u){try{return new URL(u,base).href}catch{return ''}}
function availability(text){const t=norm(text);if(/ناموجود|در انبار موجود نمی باشد|تمام شده|out of stock|unavailable/i.test(t))return 'out_of_stock';if(/موجود در انبار|موجود|in stock/i.test(t))return 'in_stock';return 'unknown'}
function categoryName(c){return c==='mobile'?'mobile':'laptop'}
function brand(name){const pairs=[['سامسونگ','سامسونگ'],['Samsung','سامسونگ'],['شیائومی','شیائومی'],['Xiaomi','شیائومی'],['اپل','اپل'],['Apple','اپل'],['آیفون','اپل'],['لنوو','لنوو'],['Lenovo','لنوو'],['ایسوس','ایسوس'],['ASUS','ایسوس'],['اچ پی','اچ‌پی'],['HP','اچ‌پی'],['دل','دل'],['Dell','دل'],['ایسر','ایسر'],['Acer','ایسر'],['MSI','MSI'],['ام اس آی','MSI'],['مایکروسافت','مایکروسافت'],['Microsoft','مایکروسافت']];return pairs.find(([k])=>name.toLowerCase().includes(k.toLowerCase()))?.[1]||''}
async function get(url){const r=await fetch(url,{headers:{'user-agent':UA,'accept':'text/html,application/xhtml+xml,application/json','accept-language':'fa-IR,fa;q=0.9,en;q=0.7'}});if(!r.ok)throw new Error(`${r.status} ${url}`);return await r.text()}
function jsonLd(html){const out=[];const re=/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;let m;while((m=re.exec(html))){try{walk(JSON.parse(m[1]),out)}catch{}}return out}
function walk(x,out){if(!x)return;if(Array.isArray(x)){x.forEach(v=>walk(v,out));return}if(typeof x!=='object')return;const t=Array.isArray(x['@type'])?x['@type'].join(' '):String(x['@type']||'');if(/product/i.test(t)&&x.name){const o=Array.isArray(x.offers)?x.offers[0]:x.offers||{};out.push({name:norm(x.name),url:x.url||'',sku:x.sku||x.productID||x.mpn||'',price:money(o.price||x.price),availability:o.availability||x.availability||'',currency:o.priceCurrency||'IRR'})}Object.values(x).forEach(v=>{if(v&&typeof v==='object')walk(v,out)})}
function anchors(html,base,kind){const out=[];const re=/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;let m;while((m=re.exec(html))){const url=abs(base,m[1]);const text=norm(m[2].replace(/<[^>]+>/g,' '));if(!url||!text)continue;if(kind==='shop' && /\/(?:product(?:-|\/)|p\/)[^/?#]+/i.test(new URL(url).pathname))out.push({url,name:text,near:html.slice(m.index,Math.min(html.length,m.index+1800))});if(kind==='market' && /mobile\.ir\/phones\/shops-\d+-[^?#]+\.aspx/i.test(url))out.push({url,name:text,near:html.slice(m.index,Math.min(html.length,m.index+1600))})}return out}
function isProductUrl(url,category,kind){try{const u=new URL(url);if(category==='mobile'&&kind==='market')return /\/phones\/shops-\d+-[^/?#]+\.aspx$/i.test(u.pathname);if(kind==='shop')return /\/(?:product(?:\/|-)|p\/)[^/?#]+/i.test(u.pathname);return false}catch{return false}}
const NAV_NAMES=new Set(['قیمت (تومان)','گارانتی','فروشگاه','استان','تاریخ','برندهای موبایل','موبایل یاب','برندها','مقایسه گوشی های موبایل','بررسی تخصصی گوشی های موبایل','گوشی موبایل']);
function isValidRecord(x,category,kind){const name=norm(x.name);if(!name||name.length<3||NAV_NAMES.has(name))return false;if(!isProductUrl(x.productUrl,category,kind))return false;return true}
function parseHtml(html,source,category){const found=[];for(const x of jsonLd(html))found.push({name:x.name,url:x.url,sku:x.sku,price:x.price,availability:x.availability,source});for(const x of anchors(html,source.url,source.kind)){const near=norm(x.near);found.push({name:x.name,url:x.url,price:0,availability:availability(near),source})}return found.map(x=>{const url=abs(source.url,x.url);const id=String(x.sku||url||x.name||'');return{id:`web-${category}-${hash(id)}`,productId:`web-${category}-${hash(id)}`,name:norm(x.name),brand:brand(x.name),model:norm(x.name),category:categoryName(category),price:Number(x.price)||0,currency:x.currency||'IRR',availability:String(x.availability||'').toLowerCase().includes('outofstock')?'out_of_stock':availability(`${x.availability} ${x.name}`),productUrl:url,sourceId:source.id,sourceUrl:source.url,source:`web-catalog:${source.id}`,observedAt:new Date().toISOString()}}).filter(x=>isValidRecord(x,category,source.kind))}
async function collect(category){const all=[];const diagnostics=[];for(const s of SOURCES[category]){const pages=s.pages||1;let sourceCount=0;for(let page=1;page<=pages;page++){let url=s.url;if(page>1)url=url.endsWith('/')?`${url}page/${page}/`:`${url}/page/${page}/`;try{const html=await get(url);const parsed=parseHtml(html,{...s,url},category);sourceCount+=parsed.length;all.push(...parsed)}catch(e){diagnostics.push({source:s.id,url,error:e.message})}}diagnostics.push({source:s.id,accepted:sourceCount})}const uniq=[];const seen=new Set();for(const x of all){const key=x.productUrl;if(seen.has(key))continue;seen.add(key);uniq.push(x);if(uniq.length>=MAX)break}return{version:'5.1',category,maxProducts:MAX,generatedAt:new Date().toISOString(),sources:SOURCES[category],products:uniq,status:'web-ingested',count:uniq.length,diagnostics}}
for(const category of ['mobile','laptop']){const data=await collect(category);await fs.mkdir('data/catalog',{recursive:true});await fs.writeFile(`data/catalog/${category}.json`,JSON.stringify(data,null,2)+'\n');await fs.writeFile(`js/${category}-product-index-v5.1.js`,`export const ${category.toUpperCase()}_PRODUCTS = ${JSON.stringify(data.products,null,2)};\n`);console.log(`${category}: ${data.products.length}`)}
const mobile=JSON.parse(await fs.readFile('data/catalog/mobile.json','utf8')).products;const laptop=JSON.parse(await fs.readFile('data/catalog/laptop.json','utf8')).products;const combined=[...mobile,...laptop];await fs.writeFile('js/product-index-generated-v5.1.js',`// Generated by catalog-ingest-v5.1.mjs\nexport const PRODUCT_INDEX = ${JSON.stringify(combined,null,2)};\nexport const INDEX_META = ${JSON.stringify({generatedAt:new Date().toISOString(),mobile:mobile.length,laptop:laptop.length,maxPerCategory:MAX},null,2)};\n`);
