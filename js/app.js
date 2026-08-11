// ==========================================
// Digiyar 2.2 — Main Application
// Version: 2.2
// ==========================================
//
// مسئولیت:
//
// 1. نمایش فروشگاه‌ها
// 2. جستجوی فروشگاه‌ها
// 3. استفاده از Platform Registry
//
// این فایل:
// - منطق Affiliate را تکرار نمی‌کند.
// - منطق Product Scoring را تکرار نمی‌کند.
// - منطق Need Engine را تکرار نمی‌کند.
// - Product Source را داخل خود نگهداری نمی‌کند.
//
// ==========================================


(function (window) {

    "use strict";


    // ==========================================
    // عناصر صفحه
    // ==========================================

    const container =
        document.getElementById("platforms");

    const searchBox =
        document.getElementById("searchBox");


    // ==========================================
    // بررسی عناصر ضروری
    // ==========================================

    if (!container) {

        console.error(
            "Digiyar: عنصر #platforms پیدا نشد."
        );

        return;

    }


    // ==========================================
    // دریافت لیست فروشگاه‌ها
    // ==========================================

    function getPlatforms() {

        /*
         * platforms.js برای سازگاری
         * این متغیر را روی window قرار می‌دهد.
         */

        if (
            Array.isArray(
                window.platforms
            )
        ) {

            return window.platforms;

        }


        /*
         * پشتیبانی از API جدید Platform Registry
         */

        if (
            window.DigiyarPlatforms &&
            typeof window.DigiyarPlatforms
                .getPrepared === "function"
        ) {

            return window.DigiyarPlatforms
                .getPrepared();

        }


        return [];

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
        // لوگو
        // --------------------------------------

        const image =
            document.createElement("img");

        image.src =
            platform.image || "";

        image.alt =
            platform.name || "فروشگاه";


        // --------------------------------------
        // اطلاعات
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


        // --------------------------------------
        // دکمه
        // --------------------------------------

        if (
            platform.active === true
        ) {

            const button =
                document.createElement("a");

            button.href =
                platform.link ||
                platform.affiliateUrl ||
                platform.directUrl ||
                "#";

            button.className =
                "platform-btn";

            button.target =
                "_blank";

            button.rel =
                "noopener noreferrer";

            button.innerHTML =
                '<span class="btn-text">ورود به فروشگاه</span>';


            info.appendChild(
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


            info.appendChild(
                comingSoon
            );

        }


        // --------------------------------------
        // مونتاژ کارت
        // --------------------------------------

        info.insertBefore(
            title,
            info.firstChild
        );

        info.insertBefore(
            description,
            title.nextSibling
        );


        card.appendChild(image);

        card.appendChild(info);


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
    // جستجوی فروشگاه
    // ==========================================

    function searchPlatforms(
        searchText
    ) {

        const text =
            String(
                searchText || ""
            )
                .trim()
                .toLowerCase();


        const allPlatforms =
            getPlatforms();


        if (!text) {

            return allPlatforms;

        }


        return allPlatforms.filter(
            function (platform) {

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


                return (
                    name.includes(text) ||
                    description.includes(text)
                );

            }
        );

    }


    // ==========================================
    // نمایش اولیه
    // ==========================================

    renderPlatforms(
        getPlatforms()
    );


    // ==========================================
    // جستجوی فروشگاه
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
    // API عمومی
    // ==========================================

    window.DigiyarApp = {

        version:
            "2.2",

        getPlatforms:
            getPlatforms,

        renderPlatforms:
            renderPlatforms,

        searchPlatforms:
            searchPlatforms

    };


    // ==========================================
    // Debug
    // ==========================================

    console.log(
        "Digiyar App initialized.",
        {
            platforms:
                getPlatforms().length
        }
    );


})(window);


// ==========================================
// Digiyar Main Application 2.2 — END
// ==========================================
