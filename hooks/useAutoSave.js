import { useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Hook personnalisé pour la sauvegarde automatique
const useAutoSave = (key, data, delay = 2000) => {
  const timeoutRef = useRef(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Ne pas sauvegarder au premier rendu
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Annuler la sauvegarde précédente si elle existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Programmer une nouvelle sauvegarde avec délai
    timeoutRef.current = setTimeout(async () => {
      try {
        await AsyncStorage.setItem(key, JSON.stringify(data));
        console.log(`Données sauvegardées automatiquement: ${key}`);
      } catch (error) {
        console.error("Erreur lors de la sauvegarde automatique:", error);
      }
    }, delay);

    // Nettoyer le timeout lors du démontage
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [key, data, delay]);

  // Fonction pour forcer la sauvegarde immédiate
  const forceSave = async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
      console.log(`Sauvegarde forcée: ${key}`);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde forcée:", error);
    }
  };

  return { forceSave };
};
