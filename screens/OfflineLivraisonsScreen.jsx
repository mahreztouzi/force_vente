import React, {
  useLayoutEffect,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  FlatList,
  Alert,
  RefreshControl,
  BackHandler,
} from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Modalize } from "react-native-modalize";
import {
  getOfflineActionQueue,
  removeFromOfflineQueue,
  clearOfflineQueue,
  updateOfflineAction,
} from "../utils/offlineUtils";
import { useDispatch, useSelector } from "react-redux";
import { completeDeliveryProcess } from "../services/outboundService";
import {
  fetchPendingActionsCount,
  loadOfflineOrders,
  retryFailedOrder,
  loadOfflineLivraisons,
} from "../redux/slices/offlineSlice";
import { syncOfflineData } from "../redux/offlineActions/offlineActions";
import { updateOrderToNotLiv } from "../redux/slices/orderSlice";
import {
  updateStockAfterDelivery,
  updateStockAfterNotDelivery,
} from "../redux/slices/stockSlice";
import DeliveryProcessModal from "../components/DeliveryProcessModal";
import {
  getAutorisedDate,
  processDeliveryComplete,
  resetDeliveryProcess,
} from "../redux/slices/outboundSlice";
import { wp, hp, fs, fontWeight, scale } from "../utils/responsive";
import { generateA4InvoicePDF } from "../utils/pdf/pdfGenerators";

