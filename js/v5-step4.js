/* DigiYar V5 — Step 4: single source of truth for store/category/subcategory/functions */
(function(){'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const storeCategories={
 digikala:[['digital','کالای دیجیتال'],['home','خانه و آشپزخانه'],['fashion','مد و پوشاک'],['supermarket','کالاهای خوراکی و اساسی'],['beauty','زیبایی و سلامت'],['books','کتاب، لوازم تحریر و هنر'],['kids','اسباب‌بازی، کودک و نوزاد'],['sports','ورزش و سفر'],['tools-auto','ابزار، خودرو و موتورسیکلت'],['local','محصولات بومی و محلی'],['other','سایر']],
 snappshop:[['digital','کالای دیجیتال'],['beauty','زیبایی و سلامت'],['home','خانه و آشپزخانه'],['fashion','مد و پوشاک'],['culture','فرهنگ و هنر'],['mother-kid','مادر و کودک'],['sports','ورزش و سفر'],['auto-tools','ابزار و لوازم خودرو'],['supermarket','کالاهای روزمره و سوپرمارکتی'],['other','سایر']],
 torob:[['digital','موبایل و کالای دیجیتال'],['computer','لپ‌تاپ، کامپیوتر و اداری'],['supermarket','هایپرمارکت'],['home','لوازم خانگی'],['fashion','مد و پوشاک'],['beauty','زیبایی و بهداشت'],['av','صوتی و تصویری'],['auto','خودرو و سایر وسایل نقلیه'],['sports','ورزش و سرگرمی'],['other','سایر']],
 basalam:[['food','مواد غذایی'],['herbal','عطاری'],['beauty','آرایشی و بهداشتی'],['handmade','صنایع دستی'],['fashion','پوشاک'],['culture','محصولات فرهنگی'],['home','لوازم خانگی'],['sports','ورزش و سفر'],['local','محصولات محلی و سنتی'],['other','سایر']]
};
const subcategories={
 digital:{digikala:[['laptop','لپ‌تاپ'],['tablet','تبلت'],['headphones','هدفون و هندزفری'],['tv','تلویزیون'],['camera','دوربین'],['accessories','لوازم جانبی'],['gaming','کنسول و گیم'],['smart-home','خانه هوشمند']],snappshop:[['mobile','موبایل'],['laptop','لپ‌تاپ'],['tablet','تبلت'],['headphones','هدفون و هندزفری'],['tv','تلویزیون'],['camera','دوربین'],['accessories','لوازم جانبی']],torob:[['mobile','موبایل'],['laptop','لپ‌تاپ و کامپیوتر'],['tablet','تبلت'],['headphones','هدفون و هندزفری'],['tv','تلویزیون و نمایشگر'],['camera','دوربین'],['accessories','لوازم جانبی']],default:[['mobile','موبایل'],['laptop','لپ‌تاپ'],['tablet','تبلت'],['headphones','هدفون و هندزفری'],['accessories','لوازم جانبی']]},
 home:{default:[['appliance','لوازم خانگی'],['kitchen','لوازم آشپزخانه'],['decoration','دکوراسیون'],['cleaning','نظافت و شست‌وشو']]},
 fashion:{default:[['men','پوشاک مردانه'],['women','پوشاک زنانه'],['kids','پوشاک کودک'],['shoes','کفش'],['bags','کیف و اکسسوری']]},
 beauty:{default:[['skin','مراقبت پوست'],['hair','مراقبت مو'],['makeup','آرایشی'],['personal','بهداشت و مراقبت شخصی']]},
 sports:{default:[['fitness','ورزش و بدنسازی'],['outdoor','کمپ و سفر'],['clothing','پوشاک ورزشی'],['equipment','تجهیزات ورزشی']]},
 supermarket:{default:[['food','مواد غذایی'],['beverage','نوشیدنی'],['household','کالاهای مصرفی خانه'],['personal','بهداشت شخصی']]},
 books:{default:[['book','کتاب'],['stationery','لوازم تحریر'],['art','هنر و ابزار هنری']]},
 kids:{default:[['baby','نوزاد'],['toy','اسباب‌بازی'],['school','کودک و آموزشی']]},
 'tools-auto':{default:[['auto','لوازم خودرو'],['tools','ابزار'],['motorcycle','موتورسیکلت']]},
 local:{default:[['food','محصولات غذایی محلی'],['handmade','صنایع دستی'],['traditional','محصولات سنتی']]},
 computer:{default:[['laptop','لپ‌تاپ'],['desktop','کامپیوتر رومیزی'],['parts','قطعات و لوازم جانبی'],['office','تجهیزات اداری']]},
 av:{default:[['tv','تلویزیون'],['audio','صوتی'],['projector','پروژکتور']]},
 auto:{default:[['car','خودرو'],['parts','قطعات و لوازم'],['accessories','لوازم جانبی']]},
 food:{default:[['rice','برنج و غلات'],['oil','روغن و حبوبات'],['snacks','تنقلات'],['drinks','نوشیدنی']]},
 herbal:{default:[['herbal','گیاهان دارویی'],['tea','دمنوش و چای'],['supplements','محصولات طبیعی']]},
 handmade:{default:[['craft','صنایع دستی'],['home','محصولات دست‌ساز خانه'],['gift','هدیه']]},
 culture:{default:[['book','کتاب'],['art','هنر'],['gift','محصولات فرهنگی']]},
 'mother-kid':{default:[['baby','نوزاد'],['mother','مادر'],['toy','اسباب‌بازی']]},
 'auto-tools':{default:[['auto','لوازم خودرو'],['tools','ابزار'],['care','نگهداری خودرو']]},
 other:{default:[['general','کالاهای عمومی'],['gift','هدیه'],['other','سایر']]}
};
const functions={
 mobile:[['usage','نوع استفاده',['عکاسی','بازی','کار روزمره','تولید محتوا']],['priorities','اولویت خرید',['دوربین','باتری','کیفیت','ارزش خرید']],['requirements','نیاز ضروری',['5G','حافظه بالا','شارژ سریع']],['constraints','محدودیت',['وزن کم','اندازه کوچک','قیمت پایین']]],
 laptop:[['usage','نوع استفاده',['کار روزمره','برنامه‌نویسی','طراحی','بازی']],['priorities','اولویت خرید',['قدرت پردازش','باتری','صفحه‌نمایش','ارزش خرید']],['requirements','نیاز ضروری',['RAM بالا','SSD','وزن کم']],['constraints','محدودیت',['وزن کم','اندازه کوچک','قیمت پایین']]],
 tablet:[['usage','نوع استفاده',['مطالعه','طراحی','سرگرمی','کار روزمره']],['priorities','اولویت خرید',['نمایشگر','باتری','وزن','ارزش خرید']],['requirements','نیاز ضروری',['حافظه بالا','قلم','سیم‌کارت']],['constraints','محدودیت',['وزن کم','اندازه کوچک','قیمت پایین']]],
 headphones:[['usage','نوع استفاده',['موسیقی','تماس','بازی','ورزش']],['priorities','اولویت خرید',['کیفیت صدا','باتری','راحتی','ارزش خرید']],['requirements','نیاز ضروری',['بلوتوث','میکروفون','حذف نویز']],['constraints','محدودیت',['وزن کم','قیمت پایین']]],
 tv:[['usage','نوع استفاده',['فیلم و سریال','بازی','ورزش','استفاده روزمره']],['priorities','اولویت خرید',['کیفیت تصویر','اندازه','صدا','ارزش خرید']],['requirements','نیاز ضروری',['4K','HDR','تلویزیون هوشمند']],['constraints','محدودیت',['ابعاد','قیمت پایین']]],
 camera:[['usage','نوع استفاده',['عکاسی','فیلم‌برداری','تولید محتوا','سفر']],['priorities','اولویت خرید',['کیفیت تصویر','لنز','باتری','ارزش خرید']],['requirements','نیاز ضروری',['4K','Wi‑Fi','لرزشگیر']],['constraints','محدودیت',['وزن کم','قیمت پایین']]],
 accessories:[['usage','نوع استفاده',['موبایل','لپ‌تاپ','گیم','کار روزمره']],['priorities','اولویت خرید',['کیفیت','دوام','سازگاری','قیمت']],['requirements','نیاز ضروری',['سازگاری دقیق','گارانتی']],['constraints','محدودیت',['قیمت پایین','ابعاد کوچک']]],
 gaming:[['usage','نوع استفاده',['بازی آنلاین','بازی آفلاین','خانوادگی','رقابتی']],['priorities','اولویت خرید',['قدرت','گرافیک','سرعت','ارزش خرید']],['requirements','نیاز ضروری',['4K','حافظه بالا','اتصال سریع']],['constraints','محدودیت',['قیمت پایین','ابعاد کوچک']]],
 'smart-home':[['usage','نوع استفاده',['امنیت','روشنایی','کنترل خانه','سرگرمی']],['priorities','اولویت خرید',['سازگاری','امکانات','کیفیت','ارزش خرید']],['requirements','نیاز ضروری',['Wi‑Fi','اپلیکیشن','اتصال هوشمند']],['constraints','محدودیت',['قیمت پایین','نصب آسان']]],
 appliance:[['usage','نوع استفاده',['مصرف روزمره','آشپزی','شست‌وشو','سرمایش و گرمایش']],['priorities','اولویت خرید',['کیفیت','مصرف انرژی','ظرفیت','ارزش خرید']],['requirements','نیاز ضروری',['گارانتی','ارسال سریع','اندازه مناسب']],['constraints','محدودیت',['ابعاد','قیمت پایین']]],
 kitchen:[['usage','نوع استفاده',['پخت‌وپز','نوشیدنی','نگهداری غذا','مصرف روزمره']],['priorities','اولویت خرید',['کیفیت','ظرفیت','توان','ارزش خرید']],['requirements','نیاز ضروری',['گارانتی','جنس مناسب']],['constraints','محدودیت',['ابعاد کوچک','قیمت پایین']]],
 decoration:[['usage','نوع استفاده',['دکور منزل','هدیه','اتاق خواب','محل کار']],['priorities','اولویت خرید',['جنس','طراحی','کیفیت','قیمت']],['requirements','نیاز ضروری',['اندازه مناسب','رنگ خاص']],['constraints','محدودیت',['ابعاد','قیمت پایین']]],
 cleaning:[['usage','نوع استفاده',['خانه','آشپزخانه','لباس','خودرو']],['priorities','اولویت خرید',['قدرت','کیفیت','دوام','قیمت']],['requirements','نیاز ضروری',['گارانتی','مصرف کم']],['constraints','محدودیت',['وزن کم','قیمت پایین']]],
 men:[['usage','نوع استفاده',['روزمره','رسمی','ورزشی','هدیه']],['priorities','اولویت خرید',['جنس','کیفیت','برند','قیمت']],['requirements','نیاز ضروری',['سایز دقیق','رنگ خاص']],['constraints','محدودیت',['قیمت پایین','سایز خاص']]],
 women:[['usage','نوع استفاده',['روزمره','رسمی','ورزشی','هدیه']],['priorities','اولویت خرید',['جنس','کیفیت','برند','قیمت']],['requirements','نیاز ضروری',['سایز دقیق','رنگ خاص']],['constraints','محدودیت',['قیمت پایین','سایز خاص']]],
 shoes:[['usage','نوع استفاده',['روزمره','رسمی','ورزشی','سفر']],['priorities','اولویت خرید',['راحتی','جنس','دوام','قیمت']],['requirements','نیاز ضروری',['سایز دقیق','کفی مناسب']],['constraints','محدودیت',['وزن کم','قیمت پایین']]],
 bags:[['usage','نوع استفاده',['روزمره','اداری','سفر','هدیه']],['priorities','اولویت خرید',['جنس','ظرفیت','دوام','قیمت']],['requirements','نیاز ضروری',['اندازه مناسب','بند قابل تنظیم']],['constraints','محدودیت',['وزن کم','قیمت پایین']]],
 skin:[['usage','نوع استفاده',['خشک','چرب','مختلط','حساس']],['priorities','اولویت خرید',['ترکیبات','برند','اثرگذاری','قیمت']],['requirements','نیاز ضروری',['اصل بودن','تاریخ انقضا']],['constraints','محدودیت',['بدون عطر','قیمت پایین']]],
 hair:[['usage','نوع استفاده',['خشک','چرب','رنگ‌شده','آسیب‌دیده']],['priorities','اولویت خرید',['ترکیبات','اثرگذاری','برند','قیمت']],['requirements','نیاز ضروری',['اصل بودن','تاریخ انقضا']],['constraints','محدودیت',['بدون سولفات','قیمت پایین']]],
 makeup:[['usage','نوع استفاده',['روزمره','مهمانی','عروس','حرفه‌ای']],['priorities','اولویت خرید',['رنگ','ماندگاری','برند','قیمت']],['requirements','نیاز ضروری',['اصل بودن','تاریخ انقضا']],['constraints','محدودیت',['بدون عطر','قیمت پایین']]],
 fitness:[['usage','نوع استفاده',['خانه','باشگاه','بدنسازی','کاردیو']],['priorities','اولویت خرید',['دوام','کارایی','وزن','قیمت']],['requirements','نیاز ضروری',['اندازه مناسب','گارانتی']],['constraints','محدودیت',['فضای کم','قیمت پایین']]],
 outdoor:[['usage','نوع استفاده',['کمپ','کوه','سفر','پیک‌نیک']],['priorities','اولویت خرید',['وزن','دوام','ضدآب','قیمت']],['requirements','نیاز ضروری',['قابل حمل','مقاوم']],['constraints','محدودیت',['وزن کم','حجم کم']]],
 food:[['usage','نوع استفاده',['مصرف روزمره','هدیه','مهمانی']],['priorities','اولویت خرید',['کیفیت','تازگی','برند','قیمت']],['requirements','نیاز ضروری',['تاریخ مصرف','بسته‌بندی مناسب']],['constraints','محدودیت',['قیمت پایین']]],
 general:[['usage','نوع استفاده',['مصرف شخصی','کار روزمره','هدیه']],['priorities','اولویت خرید',['کیفیت','ارزش خرید','قیمت']],['requirements','نیاز ضروری',['گارانتی','ارسال سریع']],['constraints','محدودیت',['قیمت پایین','اندازه کوچک']]]
};
const fallback=[['usage','نوع استفاده',['مصرف شخصی','کار روزمره','هدیه']],['priorities','اولویت خرید',['کیفیت','ارزش خرید','قیمت']],['requirements','نیاز ضروری',['گارانتی','ارسال سریع']],['constraints','محدودیت',['قیمت پایین','اندازه کوچک']]];
function setOptions(select,items,placeholder){select.innerHTML='';const p=document.createElement('option');p.value='';p.textContent=placeholder;select.appendChild(p);items.forEach(([value,label])=>{const o=document.createElement('option');o.value=value;o.textContent=label;select.appendChild(o)})}
function subcategoryList(category,store){const group=subcategories[category];if(!group)return[];return group[store]||group.default||[]}
function renderFunctions(category,subcategory){const box=$('v5DynamicFields');if(!box)return;const rows=functions[subcategory]||functions[category]||fallback;box.innerHTML=rows.map(([id,label,opts])=>`<label class="v5-field"><span>${esc(label)}</span><select name="${esc(id)}" id="v5-fn-${esc(id)}"><option value="">انتخاب کن</option>${opts.map(o=>`<option value="${esc(o)}">${esc(o)}</option>`).join('')}</select></label>`).join('')}
function renderSubcategories(category,store){const sub=$('v5Subcategory');if(!sub)return;const list=subcategoryList(category,store);setOptions(sub,list,list.length?'انتخاب زیر‌دسته':'برای این دسته زیر‌دسته‌ای تعریف نشده');sub.disabled=list.length===0;sub.onchange=()=>renderFunctions(category,sub.value);renderFunctions(category,sub.value)}
function setup(){const card=document.querySelector('.v5-profile-card'),grid=card?.querySelector('.form-grid'),storeField=$('storeSelect')?.closest('.v5-field'),category=$('v5Category'),budget=$('budgetMax'),dynamic=$('v5DynamicFields'),actions=card?.querySelector('.form-actions');if(!card||!grid||!storeField||!category||!dynamic)return;
 const label=storeField.querySelector('span');if(label)label.style.display='none';storeField.classList.add('v5-step4-store-field');const hint=$('v5StoreHint');if(hint)hint.classList.add('v5-step4-store-hint');
 let upper=grid.querySelector('.v5-step4-upper');if(!upper){upper=document.createElement('div');upper.className='v5-step4-upper';grid.insertBefore(upper,storeField);upper.appendChild(storeField)}
 let panel=grid.querySelector('.v5-step4-panel');if(!panel){panel=document.createElement('div');panel.className='v5-step4-panel';panel.hidden=true;[category.closest('.v5-field'),budget?.closest('.v5-field'),dynamic,actions].filter(Boolean).forEach(el=>panel.appendChild(el));grid.appendChild(panel)}
 let sub=$('v5Subcategory');if(!sub){sub=document.createElement('label');sub.className='v5-field full v5-subcategory-field';sub.innerHTML='<span>زیر‌دسته</span><select id="v5Subcategory"><option value="">ابتدا دسته‌بندی را انتخاب کنید</option></select>';const anchor=category.closest('.v5-field');anchor?.after(sub)}
 let toggle=card.querySelector('.v5-step4-toggle');if(!toggle){toggle=document.createElement('button');toggle.type='button';toggle.className='v5-step4-toggle';toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','v5Step4Panel');toggle.innerHTML='<span>جزئیات خرید</span><span class="v5-step4-toggle-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></span>';panel.id='v5Step4Panel';card.insertBefore(toggle,card.querySelector('.v5-storage-note'))}
 const update=()=>{const open=toggle.getAttribute('aria-expanded')==='true';panel.hidden=!open;toggle.setAttribute('aria-expanded',String(open))};toggle.onclick=()=>{toggle.setAttribute('aria-expanded',String(toggle.getAttribute('aria-expanded')!=='true'));update()};update();
 const store=$('storeSelect');setOptions(store,[['digikala','دیجی‌کالا'],['snappshop','اسنپ‌شاپ'],['torob','ترب'],['basalam','باسلام']],'انتخاب فروشگاه');category.disabled=true;setOptions(category,[],'ابتدا فروشگاه را انتخاب کنید');
 const refresh=()=>{const key=store.value;category.disabled=!key;setOptions(category,storeCategories[key]||[],key?'انتخاب دسته‌بندی':'ابتدا فروشگاه را انتخاب کنید');if(hint)hint.textContent=key?'نتایج بر اساس فروشگاه انتخابی اولویت‌بندی می‌شوند.':'با انتخاب فروشگاه، دسته‌بندی‌های همان فروشگاه نمایش داده می‌شود.';sub.innerHTML='<option value="">ابتدا دسته‌بندی را انتخاب کنید</option>';sub.disabled=true;dynamic.innerHTML=''};
 store.onchange=refresh;category.onchange=()=>{const key=store.value;renderSubcategories(category.value,key)};refresh()
}
function init(){setup()};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
