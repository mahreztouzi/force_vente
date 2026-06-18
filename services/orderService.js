import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosInstance from "./axiosConfig";

const formatNumber = (deliveryDoc) => {
  // Convertir en chaîne pour être sûr
  const docString = String(deliveryDoc);

  // Si le numéro a déjà 10 caractères, le retourner tel quel
  if (docString.length === 10) {
    return docString;
  }

  // Sinon, ajouter des zéros devant pour atteindre 10 caractères
  return docString.padStart(10, "0");
};

// // Fonction pour créer une commande
export const createOrder = async (orderData) => {
  try {
    const mandant = await AsyncStorage.getItem("mandant");
    const response = await axiosInstance.post(
      `API_SALES_ORDER_SRV/A_SalesOrder?sap-client=${mandant}`,
      orderData,
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
      throw new Error(errorMessage);
    }
    throw error;
  }
};

//  cree une commande de retour libre
export const createOrderReturn = async (orderData) => {
  try {
    const mandant = await AsyncStorage.getItem("mandant");
    const response = await axiosInstance.post(
      `API_CUSTOMER_RETURN_SRV/A_CustomerReturn?sap-client=${mandant}`,
      orderData,
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
      throw new Error(errorMessage);
    }
    throw error;
  }
};

// Fonction pour récupérer les commandes
export const fetchOrders = async () => {
  try {
    const mandant = await AsyncStorage.getItem("mandant");
    const response = await axiosInstance.get(
      `API_SALES_ORDER_SRV/A_SalesOrder?sap-client=${mandant}&$format=json`
    );
    return response.data.d.results; // Renvoyer les résultats de la requête
  } catch (error) {
    throw new Error(
      "Erreur lors de la récupération des commandes: " + error.message
    );
  }
};

// Fonction pour récupérer les commandes approuvés
export const fetchOrdersApprouve = async (user, client) => {
  try {
    const mandant = await AsyncStorage.getItem("mandant");
    const response = await axiosInstance.get(
      `ZBI_COMMANDES_APPROUVE_DDH_CDS/Zbi_commandes_approuve_ddh?sap-client=${mandant}&$filter=(commercial eq '${user}')&$orderby=cmd desc&$format=json`
    );
    return response.data.d.results; // Renvoyer les résultats de la requête
  } catch (error) {
    throw new Error(
      "Erreur lors de la récupération des commandes: " + error.message
    );
  }
};

// Fonction pour récupérer les motifs de retours
export const fetchMotifRetour = async () => {
  try {
    const mandant = await AsyncStorage.getItem("mandant");
    const response = await axiosInstance.get(
      `ZBI_MOTIF_RETOUR_CMD_DDH_CDS/zbi_motif_retour_cmd_ddh?sap-client=${mandant}&$format=json`
    );
    return response.data.d.results; // Renvoyer les résultats de la requête
  } catch (error) {
    // Extraire le message d'erreur plus détaillé
    if (error.response && error.response.data && error.response.data.error) {
      const errorMessage =
        error.response.data.error.message?.value ||
        error.response.data.error.message ||
        "Une erreur s'est produite lors de la recuperation des motifs";
      throw new Error(errorMessage);
    }
    throw error;
  }
};

// Fonction pour la suppression d'un item
export const deleteOrderItemService = async (commande, itemNumber) => {
  try {
    const mandant = await AsyncStorage.getItem("mandant");
    const commandeNumber = formatNumber(commande);
    const response = await axiosInstance.delete(
      `API_SALES_ORDER_SRV/A_SalesOrderItem(SalesOrder='${commandeNumber}',SalesOrderItem='${itemNumber}')?sap-client=${mandant}`,
      {
        headers: {
          "X-REQUESTED-WITH": 1,
        },
      }
    );

    return response.data;
  } catch (error) {
    // Extraire le message d'erreur plus détaillé
    if (error.response && error.response.data && error.response.data.error) {
      const errorMessage =
        error.response.data.error.message?.value ||
        error.response.data.error.message ||
        "Une erreur s'est produite lors de la création de la commande";
      throw new Error(errorMessage);
    }
    throw error;
  }
};

