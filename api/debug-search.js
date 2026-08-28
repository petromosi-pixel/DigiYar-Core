// Temporary diagnostic endpoint for DigiYar Smart Search.
// GET /api/debug-search?q=گوشی
// This file is intentionally isolated from api/search.js and the V5 UI.

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') return res.status(204).end();

    const q = String(req.query?.q || 'گوشی').trim();
    const encoded = encodeURIComponent(q);

    const checks = await Promise.all([
        inspect('digikala-proxy', `https://digiyar-core.petromosi.workers.dev/search?q=${encoded}`),
        inspect('digikala-direct', `https://api.digikala.com/v1/search/?q=${encoded}&page=1`),
        inspect('snappshop', `https://api.snapp.shop/api/v1/search?q=${encoded}`)
    ]);

    return res.status(200).json({
        success: true,
        query: q,
        checks
    });
}

async function inspect(name, url) {
    const started = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'User-Agent': 'Mozilla/5.0'
            },
            signal: controller.signal
        });

        const text = await response.text();
        let json = null;
        try { json = JSON.parse(text); } catch (_) {}

        return {
            name,
            status: response.status,
            ok: response.ok,
            contentType: response.headers.get('content-type') || '',
            elapsedMs: Date.now() - started,
            bodyLength: text.length,
            topLevelKeys: json && typeof json === 'object' ? Object.keys(json).slice(0, 30) : [],
            dataKeys: json?.data && typeof json.data === 'object' ? Object.keys(json.data).slice(0, 30) : [],
            productCount: countProducts(json),
            bodyPreview: text.slice(0, 500)
        };
    } catch (error) {
        return {
            name,
            status: null,
            ok: false,
            elapsedMs: Date.now() - started,
            error: error?.name === 'AbortError' ? 'TIMEOUT' : String(error?.message || error)
        };
    } finally {
        clearTimeout(timer);
    }
}

function countProducts(json) {
    const candidates = [
        json?.data?.products,
        json?.data?.items,
        json?.data?.results,
        json?.products,
        json?.items,
        json?.results
    ];

    for (const value of candidates) {
        if (Array.isArray(value)) return value.length;
    }

    return 0;
}
