import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import fr from "./locales/fr";
import en from "./locales/en";

const SUPPORTED = ["fr", "en"] as const;
export type Lang = (typeof SUPPORTED)[number];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    fallbackLng: "fr",
    supportedLngs: SUPPORTED as unknown as string[],
    nonExplicitSupportedLngs: true, // map "fr-FR" -> "fr", "en-US" -> "en"
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      lookupLocalStorage: "cryptoia-lang",
      caches: ["localStorage"],
    },
    returnNull: false,
  });

// Sync <html lang="..."> on change
i18n.on("languageChanged", (lng) => {
  if (typeof document !== "undefined") {
    document.documentElement.lang = (lng || "fr").split("-")[0];
  }
});

export default i18n;
