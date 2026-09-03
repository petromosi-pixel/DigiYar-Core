/* DigiYar V5.1 — Live Product Price / Availability Resolver */
const ALLOWED_HOSTS = new Set(['torobshop.com', 'www.torobshop.com', 'digikala.com', 'www.digikala.com', 'snappshop.ir', 'www.snappshop.ir']);

const digits = value => String(value ?? '')
  .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
  .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

const clean = value => digits(String(value ?? ''))
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&#x27;/gi, "'")
  .replace(/\s+/g, ' ')
  .trim();

function absolute(base, value) {
  try { return new URL(value, base).href; } catch { return ''; }
}

function normalizeCurrency(value) {
  const c = clean(value).toLowerCase();
  if (/^irt$|تومان|تومن/.test(c)) return 'IRT';
  if (/^irr$|ریال/.test(c)) return 'IRR';
  return '';
}

function toToman(value, currency) {
  const n = Number(digits(String(value ?? '')).replace(/[٬,\s]/g, ''));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return normalizeCurrency(currency) === 'IRR' ? Math.round(n / 10) : Math.round(n);
}

function availabilityFrom(value) {
  const a = clean(value).toLowerCase();
  if (!a) return 'unknown';
  if (/outofstock|out-of-stock|out of stock|unavailable|ناموجود|تمام شده|اتمام موجودی|در انبار موجود نمی باشد/.test(a)) return 'out_of_stock';
  if (/instock|in-stock|in stock|موجود|افزودن به سبد/.test(a)) return 'in_stock';
  return 'unknown';
}

function parseJsonLd(html) {
  const out = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    try { out.push(JSON.parse(m[1])); } catch {}
  }
  return out;
}

function walkJsonLd(value, out) {
  if (!value) return;
  if (Array.isArray(value)) { value.forEach(v => walkJsonLd(v, out)); return; }
  if (typeof value !== 'object') return;
  const type = Array.isArray(value['@type']) ? value['@type'].join(' ') : String(value['@type'] || '');
  if (/product/i.test(type)) out.push(value);
  if (value['@graph']) walkJsonLd(value['@graph'], out);
  for (const [key, child] of Object.entries(value)) {
    if (key !== '@graph' && child && typeof child === 'object') walkJsonLd(child, out);
  }
}

function fromJsonLd(html, pageUrl) {
  const products = [];
  parseJsonLd(html).forEach(x => walkJsonLd(x, products));
  for (const p of products) {
    const offers = Array.isArray(p.offers) ? p.offers : [p.offers || {}];
    const validOffers = offers.filter(Boolean).map(o => ({
      price: Number(digits(String(o.price ?? o.lowPrice ?? '')).replace(/[٬,\s]/g, '')) || 0,
      currency: normalizeCurrency(o.priceCurrency || p.priceCurrency || ''),
      availability: availabilityFrom(o.availability),
      url: absolute(pageUrl, o.url || p.url || pageUrl)
    })).filter(o => o.price > 0);
    if (validOffers.length) {
      const selected = validOffers[0];
      return {
        name: clean(p.name || ''),
        productUrl: absolute(pageUrl, p.url || pageUrl),
        price: selected.price,
        priceToman: toToman(selected.price, selected.currency),
        currency: selected.currency || 'IRT',
        availability: selected.availability,
        extraction: 'json-ld Product.offers'
      };
    }
  }
  return null;
}

function fromMeta(html, pageUrl) {
  const meta = (name, attr = 'property') => {
    const re = new RegExp(`<meta[^>]+${attr}=["']${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*content=["']([^"']+)["'][^>]*>`, 'i');
    const m = html.match(re);
    return m ? clean(m[1]) : '';
  };
  const price = meta('product:price:amount') || meta('price', 'itemprop');
  const currency = normalizeCurrency(meta('product:price:currency')) || normalizeCurrency(meta('priceCurrency', 'itemprop'));
  const availability = availabilityFrom(meta('product:availability', 'itemprop') || meta('availability', 'itemprop'));
  if (!price) return null;
  const n = Number(price.replace(/[٬,\s]/g, '')) || 0;
  return n > 0 ? { name: meta('og:title'), productUrl: pageUrl, price: n, priceToman: toToman(n, currency || 'IRT'), currency: currency || 'IRT', availability, extraction: 'meta product price' } : null;
}

function fromVisibleText(html, pageUrl) {
  const text = clean(html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '));
  const matches = [];
  const re = /([\d۰-۹][\d۰-۹٬,\s]{2,})\s*(تومان|تومن|ریال|IRT|IRR)(?=\s|$)/gi;
  let m;
  while ((m = re.exec(text))) {
    const n = Number(digits(m[1]).replace(/[٬,\s]/g, '')) || 0;
    if (n > 0) matches.push({ price: n, currency: normalizeCurrency(m[2]) });
  }
  if (!matches.length) return null;
  const selected = matches.find(x => x.currency === 'IRT') || matches[0];
  return { name: '', productUrl: pageUrl, price: selected.price, priceToman: toToman(selected.price, selected.currency), currency: selected.currency, availability: availabilityFrom(text), extraction: 'visible price text' };
}

export async function resolveProduct(url) {
  let parsed;
  try { parsed = new URL(url); } catch { throw new Error('Invalid product URL'); }
  if (parsed.protocol !== 'https:' || !ALLOWED_HOSTS.has(parsed.hostname.toLowerCase())) throw new Error('Unsupported product host');
  const response = await fetch(parsed.href, { redirect: 'follow', headers: { Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'fa-IR,fa;q=0.9,en;q=0.8', 'User-Agent': 'Mozilla/5.0 (compatible; DigiYar-V5.1-Resolver/1.0)' } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();
  const result = fromJsonLd(html, parsed.href) || fromMeta(html, parsed.href) || fromVisibleText(html, parsed.href);
  if (!result) return { success: true, resolved: false, productUrl: parsed.href, price: 0, priceToman: 0, currency: '', availability: 'unknown', extraction: 'none' };
  return { success: true, resolved: result.priceToman > 0, ...result };
}
