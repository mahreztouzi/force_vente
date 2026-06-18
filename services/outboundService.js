import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosInstance from "./axiosConfig";

// // Fonction pour créer une commande
// export const createOutbound = async (orderData) => {
//   try {
//     const response = await axiosInstance.post(
//       "/API_OUTBOUND_DELIVERY_SRV/A_OutbDeliveryHeader",
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
// export const createOutbound = async (orderData) => {
//   try {
//     const response = await axiosInstance.post(
//       "/API_OUTBOUND_DELIVERY_SRV/A_OutbDeliveryHeader",
//       orderData,
//       {
//         headers: {
//           "X-REQUESTED-WITH": 1,
//         },
//       }
//     );
//     return response.data.d; // Renvoyer les données de la livraison créée
//   } catch (error) {
//     // Extraire le message d'erreur plus détaillé
//     if (error.response && error.response.data && error.response.data.error) {
//       const errorMessage =
//         error.response.data.error.message?.value ||
//         error.response.data.error.message ||
//         "Une erreur s'est produite lors de la création de la livraison";
//       throw new Error(errorMessage);
//     }
//     throw error;
//   }
// };
// Fonction utilitaire pour extraire les messages d'erreur SAP OData
// Fonction utilitaire pour extraire les messages d'erreur SAP OData
const extractSapErrorMessage = (errorData) => {
  // 1. Vérifier d'abord les errordetails dans innererror
  if (errorData.innererror && errorData.innererror.errordetails) {
    const errorDetails = errorData.innererror.errordetails;

    // errordetails est directement un tableau, pas besoin de .errordetail
    if (Array.isArray(errorDetails)) {
      // Prendre le premier errordetail qui n'est pas générique
      for (const detail of errorDetails) {
        if (
          detail.message &&
          detail.message !== "Exception raised without specific error" &&
          detail.severity === "error"
        ) {
          return detail.message;
        }
      }
    }
  }

  // 2. Fallback sur le message principal s'il n'est pas générique
  if (errorData.message) {
    const messageText = errorData.message.value || errorData.message;
    if (messageText !== "Exception raised without specific error") {
      return messageText;
    }
  }

  // 3. Dernier fallback
  return "Une erreur s'est produite";
};

export const createOutbound = async (orderData) => {
  try {
    const mandant = await AsyncStorage.getItem("mandant");
    const response = await axiosInstance.post(
      `/API_OUTBOUND_DELIVERY_SRV;v=2/A_OutbDeliveryHeader?sap-client=${mandant}`,
      orderData,
      {
        headers: {
          "X-REQUESTED-WITH": 1,
        },
      }
    );
    return response.data.d;
  } catch (error) {
    console.log(
      "errroooooooooor dans create outb",
      error.response,
      error.response.data,
      error.response.data.error
    );
    if (error.response && error.response.data && error.response.data.error) {
      const errorMessage = extractSapErrorMessage(error.response.data.error);
      throw new Error(errorMessage);
    }

    // Si la structure d'erreur n'est pas celle attendue
    throw new Error(
      "Une erreur inattendue s'est produite lors de la création de la livraison"
    );
  }
};
// Fonction pour modifier le magasin d'un item de livraison
// export const updateItemStorageLocation = async (
//   deliveryDocument,
//   itemNumber,
//   storageLocation,
//   quantity,
//   etag
// ) => {
//   try {
//     // S'assurer que le numéro de livraison est formaté correctement
//     const formattedDoc = formatDeliveryDocument(deliveryDocument);

//     // Formater le numéro d'item également
//     const formattedItem = String(itemNumber).padStart(10, "0");

//     const response = await axiosInstance.patch(
//       `/API_OUTBOUND_DELIVERY_SRV;v=2/A_OutbDeliveryItem(DeliveryDocument='${formattedDoc}',DeliveryDocumentItem='${itemNumber}')`,
//       {
//         StorageLocation: storageLocation,
//         ActualDeliveryQuantity: quantity.toString(),
//       },
//       {
//         headers: {
//           "X-REQUESTED-WITH": 1,
//           "Content-Type": "application/json",
//           "If-Match": etag,
//         },
//       }
//     );

//     return response.data;
//   } catch (error) {
//     console.log("error lors de la mise a jour des items", error);
//     const errorMessage =
//       error.response?.data?.error?.message ||
//       "Erreur lors de la modification du magasin de l'item";
//     throw new Error(errorMessage);
//   }
// };

