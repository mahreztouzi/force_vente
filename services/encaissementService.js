import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosInstance from "./axiosConfig";

// format number
const formatNUmber = (docNumber, length) => {
  // Convertir en chaîne pour être sûr
  const docString = String(docNumber);

  // Si le numéro a déjà 10 caractères, le retourner tel quel
  if (docString.length === length) {
    return docString;
  }

  // Sinon, ajouter des zéros devant pour atteindre 10 caractères
  return docString.padStart(length, "0");
};

// 1. Fonction pour créer un encaissement
export const createEncaissement = async (data) => {
  try {
    const mandant = await AsyncStorage.getItem("mandant");
    const response = await axiosInstance.post(
      `/ZAPP_ENCAISSEMENT_DDH_SRV/ZTAB_ENCAISSEMNTSet?sap-client=${mandant}`,
      data,
      {
        headers: {
          "X-REQUESTED-WITH": 1,
        },
      }
    );
    return response.data?.d; // Renvoyer les données de la livraison créée
  } catch (error) {
    // Extraire le message d'erreur plus détaillé
    if (error.response && error.response.data && error.response.data.error) {
      const errorMessage =
        error.response.data.error.message?.value ||
        error.response.data.error.message ||
        "Une erreur s'est produite lors de la création de la livraison";
      throw new Error(errorMessage);
    }
    throw error;
  }
};

export const putEncaissement = async (data) => {
  try {
    const mandant = await AsyncStorage.getItem("mandant");
    // const numFacture = formatNUmber(data.Facture, 10);
    const numClient = formatNUmber(data.Client, 10);
    const response = await axiosInstance.put(
      `ZAPP_ENCAISSEMENT_DDH_SRV/ZTAB_ENCAISSEMNTSet(Mandant='200',Id='${data.Id}',Client='${numClient}',Commercial='${data.Commercial}',NumLigne='${data.NumLigne}')?sap-client=${mandant}`,
      data,
      {
        headers: {
          "X-REQUESTED-WITH": 1,
        },
      }
    );
    return response;
  } catch (error) {
    // Extraire le message d'erreur plus détaillé
    if (error.response && error.response.data && error.response.data.error) {
      const errorMessage =
        error.response.data.error.message?.value ||
        error.response.data.error.message ||
        "Une erreur s'est produite lors de la création de la livraison";
      throw new Error(errorMessage);
    }
    throw error;
  }
};

// Fonction pour récupérer les factures
export const fetchBills = async (client, commercial) => {
  try {
    const mandant = await AsyncStorage.getItem("mandant");
    const response = await axiosInstance.get(
      `ZBI_LIST_FACTURES_DDH_CDS/zbi_list_factures_ddh?sap-client=${mandant}&$filter=(client eq '${client}' and commercial eq '${commercial}')&$orderby=cmd desc&$format=json`
    );
    console.log("response fetch bills", response);
    return response.data.d.results;
  } catch (error) {
    throw new Error(
      "Erreur lors de la récupération des clients: " + error.message
    );
  }
};

// Fonction pour récupérer les encaissements
export const fetchEncaissements = async (commercial) => {
  try {
    const mandant = await AsyncStorage.getItem("mandant");
    const response = await axiosInstance.get(
      //   `ZBI_LIST_ENCAISS_DDH_CDS/zbi_list_encaiss_ddh?$filter=(Facture eq '${facture}' and Commercial eq '${commercial}' and Client eq '${client}')&$format=json`

      `ZBI_LIST_ENCAISS_DDH_CDS/zbi_list_encaiss_ddh?sap-client=${mandant}&$filter=(Commercial eq '${commercial}')&$orderby=NumLigne desc&$format=json`
    );
    return response.data.d.results;
  } catch (error) {
    throw new Error(
      "Erreur lors de la récupération des clients: " + error.message
    );
  }
};

// Fonction pour supprimé un encaissements
export const deleteEncaissements = async (id, client, commercial, numLigne) => {
  try {
    // const numFacture = formatNUmber(facture, 10);
    const mandant = await AsyncStorage.getItem("mandant");
    const numClient = formatNUmber(client, 10);

    const response = await axiosInstance.delete(
      `ZAPP_ENCAISSEMENT_DDH_SRV/ZTAB_ENCAISSEMNTSet(Mandant='200',Id='${id}',Client='${numClient}',Commercial='${commercial}',NumLigne='${numLigne}')?sap-client=${mandant}`,
      {
        headers: {
          "X-REQUESTED-WITH": 1,
        },
      }
    );

    return response;
  } catch (error) {
    console.log("response dans slice encaisssment", error);
    throw new Error(
      "Erreur lors de la récupération des clients: " + error.message
    );
  }
};
