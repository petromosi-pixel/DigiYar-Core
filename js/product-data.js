/* DigiYar V3 - Product Data Layer */

(function () {
  "use strict";

  /*
   * =========================================================
   * DigiYar Product Data
   * =========================================================
   *
   * ساختار استاندارد محصول:
   *
   * id
   * name
   * category
   * price
   * store
   * productUrl
   * image
   * features
   *
   * store:
   * نام داخلی فروشگاه
   *
   * productUrl:
   * لینک مستقیم صفحه همان محصول در فروشگاه
   *
   * بعداً Affiliate Manager همین
   * productUrl را به لینک افیلیت تبدیل می‌کند.
   * =========================================================
   */

  const products = [

    /* =======================================================
       DigiKala
       ======================================================= */

    {
      id: "mobile-001",

      name:
        "موبایل اقتصادی متعادل",

      category:
        "mobile",

      price:
        9000000,

      store:
        "digikala",

      productUrl:
        "https://www.digikala.com/",

      image:
        "",

      features: [
        "باتری",
        "ارزش خرید",
        "5G"
      ]
    },


    {
      id: "mobile-002",

      name:
        "موبایل دوربین‌محور",

      category:
        "mobile",

      price:
        14000000,

      store:
        "digikala",

      productUrl:
        "https://www.digikala.com/",

      image:
        "",

      features: [
        "دوربین",
        "کیفیت",
        "5G"
      ]
    },


    /* =======================================================
       SnappShop
       ======================================================= */

    {
      id: "mobile-003",

      name:
        "موبایل باتری‌محور",

      category:
        "mobile",

      price:
        12000000,

      store:
        "snappshop",

      productUrl:
        "https://snappshop.ir/",

      image:
        "",

      features: [
        "باتری",
        "وزن کم",
        "ارزش خرید"
      ]
    },


    /* =======================================================
       Laptop
       ======================================================= */

    {
      id: "laptop-001",

      name:
        "لپ‌تاپ اقتصادی",

      category:
        "laptop",

      price:
        25000000,

      store:
        "digikala",

      productUrl:
        "https://www.digikala.com/",

      image:
        "",

      features: [
        "ارزش خرید",
        "وزن کم",
        "SSD"
      ]
    },


    {
      id: "laptop-002",

      name:
        "لپ‌تاپ کاری",

      category:
        "laptop",

      price:
        40000000,

      store:
        "digikala",

      productUrl:
        "https://www.digikala.com/",

      image:
        "",

      features: [
        "کیفیت",
        "SSD",
        "باتری"
      ]
    },


    /* =======================================================
       Tablet
       ======================================================= */

    {
      id: "tablet-001",

      name:
        "تبلت متعادل",

      category:
        "tablet",

      price:
        14000000,

      store:
        "digikala",

      productUrl:
        "https://www.digikala.com/",

      image:
        "",

      features: [
        "باتری",
        "وزن کم",
        "کیفیت"
      ]
    }

  ];


  /* =========================================================
     Product Data API
     ========================================================= */

  const DigiYarProductData = {

    version:
      "3.1.0",

    products:
      products,

    getAll:
      function () {

        return products.slice();

      },

    getById:
      function (id) {

        return products.find(
          function (product) {

            return product.id === id;

          }
        ) || null;

      },

    getByStore:
      function (store) {

        return products.filter(
          function (product) {

            return (
              product.store === store
            );

          }
        );

      },

    getByCategory:
      function (category) {

        return products.filter(
          function (product) {

            return (
              product.category === category
            );

          }
        );

      }

  };


  window.DigiYarProductData =
    DigiYarProductData;


})();
