import fs from 'node:fs/promises';

const mobile = JSON.parse(await fs.readFile('data/catalog/mobile.json', 'utf8'));
const products = mobile.products || [];
const priced = products.filter(p => Number(p.price) > 0);
const stocked = products.filter(p => ['in_stock', 'out_of_stock'].includes(p.availability));
const samsung = products.filter(p => p.brand === 'سامسونگ');
const samsungPriced = samsung.filter(p => Number(p.price) > 0 && p.currency === 'IRT');
const failures = [];
if (!priced.length) failures.push('mobile catalog has no priced products');
if (!stocked.length) failures.push('mobile catalog has no resolved availability');
if (!samsung.length) failures.push('mobile catalog has no Samsung products');
if (!samsungPriced.length) failures.push('Samsung products have no resolved toman price');

const summary = {
  ok: failures.length === 0,
  total: products.length,
  priced: priced.length,
  availabilityResolved: stocked.length,
  samsung: samsung.length,
  samsungPriced: samsungPriced.length,
  sample: samsungPriced.slice(0, 5).map(p => ({ name: p.name, price: p.price, currency: p.currency, availability: p.availability, productUrl: p.productUrl })) ,
  failures
};
console.log(JSON.stringify(summary, null, 2));
if (failures.length) process.exitCode = 1;
