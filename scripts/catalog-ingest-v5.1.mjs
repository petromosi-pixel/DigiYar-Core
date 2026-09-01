import fs from 'node:fs/promises';
import crypto from 'node:crypto';

const MAX = 500;
const UA = 'DigiYar-Catalog-Ingest/5.1 (+https://digiyar-v5.petromosi.workers.dev/)';

/*
 * V5.1 catalog expansion
 * - Public, unauthenticated pages/APIs only.
 * - No price/stock decision is made here; those fields are retained when exposed.
 * - Each top-level DigiYar category may aggregate several public Iranian sources.
 * - The first phase deliberately favors stable public catalog pages (Technolife,
 *   mobile.ir, Digizo, BPRShop) and the documented public MajidAPI adapters for
 *   Basalam where a direct public catalog page is not reliably indexable.
 */
const CATALOGS = {
  mobile: {
    name: 'موبایل و تبلت',
    sources: [
      { id: 'technolife-mobile', kind: 'html', url: 'https://www.technolife.com/category/mobile', pages: 12, pageParam: 'page' },
      { id: 'mobile-ir', kind: 'html', url: 'https://www.mobile.ir/phones/prices.aspx?brandid=0&duration=14&pagesize=200&price_from=-1&price_to=-1&provinceid=0&shopid=0&sort=warranty&terms=', pages: 1 },
      { id: 'digizo-mobile', kind: 'html', url: 'https://digizo.shop/product-category/mobile/', pages: 8 },
      { id: 'bprshop-mobile', kind: 'html', url: 'https://www.bprshop.com/mobile', pages: 4 }
    ]
  },
  'laptop-computer': {
    name: 'لپ تاپ، کامپیوتر و اداری',
    sources: [
      { id: 'technolife-laptop', kind: 'html', url: 'https://www.technolife.com/category/laptop-equipment', pages: 12, pageParam: 'page' },
      { id: 'technolife-pc', kind: 'html', url: 'https://www.technolife.com/category/pc-equipment', pages: 12, pageParam: 'page' },
      { id: 'digizo-laptop', kind: 'html', url: 'https://digizo.shop/product-category/laptop/', pages: 10 },
      { id: 'elecamp', kind: 'html', url: 'https://elecamp.ir/', pages: 2 }
    ]
  },
  'home-appliances': {
    name: 'لوازم خانگی',
    sources: [
      { id: 'technolife-home', kind: 'html', url: 'https://www.technolife.com/category/home-app', pages: 12, pageParam: 'page' },
      { id: 'basalam-home', kind: 'majidapi-search', url: 'https://api.majidapi.ir/basalam?action=search&s=لوازم%20خانگی&page=', pages: 8 }
    ]
  },
  digital: {
    name: 'کالای دیجیتال و لوازم جانبی',
    sources: [
      { id: 'technolife-pc', kind: 'html', url: 'https://www.technolife.com/category/pc-equipment', pages: 10, pageParam: 'page' },
      { id: 'technolife-mobile-accessories', kind: 'html', url: 'https://www.technolife.com/category/mobile/phone-accessories', pages: 10, pageParam: 'page' },
      { id: 'technolife-tablet-accessories', kind: 'html', url: 'https://www.technolife.com/category/tablet-equipment/tablet-accessories', pages: 8, pageParam: 'page' }
    ]
  },
  'audio-video': {
    name: 'صوتی و تصویری',
    sources: [
      { id: 'technolife-multimedia', kind: 'html', url: 'https://www.technolife.com/category/multimedia', pages: 12, pageParam: 'page' }
    ]
  },
  fashion: {
    name: 'مد و پوشاک',
    sources: [
      { id: 'basalam-fashion', kind: 'majidapi-search', url: 'https://api.majidapi.ir/basalam?action=search&s=پوشاک&page=', pages: 10 },
      { id: 'basalam-shoes', kind: 'majidapi-search', url: 'https://api.majidapi.ir/basalam?action=search&s=کفش&page=', pages: 6 },
      { id: 'basalam-bag', kind: 'majidapi-search', url: 'https://api.majidapi.ir/basalam?action=search&s=کیف&page=', pages: 6 }
    ]
  },
  'beauty-health': {
    name: 'زیبایی، بهداشت و سلامت',
    sources: [
      { id: 'technolife-health-beauty', kind: 'html', url: 'https://www.technolife.com/category/health-beauty', pages: 12, pageParam: 'page' },
      { id: 'basalam-beauty', kind: 'majidapi-search', url: 'https://api.majidapi.ir/basalam?action=search&s=آرایشی&page=', pages: 6 },
      { id: 'basalam-health', kind: 'majidapi-search', url: 'https://api.majidapi.ir/basalam?action=search&s=بهداشتی&page=', pages: 6 }
    ]
  },
  supermarket: {
    name: 'سوپرمارکت و خوراکی',
    sources: [
      { id: 'basalam-grocery', kind: 'majidapi-search', url: 'https://api.majidapi.ir/basalam?action=search&s=مواد%20غذایی&page=', pages: 10 },
      { id: 'basalam-rice', kind: 'majidapi-search', url: 'https://api.majidapi.ir/basalam?action=search&s=برنج&page=', pages: 6 },
      { id: 'basalam-oil', kind: 'majidapi-search', url: 'https://api.majidapi.ir/basalam?action=search&s=روغن&page=', pages: 6 }
    ]
  },
  'sports-travel': {
    name: 'ورزش و سفر',
    sources: [
      { id: 'technolife-sports-travel', kind: 'html', url: 'https://www.technolife.com/category/sports-travel', pages: 12, pageParam: 'page' }
    ]
  },
  'tools-industrial': {
    name: 'ابزار و تجهیزات صنعتی',
    sources: [
      { id: 'technolife-tools', kind: 'html', url: 'https://www.technolife.com/category/tools', pages: 12, pageParam: 'page' }
    ]
  },
  'books-stationery': {
    name: 'کتاب، لوازم تحریر و هنر',
    sources: [
      { id: 'technolife-stationery', kind: 'html', url: 'https://www.technolife.com/category/art-culture/stationery', pages: 12, pageParam: 'page' },
      { id: 'technolife-writing', kind: 'html', url: 'https://www.technolife.com/category/art-culture/stationery/writing-supplies', pages: 8, pageParam: 'page' }
    ]
  },
  'kids-toys': {
    name: 'اسباب بازی، کودک و نوزاد',
    sources: [
      { id: 'technolife-toys', kind: 'html', url: 'https://www.technolife.com/category/art-culture/toys', pages: 8, pageParam: 'page' },
      { id: 'basalam-toys', kind: 'majidapi-search', url: 'https://api.majidapi.ir/basalam?action=search&s=اسباب%20بازی&page=', pages: 8 }
    ]
  },
  auto: {
    name: 'خودرو و موتورسیکلت',
    sources: [
      { id: 'technolife-auto', kind: 'html', url: 'https://www.technolife.com/category/car-motor', pages: 12, pageParam: 'page' },
      { id: 'technolife-car-parts', kind: 'html', url: 'https://www.technolife.com/category/car-motor/car-utilities', pages: 10, pageParam: 'page' }
    ]
  }
};

