// ==========================================
// Digiyar 2.0 — Smart User Profile
// Version: 1.1
// ==========================================

const DigiyarUserProfile = {

    // اطلاعاتی که کاربر مستقیماً اعلام می‌کند
    declared: {
        budget: null,
        interests: [],
        preferredBrands: [],
        avoidedBrands: [],
        priorities: []
    },

    // اطلاعاتی که دیجی‌یار به مرور از رفتار کاربر یاد می‌گیرد
    learned: {
        priceSensitivity: null,
        qualitySensitivity: null,
        brandPreference: {},
        categoryPreference: {},
        featurePreference: {}
    },

    // شرایط کاربر
    context: {
        home: {},
        vehicle: {},
        lifestyle: {}
    },

    // سابقه تعاملات کاربر
    history: {
        viewedProducts: [],
        comparedProducts: [],
        savedProducts: [],
        purchasedProducts: []
    },

    // ------------------------------------------
    // دریافت یک نسخه از پروفایل
    // ------------------------------------------
    getProfile() {
        return JSON.parse(JSON.stringify(this));
    },

    // ------------------------------------------
    // به‌روزرسانی بخش‌های پروفایل
    // ------------------------------------------
    updateProfile(section, data) {

        if (!this.hasOwnProperty(section)) {
            console.warn(`DigiyarUserProfile: بخش "${section}" وجود ندارد.`);
            return false;
        }

        if (
            typeof this[section] !== "object" ||
            Array.isArray(this[section]) ||
            typeof data !== "object" ||
            Array.isArray(data)
        ) {
            console.warn(`DigiyarUserProfile: داده نامعتبر برای "${section}".`);
            return false;
        }

        this[section] = {
            ...this[section],
            ...data
        };

        return true;
    },

    // ------------------------------------------
    // بازنشانی کامل پروفایل
    // ------------------------------------------
    resetProfile() {

        this.declared = {
            budget: null,
            interests: [],
            preferredBrands: [],
            avoidedBrands: [],
            priorities: []
        };

        this.learned = {
            priceSensitivity: null,
            qualitySensitivity: null,
            brandPreference: {},
            categoryPreference: {},
            featurePreference: {}
        };

        this.context = {
            home: {},
            vehicle: {},
            lifestyle: {}
        };

        this.history = {
            viewedProducts: [],
            comparedProducts: [],
            savedProducts: [],
            purchasedProducts: []
        };

        return true;
    }
    // ------------------------------------------
    // ذخیره پروفایل روی دستگاه کاربر
    // ------------------------------------------
    saveProfile() {

        try {
            localStorage.setItem(
                "digiyar_user_profile",
                JSON.stringify(this.getProfile())
            );

            return true;

        } catch (error) {

            console.error(
                "DigiyarUserProfile: خطا در ذخیره پروفایل.",
                error
            );

            return false;
        }
    },

    // ------------------------------------------
    // بارگذاری پروفایل ذخیره‌شده
    // ------------------------------------------
    loadProfile() {

        try {

            const savedProfile =
                localStorage.getItem("digiyar_user_profile");

            if (!savedProfile) {
                return false;
            }

            const profile =
                JSON.parse(savedProfile);

            this.declared = profile.declared || this.declared;
            this.learned = profile.learned || this.learned;
            this.context = profile.context || this.context;
            this.history = profile.history || this.history;

            return true;

        } catch (error) {

            console.error(
                "DigiyarUserProfile: خطا در بارگذاری پروفایل.",
                error
            );

            return false;
        }
    },};

