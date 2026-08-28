// api/search.js

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    const { q } = req.query;
    
    if (!q) return res.status(400).json({ success: false, error: 'Query parameter is required' });
    
    try {
        let results = await tryDigikalaAPI(q);
        if (results.length === 0) results = searchLocalDatabase(q);
        if (results.length === 0) results = [{
            id: 'direct-search', title: `جستجوی "${q}" در دیجیکالا`, price: 0, image: '',
            url: `https://www.digikala.com/search/?q=${encodeURIComponent(q)}`,
            available: true, rating: 0, reviews: 0, store: 'digikala', storeName: 'دیجیکالا', isDirectSearch: true
        }];
        res.json({ success: true, results: results.slice(0, 3), total: results.length, query: q });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function tryDigikalaAPI(query) {
    try {
        const urls = [
            `https://api.digikala.com/v1/search/?q=${encodeURIComponent(query)}&page=1&size=10`,
            `https://api.digikala.com/v1/search/?q=${encodeURIComponent(query)}&page=0&size=10`
        ];
        for (const url of urls) {
            try {
                const response = await fetch(url, {
                    headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                    redirect: 'follow'
                });
                if (!response.ok) continue;
                const data = JSON.parse(await response.text());
                const products = data.data?.products;
                if (Array.isArray(products) && products.length > 0) {
                    return products.map(p => {
                        const image = p.images?.main?.url?.[0] || '';
                        const price = p.default_variant?.price?.selling_price || 0;
                        return {
                            id: p.id || Math.random().toString(36),
                            title: p.title_fa || p.title || 'بدون عنوان', price, originalPrice: price,
                            image, url: `https://www.digikala.com/product/dkp-${p.id}`,
                            available: price > 0, rating: p.rating?.rate || 0, reviews: p.rating?.count || 0,
                            store: 'digikala', storeName: 'دیجیکالا'
                        };
                    });
                }
            } catch (e) { continue; }
        }
        return [];
    } catch (error) { return []; }
}

// دیتابیس محلی بدون عکس fake
function searchLocalDatabase(query) {
    const products = [
        { keywords: ['گوشی', 'سامسونگ', 'galaxy', 'موبایل', 'samsung'], items: [
            { title: 'گوشی سامسونگ Galaxy S25 Ultra', price: 85000000, searchQuery: 'galaxy s25 ultra' },
            { title: 'گوشی سامسونگ Galaxy S24 FE', price: 45000000, searchQuery: 'galaxy s24 fe' },
            { title: 'گوشی سامسونگ Galaxy A56', price: 30000000, searchQuery: 'galaxy a56' }
        ]},
        { keywords: ['آیفون', 'اپل', 'iphone', 'apple'], items: [
            { title: 'گوشی آیفون ۱۶ پرو مکس', price: 95000000, searchQuery: 'iphone 16 pro max' },
            { title: 'گوشی آیفون ۱۵', price: 55000000, searchQuery: 'iphone 15' }
        ]},
        { keywords: ['لپ تاپ', 'لپتاپ', 'laptop', 'نوت بوک', 'macbook'], items: [
            { title: 'لپ تاپ ایسوس ROG Strix G16', price: 85000000, searchQuery: 'asus rog strix g16' },
            { title: 'مک بوک پرو M3', price: 120000000, searchQuery: 'macbook pro m3' },
            { title: 'لپ تاپ لنوو IdeaPad Slim 5', price: 35000000, searchQuery: 'lenovo ideapad slim 5' }
        ]},
        { keywords: ['هدفون', 'هندزفری', 'ایرپاد', 'headphone', 'buds'], items: [
            { title: 'ایرپاد پرو اپل', price: 25000000, searchQuery: 'airpods pro' },
            { title: 'هدفون سونی WH-1000XM5', price: 30000000, searchQuery: 'sony wh-1000xm5' },
            { title: 'هندزفری سامسونگ Galaxy Buds 3', price: 15000000, searchQuery: 'galaxy buds 3' }
        ]},
        { keywords: ['ساعت', 'watch', 'اپل واچ'], items: [
            { title: 'اپل واچ سری ۱۰', price: 40000000, searchQuery: 'apple watch series 10' },
            { title: 'گلکسی واچ ۷', price: 20000000, searchQuery: 'galaxy watch 7' },
            { title: 'می بند ۹ شیائومی', price: 5000000, searchQuery: 'mi band 9' }
        ]},
        { keywords: ['تبلت', 'آیپد', 'ipad', 'tablet'], items: [
            { title: 'آیپد پرو ۱۳ اینچ M4', price: 90000000, searchQuery: 'ipad pro m4' },
            { title: 'گلکسی تب S10 اولترا', price: 70000000, searchQuery: 'galaxy tab s10 ultra' }
        ]},
        { keywords: ['کنسول', 'پلی استیشن', 'ایکس باکس', 'بازی'], items: [
            { title: 'پلی استیشن ۵ اسلیم', price: 45000000, searchQuery: 'playstation 5 slim' },
            { title: 'ایکس باکس سری X', price: 40000000, searchQuery: 'xbox series x' }
        ]}
    ];
    const queryLower = query.toLowerCase().trim();
    const results = [];
    products.forEach(category => {
        const categoryMatch = category.keywords.some(k => queryLower.includes(k.toLowerCase()) || k.toLowerCase().includes(queryLower));
        if (categoryMatch) category.items.forEach(item => results.push({
            id: Math.random().toString(36), title: item.title, price: item.price, originalPrice: item.price,
            image: '', url: `https://www.digikala.com/search/?q=${encodeURIComponent(item.searchQuery)}`,
            available: true, rating: 4.5, reviews: Math.floor(Math.random() * 100) + 10,
            store: 'digikala', storeName: 'دیجیکالا'
        }));
    });
    return results;
}