const norm = s => String(s ?? '').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/\s+/g, ' ').trim();
const money = s => { const raw = norm(s).replace(/[٬,\s]/g, ''); const m = raw.match(/\d+(?:\.\d+)?/); return m ? Number(m[0]) : 0; };
const hash = s => crypto.createHash('sha1').update(String(s)).digest('hex').slice(0, 16);
function abs(base, u) { try { return new URL(u, base).href; } catch { return ''; } }
function availability(text) { const t = norm(text); if (/ناموجود|در انبار موجود نمی باشد|تمام شده|out of stock|unavailable/i.test(t)) return 'out_of_stock'; if (/موجود در انبار|موجود|in stock/i.test(t)) return 'in_stock'; return 'unknown'; }

const BRAND_PAIRS = [
  ['سامسونگ','سامسونگ'],['Samsung','سامسونگ'],['شیائومی','شیائومی'],['Xiaomi','شیائومی'],['اپل','اپل'],['Apple','اپل'],['آیفون','اپل'],
  ['لنوو','لنوو'],['Lenovo','لنوو'],['ایسوس','ایسوس'],['ASUS','ایسوس'],['اچ پی','اچ‌پی'],['HP','اچ‌پی'],['دل','دل'],['Dell','دل'],
  ['ایسر','ایسر'],['Acer','ایسر'],['MSI','MSI'],['ام اس آی','MSI'],['مایکروسافت','مایکروسافت'],['Microsoft','مایکروسافت'],
  ['سونی','سونی'],['Sony','سونی'],['جی بی ال','JBL'],['JBL','JBL'],['انکر','Anker'],['Anker','Anker'],['بوش','بوش'],['Bosch','بوش'],
  ['پارس خزر','پارس خزر'],['رونیکس','رونیکس'],['تسنیم','تسنیم']
];
function brand(name) { const n = norm(name).toLowerCase(); return BRAND_PAIRS.find(([k]) => n.includes(k.toLowerCase()))?.[1] || ''; }

