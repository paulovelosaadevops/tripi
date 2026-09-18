import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  "en-US": {
    translation: {
      foundation: {
        ready: "Technical foundation ready.",
      },
    },
  },
  "pt-BR": {
    translation: {
      foundation: {
        ready: "Fundacao tecnica pronta.",
      },
    },
  },
};

const deviceLocale = Localization.getLocales()[0]?.languageTag ?? "pt-BR";

// eslint-disable-next-line import/no-named-as-default-member
i18n.use(initReactI18next).init({
  compatibilityJSON: "v4",
  fallbackLng: "pt-BR",
  interpolation: {
    escapeValue: false,
  },
  lng: deviceLocale.startsWith("en") ? "en-US" : "pt-BR",
  resources,
});

export default i18n;
