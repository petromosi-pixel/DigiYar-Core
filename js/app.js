// ==========================================
// Digiyar 2.1 — Main Application
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
// Product Catalog
//        ↓
// Product Scoring
//        ↓
// Digiyar Engine
//        ↓
// Recommendation
//
// نکته:
// این فایل منطق داخلی موتورهای هوشمند را تکرار نمی‌کند.
// فقط رابط کاربری را به موتور متصل می‌کند.
// ==========================================

(function (window) {

    "use strict";


    // ==========================================
    // عناصر اصلی
    // ==========================================

    const container =
        document.getElementById("platforms");

    const searchBox =
        document.getElementById("searchBox");


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
    // Platform Registry
    // ==========================================

    function getPlatforms() {

        if (
            window.DigiyarPlatforms &&
            typeof window.DigiyarPlatforms.getPrepared ===
                "function"
        ) {

            return window.DigiyarPlatforms
                .getPrepared();

        }


        // سازگاری با نسخه‌های قدیمی

        if (
            Array.isArray(window.platforms)
        ) {

            return window.platforms;

        }


        return [];

    }


    // ==========================================
    // دریافت لینک فروشگاه
    // ==========================================
    //
    // اولویت:
    //
    // affiliateUrl
    //      ↓
    // directUrl
    //      ↓
    // link
    //
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


            // اطلاعات توسعه آینده

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
                    )
                    ||
                    description.includes(
                        normalizedText
                    )
                    ||
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

        } catch (error) {

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


        // چند ساختار احتمالی برای توسعه آینده

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
    // دریافت Product Catalog
    // ==========================================
    //
    // هیچ محصول ساختگی تولید نمی‌شود.
    //
    // منبع واقعی محصولات می‌تواند در آینده
    // یکی از این متغیرها باشد:
    //
    // window.DigiyarProducts
    // window.digiyarProducts
    // window.DigiyarProductCatalogData
    //
    // ==========================================

    function getProductCatalog() {

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

    function runRecommendations(
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

        const selectedProducts =
            Array.isArray(products)

                ? products

                : getProductCatalog();


        // --------------------------------------
        // اجرای Pipeline
        // --------------------------------------

        try {

            return window.DigiyarEngine
                .recommendFromProfile(
                    selectedCategory,
                    selectedProducts
                );

        } catch (error) {

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

    function getRecommendations(
        category = null,
        products = null,
        limit = 5
    ) {

        const result =
            runRecommendations(
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
    // اجرای اولیه Engine
    // ==========================================
    //
    // اگر Catalog واقعی هنوز وارد نشده باشد،
    // هیچ خطایی به UI منتقل نمی‌شود.
    //
    // ==========================================

    function initializeSmartEngine() {

        if (
            !isSmartEngineReady()
        ) {

            console.warn(
                "Digiyar: Smart Engine هنوز آماده نیست."
            );

            return null;

        }


        const products =
            getProductCatalog();


        // Catalog هنوز وارد نشده

        if (
            products.length === 0
        ) {

            return {

                success: true,

                ready: true,

                status:
                    "engine-ready-catalog-empty",

                recommendations: []

            };

        }


        return runRecommendations();

    }


    // ==========================================
    // نمایش اولیه فروشگاه‌ها
    // ==========================================

    renderPlatforms(
        getPlatforms()
    );


    // ==========================================
    // Search Listener
    // ==========================================

    if (searchBox) {

        searchBox.addEventListener(
            "input",
            function () {

                renderPlatforms(
                    searchPlatforms(
                        searchBox.value
                    )
                );

            }
        );

    }


    // ==========================================
    // راه‌اندازی Smart Engine
    // ==========================================

    const initialEngineState =
        initializeSmartEngine();


    // ==========================================
    // API عمومی DigiyarApp
    // ==========================================

    window.DigiyarApp = {

        version:
            "2.1",


        // ------------------------------
        // Platform
        // ------------------------------

        getPlatforms:
            getPlatforms,

        getPlatformLink:
            getPlatformLink,

        renderPlatforms:
            renderPlatforms,

        searchPlatforms:
            searchPlatforms,


        // ------------------------------
        // Smart Engine
        // ------------------------------

        isSmartEngineReady:
            isSmartEngineReady,

        getProfileCategory:
            getProfileCategory,

        getProductCatalog:
            getProductCatalog,

        runRecommendations:
            runRecommendations,

        getRecommendations:
            getRecommendations,

        getInitialEngineState:
            function () {

                return initialEngineState;

            }

    };


    // ==========================================
    // Debug / Development Event
    // ==========================================
    //
    // برای توسعه آینده:
    //
    // window.dispatchEvent(
    //     new CustomEvent(
    //         "digiyar:recommendation-ready",
    //         { detail: result }
    //     )
    // );
    //
    // ==========================================

    console.log(
        "Digiyar 2.1 initialized.",
        {
            platforms:
                getPlatforms().length,

            smartEngine:
                isSmartEngineReady(),

            catalog:
                getProductCatalog().length
        }
    );


})(window);


// ==========================================
// Digiyar Main Application 2.1 — END
// ==========================================
