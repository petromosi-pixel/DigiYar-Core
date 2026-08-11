// ==========================================
// Digiyar 2.0 — Affiliate Resolver
// Version: 1.1
// ==========================================
//
// مسئولیت:
// تبدیل Product URL به Affiliate URL
//
// Provider فعلی:
// Affilio
//
// نکته مهم:
// URL مقصد باید فقط یک بار encode شود.
// ==========================================

(function (window) {

    "use strict";


    const DigiyarAffiliateResolver = {


        // ==========================================
        // نسخه
        // ==========================================

        version: "1.1",


        // ==========================================
        // تنظیمات Affilio
        // ==========================================

        providers: {

            affilio: {

                name: "affilio",

                platforms: {

                    digikala: {
                        template:
                            "https://aflo.ir/16da7m1UY?p={redirect_to}"
                    },

                    snappshop: {
                        template:
                            "https://aflo.ir/4oWErY8Z?p={redirect_to}"
                    }

                }

            }

        },


        // ==========================================
        // تشخیص URL معتبر
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
        // Normalize کردن URL
        // ==========================================
        //
        // هدف:
        // جلوگیری از encode شدن دوباره URL
        //
        // مثال:
        //
        // %DA%AF
        //
        // نباید تبدیل شود به:
        //
        // %25DA%25AF
        //
        // ==========================================

        normalizeUrl(url) {

            if (
                typeof url !== "string"
            ) {

                return null;

            }


            const trimmed =
                url.trim();


            if (
                trimmed === ""
            ) {

                return null;

            }


            try {

                /*
                 * URL constructor
                 * URL را بدون دستکاری غیرضروری
                 * ساختاری می‌کند.
                 */

                const parsed =
                    new URL(trimmed);


                return parsed.toString();

            } catch (error) {

                return null;

            }

        },


        // ==========================================
        // ساخت Affiliate URL
        // ==========================================

        buildAffiliateUrl(
            platform,
            originalUrl
        ) {

            if (
                typeof platform !== "string" ||
                platform.trim() === ""
            ) {

                return {

                    success: false,

                    affiliateUrl: null,

                    platform: platform || null,

                    originalUrl:
                        originalUrl || null,

                    provider: "affilio",

                    error:
                        "شناسه فروشگاه مشخص نشده است."

                };

            }


            const normalizedPlatform =
                platform
                    .trim()
                    .toLowerCase();


            // --------------------------------------
            // بررسی URL
            // --------------------------------------

            const normalizedUrl =
                this.normalizeUrl(
                    originalUrl
                );


            if (!normalizedUrl) {

                return {

                    success: false,

                    affiliateUrl: null,

                    platform:
                        normalizedPlatform,

                    originalUrl:
                        originalUrl || null,

                    provider: "affilio",

                    error:
                        "آدرس محصول معتبر نیست."

                };

            }


            // --------------------------------------
            // پیدا کردن Template
            // --------------------------------------

            const provider =
                this.providers.affilio;


            const platformConfig =
                provider.platforms[
                    normalizedPlatform
                ];


            if (
                !platformConfig ||
                typeof platformConfig.template !==
                    "string"
            ) {

                return {

                    success: false,

                    affiliateUrl: null,

                    platform:
                        normalizedPlatform,

                    originalUrl:
                        normalizedUrl,

                    provider:
                        "affilio",

                    error:
                        "برای این فروشگاه لینک عمومی افیلیت ثبت نشده است."

                };

            }


            // --------------------------------------
            // Encode فقط در همین نقطه
            // --------------------------------------

            const encodedUrl =
                encodeURIComponent(
                    normalizedUrl
                );


            // --------------------------------------
            // ساخت لینک
            // --------------------------------------

            const affiliateUrl =
                platformConfig.template
                    .replace(
                        "{redirect_to}",
                        encodedUrl
                    );


            return {

                success: true,

                affiliateUrl:
                    affiliateUrl,

                platform:
                    normalizedPlatform,

                originalUrl:
                    normalizedUrl,

                provider:
                    "affilio",

                error:
                    null

            };

        },


        // ==========================================
        // API اصلی Resolver
        // ==========================================

        resolve(
            platform,
            originalUrl
        ) {

            return this.buildAffiliateUrl(
                platform,
                originalUrl
            );

        }

    };


    // ==========================================
    // انتشار عمومی
    // ==========================================

    window.DigiyarAffiliateResolver =
        DigiyarAffiliateResolver;


})(window);


// ==========================================
// Digiyar Affiliate Resolver 1.1 — END
// ==========================================
