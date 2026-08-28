// api/search.js

export default async function handler(req, res) {
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
        
        // ترکیب نتایج (فعلاً فقط دیجیکالا)
        const allResults = [...digikalaResults];
        
        // فیلتر محصولات موجود و دارای قیمت
        const availableProducts = allResults.filter(p => p.available && p.price > 0);
        
        // مرتب‌سازی بر اساس قیمت (ارزان به گران)
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
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            }
        );
        
        if (!response.ok) {
            console.error('Digikala API error:', response.status);
            return [];
        }
        
        const data = await response.json();
        
        // بررسی ساختار صحیح دیجی‌کالا
        if (!data.data || !data.data.products) {
            console.error('No products in Digikala response');
            return [];
        }
        
        // استخراج محصولات
        return data.data.products.map(product => {
            // استخراج قیمت
            let price = 0;
            let originalPrice = 0;
            
            if (product.default_variant && product.default_variant.price) {
                price = product.default_variant.price.selling_price || 0;
                originalPrice = product.default_variant.price.rrp_price || price;
            }
            
            // استخراج تصویر
            let image = '';
            if (product.images && product.images.main && product.images.main.url) {
                image = product.images.main.url[0] || '';
            }
            
            // استخراج امتیاز
            const rating = product.rating?.rate || 0;
            const reviews = product.rating?.count || 0;
            
            // ساخت URL صحیح
            const productUrl = product.url?.uri || 
                              `https://www.digikala.com/product/dkp-${product.id}`;
            
            return {
                id: product.id,
                title: product.title_fa || product.title_en || 'بدون عنوان',
                price: price,
                originalPrice: originalPrice,
                image: image,
                url: productUrl.startsWith('http') ? productUrl : `https://www.digikala.com${productUrl}`,
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