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
 t.classList.add('v5-step4-final-toggle');t.innerHTML='<span class="v5-step4-toggle-icon" aria-hidden="true"><i>⟨</i><i>⟨</i><i>⟨</i></span>';
 if(budgetField&&subField)subField.insertAdjacentElement('afterend',budgetField);
 if(budgetField){const label=budgetField.querySelector('span');if(label)label.textContent='چقدر می‌خوای هزینه کنی؟';}
 card.appendChild(t);
 function moveLabelInside(select,labelText){if(!select)return;let placeholder=select.querySelector('option[data-v5-placeholder="true"]');if(!placeholder){placeholder=document.createElement('option');placeholder.value='';placeholder.dataset.v5Placeholder='true';select.insertBefore(placeholder,select.firstChild);}placeholder.textContent=labelText;select.style.textAlign='center';select.style.textAlignLast='center';Array.from(select.options).forEach(o=>o.style.textAlign='center');}
 function normalizeTopFields(){moveLabelInside(store,'فروشگاهتو انتخاب کن');moveLabelInside(cat,'دسته بندی');moveLabelInside(sub,'انتخاب کالا');const storeField=store.closest('.v5-field');if(storeField){const label=storeField.querySelector(':scope > span');if(label)label.style.display='none';const hint=storeField.querySelector('#v5StoreHint');if(hint)hint.style.display='none';}if(catField){const label=catField.querySelector(':scope > span');if(label)label.style.display='none';}if(subField){const label=subField.querySelector(':scope > span');if(label)label.style.display='none';}}
 normalizeTopFields();
 function syncIcon(open){t.setAttribute('aria-expanded',String(open));t.setAttribute('aria-label',open?'بستن جزئیات خرید':'باز کردن جزئیات خرید');}
 function budgetState(){const visible=cat.value==='digital';if(budgetField){budgetField.hidden=!visible;budgetField.style.display=visible?'flex':'none';}}
 function setOpen(open){if(catField)catField.hidden=!open;if(subField)subField.hidden=!open||!cat.value;if(dyn){dyn.hidden=!open||!dyn.children.length;dyn.style.display=open&&dyn.children.length?'grid':'none';}budgetState();t.classList.toggle('is-open',open);syncIcon(open);}
 function clearResults(){['digiyar-products','recommendations'].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML='';});const inline=document.getElementById('v5InlineResults');if(inline)inline.hidden=true;const summary=document.getElementById('needSummary');if(summary){summary.innerHTML='';summary.classList.add('empty');summary.hidden=true;}const result=document.getElementById('resultSection');if(result)result.hidden=true;}
 function clearInputsOnly(){store.value='';cat.value='';cat.disabled=true;if(sub){sub.value='';sub.disabled=true;sub.innerHTML='<option data-v5-placeholder="true" value="">انتخاب کالا</option>';}budget.value='';dyn.innerHTML='';dyn.hidden=true;dyn.style.display='none';if(catField)catField.hidden=true;if(subField)subField.hidden=true;budgetState();clearResults();normalizeTopFields();}
 if(reset){const freshReset=reset.cloneNode(true);reset.replaceWith(freshReset);freshReset.addEventListener('click',function(ev){ev.preventDefault();ev.stopImmediatePropagation();clearInputsOnly();},true);}
 t.addEventListener('click',function(ev){ev.preventDefault();ev.stopImmediatePropagation();setOpen(t.getAttribute('aria-expanded')!=='true');},true);
 store.addEventListener('change',function(){setOpen(true);budgetState();normalizeTopFields();});cat.addEventListener('change',function(){setOpen(true);budgetState();normalizeTopFields();});if(sub)sub.addEventListener('change',function(){setOpen(true);budgetState();normalizeTopFields();});
 function normalizeFunctionLabels(){dyn.querySelectorAll('.v5-final-function,.v5-step4-field').forEach(field=>{const title=field.querySelector(':scope > span'),select=field.querySelector('select');if(!select)return;if(title){const text=title.textContent.trim();if(text){const first=select.options[0];if(first)first.textContent=text;else{const o=document.createElement('option');o.value='';o.textContent=text;select.prepend(o);}}title.remove();}select.style.textAlign='center';select.style.textAlignLast='center';Array.from(select.options).forEach(o=>o.style.textAlign='center');});normalizeTopFields();}
 const observer=new MutationObserver(normalizeFunctionLabels);observer.observe(dyn,{childList:true,subtree:true});normalizeFunctionLabels();
 form.addEventListener('submit',function(){setOpen(true);window.setTimeout(function(){const result=document.getElementById('resultSection'),inline=document.getElementById('v5InlineResults');if(result)result.hidden=false;if(inline)inline.hidden=false;},50);},false);
 setOpen(false);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else setTimeout(init,0);
})();