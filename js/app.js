// ==========================================
// Digiyar 2.2 — Main Application
// Platform UI + Smart Recommendation Bridge
// ==========================================
//
// مسئولیت:
//
// Platform Registry
//        ↓
// User Profile
//        ↓
// Need Engine
//        ↓
// Product Source
//        ↓
// Product Catalog
//        ↓
// Product Scoring
//        ↓
// Digiyar Engine
//        ↓
// Recommendation
//
// این فایل فقط رابط کاربری را به موتورهای
// دیجی‌یار متصل می‌کند.
//
// منطق Affiliate داخل این فایل نیست.
// منطق Scoring داخل این فایل نیست.
// منطق Need داخل این فایل نیست.
// ==========================================

(function (window) {

    "use strict";


    // ==========================================
    // عناصر اصلی UI
    // ==========================================

    const container =
        document.getElementById("platforms");

    const searchBox =
        document.getElementById("searchBox");

    const smartRecommendation =
        document.getElementById(
            "smartRecommendation"
        );

    const recommendationResults =
        document.getElementById(
            "recommendationResults"
        );


    // ==========================================
    // بررسی Container
    // ==========================================

    if (!container) {

        console.error(
            "Digiyar: عنصر #platforms پیدا نشد."
        );

        return;

    }


    // ==========================================
    // دریافت فروشگاه‌ها
    // ==========================================

    function getPlatforms() {

        if (
            window.DigiyarPlatforms &&
            typeof window.DigiyarPlatforms
                .getPrepared === "function"
        ) {

            return window.DigiyarPlatforms
                .getPrepared();

        }


        // سازگاری با نسخه‌های قدیمی

        if (
            Array.isArray(
                window.platforms
            )
        ) {

            return window.platforms;

        }


        return [];

    }


    // ==========================================
    // دریافت لینک فروشگاه
    // ==========================================

    function getPlatformLink(platform) {

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


        if (
            typeof platform.link === "string" &&
            platform.link.trim() !== "" &&
            platform.link !== "#"
        ) {

            return platform.link.trim();

        }


        return null;

    }


    // ==========================================
    // بررسی فعال بودن فروشگاه
    // ==========================================

    function isPlatformActive(platform) {

        if (!platform) {

            return false;

        }


        if (
            platform.active !== true
        ) {

            return false;

        }


        return Boolean(
            getPlatformLink(platform)
        );

    }


    // ==========================================
    // ساخت کارت فروشگاه
    // ==========================================

    function createPlatformCard(platform) {

        const card =
            document.createElement("div");

        card.className =
            "platform-card";


        // --------------------------------------
        // اطلاعات فروشگاه
        // --------------------------------------

        const info =
            document.createElement("div");

        info.className =
            "platform-info";


        const title =
            document.createElement("h3");

        title.textContent =
            platform.name || "فروشگاه";


        const description =
            document.createElement("p");

        description.textContent =
            platform.description || "";


        info.appendChild(title);
        info.appendChild(description);


        // --------------------------------------
        // لوگو
        // --------------------------------------

        const image =
            document.createElement("img");

        image.src =
            platform.image || "";

        image.alt =
            platform.name || "فروشگاه";


        image.onerror =
            function () {

                image.style.display =
                    "none";

            };


        // --------------------------------------
        // Action
        // --------------------------------------

        const action =
            document.createElement("div");

        action.className =
            "platform-action";


        const link =
            getPlatformLink(platform);


        if (
            isPlatformActive(platform) &&
            link
        ) {

            const button =
                document.createElement("a");


            button.href =
                link;


            button.className =
                "platform-btn";


            button.target =
                "_blank";


            button.rel =
                "noopener noreferrer";


            button.textContent =
                "ورود به فروشگاه";


            if (platform.id) {

                button.dataset.platformId =
                    platform.id;

            }


            if (platform.hasAffiliate) {

                button.dataset.affiliate =
                    "true";

            }


            action.appendChild(button);

        }

        else {

            const comingSoon =
                document.createElement("span");


            comingSoon.className =
                "coming-soon";


            comingSoon.textContent =
                "به‌زودی";


            action.appendChild(
                comingSoon
            );

        }


        // --------------------------------------
        // مونتاژ
        // --------------------------------------

        card.appendChild(action);

        card.appendChild(info);

        card.appendChild(image);


        return card;

    }


    // ==========================================
    // نمایش فروشگاه‌ها
    // ==========================================

    function renderPlatforms(list) {

        container.innerHTML = "";


        if (
            !Array.isArray(list) ||
            list.length === 0
        ) {

            const empty =
                document.createElement("div");


            empty.className =
                "no-results";


            empty.textContent =
                "فروشگاهی با این نام پیدا نشد.";


            container.appendChild(
                empty
            );


            return;

        }


        list.forEach(
            function (platform) {

                if (!platform) {

                    return;

                }


                container.appendChild(
                    createPlatformCard(
                        platform
                    )
                );

            }
        );

    }


    // ==========================================
    // جستجوی فروشگاه
    // ==========================================

    function searchPlatforms(searchText) {

        const allPlatforms =
            getPlatforms();


        const normalizedText =
            String(
                searchText || ""
            )
                .trim()
                .toLowerCase();


        if (!normalizedText) {

            return allPlatforms;

        }


        return allPlatforms.filter(
            function (platform) {

                if (!platform) {

                    return false;

                }


                const name =
                    String(
                        platform.name || ""
                    )
                        .toLowerCase();


                const description =
                    String(
                        platform.description || ""
                    )
                        .toLowerCase();


                const id =
                    String(
                        platform.id || ""
                    )
                        .toLowerCase();


                return (
                    name.includes(
                        normalizedText
                    ) ||
                    description.includes(
                        normalizedText
                    ) ||
                    id.includes(
                        normalizedText
                    )
                );

            }
        );

    }


    // ==========================================
    // Smart Engine
    // ==========================================

    function isSmartEngineReady() {

        return Boolean(
            window.DigiyarEngine &&
            typeof window.DigiyarEngine
                .isReady === "function"
        );

    }


    // ==========================================
    // دریافت Category از Profile
    // ==========================================

    function getProfileCategory() {

        if (
            !window.DigiyarUserProfile
        ) {

            return null;

        }


        if (
            typeof window.DigiyarUserProfile
                .getProfile !== "function"
        ) {

            return null;

        }


        let profile;


        try {

            profile =
                window.DigiyarUserProfile
                    .getProfile();

        }

        catch (error) {

            console.error(
                "Digiyar: خطا در دریافت Profile.",
                error
            );

            return null;

        }


        if (
            !profile ||
            typeof profile !== "object"
        ) {

            return null;

        }


        const candidates = [

            profile.category,

            profile.declared &&
                profile.declared.category,

            profile.learned &&
                profile.learned.category,

            profile.context &&
                profile.context.category

        ];


        for (
            let i = 0;
            i < candidates.length;
            i++
        ) {

            if (
                typeof candidates[i] === "string" &&
                candidates[i].trim() !== ""
            ) {

                return candidates[i].trim();

            }

        }


        return null;

    }


    // ==========================================
    // دریافت Product Source
    // ==========================================

    async function getProductCatalog() {

        // --------------------------------------
        // Product Source جدید
        // --------------------------------------

        if (
            window.DigiyarProductSource &&
            typeof window.DigiyarProductSource
                .getProducts === "function"
        ) {

            try {

                const sourceResult =
                    await window.DigiyarProductSource
                        .getProducts();


                if (
                    sourceResult &&
                    sourceResult.success === true &&
                    Array.isArray(
                        sourceResult.products
                    )
                ) {

                    return sourceResult.products;

                }

            }

            catch (error) {

                console.error(
                    "Digiyar: خطا در Product Source.",
                    error
                );

            }

        }


        // --------------------------------------
        // سازگاری با Catalog قدیمی
        // --------------------------------------

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

    }


    // ==========================================
    // اجرای موتور پیشنهاددهی
    // ==========================================

    async function runRecommendations(
        category = null,
        products = null
    ) {

        // --------------------------------------
        // بررسی موتور
        // --------------------------------------

        if (
            !isSmartEngineReady()
        ) {

            return {

                success: false,

                ready: false,

                recommendations: {

                    eligibleProducts: [],

                    rejectedProducts: []

                },

                errors: [

                    "DigiyarEngine آماده نیست."

                ],

                warnings: []

            };

        }


        // --------------------------------------
        // دریافت Category
        // --------------------------------------

        const selectedCategory =
            typeof category === "string" &&
            category.trim() !== ""

                ? category.trim()

                : getProfileCategory();


        if (!selectedCategory) {

            return {

                success: false,

                ready: false,

                recommendations: {

                    eligibleProducts: [],

                    rejectedProducts: []

                },

                errors: [

                    "دسته‌بندی برای Recommendation مشخص نیست."

                ],

                warnings: []

            };

        }


        // --------------------------------------
        // دریافت محصولات
        // --------------------------------------

        let selectedProducts;


        if (
            Array.isArray(products)
        ) {

            selectedProducts =
                products;

        }

        else {

            selectedProducts =
                await getProductCatalog();

        }


        // --------------------------------------
        // اجرای Pipeline
        // --------------------------------------

        try {

            return window.DigiyarEngine
                .recommendFromProfile(
                    selectedCategory,
                    selectedProducts
                );

        }

        catch (error) {

            console.error(
                "Digiyar: خطا در Recommendation.",
                error
            );


            return {

                success: false,

                ready: false,

                recommendations: {

                    eligibleProducts: [],

                    rejectedProducts: []

                },

                errors: [

                    error &&
                    error.message

                        ? error.message

                        : "خطای ناشناخته در Recommendation."

                ],

                warnings: []

            };

        }

    }


    // ==========================================
    // دریافت بهترین پیشنهادها
    // ==========================================

    async function getRecommendations(
        category = null,
        products = null,
        limit = 5
    ) {

        const result =
            await runRecommendations(
                category,
                products
            );


        if (
            !result ||
            !result.success ||
            !window.DigiyarEngine
        ) {

            return {

                result:
                    result,

                products: []

            };

        }


        return {

            result:
                result,

            products:
                window.DigiyarEngine
                    .getTopProducts(
                        result,
                        limit
                    )

        };

    }


    // ==========================================
    // نمایش پیشنهادهای هوشمند
    // ==========================================

    function renderRecommendations(
        recommendationProducts
    ) {

        if (
            !smartRecommendation ||
            !recommendationResults
        ) {

            return;

        }


        recommendationResults.innerHTML = "";


        if (
            !Array.isArray(
                recommendationProducts
            ) ||
            recommendationProducts.length === 0
        ) {

            smartRecommendation.hidden =
                true;

            return;

        }


        recommendationProducts.forEach(
            function (item) {

                if (
                    !item ||
                    !item.product
                ) {

                    return;

                }


                const product =
                    item.product;


                const card =
                    document.createElement("div");

                card.className =
                    "recommendation-card";


                const title =
                    document.createElement("h3");

                title.textContent =
                    product.name ||
                    "محصول پیشنهادی";


                const price =
                    document.createElement("p");

                if (
                    product.price &&
                    typeof product.price.current ===
                        "number"
                ) {

                    price.textContent =
                        Number(
                            product.price.current
                        ).toLocaleString(
                            "fa-IR"
                        ) +
                        " تومان";

                }

                else {

                    price.textContent =
                        "قیمت نامشخص";

                }


                const score =
                    document.createElement("p");

                score.textContent =
                    "امتیاز هوشمند: " +
                    (
                        item.result &&
                        typeof item.result.score ===
                            "number"
                            ? item.result.score
                            : 0
                    ) +
                    " از 100";


                const button =
                    document.createElement("a");


                // ----------------------------------
                // Affiliate URL
                // ----------------------------------

                let affiliateUrl =
                    null;


                if (
                    typeof product.affiliateUrl ===
                        "string" &&
                    product.affiliateUrl.trim() !== ""
                ) {

                    affiliateUrl =
                        product.affiliateUrl.trim();

                }


                // اگر Catalog هنوز Affiliate
                // را آماده نکرده باشد، Resolver
                // مستقیماً استفاده می‌شود.

                if (
                    !affiliateUrl &&
                    window.DigiyarAffiliateResolver &&
                    typeof window.DigiyarAffiliateResolver
                        .resolve === "function" &&
                    typeof product.platform === "string" &&
                    typeof product.url === "string"
                ) {

                    const resolved =
                        window.DigiyarAffiliateResolver
                            .resolve(
                                product.platform,
                                product.url
                            );


                    if (
                        resolved &&
                        resolved.success === true
   
