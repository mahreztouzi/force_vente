import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  StatusBar,
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  MaterialIcons,
  MaterialCommunityIcons,
  AntDesign,
} from "@expo/vector-icons";
import { Modalize } from "react-native-modalize";
import { useDispatch, useSelector } from "react-redux";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import {
  getEncaissment,
  modifyEncaissement,
  resetEncaissementState,
  addEncaissement,
} from "../../../redux/slices/encaissementSlice";
import {
  fetchPendingActionsCount,
  loadOfflineEncaissements,
  loadAllOfflineEncaissements,
} from "../../../redux/slices/offlineSlice";
import { scale, fs } from "../../../utils/responsive";
import { Spacing, Radius } from "../../../constants/Theme";
import ScreenBackground from "../../../components/common/ScreenBackground";
import EncaissementCard from "../../../components/common/encaissement/EncaissementCard";
import EncaissementFormModal from "../../../components/common/encaissement/EncaissementFormModal";
import CancelationModal from "../../../components/common/encaissement/CancelationModal";
import { generateEncaissementThermalPDFContent } from "../../../utils/pdf/pdfGenerators";

const BLUE = "#03A9F4";
const TEXT_DARK = "#212121";
const TEXT_MUTED = "#757575";

const EncaissementScreen = ({ route }) => {
  const { client } = route.params;
  const navigation = useNavigation();
  const userData = useSelector((state) => state.auth.user);
  const user = userData.code;
  const dispatch = useDispatch();

  const actionModalizeRef = useRef(null);
  const formModalizeRef = useRef(null);
  const cancelationModalizeRef = useRef(null);

  const { encaissements, encaissementsLoading, encaissementsError } =
    useSelector((state) => state.encaissement);
  const { isServerReachable } = useSelector((state) => state.offline);

  const [selectedEncaissement, setSelectedEncaissement] = useState(null);
  const [formMode, setFormMode] = useState("create");
  const [dateValue, setDateValue] = useState(new Date());
  const [displayMontant, setDisplayMontant] = useState("");
  const [cancelationReason, setCancelationReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const [encaissementForm, setEncaissementForm] = useState({
    Id: "",
    Commercial: "",
    Client: "",
    NumLigne: "",
    DateEncaissement: new Date().toISOString().slice(0, 10),
    Montant: "",
    ModePaiement: "ESPECE",
    Reference: "",
    RaisonAnnulation: "",
    MontantAnnuler: "",
  });

  useFocusEffect(
    useCallback(() => {
      dispatch(loadOfflineEncaissements(client.kunnr));
      dispatch(fetchPendingActionsCount());
    }, []),
  );

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

  const loadEncaissements = useCallback(() => {
    if (!client || !user) return;
    dispatch(resetEncaissementState());
    if (isServerReachable) {
      dispatch(getEncaissment({ commercial: user }));
    }
  }, [client, user, isServerReachable, dispatch]);

  useEffect(() => {
    loadEncaissements();
  }, []);

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

  const formatDateForApi = (dateString) =>
    dateString ? `${dateString}T00:00:00` : "";

  const openCreateForm = () => {
    setFormMode("create");
    setDisplayMontant("");
    const currentDate = new Date();
    setDateValue(currentDate);
    setEncaissementForm({
      Id: `${userData?.magasin || ""}${Date.now().toString()}`,
      Commercial: user || "",
      Client: client.kunnr || "",
      NumLigne: "",
      DateEncaissement: currentDate.toISOString().slice(0, 10),
      Montant: "",
      ModePaiement: "ESPECE",
      Reference: "",
    });
    formModalizeRef.current?.open();
  };

  const showActionModal = (encaissement) => {
    setSelectedEncaissement(encaissement);
    actionModalizeRef.current?.open();
  };

  const openReasonForCancelationText = (encaissement) => {
    const dateObj = extractDateObjectFromSAP(encaissement.DateEncaissement);
    setDateValue(dateObj);
    setEncaissementForm({
      Id: encaissement.Id,
      Commercial: encaissement.Commercial || user,
      Client: encaissement.Client,
      NumLigne: encaissement.NumLigne || "",
      DateEncaissement: dateObj.toISOString().slice(0, 10),
      Montant: encaissement.Montant ? encaissement.Montant.toString() : "",
      ModePaiement: encaissement.ModePaiement || "ESPECE",
      Reference: encaissement.Reference || "",
      RaisonAnnulation: encaissement.RaisonAnnulation || "",
      MontantAnnuler: "X",
    });
    cancelationModalizeRef.current?.open();
  };

  const handleDateChange = (date) => {
    if (date) {
      setDateValue(date);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      setEncaissementForm((prev) => ({
        ...prev,
        DateEncaissement: `${year}-${month}-${day}`,
      }));
    }
  };

  const handleCancelation = () => {
    actionModalizeRef.current?.close();
    if (selectedEncaissement)
      openReasonForCancelationText(selectedEncaissement);
  };

  const handleSubmitForm = () => {
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

    dispatch(addEncaissement(payload))
      .unwrap()
      .then(() => {
        formModalizeRef.current?.close();
        loadEncaissements();
        dispatch(loadAllOfflineEncaissements());
        Alert.alert("Succès", "Encaissement créé avec succès");
      })
      .catch((err) => {
        Alert.alert("Erreur", err.message || "Erreur lors de la création");
      })
      .finally(() => setIsSubmitting(false));
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
    setIsCancelling(true);
    dispatch(modifyEncaissement(payload))
      .unwrap()
      .then(() => {
        loadEncaissements();
        dispatch(loadAllOfflineEncaissements());
        Alert.alert("Succès", "Encaissement annulé avec succès", [
          {
            text: "OK",
            onPress: () => cancelationModalizeRef.current?.close(),
          },
        ]);
      })
      .catch((err) => {
        Alert.alert("Erreur", err.message || "Erreur lors de l'annulation");
      })
      .finally(() => setIsCancelling(false));
  };

  const getFilteredEncaissements = () => {
    return (encaissements || [])
      .filter((item) => item.Client === client?.kunnr && !item.isDeleted)
      .sort((a, b) => {
        const dateA = a.DateEncaissement
          ? new Date(a.DateEncaissement.replace("/Date(", "").replace(")/", ""))
          : new Date();
        const dateB = b.DateEncaissement
          ? new Date(b.DateEncaissement.replace("/Date(", "").replace(")/", ""))
          : new Date();
        return dateB - dateA;
      });
  };

  const handlePrintEncaissement = (encaissement) => {
    try {
      const transformedData = {
        Id: encaissement.Id,
        Client: encaissement.Client,
        clientName: client?.name1,
        commercial: userData?.magasin,
        DateEncaissement: encaissement.DateEncaissement,
        ModePaiement: encaissement.ModePaiement,
        Montant: encaissement.Montant,
        ...(encaissement.ModePaiement === "CHEQUE" &&
          encaissement.Reference && { Reference: encaissement.Reference }),
      };

      const htmlContent = generateEncaissementThermalPDFContent(
        transformedData,
        userData,
      );

      navigation.navigate("PDFViewerScreen", {
        htmlContent,
        encaissementId: encaissement.Id,
        encaissementData: transformedData,
        clientData: client,
        userData,
        documentType: "encaissement",
        orderData: { cmd: "", client: client.kunnr, clientName: client.name1 },
      });
    } catch (error) {
      console.error("Erreur lors de la préparation de l'impression:", error);
      Alert.alert(
        "Erreur",
        "Impossible de préparer le document pour l'impression.",
      );
    }
  };

  const filteredList = getFilteredEncaissements();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScreenBackground />
      <StatusBar barStyle="dark-content" />

      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <MaterialIcons name="arrow-back" size={scale(20)} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Encaissements</Text>
        <View style={{ width: scale(36) }} />
      </View>

      {encaissementsLoading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={BLUE} />
          <Text style={styles.loadingText}>
            Chargement des encaissements...
          </Text>
        </View>
      ) : encaissementsError ? (
        <View style={styles.centerWrap}>
          <MaterialIcons
            name="error-outline"
            size={scale(44)}
            color="#e53935"
          />
          <Text style={styles.errorText}>{encaissementsError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadEncaissements}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : filteredList.length === 0 ? (
        <View style={styles.centerWrap}>
          <MaterialCommunityIcons
            name="cash-remove"
            size={scale(56)}
            color="#E0E0E0"
          />
          <Text style={styles.emptyText}>Aucun encaissement</Text>
        </View>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={(item) => `encaissement-${item.NumLigne}`}
          renderItem={({ item }) => (
            <EncaissementCard
              item={item}
              onPress={() => showActionModal(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={openCreateForm}
        activeOpacity={0.85}
      >
        <AntDesign name="plus" size={scale(24)} color="#fff" />
      </TouchableOpacity>

      {/* Modalize actions */}
      <Modalize
        ref={actionModalizeRef}
        adjustToContentHeight
        closeOnOverlayTap
        withHandle
      >
        <View style={styles.actionContainer}>
          <Text style={styles.actionTitle}>Actions</Text>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              actionModalizeRef.current?.close();
              handlePrintEncaissement(selectedEncaissement);
            }}
          >
            <MaterialIcons name="print" size={scale(22)} color="#4CAF50" />
            <Text style={styles.actionText}>Imprimer le reçu</Text>
          </TouchableOpacity>

          {isServerReachable && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteAction]}
              onPress={handleCancelation}
            >
              <MaterialIcons name="delete" size={scale(22)} color="#F44336" />
              <Text style={[styles.actionText, styles.deleteText]}>
                Annuler l'encaissement
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => actionModalizeRef.current?.close()}
          >
            <Text style={styles.closeText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </Modalize>

      <CancelationModal
        reference={cancelationModalizeRef}
        reason={encaissementForm.RaisonAnnulation}
        onChangeReason={(text) =>
          setEncaissementForm((prev) => ({ ...prev, RaisonAnnulation: text }))
        }
        isCancelling={isCancelling}
        onConfirm={handleSubmitCancelation}
        onCancel={() => {
          setCancelationReason("");
          cancelationModalizeRef.current?.close();
        }}
      />

      <EncaissementFormModal
        reference={formModalizeRef}
        formMode={formMode}
        form={encaissementForm}
        setForm={setEncaissementForm}
        displayMontant={displayMontant}
        setDisplayMontant={setDisplayMontant}
        dateValue={dateValue}
        onDateChange={handleDateChange}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmitForm}
        onCancel={() => formModalizeRef.current?.close()}
      />
    </SafeAreaView>
  );
};

export default EncaissementScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  backBtn: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(50),
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: fs(17),
    fontWeight: "700",
    color: TEXT_DARK,
  },

  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: scale(100),
  },

  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  loadingText: { marginTop: Spacing.md, fontSize: fs(14), color: TEXT_MUTED },
  errorText: {
    marginTop: Spacing.md,
    fontSize: fs(14),
    color: "#e53935",
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  retryBtn: {
    backgroundColor: BLUE,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  retryText: { color: "#fff", fontWeight: "700", fontSize: fs(13) },
  emptyText: { marginTop: Spacing.lg, fontSize: fs(14), color: TEXT_MUTED },

  fab: {
    position: "absolute",
    right: Spacing.lg,
    bottom: Spacing.xl,
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    backgroundColor: "#FFA000",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },

  actionContainer: { padding: Spacing.xl },
  actionTitle: {
    fontSize: fs(17),
    fontWeight: "700",
    color: TEXT_DARK,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  actionText: { fontSize: fs(15), color: TEXT_DARK },
  deleteAction: { borderBottomWidth: 0, marginBottom: Spacing.md },
  deleteText: { color: "#F44336" },
  closeBtn: {
    backgroundColor: "#EEEEEE",
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: "center",
  },
  closeText: { fontSize: fs(15), color: TEXT_DARK, fontWeight: "600" },
});
