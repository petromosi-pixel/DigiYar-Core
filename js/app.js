/* =========================================================
   DigiYar V4
   Main Application
   Core Integration
   ========================================================= */

(function () {

  "use strict";


  /* =======================================================
     Helpers
     ======================================================= */

  function $(id) {
    return document.getElementById(id);
  }


  function escapeHTML(value) {

    return String(value ?? "").replace(
      /[&<>"']/g,
      function (character) {

        const entities = {

          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;"

        };

        return entities[character];

      }
    );

  }


  /* =======================================================
     Splash Screen
     ======================================================= */

  const splashScreen =
    $("splashScreen");


  function hideSplash() {

    if (!splashScreen) {
      return;
    }

    splashScreen.classList.add(
      "splash-hidden"
    );

    setTimeout(
      function () {

        if (splashScreen) {
          splashScreen.remove();
        }

      },
      700
    );

  }


  const splashStartedAt =
    performance.now();

  const MIN_SPLASH_TIME = 3200;
  const MAX_SPLASH_TIME = 4500;


  function finishSplash() {

    const elapsed =
      performance.now() -
      splashStartedAt;

    const remaining =
      Math.max(
        0,
        MIN_SPLASH_TIME - elapsed
      );

    setTimeout(
      hideSplash,
      remaining
    );

  }


  if (
    document.readyState ===
    "complete"
  ) {

    finishSplash();

  } else {

    window.addEventListener(
      "load",
      finishSplash,
      {
        once: true
      }
    );

  }


  setTimeout(
    function () {

      if (
        splashScreen &&
        document.body.contains(
          splashScreen
        )
      ) {

        hideSplash();

      }

    },
    MAX_SPLASH_TIME
  );


  /* =======================================================
     Shopping Platforms
     ======================================================= */

  function renderPlatforms() {

    const container =
      $("platforms");

    if (
      !container ||
      !window.DigiYarPlatforms
    ) {

      return;

    }


    container.innerHTML =
      DigiYarPlatforms.map(
        function (platform) {

          return `

            <a
              class="platform"
              href="${escapeHTML(
                platform.url
              )}"
              target="_blank"
              rel="noopener noreferrer"
            >

              <div class="platform-main">

                <div class="platform-logo">

                  <img
                    src="${escapeHTML(
                      platform.logo
                    )}"
                    alt="${escapeHTML(
                      platform.name
                    )}"
                    loading="lazy"
                  >

                </div>


                <span class="platform-name">
                  ${escapeHTML(
                    platform.name
                  )}
                </span>


                <span class="platform-tag">
                  ${escapeHTML(
                    platform.tag
                  )}
                </span>

              </div>


              <span class="platform-btn">
                ورود به فروشگاه
              </span>

            </a>

          `;

        }
      ).join("");

  }


  /* =======================================================
     Product Retrieval Adapter
     ======================================================= */

  function retrieveProducts(need) {

    let products = [];


    /*
     * اول تلاش برای استفاده از Product Retrieval
     */

    if (
      window.DigiYarProductRetrieval
    ) {

      try {

        if (
          typeof DigiYarProductRetrieval.search ===
          "function"
        ) {

          products =
            DigiYarProductRetrieval.search(
              need.category
            );

        }

      }

      catch (error) {

        console.warn(
          "DigiYar Product Retrieval:",
          error
        );

        products = [];

      }

    }


    /*
     * Fallback به Product Data محلی
     *
     * این بخش عمداً باقی می‌ماند تا اگر
     * Retrieval خارجی در دسترس نبود،
     * هسته پیشنهاددهی متوقف نشود.
     */

    if (
      !Array.isArray(products) ||
      !products.length
    ) {

      if (
        window.DigiYarProductData &&
        typeof DigiYarProductData.getByCategory ===
          "function"
      ) {

        products =
          DigiYarProductData.getByCategory(
            need.category
          );

      }

    }


    return Array.isArray(products)
      ? products
      : [];

  }


  /* =======================================================
     Profile Rendering
     ======================================================= */

  function renderProfile(profile) {

    const needSummary =
      $("needSummary");

    const recommendationsBox =
      $("recommendations");

    const resultHint =
      $("resultHint");


    if (
      !needSummary ||
      !recommendationsBox ||
      !resultHint
    ) {

      return;

    }


    /* =====================================================
       No Profile
       ===================================================== */

    if (!profile) {

      needSummary.className =
        "need-summary empty";

      needSummary.textContent =
        "هنوز پروفایل خرید ساخته نشده است.";

      recommendationsBox.innerHTML =
        "";

      resultHint.textContent =
        "برای شروع اطلاعات خریدت را وارد کن.";

      return;

    }


    /* =====================================================
       Need Engine Check
       ===================================================== */

    if (
      !window.DigiYarNeedEngine
    ) {

      recommendationsBox.innerHTML =
        "";

      resultHint.textContent =
        "Need Engine در دسترس نیست.";

      return;

    }


    /* =====================================================
       Smart Recommendation Check
       ===================================================== */

    if (
      !window.DigiyarSmartRecommendationEngine
    ) {

      recommendationsBox.innerHTML =
        "";

      resultHint.textContent =
        "Smart Recommendation Engine در دسترس نیست.";

      return;

    }


    /* =====================================================
       Build Need
       ===================================================== */

    const need =
      DigiYarNeedEngine
        .buildNeedFromProfile(
          profile
        );


    /* =====================================================
       Need Summary
       ===================================================== */

    const budget =
      need.budget &&
      need.budget.max

        ? new Intl.NumberFormat(
            "fa-IR"
          ).format(
            need.budget.max
          ) + " تومان"

        : "تعیین نشده";


    const priorities =
      Array.isArray(
        need.priorities
      )
        ? need.priorities
        : [];


    const usage =
      need.context &&
      need.context.usage
        ? need.context.usage
        : "تعیین نشده";


    needSummary.className =
      "need-summary";


    needSummary.innerHTML = `

      <strong>
        کامل بودن نیاز:
        ${escapeHTML(
          need.completeness ?? 0
        )}%
      </strong>

      <br>

      وضعیت:
      ${escapeHTML(
        need.ready
          ? "آماده پیشنهاد"
          : "نیازمند اطلاعات بیشتر"
      )}

      <br>

      دسته:
      ${escapeHTML(
        need.category || "تعیین نشده"
      )}

      |

      بودجه:
      ${escapeHTML(
        budget
      )}

      <br>

      اولویت‌ها:
      ${escapeHTML(
        priorities.join("، ") ||
        "تعیین نشده"
      )}

      |

      استفاده:
      ${escapeHTML(
        usage
      )}

    `;


    /* =====================================================
       Incomplete Need Guard
       ===================================================== */

    if (
      !need.ready
    ) {

      recommendationsBox.innerHTML = `

        <div class="need-summary">

          برای ارائه پیشنهاد دقیق،
          اطلاعات بیشتری از نیازت لازم است.

        </div>

      `;

      resultHint.textContent =
        "اطلاعات بیشتری وارد کن تا پیشنهادهای دقیق‌تری ساخته شود.";

      return;

    }


    /* =====================================================
       Product Retrieval
       ===================================================== */

    const retrievedProducts =
      retrieveProducts(
        need
      );


    if (
      !retrievedProducts.length
    ) {

      recommendationsBox.innerHTML = `

        <div class="need-summary">

          برای این دسته محصول،
          محصولی برای بررسی پیدا نشد.

        </div>

      `;

      resultHint.textContent =
        "فعلاً محصولی برای این نیاز در دسترس نیست.";

      return;

    }


    /* =====================================================
       Smart Recommendation
       ===================================================== */

    let result;


    try {

      result =
        DigiyarSmartRecommendationEngine
          .recommend(
            need,
            retrievedProducts
          );

    }

    catch (error) {

      console.error(
        "DigiYar Smart Recommendation:",
        error
      );

      recommendationsBox.innerHTML = `

        <div class="need-summary">

          در پردازش پیشنهادها خطایی رخ داد.

        </div>

      `;

      resultHint.textContent =
        "لطفاً دوباره تلاش کن.";

      return;

    }


    /* =====================================================
       Recommendation Guard
       ===================================================== */

    if (
      !result ||
      result.status !==
        "recommendations_ready" ||
      !Array.isArray(
        result.recommendations
      ) ||
      !result.recommendations.length
    ) {

      recommendationsBox.innerHTML = `

        <div class="need-summary">

          برای این نیاز هنوز
          پیشنهاد مناسبی پیدا نشد.

        </div>

      `;

      resultHint.textContent =
        "با تغییر بودجه یا اولویت‌ها دوباره امتحان کن.";

      return;

    }


    /* =====================================================
       Render Recommendations
       ===================================================== */

    recommendationsBox.innerHTML =
      result.recommendations
        .map(
          function (recommendation) {

            const product =
              recommendation.product ||
              recommendation;


            const features =
              Array.isArray(
                product.features
              )
                ? product.features
                : [];


            const reasons =
              Array.isArray(
                recommendation.reasons
              )
                ? recommendation.reasons
                : [];


            const price =
              product.price != null

                ? new Intl.NumberFormat(
                    "fa-IR"
                  ).format(
                    product.price
                  ) + " تومان"

                : "قیمت نامشخص";


            const score =
              recommendation.score ??
              product.score ??
              0;


            const rank =
              recommendation.rank ??
              product.rank ??
              "";


            const productUrl =
              product.productUrl ||
              product.url ||
              "#";


            return `

              <article
                class="recommendation"
              >

                <div class="score">
                  ${escapeHTML(
                    score
                  )}%
                </div>


                <div class="recommendation-rank">
                  ${
                    rank
                      ? "پیشنهاد " +
                        escapeHTML(rank)
                      : ""
                  }
                </div>


                <h3>
                  ${escapeHTML(
                    product.name
                  )}
                </h3>


                <p>
                  ${escapeHTML(
                    price
                  )}
                </p>


                <p>
                  ${escapeHTML(
                    features.join("، ")
                  )}
                </p>


                ${
                  reasons.length
                    ? `
                      <p>
                        ${escapeHTML(
                          reasons.join("؛ ")
                        )}
                      </p>
                    `
                    : ""
                }


                <a
                  href="${escapeHTML(
                    productUrl
                  )}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  مشاهده فروشگاه
                </a>

              </article>

            `;

          }
        )
        .join("");


    /* =====================================================
       Result Hint
       ===================================================== */

    resultHint.textContent =
      "پیشنهادها بر اساس نیاز، بودجه و امتیاز تطبیق محصول رتبه‌بندی شده‌اند.";

  }


  /* =======================================================
     Fill Profile Form
     ======================================================= */

  function fillForm(profile) {

    if (!profile) {
      return;
    }


    const declared =
      profile.declared || {};


    if ($("category")) {

      $("category").value =
        declared.category ||
        "general";

    }


    if ($("budgetMax")) {

      $("budgetMax").value =
        declared.budget &&
        declared.budget.max

          ? declared.budget.max

          : "";

    }


    if ($("priorities")) {

      $("priorities").value =
        (
          declared.priorities ||
          []
        ).join("، ");

    }


    if ($("usage")) {

      $("usage").value =
        declared.usage ||
        "";

    }


    if ($("requirements")) {

      $("requirements").value =
        (
          declared.requirements ||
          []
        ).join("، ");

    }


    if ($("constraints")) {

      $("constraints").value =
        (
          declared.constraints ||
          []
        ).join("، ");

    }

  }


  /* =======================================================
     Profile Form
     ======================================================= */

  const profileForm =
    $("profileForm");


  if (profileForm) {

    profileForm.addEventListener(
      "submit",
      function (event) {

        event.preventDefault();


        if (
          !window.DigiYarUserProfile
        ) {

          return;

        }


        const profile =
          DigiYarUserProfile.normalize({

            category:
              $("category")
                ? $("category").value
                : "",

            budgetMax:
              $("budgetMax")
                ? $("budgetMax").value
                : "",

            priorities:
              $("priorities")
                ? $("priorities").value
                : "",

            usage:
              $("usage")
                ? $("usage").value
                : "",

            requirements:
              $("requirements")
                ? $("requirements").value
                : "",

            constraints:
              $("constraints")
                ? $("constraints").value
                : ""

          });


        DigiYarUserProfile.save(
          profile
        );


        renderProfile(
          profile
        );


        const resultSection =
          $("resultSection");


        if (resultSection) {

          resultSection.scrollIntoView({
            behavior: "smooth"
          });

        }

      }
    );

  }


  /* =======================================================
     Reset Profile
     ======================================================= */

  const resetProfile =
    $("resetProfile");


  if (resetProfile) {

    resetProfile.addEventListener(
      "click",
      function () {

        if (
          window.DigiYarUserProfile
        ) {

          DigiYarUserProfile.clear();

        }


        if (
          $("profileForm")
        ) {

          $("profileForm").reset();

        }


        renderProfile(
          null
        );

      }
    );

  }


  /* =======================================================
     Initialize Platforms
     ======================================================= */

  renderPlatforms();


  /* =======================================================
     Restore Saved Profile
     ======================================================= */

  let savedProfile =
    null;


  if (
    window.DigiYarUserProfile
  ) {

    savedProfile =
      DigiYarUserProfile
        .getProfile();

  }


  fillForm(
    savedProfile
  );


  renderProfile(
    savedProfile
  );


  /* =======================================================
     PWA Install Prompt
     ======================================================= */

  let deferredInstallPrompt =
    null;


  const installPrompt =
    $("installPrompt");


  const installBtn =
    $("installBtn");


  const installDismiss =
    $("installDismiss");


  window.addEventListener(
    "beforeinstallprompt",
    function (event) {

      event.preventDefault();


      deferredInstallPrompt =
        event;


      if (installPrompt) {

        installPrompt.classList.remove(
          "hidden"
        );


        requestAnimationFrame(
          function () {

            installPrompt.classList.add(
              "show"
            );

          }
        );

      }

    }
  );


  if (installBtn) {

    installBtn.addEventListener(
      "click",
      async function () {

        if (
          !deferredInstallPrompt
        ) {

          return;

        }


        deferredInstallPrompt.prompt();


        try {

          await deferredInstallPrompt
            .userChoice;

        } catch (error) {

          console.warn(
            "DigiYar install:",
            error
          );

        }


        deferredInstallPrompt =
          null;


        hideInstallPrompt();

      }
    );

  }


  if (installDismiss) {

    installDismiss.addEventListener(
      "click",
      function () {

        hideInstallPrompt();

      }
    );

  }


  function hideInstallPrompt() {

    if (!installPrompt) {
      return;
    }


    installPrompt.classList.remove(
      "show"
    );


    setTimeout(
      function () {

        installPrompt.classList.add(
          "hidden"
        );

      },
      350
    );

  }


  window.addEventListener(
    "appinstalled",
    function () {

      deferredInstallPrompt =
        null;

      hideInstallPrompt();

    }
  );


  /* =======================================================
     Service Worker
     ======================================================= */

  if (
    "serviceWorker" in navigator
  ) {

    window.addEventListener(
      "load",
      function () {

        navigator.serviceWorker
          .register(
            "./sw.js"
          )
          .catch(
            function (error) {

              console.error(
                "DigiYar Service Worker:",
                error
              );

            }
          );

      }
    );

  }


})();
