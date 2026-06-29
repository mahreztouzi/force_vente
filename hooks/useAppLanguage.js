import { useCallback } from "react";
import { I18nManager } from "react-native";
import * as Updates from "expo-updates";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { i18n, LANGUAGE_STORAGE_KEY } from "../i18n";

const RTL_LANGUAGES = ["ar"];

export const useAppLanguage = () => {
  const currentLanguage = i18n.language; // ex: "ar" ou "fr"
  const isRTL = I18nManager.isRTL;

  const changeLanguage = useCallback(
    async (langCode) => {
      // 1. On vérifie si la nouvelle langue demande un changement de sens par rapport à l'actuelle
      const isCurrentAr = currentLanguage === "ar";
      const isNewAr = langCode === "ar";

      // On doit recharger uniquement si on passe de FR->AR ou de AR->FR
      const directionChanged = isCurrentAr !== isNewAr;

      const shouldBeRTL = RTL_LANGUAGES.includes(langCode);

      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, langCode);
      await i18n.changeLanguage(langCode);

      if (directionChanged) {
        I18nManager.allowRTL(shouldBeRTL);
        I18nManager.forceRTL(shouldBeRTL);

        // Se déclenchera TOUJOURS, dans les deux sens !
        await Updates.reloadAsync();
      }
    },
    [currentLanguage],
  ); // Important d'ajouter currentLanguage ici

  return { currentLanguage, isRTL, changeLanguage };
};
