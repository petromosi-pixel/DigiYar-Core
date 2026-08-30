// V5 Smart Search — direct browser search

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
    const response = await fetch(
      `https://api.digikala.com/v1/search/?q=${encodeURIComponent(query)}&page=1&size=10`,
      { headers: { Accept: 'application/json' } }
    );

    if (!response.ok) {
      console.error('Digikala API error:', response.status);
      return [];
    }

    const data = await response.json();
    const products = data?.data?.products;
    if (!Array.isArray(products)) return [];

    return products.slice(0, 3).map(normalizeProduct);
  } catch (error) {
    console.error('Direct Digikala search error:', error);
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
  const config = affiliateConfig[product.store];
  if (!config) return product.url || '#';
  return `${config.affiliateLink}?p=${product.url}`;
}

function displayResults(products, query) {
  const resultsDiv = document.getElementById('searchResults');
  if (!products.length) return showNoResults(query);

  resultsDiv.innerHTML = `
    <h2>نتایج جستجو برای "${escapeHtml(query)}"</h2>
    <p class="results-meta">🔄 نتایج زنده - ${new Date().toLocaleTimeString('fa-IR')}</p>
    <div class="results-grid">
      ${products.map((product, index) => {
        const config = affiliateConfig[product.store] || {
          name: product.storeName || 'فروشگاه',
          logo: '🏪',
          color: '#667eea'
        };
        const image = product.image || getBrandImage(product.title);
        const affiliateLink = createAffiliateLink(product);

        return `
          <article class="product-card">
            <div class="product-badge">${index + 1}</div>
            <div class="product-image-container">
              ${image ? `<img src="${escapeAttr(image)}" alt="${escapeAttr(product.title)}" class="product-image" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">` : ''}
              <div class="no-image" style="display:${image ? 'none' : 'flex'}">${getCategoryEmoji(product.title)}</div>
            </div>
            <div class="product-info">
              <h3>${escapeHtml(product.title)}</h3>
              <div class="price-section">
                ${product.originalPrice > product.price ? `<span class="original-price">${formatPrice(product.originalPrice)}</span>` : ''}
                <p class="product-price">${formatPrice(product.price)}</p>
              </div>
              <div class="availability">${product.available ? '✅ موجود است' : '❌ ناموجود'}</div>
              ${product.rating ? `<div class="product-rating">⭐ ${product.rating} (${product.reviews} نظر)</div>` : ''}
              <div class="store-info" style="color:${config.color}">${config.logo} ${config.name}</div>
              <a href="${escapeAttr(affiliateLink)}" target="_blank" rel="noopener noreferrer" class="buy-button" style="background:${config.color}">🛒 مشاهده و خرید</a>
            </div>
          </article>
        `;
      }).join('')}
    </div>
  `;

  resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function getBrandImage(title) {
  const t = title.toLowerCase();
  if (t.includes('سامسونگ') || t.includes('samsung')) return 'https://dkstatics-public.digikala.com/digikala-brands/3960.jpg?x-oss-process=image/resize,m_lfit,h_160,w_160/quality,q_80';
  if (t.includes('اپل') || t.includes('apple') || t.includes('آیفون') || t.includes('iphone')) return 'https://dkstatics-public.digikala.com/digikala-brands/eca9a45791656682d1414563ee8b2b88101b6f1e_1680613335.jpg?x-oss-process=image/resize,m_lfit,h_160,w_160/quality,q_80';
  if (t.includes('شیائومی') || t.includes('xiaomi') || t.includes('redmi')) return 'https://dkstatics-public.digikala.com/digikala-brands/2994.png?x-oss-process=image/resize,m_lfit,h_160,w_160/quality,q_80';
  if (t.includes('asus') || t.includes('ایسوس')) return 'https://dkstatics-public.digikala.com/digikala-brands/100014979.jpg?x-oss-process=image/resize,m_lfit,h_160,w_160/quality,q_80';
  return '';
}

function formatPrice(price) {
  if (!price || price === 0) return 'نامشخص';
  return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
}

function showLoading() {
  document.getElementById('searchResults').innerHTML = '<div class="loading"><div class="spinner"></div><p>در حال جستجوی زنده...</p></div>';
}

function showError() {
  document.getElementById('searchResults').innerHTML = '<div class="error"><p>⚠️ خطا در ارتباط با API</p><p>لطفاً دوباره تلاش کنید</p></div>';
}

function showNoResults(query) {
  document.getElementById('searchResults').innerHTML = `<div class="no-results"><p>😔 نتیجه‌ای برای "${escapeHtml(query)}" یافت نشد</p><p>عبارت دیگری را امتحان کنید</p></div>`;
}

function handleSearchInput(query) {
  clearTimeout(searchTimeout);
  if (query.trim().length >= 3) searchTimeout = setTimeout(() => searchProducts(query.trim()), 500);
}

function handleSearchKey(event) {
  if (event.key === 'Enter') performSmartSearch();
}

function performSmartSearch() {
  const query = document.getElementById('smartSearchInput').value.trim();
  if (!query) {
    alert('لطفاً نام محصول را وارد کنید');
    return;
  }
  searchProducts(query);
}

function quickSearch(term) {
  document.getElementById('smartSearchInput').value = term;
  performSmartSearch();
}

function getCategoryEmoji(title) {
  const t = title.toLowerCase();
  if (/گوشی|موبایل|galaxy|iphone/.test(t)) return '📱';
  if (/لپ تاپ|لپتاپ|laptop|macbook/.test(t)) return '💻';
  if (/هدفون|هندزفری|ایرپاد|buds|headphone/.test(t)) return '🎧';
  if (/ساعت|watch/.test(t)) return '⌚';
  if (/تبلت|tablet|ipad/.test(t)) return '📱';
  if (/کنسول|پلی استیشن|ایکس باکس|playstation|xbox/.test(t)) return '🎮';
  return '🛍️';
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value);
}
