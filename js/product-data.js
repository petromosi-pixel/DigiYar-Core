// ==========================================
// Digiyar 2.0 — Product Data Source
// Version: 1.0
// ==========================================
//
// مسئولیت:
// مدیریت منبع دریافت محصولات.
//
// این فایل:
// ❌ امتیازدهی نمی‌کند
// ❌ Need را تحلیل نمی‌کند
// ❌ Recommendation نمی‌سازد
// ❌ محصول ساختگی تولید نمی‌کند
//
// فقط محصولات واقعی را از Source دریافت کرده
// و در اختیار Product Catalog قرار می‌دهد.
//
// معماری:
//
// Affiliate / Feed / API
//          ↓
// Product Source
//          ↓
// Product Catalog
//          ↓
// Product Scoring
//          ↓
// Digiyar Engine
//
// ==========================================

(function (window) {

    "use strict";


    const DigiyarProductData = {


        // ==========================================
        // نسخه
        // ==========================================

        version: "1.0",


        // ==========================================
        // منابع محصولات
        // ==========================================
        //
        // هر فروشگاه در آینده می‌تواند Source
        // مخصوص خودش را داشته باشد.
        //
        // مثال آینده:
        //
        // digikala:
        // API / Feed
        //
        // snappshop:
        // API / Feed
        //
        // torob:
        // API / Feed
        //
        // ==========================================

        sources: {


            digikala: {

                id:
                    "digikala",

                platform:
                    "digikala",

                type:
                    "affiliate",

                enabled:
                    true,

                endpoint:
                    null,

                affiliateUrl:
                    "https://aflo.ir/16da7m1UY"

            },


            snappshop: {

                id:
                    "snappshop",

                platform:
                    "snappshop",

                type:
                    "affiliate",

                enabled:
                    true,

                endpoint:
                    null,

                affiliateUrl:
                    "https://aflo.ir/YPN05dL7"

            }

        },


        // ==========================================
        // محصولات دریافت‌شده
        // ==========================================
        //
        // عمداً خالی است.
        //
        // تا زمانی که Feed/API واقعی متصل نشده،
        // هیچ محصول ساختگی وارد موتور نمی‌شود.
        //
        products: [],


        // ==========================================
        // دریافت Source
        // ==========================================

        getSource(platformId) {

            if (
                !platformId ||
                typeof platformId !== "string"
            ) {

                return null;

            }


            return (
                this.sources[platformId] ||
                null
            );

        },


        // ==========================================
        // دریافت همه Sourceها
        // ==========================================

        getSources() {

            return {
                ...this.sources
            };

        },


        // ==========================================
        // ثبت محصولات واقعی
        // ==========================================
        //
        // این تابع زمانی استفاده می‌شود که داده
        // واقعی از API / Feed دریافت شود.
        //
        // ==========================================

        setProducts(products) {

            if (
                !Array.isArray(products)
            ) {

                return {

                    success:
                        false,

                    products:
                        this.products,

                    error:
                        "لیست محصولات باید Array باشد."

                };

            }


            this.products =
                products.slice();


            return {

                success:
                    true,

                products:
                    this.products,

                count:
                    this.products.length,

                error:
                    null

            };

        },


        // ==========================================
        // افزودن محصولات جدید
        // ==========================================

        appendProducts(products) {

            if (
                !Array.isArray(products)
            ) {

                return {

                    success:
                        false,

                    count:
                        this.products.length,

                    error:
                        "لیست محصولات باید Array باشد."

                };

            }


            this.products =
                [
                    ...this.products,
                    ...products
                ];


            return {

                success:
                    true,

                count:
                    this.products.length,

                error:
                    null

            };

        },


        // ==========================================
        // دریافت محصولات
        // ==========================================

        getProducts() {

            return this.products.slice();

        },


        // ==========================================
        // دریافت محصولات یک فروشگاه
        // ==========================================

        getProductsByPlatform(
            platformId
        ) {

            if (
                !platformId ||
                typeof platformId !== "string"
            ) {

                return [];

            }


            return this.products.filter(
                product => {

                    return (
                        product &&
                        product.platform ===
                            platformId
                    );

                }
            );

        },


        // ==========================================
        // وضعیت Source
        // ==========================================

        getStatus() {

            const sourceIds =
                Object.keys(
                    this.sources
                );


            const enabledSources =
                sourceIds.filter(
                    id =>
                        this.sources[id] &&
                        this.sources[id].enabled === true
                );


            return {

                version:
                    this.version,

                sources:
                    sourceIds.length,

                enabledSources:
                    enabledSources.length,

                products:
                    this.products.length,

                ready:
                    this.products.length > 0

            };

        },


        // ==========================================
        // بررسی آماده بودن
        // ==========================================

        isReady() {

            return (
                Array.isArray(
                    this.products
                ) &&
                this.products.length > 0
            );

        }

    };


    // ==========================================
    // انتشار عمومی
    // ==========================================

    window.DigiyarProductData =
        DigiyarProductData;


})(window);


// ==========================================
// Digiyar Product Data Source 1.0 — END
// ==========================================
