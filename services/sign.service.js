// services/projet.services.js

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as SecureStore from "expo-secure-store";

// Fonction pour récupérer les projets pour un utilisateur
// export const Sign = async (email, password) => {
//   try {
//     const response = await axios.post(
//       // "http://192.168.1.9:8080/utilisateur/login",
//       // "http://192.168.0.105:8080/utilisateur/login",
//       "https://mahrez.alwaysdata.net/utilisateur/login",
//       {
//         nom_utilisateur: email,
//         password: password,
//       }
//     );
//     await AsyncStorage.removeItem("user");
//     await AsyncStorage.setItem("user", JSON.stringify(response.data));
//     // Si la connexion est réussie, on stocke les informations dans AsyncStorage
//     await AsyncStorage.setItem("username", email);
//     await AsyncStorage.setItem("password", password);
//     console.log("response data sign", response.data);
//     return response.data;
//   } catch (error) {
//     // Gestion des erreurs
//     console.error(error);
//     return error;
//   }
// };

// src/services/clientService.js
import axiosInstance from "./axiosConfig";

// // Fonction pour récupérer les clients
// export const Sign = async (user) => {
//   try {
//     // const response = await axiosInstance.get("zbi_client_ddh?$format=json");
//     const response = await axiosInstance.get(
//       `ZBI_USER_DDH_CDS/zbi_user_ddh('${user}')?$format=json`
//     );
//     console.log("response in sign service test", response.data.d);
//     return response.data.d; // Renvoyer les résultats de la requête
//   } catch (error) {
//     throw new Error("Erreur : " + error.message);
//   }
// };

const getServerConfig = async () => {
  try {
    const savedConfig = await SecureStore.getItemAsync("server_config");
    const config = JSON.parse(savedConfig);
    return config.serverUrl; // Retourne l'URL complète du serveur
  } catch (error) {
    console.log("Erreur lors de la récupération de la config serveur:", error);
  }
};

// Fonction pour construire l'URL de l'API complète
const buildApiUrl = async () => {
  const serverUrl = await getServerConfig();
  return `${serverUrl}/sap/opu/odata/sap/`;
};

// const API_URL = "http://10.10.10.228:8000/sap/opu/odata/sap/";

export const authenticateUser = async (username, password) => {
  try {
    const API_URL = await buildApiUrl();
    // Créer l'en-tête d'autorisation
    const authHeader = "Basic " + btoa(`${username}:${password}`);
    const mandant = await AsyncStorage.getItem("mandant");
    // Tester la connexion avec les identifiants
    const response = await axios.get(
      `${API_URL}ZBI_USER_DDH_CDS/zbi_user_ddh('${username}')??sap-client=${mandant}&$format=json`,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Accept-Language": "Fr",
          Authorization: authHeader,
          "sap-client": mandant,
        },
      }
    );

    console.log("response in auth service", response.data.d);
    return response.data.d;
  } catch (error) {
    // Gestion des erreurs spécifiques
    if (error.response?.status === 401) {
      throw new Error("Unauthorized");
    }
    throw new Error("Erreur de connexion : " + error.message);
  }
};

export const loadUserService = async (user) => {
  try {
    // const response = await axiosInstance.get("zbi_client_ddh?$format=json");
    const mandant = await AsyncStorage.getItem("mandant");
    const response = await axiosInstance.get(
      `ZBI_USER_DDH_CDS/zbi_user_ddh('${user}')?sap-client=${mandant}&$format=json`
    );
    console.log("response in sign service test", response.data.d);
    return response.data.d; // Renvoyer les résultats de la requête
  } catch (error) {
    throw new Error("Erreur : " + error.message);
  }
};
