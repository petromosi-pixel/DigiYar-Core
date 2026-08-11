// ==========================================
// Digiyar 2.0 — Affiliate Resolver
// Version: 1.0
// ==========================================
//
// مسئولیت:
// تبدیل لینک مستقیم محصول به لینک افیلیت
// بر اساس Platform.
//
// فعلاً:
// Digikala → Affilio
// SnappShop → Affilio
//
// معماری:
// Product URL
//      ↓
// Affiliate Resolver
//      ↓
// Affiliate URL
//
// نکته:
// این فایل هیچ محصولی را جستجو نمی‌کند.
// فقط لینک مقصد را Resolve می‌کند.
// ==========================================

(function (window) {

    "use strict";


    const DigiyarAffiliateResolver = {


        // ==========================================
        // نسخه
        // ==========================================

        version: "1.0",


        // ==========================================
        // تنظیمات Affilio
        // ==========================================

        providers: {

            affilio: {

                name: "Affilio",

                platforms: {

                    // ----------------------------------
                    // دیجی‌کالا
                    // ----------------------------------

                    digikala: {

                        publicTemplate:
                            "https://aflo.ir/16da7m1UY?p={redirect_to}"

                    },


                    // ----------------------------------
                    // اسنپ‌شاپ
                    // ----------------------------------

                    snappshop: {

                        publicTemplate:
                            "https://aflo.ir/4oWErY8Z?p={redirect_to}"

                    }

                }

            }

        },


        // ==========================================
        // بررسی معتبر بودن URL
        // ==========================================

        isValidUrl(url) {

            if (
                typeof url !== "string" ||
                url.trim() === ""
            ) {

                return false;

            }


            try {

                new URL(url);

                return true;

            } catch (error) {

                return false;

            }

        },


        // ==========================================
        // تبدیل URL برای قرار گرفتن داخل
        // redirect_to
        // ==========================================

        encodeDestination(url) {

            if (
                !this.isValidUrl(url)
            ) {

                return null;

            }


            return encodeURIComponent(
                url.trim()
            );

        },


        // ==========================================
        // دریافت Template فروشگاه
        // ==========================================

        getTemplate(platformId) {

            if (
                !platformId ||
                typeof platformId !== "string"
            ) {

                return null;

            }


            const provider =
                this.providers.affilio;


            if (
                !provider ||
                !provider.platforms
            ) {

                return null;

            }


            const platform =
                provider.platforms[
                    platformId
                ];


            if (
                !platform ||
                typeof platform.publicTemplate !==
                    "string"
            ) {

                return null;

            }


            return platform.publicTemplate;

        },


        // ==========================================
        // ساخت لینک افیلیت
        // ==========================================

        resolve(
            platformId,
            productUrl
        ) {

            // --------------------------------------
            // بررسی Platform
            // --------------------------------------

            if (
                typeof platformId !== "string" ||
                platformId.trim() === ""
            ) {

                return {

                    success: false,

                    affiliateUrl: null,

                    platform:
                        null,

                    error:
                        "شناسه فروشگاه مشخص نشده است."

                };

            }


            // --------------------------------------
            // بررسی Product URL
            // --------------------------------------

            if (
                !this.isValidUrl(
                    productUrl
                )
            ) {

                return {

                    success: false,

                    affiliateUrl: null,

                    platform:
                        platformId,

                    error:
                        "لینک محصول معتبر نیست."

                };

            }


            // --------------------------------------
            // دریافت Template
            // --------------------------------------

            const template =
                this.getTemplate(
                    platformId
                );


            if (!template) {

                return {

                    success: false,

                    affiliateUrl: null,

                    platform:
                        platformId,

                    error:
                        "برای این فروشگاه لینک عمومی افیلیت ثبت نشده است."

                };

            }


            // --------------------------------------
            // Encode مقصد
            // --------------------------------------

            const encodedDestination =
                this.encodeDestination(
                    productUrl
                );


            if (!encodedDestination) {

                return {

                    success: false,

                    affiliateUrl: null,

                    platform:
                        platformId,

                    error:
                        "تبدیل لینک مقصد به لینک افیلیت انجام نشد."

                };

            }


            // --------------------------------------
            // ساخت لینک
            // --------------------------------------

            const affiliateUrl =
                template.replace(
                    "{redirect_to}",
                    encodedDestination
                );


            // --------------------------------------
            // نتیجه
            // --------------------------------------

            return {

                success: true,

                affiliateUrl:
                    affiliateUrl,

                platform:
                    platformId,

                originalUrl:
                    productUrl,

                provider:
                    "affilio",

                error:
                    null

            };

        },


        // ==========================================
        // بررسی امکان Affiliate Resolution
        // ==========================================

        canResolve(platformId) {

            return Boolean(
                this.getTemplate(
                    platformId
                )
            );

        },


        // ==========================================
        // Resolve امن
        // ==========================================

        resolveIfPossible(
            platformId,
            productUrl
        ) {

            const result =
                this.resolve(
                    platformId,
                    productUrl
                );


            if (
                !result.success
            ) {

                return {

                    success: false,

                    affiliateUrl: null,

                    originalUrl:
                        productUrl || null,

                    platform:
                        platformId || null,

                    error:
                        result.error

                };

            }


            return result;

        }

    };


    // ==========================================
    // انتشار عمومی
    // ==========================================

    window.DigiyarAffiliateResolver =
        DigiyarAffiliateResolver;


})(window);


// ==========================================
// Digiyar Affiliate Resolver 1.0 — END
// ==========================================
