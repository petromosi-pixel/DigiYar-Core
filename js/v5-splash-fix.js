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
    }, 750);
  }

  function init() {
    var splash = document.getElementById('splashScreen');
    if (!splash) return;

    splash.setAttribute('aria-hidden', 'false');

    /* Remove any legacy low-quality splash artwork before it can render. */
    var legacyLogo = splash.querySelector('.v5-splash-logo-wrap');
    if (legacyLogo) legacyLogo.remove();

    /* Keep the visual language defined by the executable splash concept:
       full-screen deep navy, centered DigiYar identity, no legacy image. */
    var content = splash.querySelector('.v5-splash-content');
    if (!content) {
      content = document.createElement('div');
      content.className = 'splash-content v5-splash-content';
      splash.appendChild(content);
    }

    var brand = content.querySelector('.v5-splash-brand');
    if (!brand) {
      brand = document.createElement('div');
      brand.className = 'splash-brand v5-splash-brand';
      brand.innerHTML = '<h1>دیجی‌یار</h1><p>دستیار دنیای دیجیتال</p>';
      content.appendChild(brand);
    }

    window.setTimeout(dismissSplash, 2200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