const OfflineLivraisonsScreen = ({ client }) => {
  const navigation = useNavigation();
  // const { client } = route.params;
  const clientName = client?.name1;
  const pdfClientName = client?.name1;
  const dispatch = useDispatch();
  const { offlineLivraisons, isServerReachable } = useSelector(
    (state) => state.offline,
  );
  const { ordersApprouve } = useSelector((state) => state.orders);
  const deliveryProcess = useSelector(
    (state) => state.deliveries.deliveryProcess,
  );
  const { dateAutorise } = useSelector((state) => state.outbounds);
  const userData = useSelector((state) => state.auth.user);
  const [loading, setLoading] = useState(false);
  const [selectedLivraison, setSelectedLivraison] = useState(null);
  const [isDateAuthorized, setIsDateAuthorized] = useState(true);
  const [isDateChecked, setIsDateChecked] = useState(false);
  const isProcessing = deliveryProcess?.isProcessing || false;
  const modalizeRef = useRef(null);
  const processModalRef = useRef(null);
  const [codeSociete, setCodeSociete] = useState(null);

  useFocusEffect(
    useCallback(() => {
      dispatch(loadOfflineLivraisons(client));
    }, []),
  );
  useEffect(() => {
    const handleBackPress = async () => {
      // Si le processus est en cours, BLOQUER complètement
      if (isProcessing) {
        return true; // Bloque la navigation
      }

      navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress,
    );

    return () => backHandler.remove();
  }, [navigation, isProcessing]);

  // recuperere le code societe
  useEffect(() => {
    if (selectedLivraison && ordersApprouve.length > 0) {
      // Récupérer les items de livraison
      const deliveryItems =
        selectedLivraison.payload.deliveryData.to_DeliveryDocumentItem?.results;
      if (deliveryItems && deliveryItems.length > 0) {
        // Récupérer le premier numéro de bon de commande
        const firstCommandeNumber = deliveryItems[0]?.ReferenceSDDocument;
        const firstItemNumber = deliveryItems[0]?.ReferenceSDDocumentItem;

        if (firstCommandeNumber && firstItemNumber) {
          // Trouver l'ordre correspondant dans ordersApprouve
          const matchingOrder = ordersApprouve.find(
            (order) =>
              order.cmd === firstCommandeNumber &&
              order.posnr === firstItemNumber,
          );
          if (matchingOrder) {
            const societeCode = matchingOrder.bukrs;
            setCodeSociete(societeCode);
          }
        }
      }
    }
  }, [selectedLivraison, ordersApprouve]);

  const checkDateAuthorization = (dateAutorise) => {
    if (dateAutorise.length != 0) {
      try {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear().toString();

        // Convertir les mois autorisés en nombres pour la comparaison
        const mois1Num = parseInt(dateAutorise.mois1, 10);
        const mois2Num = parseInt(dateAutorise.mois2, 10);
        const mois3Num = parseInt(dateAutorise.mois3, 10);
        const lfmonNum = parseInt(dateAutorise.lfmon, 10);

        // Vérifier si tout les mois autorisés sont valide pour le mois actuel
        const isMonthValid =
          mois1Num >= currentMonth &&
          dateAutorise.annee1 === currentYear &&
          mois2Num >= currentMonth &&
          dateAutorise.annee2 === currentYear &&
          mois3Num >= currentMonth &&
          dateAutorise.annee3 === currentYear &&
          lfmonNum >= currentMonth &&
          dateAutorise.lfgja === currentYear;

        return {
          dateAuthorized: isMonthValid,
          dateChecked: true,
        };
      } catch (error) {
        console.error("Erreur lors de la vérification des dates:", error);
        // En cas d'erreur, on autorise par défaut
        return {
          dateAuthorized: true,
          dateChecked: true,
        };
      }
    }

    // Si dateAutorise est vide, retourner des valeurs par défaut
    return {
      dateAuthorized: false,
      dateChecked: false,
    };
  };

  useEffect(() => {
    if (codeSociete) {
      dispatch(
        getAutorisedDate({
          bukrs: codeSociete,
        }),
      );
    }
  }, [dispatch, codeSociete, selectedLivraison]);

  const handleClearAllLivraisons = () => {
    if (offlineLivraisons?.length === 0) {
      Alert.alert("Information", "Aucune livraison hors ligne à supprimer");
      return;
    }

    Alert.alert(
      "Confirmation",
      "Voulez-vous supprimer toutes les livraisons hors ligne ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer tout",
          style: "destructive",
          onPress: async () => {
            try {
              await clearOfflineQueue();
              Alert.alert(
                "Succès",
                "Toutes les livraisons hors ligne ont été supprimées",
              );
              await dispatch(loadOfflineLivraisons(client));
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer les livraisons");
            }
          },
        },
      ],
    );
  };

  const openLivraisonActions = (livraisonAction) => {
    setSelectedLivraison(livraisonAction);
    modalizeRef.current?.open();
  };

  // Nouvelle fonction pour marquer une livraison comme imprimée
  const markAsEternal = async (livraisonId) => {
    try {
      await updateOfflineAction(livraisonId, {
        imprime: true,
        offlineStatus: true,
      });
      await dispatch(loadOfflineLivraisons(client));
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
    }
  };

  // Fonction d'impression modifiée pour les livraisons hors ligne
  // const handlePrintOfflineDelivery = async () => {
  //   if (!selectedLivraison) return;

  //   try {
  //     console.log("Impression de la livraison hors ligne...");
  //     console.log("Impression de la livraison hors ligne", selectedLivraison);

  //     // Générer le contenu HTML pour l'impression
  //     const htmlContent = generateThermalPDFContentOffline(selectedLivraison);

  //     // Fermer le modal
  //     modalizeRef.current?.close();

  //     // Marquer comme imprimée avant la navigation
  //     await markAsEternal(selectedLivraison.id);

  //     // Naviguer vers l'écran PDF
  //     navigation.navigate("PDFViewerScreen", {
  //       htmlContent: htmlContent,
  //       deliveryId: selectedLivraison.id, // Utiliser l'ID de l'action hors ligne
  //       orderData: {
  //         cmd: selectedLivraison.payload.deliveryData.to_DeliveryDocumentItem
  //           .results[0]?.ReferenceSDDocument,
  //         client: client.kunnr,
  //         clientName: clientName || "N/A",
  //       },
  //       deliveryItems:
  //         selectedLivraison.payload.deliveryData.to_DeliveryDocumentItem
  //           .results,
  //       userData: selectedLivraison.userData || {},
  //       isOffline: true, // Indicateur pour différencier du mode en ligne
  //       clientData: client,
  //     });
  //   } catch (error) {
  //     console.error("Erreur lors de l'impression:", error);
  //     Alert.alert(
  //       "Erreur",
  //       "Impossible d'imprimer le document. Veuillez réessayer.",
  //       [{ text: "OK" }]
  //     );
  //   }
  // };

  const handlePrintOfflineDelivery = async () => {
    if (!selectedLivraison) return;

    try {
      console.log("Impression de la livraison hors ligne...");

      // Récupérer les données de livraison
      const deliveryItems =
        selectedLivraison.payload.deliveryData.to_DeliveryDocumentItem.results;
      const commandeNumber = deliveryItems[0]?.ReferenceSDDocument;

      // Mapper les données de livraison avec les commandes approuvées
      const enrichedDeliveryItems = deliveryItems.map((deliveryItem) => {
        // Trouver la commande correspondante dans ordersApprouve
        const matchingOrder = ordersApprouve.find(
          (order) =>
            order.cmd === deliveryItem.ReferenceSDDocument &&
            order.posnr === deliveryItem.ReferenceSDDocumentItem,
        );
        return {
          ...deliveryItem,
          // Données enrichies depuis ordersApprouve
          Material: matchingOrder?.matnr || deliveryItem.Material || "N/A",
          ProductDescription:
            matchingOrder?.maktx ||
            deliveryItem.ProductDescription ||
            "Article",
          kbetr: matchingOrder?.prix_unitaire || deliveryItem.kbetr || 0,
          DeliveryQuantityUnit:
            matchingOrder?.kmein || deliveryItem.DeliveryQuantityUnit || "",
          clientCode: matchingOrder?.client || "N/A",
          commercial: matchingOrder?.commercial || "N/A",
          ttc: matchingOrder?.ttc || 0,
          remise_pourcentage: matchingOrder?.remise_pourcentage || 0,
        };
      });

      // Récupérer les informations client depuis la première commande trouvée
      const firstMatchingOrder = ordersApprouve.find(
        (order) => order.cmd === commandeNumber,
      );

      const clientInfo = {
        kunnr: firstMatchingOrder?.client || "N/A",
        clientName: pdfClientName || firstMatchingOrder?.clientName || "N/A",
      };

      // Calculer le montant total
      const totalPrice = enrichedDeliveryItems.reduce(
        (sum, item) =>
          sum +
          parseFloat(item.ActualDeliveryQuantity || 0) *
            parseFloat(item.kbetr || 0),
        0,
      );

      // Transformation des données au format requis pour l'impression
      const transformedData = {
        numero: selectedLivraison.id,
        date: new Date().toLocaleDateString("fr-FR"),
        heure: new Date().toLocaleTimeString("fr-FR"),
        clientId: clientInfo.kunnr,
        clientNom: clientInfo.clientName,
        livreur: userData?.magasin || "N/A",
        articles: enrichedDeliveryItems.map((item) => ({
          code: item.Material,
          description: item.ProductDescription,
          quantite: parseFloat(item.ActualDeliveryQuantity || 0).toString(),
          unite: item.DeliveryQuantityUnit,
          lot: item.lot || "-",
          prixUnitaire: item.kbetr || 0,
          prix: parseFloat(item.kbetr).toLocaleString("fr-DZ", {
            style: "currency",
            currency: "DZD",
            minimumFractionDigits: 2,
          }),
        })),
        totalMontant: totalPrice || 0,
        total: totalPrice.toLocaleString("fr-DZ", {
          style: "currency",
          currency: "DZD",
          minimumFractionDigits: 2,
        }),
      };

      // Générer le contenu HTML pour l'impression
      const htmlContent = generateThermalPDFContentOffline(selectedLivraison);
      const htmlContentPDFA4 = generateA4InvoicePDF(transformedData);

      // Fermer le modal
      modalizeRef.current?.close();

      // Marquer comme imprimée avant la navigation
      await markAsEternal(selectedLivraison.id);

      // Naviguer vers l'écran PDF avec toutes les données nécessaires
      navigation.navigate("PDFViewerScreen", {
        htmlContent: htmlContentPDFA4,
        htmlContentThermal: htmlContent,
        deliveryId: selectedLivraison.id, // Utiliser l'ID de l'action hors ligne
        documentType: "livraison",
        orderData: {
          cmd: commandeNumber,
          client: clientInfo.kunnr,
          clientName: clientInfo.clientName,
        },
        deliveryItems: enrichedDeliveryItems,
        userData: selectedLivraison.userData || userData || {},
        isOffline: true, // Indicateur pour différencier du mode en ligne
        clientData: clientInfo,
        deliveryData: transformedData, // Ajouter les données transformées
      });
    } catch (error) {
      console.error("Erreur lors de l'impression:", error);
      Alert.alert(
        "Erreur",
        "Impossible d'imprimer le document. Veuillez réessayer.",
        [{ text: "OK" }],
      );
    }
  };
  // Fonction pour générer le contenu HTML pour l'impression hors ligne
  const generateThermalPDFContentOffline = (livraisonAction) => {
    const currentDate = new Date().toLocaleDateString("fr-FR");
    const currentTime = new Date().toLocaleTimeString("fr-FR");
    const deliveryItems =
      livraisonAction.payload.deliveryData.to_DeliveryDocumentItem.results;
    const commandeNumber = deliveryItems[0]?.ReferenceSDDocument;

    // Mapper les données de livraison avec les commandes approuvées
    const enrichedDeliveryItems = deliveryItems.map((deliveryItem) => {
      // Trouver la commande correspondante dans ordersApprouve
      const matchingOrder = ordersApprouve.find(
        (order) =>
          order.cmd === deliveryItem.ReferenceSDDocument &&
          order.posnr === deliveryItem.ReferenceSDDocumentItem,
      );
      return {
        ...deliveryItem,
        // Données enrichies depuis ordersApprouve
        Material: matchingOrder?.matnr || deliveryItem.Material || "N/A",
        ProductDescription:
          matchingOrder?.maktx || deliveryItem.ProductDescription || "Article",
        kbetr: matchingOrder?.prix_unitaire || deliveryItem.kbetr || 0,
        DeliveryQuantityUnit:
          matchingOrder?.kmein || deliveryItem.DeliveryQuantityUnit || "",
        clientCode: matchingOrder?.client || "N/A",
        commercial: matchingOrder?.commercial || "N/A",
        ttc: matchingOrder?.ttc || 0,
        remise_pourcentage: matchingOrder?.remise_pourcentage || 0,
      };
    });

    // Récupérer les informations client depuis la première commande trouvée
    const firstMatchingOrder = ordersApprouve.find(
      (order) => order.cmd === commandeNumber,
    );

    const client = {
      kunnr: firstMatchingOrder?.client || "N/A",
      clientName: pdfClientName,
    };

    // const clientNamee = client?.name1; // Vous pouvez ajuster selon vos données
    const commercial = firstMatchingOrder?.commercial || "N/A";

    // Calculer les totaux avec les données enrichies
    const totalItems = enrichedDeliveryItems.length;
    const totalQuantity = enrichedDeliveryItems.reduce(
      (sum, item) => sum + parseFloat(item.ActualDeliveryQuantity || 0),
      0,
    );
    const totalPrice = enrichedDeliveryItems.reduce(
      (sum, item) =>
        sum +
        parseFloat(item.ActualDeliveryQuantity || 0) *
          parseFloat(item.kbetr || 0),
      0,
    );

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bon de Livraison</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 2mm;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Courier New', monospace;
            font-size: 20px;
            line-height: 1.2;
            width: 76mm;
            color: #000;
            background: white;
          }
          
          .receipt-container {
            width: 100%;
            padding: 2mm;
          }
          
          .header {
            text-align: center;
            border-bottom: 1px dashed #000;
            padding-bottom: 3mm;
            margin-bottom: 3mm;
          }
          
          .company-name {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 1mm;
          }
          
          .document-title {
            font-size: 20px;
            font-weight: bold;
            margin: 2mm 0;
            text-transform: uppercase;
          }
          
          .delivery-number {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 1mm;
          }
          
          .info-section {
            margin: 3mm 0;
            font-size: 16px;
          }
          
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 1mm;
            align-items: flex-start;
          }
          
          .info-label {
            font-weight: bold;
            min-width: 25mm;
            font-size: 16px;
          }
          
          .info-value {
            text-align: right;
            flex: 1;
            word-wrap: break-word;
            font-size: 16px;
          }
          
          .separator {
            border-top: 1px dashed #000;
            margin: 3mm 0;
          }
          
          .items-header {
            font-weight: bold;
            border-bottom: 1px solid #000;
            padding: 1mm 0;
            margin-bottom: 2mm;
            font-size: 14px;
          }
          
          .item-row {
            margin-bottom: 2mm;
            padding-bottom: 2mm;
            font-size: 12px;
            font-weight: bold;
          }
          
          .item-code {
            font-weight: bold;
            margin-bottom: 0.5mm;
            font-size: 12px;
          }
          
          .item-desc {
            margin-bottom: 1mm;
            word-wrap: break-word;
            font-size: 12px;
          }
          
          .details-container {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            margin-top: 1mm;
          }
          
          .separator-article {
            border-top: 1px dashed #000;
            margin-bottom: 1mm;
          }
          
          .separator-details {
            border-top: 1px solid #000;
            margin-bottom: 1mm;
            width: 65%;
          }
          
          .item-details {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 10px;
            font-weight: bold;
            color: black;
            margin-bottom: 0.5mm;
            width: 65%;
          }
          
          .quantity-box {
            text-align: left;
            font-weight: bold;
            font-size: 10px;
          }
          
          .quantity-box-val {
            text-align: right;
            font-weight: bold;
            font-size: 10px;
          }
          
          .totals {
            border-top: 1px solid #000;
            padding-top: 2mm;
            margin-top: 3mm;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 1mm;
            font-weight: bold;
            font-size: 16px;
            color: black;
          }
          
          .footer {
            text-align: center;
            margin-top: 5mm;
            padding-top: 3mm;
            border-top: 1px dashed #000;
            font-size: 22px;
          }
          
          .offline-indicator {
            background-color: #FFF3E0;
            border: 1px solid #FF9800;
            padding: 2mm;
            margin: 2mm 0;
            text-align: center;
            font-size: 12px;
            color: #E65100;
          }
          
          @media print {
            body { 
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <!-- En-tête -->
          <div class="header">
            <div class="document-title">Bon de Facture</div>
            <div class="delivery-number">N° ${livraisonAction.id}</div>
          </div>  
          <!-- Informations générales -->
          <div class="info-section">
            <div class="info-row">
              <span class="info-label">Date :</span>
              <span class="info-value">${currentDate}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Heure :</span>
              <span class="info-value">${currentTime}</span>
            </div>
               <!-- 
               <div class="info-row">
                 <span class="info-label">Commande :</span>
                 <span class="info-value">${commandeNumber}</span>
               </div>
               -->
            <div class="info-row">
              <span class="info-label">Code Client :</span>
              <span class="info-value">${client.kunnr}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Nom Client:</span>
              <span class="info-value">${client.clientName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Livreur :</span>
              <span class="info-value">${userData.magasin}</span>
            </div>
               <!-- 
                 <div class="info-row">
              <span class="info-label">Livreur:</span>
              <span class="info-value">${
                livraisonAction.userData?.name ||
                livraisonAction.userData?.code ||
                "N/A"
              }</span>
            </div>
               
               -->
          
          </div>
  
          <div class="separator"></div>
  
          <!-- Articles -->
          <div class="items-header">ARTICLES LIVRES</div>
          
          ${enrichedDeliveryItems
            .map(
              (item, index) => `
              <div class="item-row">
                ${index !== 0 ? '<div class="separator-article"></div>' : ""}
                <div class="item-code">${item.Material}</div>
                <div class="item-desc">${item.ProductDescription}</div>
                <div class="details-container">
                  <div class="separator-details"></div>
                  <div class="item-details">
                    <span class="quantity-box">Qté livrée :</span>
                    <span class="quantity-box-val">${parseFloat(
                      item.ActualDeliveryQuantity || 0,
                    )} ${item.DeliveryQuantityUnit}</span>
                  </div>
                  <div class="item-details">
                    <span class="quantity-box">Prix unitaire :</span>
                    <span class="quantity-box-val">${parseFloat(
                      item.kbetr || 0,
                    ).toFixed(2)} DA</span>
                  </div>
                  ${
                    item.remise_pourcentage > 0
                      ? `
                  <div class="item-details">
                    <span class="quantity-box">Remise :</span>
                    <span class="quantity-box-val">${parseFloat(
                      item.remise_pourcentage,
                    ).toFixed(2)}%</span>
                  </div>
                  `
                      : ""
                  }
                </div>
              </div>
            `,
            )
            .join("")}
  
          <!-- Totaux -->
          <div class="totals">
             <!--
                  <div class="total-row">
              <span>Total articles:</span>
              <span>${totalItems}</span>
            </div>
            <div class="total-row">
              <span>Quantité totale:</span>
              <span>${totalQuantity}</span>
            </div>
             -->
       
            <div class="total-row">
              <span>Total :</span>
              <span>${totalPrice.toFixed(2)} DA</span>
            </div>
          </div>
  
          <!-- Pied de page -->
          <div class="footer">
            <div>Merci pour votre confiance</div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleDeleteLivraison = () => {
    modalizeRef.current?.close();
    if (!selectedLivraison) return;

    // Vérifier si la livraison a été imprimée
    if (selectedLivraison.imprime) {
      Alert.alert(
        "Action non autorisée",
        "Cette livraison a déjà été imprimée et ne peut plus être supprimée.",
      );
      return;
    }
    console.log("offline selected livraison", selectedLivraison);

    const numeroDocument =
      selectedLivraison.payload.deliveryData.to_DeliveryDocumentItem.results[0]
        .ReferenceSDDocument;
    Alert.alert(
      "Confirmation",
      "Voulez-vous supprimer cette livraison de la file d'attente ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await removeFromOfflineQueue(selectedLivraison.id);
              await dispatch(loadOfflineLivraisons(client));
              await dispatch(fetchPendingActionsCount());
              await dispatch(updateOrderToNotLiv(numeroDocument));
              await dispatch(
                updateStockAfterNotDelivery({
                  deliveryItems:
                    selectedLivraison.payload.deliveryData
                      .to_DeliveryDocumentItem.results,
                  ordersApprouve: ordersApprouve,
                }),
              );
              Alert.alert("Succès", "Livraison supprimée de la file d'attente");
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer la livraison");
            }
          },
        },
      ],
    );
  };
  const handleDeleteLivraisonAfterProcess = async () => {
    modalizeRef.current?.close();
    if (!selectedLivraison) return;
    try {
      const numeroDocument =
        selectedLivraison.payload.deliveryData.to_DeliveryDocumentItem
          .results[0].ReferenceSDDocument;
      await removeFromOfflineQueue(selectedLivraison.id);
      await dispatch(loadOfflineLivraisons(client));
      await dispatch(fetchPendingActionsCount());
      await dispatch(updateOrderToNotLiv(numeroDocument));
    } catch (error) {
      Alert.alert("Erreur", "Impossible de supprimer la livraison");
    }
  };

  const handleEditLivraison = () => {
    modalizeRef.current?.close();
    if (!selectedLivraison) return;

    // Vérifier si la livraison a été imprimée
    if (selectedLivraison.imprime) {
      Alert.alert(
        "Action non autorisée",
        "Cette livraison a déjà été imprimée et ne peut plus être modifiée.",
      );
      return;
    }

    // Récupérer les données de la livraison
    const { payload } = selectedLivraison;
    const error = selectedLivraison?.error;

    // Trouver la commande correspondante dans ordersApprouve
    const commandeNumber =
      payload.deliveryData.to_DeliveryDocumentItem.results[0]
        ?.ReferenceSDDocument;
    const originalOrder = ordersApprouve.find(
      (order) => order.cmd === commandeNumber,
    );

    if (!originalOrder) {
      Alert.alert(
        "Erreur",
        "Impossible de retrouver les données de la commande originale",
      );
      return;
    }

    // Créer l'objet order pour l'écran d'édition
    const orderForEdit = {
      cmd: commandeNumber,
      client: originalOrder.client,
      clientName: originalOrder.clientName || clientName,
      erdat: originalOrder.erdat,
      codeSociete: originalOrder.bukrs,
      articles:
        originalOrder.articles ||
        ordersApprouve
          .filter((item) => item.cmd === commandeNumber)
          .map((item) => ({
            matnr: item.matnr,
            posnr: item.posnr,
            charg: item.charg,
            designation: item.maktx,
            kmein: item.kmein,
            lsmeng: item.lsmeng,
            qte_restante: item.qte_restante,
          })),
    };

    // Transformer les items de livraison en format attendu par l'écran d'édition
    const livraisonItems =
      payload.deliveryData.to_DeliveryDocumentItem.results.map((item) => {
        // Trouver l'article correspondant dans la commande originale
        const originalArticle = orderForEdit.articles.find(
          (article) => article.posnr === item.ReferenceSDDocumentItem,
        );

        return {
          id: originalArticle?.matnr || "Unknown",
          posnr: item.ReferenceSDDocumentItem,
          charg: originalArticle?.charg || "",
          designation:
            originalArticle?.designation ||
            `Article ${item.ReferenceSDDocumentItem}`,
          unite: item.DeliveryQuantityUnit,
          qteCommandee: parseFloat(originalArticle?.lsmeng || 0),
          qteRestante: parseFloat(originalArticle?.qte_restante || 0),
          qteALivrer: parseFloat(item.ActualDeliveryQuantity),
        };
      });

    navigation.navigate("edit_offline_livraison", {
      livraisonAction: selectedLivraison,
      order: orderForEdit,
      livraisonItems,
      error,
      onEditComplete: handleRefresh,
    });
  };

  const getLivraisonTypeDisplay = (action) => {
    const hasError = action.failed;
    const isPrinted = action.imprime;

    if (hasError) {
      return {
        type: "Livraison en erreur",
        icon: "error",
        color: "#F44336",
      };
    } else if (isPrinted) {
      return {
        type: "Livraison imprimée",
        icon: "print",
        color: "#4CAF50",
      };
    } else {
      return {
        type: "Livraison",
        icon: "local-shipping",
        color: "#2196F3",
      };
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleRefresh = async () => {
    await dispatch(loadOfflineLivraisons(client));
    await dispatch(fetchPendingActionsCount());
    if (codeSociete) {
      dispatch(
        getAutorisedDate({
          bukrs: codeSociete,
        }),
      );
    }
  };

  const handleRetryLivraison = async (hasError) => {
    modalizeRef.current?.close();
    if (!selectedLivraison) return;

    const executeSync = async () => {
      try {
        if (hasError) {
          await dispatch(retryFailedOrder(selectedLivraison.id));
        }
        await dispatch(resetDeliveryProcess());
        processModalRef.current?.open();

        const result = await dispatch(
          processDeliveryComplete({
            deliveryData: selectedLivraison.payload.deliveryData,
            offlineOutboundID: selectedLivraison.id,
          }),
        );
        await handleRefresh();
      } catch (error) {
        console.error("Erreur lors de l'opération:", error);
        Alert.alert(
          "Erreur",
          `Impossible de ${
            hasError ? "réessayer" : "synchroniser"
          } la livraison`,
        );
      }
    };

    if (hasError) {
      Alert.alert("Confirmation", "Voulez-vous réessayer cette livraison ?", [
        { text: "Annuler", style: "cancel" },
        { text: "Réessayer", onPress: executeSync },
      ]);
    } else {
      await executeSync();
    }
  };

  const renderOfflineLivraison = ({ item }) => {
    const livraisonType = getLivraisonTypeDisplay(item);
    const itemCount =
      item.payload.deliveryData.to_DeliveryDocumentItem?.results?.length || 0;
    const hasError = item.failed;
    const isPrinted = item.imprime;
    const commandeNumber =
      item.payload.deliveryData.to_DeliveryDocumentItem.results[0]
        ?.ReferenceSDDocument;

    return (
      <TouchableOpacity
        style={[
          styles.livraisonCard,
          hasError && styles.livraisonCardError,
          isPrinted && styles.livraisonCardPrinted,
        ]}
        onPress={() => openLivraisonActions(item)}
        activeOpacity={0.7}
      >
        <View style={styles.livraisonHeader}>
          <View style={styles.livraisonTypeContainer}>
            <View style={styles.livraisonIconContainer}>
              <MaterialIcons
                name={livraisonType.icon}
                size={24}
                color={livraisonType.color}
              />
            </View>
            <View style={styles.livraisonTypeInfo}>
              <Text
                style={[styles.livraisonType, { color: livraisonType.color }]}
              >
                {livraisonType.type}
              </Text>
              <Text style={styles.commandeRef}>Commande: {commandeNumber}</Text>
            </View>
          </View>
          <MaterialIcons name="more-vert" size={24} color="#757575" />
        </View>

        <View style={styles.livraisonDetails}>
          <View style={styles.detailRow}>
            <MaterialIcons name="assignment" size={16} color="#757575" />
            <Text style={styles.detailText}>
              {itemCount} article{itemCount > 1 ? "s" : ""} à livrer
            </Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialIcons name="access-time" size={16} color="#757575" />
            <Text style={styles.detailText}>
              Créé le: {formatDate(item.timestamp)}
            </Text>
          </View>

          {isPrinted && (
            <View style={styles.detailRow}>
              <MaterialIcons name="print" size={16} color="#4CAF50" />
              <Text style={[styles.detailText, { color: "#4CAF50" }]}>
                Document imprimé
              </Text>
            </View>
          )}

          {hasError && (
            <View style={styles.detailRow}>
              <MaterialIcons name="error-outline" size={16} color="#F44336" />
              <Text style={[styles.detailText, styles.errorText]}>
                {item.error}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderActionModal = () => {
    if (!selectedLivraison) return null;

    const hasError = selectedLivraison.failed;
    const isPrinted = selectedLivraison.imprime;

    return (
      <View style={styles.modalContent}>
        <View style={styles.actionModalContainer}>
          <Text style={styles.actionModalTitle}>Actions</Text>

          {/* Bouton Imprimer - toujours disponible */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handlePrintOfflineDelivery}
          >
            <MaterialIcons name="print" size={24} color="#4CAF50" />
            <Text style={styles.actionButtonText}>
              {isPrinted ? "Réimprimer" : "Imprimer"} la livraison
            </Text>
          </TouchableOpacity>

          {/* Bouton Modifier - désactivé si imprimé */}
          {/* <TouchableOpacity
            style={[
              styles.actionButton,
              isPrinted && styles.actionButtonDisabled,
            ]}
            onPress={handleEditLivraison}
            disabled={isPrinted}
          >
            <MaterialIcons
              name="edit"
              size={24}
              color={isPrinted ? "#BDBDBD" : "#2196F3"}
            />
            <Text
              style={[
                styles.actionButtonText,
                isPrinted && styles.actionButtonTextDisabled,
              ]}
            >
              Modifier la livraison
            </Text>
          </TouchableOpacity> */}

          {/* Bouton Synchroniser - disponible si serveur accessible */}
          {isServerReachable && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleRetryLivraison(hasError)}
            >
              <MaterialIcons name="refresh" size={24} color="#FF9800" />
              <Text style={styles.actionButtonText}>
                {hasError
                  ? "Réessayer la livraison"
                  : "Synchroniser la livraison"}
              </Text>
            </TouchableOpacity>
          )}

          {/* Bouton Supprimer - désactivé si imprimé */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.deleteButton,
              isPrinted && styles.actionButtonDisabled,
            ]}
            onPress={handleDeleteLivraison}
            disabled={isPrinted}
          >
            <MaterialIcons
              name="delete"
              size={24}
              color={isPrinted ? "#BDBDBD" : "#F44336"}
            />
            <Text
              style={[
                styles.actionButtonText,
                styles.deleteButtonText,
                isPrinted && styles.actionButtonTextDisabled,
              ]}
            >
              Supprimer la livraison
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => modalizeRef.current?.close()}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  const handleCloseModal = () => {
    dispatch(resetDeliveryProcess());
    // navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {offlineLivraisons?.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="local-shipping" size={64} color="#E0E0E0" />
          <Text style={styles.emptyTitle}>Aucune livraison hors ligne</Text>
          <Text style={styles.emptySubtitle}>
            Toutes vos livraisons sont synchronisées
          </Text>
        </View>
      ) : (
        <FlatList
          data={offlineLivraisons}
          renderItem={renderOfflineLivraison}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={handleRefresh}
              colors={["#03A9F4", "#FFC107", "#4CAF50"]}
            />
          }
        />
      )}

      <Modalize
        ref={modalizeRef}
        adjustToContentHeight
        withHandle={false}
        modalStyle={styles.modal}
        overlayStyle={styles.overlay}
      >
        {renderActionModal()}
      </Modalize>
      <DeliveryProcessModal
        ref={processModalRef}
        orderNumber={
          selectedLivraison?.payload.deliveryData.to_DeliveryDocumentItem
            .results[0]?.ReferenceSDDocument
        }
        // onPrintDelivery={handlePrintDelivery}
        onClose={handleCloseModal}
      />
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: wp(7.8), // 32/412 * 100 ≈ 7.8
  },
  emptyTitle: {
    fontSize: fs(18),
    fontWeight: fontWeight.semiBold,
    color: "#424242",
    marginTop: hp(1.7), // 16/915 * 100 ≈ 1.7
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: fs(14),
    color: "#757575",
    marginTop: hp(0.9), // 8/915 * 100 ≈ 0.9
    textAlign: "center",
  },
  listContainer: {
    paddingTop: hp(1.7), // 16/915 * 100 ≈ 1.7
  },
  livraisonCard: {
    backgroundColor: "white",
    padding: wp(3.9), // 16/412 * 100 ≈ 3.9
    marginBottom: hp(0.1), // 1/915 * 100 ≈ 0.1
  },
  livraisonCardError: {
    borderLeftWidth: scale(4),
    borderLeftColor: "#F44336",
  },
  livraisonHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(1.3), // 12/915 * 100 ≈ 1.3
  },
  livraisonTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  livraisonIconContainer: {
    width: wp(9.7), // 40/412 * 100 ≈ 9.7
    height: wp(9.7), // 40/412 * 100 ≈ 9.7 (square)
    borderRadius: scale(20),
    backgroundColor: "rgba(195, 202, 200, 0.22)",
    justifyContent: "center",
    alignItems: "center",
  },
  livraisonTypeInfo: {
    marginLeft: wp(2.9), // 12/412 * 100 ≈ 2.9
  },
  livraisonType: {
    fontSize: fs(16),
    fontWeight: fontWeight.semiBold,
  },
  commandeRef: {
    fontSize: fs(10),
    color: "#757570",
    marginTop: hp(0.2), // 2/915 * 100 ≈ 0.2
  },
  livraisonDetails: {
    gap: hp(0.9), // 8/915 * 100 ≈ 0.9
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    fontSize: fs(14),
    color: "#424242",
    marginLeft: wp(1.9), // 8/412 * 100 ≈ 1.9
    flex: 1,
  },
  errorText: {
    color: "#F44336",
  },
  actionModalContainer: {
    padding: wp(5.8), // 24/412 * 100 ≈ 5.8
  },
  actionModalTitle: {
    fontSize: fs(18),
    fontWeight: fontWeight.bold,
    marginBottom: hp(2.6), // 24/915 * 100 ≈ 2.6
    textAlign: "center",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: hp(1.7), // 16/915 * 100 ≈ 1.7
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  actionButtonText: {
    fontSize: fs(16),
    marginLeft: wp(3.9), // 16/412 * 100 ≈ 3.9
    color: "#333",
  },
  actionButtonTextDisabled: {
    color: "#6666",
  },
  deleteButton: {
    borderBottomWidth: 0,
    marginBottom: hp(1.7), // 16/915 * 100 ≈ 1.7
  },
  deleteButtonText: {
    color: "#F44336",
  },
  cancelButton: {
    backgroundColor: "#EEEEEE",
    borderRadius: scale(8),
    padding: wp(3.9), // 16/412 * 100 ≈ 3.9
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: fs(16),
    color: "#333",
    fontWeight: fontWeight.medium,
  },
  overlay: {
    backgroundColor: "rgba(209, 214, 222, 0.25)",
  },
});

export default OfflineLivraisonsScreen;
