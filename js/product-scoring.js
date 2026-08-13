/* =========================================================
   DigiYar V3
   Product Scoring Engine
   Version: 3.1.0
   ========================================================= */

(function () {

  "use strict";


  /*
   * =======================================================
   * کاتالوگ نمونه
   * =======================================================
   *
   * این کاتالوگ فعلاً برای تست موتور است.
   *
   * در نسخه‌های بعدی، محصولات واقعی از منابع جستجو
   * وارد همین ساختار خواهند شد.
   *
   * store:
   *   شناسه فروشگاه
   *
   * productUrl:
   *   لینک مستقیم صفحه محصول
   *
   */

  const catalog = [

    {
      id: "mobile-001",

      category: "mobile",

      name:
        "موبایل اقتصادی متعادل",

      price:
        9000000,

      features: [
        "باتری",
        "ارزش خرید",
        "5G"
      ],

      store:
        "digikala",

      productUrl:
        "https://www.digikala.com/"

    },


    {
      id: "mobile-002",

      category: "mobile",

      name:
        "موبایل دوربین‌محور",

      price:
        14000000,

      features: [
        "دوربین",
        "کیفیت",
        "5G"
      ],

      store:
        "digikala",

      productUrl:
        "https://www.digikala.com/"

    },


    {
      id: "mobile-003",

      category: "mobile",

      name:
        "موبایل باتری‌محور",

      price:
        12000000,

      features: [
        "باتری",
        "وزن کم",
        "ارزش خرید"
      ],

      store:
        "snappshop",

      productUrl:
        "https://snappshop.ir/"

    },


    {
      id: "laptop-001",

      category: "laptop",

      name:
        "لپ‌تاپ اقتصادی",

      price:
        25000000,

      features: [
        "ارزش خرید",
        "وزن کم",
        "SSD"
      ],

      store:
        "digikala",

      productUrl:
        "https://www.digikala.com/"

    },


    {
      id: "laptop-002",

      category: "laptop",

      name:
        "لپ‌تاپ کاری",

      price:
        40000000,

      features: [
        "کیفیت",
        "SSD",
        "باتری"
      ],

      store:
        "snappshop",

      productUrl:
        "https://snappshop.ir/"

    },


    {
      id: "tablet-001",

      category: "tablet",

      name:
        "تبلت متعادل",

      price:
        14000000,

      features: [
        "باتری",
        "وزن کم",
        "کیفیت"
      ],

      store:
        "digikala",

      productUrl:
        "https://www.digikala.com/"

    }

  ];


  /*
   * =======================================================
   * ساخت لینک خروجی محصول
   * =======================================================
   */

  function buildProductLink(
    product
  ) {

    if (!product) {
      return "";
    }


    /*
     * لینک مستقیم محصول
     */

    const productUrl =
      product.productUrl ||
      product.url ||
      "";


    /*
     * اگر لینک محصول وجود نداشته باشد،
     * خروجی خالی است.
     */

    if (!productUrl) {
      return "";
    }


    /*
     * اگر Affiliate Manager وجود داشته باشد،
     * لینک افیلیت ساخته می‌شود.
     */

    if (
      window.DigiYarAffiliate &&
      typeof
        window.DigiYarAffiliate.buildLink ===
        "function"
    ) {

      return
        window.DigiYarAffiliate.buildLink(
          product.store,
          productUrl
        );

    }


    /*
     * حالت پشتیبان
     */

    return productUrl;

  }


  /*
   * =======================================================
   * محاسبه امتیاز
   * =======================================================
   */

  function calculateScore(
    product,
    need
  ) {

    let score = 0;


    if (!need) {
      return 0;
    }


    /*
     * تطابق دسته
     */

    if (
      need.category ===
      product.category
    ) {

      score += 30;

    }


    /*
     * تطابق بودجه
     */

    if (
      need.budget &&
      need.budget.max
    ) {

      if (
        product.price <=
        Number(
          need.budget.max
        )
      ) {

        score += 30;

      }

    }


    /*
     * اولویت‌ها و نیازهای ضروری
     */

    const wanted = [

      ...(need.priorities || []),

      ...(need.requirements || [])
        .map(
          function (item) {

            return item.value;

          }
        )

    ];


    wanted.forEach(
      function (wantedItem) {

        const wantedText =
          String(
            wantedItem
          ).toLowerCase();


        const matched =
          product.features.some(
            function (feature) {

              const featureText =
                String(
                  feature
                ).toLowerCase();


              return (

                featureText.includes(
                  wantedText
                )

                ||

                wantedText.includes(
                  featureText
                )

              );

            }
          );


        if (matched) {

          score += 8;

        }

      }
    );


    /*
     * محدودیت‌ها
     */

    const constraints =
      need.constraints || [];


    constraints.forEach(
      function (constraint) {

        const value =
          String(
            constraint.value ||
            ""
          ).toLowerCase();


        const conflicts =
          product.features.some(
            function (feature) {

              return (

                String(
                  feature
                ).toLowerCase()
                ===
                value

              );

            }
          );


        if (conflicts) {

          score -= 10;

        }

      }
    );


    /*
     * محدود کردن امتیاز
     */

    return Math.max(

      0,

      Math.min(
        100,
        score
      )

    );

  }


  /*
   * =======================================================
   * موتور اصلی
   * =======================================================
   */

  const DigiYarProductScoring = {

    version:
      "3.1.0",


    catalog:
      catalog,


    score:
      calculateScore,


    buildProductLink:
      buildProductLink,


    recommend:
      function (need) {

        if (!need) {
          return [];
        }


        return catalog

          /*
           * فیلتر دسته
           */

          .filter(
            function (product) {

              if (

                need.category &&

                need.category !==
                product.category

              ) {

                return false;

              }


              return true;

            }
          )


          /*
           * فیلتر بودجه
           */

          .filter(
            function (product) {

              if (

                need.budget &&

                need.budget.max

              ) {

                return (

                  product.price <=
                  Number(
                    need.budget.max
                  )

                );

              }


              return true;

            }
          )


          /*
           * محاسبه امتیاز
           */

          .map(
            function (product) {

              return {

                ...product,

                url:
                  buildProductLink(
                    product
                  ),

                score:
                  calculateScore(
                    product,
                    need
                  )

              };

            }
          )


          /*
           * مرتب‌سازی
           */

          .sort(
            function (a, b) {

              return (

                b.score -
                a.score

              );

            }
          )


          /*
           * سه پیشنهاد برتر
           */

          .slice(
            0,
            3
          );

      }

  };


  /*
   * =======================================================
   * انتشار موتور
   * =======================================================
   */

  window.DigiYarProductScoring =
    DigiYarProductScoring;


})();
