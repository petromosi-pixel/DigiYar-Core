/* DigiYar V5.1 — Splash lifecycle
   Keeps the current visual design intact and restores the missing auto-dismiss.
*/
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
    window.setTimeout(dismissSplash, 8000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
