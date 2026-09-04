/* DigiYar V5.1 — Browser Price Policy
   Canonical internal unit: Toman. Source price/currency remain explicit. */
(function (window) {
  'use strict';
  const PRICE_POLICY={version:'5.1.0',currency:'TOMAN',minPlanningBudget:15000000,maxPlanningBudget:500000000};
  function digits(value){return String(value||'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));}
  function normalizeCurrency(value){const c=String(value||'').trim().toUpperCase();if(c==='IRR'||c==='RIAL'||/ریال|ريال/.test(c))return'IRR';if(c==='IRT'||c==='TOMAN'||/تومان|تومن/.test(c))return'IRT';return c||'IRT';}
  function toToman(value,unit){const n=Number(value);if(!Number.isFinite(n)||n<=0)return 0;switch(normalizeCurrency(unit)){case'IRR':return Math.round(n/10);default:return Math.round(n);}}
  function parseNumber(value){const text=digits(value).replace(/,/g,'').replace(/٬/g,'').replace(/٫/g,'.').trim(),m=text.match(/\d+(?:\.\d+)?/);return m?Number(m[0]):null;}
  function unitOf(text){const v=String(text||'').toLowerCase();if(/ریال|ريال|rials?/.test(v))return'rial';if(/میلیارد|billion/.test(v))return'billion_toman';if(/میلیون|million/.test(v))return'million_toman';if(/هزار|thousand/.test(v))return'thousand_toman';return'toman';}
  function parseBudget(text){const raw=String(text||'').trim();if(!raw)return null;const normalized=digits(raw).replace(/,/g,'').replace(/٬/g,'').replace(/٫/g,'.'),numbers=(normalized.match(/\d+(?:\.\d+)?/g)||[]).map(Number);if(!numbers.length)return null;const unit=unitOf(normalized),mult={rial:.1,billion_toman:1e9,million_toman:1e6,thousand_toman:1e3,toman:1}[unit],values=numbers.map(n=>n*mult),range=numbers.length>=2&&/تا|بین|الی|-/.test(normalized);let min=null,max=values[0];if(range){min=Math.min(values[0],values[1]);max=Math.max(values[0],values[1]);}return{min,max,type:'hard_constraint',source:'declared',confidence:unit==='toman'?.95:.99,currency:'toman',planningRange:{min:PRICE_POLICY.minPlanningBudget,max:PRICE_POLICY.maxPlanningBudget,withinRange:max>=PRICE_POLICY.minPlanningBudget&&max<=PRICE_POLICY.maxPlanningBudget}};}
  function productPriceToToman(value,source,unit){if(unit)return toToman(value,unit);const n=Number(value);if(!Number.isFinite(n)||n<=0)return 0;return String(source||'').toLowerCase()==='digikala'&&n>=1000000?Math.round(n/10):Math.round(n);}
  function normalizeBudgetObject(b){if(!b||typeof b!=='object')return null;return Object.assign({},b,{min:b.min==null?null:Number(b.min),max:b.max==null?null:Number(b.max),currency:'toman'});}
  window.DigiYarPricePolicy={config:PRICE_POLICY,digits,parseNumber,parseBudget,toToman,productPriceToToman,normalizeBudgetObject,normalizeCurrency};
})(window);
