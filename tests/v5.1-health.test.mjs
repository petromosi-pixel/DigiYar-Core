import assert from 'node:assert/strict';
import { PRODUCT_INDEX } from '../js/product-index-generated-v5.1.js';
import { parseQuery, hardFilter, rankOffers, selectBestOffer, groupProducts } from '../js/search-core-v5.1.js';
import { normalizeObservation, isFresh, upsertProduct, trimCategory, MAX_PRODUCTS_PER_CATEGORY } from '../js/data-ingestion-v5.1.js';
import { freshness, refreshOffer } from '../js/price-availability-engine-v5.1.js';

const tests = [];
function test(name, fn) { tests.push([name, fn]); }

// 1) Generated catalog integrity
test('catalog exists and is bounded', () => {
  assert.ok(Array.isArray(PRODUCT_INDEX));
  assert.ok(PRODUCT_INDEX.length > 0);
  assert.ok(PRODUCT_INDEX.length <= 1000);
});

test('catalog product IDs are unique', () => {
  const ids = PRODUCT_INDEX.map(p => p.productId || p.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every(Boolean));
});

test('catalog records have the canonical fields', () => {
  for (const p of PRODUCT_INDEX.slice(0, 100)) {
    assert.ok(p.productId || p.id, 'missing productId/id');
    assert.ok(p.name, 'missing name');
    assert.ok(p.category, 'missing category');
    assert.ok(p.productUrl, 'missing productUrl');
    assert.ok(!/\/search(?:\/|\?|$)/i.test(p.productUrl), `search URL leaked: ${p.productUrl}`);
  }
});

test('catalog does not contain obvious navigation-only records', () => {
  const bad = /^(قیمت \(تومان\)|گارانتی|فروشگاه|استان|تاریخ|برندهای موبایل|موبایل یاب)$/i;
  const leaked = PRODUCT_INDEX.filter(p => bad.test(String(p.name).trim()));
  assert.equal(leaked.length, 0, `navigation records leaked: ${leaked.slice(0, 5).map(x => x.name).join(', ')}`);
});

// 2) Query parser / constraints
test('query parser extracts brand and price constraint', () => {
  const q = parseQuery('گوشی سامسونگ زیر ۳۰ میلیون');
  assert.ok(q.brands.includes('سامسونگ'));
  assert.equal(q.price.maxPrice, 30_000_000);
});

test('hard filter rejects search URLs and price violations', () => {
  const offers = [
    { productId: '1', name: 'گوشی سامسونگ', price: 25_000_000, productUrl: 'https://shop.ir/p/1', availability: 'in_stock' },
    { productId: '2', name: 'گوشی سامسونگ', price: 35_000_000, productUrl: 'https://shop.ir/p/2', availability: 'in_stock' },
    { productId: '3', name: 'گوشی', price: 20_000_000, productUrl: 'https://shop.ir/search?q=گوشی', availability: 'in_stock' }
  ];
  const out = hardFilter(offers, { maxPrice: 30_000_000 });
  assert.deepEqual(out.map(x => x.productId), ['1']);
});

test('ranking prefers relevant brand and valid offer data', () => {
  const q = parseQuery('گوشی سامسونگ');
  const out = rankOffers([
    { productId: 'a', name: 'گوشی شیائومی', brand: 'شیائومی', price: 20_000_000, productUrl: 'https://x.ir/a', availability: 'in_stock' },
    { productId: 'b', name: 'گوشی سامسونگ Galaxy', brand: 'سامسونگ', price: 30_000_000, productUrl: 'https://x.ir/b', availability: 'in_stock' }
  ], q);
  assert.equal(out[0].productId, 'b');
});

test('best offer is selected deterministically', () => {
  const best = selectBestOffer([
    { productId: 'a', name: 'گوشی', price: 30_000_000, productUrl: 'https://x.ir/a', availability: 'in_stock' },
    { productId: 'b', name: 'گوشی', price: 20_000_000, productUrl: 'https://x.ir/b', availability: 'in_stock' }
  ], parseQuery('گوشی'));
  assert.equal(best.productId, 'b');
});

test('same product offers can be grouped', () => {
  const groups = groupProducts([
    { productId: 'p1', name: 'گوشی A', storeId: 's1', productUrl: 'https://x.ir/1' },
    { productId: 'p1', name: 'گوشی A', storeId: 's2', productUrl: 'https://y.ir/1' }
  ]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].offers.length, 2);
});

// 3) Ingestion normalization / cap / freshness
test('observation normalization produces canonical offer shape', () => {
  const o = normalizeObservation({ id: 123, productName: 'Test', store: 'shop', url: 'https://shop.ir/p/123', price: '12000000', available: true });
  assert.equal(o.productId, '123');
  assert.equal(o.name, 'Test');
  assert.equal(o.price, 12_000_000);
  assert.equal(o.availability, 'in_stock');
});

test('freshness rejects stale observations', () => {
  const stale = { observedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() };
  assert.equal(isFresh(stale), false);
});

test('category cap never exceeds 500', () => {
  const catalog = Array.from({ length: MAX_PRODUCTS_PER_CATEGORY + 25 }, (_, i) => ({ id: String(i) }));
  assert.equal(trimCategory(catalog).length, MAX_PRODUCTS_PER_CATEGORY);
});

test('upsert updates an existing store offer instead of duplicating it', () => {
  const catalog = [];
  upsertProduct(catalog, { productId: 'p1', name: 'A', storeId: 's1', price: 10, productUrl: 'https://x.ir/p1' });
  upsertProduct(catalog, { productId: 'p1', name: 'A', storeId: 's1', price: 20, productUrl: 'https://x.ir/p1' });
  assert.equal(catalog.length, 1);
  assert.equal(catalog[0].offers.length, 1);
  assert.equal(catalog[0].offers[0].price, 20);
});

// 4) Price / availability engine safety
test('freshness exposes TTL state', () => {
  const r = freshness({ observedAt: new Date().toISOString() });
  assert.equal(r.fresh, true);
  assert.ok(r.ttlMs > 0);
});

test('price engine never fabricates data when URL is missing', async () => {
  const r = await refreshOffer({ productId: 'p1', price: 10, availability: 'unknown' });
  assert.equal(r.refreshStatus, 'no_url');
  assert.equal(r.price, 10);
});

let failed = 0;
for (const [name, fn] of tests) {
  try { await fn(); console.log(`PASS ${name}`); }
  catch (e) { failed++; console.error(`FAIL ${name}\n  ${e.message}`); }
}
console.log(`\nV5.1 health suite: ${tests.length - failed}/${tests.length} passed`);
if (failed) process.exitCode = 1;
