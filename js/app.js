// ==========================================
// Digiyar 2.2 — Main Application
// Version: 2.2
// ==========================================

(function (window, document) {

    "use strict";


    const DigiyarApp = {

        version: "2.2",

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


            if (
                window.DigiyarPlatforms &&
                typeof window.DigiyarPlatforms.getPrepared ===
                    "function"
            ) {

                platforms =
                    window.DigiyarPlatforms.getPrepared();

            }


            if (
                !Array.isArray(platforms) ||
                platforms.length === 0
            ) {

                if (
                    Array.isArray(window.platforms)
                ) {

                    platforms =
                        window.platforms.slice();

                }

            }


            platforms =
                platforms.filter(
                    platform =>
                        platform &&
                        platform.active === true
                );


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
        // جستجوی فروشگاه
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
                    <div class="no-results">
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


            // ======================================
            // دکمه
            // ======================================

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

            /*
             * مهم:
             * CSS دقیقاً همین کلاس را استایل می‌کند.
             */
            button.className =
                platform.hasAffiliate
                    ? "platform-btn"
                    : "coming-soon";


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


            // ======================================
            // اطلاعات فروشگاه
            // ======================================

            const info =
                document.createElement(
                    "div"
                );

            info.className =
                "platform-info";


            const name =
                document.createElement(
                    "h3"
                );

            name.textContent =
                platform.name ||
                "فروشگاه";


            const description =
                document.createElement(
                    "p"
                );

            description.textContent =
                platform.description ||
                "";


            info.appendChild(
                name
            );

            info.appendChild(
                description
            );


            // ======================================
            // لوگو
            // ======================================

            const image =
                document.createElement(
                    "img"
                );

            image.className =
                "platform-logo";


            image.src =
                platform.image || "";


            image.alt =
                platform.name ||
                "لوگوی فروشگاه";


            image.loading =
                "lazy";


            image.onerror =
                function () {

                    this.style.display =
                        "none";

                };


            // ======================================
            // ترتیب نهایی کارت
            //
            // دکمه ← اطلاعات ← لوگو
            // ======================================

            card.appendChild(
                actions
            );

            card.appendChild(
                info
            );

            card.appendChild(
                image
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
        // اتصال پیشنهاد هوشمند
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


            this.tryLoadSmartRecommendations(
                section,
                results
            );

        },


        // ==========================================
        // دریافت پیشنهادها
        // ==========================================

        async tryLoadSmartRecommendations(
            section,
            results
        ) {

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
        // نمایش پیشنهادها
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
        // ساخت کارت محصول
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


            const name =
                document.createElement(
                    "h3"
                );

            name.textContent =
                product.name ||
                "محصول";


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


            if (
                meta.textContent
            ) {

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
        // باز کردن محصول با Affiliate
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


            if (!originalUrl) {

                console.warn(
                    "URL محصول موجود نیست."
                );

                return;

            }


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
// Digiyar Main Application 2.2 — END
// ==========================================
