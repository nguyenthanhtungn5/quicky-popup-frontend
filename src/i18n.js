import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import de from "./i18n/de.json";
import en from "./i18n/en.json";
import vi from "./i18n/vi.json";

i18n.use(initReactI18next).init({
  resources: {
    de: { translation: de },
    en: { translation: en },
    vi: { translation: vi },
  },
  lng: localStorage.getItem("language") || "vi",
  fallbackLng: "vi",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
