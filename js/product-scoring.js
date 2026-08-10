// ==========================================
// Digiyar 2.0 — Smart Product Scoring Engine
// Version: 1.2
// ==========================================

const DigiyarProductScoring = {

    // ------------------------------------------
    // ایجاد نتیجه اولیه امتیازدهی
    // ------------------------------------------
    createScore() {

        return {
            score: 0,
            eligible: false,

            breakdown: {
                budget: 0,
                usage: 0,
                priorities: 0,
                value: 0,
                general: 0
            },

            filters: {
                category: false,
                budget: false,
                requirements: false,
                constraints: false
            },

            reasons: [],
            warnings: []
        };
    },


    // ------------------------------------------
    // بررسی دسته‌بندی
    // ------------------------------------------
    checkCategory(need, product) {

        if (
            !need ||
            !product ||
            !need.category ||
            !product.category
        ) {
            return {
                passed: false,
                reason:
                    "اطلاعات دسته‌بندی Need یا Product موجود نیست."
            };
        }

        if (
            need.category !== product.category
        ) {
            return {
                passed: false,
                reason:
                    "دسته‌بندی محصول با نیاز کاربر مطابقت ندارد."
            };
        }

        return {
            passed: true,
            reason:
                "دسته‌بندی محصول با نیاز کاربر مطابقت دارد."
        };
    },


    // ------------------------------------------
    // بررسی بودجه
    // ------------------------------------------
    checkBudget(need, product) {

        if (
            !need ||
            !need.budget ||
            !product ||
            !product.price
        ) {
            return {
                passed: false,
                score: 0,
                reason:
                    "اطلاعات بودجه یا قیمت محصول موجود نیست."
            };
        }

        const maxBudget =
            need.budget.max;

        const minBudget =
            need.budget.min;

        const price =
            product.price.current;


        if (
            typeof price !== "number" ||
            !Number.isFinite(price) ||
            price <= 0
        ) {
            return {
                passed: false,
                score: 0,
                reason:
                    "قیمت معتبر برای محصول ثبت نشده است."
            };
        }


        // بدون محدودیت بودجه
        if (
            maxBudget === null &&
            minBudget === null
        ) {
            return {
                passed: true,
                score: 100,
                reason:
                    "برای کاربر محدودیت بودجه‌ای تعیین نشده است."
            };
        }


        // بیشتر از سقف بودجه
        if (
            maxBudget !== null &&
            (
                typeof maxBudget !== "number" ||
                !Number.isFinite(maxBudget)
            )
        ) {
            return {
                passed: false,
                score: 0,
                reason:
                    "اطلاعات بودجه یا قیمت محصول موجود نیست."
            };
        }


        // کمتر از حداقل بودجه
        if (
            minBudget !== null &&
            (
                typeof minBudget !== "number" ||
                !Number.isFinite(minBudget)
            )
        ) {
            return {
                passed: false,
                score: 0,
                reason:
                    "اطلاعات بودجه یا قیمت محصول موجود نیست."
            };
        }


        if (
            maxBudget !== null &&
            price > maxBudget
        ) {
            return {
                passed: false,
                score: 0,
                reason:
                    "قیمت محصول از سقف بودجه کاربر بیشتر است."
            };
        }


        if (
            minBudget !== null &&
            price < minBudget
        ) {
            return {
                passed: false,
                score: 0,
                reason:
                    "قیمت محصول از حداقل بودجه تعیین‌شده کمتر است."
            };
        }


        return {
            passed: true,
            score: 100,
            reason:
                "قیمت محصول در محدوده بودجه کاربر قرار دارد."
        };
    },


    // ------------------------------------------
    // بررسی Requirements
    // ------------------------------------------
    checkRequirements(need, product) {

        if (
            !need ||
            !Array.isArray(need.requirements) ||
            need.requirements.length === 0
        ) {
            return {
                passed: true,
                reasons: []
            };
        }


        const reasons = [];


        if (
            !product ||
            !product.features ||
            typeof product.features !== "object"
        ) {
            return {
                passed: false,
                reasons: [
                    `محصول شرط «${need.requirements[0]?.id}» را ندارد.`
                ]
            };
        }


        for (
            const requirement
            of need.requirements
        ) {

            if (!requirement) {
                continue;
            }


            const key =
                requirement.id;

            const expected =
                requirement.value;


            if (
                !key ||
                product.features[key] !== expected
            ) {

                return {
                    passed: false,
                    reasons: [
                        `محصول شرط «${key}» را ندارد.`
                    ]
                };
            }


            reasons.push(
                `محصول شرط «${key}» را دارد.`
            );
        }


        return {
            passed: true,
            reasons: reasons
        };
    },


    // ------------------------------------------
    // بررسی معتبر بودن Operator
    // ------------------------------------------
    isValidConstraintOperator(operator) {

        return [
            "eq",
            "neq",
            "lt",
            "lte",
            "gt",
            "gte"
        ].includes(operator);
    },


    // ------------------------------------------
    // بررسی یک Constraint
    // ------------------------------------------
    evaluateConstraint(
        actual,
        operator,
        expected
    ) {

        switch (operator) {

            case "eq":
                return actual === expected;

            case "neq":
                return actual !== expected;

            case "lt":
                return actual < expected;

            case "lte":
                return actual <= expected;

            case "gt":
                return actual > expected;

            case "gte":
                return actual >= expected;

            default:
                return false;
        }
    },


    // ------------------------------------------
    // بررسی Constraints
    // ------------------------------------------
    checkConstraints(need, product) {

        if (
            !need ||
            !Array.isArray(need.constraints) ||
            need.constraints.length === 0
        ) {
            return {
                passed: true,
                reasons: []
            };
        }


        const reasons = [];


        if (
            !product ||
            !product.features ||
            typeof product.features !== "object"
        ) {

            return {
                passed: false,
                reasons: [
                    "اطلاعات ویژگی‌های محصول برای بررسی محدودیت‌ها موجود نیست."
                ]
            };
        }


        for (
            const constraint
            of need.constraints
        ) {

            if (!constraint) {
                continue;
            }


            const key =
                constraint.id;

            const operator =
                constraint.operator;

            const expected =
                constraint.value;


            // ----------------------------------
            // شناسه Constraint
            // ----------------------------------
            if (!key) {

                return {
                    passed: false,
                    reasons: [
                        "شناسه محدودیت محصول معتبر نیست."
                    ]
                };
            }


            // ----------------------------------
            // Operator
            // ----------------------------------
            if (
                !this.isValidConstraintOperator(
                    operator
                )
            ) {

                return {
                    passed: false,
                    reasons: [
                        `عملگر «${operator}» برای محدودیت «${key}» معتبر نیست.`
                    ]
                };
            }


            // ----------------------------------
            // وجود Feature
            // ----------------------------------
            if (
                !Object.prototype.hasOwnProperty.call(
                    product.features,
                    key
                )
            ) {

                return {
                    passed: false,
                    reasons: [
                        `اطلاعات «${key}» برای بررسی محدودیت محصول موجود نیست.`
                    ]
                };
            }


            const actual =
                product.features[key];


            // ----------------------------------
            // جلوگیری از مقایسه عددی
            // با مقدار غیرعددی
            // ----------------------------------
            const numericOperators = [
                "lt",
                "lte",
                "gt",
                "gte"
            ];


            if (
                numericOperators.includes(
                    operator
                ) &&
                (
                    typeof actual !== "number" ||
                    !Number.isFinite(actual) ||
                    typeof expected !== "number" ||
                    !Number.isFinite(expected)
                )
            ) {

                return {
                    passed: false,
                    reasons: [
                        `محصول با محدودیت «${key}» سازگار نیست.`
                    ]
                };
            }


            // ----------------------------------
            // بررسی Constraint
            // ----------------------------------
            const passed =
                this.evaluateConstraint(
                    actual,
                    operator,
                    expected
                );


            if (!passed) {

                return {
                    passed: false,
                    reasons: [
                        `محصول با محدودیت «${key}» سازگار نیست.`
                    ]
                };
            }


            reasons.push(
                `محصول محدودیت «${key}» را رعایت می‌کند.`
            );
        }


        return {
            passed: true,
            reasons: reasons
        };
    },


    // ------------------------------------------
    // امتیاز کاربرد
    // ------------------------------------------
    calculateUsageScore(need, product) {

        if (
            !need ||
            !need.context ||
            !need.context.usage
        ) {
            return 50;
        }


        const usage =
            need.context.usage;


        if (
            !product ||
            !product.usageScores ||
            typeof product.usageScores !== "object"
        ) {
            return 50;
        }


        if (
            typeof product.usageScores[usage]
            !== "number"
        ) {
            return 50;
        }


        return this.normalizeScore(
            product.usageScores[usage]
        );
    },


    // ------------------------------------------
    // امتیاز اولویت‌ها
    // ------------------------------------------
    calculatePriorityScore(need, product) {

        if (
            !need ||
            !Array.isArray(need.priorities) ||
            need.priorities.length === 0
        ) {
            return 50;
        }


        if (
            !product ||
            !product.scores ||
            typeof product.scores !== "object"
        ) {
            return 50;
        }


        let total = 0;
        let weightTotal = 0;


        const weights = [
            1.0,
            0.625,
            0.375
        ];


        need.priorities.forEach(
            (priority, index) => {

                const value =
                    product.scores[priority];


                if (
                    typeof value !== "number" ||
                    !Number.isFinite(value)
                ) {
                    return;
                }


                const weight =
                    weights[index] || 0.25;


                total +=
                    this.normalizeScore(value)
                    * weight;

                weightTotal += weight;
            }
        );


        if (weightTotal === 0) {
            return 50;
        }


        return Math.round(
            total / weightTotal
        );
    },


    // ------------------------------------------
    // امتیاز ارزش خرید
    // ------------------------------------------
    calculateValueScore(product) {

        if (
            !product ||
            !product.scores ||
            typeof product.scores.value !== "number" ||
            !Number.isFinite(
                product.scores.value
            )
        ) {
            return 50;
        }


        return this.normalizeScore(
            product.scores.value
        );
    },


    // ------------------------------------------
    // امتیاز عمومی محصول
    // ------------------------------------------
    calculateGeneralScore(product) {

        if (
            !product ||
            !product.scores ||
            typeof product.scores !== "object"
        ) {
            return 50;
        }


        const values = [];


        [
            "performance",
            "display",
            "battery"
        ].forEach(key => {

            if (
                typeof product.scores[key]
                === "number" &&
                Number.isFinite(
                    product.scores[key]
                )
            ) {

                values.push(
                    this.normalizeScore(
                        product.scores[key]
                    )
                );
            }

        });


        if (values.length === 0) {
            return 50;
        }


        return Math.round(
            values.reduce(
                (sum, value) =>
                    sum + value,
                0
            ) / values.length
        );
    },


    // ------------------------------------------
    // محاسبه امتیاز نهایی
    // ------------------------------------------
    calculateFinalScore(
        usageScore,
        priorityScore,
        valueScore,
        generalScore
    ) {

        const score =
            (
                usageScore * 0.25
            ) +
            (
                priorityScore * 0.45
            ) +
            (
                valueScore * 0.20
            ) +
            (
                generalScore * 0.10
            );


        return Math.round(
            this.normalizeScore(score)
        );
    },


    // ------------------------------------------
    // امتیازدهی کامل یک محصول
    // ------------------------------------------
    scoreProduct(need, product) {

        const result =
            this.createScore();


        // --------------------------------------
        // اعتبارسنجی اولیه
        // --------------------------------------
        if (
            !need ||
            !product ||
            typeof need !== "object" ||
            typeof product !== "object"
        ) {

            result.warnings.push(
                "Need یا Product معتبر نیست."
            );

            return result;
        }


        // --------------------------------------
        // بررسی دسته‌بندی
        // --------------------------------------
        const category =
            this.checkCategory(
                need,
                product
            );


        if (!category.passed) {

            result.warnings.push(
                category.reason
            );

            return result;
        }


        result.filters.category = true;

        result.reasons.push(
            category.reason
        );


        // --------------------------------------
        // بررسی بودجه
        // --------------------------------------
        const budget =
            this.checkBudget(
                need,
                product
            );


        if (!budget.passed) {

            result.warnings.push(
                budget.reason
            );

            return result;
        }


        result.breakdown.budget =
            budget.score;

        result.filters.budget = true;

        result.reasons.push(
            budget.reason
        );


        // --------------------------------------
        // بررسی Requirements
        // --------------------------------------
        const requirements =
            this.checkRequirements(
                need,
                product
            );


        if (!requirements.passed) {

            result.warnings.push(
                ...requirements.reasons
            );

            return result;
        }


        result.filters.requirements = true;

        result.reasons.push(
            ...requirements.reasons
        );


        // --------------------------------------
        // بررسی Constraints
        // --------------------------------------
        const constraints =
            this.checkConstraints(
                need,
                product
            );


        if (!constraints.passed) {

            result.warnings.push(
                ...constraints.reasons
            );

            return result;
        }


        result.filters.constraints = true;

        result.reasons.push(
            ...constraints.reasons
        );


        // --------------------------------------
        // محاسبه امتیازها
        // --------------------------------------
        const usageScore =
            this.calculateUsageScore(
                need,
                product
            );


        const priorityScore =
            this.calculatePriorityScore(
                need,
                product
            );


        const valueScore =
            this.calculateValueScore(
                product
            );


        const generalScore =
            this.calculateGeneralScore(
                product
            );


        result.breakdown.usage =
            usageScore;

        result.breakdown.priorities =
            priorityScore;

        result.breakdown.value =
            valueScore;

        result.breakdown.general =
            generalScore;


        result.score =
            this.calculateFinalScore(
                usageScore,
                priorityScore,
                valueScore,
                generalScore
            );


        result.eligible = true;


        return result;
    },


    // ------------------------------------------
    // رتبه‌بندی محصولات
    // ------------------------------------------
    rankProducts(need, products) {

        if (
            !Array.isArray(products)
        ) {
            return {
                eligibleProducts: [],
                rejectedProducts: []
            };
        }


        const scoredProducts =
            products.map(product => {

                let result;


      
