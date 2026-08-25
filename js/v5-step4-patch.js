/* V5 Step 4 — interaction patch: toggle is UI-only; clear is data/results-only */
(function(){'use strict';
function init(){
 const card=document.querySelector('.v5-profile-card');
 const grid=card&&card.querySelector('#profileForm .form-grid');
 const store=document.getElementById('storeSelect');
 const cat=document.getElementById('v5Category');
 const sub=document.getElementById('v5Subcategory');
 const budget=document.getElementById('budgetMax');
 const dyn=document.getElementById('v5DynamicFields');
 const reset=document.getElementById('resetProfile');
 const toggle=document.getElementById('v5Step4Toggle');
 if(!card||!grid||!store||!cat||!budget||!dyn||!toggle)return;
 const budgetField=budget.closest('.v5-field');
 const catField=cat.closest('.v5-field');
 const subField=sub&&sub.closest('.v5-field');
 const freshToggle=toggle.cloneNode(true);toggle.replaceWith(freshToggle);
 const t=freshToggle;
 grid.appendChild(t);
 t.classList.add('v5-step4-final-toggle');
 function syncToggleIcon(open){const icon=t.querySelector('.v5-step4-toggle-icon');if(icon)icon.textContent=open?'⌃':'⌄';t.setAttribute('aria-label',open?'بستن جزئیات خرید':'باز کردن جزئیات خرید');}
 function budgetState(){const visible=cat.value==='digital';if(budgetField){budgetField.hidden=!visible;budgetField.style.display=visible?'flex':'none';}}
 function setOpen(open){t.setAttribute('aria-expanded',String(open));t.classList.toggle('is-open',open);syncToggleIcon(open);if(catField)catField.hidden=!open;if(subField)subField.hidden=!open||!cat.value;budgetState();dyn.hidden=!open||!dyn.children.length;dyn.style.display=open&&dyn.children.length?'grid':'none';}
 function clearResults(){['digiyar-products','recommendations'].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML='';});const inline=document.getElementById('v5InlineResults');if(inline)inline.hidden=true;const summary=document.getElementById('needSummary');if(summary){summary.innerHTML='';summary.classList.add('empty');summary.hidden=true;}const result=document.getElementById('resultSection');if(result)result.hidden=true;}
 function clearInputsOnly(){store.value='';cat.value='';cat.disabled=true;if(sub){sub.value='';sub.disabled=true;sub.innerHTML='<option value="">ابتدا دسته‌بندی را انتخاب کنید</option>';}budget.value='';dyn.innerHTML='';dyn.hidden=true;dyn.style.display='none';if(catField)catField.hidden=false;if(subField)subField.hidden=true;budgetState();clearResults();}
 t.addEventListener('click',function(){setOpen(t.getAttribute('aria-expanded')!=='true');});
 store.addEventListener('change',function(){setOpen(true);budgetState();});
 cat.addEventListener('change',function(){setOpen(true);budgetState();});
 if(sub)sub.addEventListener('change',function(){setOpen(true);budgetState();});
 if(reset){const freshReset=reset.cloneNode(true);reset.replaceWith(freshReset);freshReset.addEventListener('click',function(){clearInputsOnly();});}
 budgetState();setOpen(false);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else setTimeout(init,0);
})();
