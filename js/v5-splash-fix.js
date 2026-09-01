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

      /* Build three visual layers from the real logo asset. This preserves the
         approved artwork while allowing the basket and two hands to animate independently. */
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
    if (loader && !loader.querySelector('.v5-loader-dots')) {
      loader.innerHTML = '<span class="v5-loader-dots" aria-hidden="true"><i></i><i></i><i></i><i></i></span>';
    }

    if (!document.getElementById('digiyar-v5-splash-final-runtime')) {
      var style = document.createElement('style');
      style.id = 'digiyar-v5-splash-final-runtime';
      style.textContent = `
        .v5-splash-screen {
          background: radial-gradient(circle at 50% 45%, #35527d 0%, #2f4a72 46%, #294365 100%) !important;
        }
        .v5-splash-screen .v5-splash-logo-wrap {
          width: 238px !important;
          height: 238px !important;
          margin-bottom: 17px !important;
          background: transparent !important;
          box-shadow: none !important;
          border-radius: 0 !important;
        }
        .v5-splash-screen .v5-logo-assembly {
          position: relative;
          width: 226px;
          height: 226px;
          margin: 0 auto;
        }
        .v5-splash-screen .v5-logo-layer {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
          pointer-events: none;
          user-select: none;
        }
        /* Basket enters first and settles in place. */
        .v5-splash-screen .v5-logo-basket {
          clip-path: polygon(17% 31%, 83% 31%, 91% 91%, 9% 91%);
          animation: v5BasketIn 1.05s cubic-bezier(.2,.85,.25,1) .08s both;
        }
        /* The two hands travel inward, briefly meeting in front, then settle. */
        .v5-splash-screen .v5-logo-hand-small {
          clip-path: polygon(4% 0, 55% 0, 58% 53%, 5% 57%);
          transform-origin: 55% 48%;
          animation: v5SmallHandIn 1.45s cubic-bezier(.2,.8,.2,1) .82s both;
        }
        .v5-splash-screen .v5-logo-hand-large {
          clip-path: polygon(45% 0, 96% 0, 95% 57%, 42% 53%);
          transform-origin: 45% 48%;
          animation: v5LargeHandIn 1.45s cubic-bezier(.2,.8,.2,1) .98s both;
        }
        .v5-splash-screen .splash-brand h1 {
          color: #fff !important;
          opacity: 0;
          animation: v5BrandIn .75s ease 2.45s both !important;
        }
        .v5-splash-screen .splash-brand p {
          color: #fff !important;
          opacity: 0;
          text-shadow: 0 0 0 rgba(255,138,0,0);
          animation: v5TaglineGlow 1.05s ease 2.82s both !important;
        }
        .v5-splash-screen .v5-splash-loader {
          width: 92px !important;
          height: 12px !important;
          margin: 23px auto 0 !important;
          overflow: visible !important;
          background: transparent !important;
        }
        .v5-splash-screen .v5-loader-dots {
          display: flex !important;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          height: 12px;
        }
        .v5-splash-screen .v5-loader-dots i {
          width: 8px;
          height: 8px;
          box-sizing: border-box;
          display: block;
          border: 2px solid rgba(255,255,255,.95);
          border-radius: 50%;
          background: transparent;
          animation: v5DotFill 1.6s ease-in-out infinite;
        }
        .v5-splash-screen .v5-loader-dots i:nth-child(1) { animation-delay: 0s; }
        .v5-splash-screen .v5-loader-dots i:nth-child(2) { animation-delay: .18s; }
        .v5-splash-screen .v5-loader-dots i:nth-child(3) { animation-delay: .36s; }
        .v5-splash-screen .v5-loader-dots i:nth-child(4) { animation-delay: .54s; }

        @keyframes v5BasketIn {
          0% { opacity: 0; transform: translateY(22px) scale(.72); }
          65% { opacity: 1; transform: translateY(-4px) scale(1.035); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes v5SmallHandIn {
          0% { opacity: 0; transform: translate(-72px,-36px) rotate(-18deg) scale(.82); }
          48% { opacity: 1; transform: translate(43px,8px) rotate(5deg) scale(1.02); }
          63% { transform: translate(17px,-2px) rotate(-2deg) scale(1.045); }
          100% { opacity: 1; transform: translate(0,0) rotate(0) scale(1); }
        }
        @keyframes v5LargeHandIn {
          0% { opacity: 0; transform: translate(72px,-38px) rotate(18deg) scale(.82); }
          48% { opacity: 1; transform: translate(-43px,8px) rotate(-5deg) scale(1.02); }
          63% { transform: translate(-17px,-2px) rotate(2deg) scale(1.045); }
          100% { opacity: 1; transform: translate(0,0) rotate(0) scale(1); }
        }
        @keyframes v5BrandIn {
          from { opacity: 0; transform: translateY(8px) scale(.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes v5TaglineGlow {
          0% { opacity: 0; transform: translateY(8px); text-shadow: 0 0 0 rgba(255,138,0,0); }
          55% { opacity: 1; transform: translateY(0); text-shadow: 0 0 16px rgba(255,138,0,.72), 0 0 30px rgba(255,255,255,.22); }
          100% { opacity: 1; transform: translateY(0); text-shadow: 0 0 8px rgba(255,138,0,.28); }
        }
        @keyframes v5DotFill {
          0%, 20% { background: transparent; border-color: rgba(255,255,255,.95); transform: scale(1); }
          42%, 70% { background: #ff8a00; border-color: #ff8a00; transform: scale(1.04); }
          92%, 100% { background: transparent; border-color: rgba(255,255,255,.95); transform: scale(1); }
        }
        @media (max-width: 430px) {
          .v5-splash-screen .v5-splash-logo-wrap { width: 216px !important; height: 216px !important; }
          .v5-splash-screen .v5-logo-assembly { width: 210px; height: 210px; }
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
