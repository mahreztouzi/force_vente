import axiosInstance from "./axiosConfig";

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

//  Fonction pour impression formulaire
export const printForms = async (deliveryDocument, typeForms) => {
  try {
    const formatNUmDelivery = formatDeliveryDocument(deliveryDocument);

    const response = await axiosInstance.get(
      `/ZAPP_SMARTFORMS_DDH_SRV/ebelnSet(VBELN='${formatNUmDelivery}',TYPE='${typeForms}')/$value`,
      {
        headers: {
          "Content-Type": "application/pdf",
          Accept: "application/pdf",
        },
        responseType: "blob",
      }
    );

    console.log("Réponse reçue:", response.status, response.headers);

    // Vérifier que la réponse contient bien des données
    if (!response.data) {
      throw new Error("Aucune donnée reçue");
    }

    return response;
  } catch (error) {
    console.error("Erreur complète:", error);

    const errorMessage =
      error.response?.data?.error?.message ||
      `Erreur lors de la récupération du PDF: ${error.message}`;
    throw new Error(errorMessage);
  }
};
