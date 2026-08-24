/* DigiYar V5 — Splash final copy bridge */
(function () {
  'use strict';
  function apply() {
    var splash = document.getElementById('splashScreen');
    if (!splash) return;
    splash.classList.add('v5-splash-screen');
    var brand = splash.querySelector('.splash-brand p');
    if (brand) brand.textContent = 'دستیار هوشمندِ خرید اینترنتی تو';
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }
})();
