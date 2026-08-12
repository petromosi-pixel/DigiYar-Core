/* DigiYar V3 - Smart User Profile */

(function () {
  "use strict";

  const STORAGE_KEY = "digiyar_v3_profile";

  function cleanArray(value) {
    if (Array.isArray(value)) {
      return value
        .map(String)
        .map(function (item) {
          return item.trim();
        })
        .filter(Boolean);
    }

    return String(value || "")
      .split(/[،,]/)
      .map(function (item) {
        return item.trim();
      })
      .filter(Boolean);
  }

  const DigiYarUserProfile = {

    version: "3.0.0",

    save: function (data) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
      );

      return data;
    },

    load: function () {
      try {
        return JSON.parse(
          localStorage.getItem(STORAGE_KEY) || "null"
        );
      } catch (error) {
        return null;
      }
    },

    clear: function () {
      localStorage.removeItem(STORAGE_KEY);
    },

    getProfile: function () {
      return this.load();
    },

    normalize: function (form) {

      return {
        declared: {

          category: form.category || "general",

          budget: {
            min: null,
            max: Number(form.budgetMax) || null
          },

          priorities: cleanArray(
            form.priorities
          ),

          usage: String(
            form.usage || ""
          ).trim(),

          requirements: cleanArray(
            form.requirements
          ),

          constraints: cleanArray(
            form.constraints
          )
        },

        learned: {},

        context: {},

        history: [],

        version: "3.0.0"
      };
    }
  };

  window.DigiYarUserProfile =
    DigiYarUserProfile;

})();
