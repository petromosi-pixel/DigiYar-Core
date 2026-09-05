const WORKER = 'https://digiyar-v6.petromosi.workers.dev';
const PRODUCT_URL = 'https://torobshop.com/products/galaxy-s26-ultra';

async function get(path) {
  const response = await fetch(WORKER + path, { headers: { accept: 'application/json' } });
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); } catch { throw new Error(`Non-JSON response ${response.status}: ${text.slice(0, 200)}`); }
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${JSON.stringify(body)}`);
  return body;
}

const health = await get('/health');
if (health.status !== 'ok' || health.version !== 'v5.1-search-core') throw new Error(`worker health failed: ${JSON.stringify(health)}`);

const search = await get('/api/search?q=' + encodeURIComponent('گوشی سامسونگ'));
if (search.success !== true || !Array.isArray(search.results)) throw new Error(`search failed: ${JSON.stringify(search)}`);

const resolved = await get('/api/resolve?url=' + encodeURIComponent(PRODUCT_URL));
if (resolved.success !== true || resolved.resolved !== true) throw new Error(`resolver failed: ${JSON.stringify(resolved)}`);
if (!(Number(resolved.priceToman) > 0)) throw new Error(`resolver returned invalid price: ${JSON.stringify(resolved)}`);
if (!['IRT', 'IRR'].includes(resolved.currency)) throw new Error(`resolver returned invalid currency: ${JSON.stringify(resolved)}`);
if (!['in_stock', 'out_of_stock', 'unknown'].includes(resolved.availability)) throw new Error(`resolver returned invalid availability: ${JSON.stringify(resolved)}`);

console.log(JSON.stringify({
  ok: true,
  worker: health.version,
  search: { total: search.total, source: search.source },
  resolver: { productUrl: resolved.productUrl, priceToman: resolved.priceToman, currency: resolved.currency, availability: resolved.availability, extraction: resolved.extraction }
}, null, 2));
