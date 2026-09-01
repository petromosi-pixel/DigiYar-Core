import fs from 'node:fs/promises';
import crypto from 'node:crypto';

const MAX_PER_CATEGORY = 500;
const MAX_PAGES_PER_SUBCATEGORY = 3;
const UA = 'DigiYar-Subcategory-Ingest/5.1 (+https://petromosi-pixel.github.io/DigiYar-Core/)';

const registry = JSON.parse(await fs.readFile('data/subcategory-registry-v5.1.json', 'utf8'));
const norm = s => String(s ?? '').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/\s+/g, ' ').trim();
const money = s => { const m = norm(s).replace(/[٬,\s]/g, '').match(/\d+(?:\.\d+)?/); return m ? Number(m[0]) : 0; };
const hash = s => crypto.createHash('sha1').update(String(s)).digest('hex').slice(0, 16);
const slug = s => encodeURIComponent(norm(s).replace(/\u200c/g, ' ').replace(/\s+/g, '-'));
const abs = (base, u) => { try { return new URL(u, base).href; } catch { return ''; } };

async function get(url) {
  const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,application/json', 'accept-language': 'fa-IR,fa;q=0.9,en;q=0.7' } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
}

function jsonLd(html) {
  const out = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) { try { walk(JSON.parse(m[1]), out); } catch {} }
  return out;
}
function walk(x, out) {
  if (!x) return;
  if (Array.isArray(x)) return x.forEach(v => walk(v, out));
  if (typeof x !== 'object') return;
  const t = Array.isArray(x['@type']) ? x['@type'].join(' ') : String(x['@type'] || '');
  if (/product/i.test(t) && x.name) {
    const o = Array.isArray(x.offers) ? x.offers[0] : (x.offers || {});
    out.push({ name: norm(x.name), url: x.url || '', sku: x.sku || x.productID || x.mpn || '', price: money(o.price || x.price), currency: o.priceCurrency || 'IRR', image: Array.isArray(x.image) ? x.image[0] : x.image || '', availability: o.availability || x.availability || '' });
  }
  Object.values(x).forEach(v => { if (v && typeof v === 'object') walk(v, out); });
}

function anchors(html, base) {
  const out = [];
  const re = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html))) {
    const url = abs(base, m[1]);
    if (!url) continue;
    const u = new URL(url);
    const text = norm(m[2].replace(/<[^>]+>/g, ' '));
    if (u.hostname !== 'torobshop.com' || !/^\/products\//i.test(u.pathname) || /\/category(?:-|\/)|\/category-products\//i.test(u.pathname)) continue;
    if (text.length >= 4) out.push({ url, name: text });
  }
  return out;
}

function normalize(x, category, subcategory, pageUrl) {
  const name = norm(x.name || x.title || '');
  const url = abs(pageUrl, x.url || x.productUrl || '');
  if (name.length < 4 || !url) return null;
  try { if (new URL(url).hostname !== 'torobshop.com') return null; } catch { return null; }
  return {
    id: `torobshop-${category}-${hash(url || name)}`,
    productId: `torobshop-${hash(url || name)}`,
    name,
    brand: '',
    model: name,
    category,
    subcategory,
    price: money(x.price || 0),
    currency: x.currency || 'IRR',
    availability: /outofstock|unavailable/i.test(String(x.availability || '')) ? 'out_of_stock' : 'unknown',
    productUrl: url,
    image: x.image || '',
    sourceId: 'torobshop-category',
    sourceUrl: pageUrl,
    source: 'web-catalog:torobshop-category',
    observedAt: new Date().toISOString()
  };
}

async function ingestCategory(category, cfg) {
  const products = [];
  const seen = new Set();
  const diagnostics = [];
  for (const subcategory of cfg.subcategories) {
    for (let page = 1; page <= MAX_PAGES_PER_SUBCATEGORY; page++) {
      const url = `https://torobshop.com/products/category-products/${slug(subcategory)}${page > 1 ? `?page=${page}` : ''}`;
      try {
        const html = await get(url);
        const rows = jsonLd(html);
        const candidates = rows.length ? rows : anchors(html, url);
        for (const x of candidates) {
          const r = normalize(x, category, subcategory, url);
          if (!r || seen.has(r.productUrl)) continue;
          seen.add(r.productUrl); products.push(r);
          if (products.length >= MAX_PER_CATEGORY) break;
        }
        if (products.length >= MAX_PER_CATEGORY) break;
      } catch (e) { diagnostics.push({ subcategory, page, url, error: e.message }); }
    }
    if (products.length >= MAX_PER_CATEGORY) break;
  }
  return { products, diagnostics };
}

const meta = { version: '5.1', mode: 'subcategory-aware', generatedAt: new Date().toISOString(), source: 'TorobShop public category pages', categories: [] };
const combined = [];

for (const [category, cfg] of Object.entries(registry.categories)) {
  const path = `data/catalog/${category}.json`;
  let existing = { products: [] };
  try { existing = JSON.parse(await fs.readFile(path, 'utf8')); } catch {}
  const result = await ingestCategory(category, cfg);
  const merged = [];
  const seen = new Set();
  for (const p of [...(existing.products || []), ...result.products]) {
    const key = p.productUrl || p.id;
    if (seen.has(key)) continue;
    seen.add(key); merged.push(p);
    if (merged.length >= MAX_PER_CATEGORY) break;
  }
  const subCounts = Object.fromEntries(cfg.subcategories.map(s => [s, 0]));
  for (const p of merged) if (p.subcategory && subCounts[p.subcategory] !== undefined) subCounts[p.subcategory]++;
  const out = { ...existing, version: '5.1', mode: 'subcategory-aware', generatedAt: new Date().toISOString(), subcategories: cfg.subcategories, subcategoryCounts: subCounts, products: merged, count: merged.length, diagnostics: [...(existing.diagnostics || []), ...result.diagnostics] };
  await fs.writeFile(path, JSON.stringify(out, null, 2) + '\n');
  await fs.writeFile(`js/${category}-product-index-v5.1.js`, `export const ${category.toUpperCase().replace(/-/g, '_')}_PRODUCTS = ${JSON.stringify(merged, null, 2)};\n`);
  meta.categories.push({ id: category, name: cfg.name, count: merged.length, subcategoryCounts: subCounts, source: 'TorobShop public category pages' });
  combined.push(...merged);
  console.log(`${category}: ${merged.length}`);
}

await fs.writeFile('data/category-registry-v5.1.json', JSON.stringify(meta, null, 2) + '\n');
await fs.writeFile('js/product-index-generated-v5.1.js', `// Generated by subcategory-ingest-v5.1.mjs\nexport const PRODUCT_INDEX = ${JSON.stringify(combined, null, 2)};\nexport const INDEX_META = ${JSON.stringify({ generatedAt: new Date().toISOString(), total: combined.length, mode: 'subcategory-aware', categories: meta.categories }, null, 2)};\n`);
console.log(`SUBCATEGORY_TOTAL: ${combined.length}`);
