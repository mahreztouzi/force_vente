import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import { I18nManager } from "react-native";

import fr from "./locales/fr.json";
import ar from "./locales/ar.json";

export const LANGUAGE_STORAGE_KEY = "app_language";
const RTL_LANGUAGES = ["ar"];

// ✅ Synchrone — lu depuis le module-level storage (expo-localization)
// Le vrai RTL est appliqué ici, avant tout render natif
const applyRTLFromStorage = () => {
  // MMKVStorage ou expo-secure-store auraient été idéaux (synchrones)
  // mais AsyncStorage est async — on utilise une valeur déjà en mémoire
  // via expo-localization comme fallback initial
  const deviceLocale = Localization.getLocales()[0]?.languageCode;
  const lang = deviceLocale === "ar" ? "ar" : "fr";
  const shouldBeRTL = RTL_LANGUAGES.includes(lang);
  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
  }
};

const initI18n = async () => {
  let savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

  if (!savedLanguage) {
    const deviceLocale = Localization.getLocales()[0]?.languageCode;
    savedLanguage = deviceLocale === "ar" ? "ar" : "fr";
  }

  // ✅ Aussi ici pour le cas où la langue sauvegardée diffère de la locale
  const shouldBeRTL = RTL_LANGUAGES.includes(savedLanguage);
  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
  }

  await i18n.use(initReactI18next).init({
    resources: {
      fr: { translation: fr },
      ar: { translation: ar },
    },
    lng: savedLanguage,
    fallbackLng: "fr",
    interpolation: { escapeValue: false },
    compatibilityJSON: "v3",
  });

  return savedLanguage;
};

export { i18n, initI18n };
