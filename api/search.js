// api/search.js

export default async function handler(req, res) {
    // فعال‌سازی CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    const { q } = req.query;

    if (!q) {
        return res.status(400).json({
            success: false,
            error: 'Query parameter is required'
        });
    }

    try {
        // جستجو در دیجی‌کالا
        const digikalaResults = await searchDigikala(q);

        // جستجو در اسنپ‌شاپ (اگه در دسترس بود)
        const snappResults = await searchSnappShop(q);

        // ترکیب نتایج
        const allResults = [
            ...digikalaResults,
            ...snappResults
        ];

        // فیلتر محصولات موجود
        const availableProducts = allResults.filter(p => p.available && p.price > 0);

        // مرتب‌سازی بر اساس قیمت
        availableProducts.sort((a, b) => a.price - b.price);

        // برگرداندن ۳ نتیجه برتر
        const topResults = availableProducts.slice(0, 3);

        res.json({
            success: true,
            results: topResults,
            total: availableProducts.length,
            query: q
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            error: 'Search failed',
            message: error.message
        });
    }
}

// جستجو در دیجی‌کالا
async function searchDigikala(query) {
    try {
        const response = await fetch(
            `https://api.digikala.com/v1/search/?q=${encodeURIComponent(query)}&page=1`,
            {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0'
                }
            }
        );

        if (!response.ok) {
            console.error('Digikala API error:', response.status);
            return [];
        }

        const data = await response.json();

        // بررسی ساختار داده دیجی‌کالا
        if (!data.data || !data.data.products) {
            console.error('No products in Digikala response');
            return [];
        }

        // استخراج محصولات
        return data.data.products.map(product => {
            // استخراج قیمت از ساختار صحیح
            const price = product.default_variant?.price?.selling_price ||
                         product.default_variant?.price?.rrp_price ||
                         product.price ||
                         0;

            const originalPrice = product.default_variant?.price?.rrp_price ||
                                 product.price ||
                                 price;

            // استخراج تصویر
            const image = product.images?.main?.url?.[0] ||
                         product.images?.list?.[0]?.url?.[0] ||
                         '';

            // استخراج امتیاز
            const rating = product.rating?.rate ||
                          product.rate ||
                          0;

            const reviews = product.rating?.count ||
                           product.review_count ||
                           0;

            // ساختار نهایی
            return {
                id: product.id,
                title: product.title_fa || product.title || 'بدون عنوان',
                price: price,
                originalPrice: originalPrice,
                image: image,
                url: `https://www.digikala.com/product/dkp-${product.id}`,
                available: price > 0,
                rating: rating,
                reviews: reviews,
                store: 'digikala',
                storeName: 'دیجی‌کالا'
            };
        });

    } catch (error) {
        console.error('Digikala search error:', error);
        return [];
    }
}

// جستجو در اسنپ‌شاپ
async function searchSnappShop(query) {
    try {
        const response = await fetch(
            `https://snapp.shop/api/search?q=${encodeURIComponent(query)}`,
            {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0'
                }
            }
        );

        if (!response.ok) {
            console.error('SnappShop API error:', response.status);
            return [];
        }

        const data = await response.json();

        // بررسی ساختارهای مختلف پاسخ اسنپ‌شاپ
        let products = [];

        if (data.products) {
            products = data.products;
        } else if (data.results) {
            products = data.results;
        } else if (data.data && data.data.products) {
            products = data.data.products;
        } else if (Array.isArray(data)) {
            products = data;
        }

        // استخراج محصولات
        return products.map(product => {
            return {
                id: product.id || Math.random().toString(36),
                title: product.name || product.title || product.title_fa || 'بدون عنوان',
                price: product.price || product.selling_price || 0,
                originalPrice: product.original_price || product.rrp_price || 0,
                image: product.image_url || product.image || product.images?.main?.url?.[0] || '',
                url: product.product_url || product.url || `https://snapp.shop/product/${product.id}`,
                available: product.in_stock !== undefined ? product.in_stock : true,
                rating: product.rating || 0,
                reviews: product.review_count || 0,
                store: 'snappshop',
                storeName: 'اسنپ‌شاپ'
            };
        });

    } catch (error) {
        console.error('SnappShop search error:', error);
        return [];
    }
}