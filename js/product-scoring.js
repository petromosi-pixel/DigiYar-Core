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


        // قیمت باید عدد معتبر و مثبت باشد
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


        // بررسی اعتبار حدود بودجه
        if (
            maxBudget !== null &&
            maxBudget !== undefined &&
            (
                typeof maxBudget !== "number" ||
                !Number.isFinite(maxBudget) ||
                maxBudget <= 0
            )
        ) {
            return {
                passed: false,
                score: 0,
                reason:
                    "سقف بودجه معتبر نیست."
            };
        }


        if (
            minBudget !== null &&
            minBudget !== undefined &&
            (
                typeof minBudget !== "number" ||
                !Number.isFinite(minBudget) ||
                minBudget < 0
            )
        ) {
            return {
                passed: false,
                score: 0,
                reason:
                    "حداقل بودجه معتبر نیست."
            };
        }


        // بررسی منطقی بودن بازه
        if (
            minBudget !== null &&
            minBudget !== undefined &&
            maxBudget !== null &&
            maxBudget !== undefined &&
            minBudget > maxBudget
        ) {
            return {
                passed: false,
                score: 0,
                reason:
                    "بازه بودجه نامعتبر است."
            };
        }


        // بدون محدودیت بودجه
        if (
            (maxBudget === null ||
             maxBudget === undefined) &&
            (minBudget === null ||
             minBudget === undefined)
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
            maxBudget !== undefined &&
            price > maxBudget
        ) {
            return {
                passed: false,
                score: 0,
                reason:
                    "قیمت محصول از سقف بودجه کاربر بیشتر است."
            };
        }


        // کمتر از حداقل بودجه
        if (
            minBudget !== null &&
            minBudget !== undefined &&
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


        if (!product) {
            return {
                passed: false,
                reasons: [
                    "Need یا Product معتبر نیست."
                ]
            };
        }


        const reasons = [];


        for (
            const requirement
            of need.requirements
        ) {

            // Requirement نامعتبر
            if (
                !requirement ||
                typeof requirement !== "object"
            ) {
                return {
                    passed: false,
                    reasons: [
                        "یکی از شروط Requirements معتبر نیست."
                    ]
                };
            }


            const key =
                requirement.id;

            const expected =
                requirement.value;


            // شناسه Requirement باید معتبر باشد
            if (
                typeof key !== "string" ||
                key.trim() === ""
            ) {
                return {
                    passed: false,
                    reasons: [
                        "شناسه یکی از Requirements معتبر نیست."
                    ]
                };
            }


            // وجود features الزامی است
            if (
                !product.features ||
                typeof product.features !== "object"
            ) {
                return {
                    passed: false,
                    reasons: [
                        `محصول شرط «${key}» را ندارد.`
                    ]
                };
            }


            // شرط باید دقیقاً برقرار باشد
            if (
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
    isValidOperator(operator) {

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
    // بررسی معتبر بودن مقدار Constraint
    // ------------------------------------------
    isValidConstraintValue(
        operator,
        expected
    ) {

        if (
            expected === null ||
            expected === undefined
        ) {
            return false;
        }


        // مقایسه‌های عددی باید مقدار عددی داشته باشند
        if (
            [
                "lt",
                "lte",
                "gt",
                "gte"
            ].includes(operator)
        ) {
            return (
                typeof expected === "number" &&
                Number.isFinite(expected)
            );
        }


        return true;
    },


    // ------------------------------------------
    // بررسی یک Constraint
    // ------------------------------------------
    evaluateConstraint(
        actual,
        operator,
        expected
    ) {

        if (
            !this.isValidOperator(operator)
        ) {
            return false;
        }


        switch (operator) {

            case "eq":
                return actual === expected;

            case "neq":
                return actual !== expected;

            case "lt":
                return (
                    typeof actual === "number" &&
                    typeof expected === "number" &&
                    Number.isFinite(actual) &&
                    Number.isFinite(expected) &&
                    actual < expected
                );

            case "lte":
                return (
                    typeof actual === "number" &&
                    typeof expected === "number" &&
                    Number.isFinite(actual) &&
                    Number.isFinite(expected) &&
                    actual <= expected
                );

            case "gt":
                return (
                    typeof actual === "number" &&
                    typeof expected === "number" &&
                    Number.isFinite(actual) &&
                    Number.isFinite(expected) &&
                    actual > expected
                );

            case "gte":
                return (
                    typeof actual === "number" &&
                    typeof expected === "number" &&
                    Number.isFinite(actual) &&
                    Number.isFinite(expected) &&
                    actual >= expected
                );

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


        if (!product) {
            return {
                passed: false,
                reasons: [
                    "Need یا Product معتبر نیست."
                ]
            };
        }


        const reasons = [];


        for (
            const constraint
            of need.constraints
        ) {

            // Constraint نامعتبر
            if (
                !constraint ||
                typeof constraint !== "object"
            ) {
                return {
                    passed: false,
                    reasons: [
                        "یکی از محدودیت‌های محصول معتبر نیست."
                    ]
                };
            }


            const key =
                constraint.id;

            const operator =
                constraint.operator;

            const expected =
                constraint.value;


            // ----------------------------------
            // بررسی ID
            // ----------------------------------
            if (
                typeof key !== "string" ||
                key.trim() === ""
            ) {
                return {
                    passed: false,
                    reasons: [
                        "شناسه یکی از محدودیت‌ها معتبر نیست."
                    ]
                };
            }


            // ----------------------------------
            // بررسی Operator
            // ----------------------------------
            if (
                !this.isValidOperator(
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
            // بررسی مقدار مورد انتظار
            // ----------------------------------
            if (
                !this.isValidConstraintValue(
                    operator,
                    expected
                )
            ) {
                return {
                    passed: false,
                    reasons: [
                        `مقدار محدودیت «${key}» معتبر نیست.`
                    ]
                };
            }


            // ----------------------------------
            // بررسی وجود Features
            // ----------------------------------
            if (
                !product.features ||
                typeof product.features !== "object" ||
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
            // بررسی مقدار واقعی
            // ----------------------------------
            if (
                actual === null ||
                actual === undefined
            ) {
                return {
                    passed: false,
                    reasons: [
                        `اطلاعات «${key}» برای بررسی محدودیت محصول موجود نیست.`
                    ]
                };
            }


            // برای مقایسه‌های عددی
            // مقدار واقعی نیز باید عدد معتبر باشد
            if (
                [
                    "lt",
                    "lte",
                    "gt",
                    "gte"
                ].includes(operator)
            ) {

                if (
                    typeof actual !== "number" ||
                    !Number.isFinite(actual)
                ) {
                    return {
                        passed: false,
                        reasons: [
                            `مقدار «${key}» برای بررسی محدودیت معتبر نیست.`
                        ]
                    };
                }
            }


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

                if (
                    typeof priority !== "string" ||
                    priority.trim() === ""
                ) {
                    return;
                }


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
               
