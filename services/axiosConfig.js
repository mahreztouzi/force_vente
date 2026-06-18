// // src/services/axiosConfig.js
// import axios from "axios";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import * as SecureStore from "expo-secure-store";

// // Définir l'URL de base de l'API SAP OData
// const API_URL = "http://10.10.10.228:8000/sap/opu/odata/sap/";

// // Fonction pour récupérer les identifiants
// const getCredentials = async () => {
//   try {
//     const username = await SecureStore.getItemAsync("username");
//     const password = await SecureStore.getItemAsync("password");
//     if (username && password) {
//       return { username, password };
//     }
//     return null;
//   } catch (error) {
//     console.log("Erreur lors de la récupération des identifiants:", error);
//     return null;
//   }
// };

// // Créer une instance d'Axios avec la configuration de base
// const axiosInstance = axios.create({
//   baseURL: API_URL,
//   headers: {
//     "Content-Type": "application/json",
//     Accept: "application/json",
//     "Accept-Language": "Fr",
//   },
// });

// // Intercepteur pour ajouter les informations d'authentification
// axiosInstance.interceptors.request.use(
//   async (config) => {
//     // Récupérer les informations de connexion depuis AsyncStorage
//     // const username = await AsyncStorage.getItem("username");
//     // const password = await AsyncStorage.getItem("password");
//     // console.log("nom et prenom", username, password);
//     const credentials = await getCredentials();
//     console.log("credentials", credentials);

//     if (credentials) {
//       // Créer le header d'autorisation de base
//       const authHeader =
//         "Basic " + btoa(`${credentials.username}:${credentials.password}`);

//       // Ajouter l'en-tête Authorization à la requête
//       config.headers.Authorization = authHeader;
//     }

//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// export default axiosInstance;

// src/services/axiosConfig.js
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

// Fonction pour récupérer la configuration du serveur
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

// Fonction pour récupérer les identifiants
const getCredentials = async () => {
  try {
    const username = await SecureStore.getItemAsync("username");
    const password = await SecureStore.getItemAsync("password");
    if (username && password) {
      return { username, password };
    }
    return null;
  } catch (error) {
    console.log("Erreur lors de la récupération des identifiants:", error);
    return null;
  }
};

// Créer une instance d'Axios avec une configuration de base temporaire
const axiosInstance = axios.create({
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "Accept-Language": "Fr",
  },
});

// Fonction pour initialiser/mettre à jour la baseURL d'Axios
const initializeAxiosBaseUrl = async () => {
  try {
    const apiUrl = await buildApiUrl();
    axiosInstance.defaults.baseURL = apiUrl;
    console.log("Axios baseURL initialisée:", apiUrl);
  } catch (error) {
    console.log("Erreur lors de l'initialisation de l'URL Axios:", error);
  }
};

// Initialiser la baseURL au chargement du module
initializeAxiosBaseUrl();

// Intercepteur pour ajouter les informations d'authentification
// axiosInstance.interceptors.request.use(
//   async (config) => {
//     // S'assurer que la baseURL est à jour (au cas où la config aurait changé)
//     if (!config.baseURL || config.baseURL === "") {
//       await initializeAxiosBaseUrl();
//     }

//     // Récupérer les informations de connexion
//     const credentials = await getCredentials();
//     console.log("credentials", credentials);

//     if (credentials) {
//       // Créer le header d'autorisation de base
//       const authHeader =
//         "Basic " + btoa(`${credentials.username}:${credentials.password}`);

//       // Ajouter l'en-tête Authorization à la requête
//       config.headers.Authorization = authHeader;
//     }

//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );
axiosInstance.interceptors.request.use(
  async (config) => {
    const apiUrl = await buildApiUrl();
    config.baseURL = apiUrl; // <-- toujours à jour
    console.log("BaseURL utilisée pour cette requête:", apiUrl);

    const credentials = await getCredentials();
    if (credentials) {
      const authHeader =
        "Basic " + btoa(`${credentials.username}:${credentials.password}`);
      config.headers.Authorization = authHeader;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Fonction exportée pour forcer la mise à jour de la configuration
export const updateAxiosBaseUrl = async () => {
  await initializeAxiosBaseUrl();
};

export default axiosInstance;
