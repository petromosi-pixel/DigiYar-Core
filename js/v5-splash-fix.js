/* DigiYar V6 — Splash lifecycle */
(function () {
  'use strict';

  function dismissSplash() {
    var splash = document.getElementById('splashScreen');
    if (!splash) return;
    splash.classList.add('splash-hidden');
    splash.setAttribute('aria-hidden', 'true');
    window.setTimeout(function () {
      if (splash && splash.parentNode) splash.style.display = 'none';
    }, 450);
  }

  function init() {
    var splash = document.getElementById('splashScreen');
    if (!splash) return;

    splash.setAttribute('aria-hidden', 'false');

    /* Remove only the legacy logo wrapper if an older cached DOM injects it.
       The current splash keeps the approved high-resolution icon. */
    var legacyLogo = splash.querySelector('.legacy-splash-logo');
    if (legacyLogo) legacyLogo.remove();

    /* Exact visual timing requested for the V6 splash. */
    window.setTimeout(dismissSplash, 3000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
