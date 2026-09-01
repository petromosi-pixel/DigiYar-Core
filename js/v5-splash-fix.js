/* DigiYar V5 — Splash final runtime fix */
(function () {
  'use strict';

  function apply() {
    var splash = document.getElementById('splashScreen');
    if (splash) {
      splash.classList.add('v5-splash-screen');

      var logo = splash.querySelector('.v5-splash-logo');
      if (logo) {
        /* Splash must use the approved logo source, not the PWA icon. */
        logo.src = './assets/logos/logo.png';
        logo.removeAttribute('srcset');
      }

      var brand = splash.querySelector('.splash-brand p');
      if (brand) brand.textContent = 'دستیار دنیای دیجیتال';

      /* This runtime layer is intentionally limited to Splash so other V5 UI is untouched. */
      if (!document.getElementById('digiyar-v5-splash-final-runtime')) {
        var style = document.createElement('style');
        style.id = 'digiyar-v5-splash-final-runtime';
        style.textContent = `
          .v5-splash-screen .v5-splash-logo {
            animation: v5LogoReveal 1.35s cubic-bezier(.2,.75,.2,1) both !important;
          }
          .v5-splash-screen .splash-brand h1 {
            animation: v5SplashTextIn .8s ease .55s both !important;
          }
          .v5-splash-screen .splash-brand p {
            animation: v5SplashTextIn .8s ease .7s both !important;
          }
          .v5-splash-screen .v5-splash-loader {
            width: 108px !important;
            height: 18px !important;
            margin: 25px auto 0 !important;
            background: repeating-radial-gradient(circle at 9px 9px, transparent 0 3px, #ff8a00 3.5px 5px, transparent 5.5px 9px) !important;
            background-size: 18px 18px !important;
            animation: v5RingFlow 1.25s linear infinite !important;
          }
          .v5-splash-screen .v5-splash-loader span {
            display: none !important;
          }
          @keyframes v5LogoReveal {
            0% { opacity: 0; filter: blur(14px); transform: scale(.78); }
            48% { opacity: .72; filter: blur(6px); transform: scale(.91); }
            78% { opacity: 1; filter: blur(1.5px); transform: scale(1.025); }
            100% { opacity: 1; filter: blur(0); transform: scale(1); }
          }
          @keyframes v5SplashTextIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes v5RingFlow {
            from { background-position: 0 0; }
            to { background-position: 18px 0; }
          }
        `;
        document.head.appendChild(style);
      }
    }

    /* Existing Step 4 bridge remains untouched. */
    if (!document.querySelector('script[data-v5-step4-final-fix]')) {
      var s = document.createElement('script');
      s.src = 'js/v5-step4-final-fix.js';
      s.setAttribute('data-v5-step4-final-fix', '1');
      document.body.appendChild(s);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply, { once: true });
  } else {
    apply();
  }
})();
