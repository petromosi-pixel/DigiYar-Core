// ==========================================
// Digiyar 2.2 — Main Application
// Version: 2.1
// ==========================================
//
// مسئولیت:
// 1. راه‌اندازی رابط کاربری
// 2. نمایش فروشگاه‌ها
// 3. جستجوی فروشگاه‌ها
// 4. مدیریت ورود به فروشگاه
// 5. اتصال Smart Recommendation
//
// ترتیب وابستگی‌ها:
// platforms.js
// user-profile.js
// affiliate-resolver.js
// product-source.js
// need-engine.js
// product-catalog.js
// product-scoring.js
// digiyar-engine.js
// app.js
//
// ==========================================

(function (window, document) {

    "use strict";


    // ==========================================
    // وضعیت برنامه
    // ==========================================

    const DigiyarApp = {

        version: "2.1",

        state: {

            platforms: [],

            filteredPlatforms: [],

            products: [],

            initialized: false

        },


        // ==========================================
        // مقداردهی اولیه
        // ==========================================

        init() {

            try {

                this.loadPlatforms();

                this.bindSearch();

                this.renderPlatforms();

                this.bindSmartRecommendation();

                this.state.initialized = true;

                console.log(
                    "Digiyar App initialized successfully."
                );

            } catch (error) {

                console.error(
                    "Digiyar App initialization error:",
                    error
                );

            }

        },


        // ==========================================
        // دریافت فروشگاه‌ها
        // ==========================================

        loadPlatforms() {

            let platforms = [];


            // --------------------------------------
            // منبع اصلی
            // --------------------------------------

            if (
                window.DigiyarPlatforms &&
                typeof window.DigiyarPlatforms.getPrepared ===
                    "function"
            ) {

                platforms =
                    window.DigiyarPlatforms.getPrepared();

            }


            // --------------------------------------
            // سازگاری با نسخه قدیمی
            // --------------------------------------

            if (
                !Array.isArray(platforms) ||
                platforms.length === 0
            ) {

                if (
                    Array.isArray(
                        window.platforms
                    )
                ) {

                    platforms =
                        window.platforms.slice();

                }

            }


            // --------------------------------------
            // فقط فروشگاه‌های فعال
            // --------------------------------------

            platforms =
                platforms.filter(
                    platform =>
                        platform &&
                        platform.active === true
                );


            // --------------------------------------
            // مرتب‌سازی بر اساس Priority
            // --------------------------------------

            platforms.sort(
                (a, b) => {

                    const priorityA =
                        typeof a.priority === "number"
                            ? a.priority
                            : 999;

                    const priorityB =
                        typeof b.priority === "number"
                            ? b.priority
                            : 999;

                    return priorityA - priorityB;

                }
            );


            this.state.platforms =
                platforms;

            this.state.filteredPlatforms =
                platforms.slice();

        },


        // ==========================================
        // اتصال Search
        // ==========================================

        bindSearch() {

            const searchBox =
                document.getElementById(
                    "searchBox"
                );


            if (!searchBox) {
                return;
            }


            searchBox.addEventListener(
                "input",
                event => {

                    const query =
                        event.target.value
                            .trim()
                            .toLowerCase();


                    if (!query) {

                        this.state.filteredPlatforms =
                            this.state.platforms.slice();

                    } else {

                        this.state.filteredPlatforms =
                            this.state.platforms.filter(
                                platform => {

                                    const name =
                                        String(
                                            platform.name || ""
                                        ).toLowerCase();


                                    const description =
                                        String(
                                            platform.description || ""
                                        ).toLowerCase();


                                    return (
                                        name.includes(query) ||
                                        description.includes(query)
                                    );

                                }
                            );

                    }


                    this.renderPlatforms();

                }
            );

        },


        // ==========================================
        // نمایش فروشگاه‌ها
        // ==========================================

        renderPlatforms() {

            const container =
                document.getElementById(
                    "platforms"
                );


            if (!container) {

                console.warn(
                    "Container #platforms پیدا نشد."
                );

                return;

            }


            container.innerHTML = "";


            const platforms =
                this.state.filteredPlatforms;


            if (
                !Array.isArray(platforms) ||
                platforms.length === 0
            ) {

                container.innerHTML = `
                    <div class="empty-state">
                        فروشگاهی مطابق جستجوی شما پیدا نشد.
                    </div>
                `;

                return;

            }


            platforms.forEach(
                platform => {

                    const card =
                        this.createPlatformCard(
                            platform
                        );


                    if (card) {

                        container.appendChild(
                            card
                        );

                    }

                }
            );

        },


        // ==========================================
        // ساخت کارت فروشگاه
        // ==========================================

        createPlatformCard(platform) {

            if (!platform) {
                return null;
            }


            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "platform-card";


            // --------------------------------------
            // بخش اطلاعات
            // --------------------------------------

            const info =
                document.createElement(
                    "div"
                );


            info.className =
                "platform-info";


            // --------------------------------------
            // لوگو
            // --------------------------------------

            const image =
                document.createElement(
                    "img"
                );


            image.className =
                "platform-logo";


            image.src =
                platform.image || "";


            image.alt =
                platform.name || "فروشگاه";


            image.loading =
                "lazy";


            image.onerror =
                function () {

                    this.style.display =
                        "none";

                };


            // --------------------------------------
            // نام فروشگاه
            // --------------------------------------

            const name =
                document.createElement(
                    "h3"
                );


            name.textContent =
                platform.name || "فروشگاه";


            // --------------------------------------
            // توضیح
            // --------------------------------------

            const description =
                document.createElement(
                    "p"
                );


            description.textContent =
                platform.description || "";


            info.appendChild(
                image
            );


            info.appendChild(
                name
            );


            info.appendChild(
                description
            );


            // --------------------------------------
            // بخش عملیات
            // --------------------------------------

            const actions =
                document.createElement(
                    "div"
                );


            actions.className =
                "platform-actions";


            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "platform-button";


            button.textContent =
                platform.hasAffiliate
                    ? "ورود به فروشگاه"
                    : "به‌زودی";


            if (
                platform.hasAffiliate &&
                platform.link
            ) {

                button.addEventListener(
                    "click",
                    () => {

                        this.openPlatform(
                            platform
                        );

                    }
                );

            } else {

                button.disabled =
                    true;

            }


            actions.appendChild(
                button
            );


            // --------------------------------------
            // ساخت کارت
            // --------------------------------------

            card.appendChild(
                info
            );


            card.appendChild(
                actions
            );


            return card;

        },


        // ==========================================
        // ورود به فروشگاه
        // ==========================================

        openPlatform(platform) {

            if (!platform) {
                return;
            }


            let url = null;


            // --------------------------------------
            // استفاده از Registry
            // --------------------------------------

            if (
                window.DigiyarPlatforms &&
                typeof window.DigiyarPlatforms.getUrl ===
                    "function"
            ) {

                url =
                    window.DigiyarPlatforms.getUrl(
                        platform
                    );

            }


            // --------------------------------------
            // Fallback
            // --------------------------------------

            if (
                !url &&
                typeof platform.link === "string"
            ) {

                url =
                    platform.link;

            }


            if (
                typeof url !== "string" ||
                url.trim() === ""
            ) {

                console.warn(
                    "لینک فروشگاه معتبر نیست."
                );

                return;

            }


            window.location.href =
                url;

        },


        // ==========================================
        // اتصال بخش پیشنهاد هوشمند
        // ==========================================

        bindSmartRecommendation() {

            const section =
                document.getElementById(
                    "smartRecommendation"
                );


            const results =
                document.getElementById(
                    "recommendationResults"
                );


            if (
                !section ||
                !results
            ) {

                return;

            }


            /*
             * در این مرحله محصول واقعی هنوز
             * از Feed/API دریافت نمی‌شود.
             *
             * بنابراین بخش پیشنهاد هوشمند
             * فقط زمانی نمایش داده می‌شود
             * که محصول واقعی به Engine برسد.
             */


            this.tryLoadSmartRecommendations(
                section,
                results
            );

        },


        // ==========================================
        // تلاش برای دریافت پیشنهادها
        // ==========================================

        async tryLoadSmartRecommendations(
            section,
            results
        ) {

            // --------------------------------------
            // بررسی Product Source
            // --------------------------------------

            if (
                !window.DigiyarProductSource ||
                typeof window.DigiyarProductSource.getProducts !==
                    "function"
            ) {

                return;

            }


            try {

                const sourceResult =
                    await window.DigiyarProductSource
                        .getProducts();


                if (
                    !sourceResult ||
                    !sourceResult.success ||
                    !Array.isArray(
                        sourceResult.products
                    ) ||
                    sourceResult.products.length === 0
                ) {

                    /*
                     * فعلاً چیزی نمایش نمی‌دهیم.
                     * چون محصول ساختگی نباید وارد
                     * سیستم شود.
                     */

                    return;

                }


                this.state.products =
                    sourceResult.products;


                this.renderSmartRecommendations(
                    section,
                    results,
                    sourceResult.products
                );


            } catch (error) {

                console.error(
                    "Smart Recommendation error:",
                    error
                );

            }

        },


        // ==========================================
        // نمایش پیشنهادهای هوشمند
        // ==========================================

        renderSmartRecommendations(
            section,
            results,
            products
        ) {

            if (
                !Array.isArray(products) ||
                products.length === 0
            ) {

                return;

            }


            results.innerHTML = "";


            products.forEach(
                product => {

                    const card =
                        this.createProductCard(
                            product
                        );


                    if (card) {

                        results.appendChild(
                            card
                        );

                    }

                }
            );


            if (
                results.children.length > 0
            ) {

                section.hidden =
                    false;

            }

        },


        // ==========================================
        // ساخت کارت Product
        // ==========================================

        createProductCard(product) {

            if (!product) {
                return null;
            }


            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "product-card";


            // --------------------------------------
            // نام
            // --------------------------------------

            const name =
                document.createElement(
                    "h3"
                );


            name.textContent =
                product.name ||
                "محصول";


            // --------------------------------------
            // برند / مدل
            // --------------------------------------

            const meta =
                document.createElement(
                    "p"
                );


            const brand =
                product.brand || "";


            const model =
                product.model || "";


            meta.textContent =
                [brand, model]
                    .filter(Boolean)
                    .join(" ");


            // --------------------------------------
            // قیمت
            // --------------------------------------

            const price =
                document.createElement(
                    "p"
                );


            price.className =
                "product-price";


            if (
                product.price &&
                typeof product.price.current ===
                    "number"
            ) {

                price.textContent =
                    new Intl.NumberFormat(
                        "fa-IR"
                    ).format(
                        product.price.current
                    ) +
                    " ریال";

            } else {

                price.textContent =
                    "قیمت نامشخص";

            }


            // --------------------------------------
            // دکمه خرید
            // --------------------------------------

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "product-button";


            button.textContent =
                "مشاهده و خرید";


            button.addEventListener(
                "click",
                () => {

                    this.openProduct(
                        product
                    );

                }
            );


            card.appendChild(
                name
            );


            if (meta.textContent) {

                card.appendChild(
                    meta
                );

            }


            card.appendChild(
                price
            );


            card.appendChild(
                button
            );


            return card;

        },


        // ==========================================
        // باز کردن Product
        // ==========================================

        openProduct(product) {

            if (!product) {
                return;
            }


            const platform =
                String(
                    product.platform || ""
                )
                .trim()
                .toLowerCase();


            const originalUrl =
                product.url;


            if (
                !originalUrl
            ) {

                console.warn(
                    "URL محصول موجود نیست."
                );

                return;

            }


            // --------------------------------------
            // Affiliate Resolver
            // --------------------------------------

            if (
                window.DigiyarAffiliateResolver &&
                typeof window.DigiyarAffiliateResolver.resolve ===
                    "function"
            ) {

                const resolved =
                    window.DigiyarAffiliateResolver.resolve(
                        platform,
                        originalUrl
                    );


                if (
                    resolved &&
                    resolved.success &&
                    resolved.affiliateUrl
                ) {

                    window.location.href =
                        resolved.affiliateUrl;

                    return;

                }

            }


            // --------------------------------------
            // اگر Affiliate ساخته نشد،
            // مستقیماً به Product برو.
            // --------------------------------------

            window.location.href =
                originalUrl;

        }

    };


    // ==========================================
    // انتشار عمومی
    // ==========================================

    window.DigiyarApp =
        DigiyarApp;


    // ==========================================
    // راه‌اندازی
    // ==========================================

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            function () {

                DigiyarApp.init();

            }
        );

    } else {

        DigiyarApp.init();

    }


})(window, document);


// ==========================================
// Digiyar Main Application 2.1 — END
// ==========================================
