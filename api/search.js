// api/search.js

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(204).end();

    const { q } = req.query;
    if (!q) return res.status(400).json({ success: false, error: 'Query parameter is required' });

    try {
        const [digikalaResults, snappResults] = await Promise.all([
            searchDigikala(q),
            searchSnappShop(q)
        ]);

        const allResults = [
            ...digikalaResults.map(r => ({ ...r, store: 'digikala', storeName: 'دیجی‌کالا' })),
            ...snappResults.map(r => ({ ...r, store: 'snappshop', storeName: 'اسنپ‌شاپ' }))
        ];

        const availableProducts = allResults.filter(p => p.available && p.price > 0);
        availableProducts.sort((a, b) => a.price - b.price);

        return res.json({ success: true, results: availableProducts.slice(0, 3), total: availableProducts.length, query: q });
    } catch (error) {
        console.error('Search error:', error);
        return res.status(500).json({ success: false, error: 'Search failed', message: error.message });
    }
}

async function searchDigikala(query) {
    try {
        const response = await fetch(`https://api.digikala.com/v1/search/?q=${encodeURIComponent(query)}&page=1`, {
            headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' }
        });
        if (!response.ok) return [];
        const data = await response.json();
        if (!data.data || !data.data.products) return [];
        return data.data.products.map(product => ({
            id: product.id,
            title: product.title_fa || 'بدون عنوان',
            price: product.default_variant?.price?.selling_price || 0,
            originalPrice: product.default_variant?.price?.rrp_price || 0,
            image: product.images?.main?.url?.[0] || '',
            url: `https://www.digikala.com/product/dkp-${product.id}`,
            available: (product.default_variant?.price?.selling_price || 0) > 0,
            rating: product.rating?.rate || 0,
            reviews: product.rating?.count || 0
        }));
    } catch (error) {
        console.error('Digikala search error:', error);
        return [];
    }
}

async function searchSnappShop(query) {
    try {
        const response = await fetch(`https://api.snapp.shop/api/v1/search?q=${encodeURIComponent(query)}`, {
            headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' }
        });
        if (!response.ok) return [];
        const data = await response.json();
        if (!data.products && !data.results) return [];
        const products = data.products || data.results || [];
        return products.map(product => ({
            id: product.id,
            title: product.name || product.title || 'بدون عنوان',
            price: product.price || product.selling_price || 0,
            originalPrice: product.original_price || product.rrp_price || 0,
            image: product.image_url || product.image || '',
            url: product.product_url || `https://snapp.shop/product/${product.id}`,
            available: product.in_stock !== undefined ? product.in_stock : true,
            rating: product.rating || 0,
            reviews: product.review_count || 0
        }));
    } catch (error) {
        console.error('SnappShop search error:', error);
        return [];
    }
}
