const CACHE_NAME = "digiyar-v3-cache-v2";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/style.css",

  "./js/app.js",
  "./js/user-profile.js",
  "./js/need-engine.js",
  "./js/product-scoring.js",
  "./js/platforms.js",

  "./icon/icon-192.png",
  "./icon/icon-512.png",

  "./assets/logos/logo.png",
  "./assets/digikala.png",
  "./assets/snappshop.png",
  "./assets/torob.png",
  "./assets/basalam.png"
];

self.addEventListener(
  "install",
  function (event) {

    event.waitUntil(
      caches
        .open(CACHE_NAME)
        .then(function (cache) {
          return cache.addAll(APP_FILES);
        })
        .then(function () {
          return self.skipWaiting();
        })
    );

  }
);

self.addEventListener(
  "activate",
  function (event) {

    event.waitUntil(

      caches
        .keys()
        .then(function (cacheNames) {

          return Promise.all(

            cacheNames.map(
              function (cacheName) {

                if (
                  cacheName !== CACHE_NAME
                ) {
                  return caches.delete(
                    cacheName
                  );
                }

                return null;
              }
            )

          );

        })
        .then(function () {
          return self.clients.claim();
        })

    );

  }
);

self.addEventListener(
  "fetch",
  function (event) {

    if (
      event.request.method !== "GET"
    ) {
      return;
    }

    event.respondWith(

      caches
        .match(event.request)
        .then(function (cachedResponse) {

          if (cachedResponse) {
            return cachedResponse;
          }

          return fetch(event.request)
            .then(function (networkResponse) {

              if (
                !networkResponse ||
                networkResponse.status !== 200 ||
                networkResponse.type !== "basic"
              ) {
                return networkResponse;
              }

              const responseClone =
                networkResponse.clone();

              caches
                .open(CACHE_NAME)
                .then(function (cache) {

                  cache.put(
                    event.request,
                    responseClone
                  );

                });

              return networkResponse;

            })
            .catch(function () {

              return caches.match(
                "./index.html"
              );

            });

        })

    );

  }
);
