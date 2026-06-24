// src/services/clientService.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosInstance from "./axiosConfig";

export const fetchClients = async (grpVendeur) => {
  try {
    const mandant = await AsyncStorage.getItem("mandant");
    const baseUrl = "ZBI_CLIENT_DDH_CDS/zbi_client_ddh";
    const filterParam = grpVendeur
      ? `$filter=grpVendeur eq '${grpVendeur}'&`
      : "";
    const url = `${baseUrl}?sap-client=${mandant}&${filterParam}$format=json`;

    const response = await axiosInstance.get(url);
    return response.data.d.results;
  } catch (error) {
    throw new Error(
      "Erreur lors de la récupération des clients: " + error.message,
    );
  }
};

export const fetchClientEtat = async (codeUtilisateur) => {
  try {
    const mandant = await AsyncStorage.getItem("mandant");
    const baseUrl = "ZBI_CLIENT_ETAT_FINAL_CDS/ZBI_Client_Etat_Final";
    const filterParam = codeUtilisateur
      ? `$filter=code_utilisateur eq '${codeUtilisateur}'&`
      : "";
    const url = `${baseUrl}?sap-client=${mandant}&${filterParam}$format=json`;

    const response = await axiosInstance.get(url);
    return response.data.d.results;
  } catch (error) {
    throw new Error(
      "Erreur lors de la récupération de l'état des clients: " + error.message,
    );
  }
};
