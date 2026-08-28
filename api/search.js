// api/search.js

const DIGIKALA_PROXY = 'https://digiyar-core.petromosi.workers.dev/search';
const DIGIKALA_DIRECT = 'https://api.digikala.com/v1/search/';
const SNAPP_ENDPOINTS = [
    'https://api.snapp.shop/api/v1/search',
    'https://api.snapp.shop/api/v1/search/'
];

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(204).end();

    const q = String(req.query?.q || '').trim();
    if (!q) {
        return res.status(400).json({
            success: false,
            error: 'Query parameter is required'
        });
    }

    try {
        const [digikalaResults, snappResults] = await Promise.all([
            searchDigikala(q),
            searchSnappShop(q)
        ]);

        const allResults = [
            ...digikalaResults.map(r => ({ ...r, store: 'digikala', storeName: 'دیجی‌کالا' })),
            ...snappResults.map(r => ({ ...r, store: 'snappshop', storeName: 'اسنپ‌شاپ' }))
        ];

        const availableProducts = allResults
            .filter(p => p.available && Number(p.price) > 0)
            .sort((a, b) => Number(a.price) - Number(b.price));

        return res.json({
            success: true,
            results: availableProducts.slice(0, 3),
            total: availableProducts.length,
            query: q
        });
    } catch (error) {
        console.error('Search error:', error);
        return res.status(500).json({
            success: false,
            error: 'Search failed',
            message: error.message
        });
    }
}

async function fetchJson(url, timeout = 9000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'User-Agent': 'Mozilla/5.0'
            },
            signal: controller.signal
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } finally {
        clearTimeout(timer);
    }
}

function firstArray(...values) {
    for (const value of values) {
        if (Array.isArray(value)) return value;
    }
    return [];
}

function firstValue(...values) {
    for (const value of values) {
        if (value !== undefined && value !== null && value !== '') return value;
    }
    return '';
}

function imageFrom(product) {
    const images = product?.images;

    if (typeof images === 'string') return images;
    if (Array.isArray(images) && images.length) {
        const first = images[0];
        if (typeof first === 'string') return first;
        if (first?.url) return first.url;
    }

    if (images && typeof images === 'object') {
        const main = images.main || images.primary || images.thumbnail;
        if (Array.isArray(main)) return main[0]?.url || main[0] || '';
        if (typeof main === 'string') return main;
        if (main?.url) return main.url;
    }

    return firstValue(
        product?.image_url,
        product?.imageUrl,
        product?.thumbnail_url,
        product?.thumbnail,
        product?.photo,
        product?.cover,
        product?.image
    );
}

function numericPrice(value) {
    if (value && typeof value === 'object') {
        return Number(firstValue(
            value.selling_price,
            value.sellingPrice,
            value.final_price,
            value.finalPrice,
            value.price,
            value.amount,
            value.value
        )) || 0;
    }
    return Number(value) || 0;
}

function extractDigikalaProducts(data) {
    const payload = data?.data || data;
    const products = firstArray(
        payload?.products,
        payload?.items,
        payload?.data?.products,
        payload?.data?.items,
        data?.products,
        data?.results
    );

    return products.map(product => {
        const variant = product?.default_variant || product?.defaultVariant || {};
        const priceObject = variant?.price || product?.price;
        const rawPrice = numericPrice(priceObject) || numericPrice(product?.selling_price);
        const rawOriginal = numericPrice(priceObject?.rrp_price) || numericPrice(product?.original_price);

        // Digikala prices are normally Rial; convert to Toman for DigiYar.
        const price = rawPrice > 0 ? Math.round(rawPrice / 10) : 0;
        const originalPrice = rawOriginal > 0 ? Math.round(rawOriginal / 10) : 0;

        const id = firstValue(product?.id, product?.pk, product?.product_id);
        const title = firstValue(
            product?.title_fa,
            product?.name,
            product?.title,
            product?.product_name,
            'بدون عنوان'
        );

        return {
            id,
            title,
            price,
            originalPrice,
            image: imageFrom(product),
            url: product?.url?.startsWith('http')
                ? product.url
                : `https://www.digikala.com/product/dkp-${id}`,
            available: price > 0,
            rating: Number(product?.rating?.rate || product?.rating || 0) || 0,
            reviews: Number(product?.rating?.count || product?.reviews_count || 0) || 0
        };
    }).filter(product => product.id && product.title);
}

async function searchDigikala(query) {
    const encoded = encodeURIComponent(query);

    // Use the already-existing DigiYar proxy first. This avoids relying on
    // direct browser-style access to Digikala's changing upstream API.
    try {
        const proxyData = await fetchJson(`${DIGIKALA_PROXY}?q=${encoded}`);
        const proxyProducts = extractDigikalaProducts(proxyData);
        if (proxyProducts.length) return proxyProducts;
    } catch (error) {
        console.warn('Digikala proxy search failed:', error.message);
    }

    // Direct upstream fallback.
    try {
        const data = await fetchJson(`${DIGIKALA_DIRECT}?q=${encoded}&page=1`);
        return extractDigikalaProducts(data);
    } catch (error) {
        console.warn('Digikala direct search failed:', error.message);
        return [];
    }
}

function extractSnappProducts(data) {
    const payload = data?.data || data;
    const products = firstArray(
        payload?.products,
        payload?.results,
        payload?.items,
        payload?.data?.products,
        payload?.data?.results,
        data?.products,
        data?.results
    );

    return products.map(product => {
        const price = numericPrice(firstValue(
            product?.selling_price,
            product?.sellingPrice,
            product?.final_price,
            product?.finalPrice,
            product?.price
        ));
        const originalPrice = numericPrice(firstValue(
            product?.original_price,
            product?.originalPrice,
            product?.rrp_price,
            product?.mrp
        ));
        const id = firstValue(product?.id, product?.product_id, product?.sku);

        return {
            id,
            title: firstValue(product?.name, product?.title, product?.product_name, 'بدون عنوان'),
            price,
            originalPrice,
            image: imageFrom(product),
            url: firstValue(
                product?.product_url,
                product?.productUrl,
                product?.url,
                `https://snapp.shop/product/${id}`
            ),
            available: product?.in_stock !== undefined
                ? Boolean(product.in_stock)
                : product?.available !== undefined
                    ? Boolean(product.available)
                    : price > 0,
            rating: Number(product?.rating || 0) || 0,
            reviews: Number(product?.review_count || product?.reviews_count || 0) || 0
        };
    }).filter(product => product.id && product.title);
}

async function searchSnappShop(query) {
    const encoded = encodeURIComponent(query);

    for (const endpoint of SNAPP_ENDPOINTS) {
        try {
            const data = await fetchJson(`${endpoint}?q=${encoded}`);
            const products = extractSnappProducts(data);
            if (products.length) return products;
        } catch (error) {
            console.warn(`SnappShop search failed (${endpoint}):`, error.message);
        }
    }

    return [];
}
