// ==========================================
// Digiyar 2.0 — Product Catalog
// Version: 1.1
// ==========================================
//
// مسئولیت:
// 1. ساختار استاندارد Product
// 2. اعتبارسنجی Product
// 3. فیلتر Category
// 4. آماده‌سازی برای Scoring
// 5. اتصال Product URL به Affiliate Resolver
//
// نکته:
// Product Catalog خودش لینک افیلیت را تولید نمی‌کند.
// این کار فقط توسط DigiyarAffiliateResolver انجام می‌شود.
// ==========================================

(function (window) {

    "use strict";


    const DigiyarProductCatalog = {


        // ==========================================
        // نسخه
        // ==========================================

        version: "1.1",


        // ==========================================
        // ایجاد Product استاندارد
        // ==========================================

        createProduct(data = {}) {

            return {

                id:
                    data.id ?? null,

                category:
                    data.category ?? null,

                name:
                    data.name ?? null,

                brand:
                    data.brand ?? null,

                model:
                    data.model ?? null,


                price: {

                    current:
                        data.price &&
                        typeof data.price.current === "number"
                            ? data.price.current
                            : null,

                    original:
                        data.price &&
                        typeof data.price.original === "number"
                            ? data.price.original
                            : null,

                    currency:
                        data.price &&
                        data.price.currency
                            ? data.price.currency
                            : "IRR"

                },


                features:
                    data.features &&
                    typeof data.features === "object" &&
                    !Array.isArray(data.features)
                        ? { ...data.features }
                        : {},


                scores:
                    data.scores &&
                    typeof data.scores === "object" &&
                    !Array.isArray(data.scores)
                        ? { ...data.scores }
                        : {},


                usageScores:
                    data.usageScores &&
                    typeof data.usageScores === "object" &&
                    !Array.isArray(data.usageScores)
                        ? { ...data.usageScores }
                        : {},


                // --------------------------------------
                // فروشگاه
                // --------------------------------------

                platform:
                    data.platform ?? null,


                // --------------------------------------
                // URL اصلی محصول
                // --------------------------------------

                url:
                    data.url ?? null,


                // --------------------------------------
                // URL افیلیت
                //
                // می‌تواند null باشد.
                // Resolver در مرحله آماده‌سازی
                // آن را تولید می‌کند.
                // --------------------------------------

                affiliateUrl:
                    data.affiliateUrl ?? null,


                metadata:
                    data.metadata &&
                    typeof data.metadata === "object" &&
                    !Array.isArray(data.metadata)
                        ? { ...data.metadata }
                        : {}

            };

        },


        // ==========================================
        // اعتبارسنجی Product
        // ==========================================

        validateProduct(product) {

            const errors = [];


            if (
                !product ||
                typeof product !== "object" ||
                Array.isArray(product)
            ) {

                return {

                    valid: false,

                    errors: [
                        "Product باید یک Object معتبر باشد."
                    ]

                };

            }


            // --------------------------------------
            // Category
            // --------------------------------------

            if (
                typeof product.category !== "string" ||
                product.category.trim().length === 0
            ) {

                errors.push(
                    "Category محصول مشخص نیست."
                );

            }


            // --------------------------------------
            // ID
            // --------------------------------------

            if (
                product.id === null ||
                product.id === undefined ||
                String(product.id).trim().length === 0
            ) {

                errors.push(
                    "شناسه محصول (id) مشخص نیست."
                );

            }


            // --------------------------------------
            // Name
            // --------------------------------------

            if (
                typeof product.name !== "string" ||
                product.name.trim().length === 0
            ) {

                errors.push(
                    "نام محصول مشخص نیست."
                );

            }


            // --------------------------------------
            // Price
            // --------------------------------------

            if (
                !product.price ||
                typeof product.price !== "object" ||
                Array.isArray(product.price)
            ) {

                errors.push(
                    "اطلاعات قیمت محصول موجود نیست."
                );

            }
            else if (
                typeof product.price.current !== "number" ||
                !Number.isFinite(
                    product.price.current
                ) ||
                product.price.current <= 0
            ) {

                errors.push(
                    "قیمت فعلی محصول معتبر نیست."
                );

            }


            // --------------------------------------
            // Features
            // --------------------------------------

            if (
                product.features !== undefined &&
                (
                    product.features === null ||
                    typeof product.features !== "object" ||
                    Array.isArray(product.features)
                )
            ) {

                errors.push(
                    "ساختار features محصول معتبر نیست."
                );

            }


            // --------------------------------------
            // Scores
            // --------------------------------------

            if (
                product.scores !== undefined &&
                (
                    product.scores === null ||
                    typeof product.scores !== "object" ||
                    Array.isArray(product.scores)
                )
            ) {

                errors.push(
                    "ساختار scores محصول معتبر نیست."
                );

            }


            // --------------------------------------
            // Usage Scores
            // --------------------------------------

            if (
                product.usageScores !== undefined &&
                (
                    product.usageScores === null ||
                    typeof product.usageScores !== "object" ||
                    Array.isArray(product.usageScores)
                )
            ) {

                errors.push(
                    "ساختار usageScores محصول معتبر نیست."
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
        // اعتبارسنجی چند Product
        // ==========================================

        validateProducts(products) {

            if (!Array.isArray(products)) {

                return {

                    valid: false,

                    validProducts: [],

                    invalidProducts: [],

                    errors: [
                        "Catalog باید یک Array باشد."
                    ]

                };

            }


            const validProducts = [];

            const invalidProducts = [];


            products.forEach(
                (product, index) => {

                    const validation =
                        this.validateProduct(
                            product
                        );


                    if (validation.valid) {

                        validProducts.push(
                            product
                        );

                    }
                    else {

                        invalidProducts.push({

                            index:
                                index,

                            product:
                                product,

                            errors:
                                validation.errors

                        });

                    }

                }
            );


            return {

                valid:
                    invalidProducts.length === 0,

                validProducts:
                    validProducts,

                invalidProducts:
                    invalidProducts,

                errors: []

            };

        },


        // ==========================================
        // فیلتر Category
        // ==========================================

        filterByCategory(
            products,
            category
        ) {

            if (!Array.isArray(products)) {

                return [];

            }


            if (
                typeof category !== "string" ||
                category.trim().length === 0
            ) {

                return [];

            }


            return products.filter(
                product => {

                    return (
                        product &&
                        product.category === category
                    );

                }
            );

        },


        // ==========================================
        // دریافت Affiliate URL
        // ==========================================
        //
        // Product Catalog فقط Resolver را صدا می‌زند.
        // منطق Affilio اینجا تکرار نمی‌شود.
        // ==========================================

        resolveAffiliateUrl(product) {

            if (!product) {

                return null;

            }


            if (
                typeof window.DigiyarAffiliateResolver ===
                    "undefined"
            ) {

                return null;

            }


            if (
                typeof window.DigiyarAffiliateResolver.resolve !==
                    "function"
            ) {

                return null;

            }


            if (
                typeof product.platform !== "string" ||
                product.platform.trim() === ""
            ) {

                return null;

            }


            if (
                typeof product.url !== "string" ||
                product.url.trim() === ""
            ) {

                return null;

            }


            const result =
                window.DigiyarAffiliateResolver.resolve(
                    product.platform,
                    product.url
                );


            if (
                !result ||
                result.success !== true ||
                typeof result.affiliateUrl !== "string"
            ) {

                return null;

            }


            return result.affiliateUrl;

        },


        // ==========================================
        // آماده‌سازی یک Product برای Affiliate
        // ==========================================
        //
        // Product اصلی تغییر داده نمی‌شود.
        // یک Object جدید برگردانده می‌شود.
        // ==========================================

        prepareForAffiliate(product) {

            if (!product) {

                return null;

            }


            const affiliateUrl =
                this.resolveAffiliateUrl(
                    product
                );


            return {

                ...product,

                affiliateUrl:
                    affiliateUrl

            };

        },


        // ==========================================
        // آماده‌سازی چند Product برای Affiliate
        // ==========================================

        prepareProductsForAffiliate(products) {

            if (!Array.isArray(products)) {

                return [];

            }


            return products
                .map(
                    product =>
                        this.prepareForAffiliate(
                            product
                        )
                )
                .filter(Boolean);

        },


        // ==========================================
        // دریافت محصولات آماده امتیازدهی
        // ==========================================

        prepareForScoring(
            products,
            category = null
        ) {

            if (!Array.isArray(products)) {

                return [];

            }


            let prepared =
                products.filter(
                    product => {

                        const validation =
                            this.validateProduct(
                                product
                            );

                        return validation.valid;

                    }
                );


            if (category) {

                prepared =
                    this.filterByCategory(
                        prepared,
                        category
                    );

            }


            /*
             * --------------------------------------
             * اتصال به Affiliate Resolver
             * --------------------------------------
             *
             * از اینجا به بعد هر Product معتبر
             * هنگام ورود به Pipeline، در صورت
             * امکان، affiliateUrl خواهد داشت.
             */

            prepared =
                this.prepareProductsForAffiliate(
                    prepared
                );


            return prepared;

        },


        // ==========================================
        // اضافه کردن Product
        // ==========================================

        addProduct(
            products,
            product
        ) {

            if (!Array.isArray(products)) {

                return {

                    success: false,

                    products: [],

                    error:
                        "Catalog معتبر نیست."

                };

            }


            const validation =
                this.validateProduct(
                    product
                );


            if (!validation.valid) {

                return {

                    success: false,

                    products:
                        products,

                    error:
                        "Product معتبر نیست.",

                    errors:
                        validation.errors

                };

            }


            const exists =
                products.some(
                    item =>
                        item &&
                        item.id === product.id
                );


            if (exists) {

                return {

                    success: false,

                    products:
                        products,

                    error:
                        "محصولی با این id قبلاً در Catalog وجود دارد."

                };

            }


            return {

                success: true,

                products: [
                    ...products,
                    product
                ],

                error:
                    null

            };

        },


        // ==========================================
        // حذف Product
        // ==========================================

        removeProduct(
            products,
            productId
        ) {

            if (!Array.isArray(products)) {

                return [];

            }


            return products.filter(
                product =>
                    !product ||
                    product.id !== productId
            );

        },


        // ==========================================
        // پیدا کردن Product
        // ==========================================

        findProduct(
            products,
            productId
        ) {

            if (!Array.isArray(products)) {

                return null;

            }


            return (
                products.find(
                    product =>
                        product &&
                        product.id === productId
                ) || null
            );

        },


        // ==========================================
        // آمار Catalog
        // ==========================================

        getStats(products) {

            if (!Array.isArray(products)) {

                return {

                    total: 0,

                    valid: 0,

                    invalid: 0,

                    categories: {}

                };

            }


            const categories = {};

            let valid = 0;

            let invalid = 0;


            products.forEach(
                product => {

                    const validation =
                        this.validateProduct(
                            product
                        );


                    if (validation.valid) {

                        valid++;

                        const category =
                            product.category;


                        if (
                            !categories[category]
                        ) {

                            categories[category] = 0;

                        }


                        categories[category]++;

                    }
                    else {

                        invalid++;

                    }

                }
            );


            return {

                total:
                    products.length,

                valid:
                    valid,

                invalid:
                    invalid,

                categories:
                    categories

            };

        },


        // ==========================================
        // بررسی آماده بودن Catalog
        // ==========================================

        isReady(products) {

            if (
                !Array.isArray(products)
            ) {

                return false;

            }


            return (
                products.length > 0 &&
                this.validateProducts(
                    products
                ).validProducts.length > 0
            );

        }

    };


    // ==========================================
    // انتشار عمومی
    // ==========================================

    window.DigiyarProductCatalog =
        DigiyarProductCatalog;


})(window);


// ==========================================
// Digiyar Product Catalog 1.1 — END
// ==========================================
