// DigiYar V5.1 — Canonical Price Contract
// One internal unit: Toman. Source amount/currency are preserved separately.
export const PRICE_CONTRACT_VERSION = '5.1.0';
export const CANONICAL_CURRENCY = 'TOMAN';

export function normalizeCurrency(value = '') {
  const c = String(value || '').trim().toUpperCase();
  if (c === 'IRR' || c === 'RIAL' || /ریال|ريال/.test(c)) return 'IRR';
  if (c === 'IRT' || c === 'TOMAN' || /تومان|تومن/.test(c)) return 'IRT';
  return c || 'IRT';
}

export function toToman(value, currency = 'IRT') {
  const n = Number(String(value ?? '').replace(/[٬,\s]/g, ''));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return normalizeCurrency(currency) === 'IRR' ? Math.round(n / 10) : Math.round(n);
}

export function normalizePrice(value, currency = 'IRT') {
  const sourceCurrency = normalizeCurrency(currency);
  const sourcePrice = Number(value) || 0;
  return { price: sourcePrice, currency: sourceCurrency, priceToman: toToman(sourcePrice, sourceCurrency) };
}

export function normalizeBudget(minPrice, maxPrice) {
  return {
    minPrice: minPrice == null ? null : Number(minPrice),
    maxPrice: maxPrice == null ? null : Number(maxPrice),
    currency: CANONICAL_CURRENCY
  };
}