// Fonction utilitaire pour extraire le message d'erreur du XML
const extractErrorMessage = (xmlString) => {
  try {
    // Créer un parser DOM pour analyser le XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");

    // Extraire le message principal
    const messageElement = xmlDoc.querySelector("error > message");
    if (messageElement) {
      return messageElement.textContent.trim();
    }

    // Si pas de message principal, essayer dans errordetails
    const errorDetailMessage = xmlDoc.querySelector("errordetail > message");
    if (errorDetailMessage) {
      return errorDetailMessage.textContent.trim();
    }

    return "Erreur inconnue";
  } catch (parseError) {
    console.error("Erreur lors du parsing XML:", parseError);
    return "Erreur lors de l'analyse de la réponse d'erreur";
  }
};

// Fonction modifiée avec extraction d'erreur
export const updateItemStorageLocation = async (
  deliveryDocument,
  itemNumber,
  storageLocation,
  quantity,
  etag
) => {
  try {
    const mandant = await AsyncStorage.getItem("mandant");
    const formattedDoc = formatDeliveryDocument(deliveryDocument);
    const formattedItem = String(itemNumber).padStart(10, "0");

    const response = await axiosInstance.patch(
      `/API_OUTBOUND_DELIVERY_SRV;v=2/A_OutbDeliveryItem(DeliveryDocument='${formattedDoc}',DeliveryDocumentItem='${itemNumber}')?sap-client=${mandant}`,
      {
        StorageLocation: storageLocation,
        ActualDeliveryQuantity: quantity.toString(),
      },
      {
        headers: {
          "X-REQUESTED-WITH": 1,
          "Content-Type": "application/json",
          "If-Match": etag,
        },
      }
    );

    return response.data;
  } catch (error) {
    let errorMessage = "Erreur lors de la modification du magasin de l'item";

    // Vérifier si c'est une erreur de réponse avec du contenu XML
    if (error.response?.data) {
      const responseData = error.response.data;

      // Si c'est du XML (string), extraire le message
      if (typeof responseData === "string" && responseData.includes("<?xml")) {
        errorMessage = extractErrorMessage(responseData);
      }
      // Si c'est un objet avec une structure d'erreur
      else if (responseData.error?.message) {
        errorMessage = responseData.error.message;
      }
    }
    throw new Error(errorMessage?.value);
  }
};