async function get(url, accept = 'text/html,application/xhtml+xml,application/json') {
  const r = await fetch(url, { headers: { 'user-agent': UA, accept, 'accept-language': 'fa-IR,fa;q=0.9,en;q=0.7' } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return await r.text();
}

function jsonLd(html) {
  const out = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) { try { walkJsonLd(JSON.parse(m[1]), out); } catch {} }
  return out;
}
function walkJsonLd(x, out) {
  if (!x) return;
  if (Array.isArray(x)) { x.forEach(v => walkJsonLd(v, out)); return; }
  if (typeof x !== 'object') return;
  const t = Array.isArray(x['@type']) ? x['@type'].join(' ') : String(x['@type'] || '');
  if (/product/i.test(t) && x.name) {
    const o = Array.isArray(x.offers) ? x.offers[0] : (x.offers || {});
    out.push({ name: norm(x.name), url: x.url || '', sku: x.sku || x.productID || x.mpn || '', price: money(o.price || x.price), availability: o.availability || x.availability || '', currency: o.priceCurrency || 'IRR', image: Array.isArray(x.image) ? x.image[0] : x.image || '' });
  }
  Object.values(x).forEach(v => { if (v && typeof v === 'object') walkJsonLd(v, out); });
}

function anchors(html, base) {
  const out = [];
  const re = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html))) {
    const url = abs(base, m[1]);
    const text = norm(m[2].replace(/<[^>]+>/g, ' '));
    if (!url || !text || text.length < 3) continue;
    out.push({ url, name: text, near: html.slice(m.index, Math.min(html.length, m.index + 1800)) });
  }
  return out;
}

