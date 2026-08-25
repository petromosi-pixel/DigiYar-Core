/* DigiYar V5 — Splash copy bridge + final Step 4 loaders */
(function () {
  'use strict';
  function load(src, attr) {
    if (document.querySelector('script[' + attr + ']')) return;
    var s=document.createElement('script'); s.src=src; s.setAttribute(attr,'1'); document.body.appendChild(s);
  }
  function apply() {
    var splash=document.getElementById('splashScreen');
    if(splash){splash.classList.add('v5-splash-screen');var brand=splash.querySelector('.splash-brand p');if(brand)brand.textContent='دستیار دنیای دیجیتال';}
    load('js/v5-step4-final.js','data-v5-step4-final');
    load('js/v5-step4-final-fix.js','data-v5-step4-final-fix');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
