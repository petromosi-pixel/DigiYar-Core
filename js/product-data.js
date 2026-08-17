/* =========================================================
   DigiYar V4
   Product Data Layer
   Build 10 — unified local catalog
   ========================================================= */

(function () {

  "use strict";

  const products = [

    {
      id: "mobile-001",
      name: "موبایل اقتصادی متعادل",
      category: "mobile",
      price: 9000000,
      store: "digikala",
      productUrl: "https://www.digikala.com/",
      affiliateUrl: "",
      image: "",
      features: ["باتری", "ارزش خرید", "5G"]
    },

    {
      id: "mobile-002",
      name: "موبایل دوربین‌محور",
      category: "mobile",
      price: 14000000,
      store: "digikala",
      productUrl: "https://www.digikala.com/",
      affiliateUrl: "",
      image: "",
      features: ["دوربین", "کیفیت", "5G"]
    },

    {
      id: "mobile-003",
      name: "موبایل باتری‌محور",
      category: "mobile",
      price: 12000000,
      store: "snappshop",
      productUrl: "https://snapp.shop/",
      affiliateUrl: "",
      image: "",
      features: ["باتری", "وزن کم", "ارزش خرید"]
    },

    {
      id: "laptop-001",
      name: "لپ‌تاپ اقتصادی",
      category: "laptop",
      price: 25000000,
      store: "digikala",
      productUrl: "https://www.digikala.com/",
      affiliateUrl: "",
      image: "",
      features: ["ارزش خرید", "وزن کم", "SSD"]
    },

    {
      id: "laptop-002",
      name: "لپ‌تاپ کاری",
      category: "laptop",
      price: 40000000,
      store: "digikala",
      productUrl: "https://www.digikala.com/",
      affiliateUrl: "",
      image: "",
      features: ["کیفیت", "SSD", "باتری"]
    },

    {
      id: "tablet-001",
      name: "تبلت متعادل",
      category: "tablet",
      price: 14000000,
      store: "digikala",
      productUrl: "https://www.digikala.com/",
      affiliateUrl: "",
      image: "",
      features: ["باتری", "وزن کم", "کیفیت"]
    }

  ];


  function normalizeText(value) {

    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/ي/g, "ی")
      .replace(/ك/g, "ک");

  }


  function matches(product, query) {

    const text = [
      product.name,
      product.category,
      product.store,
      ...(Array.isArray(product.features)
        ? product.features
        : [])
    ]
      .map(normalizeText)
      .join(" ");

    return text.includes(
      normalizeText(query)
    );

  }


  function search(query, options) {

    const normalizedQuery =
      normalizeText(query);

    if (!normalizedQuery) {
      return [];
    }

    const settings = options || {};
    const limit = Number(settings.limit) > 0
      ? Number(settings.limit)
      : products.length;

    return products
      .filter(function (product) {
        return matches(product, normalizedQuery);
      })
      .slice(0, limit);

  }


  const DigiYarProductData = {

    version: "4.0.0-alpha.3",

    products: products,

    getAll: function () {
      return products.slice();
    },

    getById: function (id) {
      return products.find(function (product) {
        return product.id === id;
      }) || null;
    },

    getByStore: function (store) {
      return products.filter(function (product) {
        return product.store === store;
      });
    },

    getByCategory: function (category) {
      return products.filter(function (product) {
        return product.category === category;
      });
    },

    search: search

  };

  window.DigiYarProductData =
    DigiYarProductData;

})();
