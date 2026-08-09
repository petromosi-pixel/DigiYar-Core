// ==========================================
// Digiyar 2.0 — Smart User Profile
// Version: 1.2
// ==========================================

const DigiyarUserProfile = {

    // ------------------------------------------
    // اطلاعاتی که کاربر مستقیماً اعلام می‌کند
    // ------------------------------------------
    declared: {
        budget: null,
        interests: [],
        preferredBrands: [],
        avoidedBrands: [],
        priorities: []
    },

    // ------------------------------------------
    // اطلاعاتی که دیجی‌یار به مرور یاد می‌گیرد
    // ------------------------------------------
    learned: {
        priceSensitivity: null,
        qualitySensitivity: null,
        brandPreference: {},
        categoryPreference: {},
        featurePreference: {}
    },

    // ------------------------------------------
    // شرایط کاربر
    // ------------------------------------------
    context: {
        home: {},
        vehicle: {},
        lifestyle: {}
    },

    // ------------------------------------------
    // سابقه تعاملات کاربر
    // ------------------------------------------
    history: {
        viewedProducts: [],
        comparedProducts: [],
        savedProducts: [],
        purchasedProducts: []
    },

    // ------------------------------------------
    // دریافت یک نسخه مستقل از پروفایل
    // ------------------------------------------
    getProfile() {

        return JSON.parse(
            JSON.stringify({
                declared: this.declared,
                learned: this.learned,
                context: this.context,
                history: this.history
            })
        );
    },

    // ------------------------------------------
    // به‌روزرسانی یک بخش از پروفایل
    // ------------------------------------------
    updateProfile(section, data) {

        if (!Object.prototype.hasOwnProperty.call(this, section)) {

            console.warn(
                `DigiyarUserProfile: بخش "${section}" وجود ندارد.`
            );

            return false;
        }

        if (
            typeof this[section] !== "object" ||
            this[section] === null ||
            Array.isArray(this[section]) ||
            typeof data !== "object" ||
            data === null ||
            Array.isArray(data)
        ) {

            console.warn(
                `DigiyarUserProfile: داده نامعتبر برای "${section}".`
            );

            return false;
        }

        this[section] = {
            ...this[section],
            ...data
        };

        // ذخیره خودکار بعد از هر تغییر
        return this.saveProfile();
    },

    // ------------------------------------------
    // ذخیره پروفایل روی دستگاه
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

            // اگر پروفایلی ذخیره نشده باشد
            if (!savedProfile) {
                return false;
            }

            const profile =
                JSON.parse(savedProfile);

            // بررسی ساختار داده قبل از اعمال آن
            if (
                !profile ||
                typeof profile !== "object"
            ) {
                return false;
            }

            if (
                profile.declared &&
                typeof profile.declared === "object"
            ) {
                this.declared = {
                    ...this.declared,
                    ...profile.declared
                };
            }

            if (
                profile.learned &&
                typeof profile.learned === "object"
            ) {
                this.learned = {
                    ...this.learned,
                    ...profile.learned
                };
            }

            if (
                profile.context &&
                typeof profile.context === "object"
            ) {
                this.context = {
                    ...this.context,
                    ...profile.context
                };
            }

            if (
                profile.history &&
                typeof profile.history === "object"
            ) {
                this.history = {
                    ...this.history,
                    ...profile.history
                };
            }

            return true;

        } catch (error) {

            console.error(
                "DigiyarUserProfile: خطا در بارگذاری پروفایل.",
                error
            );

            return false;
        }
    },

    // ------------------------------------------
    // پاک کردن کامل پروفایل
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

        // حذف نسخه ذخیره‌شده از دستگاه
        try {

            localStorage.removeItem(
                "digiyar_user_profile"
            );

            return true;

        } catch (error) {

            console.error(
                "DigiyarUserProfile: خطا در حذف پروفایل.",
                error
            );

            return false;
        }
    }
};


// ==========================================
// بارگذاری خودکار پروفایل هنگام اجرای فایل
// ==========================================

DigiyarUserProfile.loadProfile();
