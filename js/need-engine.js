/* DigiYar V3 - Need Engine */

(function () {
  "use strict";

  function toList(value) {
    return Array.isArray(value) ? value : [];
  }

  function calculateCompleteness(need) {

    const checks = [

      Boolean(need.category),

      Boolean(
        need.budget &&
        need.budget.max
      ),

      toList(
        need.priorities
      ).length > 0,

      Boolean(
        need.context &&
        need.context.usage
      ),

      toList(
        need.requirements
      ).length > 0,

      toList(
        need.constraints
      ).length > 0

    ];

    const total = checks.length;

    const completed =
      checks.filter(Boolean).length;

    return Math.round(
      (completed / total) * 100
    );
  }

  const DigiYarNeedEngine = {

    version: "3.0.0",

    createNeed: function (profile) {

      const declared =
        profile &&
        profile.declared
          ? profile.declared
          : {};

      const need = {

        category:
          declared.category ||
          "general",

        intent:
          "purchase",

        budget:
          declared.budget || {
            min: null,
            max: null
          },

        priorities:
          toList(
            declared.priorities
          ),

        requirements:
          toList(
            declared.requirements
          ).map(function (value) {

            return {
              id: "requirements",
              value: value
            };

          }),

        constraints:
          toList(
            declared.constraints
          ).map(function (value) {

            return {
              id: "constraints",
              value: value
            };

          }),

        context: {

          usage:
            declared.usage || ""

        },

        confidence: 0

      };

      need.completeness =
        calculateCompleteness(
          need
        );

      need.confidence =
        need.completeness;

      return need;
    },

    buildNeedFromProfile:
      function (profile) {

        return this.createNeed(
          profile
        );

      }

  };

  window.DigiYarNeedEngine =
    DigiYarNeedEngine;

})();
