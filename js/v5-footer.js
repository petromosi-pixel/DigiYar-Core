/* DigiYar V5 — Footer panels */
(function(){'use strict';
function init(){
 const footer=document.querySelector('.main-footer');
 if(!footer)return;
 const buttons=footer.querySelectorAll('[data-footer-panel]');
 const panels=footer.querySelectorAll('.footer-panel');
 buttons.forEach(button=>button.addEventListener('click',function(){
   const key=this.getAttribute('data-footer-panel');
   const panel=footer.querySelector('#footer-'+key);
   if(!panel)return;
   const wasOpen=!panel.hidden;
   panels.forEach(p=>{p.hidden=true;p.classList.remove('is-open');});
   buttons.forEach(b=>{b.classList.remove('is-active');b.setAttribute('aria-expanded','false');});
   if(!wasOpen){panel.hidden=false;panel.classList.add('is-open');this.classList.add('is-active');this.setAttribute('aria-expanded','true');panel.scrollIntoView({behavior:'smooth',block:'nearest'});}
 }));
 buttons.forEach(b=>b.setAttribute('aria-expanded','false'));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
