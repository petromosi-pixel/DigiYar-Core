// js/search.js
const API_URL = 'https://digi-yar-core.vercel.app/api/search';

// تنظیمات افیلیت
const affiliateConfig = {
    digikala: {
        name: "دیجی‌کالا",
        affiliateLink: "https://aflo.ir/TrvNHEN8",
        logo: "🛒",
        color: "#ef4056"
    },
    snappshop: {
        name: "اسنپ‌شاپ",
        affiliateLink: "https://aflo.ir/1COBTqeMV",
        logo: "🛍️",
        color: "#00d170"
    }
};

let searchTimeout;
let isSearching = false;

async function searchProducts(query) {
    if (isSearching) return;
    isSearching = true;
    showLoading();
    try {
        const response = await fetch(`${API_URL}?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        if (data.success && data.results.length > 0) displayResults(data.results, query);
        else showNoResults(query);
    } catch (error) {
        console.error('Search error:', error);
        showError();
    } finally { isSearching = false; }
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));
}

// نمایش نتایج
function displayResults(products, query) {
    const resultsDiv = document.getElementById('searchResults');
    resultsDiv.innerHTML = `
        <h2 style="margin-bottom: 10px; color: #333;">نتایج جستجو برای "${escapeHtml(query)}"</h2>
        <p style="color: #666; font-size: 13px; margin-bottom: 20px;">🔄 نتایج زنده - ${new Date().toLocaleTimeString('fa-IR')}</p>
        <div class="results-grid">
            ${products.map((product, index) => {
                const affiliateLink = createAffiliateLink(product);
                const storeConfig = affiliateConfig[product.store] || { name: product.storeName, logo: "🏪", color: "#667eea" };
                return `
                    <div class="product-card">
                        <div class="product-badge">${index + 1}</div>
                        <div class="product-image-container">
                            ${product.image ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}" class="product-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : ''}
                            <div class="no-image" style="${product.image ? 'display:none;' : 'display:flex;'}">${getCategoryEmoji(product.title)}</div>
                        </div>
                        <div class="product-info">
                            <h3>${escapeHtml(product.title)}</h3>
                            <div class="price-section"><p class="product-price">${formatPrice(product.price)}</p></div>
                            <div class="availability"><span class="in-stock">✅ موجود است</span></div>
                            ${product.rating ? `<div class="product-rating">⭐ ${Number(product.rating).toFixed(1)} ${product.reviews ? `(${product.reviews} نظر)` : ''}</div>` : ''}
                            <div class="store-info" style="color: ${storeConfig.color}">${storeConfig.logo} ${escapeHtml(storeConfig.name)}</div>
                            <a href="${escapeHtml(affiliateLink)}" target="_blank" rel="noopener noreferrer" class="buy-button" style="background: ${storeConfig.color}">🛒 مشاهده و خرید</a>
                        </div>
                    </div>`;
            }).join('')}
        </div>`;
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ساخت لینک افیلیت با ساختار صحیح Aflo
function createAffiliateLink(product) {
    const storeConfig = affiliateConfig[product.store];
    if (!storeConfig) return product.url || '#';
    return `${storeConfig.affiliateLink}?p=${encodeURIComponent(product.url)}`;
}

// تشخیص ایموجی بر اساس عنوان
function getCategoryEmoji(title) {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('گوشی') || titleLower.includes('موبایل') || titleLower.includes('galaxy') || titleLower.includes('iphone')) return '📱';
    if (titleLower.includes('لپ تاپ') || titleLower.includes('لپتاپ') || titleLower.includes('laptop') || titleLower.includes('macbook')) return '💻';
    if (titleLower.includes('هدفون') || titleLower.includes('هندزفری') || titleLower.includes('ایرپاد') || titleLower.includes('buds') || titleLower.includes('headphone')) return '🎧';
    if (titleLower.includes('ساعت') || titleLower.includes('watch')) return '⌚';
    if (titleLower.includes('تبلت') || titleLower.includes('tablet') || titleLower.includes('ipad')) return '📱';
    if (titleLower.includes('کنسول') || titleLower.includes('پلی استیشن') || titleLower.includes('ایکس باکس') || titleLower.includes('playstation') || titleLower.includes('xbox')) return '🎮';
    if (titleLower.includes('کتاب')) return '📚';
    return '🛍️';
}

function formatPrice(price) { if (!price || price === 0) return 'نامشخص'; return new Intl.NumberFormat('fa-IR').format(price) + ' تومان'; }
function showLoading() { document.getElementById('searchResults').innerHTML = '<div class="loading"><div class="spinner"></div><p>در حال جستجوی زنده...</p></div>'; }
function showError() { document.getElementById('searchResults').innerHTML = '<div class="error"><p>⚠️ خطا در ارتباط با سرور</p><p>لطفاً دوباره تلاش کنید</p></div>'; }
function showNoResults(query) { document.getElementById('searchResults').innerHTML = `<div class="no-results"><p>😔 نتیجه‌ای برای "${escapeHtml(query)}" یافت نشد</p><p>عبارت دیگری را امتحان کنید</p></div>`; }
function handleSearchInput(query) { clearTimeout(searchTimeout); if (query.trim().length < 3) return; searchTimeout = setTimeout(() => searchProducts(query.trim()), 500); }
function handleSearchKey(event) { if (event.key === 'Enter') performSmartSearch(); }
function performSmartSearch() { const query = document.getElementById('smartSearchInput').value.trim(); if (!query) { alert('لطفاً نام محصول را وارد کنید'); return; } searchProducts(query); }
function quickSearch(term) { document.getElementById('smartSearchInput').value = term; performSmartSearch(); }
