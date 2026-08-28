// api/digikala-diagnostic.js
// Temporary diagnostic endpoint: tests Digikala routes from Vercel.

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const q = req.query?.q || 'گوشی';
    const results = [];

    async function probe(name, url, options = {}) {
        const started = Date.now();
        try {
            const response = await fetch(url, {
                redirect: options.redirect || 'manual',
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36'
                }
            });
            const text = await response.text();
            let json = null;
            try { json = JSON.parse(text); } catch (_) {}

            results.push({
                name,
                status: response.status,
                ok: response.ok,
                location: response.headers.get('location'),
                contentType: response.headers.get('content-type'),
                elapsedMs: Date.now() - started,
                bytes: text.length,
                topLevelKeys: json && typeof json === 'object' ? Object.keys(json).slice(0, 20) : [],
                dataKeys: json?.data && typeof json.data === 'object' ? Object.keys(json.data).slice(0, 20) : [],
                preview: text.slice(0, 300)
            });
            return json;
        } catch (error) {
            results.push({
                name,
                status: null,
                ok: false,
                elapsedMs: Date.now() - started,
                error: error?.message || String(error)
            });
            return null;
        }
    }

    // 1) The route that currently returns 307 in our Worker tests.
    await probe(
        'v1-search-manual-redirect',
        `https://api.digikala.com/v1/search/?q=${encodeURIComponent(q)}&page=1`,
        { redirect: 'manual' }
    );

    // 2) Autocomplete is useful because it can reveal the current category ID
    // and the keyword expected by Search API V2.
    const autocomplete = await probe(
        'v1-autocomplete',
        `https://api.digikala.com/v1/autocomplete/?q=${encodeURIComponent(q)}`,
        { redirect: 'follow' }
    );

    let categoryId = null;
    let categoryKeyword = q;

    const categories = autocomplete?.data?.categories;
    if (Array.isArray(categories) && categories.length) {
        const first = categories.find(x => x?.category?.id) || categories[0];
        categoryId = first?.category?.id || null;
        categoryKeyword = first?.keyword || q;
    }

    // 3) Current Search API V2 route. Category ID is taken from autocomplete
    // instead of guessing it.
    if (categoryId) {
        await probe(
            `v2-category-${categoryId}`,
            `https://api.digikala.com/v2/category/${encodeURIComponent(categoryId)}/?q=${encodeURIComponent(categoryKeyword)}&page=1&sort=1`,
            { redirect: 'follow' }
        );
    } else {
        results.push({
            name: 'v2-category-derived',
            skipped: true,
            reason: 'autocomplete returned no category id'
        });
    }

    // 4) Product detail route using a known public product ID format.
    await probe(
        'v2-product-known-id',
        'https://api.digikala.com/v2/product/17464490/',
        { redirect: 'follow' }
    );

    res.status(200).json({
        success: true,
        query: q,
        derived: { categoryId, categoryKeyword },
        checks: results
    });
}
