// ==========================================
// Digiyar 2.0 — Smart Recommendation Engine
// Version: 1.0
// ==========================================
//
// مسئولیت:
// Need Engine 1.3
//        ↓
// Product Catalog 1.0
//        ↓
// Product Scoring 1.2
//        ↓
// Recommendation Result
//
// این فایل منطق داخلی موتورهای دیگر را تکرار نمی‌کند.
// ==========================================

(function (window) {

    "use strict";


    const DigiyarEngine = {


        // ==========================================
        // نسخه موتور
        // ==========================================

        version: "1.0",


        // ==========================================
        // ایجاد نتیجه استاندارد
        // ==========================================

        createResult() {

            return {

                success: false,

                ready: false,

                need: null,

                catalog: {

                    total: 0,

                    prepared: 0

                },

                recommendations: {

                    eligibleProducts: [],

                    rejectedProducts: []

                },

                errors: [],

                warnings: []

            };

        },


        // ==========================================
        // بررسی وجود موتورهای موردنیاز
        // ==========================================

        checkDependencies() {

            const missing = [];


            if (
                typeof DigiyarNeedEngine ===
                "undefined"
            ) {

                missing.push(
                    "DigiyarNeedEngine"
                );

            }


            if (
                typeof DigiyarProductCatalog ===
                "undefined"
            ) {

                missing.push(
                    "DigiyarProductCatalog"
                );

            }


            if (
                typeof DigiyarProductScoring ===
                "undefined"
            ) {

                missing.push(
                    "DigiyarProductScoring"
                );

            }


            return {

                ready:
                    missing.length === 0,

                missing:
                    missing

            };

        },


        // ==========================================
        // بررسی Need
        // ==========================================

        validateNeed(need) {

            const errors = [];


            if (
                !need ||
                typeof need !== "object" ||
                Array.isArray(need)
            ) {

                return {

                    valid: false,

                    errors: [
                        "Need معتبر نیست."
                    ]

                };

            }


            if (
                !need.category ||
                typeof need.category !== "string"
            ) {

                errors.push(
                    "دسته‌بندی Need مشخص نیست."
                );

            }


            if (
                !need.budget ||
                typeof need.budget !== "object"
            ) {

                errors.push(
                    "بودجه Need مشخص نیست."
                );

            }


            if (
                !Array.isArray(
                    need.priorities
                ) ||
                need.priorities.length === 0
            ) {

                errors.push(
                    "اولویت‌های Need مشخص نیست."
                );

            }


            if (
                !need.context ||
                typeof need.context !== "object" ||
                typeof need.context.usage !== "string" ||
                need.context.usage.trim().length === 0
            ) {

                errors.push(
                    "کاربرد موردنظر کاربر مشخص نیست."
                );

            }


            return {

                valid:
                    errors.length === 0,

                errors:
                    errors

            };

        },


        // ==========================================
        // آماده‌سازی Need
        // ==========================================

        prepareNeed(
            category,
            need = null
        ) {

            if (
                need &&
                typeof need === "object"
            ) {

                return need;

            }


            if (
                typeof DigiyarNeedEngine ===
                    "undefined"
            ) {

                return null;

            }


            if (
                typeof DigiyarNeedEngine
                    .buildNeedFromProfile !==
                "function"
            ) {

                return null;

            }


            return DigiyarNeedEngine
                .buildNeedFromProfile(
                    category
                );

        },


        // ==========================================
        // بررسی آماده بودن Need
        // ==========================================

        isNeedReady(need) {

            if (
                !need ||
                typeof DigiyarNeedEngine ===
                    "undefined"
            ) {

                return false;

            }


            if (
                typeof DigiyarNeedEngine
                    .isReady ===
                "function"
            ) {

                return (
                    DigiyarNeedEngine
                        .isReady(need)
                );

            }


            return (
                this.validateNeed(need)
                    .valid
            );

        },


        // ==========================================
        // آماده‌سازی Catalog
        // ==========================================

        prepareCatalog(
            products,
            category = null
        ) {

            if (
                typeof DigiyarProductCatalog ===
                "undefined"
            ) {

                return [];

            }


            if (
                !Array.isArray(products)
            ) {

                return [];

            }


            return DigiyarProductCatalog
                .prepareForScoring(
                    products,
                    category
                );

        },


        // ==========================================
        // اجرای Recommendation
        // ==========================================

        recommend(
            need,
            products
        ) {

            const result =
                this.createResult();


            // --------------------------------------
            // بررسی وابستگی‌ها
            // --------------------------------------

            const dependencies =
                this.checkDependencies();


            if (
                !dependencies.ready
            ) {

                result.errors.push(

                    "موتورهای موردنیاز در دسترس نیستند: " +
                    dependencies.missing.join(
                        ", "
                    )

                );

                return result;

            }


            // --------------------------------------
            // اعتبارسنجی Need
            // --------------------------------------

            const needValidation =
                this.validateNeed(
                    need
                );


            if (
                !needValidation.valid
            ) {

                result.errors.push(
                    ...needValidation.errors
                );

                return result;

            }


            result.need =
                need;


            // --------------------------------------
            // بررسی Ready بودن Need
            // --------------------------------------

            if (
                !this.isNeedReady(
                    need
                )
            ) {

                result.warnings.push(
                    "Need هنوز برای پیشنهاد نهایی محصول کامل نیست."
                );

                return result;

            }


            result.ready = true;


            // --------------------------------------
            // بررسی Catalog
            // --------------------------------------

            if (
                !Array.isArray(products)
            ) {

                result.errors.push(
                    "لیست محصولات معتبر نیست."
                );

                return result;

            }


            result.catalog.total =
                products.length;


            // --------------------------------------
            // آماده‌سازی محصولات
            // --------------------------------------

            const preparedProducts =
                this.prepareCatalog(
                    products,
                    need.category
                );


            result.catalog.prepared =
                preparedProducts.length;


            // --------------------------------------
            // هیچ محصول معتبر وجود ندارد
            // --------------------------------------

            if (
                preparedProducts.length === 0
            ) {

                result.warnings.push(
                    "هیچ محصول معتبری برای دسته موردنظر پیدا نشد."
                );

                return result;

            }


            // --------------------------------------
            // امتیازدهی
            // --------------------------------------

            let scoringResult;


            try {

                scoringResult =
                    DigiyarProductScoring
                        .rankProducts(
                            need,
                            preparedProducts
                        );

            } catch (error) {

                result.errors.push(

                    error &&
                    error.message
                        ? error.message
                        : "خطای ناشناخته در موتور امتیازدهی."

                );

                return result;

            }


            // --------------------------------------
            // دریافت نتایج
            // --------------------------------------

            if (
                scoringResult &&
                Array.isArray(
                    scoringResult.eligibleProducts
                )
            ) {

                result.recommendations
                    .eligibleProducts =
                    scoringResult
                        .eligibleProducts;

            }


            if (
                scoringResult &&
                Array.isArray(
                    scoringResult.rejectedProducts
                )
            ) {

                result.recommendations
                    .rejectedProducts =
                    scoringResult
                        .rejectedProducts;

            }


            // --------------------------------------
            // موفقیت
            // --------------------------------------

            result.success = true;


            return result;

        },


        // ==========================================
        // ساخت Need از Profile و اجرای Recommendation
        // ==========================================

        recommendFromProfile(
            category,
            products
        ) {

            const result =
                this.createResult();


            if (
                !category ||
                typeof category !== "string"
            ) {

                result.errors.push(
                    "دسته‌بندی محصول مشخص نشده است."
                );

                return result;

            }


            const need =
                this.prepareNeed(
                    category
                );


            if (!need) {

                result.errors.push(
                    "ساخت Need از Profile امکان‌پذیر نیست."
                );

                return result;

            }


            return this.recommend(
                need,
                products
            );

        },


        // ==========================================
        // دریافت بهترین محصولات
        // ==========================================

        getTopProducts(
            recommendationResult,
            limit = 5
        ) {

            if (
                !recommendationResult ||
                !recommendationResult.recommendations ||
                !Array.isArray(
                    recommendationResult
                        .recommendations
                        .eligibleProducts
                )
            ) {

                return [];

            }


            const safeLimit =
                (
                    typeof limit === "number" &&
                    Number.isFinite(limit) &&
                    limit > 0
                )
                    ? Math.floor(limit)
                    : 5;


            return recommendationResult
                .recommendations
                .eligibleProducts
                .slice(
                    0,
                    safeLimit
                );

        },


        // ==========================================
        // بررسی آماده بودن کل Pipeline
        // ==========================================

        isReady() {

            const dependencies =
                this.checkDependencies();


            if (
                !dependencies.ready
            ) {

                return {

                    ready: false,

                    missing:
                        dependencies.missing

                };

            }


            return {

                ready: true,

                missing: []

            };

        }

    };


    // ==========================================
    // انتشار عمومی موتور
    // ==========================================

    window.DigiyarEngine =
        DigiyarEngine;


})(window);


// ==========================================
// Digiyar Smart Recommendation Engine 1.0 — END
// ==========================================