// Fonction pour modifier un article
export const updateOrderItemService = async (
  commande,
  itemNumber,
  article,
  qte
) => {
  try {
    const commandeNumber = formatNumber(commande);
    const mandant = await AsyncStorage.getItem("mandant");
    const response = await axiosInstance.patch(
      `API_SALES_ORDER_SRV/A_SalesOrderItem(SalesOrder='${commandeNumber}',SalesOrderItem='${itemNumber}')?sap-client=${mandant}`,
      {
        Material: article,
        RequestedQuantity: qte.toString(),
      },
      {
        headers: {
          "X-REQUESTED-WITH": 1,
        },
      }
    );

    return response.data;
  } catch (error) {
    // Extraire le message d'erreur plus détaillé
    console.log("response error", error);
    if (error.response && error.response.data && error.response.data.error) {
      const errorMessage =
        error.response.data.error.message?.value ||
        error.response.data.error.message ||
        "Une erreur s'est produite lors de la création de la commande";
      throw new Error(errorMessage);
    }
    throw error;
  }
};

// Fonction pour modifier un article
export const addOrderItemService = async (commande, article, qte) => {
  try {
    const mandant = await AsyncStorage.getItem("mandant");
    const commandeNumber = formatNumber(commande);
    const response = await axiosInstance.post(
      `API_SALES_ORDER_SRV/A_SalesOrderItem?sap-client=${mandant}`,
      {
        SalesOrder: commandeNumber,
        Material: article,
        RequestedQuantity: qte.toString(),
      },
      {
        headers: {
          "X-REQUESTED-WITH": 1,
        },
      }
    );

    return response.data;
  } catch (error) {
    // Extraire le message d'erreur plus détaillé
    console.log("response error", error);
    if (error.response && error.response.data && error.response.data.error) {
      const errorMessage =
        error.response.data.error.message?.value ||
        error.response.data.error.message ||
        "Une erreur s'est produite lors de la création de la commande";
      throw new Error(errorMessage);
    }
    throw error;
  }
};

export const fetchAllOrders = async (user, dateDebut, dateFin) => {
  try {
    const mandant = await AsyncStorage.getItem("mandant");
    let url = `ZBI_LISTE_COMMANDES_DDH_CDS/zbi_liste_commandes_ddh?sap-client=${mandant}&$filter=(commercial eq '${user}')`;

    if (dateDebut && dateFin) {
      url += ` and (erdat ge datetime'${dateDebut}T00:00:00' and erdat le datetime'${dateFin}T23:59:59')`;
    }

    url += `&$orderby=cmd desc&$format=json`;

    const response = await axiosInstance.get(url);
    return response.data.d.results; // Renvoyer les résultats de la requête
  } catch (error) {
    throw new Error(
      "Erreur lors de la récupération des commande de vente et de retour: " +
        error.message
    );
  }
};

// import axiosInstance from "./axiosConfig";

// import { checkConnection, queueOfflineAction } from "../utils/offlineUtils";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { v4 as uuidv4 } from "uuid";

// // Clé pour stocker les commandes hors ligne
// const OFFLINE_ORDERS_KEY = "offline_orders";

// const formatNumber = (deliveryDoc) => {
//   // Convertir en chaîne pour être sûr
//   const docString = String(deliveryDoc);

//   // Si le numéro a déjà 10 caractères, le retourner tel quel
//   if (docString.length === 10) {
//     return docString;
//   }

//   // Sinon, ajouter des zéros devant pour atteindre 10 caractères
//   return docString.padStart(10, "0");
// };

// // // Fonction pour créer une commande
// export const createOrder = async (orderData) => {
//   // Vérifier l'état de la connexion
//   const isConnected = await checkConnection();