function isProductUrl(url) {
  try {
    const u = new URL(url); const p = u.pathname;
    return /mobile\.ir\/phones\/shops-\d+-[^?#]+\.aspx/i.test(url)
      || /\/product(?:\/|-)[^/?#]+/i.test(p)
      || /\/p\/[^/?#]+/i.test(p)
      || /\/product\/dkp-\d+/i.test(p)
      || /\/product\/[^/?#]+/i.test(p);
  } catch { return false; }
}
function isNavigationUrl(url) {
  try {
    const p = new URL(url).pathname.replace(/\/+$/, '');
    return /\/product-category(?:\/|$)|\/category(?:\/|$)|\/search(?:\/|$)|\/tag(?:\/|$)|\/brand(?:\/|$)|\/finder(?:\/|$)|\/reviews?(?:\/|$)|\/prices?(?:\/|$)/i.test(p);
  } catch { return true; }
}
function validName(name) {
  const n = norm(name);
  return n.length >= 3 && !/^(قیمت|گارانتی|فروشگاه|استان|تاریخ|برندها|مقایسه|بررسی تخصصی|گوشی موبایل)$/i.test(n);
}

function normalizeRecord(x, category, source) {
  const name = norm(x.name || x.title || x.name1 || x.product_name || '');
  const productUrl = abs(source.url, x.productUrl || x.url || x.absolute_url || x.page_url || x.web_client_absolute_url || '');
  if (!validName(name)) return null;
  if (!productUrl && source.kind !== 'majidapi-search') return null;
  if (productUrl && (!isProductUrl(productUrl) || isNavigationUrl(productUrl))) return null;
  const rawAvailability = x.availability;
  const avail = typeof rawAvailability === 'boolean' ? (rawAvailability ? 'in_stock' : 'out_of_stock') : availability(`${rawAvailability || ''} ${x.stock_status || ''} ${x.stockStatus || ''} ${x.name || x.title || ''}`);
  const idSeed = String(x.id || x.productId || x.product_id || x.sku || x.random_key || productUrl || name);
  return {
    id: `web-${category}-${hash(`${source.id}:${idSeed}`)}`,
    productId: `web-${category}-${hash(`${source.id}:${idSeed}`)}`,
    name,
    brand: brand(name),
    model: name,
    category,
    price: money(x.price || x.current_price || x.sale_price || x.regular_price || 0),
    currency: x.currency || 'IRR',
    availability: avail,
    productUrl: productUrl || '',
    image: x.image || x.image_url || (Array.isArray(x.image_links) ? x.image_links[0] : '') || '',
    sourceId: source.id,
    sourceUrl: source.url,
    source: `web-catalog:${source.id}`,
    observedAt: new Date().toISOString()
  };
}

function collectJsonObjects(value, out = []) {
  if (!value) return out;
  if (Array.isArray(value)) { value.forEach(v => collectJsonObjects(v, out)); return out; }
  if (typeof value !== 'object') return out;
  const hasName = value.name || value.title || value.name1 || value.product_name || value.page_url || value.absolute_url || value.web_client_absolute_url;
  if (hasName) out.push(value);
  Object.values(value).forEach(v => { if (v && typeof v === 'object') collectJsonObjects(v, out); });
  return out;
}

function pageUrl(source, page) {
  if (page === 1) return source.url;
  if (source.pageParam) return `${source.url}${source.url.includes('?') ? '&' : '?'}${source.pageParam}=${page}`;
  return source.url.endsWith('/') ? `${source.url}page/${page}/` : `${source.url}/page/${page}/`;
}

async function parseSource(source, category) {
  const found = [];
  for (let page = 1; page <= (source.pages || 1); page++) {
    const url = source.kind === 'majidapi-search' ? `${source.url}${page}` : pageUrl(source, page);
    try {
      const raw = await get(url, source.kind === 'majidapi-search' ? 'application/json,text/plain,*/*' : 'text/html,application/xhtml+xml,application/json');
      if (source.kind === 'majidapi-search') {
        try {
          const parsed = JSON.parse(raw);
          for (const x of collectJsonObjects(parsed)) { const r = normalizeRecord(x, category, { ...source, url }); if (r) found.push(r); }
        } catch {}
      } else {
        for (const x of jsonLd(raw)) { const r = normalizeRecord(x, category, { ...source, url }); if (r) found.push(r); }
        if (!found.length) {
          for (const x of anchors(raw, url)) { const r = normalizeRecord({ name: x.name, url: x.url, availability: x.near }, category, { ...source, url }); if (r) found.push(r); }
        }
      }
    } catch (e) { found.push({ __diagnostic: { page, url, error: e.message } }); }
  }
  return found;
}

async function collect(category, config) {
  const all = [];
  const diagnostics = [];
  for (const source of config.sources) {
    const before = all.length;
    const rows = await parseSource(source, category);
    for (const row of rows) {
      if (row.__diagnostic) diagnostics.push({ source: source.id, ...row.__diagnostic }); else all.push(row);
    }
    diagnostics.push({ source: source.id, accepted: all.length - before });
  }
  const uniq = [];
  const seen = new Set();
  for (const x of all) {
    const key = x.productUrl || `${x.sourceId}:${x.productId}`;
    if (seen.has(key)) continue;
    seen.add(key); uniq.push(x);
    if (uniq.length >= MAX) break;
  }
  return { version: '5.1', category, name: config.name, maxProducts: MAX, generatedAt: new Date().toISOString(), sources: config.sources, products: uniq, status: 'web-ingested', count: uniq.length, diagnostics };
}

const registry = { version: '5.1', maxProductsPerCategory: MAX, generatedAt: new Date().toISOString(), categories: [] };
const combined = [];

await fs.mkdir('data/catalog', { recursive: true });
for (const [category, config] of Object.entries(CATALOGS)) {
  const data = await collect(category, config);
  await fs.writeFile(`data/catalog/${category}.json`, JSON.stringify(data, null, 2) + '\n');
  await fs.writeFile(`js/${category}-product-index-v5.1.js`, `export const ${category.toUpperCase().replace(/-/g, '_')}_PRODUCTS = ${JSON.stringify(data.products, null, 2)};\n`);
  registry.categories.push({ id: category, name: config.name, file: `data/catalog/${category}.json`, count: data.count, sources: config.sources.map(s => s.id) });
  combined.push(...data.products);
  console.log(`${category}: ${data.products.length}`);
}

await fs.writeFile('data/category-registry-v5.1.json', JSON.stringify(registry, null, 2) + '\n');
await fs.writeFile('js/product-index-generated-v5.1.js', `// Generated by catalog-ingest-v5.1.mjs\nexport const PRODUCT_INDEX = ${JSON.stringify(combined, null, 2)};\nexport const INDEX_META = ${JSON.stringify({ generatedAt: new Date().toISOString(), total: combined.length, categories: registry.categories }, null, 2)};\n`);
console.log(`TOTAL: ${combined.length}`);
