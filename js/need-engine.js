// ==========================================
// Digiyar 2.0 — Smart Need Engine
// Version: 1.1
// ==========================================

const DigiyarNeedEngine = {

    // ------------------------------------------
    // ساخت یک نیاز خرید جدید
    // ------------------------------------------
    createNeed(data = {}) {

        return {
            category: data.category || null,

            intent: data.intent || "purchase",

            budget: {
                min: data.budget?.min ?? null,
                max: data.budget?.max ?? null
            },

            priorities: Array.isArray(data.priorities)
                ? [...data.priorities]
                : [],

            requirements: Array.isArray(data.requirements)
                ? [...data.requirements]
                : [],

            constraints: Array.isArray(data.constraints)
                ? [...data.constraints]
                : [],

            context: data.context
                ? { ...data.context }
                : {},

            confidence: typeof data.confidence === "number"
                ? data.confidence
                : 0
        };
    },

    // ------------------------------------------
    // ساخت نیاز اولیه با استفاده از پروفایل کاربر
    // ------------------------------------------
    buildNeedFromProfile(category, profile = null) {

        if (!category) {
            return null;
        }

        // اگر پروفایل مستقیماً ارسال نشده باشد،
        // از پروفایل فعلی دیجی‌یار استفاده می‌کنیم.
        if (!profile) {

            if (
                typeof DigiyarUserProfile !== "undefined" &&
                typeof DigiyarUserProfile.getProfile === "function"
            ) {
                profile =
                    DigiyarUserProfile.getProfile();
            }
        }

        profile = profile || {};

        const declared =
            profile.declared || {};

        const context =
            profile.context || {};

        // ایجاد نیاز اولیه
        const need = this.createNeed({
            category: category
        });

        // --------------------------------------
        // انتقال بودجه
        // --------------------------------------

        if (declared.budget !== null &&
            typeof declared.budget === "number") {

            need.budget.max =
                declared.budget;
        }

        // --------------------------------------
        // انتقال اولویت‌های کاربر
        // --------------------------------------

        if (Array.isArray(declared.priorities)) {

            need.priorities = [
                ...declared.priorities
            ];
        }

        // --------------------------------------
        // انتقال شرایط مرتبط با کاربر
        // --------------------------------------

        if (context &&
            typeof context === "object") {

            need.context = {
                ...context
            };
        }

        // --------------------------------------
        // تعیین میزان اطمینان اولیه
        // --------------------------------------

        let knownFields = 0;
        let totalFields = 3;

        if (need.budget.max !== null) {
            knownFields++;
        }

        if (need.priorities.length > 0) {
            knownFields++;
        }

        if (Object.keys(need.context).length > 0) {
            knownFields++;
        }

        need.confidence =
            Math.round(
                (knownFields / totalFields) * 100
            );

        return need;
    },

    // ------------------------------------------
    // تعیین سؤال‌های موردنیاز برای یک دسته
    // ------------------------------------------
    getQuestions(category) {

        const questionBank = {

            mobile: [
                {
                    id: "budget",
                    question: "بودجه تقریبی شما چقدر است؟",
                    type: "budget"
                },
                {
                    id: "usage",
                    question: "مهم‌ترین کاربرد گوشی برای شما چیست؟",
                    type: "choice",
                    options: [
                        "عکاسی",
                        "بازی",
                        "کار و استفاده روزمره",
                        "تماشای محتوا"
                    ]
                },
                {
                    id: "priorities",
                    question: "کدام ویژگی برای شما مهم‌تر است؟",
                    type: "multiple",
                    options: [
                        "دوربین",
                        "باتری",
                        "قدرت پردازنده",
                        "صفحه‌نمایش",
                        "حافظه",
                        "ارزش خرید"
                    ]
                }
            ],

            "car-vacuum": [
                {
                    id: "budget",
                    question: "بودجه تقریبی شما چقدر است؟",
                    type: "budget"
                },
                {
                    id: "usage",
                    question: "جاروبرقی را بیشتر برای چه کاری می‌خواهید؟",
                    type: "choice",
                    options: [
                        "تمیزکاری خودرو",
                        "مصارف خانه و خودرو",
                        "استفاده حرفه‌ای"
                    ]
                },
                {
                    id: "priorities",
                    question: "کدام ویژگی برای شما مهم‌تر است؟",
                    type: "multiple",
                    options: [
                        "قدرت مکش",
                        "وزن کم",
                        "ابعاد کوچک",
                        "باتری",
                        "ارزش خرید"
                    ]
                }
            ]

        };

        return questionBank[category] || [];
    },

    // ------------------------------------------
    // اضافه‌کردن پاسخ به نیاز خرید
    // ------------------------------------------
    addAnswer(need, questionId, answer) {

        if (!need || !questionId) {
            return false;
        }

        switch (questionId) {

            case "budget":

                if (
                    answer &&
                    typeof answer === "object"
                ) {

                    need.budget = {
                        min: answer.min ?? null,
                        max: answer.max ?? null
                    };

                } else if (
                    typeof answer === "number"
                ) {

                    need.budget.max = answer;
                }

                break;

            case "usage":

                need.context = {
                    ...need.context,
                    usage: answer
                };

                break;

            case "priorities":

                need.priorities =
                    Array.isArray(answer)
                        ? [...answer]
                        : [answer];

                break;

            default:

                need.requirements.push({
                    id: questionId,
                    value: answer
                });
        }

        return true;
    },

    // ------------------------------------------
    // محاسبه میزان کامل‌بودن نیاز
    // ------------------------------------------
    getCompleteness(need) {

        if (!need) {
            return 0;
        }

        let score = 0;
        let total = 0;

        // دسته محصول
        total++;

        if (need.category) {
            score++;
        }

        // بودجه
        total++;

        if (
            need.budget.min !== null ||
            need.budget.max !== null
        ) {
            score++;
        }

        // اولویت‌ها
        total++;

        if (need.priorities.length > 0) {
            score++;
        }

        // شرایط استفاده
        total++;

        if (
            need.context &&
            Object.keys(need.context).length > 0
        ) {
            score++;
        }

        return Math.round(
            (score / total) * 100
        );
    },

    // ------------------------------------------
    // بررسی آماده‌بودن نیاز برای پیشنهاد محصول
    // ------------------------------------------
    isReady(need) {

        return this.getCompleteness(need) >= 75;
    }
};
