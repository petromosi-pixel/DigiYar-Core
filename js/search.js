// js/search.js

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

// تابع جستجو
function searchProducts(query) {
    const resultsDiv = document.getElementById('searchResults');
    
    // ساخت لینک‌های افیلیت
    const digikalaSearchUrl = `https://www.digikala.com/search/?q=${encodeURIComponent(query)}`;
    const digikalaAffiliateUrl = `${affiliateConfig.digikala.affiliateLink}?p=${encodeURIComponent(digikalaSearchUrl)}`;
    
    const snappSearchUrl = `https://snapp.shop/search?q=${encodeURIComponent(query)}`;
    const snappAffiliateUrl = `${affiliateConfig.snappshop.affiliateLink}?p=${encodeURIComponent(snappSearchUrl)}`;
    
    // نمایش نتایج
    resultsDiv.innerHTML = `
        <h2 style="margin-bottom: 10px; color: #333;">
            جستجوی "${query}"
        </h2>
        <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
            برای مشاهده نتایج زنده و قیمت‌های واقعی، روی فروشگاه مورد نظر کلیک کنید:
        </p>
        
        <div class="store-buttons">
            <div class="store-card">
                <div class="store-logo" style="background: ${affiliateConfig.digikala.color}">
                    ${affiliateConfig.digikala.logo}
                </div>
                <div class="store-info">
                    <h3>${affiliateConfig.digikala.name}</h3>
                    <p>بزرگترین فروشگاه آنلاین ایران</p>
                    <p class="store-features">✅ قیمت واقعی | ✅ موجودی زنده | ✅ ارسال سریع</p>
                </div>
                <a href="${digikalaAffiliateUrl}" 
                   target="_blank" 
                   class="store-button" 
                   style="background: ${affiliateConfig.digikala.color}">
                    مشاهده نتایج زنده
                </a>
            </div>
            
            <div class="store-card">
                <div class="store-logo" style="background: ${affiliateConfig.snappshop.color}">
                    ${affiliateConfig.snappshop.logo}
                </div>
                <div class="store-info">
                    <h3>${affiliateConfig.snappshop.name}</h3>
                    <p>خرید سریع و آسان</p>
                    <p class="store-features">✅ قیمت واقعی | ✅ موجودی زنده | ✅ ارسال فوری</p>
                </div>
                <a href="${snappAffiliateUrl}" 
                   target="_blank" 
                   class="store-button" 
                   style="background: ${affiliateConfig.snappshop.color}">
                    مشاهده نتایج زنده
                </a>
            </div>
        </div>
        
        <div class="search-note">
            <p>💡 با کلیک روی هر دکمه، به صفحه جستجوی همان فروشگاه با نتایج زنده منتقل می‌شوید.</p>
        </div>
    `;
}

// نمایش لودینگ
function showLoading() {
    document.getElementById('searchResults').innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>در حال آماده‌سازی...</p>
        </div>
    `;
}

// مدیریت ورودی
function handleSearchInput(query) {
    clearTimeout(searchTimeout);
    if (query.length < 3) return;
    searchTimeout = setTimeout(() => searchProducts(query), 300);
}

// مدیریت کلیدها
function handleSearchKey(event) {
    if (event.key === 'Enter') performSmartSearch();
}

// جستجوی فوری
function performSmartSearch() {
    const query = document.getElementById('smartSearchInput').value.trim();
    if (!query) return alert('لطفاً نام محصول را وارد کنید');
    showLoading();
    setTimeout(() => searchProducts(query), 300);
}

// جستجوی سریع
function quickSearch(term) {
    document.getElementById('smartSearchInput').value = term;
    performSmartSearch();
}
