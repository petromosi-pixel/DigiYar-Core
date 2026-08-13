/* DigiYar V3 - Product Scoring Engine */

(function () {
  "use strict";


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
          (
            product.features || []
          ).some(
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
          (
            product.features || []
          ).some(
            function (feature) {

              return (
                String(
                  feature
                ).toLowerCase() ===
                value
              );

            }
          );


        if (conflicts) {

          score -= 10;

        }

      }
    );


    return Math.max(
      0,
      Math.min(
        100,
        score
      )
    );

  }


  /*
   * ساخت لینک خروجی
   *
   * محصول ابتدا URL واقعی خودش را دارد.
   *
   * سپس Affiliate Manager در صورت وجود،
   * آن را به لینک افیلیت تبدیل می‌کند.
   */

  function buildProductUrl(product) {

    const productUrl =
      product.productUrl ||
      product.url ||
      "";


    if (!productUrl) {

      return "";

    }


    if (
      window.DigiYarAffiliate &&
      typeof
        window.DigiYarAffiliate.buildLink ===
        "function"
    ) {

      return window.DigiYarAffiliate.buildLink(
        product.store,
        productUrl
      );

    }


    return productUrl;

  }


  /*
   * تبدیل داده خام محصول به
   * محصول قابل استفاده در رابط کاربری
   */

  function prepareProduct(
    product,
    need
  ) {

    return {

      ...product,

      url:
        buildProductUrl(
          product
        ),

      score:
        calculateScore(
          product,
          need
        )

    };

  }


  const DigiYarProductScoring = {

    version: "4.0.0",


    score:
      calculateScore,


    prepare:
      prepareProduct,


    recommend:
      function (need) {

        if (!need) {

          return [];

        }


        if (
          !window.DigiYarProductData ||
          typeof
            window.DigiYarProductData.getAll !==
            "function"
        ) {

          console.error(
            "DigiYarProductData is not available."
          );

          return [];

        }


        const products =
          window.DigiYarProductData
            .getAll();


        return products

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

              return prepareProduct(
                product,
                need
              );

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


          .slice(
            0,
            3
          );

      }

  };


  window.DigiYarProductScoring =
    DigiYarProductScoring;

})();
