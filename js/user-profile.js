// ==========================================
// Digiyar 2.0 — Smart User Profile
// Version: 1.0
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

    // شرایط کاربر که در آینده می‌تواند
    // بر اساس دسته محصول فعال شود
    context: {
        home: {},
        vehicle: {},
        lifestyle: {}
    },

    // سابقه تعاملات کاربر با محصولات
    history: {
        viewedProducts: [],
        comparedProducts: [],
        savedProducts: [],
        purchasedProducts: []
    }
};
