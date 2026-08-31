// DigiYar V5.1 Data Ingestion Engine
// Source-agnostic: adapters supply product/offer observations; engine normalizes,
// validates freshness, merges products and updates availability/price without
// fabricating market data.
// Deployment trigger: V5 Worker ingestion route verification.

export const MAX_PRODUCTS_PER_CATEGORY=500;
export const SOURCE_TTL_MS=6*60*60*1000;

export function normalizeText(s=''){return String(s).toLowerCase().replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/\s+/g,' ').trim()}
export function normalizeObservation(o={}){return{productId:String(o.productId||o.id||o.sku||''),name:o.name||o.productName||'',brand:o.brand||'',model:o.model||'',category:o.category||'',storeId:o.storeId||o.store||'',storeName:o.storeName||o.store||'',price:Number(o.price||0),currency:o.currency||'IRR',available:o.available===true||o.availability==='in_stock',availability:o.availability||(o.available===false?'out_of_stock':'unknown'),productUrl:o.productUrl||o.url||'',affiliateUrl:o.affiliateUrl||'',source:o.source||'',observedAt:o.observedAt||new Date().toISOString()}}
export function isFresh(o,now=Date.now(),ttl=SOURCE_TTL_MS){const t=Date.parse(o.observedAt||'');return Number.isFinite(t)&&(now-t)<=ttl}
export function upsertProduct(catalog,observation){const o=normalizeObservation(observation);if(!o.productId)return catalog;const idx=catalog.findIndex(p=>String(p.id)===o.productId);if(idx<0){if(catalog.length>=MAX_PRODUCTS_PER_CATEGORY)return catalog;catalog.push({id:o.productId,name:o.name,brand:o.brand,model:o.model,category:o.category,offers:[o]});return catalog}const p=catalog[idx];p.name=p.name||o.name;p.brand=p.brand||o.brand;p.model=p.model||o.model;p.category=p.category||o.category;const oi=p.offers.findIndex(x=>String(x.storeId)===String(o.storeId));if(oi<0)p.offers.push(o);else p.offers[oi]={...p.offers[oi],...o};return catalog}
export function reconcile(catalog,observations,now=Date.now()){for(const raw of observations){const o=normalizeObservation(raw);if(!isFresh(o,now))continue;upsertProduct(catalog,o)}return catalog}
export function availabilitySnapshot(product,now=Date.now()){const offers=(product.offers||[]).map(o=>({...o,stale:!isFresh(o,now)}));return{productId:product.id,offers,available:offers.some(o=>!o.stale&&o.available),bestPrice:Math.min(...offers.filter(o=>!o.stale&&o.available&&o.price>0).map(o=>o.price),Infinity)}}
export function trimCategory(catalog){return catalog.slice(0,MAX_PRODUCTS_PER_CATEGORY)}