//   // Générer un ID temporaire pour la commande
//   const tempId = uuidv4();
//   const orderWithTempId = {
//     ...orderData,
//     id: tempId,
//     tempId,
//     status: "pending",
//     createdAt: new Date().toISOString(),
//   };

//   if (isConnected) {
//     try {
//       const response = await axiosInstance.post(
//         "API_SALES_ORDER_SRV/A_SalesOrder",
//         orderData,
//         {
//           headers: {
//             "X-REQUESTED-WITH": 1,
//           },
//         }
//       );
//       return response.data.d; // Renvoyer les données de la commande créée
//     } catch (error) {
//       // Extraire le message d'erreur plus détaillé
//       if (error.response && error.response.data && error.response.data.error) {
//         const errorMessage =
//           error.response.data.error.message?.value ||
//           error.response.data.error.message ||
//           "Une erreur s'est produite lors de la création de la commande";
//         throw new Error(errorMessage);
//       }
//       throw error;
//     }
//   } else {
//     // Si déconnecté, sauvegarder en mode hors ligne
//     await saveOfflineOrder(orderWithTempId);
//     await queueOfflineAction({
//       id: tempId,
//       type: "CREATE_ORDER",
//       data: orderWithTempId,
//     });

//     return {
//       ...orderWithTempId,
//       status: "offline",
//     };
//   }
// };

// // Sauvegarder une commande en mode hors ligne
// const saveOfflineOrder = async (order) => {
//   try {
//     // Récupérer les commandes hors ligne existantes
//     const offlineOrdersStr = await AsyncStorage.getItem(OFFLINE_ORDERS_KEY);
//     const offlineOrders = offlineOrdersStr ? JSON.parse(offlineOrdersStr) : [];

//     // Ajouter la nouvelle commande
//     offlineOrders.push(order);

//     // Sauvegarder les commandes mises à jour
//     await AsyncStorage.setItem(
//       OFFLINE_ORDERS_KEY,
//       JSON.stringify(offlineOrders)
//     );

//     return true;
//   } catch (error) {
//     console.error(
//       "Erreur lors de la sauvegarde de la commande hors ligne:",
//       error
//     );
//     return false;
//   }
// };

// //  cree une commande de retour libre
// export const createOrderReturn = async (orderData) => {
//   try {
//     const response = await axiosInstance.post(
//       "API_CUSTOMER_RETURN_SRV/A_CustomerReturn",
//       orderData,
//       {
//         headers: {
//           "X-REQUESTED-WITH": 1,
//         },
//       }
//     );
//     return response.data.d; // Renvoyer les données de la commande créée
//   } catch (error) {
//     // Extraire le message d'erreur plus détaillé
//     if (error.response && error.response.data && error.response.data.error) {
//       const errorMessage =
//         error.response.data.error.message?.value ||
//         error.response.data.error.message ||
//         "Une erreur s'est produite lors de la création de la commande";
//       throw new Error(errorMessage);
//     }
//     throw error;
//   }
// };

// // Fonction pour récupérer les commandes
// export const fetchOrders = async () => {
//   try {
//     const response = await axiosInstance.get(
//       "API_SALES_ORDER_SRV/A_SalesOrder?$format=json"
//     );
//     return response.data.d.results; // Renvoyer les résultats de la requête
//   } catch (error) {
//     throw new Error(
//       "Erreur lors de la récupération des commandes: " + error.message
//     );
//   }
// };

// // Fonction pour récupérer les commandes approuvés
// export const fetchOrdersApprouve = async (user, client) => {
//   try {
//     // const response = await axiosInstance.get(
//     //   `ZBI_COMMANDES_APPROUVE_DDH_CDS/Zbi_commandes_approuve_ddh?$filter=(commercial eq '${user}' and client eq '${client}')&$orderby=cmd desc&$format=json`
//     // );
//     const response = await axiosInstance.get(
//       `ZBI_COMMANDES_APPROUVE_DDH_CDS/Zbi_commandes_approuve_ddh?$filter=(commercial eq '${user}')&$orderby=cmd desc&$format=json`
//     );
//     return response.data.d.results; // Renvoyer les résultats de la requête
//   } catch (error) {
//     throw new Error(
//       "Erreur lors de la récupération des commandes: " + error.message
//     );
//   }
// };

