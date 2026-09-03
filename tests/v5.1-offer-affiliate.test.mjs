import assert from 'node:assert/strict';
import engine from '../js/v5-offer-affiliate-engine.js';

const digikalaUrl = 'https://www.digikala.com/product/dkp-123456/example/';
const snappUrl = 'https://snappshop.ir/product/example/';

assert.equal(engine.toToman(295286000, 'IRT'), 295286000);
assert.equal(engine.toToman(2952860000, 'IRR'), 295286000);
assert.equal(engine.isDirectProductUrl(digikalaUrl), true);
assert.equal(engine.isDirectProductUrl('https://www.digikala.com/search/?q=phone'), false);

const explicit = engine.normalizeOffer({
  productId: 'p1', store: 'digikala', price: 2952860000, currency: 'IRR',
  available: true, productUrl: digikalaUrl, affiliateUrl: 'https://aflo.ir/EXPLICIT'
});
assert.equal(explicit.priceToman, 295286000);
assert.equal(explicit.affiliateUrl, 'https://aflo.ir/EXPLICIT');
assert.equal(explicit.isAffiliate, true);

const generated = engine.normalizeOffer({
  productId: 'p2', store: 'digikala', price: 300000000, currency: 'IRR',
  available: true, productUrl: digikalaUrl
});
assert.equal(generated.priceToman, 30000000);
assert.match(generated.affiliateUrl, /^https:\/\/aflo\.ir\/TrvNHEN8[?&]p=/);

const best = engine.selectBestOffer([
  { productId: 'p1', store: 'digikala', price: 350000000, currency: 'IRR', available: true, productUrl: digikalaUrl },
  { productId: 'p1', store: 'snappshop', price: 300000000, currency: 'IRR', available: true, productUrl: snappUrl }
]);
assert.equal(best.store, 'snappshop');
assert.equal(best.priceToman, 30000000);

const ranked = engine.finalize([
  { id: 'a', name: 'A', _score: 50, offers: [{ productId: 'a', store: 'digikala', price: 400000000, currency: 'IRR', available: true, productUrl: digikalaUrl }] },
  { id: 'b', name: 'B', _score: 80, offers: [{ productId: 'b', store: 'digikala', price: 300000000, currency: 'IRR', available: true, productUrl: digikalaUrl }] },
  { id: 'c', name: 'C', _score: 90, offers: [{ productId: 'c', store: 'digikala', price: 500000000, currency: 'IRR', available: true, productUrl: digikalaUrl }] }
], { targetPriceToman: 40000000, limit: 3 });
assert.deepEqual(ranked.map(x => x.id), ['a', 'b', 'c']);
assert.equal(ranked[0].offer.priceToman, 40000000);
assert.equal(ranked[0].rank, 1);

const rejected = engine.prepareProduct({
  id: 'bad', offers: [{ productId: 'bad', store: 'digikala', price: 100000000, currency: 'IRR', available: true, productUrl: 'https://www.digikala.com/search/?q=bad' }]
});
assert.equal(rejected, null);

console.log('v5.1 Offer/Affiliate Engine tests: PASS');
