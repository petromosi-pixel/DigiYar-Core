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
        affiliateLink: "https://aflo.ir/YPN05dL7",
        logo: "🛍️",
        color: "#00d170"
    }
};

let searchTimeout;

function searchProducts(query) {
    const resultsDiv = document.getElementById('searchResults');
    
    const digikalaSearchUrl = `https://www.digikala.com/search/?q=${encodeURIComponent(query)}`;
    const digikalaAffiliateUrl = `${affiliateConfig.digikala.affiliateLink}?p=${encodeURIComponent(digikalaSearchUrl)}`;
    
    const snappSearchUrl = `https://snappshop.ir/search?q=${encodeURIComponent(query)}`;
    const snappAffiliateUrl = `${affiliateConfig.snappshop.affiliateLink}?p=${encodeURIComponent(snappSearchUrl)}`;
    
    resultsDiv.innerHTML = `
        <h3 style="margin-bottom: 10px; color: #333; text-align: center;">
            نتایج جستجوی "${query}"
        </h3>
        <p style="color: #666; font-size: 13px; margin-bottom: 15px; text-align: center;">
            برای مشاهده نتایج زنده روی فروشگاه مورد نظر کلیک کنید:
        </p>
        
        <div class="store-buttons">
            <div class="store-card">
                <div class="store-logo" style="background: ${affiliateConfig.digikala.color}">
                    ${affiliateConfig.digikala.logo}
                </div>
                <div class="store-info">
                    <h3>${affiliateConfig.digikala.name}</h3>
                    <p>بزرگترین فروشگاه آنلاین ایران</p>
                    <p class="store-features">✅ قیمت واقعی | ✅ موجودی زنده</p>
                </div>
                <a href="${digikalaAffiliateUrl}" 
                   target="_blank" 
                   class="store-button" 
                   style="background: ${affiliateConfig.digikala.color}">
                    مشاهده نتایج
                </a>
            </div>
              
            <div class="store-card">
                <div class="store-logo" style="background: ${affiliateConfig.snappshop.color}">
                    ${affiliateConfig.snappshop.logo}
                </div>
                <div class="store-info">
                    <h3>${affiliateConfig.snappshop.name}</h3>
                    <p>خرید سریع و آسان</p>
                    <p class="store-features">✅ قیمت واقعی | ✅ ارسال فوری</p>
                </div>
                <a href="${snappAffiliateUrl}" 
                   target="_blank" 
                   class="store-button" 
                   style="background: ${affiliateConfig.snappshop.color}">
                    مشاهده نتایج
                </a>
            </div>
        </div>
          
        <div class="search-note">
            <p>💡 با کلیک روی هر دکمه، به صفحه فروشگاه منتقل می‌شوید.</p>
        </div>
    `;
}

function showLoading() {
    document.getElementById('searchResults').innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>در حال آماده‌سازی...</p>
        </div>
    `;
}

function handleSearchInput(query) {
    clearTimeout(searchTimeout);
    if (query.length < 3) return;
    searchTimeout = setTimeout(() => searchProducts(query), 300);
}

function handleSearchKey(event) {
    if (event.key === 'Enter') performSmartSearch();
}

function performSmartSearch() {
    const query = document.getElementById('smartSearchInput').value.trim();
    if (!query) return alert('لطفاً نام محصول را وارد کنید');
    showLoading();
    setTimeout(() => searchProducts(query), 300);
}

function quickSearch(term) {
    document.getElementById('smartSearchInput').value = term;
    performSmartSearch();
}
