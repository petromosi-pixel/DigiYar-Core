/* DigiYar V3 - Product Scoring Engine */

(function () {
  "use strict";

  /*
   * نمونه کاتالوگ داخلی V3
   * فعلاً برای تست موتور امتیازدهی است.
   * بعداً می‌توان کاتالوگ واقعی و لینک‌های افیلیت
   * را بدون تغییر هسته موتور جایگزین کرد.
   */

  const catalog = [

    {
      id: "mobile-001",
      category: "mobile",
      name: "موبایل اقتصادی متعادل",
      price: 9000000,
      features: [
        "باتری",
        "ارزش خرید",
        "5G"
      ],
      url: "https://www.digikala.com/"
    },

    {
      id: "mobile-002",
      category: "mobile",
      name: "موبایل دوربین‌محور",
      price: 14000000,
      features: [
        "دوربین",
        "کیفیت",
        "5G"
      ],
      url: "https://www.digikala.com/"
    },

    {
      id: "mobile-003",
      category: "mobile",
      name: "موبایل باتری‌محور",
      price: 12000000,
      features: [
        "باتری",
        "وزن کم",
        "ارزش خرید"
      ],
      url: "https://www.digikala.com/"
    },

    {
      id: "laptop-001",
      category: "laptop",
      name: "لپ‌تاپ اقتصادی",
      price: 25000000,
      features: [
        "ارزش خرید",
        "وزن کم",
        "SSD"
      ],
      url: "https://www.digikala.com/"
    },

    {
      id: "laptop-002",
      category: "laptop",
      name: "لپ‌تاپ کاری",
      price: 40000000,
      features: [
        "کیفیت",
        "SSD",
        "باتری"
      ],
      url: "https://www.digikala.com/"
    },

    {
      id: "tablet-001",
      category: "tablet",
      name: "تبلت متعادل",
      price: 14000000,
      features: [
        "باتری",
        "وزن کم",
        "کیفیت"
      ],
      url: "https://www.digikala.com/"
    }

  ];


  function calculateScore(product, need) {

    let score = 0;

    if (!need) {
      return 0;
    }


    /*
     * تطابق دسته محصول
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
        need.budget.max
      ) {

        score += 30;

      } else {

        score -= 25;

      }

    }


    /*
     * اولویت‌ها و نیازهای ضروری
     */

    const wanted = [

      ...(need.priorities || []),

      ...(need.requirements || [])
        .map(function (item) {
          return item.value;
        })

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
                ) ||
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
            constraint.value || ""
          ).toLowerCase();

        const conflicts =
          product.features.some(
            function (feature) {

              return String(
                feature
              ).toLowerCase() === value;

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


  const DigiYarProductScoring = {

    version: "3.0.0",

    catalog: catalog,

    score:
      calculateScore,

    recommend:
      function (need) {

        if (!need) {
          return [];
        }


        return catalog

          .filter(
            function (product) {

              return (
                !need.category ||
                need.category ===
                product.category
              );

            }
          )

          .map(
            function (product) {

              return {

                ...product,

                score:
                  calculateScore(
                    product,
                    need
                  )

              };

            }
          )

          .sort(
            function (a, b) {

              return (
                b.score -
                a.score
              );

            }
          )

          .slice(0, 3);

      }

  };


  window.DigiYarProductScoring =
    DigiYarProductScoring;

})();
