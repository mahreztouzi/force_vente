import React, { useState, useEffect, useRef } from "react";
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
} from "../redux/slices/encaissementSlice";
import {
  deleteEncaissement,
  addEncaissement,
} from "../redux/slices/encaissementSlice";
import DateField from "react-native-datefield";

const { width, height } = Dimensions.get("window");

const EncaissementsListModalize = ({
  modalizeRef,
  client,
  facture,
  user,
  onCreateEncaissement,
}) => {
  const dispatch = useDispatch();
  const actionModalizeRef = useRef(null);
  const formModalizeRef = useRef(null);

  console.log("modalize encaissment", client, facture, user);

  const {
    encaissements,
    encaissementsLoading,
    encaissementsError,
    submitLoading,
    submitError,
    deleteLoading,
    deleteError,
  } = useSelector((state) => state.encaissement);

  console.log("encaissments update modalize", encaissements);

  const [selectedEncaissement, setSelectedEncaissement] = useState(null);
  const [formMode, setFormMode] = useState("create"); // "create" ou "edit"
  const [dateValue, setDateValue] = useState(new Date());
  const [displayMontant, setDisplayMontant] = useState("");

  // État pour le formulaire
  const [encaissementForm, setEncaissementForm] = useState({
    Facture: "",
    Commercial: "",
    Client: "",
    NumLigne: "",
    DateEncaissement: new Date().toISOString().slice(0, 10), // Format YYYY-MM-DD
    Montant: "",
    ModePaiement: "ESPECE", // Valeur par défaut
    Reference: "",
  });

  // Modes de paiement disponibles
  const modesPaiement = ["ESPECE", "CHEQUE"];

  // useEffect(() => {
  //   // Réinitialiser l'état des encaissements quand la facture change
  //   if (facture && client && user) {
  //     // Réinitialiser d'abord l'état pour éviter de montrer les anciennes données
  //     dispatch(resetEncaissementState());
  //     // Puis charger les nouvelles données
  //     loadEncaissements();
  //   }
  // }, [dispatch, facture, client, user]);

  // Fonction pour réinitialiser les données lors de la fermeture
  const handleModalClose = () => {
    dispatch(resetEncaissementState());
  };

  // Fonction pour charger les encaissements
  // Dans EncaissementsListModalize.js
  useEffect(() => {
    // Ne pas charger les données automatiquement au montage du composant
    // On les chargera seulement quand la modale s'ouvre
  }, []);

  // Séparation du chargement des données de l'effet de changement de props
  const loadEncaissements = () => {
    if (!facture || !client || !user) return;

    console.log("Chargement des encaissements pour:", {
      facture,
      client,
      user,
    });

    // Réinitialiser l'état avant de charger de nouvelles données
    dispatch(resetEncaissementState());

    // Puis charger les nouvelles données
    dispatch(
      getEncaissment({
        client: client,
        commercial: user,
        facture: facture,
      })
    );
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

  // Formater les montants avec un séparateur de milliers et 2 décimales
  const formatMontant = (montant) => {
    if (!montant) return "0.00";

    // return parseFloat(montant)
    //   .toFixed(2)
    //   .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
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
      Facture: facture || "",
      Commercial: user || "",
      Client: client || "",
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

    // Extraire la date de la chaîne SAP
    const dateObj = extractDateObjectFromSAP(encaissement.DateEncaissement);
    const dateString = dateObj.toISOString().slice(0, 10);
    setDateValue(dateObj);

    setEncaissementForm({
      Facture: encaissement.Facture || facture,
      Commercial: encaissement.Commercial || user,
      Client: encaissement.Client || client,
      NumLigne: encaissement.NumLigne || "",
      DateEncaissement: dateString,
      Montant: encaissement.Montant ? encaissement.Montant.toString() : "",
      ModePaiement: encaissement.ModePaiement || "ESPECE",
      Reference: encaissement.Reference || "",
    });

    formModalizeRef.current?.open();
  };

  // Gérer le changement de date avec DateField
  // const handleDateChange = (date) => {
  //   if (date) {
  //     setDateValue(date);
  //     setEncaissementForm({
  //       ...encaissementForm,
  //       DateEncaissement: date.toISOString().slice(0, 10),
  //     });
  //   }
  // };

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
                  facture: selectedEncaissement.Facture,
                  client: selectedEncaissement.Client,
                  commercial: selectedEncaissement.Commercial,
                  numLigne: selectedEncaissement.NumLigne,
                })
              )
                .unwrap()
                .then(() => {
                  loadEncaissements(); // Recharger la liste
                  Alert.alert("Succès", "Encaissement supprimé avec succès");
                })
                .catch((err) => {
                  Alert.alert(
                    "Erreur",
                    err.message || "Erreur lors de la suppression"
                  );
                });
            } else {
              Alert.alert("Erreur", "Impossible de supprimer cet encaissement");
            }
          },
        },
      ]
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
      Facture: encaissementForm.Facture,
      Commercial: encaissementForm.Commercial,
      Client: encaissementForm.Client,
      NumLigne: encaissementForm.NumLigne,
      DateEncaissement: formatDateForApi(encaissementForm.DateEncaissement),
      Montant: encaissementForm.Montant,
      ModePaiement: encaissementForm.ModePaiement,
      Reference: encaissementForm.Reference,
    };

    (formMode && formMode === "create"
      ? dispatch(addEncaissement(payload))
      : dispatch(modifyEncaissement(payload))
    )
      .unwrap()
      .then(() => {
        formModalizeRef.current?.close();
        loadEncaissements();
        Alert.alert(
          "Succès",
          formMode === "create"
            ? "Encaissement créé avec succès"
            : "Encaissement modifié avec succès"
        );
      })
      .catch((err) => {
        Alert.alert(
          "Erreur",
          err.message ||
            (formMode === "create"
              ? "Erreur lors de la création"
              : "Erreur lors de la modification")
        );
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

  // Rendu de l'en-tête
  const renderHeader = () => {
    return (
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Facture N° : {facture}</Text>
        <TouchableOpacity onPress={() => modalizeRef.current?.close()}>
          <AntDesign name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>
    );
  };

  // Rendu d'un élément de la liste
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.encaissementItem}
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
        {/* <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Montant (DZD)</Text>
          <TextInput
            style={styles.textInput}
            value={displayMontant}
            onChangeText={(text) => {
              // Enlever tous les caractères non numériques sauf le point décimal
              const numericValue = text.replace(/[^0-9.]/g, "");

              // Mettre à jour la valeur brute dans le formulaire
              setEncaissementForm({
                ...encaissementForm,
                Montant: numericValue,
              });

              // Formater pour l'affichage uniquement si nécessaire
              if (numericValue) {
                const formattedValue = parseFloat(numericValue).toLocaleString(
                  "fr-DZ",
                  {
                    style: "currency",
                    currency: "DZD",
                  }
                );
                setDisplayMontant(formattedValue);
              } else {
                setDisplayMontant("");
              }
            }}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />
        </View> */}

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
            // disabled={submitLoading}
          >
            {submitLoading ? (
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

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* <Modalize
        ref={modalizeRef}
        modalHeight={height * 1}
        HeaderComponent={renderHeader}
        FloatingComponent={
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={openCreateForm}
          >
            <AntDesign name="plus" size={24} color="white" />
          </TouchableOpacity>
        }
        scrollViewProps={{
          showsVerticalScrollIndicator: false,
          bouncesZoom: true,
        }}
        onOpen={loadEncaissements}
        onClose={handleModalClose}
        closeOnScroll={false}
        panGestureEnabled={false}
        withHandle={false}
      >
        <View style={styles.container}>{renderContent()}</View>
      </Modalize> */}

      {/* <Modalize
        ref={modalizeRef}
        modalHeight={height * 1}
        // adjustToContentHeight={true}
        HeaderComponent={renderHeader}
        FloatingComponent={
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={openCreateForm}
          >
            <AntDesign name="plus" size={24} color="white" />
          </TouchableOpacity>
        }
        scrollViewProps={{
          showsVerticalScrollIndicator: false,
          bouncesZoom: true,
        }}
        onOpen={() => {
          console.log("Modalize ouverte pour la facture:", facture);
          loadEncaissements();
        }}
        onClose={handleModalClose}
        closeOnScroll={false}
        panGestureEnabled={false}
        withHandle={false}
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
          ) : !encaissements || encaissements.length === 0 ? (
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
          ) : (
            <View style={styles.listContainer}>
              {encaissements.map((item) => (
                <TouchableOpacity
                  key={`encaissement-${item.NumLigne}`}
                  style={styles.encaissementItem}
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
                        {(item.Reference &&
                          `${item.ModePaiement} - ${item.Reference}`) ||
                          item.ModePaiement ||
                          "Encaissement"}
                      </Text>
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
      </Modalize> */}

      {/* Header */}
      {/* {renderHeader && renderHeader()} */}

      {/* ScrollView principal */}
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
          ) : !encaissements || encaissements.length === 0 ? (
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
          ) : (
            <View style={styles.listContainer}>
              {encaissements.map((item) => (
                <TouchableOpacity
                  key={`encaissement-${item.NumLigne}`}
                  style={styles.encaissementItem}
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
                        {(item.Reference &&
                          `${item.ModePaiement} - ${item.Reference}`) ||
                          item.ModePaiement ||
                          "Encaissement"}
                      </Text>
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

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleModifierEncaissement}
          >
            <MaterialIcons name="edit" size={24} color="#2196F3" />
            <Text style={styles.actionButtonText}>Modifier l'encaissement</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleSupprimerEncaissement}
          >
            <MaterialIcons name="delete" size={24} color="#F44336" />
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
              Supprimer l'encaissement
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => actionModalizeRef.current?.close()}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
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
    paddingBottom: 80, // Espace pour le bouton flottant
  },
  container: {
    flex: 1,
    paddingBottom: 80, // Espace pour le bouton flottant
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    backgroundColor: "white",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: 1,
    color: "#333",
  },
  listContainer: {
    // paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  encaissementItem: {
    backgroundColor: "white",
    // borderRadius: 8,
    marginVertical: 1,
    padding: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  encaissementContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  encaissementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  encaissementInfo: {
    flex: 1,
  },
  encaissementDate: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  encaissementReference: {
    fontSize: 12,
    color: "#757575",
    marginTop: 2,
  },
  encaissementMontant: {
    alignItems: "flex-end",
  },
  montantText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#006475",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    minHeight: 300,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#757575",
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: "#e53935",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#03A9F4",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#757575",
    textAlign: "center",
  },
  floatingButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFA000",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  actionModalContainer: {
    padding: 24,
  },
  actionModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  actionButtonText: {
    fontSize: 16,
    marginLeft: 16,
    color: "#333",
  },
  deleteButton: {
    borderBottomWidth: 0,
    marginBottom: 16,
  },
  deleteButtonText: {
    color: "#F44336",
  },
  cancelButton: {
    backgroundColor: "#EEEEEE",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  // Styles pour le formulaire
  formContainer: {
    padding: 24,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
    color: "#333",
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontWeight: 700,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  // Styles pour DateField
  dateFieldContainer: {
    // borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    // backgroundColor: "#F5F5F5",
    // padding: 4,
  },
  dateField: {
    width: "100%",
  },
  dateFieldInput: {
    height: 40,
    width: "30%",
    fontSize: 16,
    fontWeight: 700,
    color: "#333",
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
  },
  modesPaiementContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  modePaiementButton: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    width: "48%",
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  modePaiementButtonSelected: {
    backgroundColor: "#E3F2FD",
    borderColor: "#2196F3",
  },
  modePaiementIconContainer: {
    marginRight: 8,
  },
  modePaiementButtonText: {
    fontSize: 14,
    color: "#333",
  },
  modePaiementButtonTextSelected: {
    color: "#2196F3",
    fontWeight: "bold",
  },
  formActions: {
    flexDirection: "column-reverse",
    justifyContent: "space-between",
    marginTop: 24,
  },
  cancelFormButton: {
    // backgroundColor: "#EEEEEE",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    flex: 1,
  },
  cancelFormButtonText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  submitFormButton: {
    backgroundColor: "#006475",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    flex: 1,
    marginBottom: 5,
  },
  submitFormButtonText: {
    fontSize: 16,
    color: "white",
    fontWeight: "bold",
  },
  submitButtonDisabled: {
    backgroundColor: "#8CADB5",
    opacity: 0.7,
  },
});

export default EncaissementsListModalize;
