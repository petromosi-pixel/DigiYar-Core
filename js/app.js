// ==========================================
// Digiyar 2.0 — Main Application
// Version: 2.1
// ==========================================
//
// مسئولیت‌ها:
//
// 1. مدیریت فروشگاه‌ها
// 2. جستجوی فروشگاه‌ها
// 3. دریافت لینک Affiliate
// 4. اتصال رابط کاربری به DigiyarEngine
// 5. نمایش پیشنهاد هوشمند
//
// منطق Need / Catalog / Scoring در این فایل
// تکرار نمی‌شود.
// ==========================================

(function (window) {

"use strict";


// ==========================================
// عناصر اصلی صفحه
// ==========================================

const container =
    document.getElementById("platforms");

const searchBox =
    document.getElementById("searchBox");

const recommendationSection =
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


    // سازگاری با نسخه قبلی

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

function getPlatformLink(platform) {

    if (!platform) {

        return null;

    }


    // Affiliate همیشه اولویت دارد

    if (
        typeof platform.affiliateUrl ===
            "string" &&
        platform.affiliateUrl.trim() !== ""
    ) {

        return platform.affiliateUrl.trim();

    }


    // سپس Direct URL

    if (
        typeof platform.directUrl ===
            "string" &&
        platform.directUrl.trim() !== ""
    ) {

        return platform.directUrl.trim();

    }


    // سازگاری با نسخه قدیمی

    if (
        typeof platform.link ===
            "string" &&
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
    // لوگوی فروشگاه
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
    // بخش عملیات
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


        action.appendChild(
            button
        );

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
    // مونتاژ کارت
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


            const card =
                createPlatformCard(
                    platform
                );


            container.appendChild(
                card
            );

        }
    );

}


// ==========================================
// جستجوی فروشگاه‌ها
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
// دریافت وضعیت موتور هوشمند
// ==========================================

function getRecommendationEngineStatus() {

    if (
        !window.DigiyarEngine
    ) {

        return {

            ready: false,

            missing: [
                "DigiyarEngine"
            ]

        };

    }


    if (
        typeof window.DigiyarEngine
            .isReady !== "function"
    ) {

        return {

            ready: false,

            missing: [
                "DigiyarEngine.isReady"
            ]

        };

    }


    return window.DigiyarEngine
        .isReady();

}


// ==========================================
// اجرای پیشنهاد هوشمند
// ==========================================
//
// این تابع عمداً مستقل از UI فروشگاه‌هاست.
//
// بعداً فقط کافی است Catalog واقعی
// به آن داده شود.
// ==========================================

function getSmartRecommendations(
    category,
    products
) {

    if (
        !window.DigiyarEngine
    ) {

        return {

            success: false,

            ready: false,

            errors: [
                "DigiyarEngine در دسترس نیست."
            ]

        };

    }


    if (
        typeof window.DigiyarEngine
            .recommendFromProfile !==
        "function"
    ) {

        return {

            success: false,

            ready: false,

            errors: [
                "تابع recommendFromProfile در DigiyarEngine وجود ندارد."
            ]

        };

    }


    if (
        !Array.isArray(products)
    ) {

        return {

            success: false,

            ready: false,

            errors: [
                "لیست محصولات معتبر نیست."
            ]

        };

    }


    return window.DigiyarEngine
        .recommendFromProfile(
            category,
            products
        );

}


// ==========================================
// نمایش پیشنهاد هوشمند
// ==========================================

function renderRecommendations(
    recommendationResult
) {

    if (
        !recommendationSection ||
        !recommendationResults
    ) {

        return;

    }


    recommendationResults.innerHTML =
        "";


    // --------------------------------------
    // نتیجه معتبر نیست
    // --------------------------------------

    if (
        !recommendationResult ||
        recommendationResult.success !== true
    ) {

        recommendationSection.hidden =
            true;

        return;

    }


    const recommendations =
        recommendationResult
            .recommendations;


    if (
        !recommendations ||
        !Array.isArray(
            recommendations.eligibleProducts
        ) ||
        recommendations
            .eligibleProducts.length === 0
    ) {

        recommendationSection.hidden =
            true;

        return;

    }


    // --------------------------------------
    // نمایش بهترین محصولات
    // --------------------------------------

    const topProducts =
        window.DigiyarEngine
            .getTopProducts(
                recommendationResult,
                5
            );


    topProducts.forEach(
        function (item) {

            if (
                !item ||
                !item.product ||
                !item.result
            ) {

                return;

            }


            const product =
                item.product;

            const result =
                item.result;


            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "recommendation-card";


            const name =
                document.createElement(
                    "h3"
                );


            name.textContent =
                product.name ||
                "محصول پیشنهادی";


            const score =
                document.createElement(
                    "strong"
                );


            score.textContent =
                "امتیاز دیجی‌یار: " +
                String(
                    result.score || 0
                );


            const price =
                document.createElement(
                    "p"
                );


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


            card.appendChild(name);

            card.appendChild(score);

            card.appendChild(price);


            recommendationResults
                .appendChild(card);

        }
    );


    recommendationSection.hidden =
        false;

}


// ==========================================
// نمایش اولیه فروشگاه‌ها
// ==========================================

const initialPlatforms =
    getPlatforms();


renderPlatforms(
    initialPlatforms
);


// ==========================================
// جستجوی فروشگاه‌ها
// ==========================================

if (searchBox) {

    searchBox.addEventListener(
        "input",
        function () {

            const filteredPlatforms =
                searchPlatforms(
                    searchBox.value
                );


            renderPlatforms(
                filteredPlatforms
            );

        }
    );

}


// ==========================================
// API عمومی برنامه
// ==========================================

window.DigiyarApp = {

    version:
        "2.1",


    // فروشگاه‌ها

    getPlatforms:
        getPlatforms,

    getPlatformLink:
        getPlatformLink,

    renderPlatforms:
        renderPlatforms,

    searchPlatforms:
        searchPlatforms,


    // موتور هوشمند

    getRecommendationEngineStatus:
        getRecommendationEngineStatus,

    getSmartRecommendations:
        getSmartRecommendations,

    renderRecommendations:
        renderRecommendations

};


// ==========================================
// پایان
// ==========================================

})(window);

// ==========================================
// Digiyar Main Application 2.1 — END
// ==========================================