// // Fonction pour récupérer les motifs de retours
// export const fetchMotifRetour = async () => {
//   try {
//     const response = await axiosInstance.get(
//       "ZBI_MOTIF_RETOUR_CMD_DDH_CDS/zbi_motif_retour_cmd_ddh?$format=json"
//     );
//     return response.data.d.results; // Renvoyer les résultats de la requête
//   } catch (error) {
//     // Extraire le message d'erreur plus détaillé
//     if (error.response && error.response.data && error.response.data.error) {
//       const errorMessage =
//         error.response.data.error.message?.value ||
//         error.response.data.error.message ||
//         "Une erreur s'est produite lors de la recuperation des motifs";
//       throw new Error(errorMessage);
//     }
//     throw error;
//   }
// };

// // Fonction pour la suppression d'un item
// export const deleteOrderItemService = async (commande, itemNumber) => {
//   try {
//     const commandeNumber = formatNumber(commande);
//     const response = await axiosInstance.delete(
//       `API_SALES_ORDER_SRV/A_SalesOrderItem(SalesOrder='${commandeNumber}',SalesOrderItem='${itemNumber}')`,
//       {
//         headers: {
//           "X-REQUESTED-WITH": 1,
//         },
//       }
//     );

//     return response.data;
//   } catch (error) {
//     // Extraire le message d'erreur plus détaillé
//     if (error.response && error.response.data && error.response.data.error) {
//       const errorMessage =
//         error.response.data.error.message?.value ||
//         error.response.data.error.message ||
//         "Une erreur s'est produite lors de la création de la commande";
//       throw new Error(errorMessage);
//     }
//     throw error;
//   }
// };

// // Fonction pour modifier un article
// export const updateOrderItemService = async (
//   commande,
//   itemNumber,
//   article,
//   qte
// ) => {
//   try {
//     const commandeNumber = formatNumber(commande);
//     const response = await axiosInstance.patch(
//       `API_SALES_ORDER_SRV/A_SalesOrderItem(SalesOrder='${commandeNumber}',SalesOrderItem='${itemNumber}')`,
//       {
//         Material: article,
//         RequestedQuantity: qte.toString(),
//       },
//       {
//         headers: {
//           "X-REQUESTED-WITH": 1,
//         },
//       }
//     );

//     return response.data;
//   } catch (error) {
//     // Extraire le message d'erreur plus détaillé
//     console.log("response error", error);
//     if (error.response && error.response.data && error.response.data.error) {
//       const errorMessage =
//         error.response.data.error.message?.value ||
//         error.response.data.error.message ||
//         "Une erreur s'est produite lors de la création de la commande";
//       throw new Error(errorMessage);
//     }
//     throw error;
//   }
// };

// // Fonction pour modifier un article
// export const addOrderItemService = async (commande, article, qte) => {
//   try {
//     const commandeNumber = formatNumber(commande);
//     const response = await axiosInstance.post(
//       "API_SALES_ORDER_SRV/A_SalesOrderItem",
//       {
//         SalesOrder: commandeNumber,
//         Material: article,
//         RequestedQuantity: qte.toString(),
//       },
//       {
//         headers: {
//           "X-REQUESTED-WITH": 1,
//         },
//       }
//     );

//     return response.data;
//   } catch (error) {
//     // Extraire le message d'erreur plus détaillé
//     console.log("response error", error);
//     if (error.response && error.response.data && error.response.data.error) {
//       const errorMessage =
//         error.response.data.error.message?.value ||
//         error.response.data.error.message ||
//         "Une erreur s'est produite lors de la création de la commande";
//       throw new Error(errorMessage);
//     }
//     throw error;
//   }
// };
