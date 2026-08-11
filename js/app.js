// ==========================================
// Digiyar 2.0 — Main Application
// Version: 2.0
// ==========================================

(function (window) {

    "use strict";


    // ==========================================
    // دریافت عناصر اصلی صفحه
    // ==========================================

    const container =
        document.getElementById("platforms");

    const searchBox =
        document.getElementById("searchBox");


    // ==========================================
    // بررسی وجود Container
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

        /*
         * نسخه جدید:
         * استفاده از DigiyarPlatforms
         */

        if (
            window.DigiyarPlatforms &&
            typeof window.DigiyarPlatforms.getPrepared ===
                "function"
        ) {

            return window.DigiyarPlatforms
                .getPrepared();

        }


        /*
         * سازگاری با نسخه قبلی
         */

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


        /*
         * مهم:
         *
         * لینک افیلیت همیشه اولویت دارد.
         */

        if (
            typeof platform.affiliateUrl === "string" &&
            platform.affiliateUrl.trim() !== ""
        ) {

            return platform.affiliateUrl.trim();

        }


        /*
         * اگر افیلیت موجود نبود،
         * لینک مستقیم استفاده می‌شود.
         */

        if (
            typeof platform.directUrl === "string" &&
            platform.directUrl.trim() !== ""
        ) {

            return platform.directUrl.trim();

        }


        /*
         * سازگاری با ساختار قدیمی
         */

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
        // لوگوی فروشگاه
        // --------------------------------------

        const image =
            document.createElement("img");


        image.src =
            platform.image || "";


        image.alt =
            platform.name || "فروشگاه";


        /*
         * جلوگیری از خراب شدن ظاهر کارت
         * در صورت خراب بودن تصویر
         */

        image.onerror =
            function () {

                image.style.display =
                    "none";

            };


        // --------------------------------------
        // بخش دکمه
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


            /*
             * اطلاعات کمکی برای توسعه آینده
             *
             * این data attributeها بعداً می‌توانند
             * برای Analytics / Tracking استفاده شوند.
             */

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
    // نمایش اولیه
    // ==========================================

    const initialPlatforms =
        getPlatforms();


    renderPlatforms(
        initialPlatforms
    );


    // ==========================================
    // جستجو
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
    // دسترسی عمومی برای توسعه آینده
    // ==========================================

    window.DigiyarApp = {

        version:
            "2.0",

        getPlatforms:
            getPlatforms,

        getPlatformLink:
            getPlatformLink,

        renderPlatforms:
            renderPlatforms,

        searchPlatforms:
            searchPlatforms

    };


})(window);


// ==========================================
// Digiyar Main Application 2.0 — END
// ==========================================
