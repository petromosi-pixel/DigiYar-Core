// ==========================================
// Digiyar 2.2 — Product Source
// Version: 1.0
// ==========================================
//
// مسئولیت:
// دریافت محصولات واقعی برای Smart Engine
//
// این فایل:
// - محصول ساختگی تولید نمی‌کند.
// - منطق Scoring را تکرار نمی‌کند.
// - منطق Affiliate را تکرار نمی‌کند.
// - فقط Source را به Catalog تحویل می‌دهد.
//
// Pipeline:
//
// Product Source
//      ↓
// Product Catalog
//      ↓
// Product Scoring
//      ↓
// Digiyar Engine
//      ↓
// Affiliate Resolver
//
// ==========================================

(function (window) {

    "use strict";


    const DigiyarProductSource = {

        version: "1.0",


        // ==========================================
        // تنظیمات
        // ==========================================

        config: {

            /*
             * اگر در آینده یک API/Feed واقعی داشتیم،
             * آدرس آن را اینجا قرار می‌دهیم.
             *
             * فعلاً null است تا هیچ درخواست جعلی
             * یا نامعتبر ارسال نشود.
             */

            feedUrl: null,

            timeout: 10000

        },


        // ==========================================
        // ساخت نتیجه استاندارد
        // ==========================================

        createResult() {

            return {

                success: false,

                products: [],

                source: null,

                total: 0,

                error: null,

                warnings: []

            };

        },


        // ==========================================
        // اعتبارسنجی Array
        // ==========================================

        validateArray(data) {

            return Array.isArray(data);

        },


        // ==========================================
        // دریافت Catalog از Window
        // ==========================================

        getWindowProducts() {

            if (
                Array.isArray(
                    window.DigiyarProducts
                )
            ) {

                return window.DigiyarProducts;

            }


            if (
                Array.isArray(
                    window.digiyarProducts
                )
            ) {

                return window.digiyarProducts;

            }


            if (
                Array.isArray(
                    window.DigiyarProductCatalogData
                )
            ) {

                return window.DigiyarProductCatalogData;

            }


            return [];

        },


        // ==========================================
        // دریافت از JSON Feed
        // ==========================================

        async fetchFeed(url = null) {

            const result =
                this.createResult();


            const targetUrl =
                url ||
                this.config.feedUrl;


            if (
                typeof targetUrl !== "string" ||
                targetUrl.trim() === ""
            ) {

                result.error =
                    "منبع واقعی محصولات هنوز تنظیم نشده است.";

                return result;

            }


            const controller =
                new AbortController();


            const timeout =
                setTimeout(
                    function () {
                        controller.abort();
                    },
                    this.config.timeout
                );


            try {

                const response =
                    await fetch(
                        targetUrl,
                        {
                            method: "GET",

                            headers: {
                                "Accept":
                                    "application/json"
                            },

                            signal:
                                controller.signal
                        }
                    );


                if (!response.ok) {

                    result.error =
                        "دریافت Catalog با خطای HTTP " +
                        response.status +
                        " مواجه شد.";

                    return result;

                }


                const data =
                    await response.json();


                let products = data;


                /*
                 * پشتیبانی از چند ساختار رایج Feed
                 */

                if (
                    data &&
                    Array.isArray(data.products)
                ) {

                    products =
                        data.products;

                }


                if (
                    data &&
                    Array.isArray(data.items)
                ) {

                    products =
                        data.items;

                }


                if (
                    !this.validateArray(
                        products
                    )
                ) {

                    result.error =
                        "ساختار Catalog دریافتی معتبر نیست.";

                    return result;

                }


                result.success = true;

                result.products =
                    products;

                result.source =
                    targetUrl;

                result.total =
                    products.length;


                return result;

            } catch (error) {

                result.error =
                    error &&
                    error.name === "AbortError"

                        ? "زمان دریافت Catalog تمام شد."

                        : (
                            error &&
                            error.message
                                ? error.message
                                : "خطای ناشناخته در دریافت Catalog."
                        );

                return result;

            } finally {

                clearTimeout(
                    timeout
                );

            }

        },


        // ==========================================
        // دریافت محصولات
        // ==========================================

        async getProducts(options = {}) {

            const result =
                this.createResult();


            /*
             * اولویت اول:
             * Catalog تزریق‌شده توسط API/Backend
             */

            if (
                Array.isArray(
                    options.products
                )
            ) {

                result.success = true;

                result.products =
                    options.products;

                result.source =
                    "options";

                result.total =
                    options.products.length;

                return result;

            }


            /*
             * اولویت دوم:
             * Window
             */

            const windowProducts =
                this.getWindowProducts();


            if (
                windowProducts.length > 0
            ) {

                result.success = true;

                result.products =
                    windowProducts;

                result.source =
                    "window";

                result.total =
                    windowProducts.length;

                return result;

            }


            /*
             * اولویت سوم:
             * Feed واقعی
             */

            if (
                typeof options.feedUrl === "string" &&
                options.feedUrl.trim() !== ""
            ) {

                return this.fetchFeed(
                    options.feedUrl
                );

            }


            if (
                typeof this.config.feedUrl === "string" &&
                this.config.feedUrl.trim() !== ""
            ) {

                return this.fetchFeed(
                    this.config.feedUrl
                );

            }


            result.error =
                "هیچ منبع واقعی محصول برای دیجی‌یار تنظیم نشده است.";

            return result;

        },


        // ==========================================
        // تنظیم Feed
        // ==========================================

        setFeedUrl(url) {

            if (
                typeof url !== "string" ||
                url.trim() === ""
            ) {

                return false;

            }


            this.config.feedUrl =
                url.trim();


            return true;

        },


        // ==========================================
        // وضعیت Source
        // ==========================================

        isConfigured() {

            return Boolean(
                this.config.feedUrl
            );

        }

    };


    // ==========================================
    // انتشار عمومی
    // ==========================================

    window.DigiyarProductSource =
        DigiyarProductSource;


})(window);


// ==========================================
// Digiyar Product Source 1.0 — END
// ==========================================
