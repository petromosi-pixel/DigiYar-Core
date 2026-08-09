// ==========================================
// Digiyar 2.0 — Smart Need Engine
// Version: 1.2
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

            confidence:
                typeof data.confidence === "number"
                    ? data.confidence
                    : 0
        };
    },


    // ------------------------------------------
    // بررسی اینکه یک مقدار واقعاً اطلاعات دارد
    // ------------------------------------------
    hasMeaningfulValue(value) {

        if (value === null || value === undefined) {
            return false;
        }

        if (typeof value === "string") {
            return value.trim().length > 0;
        }

        if (typeof value === "number") {
            return !Number.isNaN(value);
        }

        if (typeof value === "boolean") {
            return true;
        }

        if (Array.isArray(value)) {
            return value.length > 0;
        }

        if (typeof value === "object") {

            return Object.keys(value).some(
                key =>
                    this.hasMeaningfulValue(value[key])
            );
        }

        return false;
    },


    // ------------------------------------------
    // ساخت نیاز اولیه از پروفایل کاربر
    // ------------------------------------------
    buildNeedFromProfile(category, profile = null) {

        if (!category) {
            return null;
        }


        // --------------------------------------
        // دریافت پروفایل فعلی دیجی‌یار
        // --------------------------------------

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

        const learned =
            profile.learned || {};

        const context =
            profile.context || {};


        // --------------------------------------
        // ایجاد نیاز اولیه
        // --------------------------------------

        const need =
            this.createNeed({
                category: category
            });


        // --------------------------------------
        // انتقال بودجه
        // --------------------------------------

        if (
            typeof declared.budget === "number" &&
            !Number.isNaN(declared.budget)
        ) {

            need.budget.max =
                declared.budget;
        }


        // --------------------------------------
        // انتقال اولویت‌ها
        // --------------------------------------

        if (
            Array.isArray(declared.priorities)
        ) {

            need.priorities = [
                ...declared.priorities
            ];
        }


        // --------------------------------------
        // انتقال Context فقط در صورت وجود
        // اطلاعات واقعی
        // --------------------------------------

        if (
            context &&
            typeof context === "object"
        ) {

            const meaningfulContext = {};

            Object.keys(context).forEach(key => {

                if (
                    this.hasMeaningfulValue(
                        context[key]
                    )
                ) {

                    meaningfulContext[key] =
                        context[key];
                }

            });


            need.context =
                meaningfulContext;
        }


        // --------------------------------------
        // انتقال اطلاعات یادگرفته‌شده مرتبط
        // --------------------------------------

        if (
            learned &&
            typeof learned === "object"
        ) {

            const meaningfulLearned = {};

            Object.keys(learned).forEach(key => {

                if (
                    this.hasMeaningfulValue(
                        learned[key]
                    )
                ) {

                    meaningfulLearned[key] =
                        learned[key];
                }

            });


            if (
                Object.keys(meaningfulLearned)
                    .length > 0
            ) {

                need.context.learned =
                    meaningfulLearned;
            }
        }


        // --------------------------------------
        // محاسبه اعتماد واقعی
        // --------------------------------------

        need.confidence =
            this.calculateConfidence(need);


        return need;
    },


    // ------------------------------------------
    // محاسبه Confidence
    // ------------------------------------------
    calculateConfidence(need) {

        if (!need) {
            return 0;
        }


        let score = 0;


        // بودجه — 30 امتیاز
        if (
            need.budget &&
            (
                need.budget.min !== null ||
                need.budget.max !== null
            )
        ) {

            score += 30;
        }


        // اولویت‌ها — 25 امتیاز
        if (
            Array.isArray(need.priorities) &&
            need.priorities.length > 0
        ) {

            score += 25;
        }


        // کاربرد — 20 امتیاز
        if (
            need.context &&
            this.hasMeaningfulValue(
                need.context.usage
            )
        ) {

            score += 20;
        }


        // الزامات — 15 امتیاز
        if (
            Array.isArray(need.requirements) &&
            need.requirements.length > 0
        ) {

            score += 15;
        }


        // محدودیت‌ها — 10 امتیاز
        if (
            Array.isArray(need.constraints) &&
            need.constraints.length > 0
        ) {

            score += 10;
        }


        return Math.min(100, score);
    },


    // ------------------------------------------
    // تعیین سؤال‌های موردنیاز برای یک دسته
    // ------------------------------------------
    getQuestions(category) {

        const questionBank = {

            mobile: [

                {
                    id: "budget",
                    question:
                        "بودجه تقریبی شما چقدر است؟",
                    type: "budget"
                },

                {
                    id: "usage",
                    question:
                        "مهم‌ترین کاربرد گوشی برای شما چیست؟",
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
                    question:
                        "کدام ویژگی برای شما مهم‌تر است؟",
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
                    question:
                        "بودجه تقریبی شما چقدر است؟",
                    type: "budget"
                },

                {
                    id: "usage",
                    question:
                        "جاروبرقی را بیشتر برای چه کاری می‌خواهید؟",
                    type: "choice",

                    options: [
                        "تمیزکاری خودرو",
                        "مصارف خانه و خودرو",
                        "استفاده حرفه‌ای"
                    ]
                },

                {
                    id: "priorities",
                    question:
                        "کدام ویژگی برای شما مهم‌تر است؟",
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
// اضافه کردن پاسخ به نیاز
// ------------------------------------------
addAnswer(need, questionId, answer) {

    if (!need || !questionId) {
        return false;
    }


    switch (questionId) {

        // --------------------------------------
        // بودجه
        // --------------------------------------

        case "budget":

            if (
                answer &&
                typeof answer === "object" &&
                !Array.isArray(answer)
            ) {

                need.budget = {

                    min:
                        answer.min ?? null,

                    max:
                        answer.max ?? null

                };

            } else if (
                typeof answer === "number" &&
                !Number.isNaN(answer)
            ) {

                need.budget.max =
                    answer;
            }

            break;


        // --------------------------------------
        // کاربرد
        // --------------------------------------

        case "usage":

            if (
                this.hasMeaningfulValue(answer)
            ) {

                need.context = {

                    ...need.context,

                    usage: answer

                };

            }

            break;


        // --------------------------------------
        // اولویت‌ها
        // --------------------------------------

        case "priorities":

            if (Array.isArray(answer)) {

                need.priorities =
                    [...answer];

            } else if (
                this.hasMeaningfulValue(answer)
            ) {

                need.priorities = [
                    answer
                ];
            }

            break;


        // --------------------------------------
        // الزامات
        // --------------------------------------

        case "requirements":

            if (
                this.hasMeaningfulValue(answer)
            ) {

                need.requirements.push({

                    id:
                        questionId,

                    value:
                        answer

                });

            }

            break;


        // --------------------------------------
        // محدودیت‌ها
        // --------------------------------------

        case "constraints":

            if (
                this.hasMeaningfulValue(answer)
            ) {

                need.constraints.push({

                    id:
                        questionId,

                    value:
                        answer

                });

            }

            break;


        // --------------------------------------
        // سؤال ناشناخته
        // --------------------------------------

        default:

            if (
                this.hasMeaningfulValue(answer)
            ) {

                need.requirements.push({

                    id:
                        questionId,

                    value:
                        answer

                });

            }

            break;
    }


    // --------------------------------------
    // محاسبه مجدد Confidence
    // --------------------------------------

    need.confidence =
        this.calculateConfidence(need);


    return true;
},


    // ------------------------------------------
    // محاسبه کامل‌بودن نیاز
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
            need.budget &&
            (
                need.budget.min !== null ||
                need.budget.max !== null
            )
        ) {

            score++;
        }


        // اولویت‌ها
        total++;

        if (
            Array.isArray(need.priorities) &&
            need.priorities.length > 0
        ) {

            score++;
        }


        // شرایط استفاده
        total++;

        if (
            need.context &&
            this.hasMeaningfulValue(
                need.context
            )
        ) {

            score++;
        }


        return Math.round(
            (score / total) * 100
        );
    },


    // ------------------------------------------
    // بررسی آماده بودن نیاز
    // ------------------------------------------
    isReady(need) {

        return this.getCompleteness(need) >= 75;
    }

};
