import { useCallback } from "react";
import { I18nManager } from "react-native";
import * as Updates from "expo-updates";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { i18n, LANGUAGE_STORAGE_KEY } from "../i18n";

const RTL_LANGUAGES = ["ar"];

export const useAppLanguage = () => {
  const currentLanguage = i18n.language;
  const isRTL = I18nManager.isRTL;

  const changeLanguage = useCallback(async (langCode) => {
    const shouldBeRTL = RTL_LANGUAGES.includes(langCode);

    // Sauvegarde la préférence avant tout, pour la retrouver après le redémarrage
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, langCode);
    await i18n.changeLanguage(langCode);

    // Si l'orientation RTL/LTR doit changer, il faut forcer + redémarrer l'app
    if (shouldBeRTL !== I18nManager.isRTL) {
      I18nManager.allowRTL(shouldBeRTL);
      I18nManager.forceRTL(shouldBeRTL);

      // Redémarre l'app pour que tout le layout natif applique le nouveau sens
      await Updates.reloadAsync();
    }
  }, []);

  return { currentLanguage, isRTL, changeLanguage };
};
