/* DigiYar V3 - Main Application */

(function () {
  "use strict";
  const splashScreen =
    document.getElementById("splashScreen");

  function hideSplash() {

    if (!splashScreen) {
      return;
    }

    splashScreen.classList.add(
      "splash-hidden"
    );

    setTimeout(
      function () {

        splashScreen.remove();

      },
      700
    );

  }
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


  /*
   * نمایش فروشگاه‌ها
   */

  function renderPlatforms() {

    const container = $("platforms");

    if (!container) {
      return;
    }

    container.innerHTML =
      DigiYarPlatforms.map(
        function (platform) {

          return `
            <a
              class="platform"
              href="${platform.url}"
              target="_blank"
              rel="noopener noreferrer"
            >

              <span class="platform-main">

                <span class="platform-logo">
  <img
    src="${escapeHTML(platform.logo)}"
    alt="${escapeHTML(platform.name)}"
    loading="lazy"
  >
</span>
                </span>

                <span>

                  <span class="platform-name">
                    ${escapeHTML(platform.name)}
                  </span>

                  <br>

                  <span class="platform-tag">
                    ${escapeHTML(platform.tag)}
                  </span>

                </span>

              </span>

              <span class="platform-btn">
                ورود
              </span>

            </a>
          `;

        }
      ).join("");

  }


  /*
   * نمایش پروفایل و پیشنهادها
   */

  function renderProfile(profile) {

    if (!profile) {

      $("needSummary").className =
        "need-summary empty";

      $("needSummary").textContent =
        "هنوز پروفایل خرید ساخته نشده است.";

      $("recommendations").innerHTML = "";

      $("resultHint").textContent =
        "برای شروع اطلاعات خریدت را وارد کن.";

      return;
    }


    const need =
      DigiYarNeedEngine
        .buildNeedFromProfile(profile);


    const budget =
      need.budget &&
      need.budget.max
        ? new Intl.NumberFormat("fa-IR")
            .format(need.budget.max) +
          " تومان"
        : "تعیین نشده";


    $("needSummary").className =
      "need-summary";


    $("needSummary").innerHTML = `

      <strong>
        کامل بودن نیاز:
        ${need.completeness}%
      </strong>

      <br>

      دسته:
      ${escapeHTML(need.category)}

      |

      بودجه:
      ${escapeHTML(budget)}

      <br>

      اولویت‌ها:
      ${escapeHTML(
        need.priorities.join("، ") ||
        "تعیین نشده"
      )}

      |

      استفاده:
      ${escapeHTML(
        need.context.usage ||
        "تعیین نشده"
      )}

    `;


    const recommendations =
      DigiYarProductScoring
        .recommend(need);


    if (!recommendations.length) {

      $("recommendations").innerHTML =
        `
          <div class="need-summary">
            برای این دسته محصول هنوز
            پیشنهاد نمونه‌ای نداریم.
          </div>
        `;

      return;
    }


    $("recommendations").innerHTML =
      recommendations.map(
        function (product) {

          return `

            <article class="recommendation">

              <div class="score">
                ${product.score}%
              </div>

              <h3>
                ${escapeHTML(
                  product.name
                )}
              </h3>

              <p>
                ${new Intl.NumberFormat("fa-IR")
                  .format(product.price)}
                تومان
              </p>

              <p>
                ${escapeHTML(
                  product.features.join("، ")
                )}
              </p>

              <a
                href="${product.url}"
                target="_blank"
                rel="noopener noreferrer"
              >
                مشاهده فروشگاه
              </a>

            </article>

          `;

        }
      ).join("");


    $("resultHint").textContent =
      "نتیجه بر اساس پروفایل فعلی محاسبه شده است.";

  }


  /*
   * پر کردن فرم از اطلاعات ذخیره‌شده
   */

  function fillForm(profile) {

    if (!profile) {
      return;
    }

    const declared =
      profile.declared || {};


    $("category").value =
      declared.category ||
      "general";


    $("budgetMax").value =
      declared.budget &&
      declared.budget.max
        ? declared.budget.max
        : "";


    $("priorities").value =
      (declared.priorities || [])
        .join("، ");


    $("usage").value =
      declared.usage || "";


    $("requirements").value =
      (declared.requirements || [])
        .join("، ");


    $("constraints").value =
      (declared.constraints || [])
        .join("، ");

  }


  /*
   * ثبت فرم پروفایل
   */

  $("profileForm").addEventListener(
    "submit",
    function (event) {

      event.preventDefault();


      const profile =
        DigiYarUserProfile.normalize({

          category:
            $("category").value,

          budgetMax:
            $("budgetMax").value,

          priorities:
            $("priorities").value,

          usage:
            $("usage").value,

          requirements:
            $("requirements").value,

          constraints:
            $("constraints").value

        });


      DigiYarUserProfile.save(
        profile
      );


      renderProfile(
        profile
      );


      $("resultSection")
        .scrollIntoView({
          behavior: "smooth"
        });

    }
  );


  /*
   * پاک کردن پروفایل
   */

  $("resetProfile").addEventListener(
    "click",
    function () {

      DigiYarUserProfile.clear();

      $("profileForm").reset();

      renderProfile(null);

    }
  );


  /*
   * راه‌اندازی فروشگاه‌ها
   */

  renderPlatforms();


  /*
   * بازیابی پروفایل قبلی
   */

  const savedProfile =
    DigiYarUserProfile
      .getProfile();


  fillForm(
    savedProfile
  );


  renderProfile(
    savedProfile
  );


  /*
   * نصب PWA
   */

  let deferredInstallPrompt =
    null;


  window.addEventListener(
    "beforeinstallprompt",
    function (event) {

      event.preventDefault();

      deferredInstallPrompt =
        event;

      $("installBtn")
        .classList
        .remove("hidden");

    }
  );


  $("installBtn").addEventListener(
    "click",
    async function () {

      if (!deferredInstallPrompt) {
        return;
      }


      deferredInstallPrompt.prompt();


      await deferredInstallPrompt.userChoice;


      deferredInstallPrompt = null;


      $("installBtn")
        .classList
        .add("hidden");

    }
  );


  /*
   * ثبت Service Worker
   */

  if ("serviceWorker" in navigator) {

    navigator.serviceWorker
      .register("sw.js")
      .catch(function (error) {

        console.error(
          "DigiYar Service Worker:",
          error
        );

      });

  }
  /*
   * Splash lifecycle
   *
   * حداقل زمان نمایش:
   * 2.2 ثانیه
   *
   * حداکثر زمان:
   * 3.2 ثانیه
   */

  const splashStartedAt =
    performance.now();

  const MIN_SPLASH_TIME = 3200;
  const MAX_SPLASH_TIME = 4200;

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
      Math.min(
        remaining,
        MAX_SPLASH_TIME
      )
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
      { once: true }
    );

  }
})();
