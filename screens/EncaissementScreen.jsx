import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Dimensions,
  TextInput,
  Platform,
  SafeAreaView,
  ScrollView,
  BackHandler,
} from "react-native";
import { Modalize } from "react-native-modalize";
import {
  MaterialIcons,
  FontAwesome,
  MaterialCommunityIcons,
  AntDesign,
} from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import {
  getEncaissment,
  modifyEncaissement,
  resetEncaissementState,
  deleteEncaissement,
  addEncaissement,
} from "../redux/slices/encaissementSlice";
import DateField from "react-native-datefield";
import { useFocusEffect } from "@react-navigation/native";
import {
  fetchPendingActionsCount,
  loadAllOfflineEncaissements,
  loadOfflineEncaissements,
} from "../redux/slices/offlineSlice";
import OfflineEncaissementsScreen from "./OfflineEncaissementsScreen";
import { useNavigation } from "@react-navigation/native";
const { width, height } = Dimensions.get("window");
import { wp, hp, fs, fontWeight, scale } from "../utils/responsive";
const EncaissementScreen = ({ route }) => {
  const { client, offlineList } = route.params;
  const navigation = useNavigation();
  const userData = useSelector((state) => state.auth.user);
  const user = userData.code;
  const dispatch = useDispatch();
  const actionModalizeRef = useRef(null);
  const formModalizeRef = useRef(null);
  const cancelationTextModalizeRef = useRef(null);

  const {
    encaissements,
    encaissementsLoading,
    encaissementsError,
    submitLoading,
    submitError,
    deleteLoading,
    deleteError,
  } = useSelector((state) => state.encaissement);
  const { isConnected, isServerReachable, offlineEncaissements } = useSelector(
    (state) => state.offline,
  );

  const [selectedEncaissement, setSelectedEncaissement] = useState(null);
  const [formMode, setFormMode] = useState("create"); // "create" ou "edit"
  const [dateValue, setDateValue] = useState(new Date());
  const [displayMontant, setDisplayMontant] = useState("");
  const [showOfflineEncaissements, setShowOfflineEncaissements] = useState(
    offlineList ? true : false,
  );

  // État pour le formulaire
  const [encaissementForm, setEncaissementForm] = useState({
    // Facture: "",
    Id: "",
    Commercial: "",
    Client: "",
    NumLigne: "",
    DateEncaissement: new Date().toISOString().slice(0, 10), // Format YYYY-MM-DD
    Montant: "",
    ModePaiement: "ESPECE", // Valeur par défaut
    Reference: "",
    RaisonAnnulation: "",
    MontantAnnuler: "",
  });

  const [cancelationReason, setCancelationReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Modes de paiement disponibles
  const modesPaiement = ["ESPECE", "CHEQUE"];

  useFocusEffect(
    useCallback(() => {
      dispatch(loadOfflineEncaissements(client.kunnr));
      dispatch(fetchPendingActionsCount()); // Recharger la liste
    }, []),
  );
  useEffect(() => {
    dispatch(loadOfflineEncaissements(client.kunnr));
  }, [handleSubmitForm]);

  useEffect(() => {
    const handleBackPress = () => {
      navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress,
    );
    return () => backHandler.remove();
  }, [navigation]);

  // Fonction pour charger les encaissements
  // Dans EncaissementsListModalize.js
  useEffect(() => {
    // Ne pas charger les données automatiquement au montage du composant
    // On les chargera seulement quand la modale s'ouvre
    loadEncaissements();
  }, []);

  // Séparation du chargement des données de l'effet de changement de props
  const loadEncaissements = () => {
    if (!client || !user) return;

    // Réinitialiser l'état avant de charger de nouvelles données
    dispatch(resetEncaissementState());

    // Puis charger les nouvelles données
    if (isServerReachable) {
      dispatch(
        getEncaissment({
          // client: client,
          commercial: user,
        }),
      );
    }
  };

  const formatMontantInput = (value) => {
    // Retirer tous les caractères non numériques sauf le point
    const numericValue = value.replace(/[^0-9.]/g, "");

    // Empêcher plusieurs points décimaux
    const parts = numericValue.split(".");
    if (parts.length > 2) {
      return displayMontant; // Garder l'ancienne valeur
    }

    // Formater avec des espaces pour les milliers
    if (numericValue) {
      const [integerPart, decimalPart] = parts;
      const formattedInteger = integerPart.replace(
        /\B(?=(\d{3})+(?!\d))/g,
        " ",
      );
      return decimalPart !== undefined
        ? `${formattedInteger}.${decimalPart.slice(0, 2)}`
        : formattedInteger;
    }

    return "";
  };

  // Fonction pour convertir une date SAP au format jj mmmm aaaa
  const formatDate = (dateSAP) => {
    if (!dateSAP) return "Date non disponible";

    // Extraire le timestamp (millisecondes) de la chaîne SAP
    const timestampMatch = dateSAP.match(/\/Date\((\d+)\)\//);

    if (!timestampMatch || timestampMatch.length < 2) {
      return "Format de date invalide";
    }

    const timestamp = parseInt(timestampMatch[1]);
    const date = new Date(timestamp);

    // Options pour le format de date
    const options = {
      day: "2-digit",
      month: "long",
      year: "numeric",
    };

    // Formater la date en français
    return date.toLocaleDateString("fr-FR", options);
  };

  const formatDateTimeStmp = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  // Formater les montants avec un séparateur de milliers et 2 décimales
  const formatMontant = (montant) => {
    if (!montant) return "0.00";
    return parseFloat(montant).toLocaleString("fr-DZ", {
      style: "currency",
      currency: "DZD",
    });
  };

  // Afficher la modale d'actions pour un encaissement
  const showActionModal = (encaissement) => {
    setSelectedEncaissement(encaissement);
    actionModalizeRef.current?.open();
  };

  // Extraire la date d'une chaîne au format SAP
  const extractDateFromSAP = (dateSAP) => {
    if (!dateSAP) return new Date().toISOString().slice(0, 10);

    try {
      const timestampMatch = dateSAP.match(/\/Date\((\d+)\)\//);
      if (timestampMatch && timestampMatch.length >= 2) {
        const date = new Date(parseInt(timestampMatch[1]));
        return date.toISOString().slice(0, 10); // Format YYYY-MM-DD
      }
    } catch (error) {
      console.error("Erreur d'extraction de date:", error);
    }

    return new Date().toISOString().slice(0, 10);
  };

  // Extraire la date d'une chaîne au format SAP et retourner un objet Date
  const extractDateObjectFromSAP = (dateSAP) => {
    if (!dateSAP) return new Date();

    try {
      const timestampMatch = dateSAP.match(/\/Date\((\d+)\)\//);
      if (timestampMatch && timestampMatch.length >= 2) {
        return new Date(parseInt(timestampMatch[1]));
      }
    } catch (error) {
      console.error("Erreur d'extraction de date:", error);
    }

    return new Date();
  };

  // Formatter la date pour l'API
  const formatDateForApi = (dateString) => {
    if (!dateString) return "";
    return `${dateString}T00:00:00`;
  };

  // Ouvrir la modale de formulaire en mode création

  const openCreateForm = () => {
    setFormMode("create");
    setDisplayMontant("");
    const currentDate = new Date();
    setDateValue(currentDate);

    setEncaissementForm({
      Id: `${userData?.magasin || ""}${Date.now().toString()}`,
      Commercial: user || "",
      Client: client.kunnr || "",
      NumLigne: "", // Sera généré côté API
      DateEncaissement: currentDate.toISOString().slice(0, 10),
      Montant: "",
      ModePaiement: "ESPECE",
      Reference: "",
    });
    formModalizeRef.current?.open();
  };

  // Ouvrir la modale de formulaire en mode édition
  const openEditForm = (encaissement) => {
    setFormMode("edit");

    const montantValue = encaissement.Montant
      ? encaissement.Montant.toString()
      : "";
    setDisplayMontant(formatMontantInput(montantValue));

    // Extraire la date de la chaîne SAP
    const dateObj = extractDateObjectFromSAP(encaissement.DateEncaissement);
    const dateString = dateObj.toISOString().slice(0, 10);
    setDateValue(dateObj);

    setEncaissementForm({
      Id: encaissement.Id,
      Commercial: encaissement.Commercial || user,
      Client: encaissement.Client,
      NumLigne: encaissement.NumLigne || "",
      DateEncaissement: dateString,
      Montant: encaissement.Montant ? encaissement.Montant.toString() : "",
      ModePaiement: encaissement.ModePaiement || "ESPECE",
      Reference: encaissement.Reference || "",
    });

    formModalizeRef.current?.open();
  };
  const openReasonForCancelationText = (encaissement) => {
    setFormMode("edit");

    // Extraire la date de la chaîne SAP
    const dateObj = extractDateObjectFromSAP(encaissement.DateEncaissement);
    const dateString = dateObj.toISOString().slice(0, 10);
    setDateValue(dateObj);

    setEncaissementForm({
      Id: encaissement.Id,
      Commercial: encaissement.Commercial || user,
      Client: encaissement.Client,
      NumLigne: encaissement.NumLigne || "",
      DateEncaissement: dateString,
      Montant: encaissement.Montant ? encaissement.Montant.toString() : "",
      ModePaiement: encaissement.ModePaiement || "ESPECE",
      Reference: encaissement.Reference || "",
      RaisonAnnulation: encaissement.RaisonAnnulation || "",
      MontantAnnuler: "X",
    });

    cancelationTextModalizeRef.current?.open();
  };

  const handleDateChange = (date) => {
    if (date) {
      setDateValue(date);
      // Utiliser une méthode qui préserve le fuseau horaire local
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();

      setEncaissementForm({
        ...encaissementForm,
        DateEncaissement: `${year}-${month}-${day}`,
      });
    }
  };

  // Modifier un encaissement
  const handleCancelation = () => {
    actionModalizeRef.current?.close();
    if (selectedEncaissement) {
      openReasonForCancelationText(selectedEncaissement);
    }
  };
  // Modifier un encaissement
  const handleModifierEncaissement = () => {
    actionModalizeRef.current?.close();
    if (selectedEncaissement) {
      openEditForm(selectedEncaissement);
    }
  };

  // Supprimer un encaissement
  const handleSupprimerEncaissement = () => {
    Alert.alert(
      "Confirmation",
      "Êtes-vous sûr de vouloir supprimer cet encaissement ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => {
            actionModalizeRef.current?.close();

            // Vérifiez si l'action deleteEncaissement existe et que selectedEncaissement a un ID
            if (selectedEncaissement && selectedEncaissement.NumLigne) {
              dispatch(
                deleteEncaissement({
                  id: selectedEncaissement.Id,
                  client: selectedEncaissement.Client,
                  commercial: selectedEncaissement.Commercial,
                  numLigne: selectedEncaissement.NumLigne,
                }),
              )
                .unwrap()
                .then(() => {
                  loadEncaissements(); // Recharger la liste
                  Alert.alert("Succès", "Encaissement supprimé avec succès");
                })
                .catch((err) => {
                  Alert.alert(
                    "Erreur",
                    err.message || "Erreur lors de la suppression",
                  );
                });
            } else {
              Alert.alert("Erreur", "Impossible de supprimer cet encaissement");
            }
          },
        },
      ],
    );
  };

  // Soumettre le formulaire (création ou modification)
  const handleSubmitForm = () => {
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

    const payload = {
      Id: encaissementForm.Id,
      Commercial: encaissementForm.Commercial,
      Client: encaissementForm.Client,
      NumLigne: encaissementForm.NumLigne,
      DateEncaissement: formatDateForApi(encaissementForm.DateEncaissement),
      Montant: encaissementForm.Montant,
      ModePaiement: encaissementForm.ModePaiement,
      Reference: encaissementForm.Reference,
    };
    setIsSubmitting(true);

    (formMode && formMode === "create"
      ? dispatch(addEncaissement(payload))
      : dispatch(modifyEncaissement(payload))
    )
      .unwrap()
      .then(() => {
        formModalizeRef.current?.close();
        dispatch(loadEncaissements());
        dispatch(loadAllOfflineEncaissements());
        Alert.alert(
          "Succès",
          formMode === "create"
            ? "Encaissement créé avec succès"
            : "Encaissement modifié avec succès",
        );
      })
      .catch((err) => {
        Alert.alert(
          "Erreur",
          err.message ||
            (formMode === "create"
              ? "Erreur lors de la création"
              : "Erreur lors de la modification"),
        );
      })
      .finally(() => {
        setIsSubmitting(false); // DÉSACTIVER LE LOADING TOUJOURS
      });
  };
  const handleSubmitCancelation = () => {
    const payload = {
      Id: encaissementForm.Id,
      Commercial: encaissementForm.Commercial,
      Client: encaissementForm.Client,
      NumLigne: encaissementForm.NumLigne,
      RaisonAnnulation: encaissementForm.RaisonAnnulation,
      MontantAnnuler: "X",
    };
    setIsCancelling(true); // ACTIVER LE LOADING
    dispatch(modifyEncaissement(payload))
      .unwrap()
      .then(() => {
        formModalizeRef.current?.close();
        dispatch(loadEncaissements());
        dispatch(loadAllOfflineEncaissements());
        Alert.alert("Succès", "Encaissement annulé avec succès", [
          {
            text: "OK",
            onPress: () => {
              cancelationTextModalizeRef.current?.close();
            },
          },
        ]);
      })
      .catch((err) => {
        Alert.alert(
          "Erreur",
          err.message ||
            (formMode === "create"
              ? "Erreur lors de la création"
              : "Erreur lors de la modification"),
        );
      })
      .finally(() => {
        setIsCancelling(false); // DÉSACTIVER LE LOADING TOUJOURS
      });
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

  // Rendu d'un élément de la liste
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.encaissementItem}
      disabled={!isServerReachable}
      onPress={() => showActionModal(item)}
    >
      <View style={styles.encaissementContent}>
        <View style={styles.encaissementIcon}>
          {getPaymentIcon(item.ModePaiement)}
        </View>
        <View style={styles.encaissementInfo}>
          <Text style={styles.encaissementDate}>
            {formatDate(item.DateEncaissement)}
          </Text>
          <Text style={styles.encaissementReference}>
            {(item.Reference && `${item.ModePaiement} - ${item.Reference}`) ||
              item.ModePaiement ||
              "Encaissement"}
          </Text>
        </View>
        <View style={styles.encaissementMontant}>
          <Text style={styles.montantText}>{formatMontant(item.Montant)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Rendu du contenu principal
  const renderContent = () => {
    if (encaissementsLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#03A9F4" />
          <Text style={styles.loadingText}>
            Chargement des encaissements...
          </Text>
        </View>
      );
    }

    if (encaissementsError) {
      return (
        <View style={styles.centerContainer}>
          <MaterialIcons name="error-outline" size={48} color="#e53935" />
          <Text style={styles.errorText}>{encaissementsError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadEncaissements}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!encaissements || encaissements.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons
            name="cash-remove"
            size={64}
            color="#E0E0E0"
          />
          <Text style={styles.emptyText}>
            Aucun encaissement pour cette facture
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={encaissements}
        renderItem={renderItem}
        keyExtractor={(item) => `encaissement-${item.NumLigne}`}
        contentContainerStyle={styles.listContainer}
      />
    );
  };

  // Rendu du formulaire d'encaissement
  const renderFormContent = () => {
    return (
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>
          {formMode === "create"
            ? "Nouvel encaissement"
            : "Modifier l'encaissement"}
        </Text>

        {/* DateField au lieu de DateTimePicker */}
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
          {/* <TextInput
            style={styles.textInput}
            value={encaissementForm.Montant}
            onChangeText={(text) =>
              setEncaissementForm({ ...encaissementForm, Montant: text })
            }
            keyboardType="number-pad"
            placeholder="0.00"
          /> */}
          <TextInput
            style={styles.textInput}
            value={displayMontant}
            onChangeText={(text) => {
              // Extraire la valeur numérique brute
              const numericValue = text.replace(/[^0-9.]/g, "");

              // Mettre à jour la valeur brute dans le form
              setEncaissementForm({
                ...encaissementForm,
                Montant: numericValue,
              });

              // Mettre à jour l'affichage formaté
              setDisplayMontant(formatMontantInput(text));
            }}
            keyboardType="decimal-pad"
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
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.submitFormButtonText}>
                {formMode === "create" ? "Créer" : "Modifier"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Filtrer les encaissements pour exclure ceux marqués comme supprimés
  const getFilteredEncaissements = () => {
    return encaissements
      .filter((item) => item.Client === client?.kunnr && !item.isDeleted)
      .sort((a, b) => {
        // Trier par date, les plus récents en premier
        const dateA = a.DateEncaissement
          ? new Date(a.DateEncaissement.replace("/Date(", "").replace(")/", ""))
          : new Date();
        const dateB = b.DateEncaissement
          ? new Date(b.DateEncaissement.replace("/Date(", "").replace(")/", ""))
          : new Date();
        return dateB - dateA;
      });
  };

  // 1. Fonction pour générer le contenu HTML du PDF thermal pour encaissement
  const generateEncaissementThermalPDFContent = (encaissementData) => {
    const currentDate = new Date().toLocaleDateString("fr-FR");
    const currentTime = new Date().toLocaleTimeString("fr-FR");

    // Formater la date d'encaissement
    const formatEncaissementDate = (dateSAP) => {
      if (!dateSAP) return currentDate;

      try {
        // Si c'est déjà une date normale (pour les encaissements offline)
        if (!dateSAP.includes("/Date(")) {
          return new Date(dateSAP).toLocaleDateString("fr-FR");
        }

        // Sinon extraire le timestamp SAP
        const timestampMatch = dateSAP.match(/\/Date\((\d+)\)\//);
        if (timestampMatch && timestampMatch.length >= 2) {
          const timestamp = parseInt(timestampMatch[1]);
          const date = new Date(timestamp);
          return date.toLocaleDateString("fr-FR");
        }
      } catch (error) {
        console.error("Erreur format date:", error);
      }

      return currentDate;
    };

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reçu d'Encaissement</title>
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
          <div class="encaissement-number">N° ${encaissementData.Id}</div>
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
            <span class="info-value">${encaissementData.Client || "N/A"}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Nom:</span>
            <span class="info-value">${
              encaissementData.clientName || "N/A"
            }</span>
          </div>
          <div class="info-row">
            <span class="info-label">Commercial:</span>
            <span class="info-value">${userData?.magasin}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Date Encaissement:</span>
            <span class="info-value">${formatEncaissementDate(
              encaissementData.DateEncaissement,
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
            encaissementData.Montant || 0,
          ).toLocaleString("fr-DZ", {
            style: "currency",
            currency: "DZD",
          })}</div>
        </div>

        <!-- Section signature -->
            <!--  <div class="signature-section">
          <div class="signature-label">Signature du client</div>
          <div class="signature-line"></div>
        </div>-->

        <!-- Pied de page -->
        <div class="footer">
          <div>Merci pour votre confiance</div>
            </div>
      </div>
    </body>
    </html>
  `;
  };

  const handlePrintEncaissement = async (
    encaissement,
    clientData,
    userData,
    navigation,
  ) => {
    try {
      console.log(
        "Préparation de l'impression de l'encaissement...",
        encaissement,
        clientData,
      );

      // Créer l'objet transformedData selon le format demandé
      const transformedData = {
        Id: encaissement.Id,
        Client: encaissement.Client,
        clientName: clientData?.name1,
        commercial: userData?.magasin,
        DateEncaissement: encaissement.DateEncaissement,
        ModePaiement: encaissement.ModePaiement,
        Montant: new Intl.NumberFormat("fr-DZ", {
          style: "currency",
          currency: "DZD",
        }).format(encaissement.Montant),
        // Ajouter la référence seulement si le mode de paiement est CHEQUE et qu'elle existe
        ...(encaissement.ModePaiement === "CHEQUE" &&
          encaissement.Reference && {
            Reference: encaissement.Reference,
          }),
      };

      console.log("transformedData dans print function", transformedData);

      // Préparer les données pour le PDF (garder la logique existante)
      const encaissementData = {
        ...encaissement,
        clientName: clientData?.name1,
        commercialName: userData?.code,
      };

      console.log("encaissment data dans print function", encaissementData);

      // Générer le contenu HTML
      const htmlContent =
        generateEncaissementThermalPDFContent(encaissementData);

      // Naviguer vers l'écran PDF avec les données nécessaires
      navigation.navigate("PDFViewerScreen", {
        htmlContent: htmlContent,
        encaissementId: encaissement.Id,
        encaissementData: transformedData, // Utiliser transformedData au lieu d'encaissementData
        clientData: clientData,
        userData: userData,
        documentType: "encaissement",
        orderData: {
          cmd: "",
          client: clientData.kunnr,
          clientName: clientData.name1,
        },
      });
    } catch (error) {
      console.error("Erreur lors de la préparation de l'impression:", error);
      Alert.alert(
        "Erreur",
        "Impossible de préparer le document pour l'impression. Veuillez réessayer.",
        [{ text: "OK" }],
      );
    }
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            !showOfflineEncaissements && styles.activeToggleButton,
          ]}
          onPress={() => setShowOfflineEncaissements(false)}
        >
          <Text
            style={[
              styles.toggleButtonText,
              !showOfflineEncaissements && styles.activeToggleButtonText,
            ]}
          >
            Mes Encaissments
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            showOfflineEncaissements && styles.activeToggleButton,
          ]}
          onPress={() => setShowOfflineEncaissements(true)}
        >
          <Text
            style={[
              styles.toggleButtonText,
              showOfflineEncaissements && styles.activeToggleButtonText,
            ]}
          >
            Encaissments en attente ( {offlineEncaissements?.length} )
          </Text>
        </TouchableOpacity>
      </View>

      {/* ScrollView principal */}
      {showOfflineEncaissements ? (
        <OfflineEncaissementsScreen route={{ params: { client } }} />
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          <View style={styles.container}>
            {encaissementsLoading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#03A9F4" />
                <Text style={styles.loadingText}>
                  Chargement des encaissements...
                </Text>
              </View>
            ) : encaissementsError ? (
              <View style={styles.centerContainer}>
                <MaterialIcons name="error-outline" size={48} color="#e53935" />
                <Text style={styles.errorText}>{encaissementsError}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={loadEncaissements}
                >
                  <Text style={styles.retryButtonText}>Réessayer</Text>
                </TouchableOpacity>
              </View>
            ) : getFilteredEncaissements().length === 0 ? (
              <View style={styles.centerContainer}>
                <MaterialCommunityIcons
                  name="cash-remove"
                  size={64}
                  color="#E0E0E0"
                />
                <Text style={styles.emptyText}>Aucun encaissement</Text>
              </View>
            ) : (
              // <View style={styles.listContainer}>
              //   {encaissements
              //     .filter((item) => item.Client === client)
              //     .map((item) => (
              //       <TouchableOpacity
              //         key={`encaissement-${item.NumLigne}`}
              //         style={styles.encaissementItem}
              //         onPress={() => showActionModal(item)}
              //       >
              //         <View style={styles.encaissementContent}>
              //           <View style={styles.encaissementIcon}>
              //             {getPaymentIcon(item.ModePaiement)}
              //           </View>
              //           <View style={styles.encaissementInfo}>
              //             <Text style={styles.encaissementDate}>
              //               {formatDate(item.DateEncaissement)}
              //             </Text>
              //             <Text style={styles.encaissementReference}>
              //               {(item.Reference &&
              //                 `${item.ModePaiement} - ${item.Reference}`) ||
              //                 item.ModePaiement ||
              //                 "Encaissement"}
              //             </Text>
              //           </View>
              //           <View style={styles.encaissementMontant}>
              //             <Text style={styles.montantText}>
              //               {formatMontant(item.Montant)}
              //             </Text>
              //           </View>
              //         </View>
              //       </TouchableOpacity>
              //     ))}
              // </View>
              <View style={styles.listContainer}>
                {getFilteredEncaissements().map((item) => (
                  <TouchableOpacity
                    key={`encaissement-${item.NumLigne}`}
                    style={[
                      styles.encaissementItem,
                      item.isOffline && styles.encaissementItemOffline,
                    ]}
                    onPress={() => showActionModal(item)}
                    onLongPress={() =>
                      handlePrintEncaissement(
                        item,
                        client,
                        userData,
                        navigation,
                      )
                    }
                    // disabled={item.isOffline}
                    // disabled={!isServerReachable}
                  >
                    <View style={styles.encaissementContent}>
                      <View style={styles.encaissementIcon}>
                        {getPaymentIcon(item.ModePaiement)}
                      </View>
                      <View style={styles.encaissementInfo}>
                        <Text style={styles.encaissementDate}>
                          {item.isOffline
                            ? formatDateTimeStmp(item.DateEncaissement)
                            : formatDate(item.DateEncaissement)}
                          {/* {formatDate(item.DateEncaissement)}
                            {item.DateEncaissement} */}
                        </Text>
                        <Text style={styles.encaissementReference}>
                          {(item.Reference &&
                            `${item.ModePaiement} - ${item.Reference}`) ||
                            item.ModePaiement ||
                            "Encaissement"}
                        </Text>
                        {item.isOffline && (
                          <Text style={styles.offlineIndicator}>
                            📡 En attente de synchronisation
                          </Text>
                        )}
                      </View>
                      <View style={styles.encaissementMontant}>
                        <Text style={styles.montantText}>
                          {formatMontant(item.Montant)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Bouton flottant */}
      <TouchableOpacity style={styles.floatingButton} onPress={openCreateForm}>
        <AntDesign name="plus" size={24} color="white" />
      </TouchableOpacity>

      {/* Modalize pour les actions sur un encaissement */}
      <Modalize
        ref={actionModalizeRef}
        adjustToContentHeight
        closeOnOverlayTap
        withHandle
      >
        <View style={styles.actionModalContainer}>
          <Text style={styles.actionModalTitle}>Actions</Text>

          {/* Nouveau bouton d'impression */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              actionModalizeRef.current?.close();
              handlePrintEncaissement(
                selectedEncaissement,
                client,
                userData,
                navigation,
              );
            }}
          >
            <MaterialIcons name="print" size={24} color="#4CAF50" />
            <Text style={styles.actionButtonText}>Imprimer le reçu</Text>
          </TouchableOpacity>

          {isServerReachable && (
            <>
              {/* <TouchableOpacity
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
                onPress={handleSupprimerEncaissement}
              >
                <MaterialIcons name="delete" size={24} color="#F44336" />
                <Text
                  style={[styles.actionButtonText, styles.deleteButtonText]}
                >
                  Supprimer l'encaissement
                </Text>
              </TouchableOpacity> */}

              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={handleCancelation}
              >
                <MaterialIcons name="delete" size={24} color="#F44336" />
                <Text
                  style={[styles.actionButtonText, styles.deleteButtonText]}
                >
                  Annuler l'encaissement
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => actionModalizeRef.current?.close()}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </Modalize>
      {/* Modalize pour la raison d'annulation*/}
      <Modalize
        ref={cancelationTextModalizeRef}
        adjustToContentHeight
        closeOnOverlayTap
        withHandle
      >
        <View style={styles.actionModalContainer}>
          <Text style={styles.actionModalTitle}>Raison d'annulation</Text>

          {/* TextInput avec scrolling */}
          <TextInput
            style={styles.cancelationTextInput}
            placeholder="Saisissez la raison de l'annulation..."
            placeholderTextColor="#999"
            multiline={true}
            numberOfLines={5}
            maxLength={200} // Optionnel: limiter le nombre de caractères
            textAlignVertical="top"
            scrollEnabled={true}
            onChangeText={(text) =>
              setEncaissementForm({
                ...encaissementForm,
                RaisonAnnulation: text,
              })
            }
          />

          {/* Boutons d'action */}
          <View style={styles.formActions}>
            <TouchableOpacity
              style={styles.cancelFormButton}
              onPress={() => {
                setCancelationReason(""); // Reset du texte
                cancelationTextModalizeRef.current?.close();
              }}
            >
              <Text style={styles.cancelFormButtonText}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitFormButton}
              onPress={() => {
                handleSubmitCancelation(); // Passer le texte à la fonction
              }}
              disabled={
                isCancelling || !encaissementForm?.RaisonAnnulation?.trim()
              }
            >
              {isCancelling ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.submitFormButtonText}>Confirmer</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modalize>
      {/* Modalize pour le formulaire de création/modification */}
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
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: hp(8.7), // 80 -> responsive
  },
  container: {
    flex: 1,
    paddingBottom: hp(8.7), // 80 -> responsive
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp(3.9), // 16 -> responsive
    paddingVertical: hp(1.7), // 16 -> responsive
    borderBottomWidth: scale(1),
    borderBottomColor: "#EEEEEE",
    backgroundColor: "white",
  },
  headerTitle: {
    fontSize: fs(18),
    fontWeight: fontWeight.bold,
    letterSpacing: scale(1),
    color: "#333",
  },
  listContainer: {
    paddingTop: hp(0.9), // 8 -> responsive
    paddingBottom: hp(2.6), // 24 -> responsive
  },
  encaissementItemOffline: {
    backgroundColor: "#FFF3E0",
    borderLeftWidth: scale(3),
    borderLeftColor: "#FF9800",
  },
  offlineIndicator: {
    fontSize: fs(11),
    color: "#FF6F00",
    fontStyle: "italic",
    marginTop: hp(0.2), // 2 -> responsive
  },
  encaissementItem: {
    backgroundColor: "white",
    marginVertical: hp(0.1), // 1 -> responsive
    padding: wp(3.9), // 16 -> responsive
    elevation: scale(1),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(1) },
    shadowOpacity: 0.2,
    shadowRadius: scale(2),
  },
  encaissementContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  encaissementIcon: {
    width: wp(9.7), // 40 -> responsive
    height: wp(9.7), // 40 -> responsive (utilise wp pour garder le ratio)
    borderRadius: wp(4.9), // 20 -> responsive
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: wp(2.9), // 12 -> responsive
  },
  encaissementInfo: {
    flex: 1,
  },
  encaissementDate: {
    fontSize: fs(14),
    fontWeight: fontWeight.medium,
    color: "#333",
  },
  encaissementReference: {
    fontSize: fs(12),
    color: "#757575",
    marginTop: hp(0.2), // 2 -> responsive
  },
  encaissementMontant: {
    alignItems: "flex-end",
  },
  montantText: {
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
    color: "#006475",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: wp(5.8), // 24 -> responsive
    minHeight: hp(32.8), // 300 -> responsive
  },
  loadingText: {
    marginTop: hp(1.3), // 12 -> responsive
    fontSize: fs(16),
    color: "#757575",
  },
  errorText: {
    marginTop: hp(1.3), // 12 -> responsive
    fontSize: fs(16),
    color: "#e53935",
    textAlign: "center",
    marginBottom: hp(1.7), // 16 -> responsive
  },
  retryButton: {
    backgroundColor: "#03A9F4",
    paddingHorizontal: wp(3.9), // 16 -> responsive
    paddingVertical: hp(0.9), // 8 -> responsive
    borderRadius: scale(8),
    marginTop: hp(1.7), // 16 -> responsive
  },
  retryButtonText: {
    color: "white",
    fontWeight: fontWeight.bold,
  },
  emptyText: {
    marginTop: hp(1.7), // 16 -> responsive
    fontSize: fs(16),
    color: "#757575",
    textAlign: "center",
  },
  floatingButton: {
    position: "absolute",
    bottom: hp(2.6), // 24 -> responsive
    right: wp(5.8), // 24 -> responsive
    width: wp(13.6), // 56 -> responsive
    height: wp(13.6), // 56 -> responsive (utilise wp pour garder le ratio)
    borderRadius: wp(6.8), // 28 -> responsive
    backgroundColor: "#FFA000",
    justifyContent: "center",
    alignItems: "center",
    elevation: scale(5),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.3,
    shadowRadius: scale(3),
  },
  actionModalContainer: {
    padding: wp(5.8), // 24 -> responsive
  },
  actionModalTitle: {
    fontSize: fs(18),
    fontWeight: fontWeight.bold,
    marginBottom: hp(2.6), // 24 -> responsive
    textAlign: "center",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: hp(1.7), // 16 -> responsive
    borderBottomWidth: scale(1),
    borderBottomColor: "#EEEEEE",
  },
  actionButtonText: {
    fontSize: fs(16),
    marginLeft: wp(3.9), // 16 -> responsive
    color: "#333",
  },
  deleteButton: {
    borderBottomWidth: 0,
    marginBottom: hp(1.7), // 16 -> responsive
  },
  deleteButtonText: {
    color: "#F44336",
  },
  cancelButton: {
    backgroundColor: "#EEEEEE",
    borderRadius: scale(8),
    padding: wp(3.9), // 16 -> responsive
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: fs(16),
    color: "#333",
    fontWeight: fontWeight.medium,
  },
  // Styles pour le formulaire
  formContainer: {
    padding: wp(5.8), // 24 -> responsive
  },
  formTitle: {
    fontSize: fs(18),
    fontWeight: fontWeight.bold,
    marginBottom: hp(2.6), // 24 -> responsive
    textAlign: "center",
    color: "#333",
  },
  formGroup: {
    marginBottom: hp(2.2), // 20 -> responsive
  },
  formLabel: {
    fontSize: fs(14),
    color: "#757575",
    marginBottom: hp(0.9), // 8 -> responsive
  },
  textInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: scale(8),
    padding: wp(2.9), // 12 -> responsive
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
    height: hp(4.4), // 40 -> responsive
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
    padding: wp(2.9), // 12 -> responsive
    borderWidth: scale(1),
    borderColor: "#E0E0E0",
    width: "48%",
    marginBottom: hp(1.1), // 10 -> responsive
    flexDirection: "row",
    alignItems: "center",
  },
  modePaiementButtonSelected: {
    backgroundColor: "#E3F2FD",
    borderColor: "#2196F3",
  },
  modePaiementIconContainer: {
    marginRight: wp(1.9), // 8 -> responsive
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
    marginTop: hp(2.6), // 24 -> responsive
  },
  cancelFormButton: {
    borderRadius: scale(8),
    padding: wp(3.9), // 16 -> responsive
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
    padding: wp(3.9), // 16 -> responsive
    alignItems: "center",
    flex: 1,
    marginBottom: hp(0.5), // 5 -> responsive
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
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    elevation: scale(2),
  },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: hp(1.3), // 12 -> responsive
    paddingHorizontal: wp(1.2), // 5 -> responsive
  },
  activeToggleButton: {
    borderBottomWidth: scale(3),
    borderBottomColor: "#03A9F4",
  },
  toggleButtonText: {
    fontSize: fs(14),
    color: "#757575",
  },
  activeToggleButtonText: {
    color: "#03A9F4",
    fontWeight: fontWeight.semiBold,
  },
  printIconButton: {
    padding: wp(1.0), // 4 -> responsive
    marginLeft: wp(1.9), // 8 -> responsive
    borderRadius: scale(4),
    backgroundColor: "#f5f5f5",
  },
  cancelationTextInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
    minHeight: 150, // Hauteur pour ~5 lignes
    maxHeight: 150, // Même hauteur pour forcer le scroll si nécessaire
  },
});

export default EncaissementScreen;
