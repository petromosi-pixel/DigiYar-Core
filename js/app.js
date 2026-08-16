/* =========================================================
   DigiYar V4
   Main Application
   UI / UX Build
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


  function toArray(value) {

    return Array.isArray(value)
      ? value
      : [];

  }


  /* =======================================================
     Splash Screen — V4
     ======================================================= */

  const splashScreen =
    $("splashScreen");

  const splashStartedAt =
    performance.now();

  const MIN_SPLASH_TIME =
    2500;

  const MAX_SPLASH_TIME =
    3500;

  let splashClosed =
    false;


  function hideSplash() {

    if (
      splashClosed ||
      !splashScreen
    ) {

      return;

    }


    splashClosed = true;


    splashScreen.classList.add(
      "splash-hidden"
    );


    setTimeout(
      function () {

        if (
          splashScreen &&
          splashScreen.parentNode
        ) {

          splashScreen.parentNode.removeChild(
            splashScreen
          );

        }

      },
      700
    );

  }


  function finishSplash() {

    if (splashClosed) {
      return;
    }


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
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      finishSplash,
      {
        once: true
      }
    );

  } else {

    finishSplash();

  }


  /*
   * Fail-safe
   */

  setTimeout(
    hideSplash,
    MAX_SPLASH_TIME
  );


  /* =======================================================
     Splash Sound
     ======================================================= */

  let splashSoundPlayed =
    false;


  function playDigiYarChime() {

    if (splashSoundPlayed) {
      return;
    }


    splashSoundPlayed = true;


    try {

      const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;


      if (!AudioContext) {
        return;
      }


      const context =
        new AudioContext();


      if (
        context.state ===
        "suspended"
      ) {

        context.resume();

      }


      const now =
        context.currentTime;


      const master =
        context.createGain();


      master.gain.setValueAtTime(
        0.0001,
        now
      );


      master.gain.exponentialRampToValueAtTime(
        0.055,
        now + 0.04
      );


      master.gain.exponentialRampToValueAtTime(
        0.0001,
        now + 1.1
      );


      master.connect(
        context.destination
      );


      /*
       * سه نت کوتاه و نرم
       * برای هویت صوتی اولیه دیجی‌یار
       */

      const frequencies = [
        523.25,
        659.25,
        783.99
      ];


      frequencies.forEach(
        function (
          frequency,
          index
        ) {

          const oscillator =
            context.createOscillator();


          const gain =
            context.createGain();


          oscillator.type =
            "sine";


          oscillator.frequency.value =
            frequency;


          const start =
            now +
            index * 0.13;


          const end =
            start +
            0.55;


          gain.gain.setValueAtTime(
            0.0001,
            start
          );


          gain.gain.exponentialRampToValueAtTime(
            0.18,
            start + 0.025
          );


          gain.gain.exponentialRampToValueAtTime(
            0.0001,
            end
          );


          oscillator.connect(
            gain
          );


          gain.connect(
            master
          );


          oscillator.start(
            start
          );


          oscillator.stop(
            end
          );

        }
      );


      setTimeout(
        function () {

          try {
            context.close();
          } catch (error) {
            /* intentionally ignored */
          }

        },
        1400
      );


    } catch (error) {

      console.warn(
        "DigiYar Splash Sound:",
        error
      );

    }

  }


  /*
   * صدای Splash در اولین تعامل کاربر
   * برای سازگاری با محدودیت Autoplay موبایل
   */

  window.addEventListener(
    "pointerdown",
    playDigiYarChime,
    {
      once: true,
      passive: true
    }
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


                <div class="platform-info">

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
     Smart Recommendation Adapter
     ======================================================= */

  function normalizeRecommendationResult(
    result
  ) {

    /*
     * حالت:
     * [product, product, product]
     */

    if (
      Array.isArray(result)
    ) {

      return result;

    }


    /*
     * حالت اصلی Smart Recommendation V4:
     *
     * {
     *   recommendations: [...]
     * }
     */

    if (
      result &&
      Array.isArray(
        result.recommendations
      )
    ) {

      return result.recommendations;

    }


    /*
     * برخی APIهای احتمالی آینده
     */

    if (
      result &&
      Array.isArray(
        result.results
      )
    ) {

      return result.results;

    }


    return [];

  }


  function getRecommendations(need) {

    /*
     * اولویت اصلی:
     * Smart Recommendation V4
     */

    if (
      window.DigiyarSmartRecommendation &&
      typeof
        DigiyarSmartRecommendation.recommend ===
        "function"
    ) {

      try {

        const result =
          DigiyarSmartRecommendation.recommend(
            need
          );


        const recommendations =
          normalizeRecommendationResult(
            result
          );


        if (
          recommendations.length
        ) {

          return recommendations;

        }

      } catch (error) {

        console.warn(
          "DigiYar Smart Recommendation:",
          error
        );

      }

    }


    /*
     * نام جایگزین موتور
     */

    if (
      window.DigiyarSmartRecommendationEngine &&
      typeof
        DigiyarSmartRecommendationEngine.recommend ===
        "function"
    ) {

      try {

        const result =
          DigiyarSmartRecommendationEngine.recommend(
            need
          );


        const recommendations =
          normalizeRecommendationResult(
            result
          );


        if (
          recommendations.length
        ) {

          return recommendations;

        }

      } catch (error) {

        console.warn(
          "DigiYar Smart Recommendation Engine:",
          error
        );

      }

    }


    /*
     * Fallback برای Core قبلی
     */

    if (
      window.DigiYarProductScoring &&
      typeof
        DigiYarProductScoring.recommend ===
        "function"
    ) {

      try {

        const result =
          DigiYarProductScoring.recommend(
            need
          );


        const recommendations =
          normalizeRecommendationResult(
            result
          );


        if (
          recommendations.length
        ) {

          return recommendations;

        }

      } catch (error) {

        console.warn(
          "DigiYar Product Scoring:",
          error
        );

      }

    }


    return [];

  }


  /* =======================================================
     Recommendation Explanation
     ======================================================= */

  function getExplanation(product) {

    if (!product) {
      return "";
    }


    if (
      typeof product.explanation ===
      "string" &&
      product.explanation.trim()
    ) {

      return product.explanation;

    }


    return "";

  }


  /* =======================================================
     Recommendation Priority Label
     ======================================================= */

  function getPriorityLabel(index) {

    const labels = [
      "اولویت اول",
      "اولویت دوم",
      "اولویت سوم"
    ];


    return (
      labels[index] ||
      `اولویت ${index + 1}`
    );

  }


  /* =======================================================
     Product Card
     ======================================================= */

  function renderRecommendationCard(
    product,
    index
  ) {

    const features =
      toArray(
        product.features
      );


    const score =
      product.score != null
        ? product.score
        : 0;


    const price =
      product.price != null

        ? new Intl.NumberFormat(
            "fa-IR"
          ).format(
            product.price
          ) + " تومان"

        : "قیمت نامشخص";


    const explanation =
      getExplanation(
        product
      );


    const productUrl =
      product.productUrl ||
      product.url ||
      "#";


    const priority =
      getPriorityLabel(
        index
      );


    return `

      <article
        class="recommendation"
        data-rank="${escapeHTML(
          index + 1
        )}"
      >

        <div class="recommendation-priority">

          ${escapeHTML(
            priority
          )}

        </div>


        <div class="score">

          ${escapeHTML(score)}%

        </div>


        <h3>

          ${escapeHTML(
            product.name ||
            "محصول پیشنهادی"
          )}

        </h3>


        <p class="recommendation-price">

          ${escapeHTML(price)}

        </p>


        ${
          features.length
            ? `

              <p class="recommendation-features">

                ${escapeHTML(
                  features.join("، ")
                )}

              </p>

            `
            : ""
        }


        ${
          explanation
            ? `

              <p class="recommendation-explanation">

                ${escapeHTML(
                  explanation
                )}

              </p>

            `
            : ""
        }


        <a
          class="recommendation-btn"
          href="${escapeHTML(
            productUrl
          )}"
          target="_blank"
          rel="noopener noreferrer"
        >

          مشاهده کالا

        </a>

      </article>

    `;

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


    /*
     * کارت Need Summary دیگر برای کاربر
     * نمایش داده نمی‌شود.
     *
     * عنصر را برای سازگاری Core نگه می‌داریم
     * ولی محتویات آن خالی است.
     */

    needSummary.className =
      "need-summary hidden";


    needSummary.innerHTML =
      "";


    if (!profile) {

      recommendationsBox.innerHTML =
        "";


      resultHint.textContent =
        "برای شروع اطلاعات خریدت رو وارد کن.";


      return;

    }


    if (
      !window.DigiYarNeedEngine
    ) {

      recommendationsBox.innerHTML = `

        <div class="recommendation-empty">

          موتور تحلیل نیاز در دسترس نیست.

        </div>

      `;


      resultHint.textContent =
        "لطفاً صفحه را دوباره بارگذاری کن.";


      return;

    }


    let need;


    try {

      need =
        DigiYarNeedEngine
          .buildNeedFromProfile(
            profile
          );

    } catch (error) {

      console.error(
        "DigiYar Need Engine:",
        error
      );


      recommendationsBox.innerHTML = `

        <div class="recommendation-empty">

          خطا در ساخت نیاز خرید.

        </div>

      `;


      resultHint.textContent =
        "اطلاعات خرید را دوباره بررسی کن.";


      return;

    }


    if (!need) {

      recommendationsBox.innerHTML = "";


      return;

    }


    /*
     * متن جدید بخش پیشنهادات
     */

    resultHint.textContent =
      "بر اساس اولویت‌های انتخابی تو به ترتیب زیر پیشنهاد میشن";


    /*
     * V4 Recommendation Chain
     */

    const recommendations =
      getRecommendations(
        need
      );


    if (
      !Array.isArray(
        recommendations
      ) ||
      !recommendations.length
    ) {

      recommendationsBox.innerHTML = `

        <div class="recommendation-empty">

          برای این نیاز هنوز
          پیشنهاد مناسبی پیدا نشد.

        </div>

      `;


      resultHint.textContent =
        "اطلاعات بیشتری وارد کن تا پیشنهادهای دقیق‌تری ساخته شود.";


      return;

    }


    /*
     * فقط سه پیشنهاد برتر
     */

    const topRecommendations =
      recommendations.slice(
        0,
        3
      );


    recommendationsBox.innerHTML =
      topRecommendations.map(
        function (
          product,
          index
        ) {

          return renderRecommendationCard(
            product,
            index
          );

        }
      ).join("");

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

          console.error(
            "DigiYarUserProfile is unavailable."
          );

          return;

        }


        let profile;


        try {

          profile =
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

        } catch (error) {

          console.error(
            "DigiYar Profile:",
            error
          );

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

    try {

      savedProfile =
        DigiYarUserProfile
          .getProfile();

    } catch (error) {

      console.warn(
        "DigiYar saved profile:",
        error
      );

      savedProfile =
        null;

    }

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


        try {

          deferredInstallPrompt.prompt();


          const choice =
            await deferredInstallPrompt.userChoice;


          if (
            choice &&
            choice.outcome ===
            "accepted"
          ) {

            deferredInstallPrompt =
              null;

          }

        } catch (error) {

          console.warn(
            "DigiYar Install:",
            error
          );

        }

      }
    );

  }


  if (installDismiss) {

    installDismiss.addEventListener(
      "click",
      function () {

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
          300
        );

      }
    );

  }


  window.addEventListener(
    "appinstalled",
    function () {

      deferredInstallPrompt =
        null;


      if (installPrompt) {

        installPrompt.classList.remove(
          "show"
        );


        installPrompt.classList.add(
          "hidden"
        );

      }

    }
  );


})();