// Fonction pour récupérer les items d'une livraison
export const getDeliveryItems = async (deliveryDocument) => {
  try {
    const formattedDoc = formatDeliveryDocument(deliveryDocument);
    const mandant = await AsyncStorage.getItem("mandant");
    const response = await axiosInstance.get(
      `/API_OUTBOUND_DELIVERY_SRV;v=2/A_OutbDeliveryHeader('${formattedDoc}')/to_DeliveryDocumentItem?sap-client=${mandant}&$format=json`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    return response.data.d.results;
  } catch (error) {
    const errorMessage =
      error.response?.data?.error?.message ||
      "Erreur lors de la récupération des items de la livraison";
    throw new Error(errorMessage);
  }
};

// 2. Fonction pour récupérer les détails de l'entête de livraison avec l'ETag
export const getDeliveryHeader = async (deliveryDocument) => {
  try {
    const mandant = await AsyncStorage.getItem("mandant");
    const response = await axiosInstance.get(
      `/API_OUTBOUND_DELIVERY_SRV;v=2/A_OutbDeliveryHeader('${deliveryDocument}')?sap-client=${mandant}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    // Extraire l'ETag de l'en-tête de réponse
    const etag = response.headers.etag || "";

    return {
      data: response.data.d,
      etag: etag,
    };
  } catch (error) {
    const errorMessage =
      error.response?.data?.error?.message ||
      "Erreur lors de la récupération des détails de la livraison";
    throw new Error(errorMessage);
  }
};

// 3. Fonction pour effectuer la sortie de marchandise avec l'ETag
export const postGoodsIssue = async (deliveryDocument, etag) => {
  try {
    const mandant = await AsyncStorage.getItem("mandant");
    const response = await axiosInstance.post(
      `/API_OUTBOUND_DELIVERY_SRV/PostGoodsIssue?DeliveryDocument='${deliveryDocument}'&sap-client=${mandant}`,
      {}, // Corps vide pour la requête POST
      {
        headers: {
          "X-REQUESTED-WITH": 1,
          "If-Match": etag,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    // Traitement détaillé de l'erreur
    if (error.response?.data?.error) {
      const errorData = error.response.data.error;
      const errorMessage =
        errorData.message?.value ||
        errorData.message ||
        "Erreur lors de la sortie de marchandise";

      // Vérifier si c'est une erreur d'ETag
      if (errorData.code === "/IWBEP/CM_MGW_RT/190") {
        throw new Error(
          "L'état de la ressource a changé, veuillez récupérer un nouvel ETag"
        );
      }

      throw new Error(errorMessage);
    }
    throw error;
  }
};

// 4. Exemple d'utilisation des fonctions dans un workflow complet
export const completeDeliveryProcess = async (orderData) => {
  try {
    // Étape 1: Créer la livraison
    const deliveryData = await createOutbound(orderData);
    console.log(
      `Livraison créée avec succès: ${deliveryData.DeliveryDocument}`
    );
    const formattedDoc = await formatDeliveryDocument(
      deliveryData.DeliveryDocument
    );
    console.log("formattedDoc: ", formattedDoc);

    // Étape 2: Récupérer les items de la livraison
    const deliveryItems = await getDeliveryItems(formattedDoc);
    console.log(
      `Nombre d'items récupérés: ${deliveryItems.length}`,
      deliveryItems
    );

    // Étape 3: Mettre à jour le magasin pour chaque item
    for (const item of deliveryItems) {
      const originalItem = orderData.to_DeliveryDocumentItem.results.find(
        (original) =>
          original.ReferenceSDDocumentItem === item.ReferenceSDDocumentItem
      );
      // Extraire l'etag de l'item
      if (originalItem) {
        const etag = await getDeliveryItems(formattedDoc);
        console.log("for item test ", item, etag);

        const response = await updateItemStorageLocation(
          formattedDoc,
          item.DeliveryDocumentItem,
          "1103",
          originalItem.ActualDeliveryQuantity, // Passer la quantité originale
          etag[0].__metadata.etag
        );

        console.log(
          `Magasin et quantité mis à jour pour l'item ${item.DeliveryDocumentItem}`
        );
        console.log("response update items", response);
      }
    }
    // Étape 4: Récupérer les détails de la livraison avec l'ETag
    const { data, etag } = await getDeliveryHeader(formattedDoc);
    console.log(`ETag récupéré: ${etag}`);

    // Étape 5: Effectuer la sortie de marchandise
    const goodsIssueResult = await postGoodsIssue(formattedDoc, etag);
    console.log("Sortie de marchandise effectuée avec succès");

    return {
      deliveryDocument: deliveryData.DeliveryDocument,
      status: "Completed",
      goodsIssueResult,
    };
  } catch (error) {
    console.error("Erreur dans le processus de livraison:", error.message);
    throw error;
  }
};

export const fecthDeliveryToBill = async (user, client) => {
  try {
    const mandant = await AsyncStorage.getItem("mandant");
    const response = await axiosInstance.get(
      `ZBI_LIVRAISON_ATTENTE_DDH_CDS/zbi_livraison_attente_ddh?sap-client=${mandant}&$filter=(ernam eq '${user}')&$orderby=vbeln desc&$format=json`,
      // `ZBI_LIVRAISON_ATTENTE_DDH_CDS/zbi_livraison_attente_ddh?$filter=(ernam eq '${user}' and kunag eq '${client}')&$orderby=vbeln desc&$format=json`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    return response.data.d.results;
  } catch (error) {
    const errorMessage =
      error.response?.data?.error?.message ||
      "Erreur lors de la récupération des détails de la livraison";
    throw new Error(errorMessage);
  }
};

// Fonction pour récupérer les dates autorisé pour la livraison
export const fetchDateAutorise = async (bukrs) => {
  console.log("burks service", bukrs);
  try {
    const mandant = await AsyncStorage.getItem("mandant");
    const response = await axiosInstance.get(
      `ZBI_DATE_AUTORISE_DDH_CDS/zbi_date_autorise_ddh('${bukrs}')?sap-client=${mandant}&$format=json`
    );
    console.log("response service burks", response);
    return response.data.d; // Renvoyer les résultats de la requête
  } catch (error) {
    // Extraire le message d'erreur plus détaillé
    if (error.response && error.response.data && error.response.data.error) {
      const errorMessage =
        error.response.data.error.message?.value ||
        error.response.data.error.message ||
        "Une erreur s'est produite lors de la recuperation des dates";
      throw new Error(errorMessage);
    }
    throw error;
  }
};

// listes des livraisons
export const fetchAllOutboundsService = async (user, dateDebut, dateFin) => {
  try {
    const mandant = await AsyncStorage.getItem("mandant");
    let url = `ZBI_LIVRAISONS_DDH_CDS/zbi_livraisons_ddh?sap-client=${mandant}&$filter=(commercial eq '${user}')`;

    if (dateDebut && dateFin) {
      url += ` and (date_liv ge datetime'${dateDebut}T00:00:00' and date_liv le datetime'${dateFin}T23:59:59')`;
    }

    url += `&$orderby=num_doc desc&$format=json`;

    const response = await axiosInstance.get(url);
    return response.data.d.results;
  } catch (error) {
    throw new Error(
      "Erreur lors de la récupération des commandes: " + error.message
    );
  }
};

// services/deliveryServices.js

// Service pour créer uniquement la livraison
export const createDeliveryOnly = async (orderData) => {
  try {
    const mandant = await AsyncStorage.getItem("mandant");
    const response = await axiosInstance.post(
      `/API_OUTBOUND_DELIVERY_SRV;v=2/A_OutbDeliveryHeader?sap-client=${mandant}`,
      orderData,
      {
        headers: {
          "X-REQUESTED-WITH": 1,
        },
      }
    );
    return response.data.d;
  } catch (error) {
    console.log(
      "Erreur lors de la création de la livraison",
      error.response?.data
    );

    if (error.response?.data?.error) {
      const errorMessage = extractSapErrorMessage(error.response.data.error);
      throw new Error(errorMessage);
    }

    throw new Error(
      "Une erreur inattendue s'est produite lors de la création de la livraison"
    );
  }
};

// Service pour valider/modifier les magasins des items
export const validateDeliveryItems = async (
  magasin,
  deliveryDocument,
  originalItems
) => {
  try {
    const formattedDoc = formatDeliveryDocument(deliveryDocument);

    // Récupérer les items de la livraison
    const deliveryItems = await getDeliveryItems(formattedDoc);
    console.log(`Items récupérés pour validation: ${deliveryItems.length}`);

    const updateResults = [];

    // Mettre à jour chaque item
    for (const item of deliveryItems) {
      const originalItem = originalItems.find(
        (original) =>
          original.ReferenceSDDocumentItem === item.ReferenceSDDocumentItem
      );

      if (originalItem) {
        // Récupérer l'etag pour cet item
        const itemsWithEtag = await getDeliveryItems(formattedDoc);
        const itemWithEtag = itemsWithEtag.find(
          (i) => i.DeliveryDocumentItem === item.DeliveryDocumentItem
        );

        if (itemWithEtag?.__metadata?.etag) {
          const updateResult = await updateItemStorageLocation(
            formattedDoc,
            item.DeliveryDocumentItem,
            magasin, // Magasin de destination
            originalItem.ActualDeliveryQuantity,
            itemWithEtag.__metadata.etag
          );

          updateResults.push({
            itemNumber: item.DeliveryDocumentItem,
            success: true,
            result: updateResult,
          });

          console.log(`Item ${item.DeliveryDocumentItem} validé avec succès`);
        } else {
          throw new Error(
            `ETag non trouvé pour l'item ${item.DeliveryDocumentItem}`
          );
        }
      }
    }

    return {
      deliveryDocument: formattedDoc,
      updatedItems: updateResults,
      status: "validated",
    };
  } catch (error) {
    console.error("Erreur lors de la validation des items:", error);
    throw new Error(
      error.message || "Erreur lors de la validation des quantités"
    );
  }
};

// Service pour effectuer la sortie de marchandise
export const executeGoodsIssue = async (deliveryDocument) => {
  try {
    const formattedDoc = formatDeliveryDocument(deliveryDocument);

    // Récupérer l'ETag de l'entête
    const { data, etag } = await getDeliveryHeader(formattedDoc);

    if (!etag) {
      throw new Error("ETag non disponible pour la sortie de marchandise");
    }

    console.log(`Exécution de la sortie de marchandise avec ETag: ${etag}`);

    // Effectuer la sortie de marchandise
    const goodsIssueResult = await postGoodsIssue(formattedDoc, etag);

    return {
      deliveryDocument: formattedDoc,
      goodsIssueResult,
      status: "goods_issued",
    };
  } catch (error) {
    console.error("Erreur lors de la sortie de marchandise:", error);

    if (error.response?.data?.error) {
      const errorData = error.response.data.error;

      // Gestion spécifique des erreurs ETag
      if (errorData.code === "/IWBEP/CM_MGW_RT/190") {
        throw new Error("L'état de la ressource a changé, veuillez réessayer");
      }

      const errorMessage =
        errorData.message?.value ||
        errorData.message ||
        "Erreur lors de la sortie de marchandise";
      throw new Error(errorMessage);
    }

    throw new Error(error.message || "Erreur lors de la sortie de marchandise");
  }
};

// pour les texte de postes :
// NOUVEAU SERVICE: Fonction pour créer un texte de poste de livraison
export const createDeliveryItemText = async (
  deliveryDocument,
  itemNumber,
  offlineId
) => {
  try {
    const mandant = await AsyncStorage.getItem("mandant");
    const formattedDoc = formatDeliveryDocument(deliveryDocument);
    // Ne pas padder avec des zéros pour l'URL OData
    const formattedItem = String(itemNumber);

    console.log(
      `🔍 Création texte pour doc: ${formattedDoc}, item: ${formattedItem}`
    );

    const textData = {
      TextElement: "0001",
      Language: "F",
      TextElementText: `${offlineId}`,
    };

    const url = `/API_OUTBOUND_DELIVERY_SRV;v=2/A_OutbDeliveryItem(DeliveryDocument='${formattedDoc}',DeliveryDocumentItem='${formattedItem}')/to_DeliveryDocumentItemText?sap-client=${mandant}`;

    console.log(`🔗 URL construite: ${url}`);

    const response = await axiosInstance.post(url, textData, {
      headers: {
        "X-REQUESTED-WITH": 1,
        "Content-Type": "application/json",
      },
    });

    return response.data.d;
  } catch (error) {
    console.error(
      `Erreur lors de la création du texte pour l'item ${itemNumber}:`,
      error
    );

    if (error.response?.data?.error) {
      const errorMessage = extractSapErrorMessage(error.response.data.error);
      throw new Error(errorMessage);
    }

    throw new Error(
      `Erreur lors de la création du texte pour l'item ${itemNumber}`
    );
  }
};

// NOUVEAU SERVICE: Fonction pour créer un texte de poste de livraison
export const createDeliveryHeaderText = async (deliveryDocument, offlineId) => {
  try {
    const mandant = await AsyncStorage.getItem("mandant");
    const formattedDoc = formatDeliveryDocument(deliveryDocument);
    const textData = {
      TextElement: "0002",
      Language: "F",
      TextElementText: `${offlineId}`,
    };

    const url = `/API_OUTBOUND_DELIVERY_SRV;v=2/A_OutbDeliveryHeader(DeliveryDocument='${formattedDoc}')/to_DeliveryDocumentText?sap-client=${mandant}`;

    console.log(`🔗 URL construite: ${url}`);

    const response = await axiosInstance.post(url, textData, {
      headers: {
        "X-REQUESTED-WITH": 1,
        "Content-Type": "application/json",
      },
    });

    return response.data.d;
  } catch (error) {
    console.error(`Erreur lors de la création du texte`, error);

    if (error.response?.data?.error) {
      const errorMessage = extractSapErrorMessage(error.response.data.error);
      throw new Error(errorMessage);
    }

    throw new Error(`Erreur lors de la création du texte`);
  }
};

// NOUVEAU SERVICE: Fonction pour créer les textes pour tous les items d'une livraison
export const createDeliveryItemTexts = async (
  deliveryDocument,
  deliveryItems,
  offlineId
) => {
  try {
    const formattedDoc = formatDeliveryDocument(deliveryDocument);
    console.log(
      `🔤 Création des textes pour ${deliveryItems.length} items avec l'ID offline: ${offlineId}`
    );

    const textResults = [];

    for (const item of deliveryItems) {
      try {
        const textResult = await createDeliveryItemText(
          formattedDoc,
          item.DeliveryDocumentItem || item.ReferenceSDDocumentItem,
          offlineId
        );

        textResults.push({
          itemNumber: item.DeliveryDocumentItem || item.ReferenceSDDocumentItem,
          success: true,
          result: textResult,
        });

        console.log(
          `✅ Texte créé pour l'item ${
            item.DeliveryDocumentItem || item.ReferenceSDDocumentItem
          }`
        );
      } catch (itemError) {
        console.error(
          `❌ Erreur pour l'item ${
            item.DeliveryDocumentItem || item.ReferenceSDDocumentItem
          }:`,
          itemError
        );

        textResults.push({
          itemNumber: item.DeliveryDocumentItem || item.ReferenceSDDocumentItem,
          success: false,
          error: itemError.message,
        });

        // Ne pas interrompre le processus pour les autres items
        // throw itemError; // Commenté pour continuer avec les autres items
      }
    }

    return {
      deliveryDocument: formattedDoc,
      offlineId,
      textResults,
      successCount: textResults.filter((r) => r.success).length,
      errorCount: textResults.filter((r) => !r.success).length,
    };
  } catch (error) {
    console.error("Erreur générale lors de la création des textes:", error);
    throw new Error(
      error.message || "Erreur lors de la création des textes de poste"
    );
  }
};
