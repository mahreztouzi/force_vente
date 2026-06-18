// src/services/clientService.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosInstance from "./axiosConfig";

// Fonction pour récupérer les clients
export const fetchTransfert = async (magasin) => {
  try {
    const mandant = await AsyncStorage.getItem("mandant");
    const response = await axiosInstance.get(
      `ZBI_LISTE_TRANSFERT_DDH_CDS/ZBI_LISTE_transfert_ddh?sap-client=${mandant}&$filter=(MagasinDestinataire eq '${magasin}')&$orderby=NumeroDocument desc&$format=json`
    );
    console.log("response transferts", response.data.d.results);
    return response.data.d.results;
  } catch (error) {
    throw new Error(
      "Erreur lors de la récupération des transferts: " + error.message
    );
  }
};

// function to create a goodReceipt
export const creatGoodReceipt = async (goodReceiptData) => {
  try {
    const mandant = await AsyncStorage.getItem("mandant");
    const response = await axiosInstance.post(
      `API_MATERIAL_DOCUMENT_SRV/A_MaterialDocumentHeader?sap-client=${mandant}`,
      goodReceiptData,
      {
        headers: {
          "X-REQUESTED-WITH": 1,
        },
      }
    );
    return response.data.d; // Renvoyer les données de la commande créée
  } catch (error) {
    // Extraire le message d'erreur plus détaillé
    if (error.response && error.response.data && error.response.data.error) {
      const errorMessage =
        error.response.data.error.message?.value ||
        error.response.data.error.message ||
        "Une erreur s'est produite lors de la création de la commande";
      console.log(errorMessage);
      throw new Error(errorMessage);
    }
    throw error;
  }
};
