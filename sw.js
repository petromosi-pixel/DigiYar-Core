const CACHE_NAME = "digiyar-v3-cache-v1";

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
  "./assets/icon-192.png",
"./assets/icon-512.png"
];


/*
 * Install
 */

self.addEventListener(
  "install",
  function (event) {

    event.waitUntil(

      caches
        .open(CACHE_NAME)
        .then(function (cache) {

          return cache.addAll(
            APP_FILES
          );

        })
        .then(function () {

          return self.skipWaiting();

        })

    );

  }
);


/*
 * Activate
 */

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
                  cacheName !==
                  CACHE_NAME
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


/*
 * Fetch
 */

self.addEventListener(
  "fetch",
  function (event) {

    if (
      event.request.method !==
      "GET"
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


          return fetch(
            event.request
          )
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
