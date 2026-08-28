// api/search.js - نسخه تشخیصی

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const { q } = req.query;
    
    try {
        const response = await fetch(
            `https://api.digikala.com/v1/search/?q=${encodeURIComponent(q)}&page=1`,
            {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0'
                }
            }
        );
        
        const data = await response.json();
        
        // بررسی ساختار
        const result = {
            success: true,
            query: q,
            hasData: !!data.data,
            hasProducts: !!(data.data && data.data.products),
            productsCount: data.data?.products?.length || 0,
            firstProduct: data.data?.products?.[0] || null,
            dataKeys: data.data ? Object.keys(data.data) : [],
            topLevelKeys: Object.keys(data)
        };
        
        // اگه محصولات هستن، استخراجشون کن
        if (result.productsCount > 0) {
            result.results = data.data.products.slice(0, 3).map(p => ({
                id: p.id,
                title: p.title_fa || p.title_en || 'بدون عنوان',
                price: p.default_variant?.price?.selling_price || 0,
                image: p.images?.main?.url?.[0] || '',
                url: p.url?.uri || `https://www.digikala.com/product/dkp-${p.id}`,
                available: (p.default_variant?.price?.selling_price || 0) > 0,
                rating: p.rating?.rate || 0,
                reviews: p.rating?.count || 0,
                store: 'digikala',
                storeName: 'دیجی‌کالا'
            }));
        } else {
            result.results = [];
        }
        
        res.json(result);
        
    } catch (error) {
        res.json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
}