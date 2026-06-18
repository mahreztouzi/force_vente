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

// // Fonction pour créer une Quotation
export const createQuotation = async (QuotationData) => {
  try {
    const mandant = await AsyncStorage.getItem("mandant");
    const response = await axiosInstance.post(
      `API_SALES_Quotation_SRV/A_SalesQuotation?sap-client=${mandant}`,
      QuotationData,
      {
        headers: {
          "X-REQUESTED-WITH": 1,
        },
      }
    );
    return response.data.d; // Renvoyer les données de la Quotation créée
  } catch (error) {
    // Extraire le message d'erreur plus détaillé
    if (error.response && error.response.data && error.response.data.error) {
      const errorMessage =
        error.response.data.error.message?.value ||
        error.response.data.error.message ||
        "Une erreur s'est produite lors de la création de la Quotation";
      throw new Error(errorMessage);
    }
    throw error;
  }
};

// Fonction pour récupérer les Quotations
export const fetchQuotations = async () => {
  try {
    const mandant = await AsyncStorage.getItem("mandant");
    const response = await axiosInstance.get(
      `API_SALES_Quotation_SRV/A_SalesQuotation?sap-client=${mandant}&$format=json`
    );
    return response.data.d.results; // Renvoyer les résultats de la requête
  } catch (error) {
    throw new Error(
      "Erreur lors de la récupération des Quotations: " + error.message
    );
  }
};

// Fonction pour récupérer les Quotations approuvés
export const fetchQuotationsApprouve = async (user, dateDebut, dateFin) => {
  try {
    // const response = await axiosInstance.get(
    //   `ZBI_LISTE_QUOTATION_DDH_CDS/zbi_liste_quotation_ddh?$filter=(commercial eq '${user}')&$orderby=cmd desc&$format=json`
    // );
    const mandant = await AsyncStorage.getItem("mandant");
    let url = `ZBI_LISTE_QUOTATION_DDH_CDS/zbi_liste_quotation_ddh?sap-client=${mandant}&$filter=(commercial eq '${user}')`;

    if (dateDebut && dateFin) {
      url += ` and (erdat ge datetime'${dateDebut}T00:00:00' and erdat le datetime'${dateFin}T23:59:59')`;
    }

    url += `&$orderby=cmd desc&$format=json`;

    const response = await axiosInstance.get(url);
    return response.data.d.results; // Renvoyer les résultats de la requête
  } catch (error) {
    throw new Error(
      "Erreur lors de la récupération des Quotations: " + error.message
    );
  }
};

// Fonction pour la suppression d'un item
export const deleteQuotationItemService = async (Quotation, itemNumber) => {
  try {
    const mandant = await AsyncStorage.getItem("mandant");
    const QuotationNumber = formatNumber(Quotation);
    const response = await axiosInstance.delete(
      `API_SALES_Quotation_SRV/A_SalesQuotationItem(SalesQuotation='${QuotationNumber}',SalesQuotationItem='${itemNumber}')?sap-client=${mandant}`,
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
        "Une erreur s'est produite lors de la création de la Quotation";
      throw new Error(errorMessage);
    }
    throw error;
  }
};

// Fonction pour modifier un article
export const updateQuotationItemService = async (
  Quotation,
  itemNumber,
  article,
  qte
) => {
  try {
    const mandant = await AsyncStorage.getItem("mandant");
    const QuotationNumber = formatNumber(Quotation);
    const response = await axiosInstance.patch(
      `API_SALES_Quotation_SRV/A_SalesQuotationItem(SalesQuotation='${QuotationNumber}',SalesQuotationItem='${itemNumber}')?sap-client=${mandant}`,
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
        "Une erreur s'est produite lors de la création de la Quotation";
      throw new Error(errorMessage);
    }
    throw error;
  }
};

// Fonction pour modifier un article
export const addQuotationItemService = async (Quotation, article, qte) => {
  try {
    const mandant = await AsyncStorage.getItem("mandant");
    const QuotationNumber = formatNumber(Quotation);
    const response = await axiosInstance.post(
      `API_SALES_Quotation_SRV/A_SalesQuotationItem?sap-client=${mandant}`,
      {
        SalesQuotation: QuotationNumber,
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
        "Une erreur s'est produite lors de la création de la Quotation";
      throw new Error(errorMessage);
    }
    throw error;
  }
};
