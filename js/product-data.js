/* DigiYar V3 - Product Data Layer */

(function () {
  "use strict";

  /*
   * لایه داده محصولات
   *
   * این فایل عمداً از Product Scoring جداست.
   *
   * در نسخه فعلی:
   * داده‌ها نمونه هستند.
   *
   * در مراحل بعد:
   * همین ساختار می‌تواند از موتور جستجو،
   * API یا منابع دیگر تغذیه شود.
   */

  const products = [

    {
      id: "mobile-001",

      category: "mobile",

      name: "موبایل اقتصادی متعادل",

      price: 9000000,

      store: "digikala",

      productUrl:
        "https://www.digikala.com/",

      features: [
        "باتری",
        "ارزش خرید",
        "5G"
      ]
    },


    {
      id: "mobile-002",

      category: "mobile",

      name: "موبایل دوربین‌محور",

      price: 14000000,

      store: "digikala",

      productUrl:
        "https://www.digikala.com/",

      features: [
        "دوربین",
        "کیفیت",
        "5G"
      ]
    },


    {
      id: "mobile-003",

      category: "mobile",

      name: "موبایل باتری‌محور",

      price: 12000000,

      store: "snappshop",

      productUrl:
        "https://snappshop.ir/",

      features: [
        "باتری",
        "وزن کم",
        "ارزش خرید"
      ]
    },


    {
      id: "laptop-001",

      category: "laptop",

      name: "لپ‌تاپ اقتصادی",

      price: 25000000,

      store: "digikala",

      productUrl:
        "https://www.digikala.com/",

      features: [
        "ارزش خرید",
        "وزن کم",
        "SSD"
      ]
    },


    {
      id: "laptop-002",

      category: "laptop",

      name: "لپ‌تاپ کاری",

      price: 40000000,

      store: "snappshop",

      productUrl:
        "https://snappshop.ir/",

      features: [
        "کیفیت",
        "SSD",
        "باتری"
      ]
    },


    {
      id: "tablet-001",

      category: "tablet",

      name: "تبلت متعادل",

      price: 14000000,

      store: "digikala",

      productUrl:
        "https://www.digikala.com/",

      features: [
        "باتری",
        "وزن کم",
        "کیفیت"
      ]
    }

  ];


  const DigiYarProductData = {

    version: "1.0.0",

    getAll: function () {

      return products.slice();

    },


    getByCategory: function (category) {

      if (!category) {

        return products.slice();

      }

      return products.filter(
        function (product) {

          return (
            product.category ===
            category
          );

        }
      );

    },


    search: function (query) {

      if (!query) {

        return products.slice();

      }

      const text =
        String(query)
          .trim()
          .toLowerCase();


      return products.filter(
        function (product) {

          const searchableText = [

            product.name,

            product.category,

            ...(product.features || [])

          ]
            .join(" ")
            .toLowerCase();


          return searchableText.includes(
            text
          );

        }
      );

    }

  };


  window.DigiYarProductData =
    DigiYarProductData;

})();
