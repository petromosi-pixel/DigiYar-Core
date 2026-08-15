/*
 * DigiYar V4
 * Answer Interpretation Engine
 * Build 4 — Alpha 1
 */

const DigiyarAnswerInterpreter = {

    version: "4.0.0-alpha.1",

    interpret(answer, questionId, context = {}) {

        const text = this.normalize(answer);

        if (!text) {
            return {
                version: this.version,
                questionId,
                understood: false,
                type: "unknown",
                value: null,
                confidence: 0
            };
        }

        switch (questionId) {

            case "budget":
                return this.interpretBudget(text);

            case "category":
                return this.interpretCategory(text);

            case "usage":
                return this.interpretUsage(text);

            default:
                return {
                    version: this.version,
                    questionId,
                    understood: false,
                    type: "unknown",
                    value: text,
                    confidence: 0.2
                };
        }
    },

    normalize(text) {

        return String(text || "")
            .trim()
            .replace(/ي/g, "ی")
            .replace(/ك/g, "ک")
            .replace(/ۀ/g, "ه")
            .replace(/ة/g, "ه")
            .replace(/[‌]/g, " ")
            .replace(/\s+/g, " ");
    },

    toNumber(text) {

        const normalized = String(text)
            .replace(/[۰-۹]/g, d =>
                String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))
            )
            .replace(/[٠-٩]/g, d =>
                String("٠١٢٣٤٥٦٧٨٩".indexOf(d))
            )
            .replace(/,/g, "")
            .replace(/٬/g, "")
            .replace(/٫/g, ".");

        const match = normalized.match(/\d+(?:\.\d+)?/);

        return match ? Number(match[0]) : null;
    },

    interpretBudget(text) {

        const value = this.toNumber(text);

        if (value === null) {
            return {
                version: this.version,
                questionId: "budget",
                understood: false,
                type: "budget",
                value: null,
                confidence: 0
            };
        }

        const lower = text.toLowerCase();

        let amount = value;

        /*
         * تبدیل واحدهای رایج فارسی
         */

        if (
            lower.includes("میلیون") ||
            lower.includes("م")
        ) {
            amount = value * 1000000;
        }

        else if (
            lower.includes("هزار")
        ) {
            amount = value * 1000;
        }

        /*
         * تشخیص بازه
         */

        const numbers = this.extractNumbers(text);

        if (
            numbers.length >= 2 &&
            (
                text.includes("تا") ||
                text.includes("بین") ||
                text.includes("-") ||
                text.includes("الی")
            )
        ) {

            let min = numbers[0];
            let max = numbers[1];

            if (
                lower.includes("میلیون") ||
                lower.includes("م")
            ) {
                min *= 1000000;
                max *= 1000000;
            }

            return {
                version: this.version,
                questionId: "budget",
                understood: true,
                type: "budget",
                value: {
                    min,
                    max,
                    type: "hard_constraint",
                    source: "declared",
                    confidence: 0.97
                },
                confidence: 0.97
            };
        }

        /*
         * «تا ۱۵ میلیون»
         */

        if (
            text.includes("تا") ||
            text.includes("نهایت") ||
            text.includes("حداکثر") ||
            text.includes("بیشتر از این نمی")
        ) {

            return {
                version: this.version,
                questionId: "budget",
                understood: true,
                type: "budget",
                value: {
                    min: null,
                    max: amount,
                    type: "hard_constraint",
                    source: "declared",
                    confidence: 0.98
                },
                confidence: 0.98
            };
        }

        /*
         * بودجه بدون عبارت خاص
         */

        return {
            version: this.version,
            questionId: "budget",
            understood: true,
            type: "budget",
            value: {
                min: null,
                max: amount,
                type: "declared",
                source: "declared",
                confidence: 0.9
            },
            confidence: 0.9
        };
    },

    interpretCategory(text) {

        const lower = text.toLowerCase();

        const categories = [

            {
                value: "mobile",
                keywords: [
                    "گوشی",
                    "موبایل",
                    "تلفن همراه",
                    "اسمارت فون"
                ]
            },

            {
                value: "laptop",
                keywords: [
                    "لپ تاپ",
                    "لپ‌تاپ",
                    "نوت بوک"
                ]
            },

            {
                value: "tablet",
                keywords: [
                    "تبلت"
                ]
            },

            {
                value: "tv",
                keywords: [
                    "تلویزیون",
                    "تلویزیون"
                ]
            },

            {
                value: "headphone",
                keywords: [
                    "هدفون",
                    "هندزفری",
                    "ایرباد"
                ]
            }
        ];

        for (const category of categories) {

            if (
                category.keywords.some(keyword =>
                    lower.includes(keyword)
                )
            ) {

                return {
                    version: this.version,
                    questionId: "category",
                    understood: true,
                    type: "category",
                    value: category.value,
                    confidence: 0.98
                };
            }
        }

        return {
            version: this.version,
            questionId: "category",
            understood: false,
            type: "category",
            value: null,
            confidence: 0
        };
    },

    interpretUsage(text) {

        const lower = text.toLowerCase();

        const usages = [

            {
                value: "photography",
                keywords: [
                    "عکاسی",
                    "عکس",
                    "دوربین",
                    "عکسبرداری"
                ]
            },

            {
                value: "gaming",
                keywords: [
                    "بازی",
                    "گیم",
                    "گیمینگ"
                ]
            },

            {
                value: "work",
                keywords: [
                    "کار",
                    "کاری",
                    "اداری",
                    "دفتر"
                ]
            },

            {
                value: "study",
                keywords: [
                    "درس",
                    "دانشگاه",
                    "تحصیل",
                    "مطالعه"
                ]
            },

            {
                value: "video",
                keywords: [
                    "فیلم",
                    "ویدیو",
                    "تماشای فیلم"
                ]
            }
        ];

        const found = usages.find(usage =>
            usage.keywords.some(keyword =>
                lower.includes(keyword)
            )
        );

        if (found) {

            return {
                version: this.version,
                questionId: "usage",
                understood: true,
                type: "usage",
                value: [found.value],
                confidence: 0.95
            };
        }

        return {
            version: this.version,
            questionId: "usage",
            understood: false,
            type: "usage",
            value: [],
            confidence: 0
        };
    },

    extractNumbers(text) {

        const normalized = String(text)
            .replace(/[۰-۹]/g, d =>
                String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))
            )
            .replace(/[٠-٩]/g, d =>
                String("٠١٢٣٤٥٦٧٨٩".indexOf(d))
            )
            .replace(/,/g, "")
            .replace(/٬/g, "");

        const matches = normalized.match(/\d+(?:\.\d+)?/g);

        return matches
            ? matches.map(Number)
            : [];
    }
};
