/* DigiYar V5 — Step 4 stable interaction/UI bridge */
(function(){'use strict';
function init(){
 const card=document.querySelector('.v5-profile-card');
 const form=document.getElementById('profileForm');
 const grid=card&&form&&form.querySelector('.form-grid');
 const store=document.getElementById('storeSelect');
 const cat=document.getElementById('v5Category');
 const sub=document.getElementById('v5Subcategory');
 const budget=document.getElementById('budgetMax');
 const dyn=document.getElementById('v5DynamicFields');
 const reset=document.getElementById('resetProfile');
 const toggle=document.getElementById('v5Step4Toggle');
 if(!card||!form||!grid||!store||!cat||!budget||!dyn||!toggle)return;
 const budgetField=budget.closest('.v5-field'),catField=cat.closest('.v5-field'),subField=sub&&sub.closest('.v5-field');
 const freshToggle=toggle.cloneNode(true);toggle.replaceWith(freshToggle);const t=freshToggle;
 t.classList.add('v5-step4-final-toggle');t.innerHTML='<span class="v5-step4-toggle-icon" aria-hidden="true">⌄</span>';
 if(budgetField&&subField)subField.insertAdjacentElement('afterend',budgetField);
 if(sub){const label=subField&&subField.querySelector('span');if(label)label.textContent='انتخاب کالا';}
 if(budgetField){const label=budgetField.querySelector('span');if(label)label.textContent='چقدر می‌خوای هزینه کنی؟';}
 /* The toggle belongs to the bottom of the Step 4 card, not beside the store field. */
 card.appendChild(t);
 function syncIcon(open){const icon=t.querySelector('.v5-step4-toggle-icon');if(icon)icon.textContent=open?'⌃':'⌄';t.setAttribute('aria-expanded',String(open));t.setAttribute('aria-label',open?'بستن جزئیات خرید':'باز کردن جزئیات خرید');}
 function budgetState(){const visible=cat.value==='digital';if(budgetField){budgetField.hidden=!visible;budgetField.style.display=visible?'flex':'none';}}
 function setOpen(open){if(catField)catField.hidden=!open;if(subField)subField.hidden=!open||!cat.value;if(dyn){dyn.hidden=!open||!dyn.children.length;dyn.style.display=open&&dyn.children.length?'grid':'none';}budgetState();t.classList.toggle('is-open',open);syncIcon(open);}
 function clearResults(){['digiyar-products','recommendations'].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML='';});const inline=document.getElementById('v5InlineResults');if(inline)inline.hidden=true;const summary=document.getElementById('needSummary');if(summary){summary.innerHTML='';summary.classList.add('empty');summary.hidden=true;}const result=document.getElementById('resultSection');if(result)result.hidden=true;}
 function clearInputsOnly(){store.value='';cat.value='';cat.disabled=true;if(sub){sub.value='';sub.disabled=true;sub.innerHTML='<option value="">انتخاب کالا</option>';}budget.value='';dyn.innerHTML='';dyn.hidden=true;dyn.style.display='none';if(catField)catField.hidden=true;if(subField)subField.hidden=true;budgetState();clearResults();}
 if(reset){const freshReset=reset.cloneNode(true);reset.replaceWith(freshReset);freshReset.addEventListener('click',function(ev){ev.preventDefault();ev.stopImmediatePropagation();clearInputsOnly();},true);}
 t.addEventListener('click',function(ev){ev.preventDefault();ev.stopImmediatePropagation();setOpen(t.getAttribute('aria-expanded')!=='true');},true);
 store.addEventListener('change',function(){setOpen(true);budgetState();});cat.addEventListener('change',function(){setOpen(true);budgetState();});if(sub)sub.addEventListener('change',function(){setOpen(true);budgetState();});
 function normalizeFunctionLabels(){dyn.querySelectorAll('.v5-final-function,.v5-step4-field').forEach(field=>{const title=field.querySelector(':scope > span'),select=field.querySelector('select');if(!select)return;if(title){const text=title.textContent.trim();if(text){const first=select.options[0];if(first)first.textContent=text;else{const o=document.createElement('option');o.value='';o.textContent=text;select.prepend(o);}title.remove();}}select.style.textAlign='center';select.style.textAlignLast='center';Array.from(select.options).forEach(o=>o.style.textAlign='center');});}
 const observer=new MutationObserver(normalizeFunctionLabels);observer.observe(dyn,{childList:true,subtree:true});normalizeFunctionLabels();
 form.addEventListener('submit',function(){setOpen(true);window.setTimeout(function(){const result=document.getElementById('resultSection'),inline=document.getElementById('v5InlineResults');if(result)result.hidden=false;if(inline)inline.hidden=false;},50);},false);
 setOpen(false);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else setTimeout(init,0);
})();