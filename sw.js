/* =========================================================
   DigiYar V4
   Service Worker
   Cache Version: 4.0.0-alpha.3
   ========================================================= */

const CACHE_VERSION = "digiyar-v4-alpha3-1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./css/style.css",

  /* Core */
  "./js/app.js",
  "./js/user-profile.js",
  "./js/need-engine.js",

  /* Product pipeline */
  "./js/product-data.js",
  "./js/product-retrieval.js",
  "./js/product-scoring.js",
  "./js/smart-recommendation-engine.js",

  /* UI */
  "./js/platforms.js",
  "./manifest.json",

  /* Icons */
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/logos/logo.png"
];


/* =========================================================
   Install
   ========================================================= */

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


/* =========================================================
   Activate
   ========================================================= */

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


/* =========================================================
   Fetch
   ========================================================= */

self.addEventListener("fetch", function (event) {

  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  /* فقط منابع همان دامنه */
  if (url.origin !== self.location.origin) {
    return;
  }

  /*
   * Network First:
   * نسخه تازه اولویت دارد و در صورت قطعی اینترنت
   * نسخه cache شده استفاده می‌شود.
   */
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
            .catch(function () {
              /* Cache failure must not break the response. */
            });

        }

        return response;

      })
      .catch(function () {
        return caches.match(request);
      })

  );

});
