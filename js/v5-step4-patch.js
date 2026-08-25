/* V5 Step 4 — final interaction/layout patch */
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
 if(!card||!grid||!store||!cat||!budget||!dyn)return;
 const budgetField=budget.closest('.v5-field');
 const catField=cat.closest('.v5-field');
 const subField=sub&&sub.closest('.v5-field');
 let toggle=document.getElementById('v5Step4Toggle');
 if(toggle){
   const fresh=toggle.cloneNode(true); toggle.replaceWith(fresh); toggle=fresh;
 }
 if(toggle&&grid){
   grid.appendChild(toggle);
   toggle.classList.add('v5-step4-final-toggle');
 }
 function budgetState(){
   const visible=cat.value==='digital';
   if(budgetField){budgetField.hidden=!visible;budgetField.style.display=visible?'flex':'none';}
 }
 function clearFields(){
   store.value='';
   cat.value='';
   cat.disabled=true;
   if(sub){sub.value='';sub.disabled=true;sub.innerHTML='<option value="">ابتدا دسته‌بندی را انتخاب کنید</option>';}
   budget.value='';
   dyn.innerHTML='';
   dyn.hidden=true;
   dyn.style.display='none';
   budgetState();
   if(catField)catField.hidden=true;
   if(subField)subField.hidden=true;
   if(toggle){toggle.setAttribute('aria-expanded','false');toggle.classList.remove('is-open');}
 }
 function setOpen(open){
   if(!toggle)return;
   toggle.setAttribute('aria-expanded',String(open));
   toggle.classList.toggle('is-open',open);
   if(catField)catField.hidden=!open;
   if(subField)subField.hidden=!open||!cat.value;
   budgetState();
   dyn.hidden=!open||!dyn.children.length;
   if(!open)dyn.style.display='none';
   else if(dyn.children.length)dyn.style.display='grid';
 }
 if(toggle){toggle.addEventListener('click',function(){setOpen(toggle.getAttribute('aria-expanded')!=='true');});}
 store.addEventListener('change',function(){setOpen(true);budgetState();});
 cat.addEventListener('change',function(){setOpen(true);budgetState();});
 if(sub)sub.addEventListener('change',function(){setOpen(true);budgetState();});
 if(reset){
   const freshReset=reset.cloneNode(true);reset.replaceWith(freshReset);
   freshReset.addEventListener('click',function(){clearFields();});
 }
 budgetState();
 setOpen(false);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else setTimeout(init,0);
})();
