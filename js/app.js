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


  function toArray(value) {

    if (Array.isArray(value)) {
      return value;
    }

    return [];

  }


  /* =======================================================
     Splash Screen — V4
     ======================================================= */

  const splashScreen =
    $("splashScreen");


  const splashStartedAt =
    performance.now();


  const MIN_SPLASH_TIME =
    2600;


  const MAX_SPLASH_TIME =
    4000;


  let splashClosed =
    false;


  function hideSplash() {

    if (
      splashClosed ||
      !splashScreen
    ) {

      return;

    }


    splashClosed =
      true;


    splashScreen.classList.add(
      "splash-hidden"
    );


    setTimeout(
      function () {

        if (
          splashScreen &&
          splashScreen.parentNode
        ) {

          splashScreen.remove();

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


  /*
   * دیگر منتظر window.load نمی‌مانیم.
   * بنابراین خراب شدن یک asset،
   * API یا Service Worker نمی‌تواند
   * Splash را برای همیشه نگه دارد.
   */

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


/* =======================================================
   Splash Screen — V4
   ======================================================= */

const splashScreen =
  $("splashScreen");

let splashClosed =
  false;

const splashStartedAt =
  performance.now();

const MIN_SPLASH_TIME =
  2500;

const MAX_SPLASH_TIME =
  3500;


function hideSplash() {

  if (splashClosed) {
    return;
  }

  splashClosed = true;


  if (!splashScreen) {
    return;
  }


  splashScreen.classList.add(
    "splash-hidden"
  );


  /*
   * بعد از fade-out، عنصر کاملاً
   * از DOM خارج می‌شود.
   */

  setTimeout(
    function () {

      if (
        splashScreen &&
        splashScreen.parentNode
      ) {

        splashScreen.parentNode
          .removeChild(
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
      MIN_SPLASH_TIME -
      elapsed
    );


  setTimeout(
    hideSplash,
    remaining
  );

}


/*
 * دیگر به window.load وابسته نیستیم.
 */

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
 * Fail-safe مطلق
 *
 * حتی اگر هر چیز دیگری خراب شود،
 * Splash حداکثر ۳.۵ ثانیه می‌ماند.
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


    splashSoundPlayed =
      true;


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
   * مرورگرهای موبایل معمولاً صدای خودکار
   * بدون تعامل کاربر را مسدود می‌کنند.
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
     Smart Recommendation Adapter
     ======================================================= */

  function getRecommendations(need) {

    /*
     * اولویت با موتور Smart Recommendation V4
     */

    if (
      window.DigiYarSmartRecommendation &&
      typeof
        DigiYarSmartRecommendation.recommend ===
        "function"
    ) {

      try {

        const result =
          DigiYarSmartRecommendation.recommend(
            need
          );


        if (
          Array.isArray(result)
        ) {

          return result;

        }


        if (
          result &&
          Array.isArray(
            result.recommendations
          )
        ) {

          return result.recommendations;

        }

      } catch (error) {

        console.warn(
          "DigiYar Smart Recommendation:",
          error
        );

      }

    }


    /*
     * سازگاری با نام‌های احتمالی دیگر
     */

    if (
      window.DigiYarSmartRecommendationEngine &&
      typeof
        DigiYarSmartRecommendationEngine.recommend ===
        "function"
    ) {

      try {

        const result =
          DigiYarSmartRecommendationEngine.recommend(
            need
          );


        if (
          Array.isArray(result)
        ) {

          return result;

        }


        if (
          result &&
          Array.isArray(
            result.recommendations
          )
        ) {

          return result.recommendations;

        }

      } catch (error) {

        console.warn(
          "DigiYar Smart Recommendation Engine:",
          error
        );

      }

    }


    /*
     * Fallback برای سازگاری با Core قبلی
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


        if (
          Array.isArray(result)
        ) {

          return result;

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


    /*
     * اگر موتور V4 explanation نداشت،
     * از reasons فقط یک بار استفاده می‌کنیم.
     */

    if (
      Array.isArray(product.reasons) &&
      product.reasons.length
    ) {

      return product.reasons
        .filter(Boolean)
        .join("؛ ");

    }


    return "";

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


    const rank =
      product.rank ||
      index + 1;


    return `

      <article
        class="recommendation"
        data-rank="${escapeHTML(rank)}"
      >

        <div class="score">

          ${escapeHTML(score)}%

        </div>


        <h3>

          ${escapeHTML(
            product.name ||
            "محصول پیشنهادی"
          )}

        </h3>


        <p>

          ${escapeHTML(price)}

        </p>


        ${
          features.length

            ? `

              <p>

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
          href="${escapeHTML(productUrl)}"
          target="_blank"
          rel="noopener noreferrer"
        >

          مشاهده فروشگاه

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


    if (
      !window.DigiYarNeedEngine
    ) {

      needSummary.className =
        "need-summary empty";


      needSummary.textContent =
        "موتور تحلیل نیاز در دسترس نیست.";


      recommendationsBox.innerHTML =
        "";


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


      needSummary.className =
        "need-summary empty";


      needSummary.textContent =
        "خطا در ساخت نیاز خرید.";


      recommendationsBox.innerHTML =
        "";


      return;

    }


    if (!need) {

      return;

    }


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
      toArray(
        need.priorities
      );


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

      دسته:
      ${escapeHTML(
        need.category ||
        "تعیین نشده"
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

        <div class="need-summary">

          برای این نیاز هنوز
          پیشنهاد مناسبی پیدا نشد.

        </div>

      `;


      resultHint.textContent =
        "اطلاعات بیشتری وارد کن تا پیشنهادهای دقیق‌تری ساخته شود.";


      return;

    }


    recommendationsBox.innerHTML =
      recommendations.map(
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


    resultHint.textContent =
      "پیشنهادها بر اساس Need، بودجه، اولویت‌ها و امتیاز هوشمند مرتب شده‌اند.";

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


      
