// ==========================================
// Digiyar 2.0 — Affiliate Resolver
// Version: 1.0
// ==========================================
//
// مسئولیت:
// 1. تبدیل Product URL به Affiliate URL
// 2. مدیریت Affiliate Provider
// 3. پشتیبانی از چند فروشگاه
// 4. جلوگیری از پخش شدن منطق Affiliate در App / Engine
//
// معماری:
//
// Product URL
//      ↓
// Affiliate Resolver
//      ↓
// Platform Adapter
//      ↓
// Affiliate URL
//
// فروشگاه‌های فعلی:
// - Digikala
// - Snappshop
//
// ==========================================

(function (window) {

    "use strict";


    // ==========================================
    // تنظیمات Affiliate
    // ==========================================

    const affiliatePlatforms = {

        // --------------------------------------
        // دیجی‌کالا
        // --------------------------------------

        digikala: {

            id:
                "digikala",

            name:
                "دیجی‌کالا",

            enabled:
                true,

            method:
                "redirect",

            template:
                "https://aflo.ir/CVQz1aHq?p={redirect_to}"

        },


        // --------------------------------------
        // اسنپ‌شاپ
        // --------------------------------------

        snappshop: {

            id:
                "snappshop",

            name:
                "اسنپ‌شاپ",

            enabled:
                true,

            method:
                "redirect",

            template:
                "https://aflo.ir/4oWErY8Z?p={redirect_to}"

        }

    };


    // ==========================================
    // ایجاد نتیجه استاندارد
    // ==========================================

    function createResult() {

        return {

            success:
                false,

            platform:
                null,

            originalUrl:
                null,

            affiliateUrl:
                null,

            method:
                null,

            error:
                null

        };

    }


    // ==========================================
    // اعتبارسنجی URL
    // ==========================================

    function isValidUrl(url) {

        if (
            typeof url !== "string" ||
            url.trim() === ""
        ) {

            return false;

        }


        try {

            const parsed =
                new URL(url.trim());


            return (
                parsed.protocol === "http:" ||
                parsed.protocol === "https:"
            );

        } catch (error) {

            return false;

        }

    }


    // ==========================================
    // پیدا کردن Platform
    // ==========================================

    function getPlatform(platformId) {

        if (
            typeof platformId !== "string"
        ) {

            return null;

        }


        const normalizedId =
            platformId
                .trim()
                .toLowerCase();


        return (
            affiliatePlatforms[
                normalizedId
            ] || null
        );

    }


    // ==========================================
    // تشخیص فروشگاه از URL
    // ==========================================

    function detectPlatformFromUrl(url) {

        if (
            !isValidUrl(url)
        ) {

            return null;

        }


        let hostname;


        try {

            hostname =
                new URL(url)
                    .hostname
                    .toLowerCase();

        } catch (error) {

            return null;

        }


        // --------------------------------------
        // دیجی‌کالا
        // --------------------------------------

        if (
            hostname === "digikala.com" ||
            hostname.endsWith(".digikala.com")
        ) {

            return "digikala";

        }


        // --------------------------------------
        // اسنپ‌شاپ
        // --------------------------------------

        if (
            hostname === "snappshop.ir" ||
            hostname.endsWith(".snappshop.ir")
        ) {

            return "snappshop";

        }


        return null;

    }


    // ==========================================
    // ساخت Affiliate URL
    // ==========================================

    function resolve(
        platformId,
        productUrl
    ) {

        const result =
            createResult();


        // --------------------------------------
        // بررسی URL
        // --------------------------------------

        if (
            !isValidUrl(productUrl)
        ) {

            result.error =
                "Product URL معتبر نیست.";

            return result;

        }


        const normalizedUrl =
            productUrl.trim();


        // --------------------------------------
        // دریافت Platform
        // --------------------------------------

        let platform =
            getPlatform(
                platformId
            );


        // --------------------------------------
        // تشخیص خودکار Platform
        // --------------------------------------

        if (!platform) {

            const detectedPlatform =
                detectPlatformFromUrl(
                    normalizedUrl
                );


            if (detectedPlatform) {

                platform =
                    getPlatform(
                        detectedPlatform
                    );

            }

        }


        // --------------------------------------
        // Platform پیدا نشد
        // --------------------------------------

        if (!platform) {

            result.error =
                "برای این فروشگاه Affiliate Adapter تعریف نشده است.";

            return result;

        }


        result.platform =
            platform.id;


        result.originalUrl =
            normalizedUrl;


        // --------------------------------------
        // بررسی فعال بودن
        // --------------------------------------

        if (
            platform.enabled !== true
        ) {

            result.error =
                "Affiliate این فروشگاه فعال نیست.";

            return result;

        }


        // --------------------------------------
        // بررسی Template
        // --------------------------------------

        if (
            typeof platform.template !== "string" ||
            platform.template.indexOf(
                "{redirect_to}"
            ) === -1
        ) {

            result.error =
                "ساختار Affiliate Template معتبر نیست.";

            return result;

        }


        // --------------------------------------
        // ساخت لینک
        // --------------------------------------

        const encodedUrl =
            encodeURIComponent(
                normalizedUrl
            );


        const affiliateUrl =
            platform.template.replace(
                "{redirect_to}",
                encodedUrl
            );


        // --------------------------------------
        // نتیجه
        // --------------------------------------

        result.success =
            true;

        result.affiliateUrl =
            affiliateUrl;

        result.method =
            platform.method || "redirect";


        return result;

    }


    // ==========================================
    // Resolve خودکار بر اساس URL
    // ==========================================

    function resolveFromUrl(
        productUrl
    ) {

        const platform =
            detectPlatformFromUrl(
                productUrl
            );


        if (!platform) {

            const result =
                createResult();


            result.originalUrl =
                productUrl || null;


            result.error =
                "فروشگاه این Product URL شناسایی نشد.";

            return result;

        }


        return resolve(
            platform,
            productUrl
        );

    }


    // ==========================================
    // بررسی پشتیبانی از فروشگاه
    // ==========================================

    function isSupported(
        platformId
    ) {

        const platform =
            getPlatform(
                platformId
            );


        return Boolean(
            platform &&
            platform.enabled === true
        );

    }


    // ==========================================
    // دریافت فروشگاه‌های پشتیبانی‌شده
    // ==========================================

    function getSupportedPlatforms() {

        return Object.keys(
            affiliatePlatforms
        ).filter(
            function (platformId) {

                return (
                    affiliatePlatforms[
                        platformId
                    ].enabled === true
                );

            }
        );

    }


    // ==========================================
    // دریافت تنظیمات یک فروشگاه
    // ==========================================

    function getConfig(
        platformId
    ) {

        const platform =
            getPlatform(
                platformId
            );


        if (!platform) {

            return null;

        }


        return {
            ...platform
        };

    }


    // ==========================================
    // بررسی سلامت Resolver
    // ==========================================

    function healthCheck() {

        const platforms =
            getSupportedPlatforms();


        const errors = [];


        platforms.forEach(
            function (platformId) {

                const config =
                    getPlatform(
                        platformId
                    );


                if (
                    !config ||
                    typeof config.template !==
                        "string" ||
                    config.template.indexOf(
                        "{redirect_to}"
                    ) === -1
                ) {

                    errors.push(
                        platformId
                    );

                }

            }
        );


        return {

            ready:
                errors.length === 0,

            supportedPlatforms:
                platforms,

            errors:
                errors

        };

    }


    // ==========================================
    // انتشار عمومی
    // ==========================================

    window.DigiyarAffiliateResolver = {

        version:
            "1.0",

        resolve:
            resolve,

        resolveFromUrl:
            resolveFromUrl,

        detectPlatform:
            detectPlatformFromUrl,

        isSupported:
            isSupported,

        getSupportedPlatforms:
            getSupportedPlatforms,

        getConfig:
            getConfig,

        healthCheck:
            healthCheck

    };


})(window);


// ==========================================
// Digiyar Affiliate Resolver 1.0 — END
// ==========================================
