/* =========================================================
   DigiYar V3
   Product Retrieval Layer
   ========================================================= */

(function () {

  "use strict";


  /* =======================================================
     Configuration
     ======================================================= */

  const CONFIG = {

    digikalaSearchEndpoint:
      "https://api.digikala.com/v1/search/?q=",

    timeout:
      7000,

    maxResults:
      20

  };


  /* =======================================================
     Helpers
     ======================================================= */

  function normalizeText(value) {

    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/ي/g, "ی")
      .replace(/ك/g, "ک");

  }


  function safeNumber(value) {

    const number =
      Number(value);

    return Number.isFinite(number)
      ? number
      : 0;

  }


  function normalizeProduct(product) {

    if (!product) {
      return null;
    }


    const id =
      product.id ||
      product.pk ||
      product.product_id ||
      "";


    const name =
      product.name ||
      product.title ||
      "";


    const price =
      safeNumber(
        product.price ??
        product.default_variant_price ??
        product.selling_price
      );


    const productUrl =
      product.productUrl ||
      product.url ||
      product.product_url ||
      "";


    const image =
      product.image ||
      product.image_url ||
      product.thumbnail ||
      "";


    const features =
      Array.isArray(product.features)
        ? product.features.slice()
        : [];


    return {

      id:
        String(id),

      name:
        String(name),

      category:
        product.category ||
        "general",

      price:
        price,

      store:
        product.store ||
        "digikala",

      productUrl:
        productUrl,

      affiliateUrl:
        product.affiliateUrl ||
        "",

      image:
        image,

      features:
        features

    };

  }


  /* =======================================================
     Local Fallback
     ======================================================= */

  function localSearch(query) {

    if (
      !window.DigiYarProductData ||
      typeof
        window.DigiYarProductData.search !==
        "function"
    ) {

      return [];

    }


    const results =
      window.DigiYarProductData
        .search(
          query
        );


    if (
      !Array.isArray(results)
    ) {

      return [];

    }


    return results
      .map(normalizeProduct)
      .filter(Boolean);

  }


  /* =======================================================
     Fetch With Timeout
     ======================================================= */

  async function fetchWithTimeout(
    url,
    timeout
  ) {

    const controller =
      new AbortController();


    const timer =
      setTimeout(
        function () {

          controller.abort();

        },
        timeout
      );


    try {

      const response =
        await fetch(
          url,
          {
            method: "GET",

            headers: {
              "Accept":
                "application/json"
            },

            signal:
              controller.signal
          }
        );


      clearTimeout(timer);


      if (
        !response.ok
      ) {

        throw new Error(
          "HTTP " +
          response.status
        );

      }


      return await response.json();

    } catch (error) {

      clearTimeout(timer);

      throw error;

    }

  }


  /* =======================================================
     Digikala Response Parser
     ======================================================= */

  function extractDigikalaProducts(
    data
  ) {

    if (!data) {
      return [];
    }


    /*
     * ساختار API ممکن است در آینده
     * تغییر کند؛ بنابراین چند مسیر
     * احتمالی را بررسی می‌کنیم.
     */

    const candidates = [

      data.data &&
      data.data.products,

      data.data &&
      data.data.items,

      data.products,

      data.items,

      data.data &&
      data.data.products &&
      data.data.products.data

    ];


    let products = [];


    for (
      let i = 0;
      i < candidates.length;
      i++
    ) {

      if (
        Array.isArray(
          candidates[i]
        )
      ) {

        products =
          candidates[i];

        break;

      }

    }


    return products
      .map(
        function (product) {

          /*
           * تبدیل ساختار احتمالی
           * دیجی‌کالا به ساختار
           * استاندارد دیجی‌یار
           */

          return normalizeProduct({

            id:
              product.id ||
              product.pk,

            name:
              product.title ||
              product.name,

            category:
              product.category ||
              "general",

            price:
              product.price ||
              (
                product.default_variant &&
                product.default_variant.price
              ),

            store:
              "digikala",

            productUrl:
              product.url ||
              product.product_url ||
              "",

            image:
              product.image ||
              product.image_url ||
              (
                product.images &&
                product.images.main
              ),

            features:
              product.features ||
              []

          });

        }
      )
      .filter(Boolean)
      .slice(
        0,
        CONFIG.maxResults
      );

  }


  /* =======================================================
     Remote Search
     ======================================================= */

  async function searchRemote(
    query
  ) {

    const normalizedQuery =
      normalizeText(query);


    if (!normalizedQuery) {

      return [];

    }


    const url =
      CONFIG.digikalaSearchEndpoint +
      encodeURIComponent(
        normalizedQuery
      );


    const data =
      await fetchWithTimeout(
        url,
        CONFIG.timeout
      );


    return extractDigikalaProducts(
      data
    );

  }


  /* =======================================================
     Main Retrieval
     ======================================================= */

  async function search(
    query,
    options
  ) {

    const normalizedQuery =
      normalizeText(query);


    if (!normalizedQuery) {

      return [];

    }


    const settings =
      options || {};


    /*
     * اگر صراحتاً local خواسته شد،
     * فقط از داده داخلی استفاده می‌کنیم.
     */

    if (
      settings.remote === false
    ) {

      return localSearch(
        normalizedQuery
      );

    }


    /*
     * ابتدا منبع واقعی
     */

    try {

      const remoteResults =
        await searchRemote(
          normalizedQuery
        );


      if (
        remoteResults.length
      ) {

        return remoteResults;

      }

    } catch (error) {

      console.warn(
        "DigiYar Product Retrieval:",
        "Remote source unavailable.",
        error
      );

    }


    /*
     * Fail-safe:
     * بازگشت به Product Data داخلی
     */

    return localSearch(
      normalizedQuery
    );

  }


  /* =======================================================
     Public API
     ======================================================= */

  const DigiYarProductRetrieval = {

    version:
      "1.0.0",

    search:
      search,

    searchRemote:
      searchRemote,

    localSearch:
      localSearch

  };


  window.DigiYarProductRetrieval =
    DigiYarProductRetrieval;


})();
