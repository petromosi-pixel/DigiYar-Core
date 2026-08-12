/* DigiYar V3 - Shopping Platforms */

(function () {
  "use strict";

  /*
   * لینک‌های فعلی، لینک عمومی فروشگاه‌ها هستند.
   * وقتی لینک‌های افیلیت واقعی آماده شدند،
   * فقط مقدار url هر فروشگاه را تغییر می‌دهیم.
   */

  const platforms = [

    {
      id: "digikala",
      name: "دیجی‌کالا",
      tag: "فروشگاه اصلی",
      logo: "د",
      url: "https://www.digikala.com/"
    },

    {
      id: "snappshop",
      name: "اسنپ‌شاپ",
      tag: "خرید آنلاین",
      logo: "س",
      url: "https://snapp.shop/"
    },

    {
      id: "torob",
      name: "ترب",
      tag: "مقایسه قیمت",
      logo: "ت",
      url: "https://torob.com/"
    },

    {
      id: "basalam",
      name: "باسلام",
      tag: "بازار آنلاین",
      logo: "ب",
      url: "https://basalam.com/"
    }

  ];


  window.DigiYarPlatforms =
    platforms;

})();
