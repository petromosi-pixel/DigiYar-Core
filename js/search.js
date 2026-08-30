// V5 Smart Search — Vercel proxy

const affiliateConfig = {
  digikala: {
    name: 'دیجی‌کالا',
    affiliateLink: 'https://aflo.ir/TrvNHEN8',
    logo: '🛒',
    color: '#ef4056'
  }
};

let searchTimeout;
let isSearching = false;

async function searchProducts(query) {
  if (isSearching) return;
  isSearching = true;
  showLoading();
  try {
    const results = await searchDigikalaDirect(query);
    if (results.length > 0) displayResults(results, query);
    else showNoResults(query);
  } catch (error) {
    console.error('Search error:', error);
    showError();
  } finally {
    isSearching = false;
  }
}

async function searchDigikalaDirect(query) {
  try {
    const response = await fetch(`/api/proxy?q=${encodeURIComponent(query)}`);
    if (!response.ok) return [];
    const data = await response.json();
    if (!data.data || !Array.isArray(data.data.products)) return [];
    return data.data.products.slice(0, 3).map(normalizeProduct);
  } catch (error) {
    console.error('Proxy search error:', error);
    return [];
  }
}

function normalizeProduct(p) {
  const priceData = p.default_variant?.price || {};
  const price = priceData.selling_price || 0;
  return {
    id: p.id,
    title: p.title_fa || p.title_en || 'بدون عنوان',
    price,
    originalPrice: priceData.rrp_price || price,
    image: p.images?.main?.url?.[0] || '',
    url: `https://www.digikala.com/product/dkp-${p.id}`,
    available: price > 0,
    rating: p.rating?.rate || 0,
    reviews: p.rating?.count || 0,
    store: 'digikala',
    storeName: 'دیجی‌کالا'
  };
}

function createAffiliateLink(product) {
  return `${affiliateConfig.digikala.affiliateLink}?p=${encodeURIComponent(product.url)}`;
}

function displayResults(products, query) {
  const resultsDiv = document.getElementById('searchResults');
  resultsDiv.innerHTML = `<h2>نتایج جستجو برای "${escapeHtml(query)}"</h2><p class="update-time">🔄 نتایج زنده - ${new Date().toLocaleTimeString('fa-IR')}</p><div class="results-grid">${products.map((product, index) => {
    const affiliateLink = createAffiliateLink(product);
    return `<div class="product-card"><div class="product-badge">${index + 1}</div><div class="product-image-container">${product.image ? `<img src="${escapeAttr(product.image)}" alt="${escapeAttr(product.title)}" class="product-image" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">` : ''}<div class="no-image" style="display:${product.image ? 'none' : 'flex'}">${getCategoryEmoji(product.title)}</div></div><div class="product-info"><h3>${escapeHtml(product.title)}</h3><div class="price-section">${product.originalPrice > product.price ? `<span class="original-price">${formatPrice(product.originalPrice)}</span>` : ''}<p class="product-price">${formatPrice(product.price)}</p></div><div class="availability">${product.available ? '<span class="in-stock">✅ موجود است</span>' : '<span class="out-of-stock">❌ ناموجود</span>'}</div>${product.rating ? `<div class="product-rating">⭐ ${product.rating} (${product.reviews} نظر)</div>` : ''}<div class="store-info" style="color:#ef4056">🛒 دیجی‌کالا</div><a href="${escapeAttr(affiliateLink)}" target="_blank" rel="noopener noreferrer" class="buy-button" style="background:#ef4056">🛒 مشاهده و خرید</a></div></div>`;
  }).join('')}</div>`;
  resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function formatPrice(price) {
  if (!price || price === 0) return 'نامشخص';
  return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
}

function showLoading() { document.getElementById('searchResults').innerHTML = '<div class="loading"><div class="spinner"></div><p>در حال جستجوی زنده...</p></div>'; }
function showError() { document.getElementById('searchResults').innerHTML = '<div class="error"><p>⚠️ خطا در ارتباط با سرور جستجو</p><p>لطفاً دوباره تلاش کنید</p></div>'; }
function showNoResults(query) { document.getElementById('searchResults').innerHTML = `<div class="no-results"><p>😔 نتیجه‌ای برای "${escapeHtml(query)}" یافت نشد</p><p>عبارت دیگری را امتحان کنید</p></div>`; }
function handleSearchInput(query) { clearTimeout(searchTimeout); if (query.trim().length >= 3) searchTimeout = setTimeout(() => searchProducts(query.trim()), 500); }
function handleSearchKey(event) { if (event.key === 'Enter') performSmartSearch(); }
function performSmartSearch() { const input = document.getElementById('smartSearchInput'); const query = input ? input.value.trim() : ''; if (!query) return alert('لطفاً نام محصول را وارد کنید'); searchProducts(query); }
function quickSearch(term) { document.getElementById('smartSearchInput').value = term; performSmartSearch(); }
function getCategoryEmoji(title) { const t = title.toLowerCase(); if (/گوشی|موبایل|galaxy|iphone/.test(t)) return '📱'; if (/لپ تاپ|لپتاپ|laptop|macbook/.test(t)) return '💻'; if (/هدفون|هندزفری|ایرپاد|buds|headphone/.test(t)) return '🎧'; if (/ساعت|watch/.test(t)) return '⌚'; if (/تبلت|tablet|ipad/.test(t)) return '📱'; if (/کنسول|پلی استیشن|ایکس باکس|playstation|xbox/.test(t)) return '🎮'; return '🛍️'; }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
function escapeAttr(value) { return escapeHtml(value); }
