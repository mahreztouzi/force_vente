// src/services/clientService.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosInstance from "./axiosConfig";

// Fonction pour récupérer les clients
export const fetchArticle = async () => {
  try {
    const mandant = await AsyncStorage.getItem("mandant");
    const response = await axiosInstance.get(
      `ZBI_ARTICLE_DDH_CDS/ZBI_article_ddh?sap-client=${mandant}&$format=json`
    );
    console.log("response", response.data.d.results);
    // return response.data.d.results; // Renvoyer les résultats de la requête
    return response.data.d.results.map((article) => ({
      ...article,
      prix: Number(article.prix) || 0, // Conversion forcée en nombre
    }));
  } catch (error) {
    throw new Error(
      "Erreur lors de la récupération des clients: " + error.message
    );
  }
};
