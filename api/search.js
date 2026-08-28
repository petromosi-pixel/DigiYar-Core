// api/search.js
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    const { q } = req.query;
    if (!q) return res.status(400).json({ success:false, error:'Query parameter is required' });
    try {
        const results = searchLocalDatabase(q);
        res.json({ success:true, results:results.slice(0,3), total:results.length, query:q });
    } catch (error) {
        res.status(500).json({ success:false, error:error.message });
    }
}

// دیتابیس محلی؛ تصویر عمداً ندارد. تصویر واقعی در Frontend از API دیجی‌کالا درخواست می‌شود.
function searchLocalDatabase(query) {
    const products = [
        { keywords:['گوشی','سامسونگ','galaxy','موبایل','samsung'], items:[
            ['گوشی سامسونگ Galaxy S25 Ultra',85000000,'galaxy s25 ultra'],
            ['گوشی سامسونگ Galaxy S24 FE',45000000,'galaxy s24 fe'],
            ['گوشی سامسونگ Galaxy A56',30000000,'galaxy a56'],
            ['گوشی سامسونگ Galaxy Z Fold 6',120000000,'galaxy z fold 6'],
            ['گوشی سامسونگ Galaxy Z Flip 6',80000000,'galaxy z flip 6']
        ]},
        { keywords:['آیفون','اپل','iphone','apple'], items:[
            ['گوشی آیفون ۱۶ پرو مکس',95000000,'iphone 16 pro max'],
            ['گوشی آیفون ۱۶ پرو',85000000,'iphone 16 pro'],
            ['گوشی آیفون ۱۵',55000000,'iphone 15']
        ]},
        { keywords:['شیائومی','xiaomi','ردمی','redmi'], items:[
            ['گوشی شیائومی Redmi Note 14 Pro',25000000,'redmi note 14 pro'],
            ['گوشی شیائومی Poco X7 Pro',28000000,'poco x7 pro'],
            ['گوشی شیائومی ۱۵ اولترا',90000000,'xiaomi 15 ultra']
        ]},
        { keywords:['لپ تاپ','لپتاپ','laptop','نوت بوک','macbook'], items:[
            ['لپ تاپ ایسوس ROG Strix G16',85000000,'asus rog strix g16'],
            ['مک بوک پرو M3',120000000,'macbook pro m3'],
            ['لپ تاپ لنوو IdeaPad Slim 5',35000000,'lenovo ideapad slim 5'],
            ['لپ تاپ ایسوس Vivobook S15',45000000,'asus vivobook s15']
        ]},
        { keywords:['هدفون','هندزفری','ایرپاد','headphone','buds'], items:[
            ['ایرپاد پرو اپل',25000000,'airpods pro'],
            ['هدفون سونی WH-1000XM5',30000000,'sony wh-1000xm5'],
            ['هندزفری سامسونگ Galaxy Buds 3',15000000,'galaxy buds 3 pro']
        ]},
        { keywords:['ساعت','watch','اپل واچ'], items:[
            ['اپل واچ سری ۱۰',40000000,'apple watch series 10'],
            ['گلکسی واچ ۷',20000000,'galaxy watch 7'],
            ['می بند ۹ شیائومی',5000000,'mi band 9']
        ]},
        { keywords:['تبلت','آیپد','ipad','tablet'], items:[
            ['آیپد پرو ۱۳ اینچ M4',90000000,'ipad pro m4'],
            ['گلکسی تب S10 اولترا',70000000,'galaxy tab s10 ultra']
        ]},
        { keywords:['کنسول','پلی استیشن','ایکس باکس','بازی'], items:[
            ['پلی استیشن ۵ اسلیم',45000000,'playstation 5 slim'],
            ['ایکس باکس سری X',40000000,'xbox series x']
        ]}
    ];

    const queryLower = query.toLowerCase().trim();
    const results = [];
    products.forEach(category => {
        const match = category.keywords.some(k => queryLower.includes(k.toLowerCase()) || k.toLowerCase().includes(queryLower));
        if (!match) return;
        category.items.forEach(([title,price,searchQuery]) => results.push({
            id: Math.random().toString(36),
            title,
            price,
            originalPrice: price,
            image: '',
            searchQuery,
            url: `https://www.digikala.com/search/?q=${encodeURIComponent(searchQuery)}`,
            available:true,
            rating:4.5,
            reviews:Math.floor(Math.random()*100)+10,
            store:'digikala',
            storeName:'دیجیکالا'
        }));
    });
    return results.filter((p,i,a) => i === a.findIndex(x => x.title === p.title));
}
