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
        // اول از دیتابیس محلی
        let results = searchLocalDatabase(q);
        
        // برای هر نتیجه، تلاش برای گرفتن عکس از API دیجیکالا
        results = await Promise.all(results.map(async product => {
            if (!product.image && product.searchQuery) {
                product.image = await getProductImage(product.searchQuery);
            }
            return product;
        }));
        
        // اگه دیتابیس محلی نتیجه نداشت، مستقیم از API
        if (results.length === 0) {
            results = await tryDigikalaAPI(q);
        }
        
        res.json({
            success: true,
            results: results.slice(0, 3),
            total: results.length,
            query: q
        });
        
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
}

// گرفتن عکس از API دیجیکالا
async function getProductImage(searchQuery) {
    try {
        const response = await fetch(
            `https://api.digikala.com/v1/search/?q=${encodeURIComponent(searchQuery)}&page=1&size=5`,
            {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                redirect: 'follow'
            }
        );
        
        if (!response.ok) return '';
        
        const data = await response.json();
        
        if (data.data && data.data.products && data.data.products.length > 0) {
            const firstProduct = data.data.products[0];
            
            // استخراج تصویر
            if (firstProduct.images && firstProduct.images.main && firstProduct.images.main.url) {
                const imageUrl = firstProduct.images.main.url;
                return Array.isArray(imageUrl) ? imageUrl[0] : imageUrl;
            }
        }
        
        return '';
    } catch (error) {
        console.error('Error getting image:', error);
        return '';
    }
}

// تلاش برای API دیجیکالا (برای جستجوهای مستقیم)
async function tryDigikalaAPI(query) {
    try {
        const urls = [
            `https://api.digikala.com/v1/search/?q=${encodeURIComponent(query)}&page=1&size=10`,
            `https://api.digikala.com/v1/search/?q=${encodeURIComponent(query)}&page=0&size=10`
        ];
        
        for (const url of urls) {
            try {
                const response = await fetch(url, {
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    },
                    redirect: 'follow'
                });
                
                if (!response.ok) continue;
                
                const text = await response.text();
                const data = JSON.parse(text);
                
                let products = [];
                
                if (data.data && data.data.products && Array.isArray(data.data.products)) {
                    products = data.data.products;
                }
                
                if (products.length > 0) {
                    return products.map(p => {
                        let image = '';
                        
                        if (p.images && p.images.main && p.images.main.url) {
                            image = Array.isArray(p.images.main.url) ? p.images.main.url[0] : p.images.main.url;
                        }
                        
                        let price = 0;
                        if (p.default_variant && p.default_variant.price) {
                            price = p.default_variant.price.selling_price || 0;
                        }
                        
                        return {
                            id: p.id || Math.random().toString(36),
                            title: p.title_fa || p.title || 'بدون عنوان',
                            price: price,
                            originalPrice: price,
                            image: image,
                            url: `https://www.digikala.com/product/dkp-${p.id}`,
                            available: price > 0,
                            rating: p.rating?.rate || 0,
                            reviews: p.rating?.count || 0,
                            store: 'digikala',
                            storeName: 'دیجیکالا'
                        };
                    });
                }
            } catch (e) {
                continue;
            }
        }
        
        return [];
        
    } catch (error) {
        return [];
    }
}

