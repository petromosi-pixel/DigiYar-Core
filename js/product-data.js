/* DigiYar V3 - Product Data Layer */

(function () {
  "use strict";


  /*
   * =========================================================
   * Product Catalog
   * =========================================================
   */

  const products = [

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


  /*
   * =========================================================
   * ابزار نرمال‌سازی متن
   * =========================================================
   */

  function normalizeText(value) {

    return String(
      value || ""
    )
      .trim()
      .toLowerCase();

  }


  /*
   * =========================================================
   * جستجو در کاتالوگ
   * =========================================================
   *
   * جستجو در:
   *
   * 1. نام محصول
   * 2. دسته محصول
   * 3. فروشگاه
   * 4. ویژگی‌ها
   *
   * =========================================================
   */

  function search(query) {

    const normalizedQuery =
      normalizeText(query);


    if (!normalizedQuery) {

      return [];

    }


    return products.filter(
      function (product) {

        const name =
          normalizeText(
            product.name
          );


        const category =
          normalizeText(
            product.category
          );


        const store =
          normalizeText(
            product.store
          );


        const features =
          Array.isArray(
            product.features
          )
            ? product.features
                .map(normalizeText)
                .join(" ")
            : "";


        return (

          name.includes(
            normalizedQuery
          ) ||

          category.includes(
            normalizedQuery
          ) ||

          store.includes(
            normalizedQuery
          ) ||

          features.includes(
            normalizedQuery
          )

        );

      }
    );

  }


  /*
   * =========================================================
   * Product Data API
   * =========================================================
   */

  const DigiYarProductData = {

    version:
      "3.1.1",


    products:
      products,


    /*
     * تمام محصولات
     */

    getAll:
      function () {

        return products.slice();

      },


    /*
     * دریافت محصول با ID
     */

    getById:
      function (id) {

        return products.find(
          function (product) {

            return (
              product.id === id
            );

          }
        ) || null;

      },


    /*
     * دریافت محصولات یک فروشگاه
     */

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


    /*
     * دریافت محصولات یک دسته
     */

    getByCategory:
      function (category) {

        return products.filter(
          function (product) {

            return (
              product.category === category
            );

          }
        );

      },


    /*
     * جستجوی محصول
     */

    search:
      search

  };


  /*
   * =========================================================
   * انتشار API
   * =========================================================
   */

  window.DigiYarProductData =
    DigiYarProductData;


})();
