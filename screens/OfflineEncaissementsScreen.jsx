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
  TextInput,
} from "react-native";
import {
  MaterialIcons,
  MaterialCommunityIcons,
  FontAwesome,
} from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Modalize } from "react-native-modalize";
import {
  getOfflineActionQueue,
  removeFromOfflineQueue,
  clearOfflineQueue,
  updateOfflineAction,
} from "../utils/offlineUtils";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPendingActionsCount,
  loadAllOfflineEncaissements,
  loadOfflineEncaissements,
  retryFailedEncaissement,
} from "../redux/slices/offlineSlice";
import { syncOfflineData } from "../redux/offlineActions/offlineActions";
import DateField from "react-native-datefield";
import { wp, hp, fs, fontWeight, scale } from "../utils/responsive";
const OfflineEncaissementsScreen = ({ route }) => {
  const navigation = useNavigation();
  const { client } = route.params;
  const clientName = client.name1;
  const dispatch = useDispatch();
  const { offlineEncaissements, isServerReachable } = useSelector(
    (state) => state.offline
  );
  const userData = useSelector((state) => state.auth.user);

  const [loading, setLoading] = useState(false);
  const [selectedEncaissement, setSelectedEncaissement] = useState(null);
  const modalizeRef = useRef(null);

  // Nouveaux états pour la modification
  const formModalizeRef = useRef(null);
  const [formMode, setFormMode] = useState("edit");
  const [dateValue, setDateValue] = useState(new Date());
  const [encaissementForm, setEncaissementForm] = useState({
    Commercial: "",
    Client: "",
    NumLigne: "",
    DateEncaissement: new Date().toISOString().slice(0, 10),
    Montant: "",
    ModePaiement: "ESPECE",
    Reference: "",
  });

  // Modes de paiement disponibles
  const modesPaiement = ["ESPECE", "CHEQUE"];

  useFocusEffect(
    useCallback(() => {
      dispatch(loadOfflineEncaissements(client.kunnr));
    }, [])
  );

  // Fonction pour générer le contenu HTML du PDF thermal pour encaissement offline
  const generateOfflineEncaissementThermalPDFContent = (encaissementData) => {
    const currentDate = new Date().toLocaleDateString("fr-FR");
    const currentTime = new Date().toLocaleTimeString("fr-FR");

    // Formater la date d'encaissement pour les données offline
    const formatEncaissementDate = (dateEncaissement) => {
      if (!dateEncaissement) return currentDate;

      try {
        // Pour les encaissements offline, la date est généralement en format ISO
        return new Date(dateEncaissement).toLocaleDateString("fr-FR");
      } catch (error) {
        console.error("Erreur format date:", error);
        return currentDate;
      }
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reçu d'Encaissement Offline</title>
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
            font-size: 18px;
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
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 1mm;
          }
          
          .document-title {
            font-size: 20px;
            font-weight: bold;
            margin: 2mm 0;
            text-transform: uppercase;
          }
          
          .encaissement-number {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 1mm;
          }
          
          .offline-badge {
            background-color: #FF9800;
            color: white;
            padding: 1mm 2mm;
            border-radius: 2mm;
            font-size: 14px;
            margin: 2mm 0;
            display: inline-block;
          }
          
          .info-section {
            margin: 3mm 0;
            font-size: 16px;
          }
          
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 1mm;
            align-items: flex-end;
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
          
          .payment-section {
            margin: 3mm 0;
            padding: 2mm 0;
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
          }
          
          .payment-title {
            font-weight: bold;
            text-align: center;
            font-size: 18px;
            margin-bottom: 2mm;
            text-transform: uppercase;
          }
          
          .payment-details {
            margin: 2mm 0;
          }
          
          .payment-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 1mm;
            font-size: 16px;
          }
          
          .payment-label {
            font-weight: bold;
          }
          
          .payment-value {
            font-weight: bold;
            text-align: right;
          }
          
          .amount-section {
            text-align: center;
            margin: 3mm 0;
            padding: 2mm;
            border: 2px solid #000;
          }
          
          .amount-label {
            font-size: 16px;
            margin-bottom: 1mm;
          }
          
          .amount-value {
            font-size: 24px;
            font-weight: bold;
            color: #000;
          }
          
          .footer {
            text-align: center;
            margin-top: 5mm;
            padding-top: 3mm;
            border-top: 1px dashed #000;
            font-size: 16px;
          }
          
          .signature-section {
            margin-top: 5mm;
            text-align: center;
          }
          
          .signature-line {
            border-top: 1px solid #000;
            width: 30mm;
            margin: 10mm auto 2mm auto;
          }
          
          .signature-label {
            font-size: 14px;
            color: #666;
          }
          
          .reference-section {
            margin: 2mm 0;
            font-style: italic;
            text-align: center;
            font-size: 14px;
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
            <div class="document-title">Reçu d'Encaissement</div>
            <div class="encaissement-number">N° ${encaissementData.id}</div>
          </div>
  
          <!-- Informations générales -->
          <div class="info-section">
            <div class="info-row">
              <span class="info-label">Date:</span>
              <span class="info-value">${currentDate}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Heure:</span>
              <span class="info-value">${currentTime}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Client:</span>
              <span class="info-value">${encaissementData.Client}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Nom:</span>
              <span class="info-value">${clientName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Commercial:</span>
              <span class="info-value">${userData?.magasin}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date Encaissement:</span>
              <span class="info-value">${formatEncaissementDate(
                encaissementData.DateEncaissement
              )}</span>
            </div>
         
          </div>
  
          <div class="separator"></div>
  
          <!-- Section Paiement -->
          <div class="payment-section">
            <div class="payment-title">Détails du Paiement</div>
            
            <div class="payment-details">
              <div class="payment-row">
                <span class="payment-label">Mode de paiement:</span>
                <span class="payment-value">${
                  encaissementData.ModePaiement || "ESPECE"
                }</span>
              </div>
              
              ${
                encaissementData.Reference
                  ? `
                <div class="payment-row">
                  <span class="payment-label">Référence:</span>
                  <span class="payment-value">${encaissementData.Reference}</span>
                </div>
              `
                  : ""
              }
              
            </div>
          </div>
  
          <!-- Montant -->
          <div class="amount-section">
            <div class="amount-label">Montant Encaissé</div>
            <div class="amount-value">${parseFloat(
              encaissementData.Montant || 0
            ).toLocaleString("fr-DZ", {
              style: "currency",
              currency: "DZD",
            })}</div>
          </div>
  
          <!-- Pied de page -->
          <div class="footer">
            <div>Merci pour votre confiance</div>
              <!-- 
                <div style="margin-top: 2mm; font-size: 14px; color: #666;">
              Document généré hors ligne - À synchroniser
            </div>
              -->
          
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Fonction pour gérer l'impression d'un encaissement offline
  // const handlePrintOfflineEncaissement = async (encaissementItem) => {
  //   try {
  //     // Préparer les données pour le PDF à partir de l'encaissement offline
  //     const encaissementData = {
  //       id: encaissementItem.payload.Id,
  //       timestamp: encaissementItem.timestamp,
  //       failed: encaissementItem.failed,
  //       error: encaissementItem.error,
  //       ...encaissementItem.payload, // Récupérer les données du payload
  //       Client: encaissementItem.payload?.Client,
  //       clientName: clientName,
  //       commercialName: userData?.code,
  //     };

  //     console.log("encaissment data dans hors ligne ", encaissementData);

  //     // Générer le contenu HTML spécifique aux encaissements offline
  //     const htmlContent =
  //       generateOfflineEncaissementThermalPDFContent(encaissementData);

  //     // Marquer comme imprimée avant la navigation
  //     await markAsEternal(selectedEncaissement.id);
  //     // Naviguer vers l'écran PDF avec les données nécessaires
  //     navigation.navigate("PDFViewerScreen", {
  //       htmlContent: htmlContent,
  //       encaissementId: encaissementItem.payload.Id,
  //       encaissementData: encaissementData,
  //       clientData: client,
  //       userData: userData,
  //       documentType: "encaissement_offline", // Pour différencier des encaissements en ligne
  //       orderData: {
  //         cmd: "",
  //         client: client.kunnr,
  //         clientName: clientName,
  //       },
  //     });
  //   } catch (error) {
  //     console.error("Erreur lors de la préparation de l'impression:", error);
  //     Alert.alert(
  //       "Erreur",
  //       "Impossible de préparer le document pour l'impression. Veuillez réessayer.",
  //       [{ text: "OK" }]
  //     );
  //   }
  // };
  const handlePrintOfflineEncaissement = async (encaissementItem) => {
    try {
      // Créer l'objet transformedData selon le format demandé pour les encaissements offline
      const transformedData = {
        Id: encaissementItem.payload.Id,
        Client: encaissementItem.payload.Client,
        clientName: clientName,
        commercial: userData?.magasin,
        DateEncaissement: encaissementItem.payload.DateEncaissement,
        ModePaiement: encaissementItem.payload.ModePaiement,
        Montant: encaissementItem.payload.Montant,
        // Ajouter la référence seulement si le mode de paiement est CHEQUE et qu'elle existe
        ...(encaissementItem.payload.ModePaiement === "CHEQUE" &&
          encaissementItem.payload.Reference &&
          encaissementItem.payload.Reference.trim() !== "" && {
            Reference: encaissementItem.payload.Reference,
          }),
      };

      console.log("transformedData dans hors ligne", transformedData);

      // Préparer les données pour le PDF à partir de l'encaissement offline (garder la logique existante)
      const encaissementData = {
        id: encaissementItem.payload.Id,
        timestamp: encaissementItem.timestamp,
        failed: encaissementItem.failed,
        error: encaissementItem.error,
        ...encaissementItem.payload, // Récupérer les données du payload
        Client: encaissementItem.payload?.Client,
        clientName: clientName,
        commercialName: userData?.code,
      };

      console.log("encaissment data dans hors ligne", encaissementData);

      // Générer le contenu HTML spécifique aux encaissements offline
      const htmlContent =
        generateOfflineEncaissementThermalPDFContent(encaissementData);

      // Marquer comme imprimée avant la navigation
      await markAsEternal(selectedEncaissement.id);

      // Naviguer vers l'écran PDF avec les données nécessaires
      navigation.navigate("PDFViewerScreen", {
        htmlContent: htmlContent,
        encaissementId: encaissementItem.payload.Id,
        encaissementData: transformedData, // Utiliser transformedData au lieu d'encaissementData
        clientData: client,
        userData: userData,
        documentType: "encaissement", // Pour différencier des encaissements en ligne
        orderData: {
          cmd: "",
          client: client.kunnr,
          clientName: clientName,
        },
      });
    } catch (error) {
      console.error("Erreur lors de la préparation de l'impression:", error);
      Alert.alert(
        "Erreur",
        "Impossible de préparer le document pour l'impression. Veuillez réessayer.",
        [{ text: "OK" }]
      );
    }
  };
  const handleClearAllEncaissements = () => {
    if (offlineEncaissements.length === 0) {
      Alert.alert("Information", "Aucun encaissement hors ligne à supprimer");
      return;
    }

    Alert.alert(
      "Confirmation",
      "Voulez-vous supprimer tous les encaissements hors ligne ?",
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
                "Tous les encaissements hors ligne ont été supprimés"
              );
              await handleRefresh();
            } catch (error) {
              Alert.alert(
                "Erreur",
                "Impossible de supprimer les encaissements"
              );
            }
          },
        },
      ]
    );
  };

  const openEncaissementActions = (encaissementAction) => {
    setSelectedEncaissement(encaissementAction);
    modalizeRef.current?.open();
  };

  // Nouvelle fonction pour ouvrir la modale de modification
  const openEditForm = (encaissement) => {
    setFormMode("edit");

    // Extraire les données de l'encaissement offline
    const encaissementData = encaissement.payload;

    // Gérer la date
    let dateObj = new Date();
    if (encaissementData.DateEncaissement) {
      dateObj = new Date(encaissementData.DateEncaissement);
    }
    const dateString = dateObj.toISOString().slice(0, 10);
    setDateValue(dateObj);

    setEncaissementForm({
      Commercial: encaissementData.Commercial || "",
      Client: encaissementData.Client || client,
      NumLigne: encaissementData.NumLigne || "",
      DateEncaissement: dateString,
      Montant: encaissementData.Montant
        ? encaissementData.Montant.toString()
        : "",
      ModePaiement: encaissementData.ModePaiement || "ESPECE",
      Reference: encaissementData.Reference || "",
    });

    formModalizeRef.current?.open();
  };

  // Gérer le changement de date
  const handleDateChange = (date) => {
    if (date) {
      setDateValue(date);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();

      setEncaissementForm({
        ...encaissementForm,
        DateEncaissement: `${year}-${month}-${day}`,
      });
    }
  };

  // Modifier un encaissement offline
  const handleModifierEncaissement = () => {
    modalizeRef.current?.close();
    if (selectedEncaissement) {
      openEditForm(selectedEncaissement);
    }
  };

  // Imprimer un encaissement offline
  const handlePrintEncaissement = () => {
    modalizeRef.current?.close();
    if (selectedEncaissement) {
      handlePrintOfflineEncaissement(selectedEncaissement);
    }
  };

  const markAsEternal = async (encaissmentId) => {
    try {
      await updateOfflineAction(encaissmentId, {
        imprime: true,
      });
      await dispatch(loadOfflineEncaissements(client.kunnr));
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
    }
  };

  // Formatter la date pour l'API
  const formatDateForApi = (dateString) => {
    if (!dateString) return "";
    return `${dateString}T00:00:00`;
  };

  // Soumettre les modifications
  // Fonction handleSubmitForm corrigée
  const handleSubmitForm = async () => {
    // Validation basique
    if (
      !encaissementForm.Montant ||
      parseFloat(encaissementForm.Montant) <= 0
    ) {
      Alert.alert("Erreur", "Veuillez saisir un montant valide");
      return;
    }

    if (!encaissementForm.DateEncaissement) {
      Alert.alert("Erreur", "Veuillez sélectionner une date");
      return;
    }

    try {
      // Créer le payload modifié
      const updatedPayload = {
        Commercial: encaissementForm.Commercial,
        Client: encaissementForm.Client,
        NumLigne: encaissementForm.NumLigne,
        DateEncaissement: formatDateForApi(encaissementForm.DateEncaissement),
        Montant: encaissementForm.Montant,
        ModePaiement: encaissementForm.ModePaiement,
        Reference: encaissementForm.Reference,
      };

      // CORRECTION: Mettre à jour en fonction de la structure existante
      let updates = {};

      // Si l'encaissement a une propriété payload, mettre à jour le payload
      if (selectedEncaissement.payload) {
        updates = {
          payload: {
            ...selectedEncaissement.payload,
            ...updatedPayload,
          },
        };
      } else {
        // Sinon, mettre à jour directement les propriétés à la racine
        // mais conserver les métadonnées importantes
        updates = {
          ...updatedPayload,
          // Conserver les métadonnées existantes
          id: selectedEncaissement.id,
          meta: selectedEncaissement.meta,
          timestamp: selectedEncaissement.timestamp,
          type: selectedEncaissement.type,
        };
      }

      // Mettre à jour l'encaissement offline
      await updateOfflineAction(selectedEncaissement.id, updates);

      // Rafraîchir les données
      await handleRefresh();

      formModalizeRef.current?.close();
      Alert.alert("Succès", "Encaissement modifié avec succès");
    } catch (error) {
      console.error("Erreur lors de la modification:", error);
      Alert.alert("Erreur", "Erreur lors de la modification de l'encaissement");
    }
  };

  const handleDeleteEncaissement = () => {
    modalizeRef.current?.close();
    if (!selectedEncaissement) return;

    Alert.alert(
      "Confirmation",
      "Voulez-vous supprimer cet encaissement de la file d'attente ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await removeFromOfflineQueue(selectedEncaissement.id);
              await dispatch(loadOfflineEncaissements(client.kunnr));
              await dispatch(loadAllOfflineEncaissements());
              await dispatch(fetchPendingActionsCount());
              Alert.alert(
                "Succès",
                "Encaissement supprimé de la file d'attente"
              );
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer l'encaissement");
            }
          },
        },
      ]
    );
  };

  // Récupérer l'icône en fonction du mode de paiement
  const getPaymentIcon = (modePaiement) => {
    if (!modePaiement)
      return <MaterialIcons name="payment" size={24} color="#757575" />;

    switch (modePaiement.toUpperCase()) {
      case "ESPECE":
        return <MaterialIcons name="attach-money" size={24} color="#4CAF50" />;
      case "CHEQUE":
        return <FontAwesome name="money" size={22} color="#FF9800" />;
      default:
        return <MaterialIcons name="payment" size={24} color="#757575" />;
    }
  };

  const getEncaissementTypeDisplay = (action) => {
    const modePaiement = action.payload?.ModePaiement || "ESPECE";
    return {
      type: "Encaissement",
      subType: modePaiement,
      icon: modePaiement.toUpperCase() === "ESPECE" ? "attach-money" : "money",
      color: modePaiement.toUpperCase() === "ESPECE" ? "#4CAF50" : "#FF9800",
    };
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

  // Formater les montants avec un séparateur de milliers et 2 décimales
  const formatMontant = (montant) => {
    if (!montant) return "0.00";
    return parseFloat(montant).toLocaleString("fr-DZ", {
      style: "currency",
      currency: "DZD",
    });
  };

  const handleRefresh = async () => {
    await dispatch(loadOfflineEncaissements(client.kunnr));
    await dispatch(fetchPendingActionsCount());
  };

  const renderOfflineEncaissement = ({ item }) => {
    const encaissementType = getEncaissementTypeDisplay(item);
    const hasError = item.failed;
    const encaissementData = item.payload;
    const montant = encaissementData?.Montant || 0;
    const modePaiement = encaissementData?.ModePaiement || "ESPECE";
    const reference = encaissementData?.Reference;
    const isPrinted = item?.imprime;

    return (
      <TouchableOpacity
        style={[
          styles.encaissementCard,
          hasError && styles.encaissementCardError,
        ]}
        onPress={() => openEncaissementActions(item)}
        activeOpacity={0.7}
      >
        <View style={styles.encaissementHeader}>
          <View style={styles.encaissementTypeContainer}>
            <View style={styles.encaissementIcon}>
              {hasError ? (
                <MaterialIcons name="error" size={24} color="#F44336" />
              ) : (
                getPaymentIcon(modePaiement)
              )}
            </View>
            <View style={styles.encaissementTypeInfo}>
              <Text
                style={[
                  styles.encaissementType,
                  { color: hasError ? "#F44336" : encaissementType.color },
                ]}
              >
                {hasError ? "Encaissement en erreur" : encaissementType.type}
              </Text>
              <Text style={styles.encaissementSubType}>
                {modePaiement}
                {reference && ` - ${reference}`}
              </Text>
            </View>
          </View>
          <View style={styles.encaissementAmount}>
            <Text style={styles.montantText}>{formatMontant(montant)}</Text>
            <MaterialIcons name="more-vert" size={24} color="#757575" />
          </View>
        </View>

        <View style={styles.encaissementDetails}>
          <View style={styles.detailRow}>
            <MaterialIcons name="access-time" size={16} color="#757575" />
            <Text style={styles.detailText}>
              Créé le: {formatDate(item.timestamp)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialIcons name="business" size={16} color="#757575" />
            <Text style={styles.detailText}>Client: {clientName}</Text>
          </View>

          {encaissementData?.DateEncaissement && (
            <View style={styles.detailRow}>
              <MaterialIcons name="event" size={16} color="#757575" />
              <Text style={styles.detailText}>
                Date encaissement:{" "}
                {new Date(encaissementData.DateEncaissement).toLocaleDateString(
                  "fr-FR"
                )}
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
          {isPrinted && (
            <View style={styles.detailRow}>
              <MaterialIcons name="print" size={16} color="#4CAF50" />
              <Text style={[styles.detailText, { color: "#4CAF50" }]}>
                Document imprimé
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const handleRetryEncaissement = async (hasError) => {
    modalizeRef.current?.close();
    if (!selectedEncaissement) return;

    const executeSync = async () => {
      try {
        // Si erreur, d'abord retry, sinon synchroniser directement
        if (hasError) {
          await dispatch(retryFailedEncaissement(selectedEncaissement.id));
        }

        // Tenter la synchronisation spécifique
        const syncResult = await dispatch(
          syncOfflineData(selectedEncaissement.id)
        );

        // Rafraîchir les données
        await handleRefresh();

        // Vérifier si la synchronisation a réussi
        if (syncResult.payload && syncResult.payload.success) {
          Alert.alert("Succès", "Encaissement synchronisé avec succès");
        } else {
          const errorMessage =
            syncResult.payload?.message ||
            syncResult.payload?.errorDetails?.[0]?.error ||
            "Erreur lors de la synchronisation";
          Alert.alert("Erreur", errorMessage);
        }
      } catch (error) {
        console.error("Erreur lors de l'opération:", error);
        Alert.alert(
          "Erreur",
          `Impossible de ${
            hasError ? "réessayer" : "synchroniser"
          } l'encaissement`
        );
      }
    };

    if (hasError) {
      Alert.alert("Confirmation", "Voulez-vous réessayer cet encaissement ?", [
        { text: "Annuler", style: "cancel" },
        { text: "Réessayer", onPress: executeSync },
      ]);
    } else {
      await executeSync();
    }
  };

  // Nouveau rendu du formulaire de modification
  const renderFormContent = () => {
    return (
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Modifier l'encaissement</Text>

        {/* DateField */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Date d'encaissement</Text>
          <View style={styles.dateFieldContainer}>
            <DateField
              styleInput={styles.dateFieldInput}
              labelDate="Jour"
              labelMonth="Mois"
              labelYear="Année"
              defaultValue={dateValue}
              containerStyle={styles.dateField}
              onSubmit={handleDateChange}
              placeholderTextColor="#999"
              maxDate={new Date()}
              minDate={new Date(2000, 0, 1)}
            />
          </View>
        </View>

        {/* Montant */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Montant (DZD)</Text>
          <TextInput
            style={styles.textInput}
            value={encaissementForm.Montant}
            onChangeText={(text) =>
              setEncaissementForm({ ...encaissementForm, Montant: text })
            }
            keyboardType="number-pad"
            placeholder="0.00"
          />
        </View>

        {/* Mode de paiement */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Mode de paiement</Text>
          <View style={styles.modesPaiementContainer}>
            {modesPaiement.map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.modePaiementButton,
                  encaissementForm.ModePaiement === mode &&
                    styles.modePaiementButtonSelected,
                ]}
                onPress={() =>
                  setEncaissementForm({
                    ...encaissementForm,
                    ModePaiement: mode,
                  })
                }
              >
                <View style={styles.modePaiementIconContainer}>
                  {getPaymentIcon(mode)}
                </View>
                <Text
                  style={[
                    styles.modePaiementButtonText,
                    encaissementForm.ModePaiement === mode &&
                      styles.modePaiementButtonTextSelected,
                  ]}
                >
                  {mode}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Référence (optionnelle) */}
        {encaissementForm.ModePaiement === "CHEQUE" && (
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Référence (optionnelle)</Text>
            <TextInput
              style={styles.textInput}
              value={encaissementForm.Reference}
              onChangeText={(text) =>
                setEncaissementForm({ ...encaissementForm, Reference: text })
              }
              placeholder="N° chèque"
            />
          </View>
        )}

        {/* Boutons d'action */}
        <View style={styles.formActions}>
          <TouchableOpacity
            style={styles.cancelFormButton}
            onPress={() => formModalizeRef.current?.close()}
          >
            <Text style={styles.cancelFormButtonText}>Annuler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.submitFormButton}
            onPress={handleSubmitForm}
          >
            <Text style={styles.submitFormButtonText}>Modifier</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderActionModal = () => {
    if (!selectedEncaissement) return null;

    const encaissementType = getEncaissementTypeDisplay(selectedEncaissement);
    const hasError = selectedEncaissement.failed;
    const encaissementData = selectedEncaissement.payload;
    const montant = encaissementData?.Montant || 0;
    const modePaiement = encaissementData?.ModePaiement || "ESPECE";
    const isPrinted = selectedEncaissement?.imprime;
    return (
      <View style={styles.modalContent}>
        <View style={styles.actionModalContainer}>
          <Text style={styles.actionModalTitle}>
            Actions sur l'encaissement
          </Text>

          {/* Nouveau bouton d'impression */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              //   actionModalizeRef.current?.close();
              handlePrintEncaissement(
                selectedEncaissement,
                client,
                userData,
                navigation
              );
            }}
          >
            <MaterialIcons name="print" size={24} color="#4CAF50" />
            <Text style={styles.actionButtonText}>Imprimer le reçu</Text>
          </TouchableOpacity>

          {isServerReachable && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleRetryEncaissement(hasError)}
            >
              <MaterialIcons name="refresh" size={24} color="#FF9800" />
              <Text style={styles.actionButtonText}>
                {hasError
                  ? "Réessayer l'encaissement"
                  : "Synchroniser l'encaissement"}
              </Text>
            </TouchableOpacity>
          )}
          {/* Nouvelle action pour modifier */}
          {!isPrinted && (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleModifierEncaissement}
              >
                <MaterialIcons name="edit" size={24} color="#2196F3" />
                <Text style={styles.actionButtonText}>
                  Modifier l'encaissement
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={handleDeleteEncaissement}
              >
                <MaterialIcons name="delete" size={24} color="#F44336" />
                <Text
                  style={[styles.actionButtonText, styles.deleteButtonText]}
                >
                  Supprimer l'encaissement
                </Text>
              </TouchableOpacity>
            </>
          )}

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

  return (
    <SafeAreaView style={styles.container}>
      {offlineEncaissements.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="cash-check" size={64} color="#E0E0E0" />
          <Text style={styles.emptyTitle}>Aucun encaissement hors ligne</Text>
          <Text style={styles.emptySubtitle}>
            Tous vos encaissements sont synchronisés
          </Text>
        </View>
      ) : (
        <FlatList
          data={offlineEncaissements}
          renderItem={renderOfflineEncaissement}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={handleRefresh}
              colors={["#4CAF50", "#FF9800", "#03A9F4"]}
            />
          }
        />
      )}

      {/* Modale pour les actions sur un encaissement */}
      <Modalize
        ref={modalizeRef}
        adjustToContentHeight
        withHandle={false}
        modalStyle={styles.modal}
        overlayStyle={styles.overlay}
      >
        {renderActionModal()}
      </Modalize>

      {/* Nouvelle modale pour le formulaire de modification */}
      <Modalize
        ref={formModalizeRef}
        adjustToContentHeight
        closeOnOverlayTap
        withHandle
      >
        {renderFormContent()}
      </Modalize>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  encaissementCardError: {
    borderLeftWidth: scale(4),
    borderLeftColor: "#F44336",
    backgroundColor: "#FFEBEE",
  },
  errorText: {
    color: "#F44336",
    fontStyle: "italic",
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: scale(20),
  },
  emptyTitle: {
    fontSize: fs(18),
    fontWeight: fontWeight.bold,
    color: "#757575",
    marginTop: scale(16),
  },
  emptySubtitle: {
    fontSize: fs(14),
    color: "#9E9E9E",
    marginTop: scale(8),
    textAlign: "center",
  },
  listContainer: {
    marginTop: scale(10),
  },
  encaissementCard: {
    backgroundColor: "white",
    padding: scale(16),
    marginBottom: scale(2),
  },
  encaissementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: scale(12),
  },
  encaissementTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  encaissementIcon: {
    marginRight: scale(12),
  },
  encaissementTypeInfo: {
    flex: 1,
  },
  encaissementType: {
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
  },
  encaissementSubType: {
    fontSize: fs(14),
    color: "#757575",
    marginTop: scale(2),
  },
  encaissementAmount: {
    alignItems: "flex-end",
  },
  montantText: {
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
    color: "#4CAF50",
    marginBottom: scale(4),
  },
  encaissementDetails: {
    marginBottom: scale(8),
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale(8),
  },
  detailText: {
    marginLeft: scale(8),
    fontSize: fs(14),
    color: "#424242",
  },
  // Styles pour la modalize
  modal: {
    backgroundColor: "white",
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
  },
  overlay: {
    backgroundColor: "rgba(209, 214, 222, 0.25)",
  },
  modalContent: {},
  actionModalContainer: {
    padding: scale(24),
  },
  actionModalTitle: {
    fontSize: fs(18),
    fontWeight: fontWeight.bold,
    marginBottom: scale(24),
    textAlign: "center",
  },
  encaissementInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    padding: scale(16),
    borderRadius: scale(8),
    marginBottom: scale(24),
  },
  encaissementInfo: {
    marginLeft: scale(12),
    flex: 1,
  },
  encaissementInfoText: {
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
    color: "#333",
  },
  encaissementInfoSubText: {
    fontSize: fs(14),
    color: "#757575",
    marginTop: scale(2),
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: scale(16),
    borderBottomWidth: scale(1),
    borderBottomColor: "#EEEEEE",
  },
  actionButtonText: {
    fontSize: fs(16),
    marginLeft: scale(16),
    color: "#333",
  },
  deleteButton: {
    borderBottomWidth: 0,
    marginBottom: scale(16),
  },
  deleteButtonText: {
    color: "#F44336",
  },
  cancelButton: {
    backgroundColor: "#EEEEEE",
    borderRadius: scale(8),
    padding: scale(16),
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: fs(16),
    color: "#333",
    fontWeight: fontWeight.medium,
  },
  formContainer: {
    padding: scale(24),
  },
  formTitle: {
    fontSize: fs(18),
    fontWeight: fontWeight.bold,
    marginBottom: scale(24),
    textAlign: "center",
    color: "#333",
  },
  formGroup: {
    marginBottom: scale(20),
  },
  formLabel: {
    fontSize: fs(14),
    color: "#757575",
    marginBottom: scale(8),
  },
  textInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: scale(8),
    padding: scale(12),
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
    borderWidth: scale(1),
    borderColor: "#E0E0E0",
  },
  // Styles pour DateField
  dateFieldContainer: {
    borderColor: "#E0E0E0",
    borderRadius: scale(8),
  },
  dateField: {
    width: "100%",
  },
  dateFieldInput: {
    height: scale(40),
    width: "30%",
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
    color: "#333",
    backgroundColor: "#F5F5F5",
    borderWidth: scale(1),
    borderColor: "#E0E0E0",
    borderRadius: scale(8),
  },
  modesPaiementContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  modePaiementButton: {
    backgroundColor: "#F5F5F5",
    borderRadius: scale(8),
    padding: scale(12),
    borderWidth: scale(1),
    borderColor: "#E0E0E0",
    width: "48%",
    marginBottom: scale(10),
    flexDirection: "row",
    alignItems: "center",
  },
  modePaiementButtonSelected: {
    backgroundColor: "#E3F2FD",
    borderColor: "#2196F3",
  },
  modePaiementIconContainer: {
    marginRight: scale(8),
  },
  modePaiementButtonText: {
    fontSize: fs(14),
    color: "#333",
  },
  modePaiementButtonTextSelected: {
    color: "#2196F3",
    fontWeight: fontWeight.bold,
  },
  formActions: {
    flexDirection: "column-reverse",
    justifyContent: "space-between",
    marginTop: scale(24),
  },
  cancelFormButton: {
    borderRadius: scale(8),
    padding: scale(16),
    alignItems: "center",
    flex: 1,
  },
  cancelFormButtonText: {
    fontSize: fs(16),
    color: "#333",
    fontWeight: fontWeight.medium,
  },
  submitFormButton: {
    backgroundColor: "#006475",
    borderRadius: scale(10),
    padding: scale(16),
    alignItems: "center",
    flex: 1,
    marginBottom: scale(5),
  },
  submitFormButtonText: {
    fontSize: fs(16),
    color: "white",
    fontWeight: fontWeight.bold,
  },
  submitButtonDisabled: {
    backgroundColor: "#8CADB5",
    opacity: 0.7,
  },
});

export default OfflineEncaissementsScreen;
