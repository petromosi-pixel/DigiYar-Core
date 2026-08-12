/* =========================================================
   DigiYar V3
   Service Worker
   Cache Version: 3.1.0
   ========================================================= */

const CACHE_VERSION = "digiyar-v3-3.1.0";

const APP_SHELL = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./js/user-profile.js",
  "./js/need-engine.js",
  "./js/product-scoring.js",
  "./js/platforms.js",
  "./manifest.json",

  "./assets/icon-192.png",
  "./assets/icon-512.png"
];


/* =========================================================
   Install
   ========================================================= */

self.addEventListener(
  "install",
  function (event) {

    event.waitUntil(

      caches.open(CACHE_VERSION)

        .then(function (cache) {

          return cache.addAll(APP_SHELL);

        })

        .then(function () {

          return self.skipWaiting();

        })

    );

  }
);


/* =========================================================
   Activate
   ========================================================= */

self.addEventListener(
  "activate",
  function (event) {

    event.waitUntil(

      caches.keys()

        .then(function (cacheNames) {

          return Promise.all(

            cacheNames

              .filter(function (cacheName) {

                return (
                  cacheName !== CACHE_VERSION
                );

              })

              .map(function (cacheName) {

                return caches.delete(
                  cacheName
                );

              })

          );

        })

        .then(function () {

          return self.clients.claim();

        })

    );

  }
);


/* =========================================================
   Fetch
   ========================================================= */

self.addEventListener(
  "fetch",
  function (event) {

    const request = event.request;

    /*
     * فقط درخواست‌های GET
     */
    if (request.method !== "GET") {
      return;
    }

    /*
     * برای درخواست‌های خارجی مثل
     * Google یا فروشگاه‌ها،
     * Service Worker دخالت نمی‌کند.
     */
    const url = new URL(
      request.url
    );

    if (
      url.origin !==
      self.location.origin
    ) {
      return;
    }


    /*
     * Network First
     *
     * ابتدا نسخه جدید را از GitHub Pages
     * می‌گیرد.
     *
     * اگر اینترنت در دسترس نبود،
     * نسخه ذخیره‌شده را استفاده می‌کند.
     */

    event.respondWith(

      fetch(request)

        .then(function (response) {

          /*
           * فقط پاسخ معتبر را Cache کن
           */

          if (
            response &&
            response.status === 200 &&
            response.type === "basic"
          ) {

            const responseClone =
              response.clone();

            caches.open(
              CACHE_VERSION
            )
              .then(function (cache) {

                cache.put(
                  request,
                  responseClone
                );

              });

          }

          return response;

        })

        .catch(function () {

          return caches.match(
            request
          );

        })

    );

  }
);
