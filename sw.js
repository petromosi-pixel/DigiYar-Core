/* =========================================================
   DigiYar V4
   Service Worker
   Cache Version: 4.0.0-alpha.8
   ========================================================= */

const CACHE_VERSION = "digiyar-v4-alpha8-1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./css/style.css",

  /* Core */
  "./js/app.js",
  "./js/user-profile.js",
  "./js/need-engine.js",
  "./js/conversation-engine.js",

  /* Product pipeline */
  "./js/product-data.js",
  "./js/product-retrieval.js",
  "./js/search-engine.js",
  "./js/product-scoring.js",
  "./js/smart-recommendation-engine.js",

  /* UI */
  "./js/platforms.js",
  "./js/web-conversation-ui.js",
  "./manifest.json",

  /* Icons */
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/logos/logo.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(function (cache) {
        return cache.addAll(APP_SHELL);
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (cacheNames) {
        return Promise.all(
          cacheNames
            .filter(function (cacheName) {
              return cacheName !== CACHE_VERSION;
            })
            .map(function (cacheName) {
              return caches.delete(cacheName);
            })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
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
        if (
          response &&
          response.status === 200 &&
          response.type === "basic"
        ) {
          const clone = response.clone();
          caches.open(CACHE_VERSION)
            .then(function (cache) {
              return cache.put(request, clone);
            })
            .catch(function () {});
        }

        return response;
      })
      .catch(function () {
        return caches.match(request);
      })
  );
});
