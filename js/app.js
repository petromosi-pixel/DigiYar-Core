/* =========================================================
   DigiYar V4
   Main Application
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


  function formatPrice(value) {

    if (value == null || value === "") {
      return "قیمت نامشخص";
    }

    return new Intl.NumberFormat("fa-IR")
      .format(value) + " تومان";

  }


  function toArray(value) {

    return Array.isArray(value)
      ? value
      : [];

  }


  /* =======================================================
     Splash Screen
     ======================================================= */

  const splashScreen =
    $("splashScreen");

  const splashStartedAt =
    performance.now();

  const MIN_SPLASH_TIME = 3200;
  const MAX_SPLASH_TIME = 4500;


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
     Need Summary
     ======================================================= */

  function renderNeedSummary(need) {

    const container =
      $("needSummary");

    if (!container) {
      return;
    }


    if (!need) {

      container.className =
        "need-summary empty";

      container.textContent =
        "هنوز پروفایل خرید ساخته نشده است.";

      return;

    }


    const priorities =
      toArray(
        need.priorities
      );


    const requirements =
      toArray(
        need.requirements
      );


    const constraints =
      toArray(
        need.constraints
      );


    const usage =
      need.context &&
      need.context.usage
        ? need.context.usage
        : "تعیین نشده";


    const budget =
      need.budget &&
      need.budget.max
        ? formatPrice(
            need.budget.max
          )
        : "تعیین نشده";


    function renderValues(values) {

      return values
        .map(
          function (item) {

            const value =
              item &&
              typeof item === "object"
                ? item.value
                : item;

            return `
              <span class="need-chip">
                ${escapeHTML(value)}
              </span>
            `;

          }
        )
        .join("");

    }


    container.className =
      "need-summary";


    container.innerHTML = `

      <div class="need-summary-title">
        نیاز خریدت آماده است
      </div>

      <div class="need-summary-content">

        <div class="need-line">

          <span class="need-chip">
            دسته: ${escapeHTML(
              need.category || "تعیین نشده"
            )}
          </span>

          <span class="need-chip">
            بودجه: ${escapeHTML(
              budget
            )}
          </span>

          <span class="need-chip">
            استفاده: ${escapeHTML(
              usage
            )}
          </span>

          <span class="need-chip">
            کامل بودن: ${escapeHTML(
              need.completeness ?? 0
            )}%
          </span>

        </div>

        ${
          priorities.length
            ? `
              <div class="need-line">
                ${renderValues(
                  priorities
                )}
              </div>
            `
            : ""
        }

        ${
          requirements.length
            ? `
              <div class="need-line">
                ${renderValues(
                  requirements
                )}
              </div>
            `
            : ""
        }

        ${
          constraints.length
            ? `
              <div class="need-line">
                ${renderValues(
                  constraints
                )}
              </div>
            `
            : ""
        }

      </div>

    `;

  }


  /* =======================================================
     Recommendation Engine
     ======================================================= */

  function getRecommendations(need) {

    /*
     * V4:
     * اول Smart Recommendation Engine
     * سپس fallback به Product Scoring
     */

    if (
      window.DigiYarSmartRecommendation &&
      typeof
        DigiYarSmartRecommendation.recommend ===
        "function"
    ) {

      try {

        const result =
          DigiYarSmartRecommendation
            .recommend(
              need
            );


        if (
          result &&
          result.status ===
            "recommendations_ready"
        ) {

          return {
            result: result,
            products:
              toArray(
                result.recommendations
              )
          };

        }

      } catch (error) {

        console.error(
          "DigiYar Smart Recommendation:",
          error
        );

      }

    }


    if (
      window.DigiYarProductScoring &&
      typeof
        DigiYarProductScoring.recommend ===
        "function"
    ) {

      const products =
        DigiYarProductScoring
          .recommend(
            need
          );


      return {
        result: null,
        products:
          toArray(
            products
          )
      };

    }


    return {
      result: null,
      products: []
    };

  }


  /* =======================================================
     Best Recommendation
     ======================================================= */

  function renderBestRecommendation(
    product,
    result
  ) {

    const container =
      $("bestRecommendation");

    if (!container) {
      return;
    }


    if (!product) {

      container.innerHTML =
        "";

      return;

    }


    const features =
      toArray(
        product.features
      );


    const reasons =
      toArray(
        product.reasons
      );


    const explanation =
      product.explanation ||
      (
        result &&
        result.explanation
      ) ||
      reasons.join("؛ ") ||
      "این محصول بر اساس نیاز فعلی شما انتخاب شده است.";


    const score =
      product.score ??
      product.matchScore ??
      0;


    const url =
      product.productUrl ||
      product.url ||
      "#";


    container.innerHTML = `

      <div class="section-title">

        <span class="section-kicker">
          SMART MATCH
        </span>

        <h2>
          بهترین انتخاب برای تو
        </h2>

        <p>
          بر اساس نیاز، بودجه و اولویت‌های خریدت
        </p>

      </div>


      <article class="best-card">

        <span class="best-badge">
          انتخاب اول دیجی‌یار
        </span>

        <div class="best-product-layout">

          <div>

            <h3>
              ${escapeHTML(
                product.name
              )}
            </h3>

            <p class="best-price">
              ${escapeHTML(
                formatPrice(
                  product.price
                )
              )}
            </p>

            <div class="best-features">

              ${features.map(
                function (feature) {

                  return `
                    <span class="best-feature">
                      ${escapeHTML(
                        feature
                      )}
                    </span>
                  `;

                }
              ).join("")}

            </div>

          </div>


          <div class="match-score">

            <strong>
              ${escapeHTML(
                score
              )}%
            </strong>

            <span>
              تطابق
            </span>

          </div>

        </div>


        <div class="why-title">
          چرا این محصول؟
        </div>

        <p class="explanation">
          ${escapeHTML(
            explanation
          )}
        </p>


        <a
          class="store-button"
          href="${escapeHTML(
            url
          )}"
          target="_blank"
          rel="noopener noreferrer"
        >
          مشاهده محصول
        </a>

      </article>

    `;

  }


  /* =======================================================
     Alternative Recommendations
     ======================================================= */

  function renderAlternatives(
    products
  ) {

    const container =
      $("alternativeRecommendations");

    if (!container) {
      return;
    }


    const alternatives =
      toArray(
        products
      ).slice(1);


    if (!alternatives.length) {

      container.innerHTML =
        "";

      return;

    }


    container.innerHTML = `

      <div class="alternatives-title">
        گزینه‌های جایگزین
      </div>

      ${
        alternatives.map(
          function (product) {

            const url =
              product.productUrl ||
              product.url ||
              "#";


            return `

              <article
                class="alternative-card"
              >

                <div class="alternative-type">
                  گزینه جایگزین
                </div>

                <h3>
                  ${escapeHTML(
                    product.name
                  )}
                </h3>

                <p class="alternative-price">
                  ${escapeHTML(
                    formatPrice(
                      product.price
                    )
                  )}
                </p>

                <div class="alternative-score">
                  امتیاز تطابق:
                  ${escapeHTML(
                    product.score ??
                    product.matchScore ??
                    0
                  )}%
                </div>

                <a
                  class="alternative-store"
                  href="${escapeHTML(
                    url
                  )}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  مشاهده محصول ←
                </a>

              </article>

            `;

          }
        ).join("")
      }

    `;

  }


  /* =======================================================
     Render Recommendations
     ======================================================= */

  function renderRecommendations(
    need
  ) {

    const bestContainer =
      $("bestRecommendation");

    const alternativesContainer =
      $("alternativeRecommendations");

    const resultHint =
      $("resultHint");


    if (!bestContainer) {
      return;
    }


    if (
      !need ||
      need.completeness < 100
    ) {

      bestContainer.innerHTML = `

        <div class="recommendation-message">
          برای پیشنهاد دقیق‌تر، اطلاعات بیشتری از نیاز خریدت لازم است.
        </div>

      `;

      if (alternativesContainer) {
        alternativesContainer.innerHTML =
          "";
      }

      if (resultHint) {

        resultHint.textContent =
          "هنوز اطلاعات خرید کامل نشده است.";

      }

      return;

    }


    const output =
      getRecommendations(
        need
      );


    const products =
      output.products;


    if (!products.length) {

      bestContainer.innerHTML = `

        <div class="recommendation-message">
          فعلاً محصول مناسبی برای این نیاز پیدا نشد.
        </div>

      `;

      if (alternativesContainer) {
        alternativesContainer.innerHTML =
          "";
      }

      if (resultHint) {

        resultHint.textContent =
          "با تغییر بودجه یا اولویت‌ها دوباره امتحان کن.";

      }

      return;

    }


    renderBestRecommendation(
      products[0],
      output.result
    );


    renderAlternatives(
      products
    );


    if (resultHint) {

      resultHint.textContent =
        "پیشنهادها بر اساس Need، بودجه، اولویت‌ها و امتیاز هوشمند مرتب شده‌اند.";

    }

  }


  /* =======================================================
     Render Profile
     ======================================================= */

  function renderProfile(profile) {

    if (!profile) {

      renderNeedSummary(
        null
      );

      renderRecommendations(
        null
      );

      return;

    }


    if (
      !window.DigiYarNeedEngine
    ) {

      return;

    }


    const need =
      DigiYarNeedEngine
        .buildNeedFromProfile(
          profile
        );


    renderNeedSummary(
      need
    );


    renderRecommendations(
      need
    );

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
        toArray(
          declared.priorities
        ).join("، ");

    }


    if ($("usage")) {

      $("usage").value =
        declared.usage ||
        "";

    }


    if ($("requirements")) {

      $("requirements").value =
        toArray(
          declared.requirements
        ).join("، ");

    }


    if ($("constraints")) {

      $("constraints").value =
        toArray(
          declared.constraints
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
            behavior: "smooth",
            block: "start"
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


        if ($("profileForm")) {

          $("profileForm").reset();

        }


        renderProfile(
          null
        );

      }
    );

  }


  /* =======================================================
     Initialize
     ======================================================= */

  renderPlatforms();


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

        hideInsta
