// src/services/clientService.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosInstance from "./axiosConfig";

// Fonction pour récupérer les articles du stocks ( magasin )
export const fetchStockArticle = async (magasin) => {
  try {
    const mandant = await AsyncStorage.getItem("mandant");
    const response = await axiosInstance.get(
      `Z_STOCK_MAGASIN_DETAIL_CDS/Z_STOCK_MAGASIN_DETAIL?sap-client=${mandant}&$filter=(StorageLocation eq '${magasin}')&$format=json`
    );
    return response.data.d.results;
  } catch (error) {
    throw new Error(
      "Erreur lors de la récupération des articles stocks: " + error.message
    );
  }
};
