const normalize = s => String(s ?? '').replace(/\s+/g, ' ').trim();
const digits = s => String(s ?? '').replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
const money = s => { const raw = digits(normalize(s)).replace(/[٬,\s]/g, ''); const m = raw.match(/\d+(?:\.\d+)?/); return m ? Number(m[0]) : 0; };
const extractPrice = text => {
  const source = normalize(text);
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
};
const extractAvailability = text => {
  const t = normalize(text);
  if (/ناموجود|در انبار موجود نمی باشد|تمام شده|out\s*of\s*stock|unavailable|اتمام موجودی/i.test(t)) return 'out_of_stock';
  if (/افزودن به سبد|موجود در انبار|موجود است|in\s*stock/i.test(t)) return 'in_stock';
  return 'unknown';
};

const fixture = '<a href="https://torobshop.com/products/galaxy-s26-ultra">گوشی موبایل سامسونگ Galaxy S26 Ultra</a><span>گوشی موبایل</span><span><s>328,383,000 تومان</s> 295,286,000 تومان</span><button>افزودن به سبد</button>';
const price = extractPrice(fixture);
const availability = extractAvailability(fixture);

if (price.price !== 295286000 || price.currency !== 'IRT') throw new Error(`price extraction failed: ${JSON.stringify(price)}`);
if (availability !== 'in_stock') throw new Error(`availability extraction failed: ${availability}`);

console.log(JSON.stringify({ ok: true, price, availability }));
