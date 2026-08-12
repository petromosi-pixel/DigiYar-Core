const CACHE="digiyar-v3";
const ASSETS=["./","./index.html","./css/style.css","./js/platforms.js","./js/user-profile.js","./js/affiliate-resolver.js","./js/product-source.js","./js/product-catalog.js","./js/product-scoring.js","./js/need-engine.js","./js/digiyar-engine.js","./js/app.js","./data/products.json"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request)))});
