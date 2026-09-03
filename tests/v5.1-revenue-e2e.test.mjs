import assert from 'node:assert/strict';
import engine from '../js/v5-offer-affiliate-engine.js';

const WORKER = 'https://digiyar-v5.petromosi.workers.dev';
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

const candidate = search.results.find((item) => {
  const store = String(item.store || item.source || item.storeId || '').toLowerCase();
  const url = item.productUrl || item.url || item.sourceUrl || '';
  return /digikala|snappshop/.test(store) && engine.isDirectProductUrl(url);
});
assert.ok(candidate, `No live affiliate-capable product URL found in search: ${JSON.stringify(search).slice(0, 2000)}`);

const productUrl = candidate.productUrl || candidate.url || candidate.sourceUrl;
const resolved = await getJson('/api/resolve?url=' + encodeURIComponent(productUrl));
assert.equal(resolved.success, true);
assert.equal(resolved.resolved, true);
assert.ok(Number(resolved.priceToman) > 0, `Invalid live price: ${JSON.stringify(resolved)}`);
assert.ok(['in_stock', 'out_of_stock', 'unknown'].includes(resolved.availability));

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
assert.ok(offer.isAffiliate, `Offer is not affiliate-enabled: ${JSON.stringify(offer)}`);
assert.match(offer.affiliateUrl, /^https:\/\/aflo\.ir\/(TrvNHEN8|YPN05dL7)[?&]p=/);

const click = await fetch(offer.affiliateUrl, {
  method: 'GET',
  redirect: 'manual',
  headers: { accept: 'text/html,application/xhtml+xml' }
});
assert.ok([200, 301, 302, 303, 307, 308].includes(click.status), `Affiliate click failed HTTP ${click.status}`);
const location = click.headers.get('location') || '';
if (click.status !== 200) assert.ok(location, `Affiliate redirect missing Location header: ${offer.affiliateUrl}`);

console.log(JSON.stringify({
  ok: true,
  query: QUERY,
  product: { name: candidate.name, store, productUrl },
  live: { priceToman: resolved.priceToman, currency: resolved.currency, availability: resolved.availability, extraction: resolved.extraction },
  affiliate: { url: offer.affiliateUrl, httpStatus: click.status, redirectLocationPresent: Boolean(location) }
}, null, 2));
