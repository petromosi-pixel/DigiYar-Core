import fs from 'node:fs/promises';

const MAX_PAGES_PER_SUBCATEGORY = 3;
const CONCURRENCY = 4;
const UA = 'DigiYar-TorobShop-Resolver/5.1 (+https://petromosi-pixel.github.io/DigiYar-Core/)';

const registry = JSON.parse(await fs.readFile('data/subcategory-registry-v5.1.json', 'utf8'));
const norm = s => decodeEntities(String(s ?? '')).replace(/\s+/g, ' ').trim();
const digits = s => String(s ?? '').replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
const money = s => { const raw = digits(norm(s)).replace(/[٬,\s]/g, ''); const m = raw.match(/\d+(?:\.\d+)?/); return m ? Number(m[0]) : 0; };
const abs = (base, u) => { try { return new URL(u, base).href; } catch { return ''; } };
function decodeEntities(s) { return String(s ?? '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&nbsp;/g, ' '); }
function stripHtml(s) { return norm(String(s ?? '').replace(/<[^>]+>/g, ' ')); }

async function get(url) {
  const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,application/json', 'accept-language': 'fa-IR,fa;q=0.9,en;q=0.7' } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
}

function extractPrice(text) {
  const source = norm(text);
  const values = [];
  const re = /([۰-۹٠-٩\d][۰-۹٠-٩\d٬,\.\s]{2,})\s*(تومان|تومن|ریال|IRR|IRT)(?=\s|$|<)/gi;
  let m;
  while ((m = re.exec(source))) {
    const value = money(m[1]);
    if (value > 0) values.push({ value, unit: m[2].toLowerCase() });
  }
  if (!values.length) return { price: 0, currency: '' };
  const toman = values.filter(x => /تومان|تومن|irt/i.test(x.unit));
  const pool = toman.length ? toman : values;
  return { price: Math.min(...pool.map(x => x.value)), currency: toman.length ? 'IRT' : (/irr/i.test(pool[0].unit) ? 'IRR' : '') };
}

function extractAvailability(text) {
  const t = norm(text);
  if (/ناموجود|در انبار موجود نمی باشد|تمام شده|out\s*of\s*stock|unavailable|اتمام موجودی/i.test(t)) return 'out_of_stock';
  if (/افزودن به سبد|موجود در انبار|موجود است|in\s*stock/i.test(t)) return 'in_stock';
  return 'unknown';
}

function anchors(html, base) {
  const out = [];
  const re = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html))) {
    const url = abs(base, m[1]);
    if (!url) continue;
    let u; try { u = new URL(url); } catch { continue; }
    if (u.hostname !== 'torobshop.com' || !/^\/products\//i.test(u.pathname) || /\/category-products\//i.test(u.pathname)) continue;
    const name = stripHtml(m[2]);
    if (name.length < 4) continue;
    const near = html.slice(m.index, Math.min(html.length, m.index + 2200));
    const visible = stripHtml(near);
    const extracted = extractPrice(visible);
    out.push({ url, name, price: extracted.price, currency: extracted.currency, availability: extractAvailability(visible) });
  }
  return out;
}

function mergeRecords(records, extracted) {
  const byUrl = new Map(extracted.map(x => [x.url, x]));
  let repaired = 0;
  let priced = 0;
  let stocked = 0;
  for (const p of records) {
    if (!/^https?:\/\/torobshop\.com\/products\//i.test(String(p.productUrl || ''))) continue;
    const x = byUrl.get(p.productUrl);
    if (!x) continue;
    if ((!Number(p.price) || Number(p.price) <= 0) && x.price > 0) { p.price = x.price; p.currency = x.currency || p.currency || 'IRT'; repaired++; priced++; }
    if ((!p.availability || p.availability === 'unknown') && x.availability !== 'unknown') { p.availability = x.availability; repaired++; stocked++; }
    if (x.currency === 'IRT' && Number(p.price) > 0 && (!p.currency || p.currency === 'IRR')) p.currency = 'IRT';
  }
  return { repaired, priced, stocked };
}

async function runCategory(category, cfg, catalog) {
  const urls = [];
  for (const subcategory of cfg.subcategories) {
    for (let page = 1; page <= MAX_PAGES_PER_SUBCATEGORY; page++) {
      urls.push({ subcategory, url: `https://torobshop.com/products/category-products/${encodeURIComponent(String(subcategory).replace(/\u200c/g, ' ').replace(/\s+/g, '-'))}${page > 1 ? `?page=${page}` : ''}` });
    }
  }
  const all = [];
  let errors = 0;
  let cursor = 0;
  async function worker() {
    while (cursor < urls.length) {
      const item = urls[cursor++];
      try { all.push(...anchors(await get(item.url), item.url)); }
      catch { errors++; }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  const unique = [...new Map(all.map(x => [x.url, x])).values()];
  const result = mergeRecords(catalog.products || [], unique);
  return { category, pages: urls.length, extractedProducts: unique.length, errors, ...result };
}

const report = [];
for (const [category, cfg] of Object.entries(registry.categories)) {
  const path = `data/catalog/${category}.json`;
  let catalog;
  try { catalog = JSON.parse(await fs.readFile(path, 'utf8')); } catch { continue; }
  const result = await runCategory(category, cfg, catalog);
  await fs.writeFile(path, JSON.stringify(catalog, null, 2) + '\n');
  const indexPath = `js/${category}-product-index-v5.1.js`;
  const exportName = category.toUpperCase().replace(/-/g, '_') + '_PRODUCTS';
  await fs.writeFile(indexPath, `export const ${exportName} = ${JSON.stringify(catalog.products || [], null, 2)};\n`);
  report.push(result);
  console.log(JSON.stringify(result));
}

const index = report.reduce((a, x) => ({ pages: a.pages + x.pages, extractedProducts: a.extractedProducts + x.extractedProducts, errors: a.errors + x.errors, repaired: a.repaired + x.repaired, priced: a.priced + x.priced, stocked: a.stocked + x.stocked }), { pages: 0, extractedProducts: 0, errors: 0, repaired: 0, priced: 0, stocked: 0 });
console.log(JSON.stringify({ ok: index.priced > 0, ...index }, null, 2));
if (!index.priced) process.exitCode = 1;
