import assert from 'node:assert/strict';
import engine from '../js/v5-offer-affiliate-engine.js';

const WORKER = 'https://digiyar-v6.petromosi.workers.dev';
const QUERY = 'گوشی سامسونگ';

async function getJson(path) {
  const response = await fetch(WORKER + path, { headers: { accept: 'application/json' } });
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); } catch { throw new Error(`Non-JSON ${response.status}: ${text.slice(0, 300)}`); }
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${JSON.stringify(body)}`);
  return body;
}

const health = await getJson('/health');
assert.equal(health.status, 'ok');

const search = await getJson('/api/search?q=' + encodeURIComponent(QUERY));
assert.equal(search.success, true);
assert.ok(Array.isArray(search.results));

const candidates = search.results.filter((item) => {
  const url = item.productUrl || item.url || item.sourceUrl || '';
  return engine.isDirectProductUrl(url);
});
assert.ok(candidates.length, `No direct product URL found in search: ${JSON.stringify(search).slice(0, 2000)}`);

let candidate;
let resolved;
for (const item of candidates.slice(0, 10)) {
  const productUrl = item.productUrl || item.url || item.sourceUrl;
  try {
    const result = await getJson('/api/resolve?url=' + encodeURIComponent(productUrl));
    if (result.success && result.resolved && Number(result.priceToman) > 0) {
      candidate = item;
      resolved = result;
      break;
    }
  } catch {}
}
assert.ok(candidate && resolved, `No resolvable live product found: ${JSON.stringify(candidates.slice(0, 10)).slice(0, 3000)}`);
assert.ok(['in_stock', 'out_of_stock', 'unknown'].includes(resolved.availability));

const productUrl = candidate.productUrl || candidate.url || candidate.sourceUrl;
const store = candidate.store || candidate.source || candidate.storeId;
const offer = engine.normalizeOffer({
  productId: candidate.id || candidate.productId || productUrl,
  store,
  price: resolved.priceToman,
  currency: resolved.currency || 'IRT',
  available: resolved.availability !== 'out_of_stock',
  availability: resolved.availability,
  productUrl: resolved.productUrl || productUrl
});
assert.ok(offer, 'Offer normalization returned null');
assert.equal(offer.productUrl, resolved.productUrl || productUrl);
assert.ok(offer.affiliateUrl, `Offer has no purchase URL: ${JSON.stringify(offer)}`);
assert.equal(offer.isAffiliate, offer.affiliateUrl !== offer.productUrl);
assert.ok(engine.isDirectProductUrl(offer.productUrl));
assert.ok(engine.isDirectProductUrl(offer.affiliateUrl) || /^https:\/\/aflo\.ir\//i.test(offer.affiliateUrl));

const purchaseUrl = offer.affiliateUrl || offer.productUrl;
const click = await fetch(purchaseUrl, {
  method: 'GET',
  redirect: 'manual',
  headers: { accept: 'text/html,application/xhtml+xml' }
});
assert.ok([200, 301, 302, 303, 307, 308].includes(click.status), `Purchase click failed HTTP ${click.status}: ${purchaseUrl}`);
const location = click.headers.get('location') || '';
if (click.status !== 200) assert.ok(location, `Purchase redirect missing Location header: ${purchaseUrl}`);

console.log(JSON.stringify({
  ok: true,
  query: QUERY,
  product: { name: candidate.name, store, productUrl },
  live: { priceToman: resolved.priceToman, currency: resolved.currency, availability: resolved.availability, extraction: resolved.extraction },
  purchase: { url: purchaseUrl, isAffiliate: offer.isAffiliate, httpStatus: click.status, redirectLocationPresent: Boolean(location) }
}, null, 2));
