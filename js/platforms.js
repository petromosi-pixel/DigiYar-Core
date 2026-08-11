// ==========================================
// Digiyar 2.0 — Platform Registry
// Version: 1.0
// ==========================================

(function (window) {

    "use strict";


    /*
     * =========================================
     * ساختار استاندارد فروشگاه
     * =========================================
     *
     * هر فروشگاه جدید باید فقط به این لیست
     * اضافه شود.
     *
     * app.js نباید لینک افیلیت را به صورت
     * مستقیم مدیریت کند.
     *
     * اولویت لینک:
     *
     * affiliateUrl
     *      ↓
     * directUrl
     *
     * =========================================
     */


    const platforms = [

        // ======================================
        // دیجی‌کالا
        // ======================================

        {
            id: "digikala",

            name: "دیجی‌کالا",

            description:
                "بزرگ‌ترین فروشگاه اینترنتی ایران",

            image:
                "assets/digikala.png",

            active: true,

            directUrl:
                "https://www.digikala.com/",

            affiliateUrl:
                "https://aflo.ir/16da7m1UY",

            category:
                "general",

            priority:
                1,

            metadata: {}
        },


        // ======================================
        // اسنپ‌شاپ
        // ======================================

        {
            id: "snappshop",

            name: "اسنپ‌شاپ",

            description:
                "خرید آسان از فروشگاه آنلاین اسنپ",

            image:
                "assets/snappshop.png",

            active: true,

            directUrl:
                "https://snappshop.ir/",

            affiliateUrl:
                "https://aflo.ir/YPN05dL7",

            category:
                "general",

            priority:
                2,

            metadata: {}
        },


        // ======================================
        // ترب
        // ======================================

        {
            id: "torob",

            name: "ترب",

            description:
                "مقایسه قیمت هزاران فروشگاه",

            image:
                "assets/torob.png",

            active: false,

            directUrl:
                "https://torob.com/",

            affiliateUrl:
                null,

            category:
                "comparison",

            priority:
                3,

            metadata: {}
        },


        // ======================================
        // باسلام
        // ======================================

        {
            id: "basalam",

            name: "باسلام",

            description:
                "بازار محصولات ایرانی",

            image:
                "assets/basalam.png",

            active: false,

            directUrl:
                "https://basalam.com/",

            affiliateUrl:
                null,

            category:
                "marketplace",

            priority:
                4,

            metadata: {}
        }

    ];


    // ==========================================
    // ابزارهای مدیریت فروشگاه‌ها
    // ==========================================


    function getPlatforms() {

        return platforms.slice();

    }


    function getActivePlatforms() {

        return platforms.filter(
            platform =>
                platform.active === true
        );

    }


    function getPlatformById(id) {

        if (!id) {
            return null;
        }

        return (
            platforms.find(
                platform =>
                    platform.id === id
            ) || null
        );

    }


    /*
     * =========================================
     * دریافت لینک قابل استفاده فروشگاه
     * =========================================
     *
     * اگر affiliateUrl وجود داشته باشد،
     * همیشه اولویت با آن است.
     *
     * در غیر این صورت directUrl استفاده می‌شود.
     *
     * این تابع بعداً می‌تواند برای سیستم
     * Tracking / Analytics نیز توسعه پیدا کند.
     *
     * =========================================
     */

    function getPlatformUrl(platform) {

        if (!platform) {
            return null;
        }


        if (
            typeof platform.affiliateUrl === "string" &&
            platform.affiliateUrl.trim() !== ""
        ) {

            return platform.affiliateUrl.trim();

        }


        if (
            typeof platform.directUrl === "string" &&
            platform.directUrl.trim() !== ""
        ) {

            return platform.directUrl.trim();

        }


        return null;

    }


    /*
     * =========================================
     * آماده‌سازی فروشگاه برای UI
     * =========================================
     */

    function preparePlatform(platform) {

        if (!platform) {
            return null;
        }


        return {

            ...platform,

            link:
                getPlatformUrl(platform),

            hasAffiliate:
                typeof platform.affiliateUrl === "string" &&
                platform.affiliateUrl.trim() !== ""

        };

    }


    function getPreparedPlatforms() {

        return platforms
            .map(preparePlatform)
            .filter(Boolean);

    }


    // ==========================================
    // انتشار عمومی
    // ==========================================

    window.DigiyarPlatforms = {

        version:
            "1.0",

        getAll:
            getPlatforms,

        getActive:
            getActivePlatforms,

        getById:
            getPlatformById,

        getUrl:
            getPlatformUrl,

        prepare:
            preparePlatform,

        getPrepared:
            getPreparedPlatforms

    };


    /*
     * =========================================
     * سازگاری با نسخه فعلی app.js
     * =========================================
     *
     * app.js فعلی از متغیر platforms استفاده
     * می‌کند.
     *
     * بنابراین فعلاً این متغیر را نیز نگه
     * می‌داریم تا در مرحله اتصال app.js
     * سیستم را نشکنیم.
     *
     * =========================================
     */

    window.platforms =
        getPreparedPlatforms();


})(window);


// ==========================================
// Digiyar Platform Registry 1.0 — END
// ==========================================
