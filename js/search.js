// V5 Smart Search
const API_URL = 'https://digiyar-v5.petromosi.workers.dev/api/search';

const affiliateConfig = {
  digikala: { name: 'دیجی‌کالا', affiliateLink: 'https://aflo.ir/TrvNHEN8', logo: '🛒', color: '#ef4056' }
};

let searchTimeout;
let isSearching = false;

async function searchProducts(query) {
  if (isSearching) return;
  isSearching = true;
  showLoading();
  try {
    let results = await searchFromWorker(query);
    if (!results.length) results = await searchDirectFromDigikala(query);
    if (!results.length) results = searchLocalDatabase(query);
    displayResults(results, query);
  } catch (error) {
    console.error('Search error:', error);
    showError();
  } finally {
    isSearching = false;
  }
}

async function searchFromWorker(query) {
  try {
    const response = await fetch(`${API_URL}?q=${encodeURIComponent(query)}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.success && Array.isArray(data.results) ? data.results : [];
  } catch (error) { return []; }
}

async function searchDirectFromDigikala(query) {
  try {
    const response = await fetch(`https://api.digikala.com/v1/search/?q=${encodeURIComponent(query)}&page=1&size=10`, {
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) return [];
    const data = await response.json();
    const products = data?.data?.products;
    if (!Array.isArray(products)) return [];
    return products.slice(0, 3).map(normalizeProduct);
  } catch (error) {
    console.error('Direct search error:', error);
    return [];
  }
}

function normalizeProduct(p) {
  const price = p.default_variant?.price?.selling_price || 0;
  return {
    id: p.id,
    title: p.title_fa || p.title_en || 'بدون عنوان',
    price,
    originalPrice: p.default_variant?.price?.rrp_price || price,
    image: p.images?.main?.url?.[0] || '',
    url: `https://www.digikala.com/product/dkp-${p.id}`,
    available: price > 0,
    rating: p.rating?.rate || 0,
    reviews: p.rating?.count || 0,
    store: 'digikala',
    storeName: 'دیجیکالا'
  };
}

function searchLocalDatabase(query) {
  const q = query.toLowerCase().trim();
  const items = [
    ['گوشی', 'گوشی سامسونگ Galaxy S25 Ultra', 85000000, 'galaxy s25 ultra'],
    ['گوشی', 'گوشی سامسونگ Galaxy S24 FE', 45000000, 'galaxy s24 fe'],
    ['گوشی', 'گوشی سامسونگ Galaxy A56', 30000000, 'galaxy a56'],
    ['لپ تاپ', 'لپ تاپ ایسوس ROG Strix G16', 85000000, 'asus rog strix g16'],
    ['هدفون', 'هدفون سونی WH-1000XM5', 30000000, 'sony wh-1000xm5'],
    ['ساعت', 'اپل واچ سری ۱۰', 40000000, 'apple watch series 10']
  ];
  return items.filter(x => q.includes(x[0]) || x[0].includes(q)).map(x => ({
    id: `local-${x[3]}`, title: x[1], price: x[2], originalPrice: x[2], image: '',
    url: `https://www.digikala.com/search/?q=${encodeURIComponent(x[3])}`,
    available: true, rating: 0, reviews: 0, store: 'digikala', storeName: 'دیجیکالا'
  }));
}

function createAffiliateLink(product) {
  const config = affiliateConfig[product.store];
  if (!config) return product.url || '#';
  // Aflo expects the destination URL as the raw redirect_to/p value.
  return `${config.affiliateLink}?p=${product.url}`;
}

