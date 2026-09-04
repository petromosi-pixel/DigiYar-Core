import assert from 'node:assert/strict';

const WORKER = 'https://digiyar-v5.petromosi.workers.dev/api/search';
const QUERIES = [
  'گوشی سامسونگ تا ۵۰ میلیون تومان می‌خوام',
  'دنبال یه لپ تاپ دانشجویی می‌گردم'
];

const DIRECT_PRODUCT_RE = /^https:\/\/(?:www\.)?(?:digikala\.com|snappshop\.ir|torobshop\.com)\/(?!search(?:\/|\?|$))/i;

function unwrap(data) {
  if (data?.data && typeof data.data === 'object') return data.data;
  return data || {};
}

function productsOf(data) {
  const payload = unwrap(data);
  const values = [payload.results, payload.items, payload.products];
  for (const value of values) {
    if (Array.isArray(value) && value.length) return value;
  }
  return [];
}

function priceOf(item) {
  const direct = Number(item?.priceToman ?? item?.price_toman ?? 0);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const raw = Number(item?.price ?? 0);
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  const currency = String(item?.currency || '').toUpperCase();
  return currency === 'IRR' || raw >= 100000 ? Math.round(raw / 10) : raw;
}

for (const query of QUERIES) {
  const url = `${WORKER}?q=${encodeURIComponent(query)}`;
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  assert.equal(response.ok, true, `Worker search failed for: ${query} (${response.status})`);

  const data = await response.json();
  const products = productsOf(data);
  assert.ok(products.length > 0, `No products returned for: ${query}`);

  const candidate = products.find(item => {
    const productUrl = String(item?.productUrl || item?.url || item?.web_url || '');
    return DIRECT_PRODUCT_RE.test(productUrl) && priceOf(item) > 0;
  });

  assert.ok(candidate, `No purchasable direct-product candidate for: ${query}`);

  const productUrl = String(candidate.productUrl || candidate.url || candidate.web_url || '');
  assert.match(productUrl, DIRECT_PRODUCT_RE, `Invalid product URL for: ${query}`);
  assert.ok(priceOf(candidate) > 0, `Missing price for: ${query}`);

  console.log(JSON.stringify({
    query,
    name: candidate.name || candidate.title || '',
    priceToman: priceOf(candidate),
    productUrl,
    source: data.source || data.provider || 'worker'
  }));
}

console.log('V5.1 smart-search contract: PASS');