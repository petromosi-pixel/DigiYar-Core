/* DigiYar V5 — Splash copy bridge + final Step 4 runtime */
(function () {
  'use strict';
  function apply() {
    var splash=document.getElementById('splashScreen');
    if(splash){splash.classList.add('v5-splash-screen');var brand=splash.querySelector('.splash-brand p');if(brand)brand.textContent='دستیار دنیای دیجیتال';}
    if(!document.querySelector('script[data-v5-step4-final-fix]')){var s=document.createElement('script');s.src='js/v5-step4-final-fix.js';s.setAttribute('data-v5-step4-final-fix','1');document.body.appendChild(s);}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