function displayResults(products, query) {
  const resultsDiv = document.getElementById('searchResults');
  if (!products.length) return showNoResults(query);
  resultsDiv.innerHTML = `<h2>نتایج جستجو برای "${escapeHtml(query)}"</h2><p class="results-meta">🔄 نتایج زنده - ${new Date().toLocaleTimeString('fa-IR')}</p><div class="results-grid">${products.map((p, i) => {
    const config = affiliateConfig[p.store] || { name: p.storeName || 'فروشگاه', logo: '🏪', color: '#667eea' };
    const image = p.image || getBrandImage(p.title);
    return `<article class="product-card"><div class="product-badge">${i + 1}</div><div class="product-image-container">${image ? `<img src="${escapeAttr(image)}" alt="${escapeAttr(p.title)}" class="product-image" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">` : ''}<div class="no-image" style="display:${image ? 'none' : 'flex'}">${getCategoryEmoji(p.title)}</div></div><div class="product-info"><h3>${escapeHtml(p.title)}</h3><p class="product-price">${formatPrice(p.price)}</p><div class="availability">${p.available ? '✅ موجود است' : '❌ ناموجود'}</div>${p.rating ? `<div class="product-rating">⭐ ${p.rating} (${p.reviews} نظر)</div>` : ''}<div class="store-info" style="color:${config.color}">${config.logo} ${config.name}</div><a href="${escapeAttr(createAffiliateLink(p))}" target="_blank" rel="noopener noreferrer" class="buy-button" style="background:${config.color}">🛒 مشاهده و خرید</a></div></article>`;
  }).join('')}</div>`;
}

function getBrandImage(title) {
  const t = title.toLowerCase();
  if (t.includes('سامسونگ') || t.includes('samsung')) return 'https://dkstatics-public.digikala.com/digikala-brands/3960.jpg?x-oss-process=image/resize,m_lfit,h_160,w_160/quality,q_80';
  if (t.includes('اپل') || t.includes('apple') || t.includes('آیفون') || t.includes('iphone')) return 'https://dkstatics-public.digikala.com/digikala-brands/eca9a45791656682d1414563ee8b2b88101b6f1e_1680613335.jpg?x-oss-process=image/resize,m_lfit,h_160,w_160/quality,q_80';
  if (t.includes('شیائومی') || t.includes('xiaomi') || t.includes('redmi')) return 'https://dkstatics-public.digikala.com/digikala-brands/2994.png?x-oss-process=image/resize,m_lfit,h_160,w_160/quality,q_80';
  if (t.includes('asus') || t.includes('ایسوس')) return 'https://dkstatics-public.digikala.com/digikala-brands/100014979.jpg?x-oss-process=image/resize,m_lfit,h_160,w_160/quality,q_80';
  return '';
}

function formatPrice(price) { return price ? new Intl.NumberFormat('fa-IR').format(price) + ' تومان' : 'نامشخص'; }
function showLoading() { document.getElementById('searchResults').innerHTML = '<div class="loading"><div class="spinner"></div><p>در حال جستجوی زنده...</p></div>'; }
function showError() { document.getElementById('searchResults').innerHTML = '<div class="error"><p>⚠️ خطا در ارتباط با سرور</p><p>لطفاً دوباره تلاش کنید</p></div>'; }
function showNoResults(q) { document.getElementById('searchResults').innerHTML = `<div class="no-results"><p>😔 نتیجه‌ای برای "${escapeHtml(q)}" یافت نشد</p><p>عبارت دیگری را امتحان کنید</p></div>`; }
function handleSearchInput(q) { clearTimeout(searchTimeout); if (q.trim().length >= 3) searchTimeout = setTimeout(() => searchProducts(q.trim()), 500); }
function handleSearchKey(e) { if (e.key === 'Enter') performSmartSearch(); }
function performSmartSearch() { const q = document.getElementById('smartSearchInput').value.trim(); if (q) searchProducts(q); else alert('لطفاً نام محصول را وارد کنید'); }
function quickSearch(term) { document.getElementById('smartSearchInput').value = term; performSmartSearch(); }
function getCategoryEmoji(t) { t=t.toLowerCase(); if (/گوشی|موبایل|galaxy|iphone/.test(t)) return '📱'; if (/لپ تاپ|لپتاپ|laptop|macbook/.test(t)) return '💻'; if (/هدفون|هندزفری|ایرپاد|buds|headphone/.test(t)) return '🎧'; if (/ساعت|watch/.test(t)) return '⌚'; if (/تبلت|tablet|ipad/.test(t)) return '📱'; return '🛍️'; }
function escapeHtml(v) { return String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function escapeAttr(v) { return escapeHtml(v); }
