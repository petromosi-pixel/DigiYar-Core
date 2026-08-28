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
        // جستجو در دیتابیس هوشمند
        const results = searchSmartDatabase(q);
        
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

// دیتابیس هوشمند محصولات محبوب
const smartDatabase = [
    {
        category: "گوشی موبایل",
        keywords: ["گوشی", "موبایل", "سامسونگ", "آیفون", "شیائومی", "هوآوی", "نوکیا", "تلفن"],
        products: [
            { title: "گوشی سامسونگ Galaxy S25 Ultra", searchQuery: "گوشی سامسونگ galaxy s25 ultra", price: 85000000, image: "https://dkstatics-public.digikala.com/digikala-products/123456.jpg" },
            { title: "گوشی آیفون ۱۶ پرو مکس", searchQuery: "گوشی آیفون 16 pro max", price: 95000000, image: "https://dkstatics-public.digikala.com/digikala-products/iphone16.jpg" },
            { title: "گوشی شیائومی Redmi Note 14 Pro", searchQuery: "گوشی شیائومی redmi note 14 pro", price: 25000000, image: "https://dkstatics-public.digikala.com/digikala-products/xiaomi14.jpg" },
            { title: "گوشی سامسونگ Galaxy A56", searchQuery: "گوشی سامسونگ galaxy a56", price: 30000000, image: "https://dkstatics-public.digikala.com/digikala-products/a56.jpg" },
            { title: "گوشی شیائومی Poco X7 Pro", searchQuery: "گوشی شیائومی poco x7 pro", price: 28000000, image: "https://dkstatics-public.digikala.com/digikala-products/pocox7.jpg" }
        ]
    },
    {
        category: "لپ تاپ",
        keywords: ["لپ تاپ", "لپتاپ", "نوت بوک", "مک بوک", "ایسوس", "لنوو", "اچ پی", "کامپیوتر"],
        products: [
            { title: "لپ تاپ ایسوس ROG Strix G16", searchQuery: "لپ تاپ ایسوس rog strix g16", price: 85000000, image: "https://dkstatics-public.digikala.com/digikala-products/asus-rog.jpg" },
            { title: "مک بوک پرو ۱۴ اینچ M3", searchQuery: "مک بوک پرو m3", price: 120000000, image: "https://dkstatics-public.digikala.com/digikala-products/macbook.jpg" },
            { title: "لپ تاپ لنوو IdeaPad Slim 5", searchQuery: "لپ تاپ لنوو ideapad slim 5", price: 35000000, image: "https://dkstatics-public.digikala.com/digikala-products/lenovo.jpg" }
        ]
    },
    {
        category: "هدفون و هندزفری",
        keywords: ["هدفون", "هندزفری", "ایرپاد", "اسپیکر", "هدفون بلوتوثی"],
        products: [
            { title: "ایرپاد پرو اپل", searchQuery: "ایرپاد پرو اپل", price: 25000000, image: "https://dkstatics-public.digikala.com/digikala-products/airpods.jpg" },
            { title: "هدفون سونی WH-1000XM5", searchQuery: "هدفون سونی wh-1000xm5", price: 30000000, image: "https://dkstatics-public.digikala.com/digikala-products/sony-headphone.jpg" },
            { title: "هندزفری سامسونگ Galaxy Buds 3 Pro", searchQuery: "هندزفری سامسونگ galaxy buds 3 pro", price: 15000000, image: "https://dkstatics-public.digikala.com/digikala-products/buds3.jpg" }
        ]
    },
    {
        category: "ساعت هوشمند",
        keywords: ["ساعت", "ساعت هوشمند", "اپل واچ", "گلکسی واچ", "می بند"],
        products: [
            { title: "اپل واچ سری ۱۰", searchQuery: "اپل واچ سری 10", price: 40000000, image: "https://dkstatics-public.digikala.com/digikala-products/apple-watch.jpg" },
            { title: "گلکسی واچ ۷ سامسونگ", searchQuery: "گلکسی واچ 7", price: 20000000, image: "https://dkstatics-public.digikala.com/digikala-products/galaxy-watch.jpg" },
            { title: "می بند ۹ شیائومی", searchQuery: "می بند 9 شیائومی", price: 5000000, image: "https://dkstatics-public.digikala.com/digikala-products/miband9.jpg" }
        ]
    },
    {
        category: "تبلت",
        keywords: ["تبلت", "آیپد", "گلکسی تب", " tablet"],
        products: [
            { title: "آیپد پرو ۱۳ اینچ M4", searchQuery: "آیپد پرو m4", price: 90000000, image: "https://dkstatics-public.digikala.com/digikala-products/ipad-pro.jpg" },
            { title: "گلکسی تب S10 اولترا", searchQuery: "گلکسی تب s10 اولترا", price: 70000000, image: "https://dkstatics-public.digikala.com/digikala-products/tab-s10.jpg" }
        ]
    },
    {
        category: "کنسول بازی",
        keywords: ["کنسول", "پلی استیشن", "ایکس باکس", "نintendo", "بازی"],
        products: [
            { title: "پلی استیشن ۵ اسلیم", searchQuery: "پلی استیشن 5 اسلیم", price: 45000000, image: "https://dkstatics-public.digikala.com/digikala-products/ps5.jpg" },
            { title: "ایکس باکس سری X", searchQuery: "ایکس باکس سری x", price: 40000000, image: "https://dkstatics-public.digikala.com/digikala-products/xbox.jpg" }
        ]
    },
    {
        category: "کتاب",
        keywords: ["کتاب", "رمان", "داستان", "شعر"],
        products: [
            { title: "کتاب ملت عشق", searchQuery: "کتاب ملت عشق", price: 250000, image: "" },
            { title: "کتاب ۱۹۸۴", searchQuery: "کتاب 1984", price: 200000, image: "" }
        ]
    }
];

// تابع جستجوی هوشمند
function searchSmartDatabase(query) {
    const queryLower = query.toLowerCase().trim();
    const results = [];
    
    smartDatabase.forEach(category => {
        const categoryMatch = category.keywords.some(keyword => {
            const keywordLower = keyword.toLowerCase();
            return queryLower.includes(keywordLower) || keywordLower.includes(queryLower);
        });
        
        const matchingProducts = category.products.filter(product => {
            const titleLower = product.title.toLowerCase();
            const searchQueryLower = product.searchQuery.toLowerCase();
            const queryWords = queryLower.split(' ').filter(Boolean);
            const titleMatch = queryWords.some(word => 
                titleLower.includes(word) || searchQueryLower.includes(word)
            );
            return categoryMatch || titleMatch;
        });
        
        matchingProducts.forEach(product => {
            results.push({
                id: Math.random().toString(36),
                title: product.title,
                price: product.price,
                originalPrice: product.price,
                image: product.image || '',
                url: `https://www.digikala.com/search/?q=${encodeURIComponent(product.searchQuery)}`,
                available: true,
                rating: 4.5,
                reviews: Math.floor(Math.random() * 100) + 10,
                store: 'digikala',
                storeName: 'دیجی‌کالا',
                category: category.category
            });
        });
    });
    
    const uniqueResults = results.filter((product, index, self) => 
        index === self.findIndex(p => p.title === product.title)
    );
    
    uniqueResults.sort((a, b) => a.price - b.price);
    
    return uniqueResults;
}