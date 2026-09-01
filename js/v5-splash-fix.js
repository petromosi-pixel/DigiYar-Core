/* =========================================================
   DigiYar V5 — Splash Final Reconstruction
   Reference: digiyar-splash-3.mp4
   One owner / isolated DOM / component masks
   ========================================================= */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var VIEW_W = 780;
  var VIEW_H = 900;
  var LOGO_SRC = './assets/logos/logo.png';

  /* Shapes traced from the supplied reference video frame.
     The white and orange hand masks are used to subtract those components
     from the basket layer, so the hands cannot appear before their entrances. */
  var WHITE_HAND_PATH = 'M348 147 L351 181 L354 185 L487 185 C507 185 524 196 533 212 C541 226 535 250 520 260 C506 265 486 262 460 248 L447 244 L426 244 C414 248 400 259 377 291 C375 301 380 307 392 308 C398 305 407 293 423 278 C430 275 435 276 442 283 L505 344 C520 348 537 335 550 319 C567 299 578 279 578 261 L578 240 C574 215 563 195 540 170 C524 156 505 147 485 146 Z';
  var ORANGE_HAND_PATH = 'M202 273 L202 281 L208 285 L281 285 L284 288 L282 321 L286 325 L292 326 L290 327 L327 327 L327 329 L343 333 L342 335 L346 337 L356 327 L364 327 L372 335 L372 345 L378 341 L387 343 L392 348 L392 361 L403 359 L410 366 L410 377 L421 377 L426 382 L427 389 L438 397 L447 395 L451 391 L453 384 L450 378 L427 354 L431 351 L458 379 L469 379 L475 371 L473 362 L457 347 L447 335 L450 332 L455 335 L479 361 L489 361 L495 356 L496 348 L493 342 L457 307 L441 288 L432 282 L425 284 L395 314 L380 314 L374 310 L369 300 L365 297 L365 288 L373 277 L377 264 L365 254 L337 242 L330 242 L328 240 L294 240 L288 249 L288 261 L283 268 L208 268 Z';

  var WHITE_FINGERS = [
    [358,342,13], [377,357,14], [396,373,14], [414,390,13]
  ];

  function svgEl(name) {
    return document.createElementNS(NS, name);
  }

  function addPath(parent, d, fill) {
    var p = svgEl('path');
    p.setAttribute('d', d);
    p.setAttribute('fill', fill);
    parent.appendChild(p);
    return p;
  }

  function addCircle(parent, x, y, r, fill) {
    var c = svgEl('circle');
    c.setAttribute('cx', x);
    c.setAttribute('cy', y);
    c.setAttribute('r', r);
    c.setAttribute('fill', fill);
    parent.appendChild(c);
  }

  function createLayer(className, maskBuilder) {
    var svg = svgEl('svg');
    svg.setAttribute('class', 'v5-splash-layer ' + className);
    svg.setAttribute('viewBox', '0 0 ' + VIEW_W + ' ' + VIEW_H);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('aria-hidden', 'true');

    var defs = svgEl('defs');
    var mask = svgEl('mask');
    var maskId = 'v5-' + className + '-mask-' + Math.random().toString(36).slice(2);
    mask.setAttribute('id', maskId);
    mask.setAttribute('maskUnits', 'userSpaceOnUse');
    mask.setAttribute('x', '0');
    mask.setAttribute('y', '0');
    mask.setAttribute('width', VIEW_W);
    mask.setAttribute('height', VIEW_H);

    maskBuilder(mask);
    defs.appendChild(mask);
    svg.appendChild(defs);

    var image = svgEl('image');
    image.setAttribute('x', '0');
    image.setAttribute('y', '0');
    image.setAttribute('width', VIEW_W);
    image.setAttribute('height', VIEW_H);
    image.setAttribute('preserveAspectRatio', 'none');
    image.setAttribute('href', LOGO_SRC);
    image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', LOGO_SRC);
    image.setAttribute('mask', 'url(#' + maskId + ')');
    svg.appendChild(image);
    return svg;
  }

  function buildBasketMask(mask) {
    /* Entire logo asset is available to the basket layer, then both hands are
       subtracted. This keeps the exact basket/handle artwork and its shadows. */
    var rect = svgEl('rect');
    rect.setAttribute('x', '0'); rect.setAttribute('y', '0');
    rect.setAttribute('width', VIEW_W); rect.setAttribute('height', VIEW_H);
    rect.setAttribute('fill', 'white');
    mask.appendChild(rect);
    addPath(mask, WHITE_HAND_PATH, 'black');
    WHITE_FINGERS.forEach(function (f) { addCircle(mask, f[0], f[1], f[2], 'black'); });
    addPath(mask, ORANGE_HAND_PATH, 'black');
    addCircle(mask, 178, 342, 7, 'black');
  }

  function buildWhiteMask(mask) {
    addPath(mask, WHITE_HAND_PATH, 'white');
    WHITE_FINGERS.forEach(function (f) { addCircle(mask, f[0], f[1], f[2], 'white'); });
  }

  function buildOrangeMask(mask) {
    addPath(mask, ORANGE_HAND_PATH, 'white');
    addCircle(mask, 178, 342, 7, 'white');
  }

  function apply() {
    var splash = document.getElementById('splashScreen');
    if (!splash) return;

    splash.className = 'splash-screen v5-splash-screen';
    splash.setAttribute('data-v5-splash-owner', 'final');

    var wrap = splash.querySelector('.v5-splash-logo-wrap');
    if (!wrap) return;

    /* Remove the old single logo completely. This also removes the old icon-512
       white-background artwork before it can participate in the animation. */
    wrap.innerHTML = '';
    wrap.className = 'v5-splash-logo-wrap v5-splash-logo-stage';

    var assembly = document.createElement('div');
    assembly.className = 'v5-logo-assembly-final';

    var basket = createLayer('v5-basket-layer', buildBasketMask);
    var whiteHand = createLayer('v5-white-hand-layer', buildWhiteMask);
    var orangeHand = createLayer('v5-orange-hand-layer', buildOrangeMask);

    assembly.appendChild(basket);
    assembly.appendChild(whiteHand);
    assembly.appendChild(orangeHand);
    wrap.appendChild(assembly);

    var brand = splash.querySelector('.splash-brand');
    if (brand) {
      brand.classList.add('v5-splash-brand-final');
      var title = brand.querySelector('h1');
      var tagline = brand.querySelector('p');
      if (title) title.textContent = 'دیجی‌یار';
      if (tagline) tagline.textContent = 'دستیار دنیای دیجیتال';
    }

    var loader = splash.querySelector('.v5-splash-loader');
    if (loader) {
      loader.innerHTML = '<span class="v5-loader-dots-final" aria-hidden="true"><i></i><i></i><i></i><i></i></span>';
      loader.className = 'splash-loader v5-splash-loader v5-splash-loader-final';
    }

    var oldRuntime = document.getElementById('digiyar-v5-splash-runtime');
    if (oldRuntime) oldRuntime.remove();
    var oldFinalRuntime = document.getElementById('digiyar-v5-splash-final-runtime');
    if (oldFinalRuntime) oldFinalRuntime.remove();

    if (!document.getElementById('digiyar-v5-splash-video-reconstruction')) {
      var style = document.createElement('style');
      style.id = 'digiyar-v5-splash-video-reconstruction';
      style.textContent = `
        /* =====================================================
           VIDEO-REFERENCE SPLASH — SINGLE OWNER
           No legacy ring, no legacy logo animation, no overlap.
           ===================================================== */
        .v5-splash-screen {
          background: #aebdcc !important;
          overflow: hidden !important;
        }
        .v5-splash-screen .v5-splash-content,
        .v5-splash-screen .splash-content {
          width: min(92vw, 430px) !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          text-align: center !important;
        }
        .v5-splash-screen .v5-splash-logo-stage,
        .v5-splash-screen .v5-splash-logo-wrap {
          width: 300px !important;
          height: 346px !important;
          margin: 0 auto !important;
          padding: 0 !important;
          background: transparent !important;
          border: 0 !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          outline: 0 !important;
          overflow: visible !important;
          display: flex !important;
          align-items: flex-start !important;
          justify-content: center !important;
        }
        .v5-splash-screen .v5-splash-logo-stage::before,
        .v5-splash-screen .v5-splash-logo-stage::after,
        .v5-splash-screen .v5-splash-logo-wrap::before,
        .v5-splash-screen .v5-splash-logo-wrap::after,
        .v5-splash-screen .v5-logo-assembly-final::before,
        .v5-splash-screen .v5-logo-assembly-final::after {
          content: none !important;
          display: none !important;
        }
        .v5-splash-screen .v5-logo-assembly-final {
          position: relative !important;
          width: 300px !important;
          height: 300px !important;
          flex: 0 0 300px !important;
          overflow: visible !important;
          isolation: isolate !important;
          filter: drop-shadow(0 10px 22px rgba(20,55,95,.14));
        }
        .v5-splash-screen .v5-splash-layer {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 300px !important;
          height: 346px !important;
          display: block !important;
          overflow: visible !important;
          pointer-events: none !important;
          transform-origin: 50% 45% !important;
          will-change: transform, opacity !important;
        }
        .v5-splash-screen .v5-basket-layer {
          z-index: 1 !important;
          animation: v5VideoBasket 1.05s cubic-bezier(.18,.82,.22,1) .08s both !important;
        }
        .v5-splash-screen .v5-white-hand-layer {
          z-index: 2 !important;
          animation: v5VideoWhiteHand 1.22s cubic-bezier(.16,.84,.2,1) 1.02s both !important;
        }
        .v5-splash-screen .v5-orange-hand-layer {
          z-index: 3 !important;
          animation: v5VideoOrangeHand 1.30s cubic-bezier(.16,.84,.2,1) 2.05s both !important;
        }

        /* Reference-video sequence:
           basket first -> white hand from right -> orange hand from left -> settle. */
        @keyframes v5VideoBasket {
          0% { opacity: 0; transform: translateY(20px) scale(.56); }
          58% { opacity: 1; transform: translateY(-2px) scale(1.035); }
          78% { transform: translateY(1px) scale(.985); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes v5VideoWhiteHand {
          0% { opacity: 0; transform: translateX(128px) translateY(-3px) rotate(3deg) scale(.90); }
          48% { opacity: 1; transform: translateX(-8px) translateY(0) rotate(-1deg) scale(1.01); }
          68% { transform: translateX(-20px) translateY(2px) rotate(-2deg) scale(1.025); }
          82% { transform: translateX(3px) translateY(-1px) rotate(1deg) scale(1.01); }
          100% { opacity: 1; transform: translateX(0) translateY(0) rotate(0) scale(1); }
        }
        @keyframes v5VideoOrangeHand {
          0% { opacity: 0; transform: translateX(-132px) translateY(2px) rotate(-4deg) scale(.90); }
          44% { opacity: 1; transform: translateX(16px) translateY(0) rotate(2deg) scale(1.015); }
          64% { transform: translateX(26px) translateY(1px) rotate(3deg) scale(1.025); }
          82% { transform: translateX(-3px) translateY(-1px) rotate(-1deg) scale(1.01); }
          100% { opacity: 1; transform: translateX(0) translateY(0) rotate(0) scale(1); }
        }

        .v5-splash-screen .splash-brand,
        .v5-splash-screen .v5-splash-brand-final {
          margin-top: -4px !important;
          opacity: 1 !important;
          transform: none !important;
          animation: none !important;
        }
        .v5-splash-screen .splash-brand h1 {
          margin: 0 !important;
          color: #ff8a00 !important;
          font-size: 34px !important;
          line-height: 1.25 !important;
          font-weight: 900 !important;
          opacity: 0 !important;
          transform: translateY(8px) scale(.96) !important;
          animation: v5VideoTitle .72s cubic-bezier(.2,.8,.2,1) 4.38s both !important;
        }
        .v5-splash-screen .splash-brand p {
          margin: 5px 0 0 !important;
          color: #fff !important;
          font-size: 14px !important;
          line-height: 1.5 !important;
          font-weight: 600 !important;
          opacity: 0 !important;
          transform: translateY(8px) !important;
          text-shadow: 0 0 0 rgba(255,138,0,0) !important;
          animation: v5VideoTagline 1.0s ease 4.78s both !important;
        }
        @keyframes v5VideoTitle {
          0% { opacity: 0; transform: translateY(8px) scale(.96); }
          65% { opacity: 1; transform: translateY(0) scale(1.025); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes v5VideoTagline {
          0% { opacity: 0; transform: translateY(8px); text-shadow: 0 0 0 rgba(255,138,0,0); }
          45% { opacity: 1; transform: translateY(0); text-shadow: 0 0 16px rgba(255,138,0,.82), 0 0 28px rgba(255,255,255,.28); }
          100% { opacity: 1; transform: translateY(0); text-shadow: 0 0 7px rgba(255,138,0,.34); }
        }

        .v5-splash-screen .v5-splash-loader-final {
          width: 72px !important;
          height: 10px !important;
          margin: 17px auto 0 !important;
          padding: 0 !important;
          background: transparent !important;
          border: 0 !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          overflow: visible !important;
        }
        .v5-splash-screen .v5-loader-dots-final {
          width: 72px !important;
          height: 10px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 8px !important;
        }
        .v5-splash-screen .v5-loader-dots-final i {
          display: block !important;
          width: 7px !important;
          height: 7px !important;
          flex: 0 0 7px !important;
          box-sizing: border-box !important;
          border: 1px solid #fff !important;
          border-radius: 50% !important;
          background: transparent !important;
          opacity: 1 !important;
          transform: scale(1) !important;
          animation: v5VideoDot 1.55s ease-in-out infinite !important;
        }
        .v5-splash-screen .v5-loader-dots-final i:nth-child(1) { animation-delay: 0s !important; }
        .v5-splash-screen .v5-loader-dots-final i:nth-child(2) { animation-delay: .18s !important; }
        .v5-splash-screen .v5-loader-dots-final i:nth-child(3) { animation-delay: .36s !important; }
        .v5-splash-screen .v5-loader-dots-final i:nth-child(4) { animation-delay: .54s !important; }
        @keyframes v5VideoDot {
          0%, 22% { background: transparent; border-color: #fff; transform: scale(1); }
          42%, 70% { background: #ff8a00; border-color: #ff8a00; transform: scale(1.08); }
          90%, 100% { background: transparent; border-color: #fff; transform: scale(1); }
        }
        @media (max-width: 430px) {
          .v5-splash-screen .v5-splash-logo-stage,
          .v5-splash-screen .v5-splash-logo-wrap { width: 260px !important; height: 300px !important; }
          .v5-splash-screen .v5-logo-assembly-final { width: 260px !important; height: 300px !important; flex-basis: 260px !important; }
          .v5-splash-screen .v5-splash-layer { width: 260px !important; height: 300px !important; }
          .v5-splash-screen .splash-brand h1 { font-size: 31px !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .v5-splash-screen .v5-splash-layer,
          .v5-splash-screen .splash-brand h1,
          .v5-splash-screen .splash-brand p,
          .v5-splash-screen .v5-loader-dots-final i { animation: none !important; opacity: 1 !important; transform: none !important; }
        }
      `;
      document.head.appendChild(style);
    }

    /* Keep the already-fixed Step 4 bridge available; it has no Splash ownership. */
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
