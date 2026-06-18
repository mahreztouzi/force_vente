import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosInstance from "./axiosConfig";

// Fonction pour formater le numéro de document sur 10 caractères
const formatDeliveryDocument = (deliveryDoc) => {
  // Convertir en chaîne pour être sûr
  const docString = String(deliveryDoc);

  // Si le numéro a déjà 10 caractères, le retourner tel quel
  if (docString.length === 10) {
    return docString;
  }

  // Sinon, ajouter des zéros devant pour atteindre 10 caractères
  return docString.padStart(10, "0");
};

// 1. Fonction pour créer une livraison (déjà fournie)
export const createBill = async (numLiv) => {
  try {
    const mandant = await AsyncStorage.getItem("mandant");
    const formattedNumLiv = formatDeliveryDocument(numLiv);
    const response = await axiosInstance.post(
      `/ZAPP_FACTURE_SD_SRV/billSet?sap-client=${mandant}`,
      {
        RefDoc: formattedNumLiv,
      },
      {
        headers: {
          "X-REQUESTED-WITH": 1,
        },
      }
    );
    return response.data?.d?.DocNumber; // Renvoyer les données de la livraison créée
  } catch (error) {
    // Extraire le message d'erreur plus détaillé
    if (error.response && error.response.data && error.response.data.error) {
      const errorMessage =
        error.response.data.error.message?.value ||
        error.response.data.error.message ||
        "Une erreur s'est produite lors de la création de la facture";
      throw new Error(errorMessage);
    }
    throw error;
  }
};
