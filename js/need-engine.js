/* DigiYar V4 - Need Engine */

(function () {
  "use strict";


  /* =======================================================
     Helpers
     ======================================================= */

  function toList(value) {

    return Array.isArray(value)
      ? value
      : [];

  }


  /* =======================================================
     Completeness
     ======================================================= */

  function calculateCompleteness(need) {

    const checks = [

      Boolean(
        need.category &&
        need.category !== "general"
      ),

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


    const total =
      checks.length;


    const completed =
      checks.filter(Boolean).length;


    return Math.round(
      (
        completed /
        total
      ) * 100
    );

  }


  /* =======================================================
     Need State
     ======================================================= */

  function updateNeedState(need) {

    /*
     * Need فقط زمانی آماده Recommendation است
     * که completeness به 100 درصد رسیده باشد.
     */

    need.ready =
      need.completeness >= 100;


    need.nextAction =
      need.ready
        ? "retrieve_products"
        : "ask_user";


    return need;

  }


  /* =======================================================
     Public API
     ======================================================= */

  const DigiYarNeedEngine = {

    version:
      "4.0.0-alpha.1",


    /* =====================================================
       Create Need
       ===================================================== */

    createNeed:
      function (profile) {

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
            ).map(
              function (value) {

                return {

                  id:
                    "requirements",

                  value:
                    value

                };

              }
            ),


          constraints:
            toList(
              declared.constraints
            ).map(
              function (value) {

                return {

                  id:
                    "constraints",

                  value:
                    value

                };

              }
            ),


          context: {

            usage:
              declared.usage ||
              ""

          },


          confidence:
            0

        };


        /*
         * Completeness
         */

        need.completeness =
          calculateCompleteness(
            need
          );


        /*
         * Confidence
         */

        need.confidence =
          need.completeness;


        /*
         * V4 State
         */

        updateNeedState(
          need
        );


        return need;

      },


    /* =====================================================
       Build Need From Profile
       ===================================================== */

    buildNeedFromProfile:
      function (profile) {

        return this.createNeed(
          profile
        );

      },


    /* =====================================================
       Readiness
       ===================================================== */

    isReady:
      function (need) {

        return !!(
          need &&
          need.ready === true
        );

      },


    /* =====================================================
       Update State
       ===================================================== */

    updateState:
      function (need) {

        if (
          !need ||
          typeof need !== "object"
        ) {

          return null;

        }


        need.completeness =
          calculateCompleteness(
            need
          );


        need.confidence =
          need.completeness;


        return updateNeedState(
          need
        );

      }

  };


  /* =======================================================
     Browser Export
     ======================================================= */

  window.DigiYarNeedEngine =
    DigiYarNeedEngine;


})();
