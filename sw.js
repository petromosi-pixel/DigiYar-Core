/* =========================================================
   DigiYar V5
   Service Worker
   Cache Version: 5.0.2
   ========================================================= */

const CACHE_VERSION = "digiyar-v5-5.0.2";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/style.css",
  "./css/v5-splash.css",
  "./css/v5-step2-header.css",
  "./css/v5-ui.css",
  "./css/v5-step4.css",
  "./css/v5-step4-toggle-direction.css",
  "./css/v5-smart-search.css",
  "./js/product-data.js",
  "./js/product-retrieval.js",
  "./js/price-policy.js",
  "./js/product-price-bridge.js",
  "./js/search-engine.js",
  "./js/product-scoring.js",
  "./js/smart-recommendation-engine.js",
  "./js/user-profile.js",
  "./js/need-engine.js",
  "./js/platforms.js",
  "./js/app.js",
  "./js/conversation-engine.js",
  "./js/price-policy-bridge.js",
  "./js/product-retrieval-integration.js",
  "./js/web-conversation-ui.js",
  "./js/v5-splash-fix.js",
  "./js/v5-ui.js",
  "./js/v5-step4-final.js",
  "./js/v5-step4-patch.js",
  "./js/v5-footer.js",
  "./js/v5-smart-search.js",
  "./icon/icon-512.png",
  "./assets/logos/logo.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(function (cache) { return cache.addAll(APP_SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (cacheNames) {
        return Promise.all(
          cacheNames
            .filter(function (cacheName) { return cacheName !== CACHE_VERSION; })
            .map(function (cacheName) { return caches.delete(cacheName); })
        );
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (event) {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then(function (response) {
        if (response && response.status === 200 && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(function (cache) {
            return cache.put(request, clone);
          }).catch(function () {});
        }
        return response;
      })
      .catch(function () { return caches.match(request); })
  );
});
