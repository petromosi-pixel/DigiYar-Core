import assert from 'node:assert/strict';
import engine from '../js/v5-offer-affiliate-engine.js';

const WORKER = 'https://digiyar-v6.petromosi.workers.dev';
const READINESS_QUERY = 'گوشی سامسونگ زیر ۳۰ میلیون';
const MISSION_QUERY = 'گوشی سامسونگ';
const RETRY_DELAY_MS = 5000;
const MAX_RETRIES = 18;

async function getJson(path) {
  const response = await fetch(WORKER + path, { headers: { accept: 'application/json' } });
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); } catch { throw new Error(`Non-JSON ${response.status}: ${text.slice(0, 300)}`); }
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${JSON.stringify(body)}`);
  return body;
}

async function waitForLiveParser() {
  let last;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    last = await getJson('/api/search?q=' + encodeURIComponent(READINESS_QUERY));
    const parsedBudget = Number(last.parsed?.price?.maxPrice);
    const parserReady = last.success === true && last.parsed && parsedBudget > 0;
    if (parserReady) return last;
    if (attempt < MAX_RETRIES) await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
  }
  throw new Error(`Live Worker search parser did not become ready after ${MAX_RETRIES * RETRY_DELAY_MS / 1000}s: ${JSON.stringify(last).slice(0, 3000)}`);
}

const health = await getJson('/health');
assert.equal(health.status, 'ok');
assert.equal(health.version, 'v5.1-search-core');

const readiness = await waitForLiveParser();
assert.equal(readiness.success, true);
assert.ok(readiness.parsed, 'Search parser output is missing');
assert.ok(Number(readiness.parsed.price?.maxPrice) > 0, `Budget was not parsed: ${JSON.stringify(readiness.parsed)}`);
assert.equal(Number(readiness.parsed.price.maxPrice), 30000000, `Unexpected budget parse: ${JSON.stringify(readiness.parsed)}`);
assert.ok(Array.isArray(readiness.results), 'Readiness search results must be an array');

// A valid no-match response is not a readiness failure. The full mission uses
// a separate known-match query so the resolver/offer/affiliate path is still exercised.
const search = await getJson('/api/search?q=' + encodeURIComponent(MISSION_QUERY));
assert.equal(search.success, true);
assert.ok(Array.isArray(search.results), 'Mission search results must be an array');
assert.ok(search.results.length > 0, `Mission search returned no products: ${JSON.stringify(search).slice(0, 3000)}`);

const candidate = search.results.find((item) => {
  const url = item.productUrl || item.url || item.sourceUrl || '';
  return engine.isDirectProductUrl(url);
});
assert.ok(candidate, `No direct-product candidate: ${JSON.stringify(search.results).slice(0, 3000)}`);

const productUrl = candidate.productUrl || candidate.url || candidate.sourceUrl;
const resolved = await getJson('/api/resolve?url=' + encodeURIComponent(productUrl));
assert.equal(resolved.success, true);
assert.equal(resolved.resolved, true);
assert.ok(Number(resolved.priceToman) > 0, `Invalid resolved price: ${JSON.stringify(resolved)}`);
assert.ok(['in_stock', 'out_of_stock', 'unknown'].includes(resolved.availability));
assert.equal(resolved.productUrl, productUrl);

const store = candidate.storeId || candidate.store || candidate.source;
const offer = engine.normalizeOffer({
  productId: candidate.productId || candidate.id || productUrl,
  storeId: store,
  store,
  storeName: candidate.storeName || store,
  price: resolved.priceToman,
  priceToman: resolved.priceToman,
  currency: resolved.currency || 'IRT',
  available: resolved.availability !== 'out_of_stock',
  availability: resolved.availability,
  productUrl: resolved.productUrl || productUrl
});
assert.ok(offer, 'Offer normalization failed');
assert.equal(offer.productUrl, productUrl, 'Offer lost the real product URL');
assert.ok(offer.affiliateUrl === productUrl || /^https:\/\/aflo\.ir\/(TrvNHEN8|YPN05dL7)[?&]p=/.test(offer.affiliateUrl), `Offer purchase URL is invalid: ${JSON.stringify(offer)}`);
assert.equal(offer.isAffiliate, offer.affiliateUrl !== productUrl);

const final = engine.finalize([{
  id: candidate.productId || candidate.id || productUrl,
  productId: candidate.productId || candidate.id || productUrl,
  name: candidate.name,
  offers: [offer]
}], { limit: 1 });
assert.equal(final.length, 1, 'Finalization returned no recommendation');
assert.equal(final[0].productUrl, productUrl);
assert.equal(final[0].affiliateUrl, offer.affiliateUrl);
assert.ok(Number(final[0].priceToman) > 0);

const purchaseUrl = final[0].affiliateUrl || final[0].productUrl;
assert.ok(purchaseUrl === productUrl || purchaseUrl.startsWith('https://aflo.ir/'), 'Purchase URL must be direct or affiliate');

const click = await fetch(purchaseUrl, {
  method: 'GET',
  redirect: 'manual',
  headers: { accept: 'text/html,application/xhtml+xml' }
});
assert.ok([200, 301, 302, 303, 307, 308].includes(click.status), `Purchase link failed HTTP ${click.status}`);
const location = click.headers.get('location') || '';
if (click.status !== 200) assert.ok(location, 'Purchase redirect has no Location header');

console.log(JSON.stringify({
  ok: true,
  mission: 'v5.1-full-mission-e2e',
  readiness: { query: READINESS_QUERY, total: readiness.total, parsedBudgetMax: readiness.parsed.price.maxPrice, noMatchAccepted: readiness.results.length === 0 },
  query: MISSION_QUERY,
  search: { source: search.source, total: search.total },
  product: { name: candidate.name, store, productUrl },
  live: { priceToman: resolved.priceToman, currency: resolved.currency, availability: resolved.availability, extraction: resolved.extraction },
  offer: { purchaseUrl, affiliateUrl: offer.affiliateUrl, isAffiliate: offer.isAffiliate },
  purchaseClick: { httpStatus: click.status, redirectLocationPresent: Boolean(location) }
}, null, 2));