// دیتابیس محلی با searchQuery انگلیسی
function searchLocalDatabase(query) {
    const products = [
        {
            keywords: ['گوشی', 'سامسونگ', 'galaxy', 'موبایل', 'samsung'],
            items: [
                { title: 'گوشی سامسونگ Galaxy S25 Ultra', price: 85000000, searchQuery: 'galaxy s25 ultra' },
                { title: 'گوشی سامسونگ Galaxy S24 FE', price: 45000000, searchQuery: 'galaxy s24 fe' },
                { title: 'گوشی سامسونگ Galaxy A56', price: 30000000, searchQuery: 'galaxy a56' },
                { title: 'گوشی سامسونگ Galaxy Z Fold 6', price: 120000000, searchQuery: 'galaxy z fold 6' },
                { title: 'گوشی سامسونگ Galaxy Z Flip 6', price: 80000000, searchQuery: 'galaxy z flip 6' }
            ]
        },
        {
            keywords: ['آیفون', 'اپل', 'iphone', 'apple'],
            items: [
                { title: 'گوشی آیفون ۱۶ پرو مکس', price: 95000000, searchQuery: 'iphone 16 pro max' },
                { title: 'گوشی آیفون ۱۶ پرو', price: 85000000, searchQuery: 'iphone 16 pro' },
                { title: 'گوشی آیفون ۱۵', price: 55000000, searchQuery: 'iphone 15' }
            ]
        },
        {
            keywords: ['شیائومی', 'xiaomi', 'ردمی', 'redmi'],
            items: [
                { title: 'گوشی شیائومی Redmi Note 14 Pro', price: 25000000, searchQuery: 'redmi note 14 pro' },
                { title: 'گوشی شیائومی Poco X7 Pro', price: 28000000, searchQuery: 'poco x7 pro' },
                { title: 'گوشی شیائومی ۱۵ اولترا', price: 90000000, searchQuery: 'xiaomi 15 ultra' }
            ]
        },
        {
            keywords: ['لپ تاپ', 'لپتاپ', 'laptop', 'نوت بوک', 'macbook'],
            items: [
                { title: 'لپ تاپ ایسوس ROG Strix G16', price: 85000000, searchQuery: 'asus rog strix g16' },
                { title: 'مک بوک پرو M3', price: 120000000, searchQuery: 'macbook pro m3' },
                { title: 'لپ تاپ لنوو IdeaPad Slim 5', price: 35000000, searchQuery: 'lenovo ideapad slim 5' },
                { title: 'لپ تاپ ایسوس Vivobook S15', price: 45000000, searchQuery: 'asus vivobook s15' }
            ]
        },
        {
            keywords: ['هدفون', 'هندزفری', 'ایرپاد', 'headphone', 'buds'],
            items: [
                { title: 'ایرپاد پرو اپل', price: 25000000, searchQuery: 'airpods pro' },
                { title: 'هدفون سونی WH-1000XM5', price: 30000000, searchQuery: 'sony wh-1000xm5' },
                { title: 'هندزفری سامسونگ Galaxy Buds 3', price: 15000000, searchQuery: 'galaxy buds 3 pro' }
            ]
        },
        {
            keywords: ['ساعت', 'watch', 'اپل واچ'],
            items: [
                { title: 'اپل واچ سری ۱۰', price: 40000000, searchQuery: 'apple watch series 10' },
                { title: 'گلکسی واچ ۷', price: 20000000, searchQuery: 'galaxy watch 7' },
                { title: 'می بند ۹ شیائومی', price: 5000000, searchQuery: 'mi band 9' }
            ]
        },
        {
            keywords: ['تبلت', 'آیپد', 'ipad', 'tablet'],
            items: [
                { title: 'آیپد پرو ۱۳ اینچ M4', price: 90000000, searchQuery: 'ipad pro m4' },
                { title: 'گلکسی تب S10 اولترا', price: 70000000, searchQuery: 'galaxy tab s10 ultra' }
            ]
        },
        {
            keywords: ['کنسول', 'پلی استیشن', 'ایکس باکس', 'بازی'],
            items: [
                { title: 'پلی استیشن ۵ اسلیم', price: 45000000, searchQuery: 'playstation 5 slim' },
                { title: 'ایکس باکس سری X', price: 40000000, searchQuery: 'xbox series x' }
            ]
        }
    ];
    
    const queryLower = query.toLowerCase().trim();
    const results = [];
    
    products.forEach(category => {
        const categoryMatch = category.keywords.some(k => 
            queryLower.includes(k.toLowerCase()) || k.toLowerCase().includes(queryLower)
        );
        
        if (categoryMatch) {
            category.items.forEach(item => {
                results.push({
                    id: Math.random().toString(36),
                    title: item.title,
                    price: item.price,
                    originalPrice: item.price,
                    image: '',
                    searchQuery: item.searchQuery,
                    url: `https://www.digikala.com/search/?q=${encodeURIComponent(item.searchQuery)}`,
                    available: true,
                    rating: 4.5,
                    reviews: Math.floor(Math.random() * 100) + 10,
                    store: 'digikala',
                    storeName: 'دیجیکالا'
                });
            });
        }
    });
    
    // حذف تکراریها
    const uniqueResults = results.filter((product, index, self) => 
        index === self.findIndex(p => p.title === product.title)
    );
    
    return uniqueResults;
}