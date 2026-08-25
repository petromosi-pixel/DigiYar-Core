/* V5 Step 4 — stable interaction bridge */
(function(){'use strict';
function init(){
 const card=document.querySelector('.v5-profile-card');
 const form=document.getElementById('profileForm');
 const grid=card&&form&&form.querySelector('.form-grid');
 const store=document.getElementById('storeSelect'),cat=document.getElementById('v5Category'),sub=document.getElementById('v5Subcategory');
 const budget=document.getElementById('budgetMax'),dyn=document.getElementById('v5DynamicFields'),reset=document.getElementById('resetProfile'),toggle=document.getElementById('v5Step4Toggle');
 if(!card||!form||!grid||!store||!cat||!budget||!dyn||!toggle)return;
 const budgetField=budget.closest('.v5-field'),catField=cat.closest('.v5-field'),subField=sub&&sub.closest('.v5-field');
 /* Legacy bridge: app.js expects these IDs when building the search profile. */
 [['category','hidden'],['usage','hidden'],['priorities','hidden'],['requirements','hidden'],['constraints','hidden']].forEach(([id,type])=>{if(!document.getElementById(id)){const i=document.createElement('input');i.type=type;i.id=id;i.name=id;form.appendChild(i);}});
 const legacy={category:document.getElementById('category'),usage:document.getElementById('usage'),priorities:document.getElementById('priorities'),requirements:document.getElementById('requirements'),constraints:document.getElementById('constraints')};
 const freshToggle=toggle.cloneNode(true);toggle.replaceWith(freshToggle);const t=freshToggle;grid.appendChild(t);t.classList.add('v5-step4-final-toggle');
 function syncIcon(open){const icon=t.querySelector('.v5-step4-toggle-icon');if(icon)icon.textContent=open?'⌃':'⌄';t.setAttribute('aria-label',open?'بستن جزئیات خرید':'باز کردن جزئیات خرید');}
 function budgetState(){const visible=cat.value==='digital';if(budgetField){budgetField.hidden=!visible;budgetField.style.display=visible?'flex':'none';const label=budgetField.querySelector('span');if(label)label.textContent='چقدر می خوای هزینه کنی؟';budget.placeholder='مثلاً 15000000';}}
 function moveBudget(){if(budgetField&&subField)subField.insertAdjacentElement('afterend',budgetField);}
 function normalizeFunctionLabels(){dyn.querySelectorAll('.v5-final-function').forEach(field=>{const span=field.querySelector('span'),select=field.querySelector('select');if(span&&select){const label=span.textContent.trim();let first=select.querySelector('option');if(first)first.textContent=label;span.hidden=true;select.setAttribute('aria-label',label);}});}
 function setOpen(open){t.setAttribute('aria-expanded',String(open));t.classList.toggle('is-open',open);syncIcon(open);if(catField)catField.hidden=!open;if(subField)subField.hidden=!open||!cat.value;budgetState();moveBudget();dyn.hidden=!open||!dyn.children.length;dyn.style.display=open&&dyn.children.length?'grid':'none';normalizeFunctionLabels();}
 function clearResults(){['digiyar-products','recommendations'].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML='';});const inline=document.getElementById('v5InlineResults');if(inline)inline.hidden=true;const summary=document.getElementById('needSummary');if(summary){summary.innerHTML='';summary.className='need-summary empty';summary.hidden=true;}const result=document.getElementById('resultSection');if(result)result.hidden=true;}
 function clearInputsOnly(){store.value='';cat.value='';cat.disabled=true;if(sub){sub.value='';sub.disabled=true;sub.innerHTML='<option value="">ابتدا دسته‌بندی را انتخاب کنید</option>';}budget.value='';dyn.innerHTML='';legacy.category.value='';legacy.usage.value='';legacy.priorities.value='';legacy.requirements.value='';legacy.constraints.value='';clearResults();budgetState();setOpen(t.getAttribute('aria-expanded')==='true');}
 function bridgeSubmit(){
   const fields=dyn.querySelectorAll('.v5-final-function select');
   legacy.category.value=sub&&sub.value?sub.value:(cat.value||'');legacy.usage.value=fields[0]?.value||'';legacy.priorities.value=fields[1]?.value||'';legacy.requirements.value=fields[2]?.value||'';legacy.constraints.value=fields[3]?.value||'';
   /* app.js owns retrieval/rendering; this bridge only supplies its expected inputs. */
   setTimeout(function(){const result=document.getElementById('resultSection');if(result)result.hidden=false;},350);
 }
 /* Capture runs before app.js's normal bubble submit handler. */
 form.addEventListener('submit',bridgeSubmit,true);
 t.addEventListener('click',function(){setOpen(t.getAttribute('aria-expanded')!=='true');});
 store.addEventListener('change',function(){setOpen(true);budgetState();});cat.addEventListener('change',function(){setOpen(true);budgetState();});if(sub)sub.addEventListener('change',function(){setOpen(true);budgetState();});
 if(reset){const freshReset=reset.cloneNode(true);reset.replaceWith(freshReset);freshReset.addEventListener('click',function(){clearInputsOnly();});}
 moveBudget();budgetState();setOpen(false);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else setTimeout(init,0);
})();
