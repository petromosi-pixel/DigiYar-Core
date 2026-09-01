/* =========================================================
   DigiYar V5.1 — Splash Controller
   One DOM. One timeline. One animation owner.
   ========================================================= */
(function () {
  'use strict';

  var LOGO = './assets/logos/logo.png';
  var TOTAL_MS = 6000;

  function buildSplash(oldSplash) {
    var splash = oldSplash.cloneNode(false);
    splash.className = 'v5-splash-root';
    splash.setAttribute('aria-label', 'دیجی‌یار');

    splash.innerHTML = '' +
      '<div class="v5-splash-stage">' +
        '<div class="v5-splash-logo-stage" aria-hidden="true">' +
          '<img class="v5-splash-layer v5-splash-basket" src="' + LOGO + '" alt="">' +
          '<img class="v5-splash-layer v5-splash-white-hand" src="' + LOGO + '" alt="">' +
          '<img class="v5-splash-layer v5-splash-orange-hand" src="' + LOGO + '" alt="">' +
        '</div>' +
        '<div class="v5-splash-brand">' +
          '<h1>دیجی‌یار</h1>' +
          '<p>دستیار دنیای دیجیتال</p>' +
        '</div>' +
        '<div class="v5-splash-loader" aria-hidden="true"><i></i><i></i><i></i><i></i></div>' +
      '</div>';

    oldSplash.replaceWith(splash);
    return splash;
  }

  function start() {
    var oldSplash = document.getElementById('splashScreen');
    if (!oldSplash) return;

    var splash = buildSplash(oldSplash);

    /* app.js may still hold the old node reference. Replacing the node makes
       the old splash timers harmless; this new node is owned only here. */
    requestAnimationFrame(function () {
      splash.classList.add('v5-splash-running');
    });

    window.setTimeout(function () {
      splash.classList.add('v5-splash-complete');
      window.setTimeout(function () {
        if (splash.parentNode) splash.parentNode.removeChild(splash);
      }, 700);
    }, TOTAL_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
