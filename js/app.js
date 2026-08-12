/* =========================================================
   DigiYar V3
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


  /*
   * Splash حداقل 3.2 ثانیه نمایش داده می‌شود.
   *
   * حداکثر حدود 4.5 ثانیه بعد،
   * حتی اگر load event مشکل داشته باشد،
   * Splash بسته خواهد شد.
   */

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


  /*
   * Fail-safe
   *
   * اگر load event یا بخشی از فرآیند
   * به هر دلیل گیر کرد، Splash
   * بیشتر از MAX_SPLASH_TIME باقی نمی‌ماند.
   */

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

      return;

    }


    const need =
      DigiYarNeedEngine
        .buildNeedFromProfile(
          profile
        );


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


    if (
      !window.DigiYarProductScoring
    ) {

      recommendationsBox.innerHTML =
        "";

      return;

    }


    const recommendations =
      DigiYarProductScoring
        .recommend(
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

          برای این دسته محصول هنوز
          پیشنهاد نمونه‌ای نداریم.

        </div>

      `;

      resultHint.textContent =
        "اطلاعات بیشتری وارد کن تا پیشنهادهای دقیق‌تری ساخته شود.";

      return;

    }


    recommendationsBox.innerHTML =
      recommendations.map(
        function (product) {

          const features =
            Array.isArray(
              product.features
            )
              ? product.features
              : [];


          const price =
            product.price != null

              ? new Intl.NumberFormat(
                  "fa-IR"
                ).format(
                  product.price
                ) + " تومان"

              : "قیمت نامشخص";


          return `

            <article
              class="recommendation"
            >

              <div class="score">
                ${escapeHTML(
                  product.score ?? 0
                )}%
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


              <a
                href="${escapeHTML(
                  product.url || "#"
                )}"
                target="_blank"
                rel="noopener noreferrer"
              >
                مشاهده فروشگاه
              </a>

            </article>

          `;

        }
      ).join("");


    resultHint.textContent =
      "نتیجه بر اساس پروفایل فعلی محاسبه شده است.";

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

      /*
       * جلوگیری از نمایش خودکار
       * پنجره نصب مرورگر
       */

      event.preventDefault();


      deferredInstallPrompt =
        event;


      /*
       * نمایش نوتیفیکیشن اختصاصی DigiYar
       */

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
