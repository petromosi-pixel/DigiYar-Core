/* =========================================================
   DigiYar V4 — Main Application
   Build 12 — async retrieval + product cards
   ========================================================= */
(function () {
  "use strict";
  function $(id){return document.getElementById(id);}
  function escapeHTML(value){return String(value??"").replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c];});}
  function toArray(value){return Array.isArray(value)?value:[];}
  function getProductImage(product){return product&&(product.image||product.imageUrl||product.thumbnail||product.thumbnailUrl||product.photo||"");}
  function priorityLabel(index){return ["اولویت اول","اولویت دوم","اولویت سوم"][index]||"اولویت "+(index+1);}

  const splash=$("splashScreen");
  const splashStarted=performance.now();
  let splashClosed=false;
  function hideSplash(){if(splashClosed||!splash)return;splashClosed=true;splash.classList.add("splash-hidden");setTimeout(function(){if(splash.parentNode)splash.parentNode.removeChild(splash);},700);}
  function finishSplash(){if(splashClosed)return;setTimeout(hideSplash,Math.max(0,5000-(performance.now()-splashStarted)));}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",finishSplash,{once:true});else finishSplash();
  setTimeout(hideSplash,6000);

  function renderPlatforms(){
    const container=$("platforms");if(!container||!window.DigiYarPlatforms)return;
    container.innerHTML=DigiYarPlatforms.map(function(platform){return '<a class="platform" href="'+escapeHTML(platform.url)+'" target="_blank" rel="noopener noreferrer"><div class="platform-main"><div class="platform-logo"><img src="'+escapeHTML(platform.logo)+'" alt="'+escapeHTML(platform.name)+'" loading="lazy"></div><span class="platform-name">'+escapeHTML(platform.name)+'</span><span class="platform-tag">'+escapeHTML(platform.tag)+'</span></div><span class="platform-btn">ورود به فروشگاه</span></a>';}).join("");
  }

  async function getRecommendations(need){
    const engine=window.DigiYarSmartRecommendation||window.DigiYarSmartRecommendationEngine;
    if(!engine||typeof engine.recommend!=="function")return[];
    try{const result=await engine.recommend(need,{limit:3});return result&&Array.isArray(result.recommendations)?result.recommendations:[];}catch(error){console.warn("DigiYar Recommendation:",error);return[];}
  }

  function renderRecommendationCard(product,index){
    const image=getProductImage(product),features=toArray(product.features);
    const price=product.price!=null&&Number(product.price)>0?new Intl.NumberFormat("fa-IR").format(product.price)+" تومان":"قیمت نامشخص";
    const url=product.affiliateUrl||product.productUrl||product.url||"#";
    return '<article class="recommendation" data-rank="'+escapeHTML(index+1)+'"><div class="recommendation-rank">'+escapeHTML(priorityLabel(index))+'</div>'+(image?'<div class="recommendation-product-image"><img src="'+escapeHTML(image)+'" alt="'+escapeHTML(product.name||"محصول پیشنهادی")+'" loading="lazy"></div>':'')+'<h3>'+escapeHTML(product.name||"محصول پیشنهادی")+'</h3><p class="recommendation-price">'+escapeHTML(price)+'</p>'+(features.length?'<p class="recommendation-features">'+escapeHTML(features.join("، "))+'</p>':'')+'<a class="recommendation-link" href="'+escapeHTML(url)+'" target="_blank" rel="noopener noreferrer">مشاهده کالا</a></article>';
  }

  function fillForm(profile){
    if(!profile)return;const d=profile.declared||{};
    if($("category"))$("category").value=d.category||"general";
    if($("budgetMax"))$("budgetMax").value=d.budget&&d.budget.max?d.budget.max:"";
    if($("priorities"))$("priorities").value=(d.priorities||[]).join("، ");
    if($("usage"))$("usage").value=d.usage||"";
    if($("requirements"))$("requirements").value=(d.requirements||[]).join("، ");
    if($("constraints"))$("constraints").value=(d.constraints||[]).join("، ");
  }

  async function renderProfile(profile){
    const summary=$("needSummary"),box=$("recommendations"),hint=$("resultHint");if(!summary||!box||!hint)return;
    summary.className="need-summary empty";summary.textContent="";
    if(!profile){box.innerHTML="";hint.textContent="برای شروع اطلاعات خریدت رو وارد کن.";return;}
    if(!window.DigiYarNeedEngine){hint.textContent="موتور تحلیل نیاز در دسترس نیست.";return;}
    let need;try{need=window.DigiYarNeedEngine.buildNeedFromProfile(profile);}catch(error){console.error("DigiYar Need Engine:",error);hint.textContent="خطا در ساخت نیاز خرید.";return;}
    if(!need)return;
    hint.textContent="در حال پیدا کردن کالاهای مناسب...";box.innerHTML='<div class="recommendation-loading">در حال جستجوی کالاهای واقعی...</div>';
    const recommendations=await getRecommendations(need);
    if(!recommendations.length){box.innerHTML='<div class="need-summary">برای این نیاز هنوز پیشنهاد مناسبی پیدا نشد.</div>';hint.textContent="اطلاعات بیشتری وارد کن تا پیشنهادهای دقیق‌تری ساخته شود.";return;}
    box.innerHTML=recommendations.map(renderRecommendationCard).join("");
    hint.textContent="بر اساس اولویت‌های انتخابی تو به ترتیب زیر پیشنهاد میشن";
  }

  const profileForm=$("profileForm");
  if(profileForm)profileForm.addEventListener("submit",async function(event){
    event.preventDefault();if(!window.DigiYarUserProfile)return;
    try{
      const profile=window.DigiYarUserProfile.normalize({category:$("category")?$("category").value:"",budgetMax:$("budgetMax")?$("budgetMax").value:"",priorities:$("priorities")?$("priorities").value:"",usage:$("usage")?$("usage").value:"",requirements:$("requirements")?$("requirements").value:"",constraints:$("constraints")?$("constraints").value:""});
      window.DigiYarUserProfile.save(profile);await renderProfile(profile);const resultSection=$("resultSection");if(resultSection)resultSection.scrollIntoView({behavior:"smooth",block:"start"});
    }catch(error){console.error("DigiYar Profile:",error);}
  });

  const reset=$("resetProfile");
  if(reset)reset.addEventListener("click",function(){if(window.DigiYarUserProfile)window.DigiYarUserProfile.clear();if($("profileForm"))$("profileForm").reset();renderProfile(null);});

  let deferredInstallPrompt=null;const installPrompt=$("installPrompt"),installBtn=$("installBtn"),installDismiss=$("installDismiss");
  window.addEventListener("beforeinstallprompt",function(event){event.preventDefault();deferredInstallPrompt=event;if(installPrompt){installPrompt.classList.remove("hidden");requestAnimationFrame(function(){installPrompt.classList.add("show");});}});
  if(installBtn)installBtn.addEventListener("click",async function(){if(!deferredInstallPrompt)return;deferredInstallPrompt.prompt();try{await deferredInstallPrompt.userChoice;}catch(e){}deferredInstallPrompt=null;if(installPrompt)installPrompt.classList.remove("show");});
  if(installDismiss)installDismiss.addEventListener("click",function(){if(installPrompt)installPrompt.classList.remove("show");});

  renderPlatforms();
  let savedProfile=null;if(window.DigiYarUserProfile){try{savedProfile=window.DigiYarUserProfile.getProfile();}catch(error){savedProfile=null;}}
  fillForm(savedProfile);renderProfile(savedProfile);
})();
