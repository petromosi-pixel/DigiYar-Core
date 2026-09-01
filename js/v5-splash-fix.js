/* DigiYar V5 — Splash reconstruction runtime */
(function () {
  'use strict';

  function apply() {
    var splash = document.getElementById('splashScreen');
    if (!splash) return;

    splash.classList.add('v5-splash-screen');

    var original = splash.querySelector('.v5-splash-logo');
    if (original) {
      original.src = './assets/logos/logo.png';
      original.removeAttribute('srcset');

      if (!splash.querySelector('.v5-logo-assembly')) {
        var wrap = document.createElement('div');
        wrap.className = 'v5-logo-assembly';

        var basket = document.createElement('img');
        basket.className = 'v5-logo-layer v5-logo-basket';
        basket.src = original.src;
        basket.alt = '';
        basket.setAttribute('aria-hidden', 'true');

        var smallHand = document.createElement('img');
        smallHand.className = 'v5-logo-layer v5-logo-hand-small';
        smallHand.src = original.src;
        smallHand.alt = '';
        smallHand.setAttribute('aria-hidden', 'true');

        var largeHand = document.createElement('img');
        largeHand.className = 'v5-logo-layer v5-logo-hand-large';
        largeHand.src = original.src;
        largeHand.alt = '';
        largeHand.setAttribute('aria-hidden', 'true');

        wrap.appendChild(basket);
        wrap.appendChild(smallHand);
        wrap.appendChild(largeHand);
        original.replaceWith(wrap);
      }
    }

    var brand = splash.querySelector('.splash-brand p');
    if (brand) brand.textContent = 'دستیار دنیای دیجیتال';

    var loader = splash.querySelector('.v5-splash-loader');
    if (loader) {
      loader.innerHTML = '<span class="v5-loader-dots" aria-hidden="true"><i></i><i></i><i></i><i></i></span>';
    }

    if (!document.getElementById('digiyar-v5-splash-final-runtime')) {
      var style = document.createElement('style');
      style.id = 'digiyar-v5-splash-final-runtime';
      style.textContent = `
        /* One Splash owner: this stylesheet is the only runtime animation layer. */
        .v5-splash-screen {
          background: #7890ad !important;
        }
        .v5-splash-screen .v5-splash-content,
        .v5-splash-screen .splash-content {
          width: min(90vw, 390px) !important;
        }
        .v5-splash-screen .v5-splash-logo-wrap {
          width: 250px !important;
          height: 250px !important;
          margin: 0 auto 14px !important;
          padding: 0 !important;
          background: transparent !important;
          border: 0 !important;
          box-shadow: none !important;
          border-radius: 0 !important;
          overflow: visible !important;
        }
        /* Remove any inherited decorative ring around the logo. */
        .v5-splash-screen .v5-splash-logo-wrap::before,
        .v5-splash-screen .v5-splash-logo-wrap::after,
        .v5-splash-screen .v5-logo-assembly::before,
        .v5-splash-screen .v5-logo-assembly::after {
          content: none !important;
          display: none !important;
        }
        .v5-splash-screen .v5-logo-assembly {
          position: relative;
          width: 242px;
          height: 242px;
          margin: 0 auto;
          isolation: isolate;
          overflow: visible;
        }
        .v5-splash-screen .v5-logo-layer {
          position: absolute;
          inset: 0;
          width: 100% !important;
          height: 100% !important;
          object-fit: contain !important;
          object-position: center !important;
          display: block;
          margin: 0;
          padding: 0;
          border: 0;
          border-radius: 0;
          box-shadow: none;
          pointer-events: none;
          user-select: none;
          -webkit-user-drag: none;
        }
        /* The asset is deliberately partitioned into non-overlapping regions. */
        .v5-splash-screen .v5-logo-basket {
          clip-path: inset(43% 0 0 0);
          animation: v5BasketIn 1.05s cubic-bezier(.2,.86,.22,1) .08s both;
          z-index: 1;
        }
        .v5-splash-screen .v5-logo-hand-small {
          clip-path: inset(0 48% 40% 0);
          transform-origin: 52% 50%;
          animation: v5SmallHandIn 1.35s cubic-bezier(.2,.8,.2,1) .78s both;
          z-index: 2;
        }
        .v5-splash-screen .v5-logo-hand-large {
          clip-path: inset(0 0 40% 48%);
          transform-origin: 48% 50%;
          animation: v5LargeHandIn 1.35s cubic-bezier(.2,.8,.2,1) .94s both;
          z-index: 3;
        }
        .v5-splash-screen .splash-brand h1 {
          color: #fff !important;
          opacity: 0;
          animation: v5BrandIn .72s ease 2.35s both !important;
        }
        .v5-splash-screen .splash-brand p {
          color: #fff !important;
          opacity: 0;
          text-shadow: 0 0 0 rgba(255,138,0,0);
          animation: v5TaglineGlow 1s ease 2.72s both !important;
        }
        .v5-splash-screen .v5-splash-loader,
        .v5-splash-screen .splash-loader {
          width: 72px !important;
          height: 10px !important;
          margin: 20px auto 0 !important;
          padding: 0 !important;
          overflow: visible !important;
          border: 0 !important;
          border-radius: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
        }
        .v5-splash-screen .v5-loader-dots {
          display: flex !important;
          width: 72px;
          height: 10px;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .v5-splash-screen .v5-loader-dots i {
          width: 7px;
          height: 7px;
          flex: 0 0 7px;
          display: block;
          box-sizing: border-box;
          border: 1px solid #fff;
          border-radius: 50%;
          background: transparent;
          animation: v5DotFill 1.55s ease-in-out infinite;
        }
        .v5-splash-screen .v5-loader-dots i:nth-child(1) { animation-delay: 0s; }
        .v5-splash-screen .v5-loader-dots i:nth-child(2) { animation-delay: .18s; }
        .v5-splash-screen .v5-loader-dots i:nth-child(3) { animation-delay: .36s; }
        .v5-splash-screen .v5-loader-dots i:nth-child(4) { animation-delay: .54s; }
        .v5-splash-screen .v5-splash-loader > span:not(.v5-loader-dots) { display: none !important; }

        @keyframes v5BasketIn {
          0% { opacity: 0; transform: translateY(18px) scale(.82); }
          70% { opacity: 1; transform: translateY(-2px) scale(1.025); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes v5SmallHandIn {
          0% { opacity: 0; transform: translate(-74px,-34px) rotate(-12deg) scale(.86); }
          45% { opacity: 1; transform: translate(30px,7px) rotate(4deg) scale(1.02); }
          66% { transform: translate(9px,-1px) rotate(-1deg) scale(1.035); }
          100% { opacity: 1; transform: translate(0,0) rotate(0) scale(1); }
        }
        @keyframes v5LargeHandIn {
          0% { opacity: 0; transform: translate(74px,-34px) rotate(12deg) scale(.86); }
          45% { opacity: 1; transform: translate(-30px,7px) rotate(-4deg) scale(1.02); }
          66% { transform: translate(-9px,-1px) rotate(1deg) scale(1.035); }
          100% { opacity: 1; transform: translate(0,0) rotate(0) scale(1); }
        }
        @keyframes v5BrandIn {
          from { opacity: 0; transform: translateY(7px) scale(.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes v5TaglineGlow {
          0% { opacity: 0; transform: translateY(7px); text-shadow: 0 0 0 rgba(255,138,0,0); }
          55% { opacity: 1; transform: translateY(0); text-shadow: 0 0 13px rgba(255,138,0,.72), 0 0 24px rgba(255,255,255,.22); }
          100% { opacity: 1; transform: translateY(0); text-shadow: 0 0 7px rgba(255,138,0,.3); }
        }
        @keyframes v5DotFill {
          0%, 22% { background: transparent; border-color: #fff; transform: scale(1); }
          44%, 70% { background: #ff8a00; border-color: #ff8a00; transform: scale(1.08); }
          90%, 100% { background: transparent; border-color: #fff; transform: scale(1); }
        }
        @media (max-width: 430px) {
          .v5-splash-screen .v5-splash-logo-wrap { width: 225px !important; height: 225px !important; }
          .v5-splash-screen .v5-logo-assembly { width: 218px; height: 218px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .v5-splash-screen .v5-logo-layer,
          .v5-splash-screen .splash-brand h1,
          .v5-splash-screen .splash-brand p,
          .v5-splash-screen .v5-loader-dots i { animation: none !important; opacity: 1 !important; }
        }
      `;
      document.head.appendChild(style);
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
