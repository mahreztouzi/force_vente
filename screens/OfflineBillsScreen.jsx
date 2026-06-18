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
} from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Modalize } from "react-native-modalize";
import {
  getOfflineActionQueue,
  removeFromOfflineQueue,
  clearOfflineQueue,
} from "../utils/offlineUtils";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPendingActionsCount,
  loadOfflineBills,
  retryFailedBill,
} from "../redux/slices/offlineSlice";
import { syncOfflineData } from "../redux/offlineActions/offlineActions";
import { updateOutboundToBillsNotOfflineQueued } from "../redux/slices/outboundSlice";

const OfflineBillsScreen = ({ route }) => {
  const navigation = useNavigation();
  const { client } = route.params;
  const clientName = client.name1;
  const dispatch = useDispatch();
  const { offlineBills, isServerReachable } = useSelector(
    (state) => state.offline
  );
  const [loading, setLoading] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const modalizeRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      dispatch(loadOfflineBills(client.kunnr));
    }, [])
  );

  const handleClearAllBills = () => {
    if (offlineBills.length === 0) {
      Alert.alert("Information", "Aucune facture hors ligne à supprimer");
      return;
    }

    Alert.alert(
      "Confirmation",
      "Voulez-vous supprimer toutes les factures hors ligne ?",
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
                "Toutes les factures hors ligne ont été supprimées"
              );
              await handleRefresh();
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer les factures");
            }
          },
        },
      ]
    );
  };

  const openBillActions = (billAction) => {
    setSelectedBill(billAction);
    modalizeRef.current?.open();
  };

  const handleDeleteBill = () => {
    modalizeRef.current?.close();
    if (!selectedBill) return;
    console.log("selelcted bill", selectedBill);
    Alert.alert(
      "Confirmation",
      "Voulez-vous supprimer cette facture de la file d'attente ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await removeFromOfflineQueue(selectedBill.id);
              // pour mettre a jour le state des livraison en false afin de les affichés dans la listes
              await dispatch(
                updateOutboundToBillsNotOfflineQueued(selectedBill.payload)
              );
              await dispatch(loadOfflineBills(client.kunnr));
              await dispatch(fetchPendingActionsCount());
              Alert.alert("Succès", "Facture supprimée de la file d'attente");
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer la facture");
            }
          },
        },
      ]
    );
  };

  const getBillTypeDisplay = (action) => {
    return {
      type: "Facture",
      icon: "receipt",
      color: "#03A9F4",
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

  const handleRefresh = async () => {
    await dispatch(loadOfflineBills(client.kunnr));
    await dispatch(fetchPendingActionsCount());
  };

  const renderOfflineBill = ({ item }) => {
    const billType = getBillTypeDisplay(item);
    const hasError = item.failed;
    const livraisonNumber = item.payload;

    return (
      <TouchableOpacity
        style={[styles.billCard, hasError && styles.billCardError]}
        onPress={() => openBillActions(item)}
        activeOpacity={0.7}
      >
        <View style={styles.billHeader}>
          <View style={styles.billTypeContainer}>
            <MaterialIcons
              name={hasError ? "error" : billType.icon}
              size={24}
              color={hasError ? "#F44336" : billType.color}
            />
            <View style={styles.billTypeInfo}>
              <Text
                style={[
                  styles.billType,
                  { color: hasError ? "#F44336" : billType.color },
                ]}
              >
                {hasError ? "Facture en erreur" : billType.type}
              </Text>
            </View>
          </View>
          <MaterialIcons name="more-vert" size={24} color="#757575" />
        </View>

        <View style={styles.billDetails}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons
              name="truck-delivery"
              size={16}
              color="#757575"
            />
            <Text style={styles.detailText}>
              Livraison N° {livraisonNumber}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialIcons name="access-time" size={16} color="#757575" />
            <Text style={styles.detailText}>
              Créée le: {formatDate(item.timestamp)}
            </Text>
          </View>

          {/* <View style={styles.detailRow}>
            <MaterialIcons name="business" size={16} color="#757575" />
            <Text style={styles.detailText}>Client: {clientName}</Text>
          </View> */}

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

  const handleRetryBill = async (hasError) => {
    modalizeRef.current?.close();
    if (!selectedBill) return;

    const executeSync = async () => {
      try {
        // Si erreur, d'abord retry, sinon synchroniser directement
        if (hasError) {
          await dispatch(retryFailedBill(selectedBill.id));
        }

        // Tenter la synchronisation spécifique
        const syncResult = await dispatch(syncOfflineData(selectedBill.id));

        // Rafraîchir les données
        await handleRefresh();

        // Vérifier si la synchronisation a réussi
        if (syncResult.payload && syncResult.payload.success) {
          Alert.alert("Succès", "Facture synchronisée avec succès");
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
          `Impossible de ${hasError ? "réessayer" : "synchroniser"} la facture`
        );
      }
    };

    if (hasError) {
      Alert.alert("Confirmation", "Voulez-vous réessayer cette facture ?", [
        { text: "Annuler", style: "cancel" },
        { text: "Réessayer", onPress: executeSync },
      ]);
    } else {
      await executeSync();
    }
  };

  const renderActionModal = () => {
    if (!selectedBill) return null;

    const billType = getBillTypeDisplay(selectedBill);
    const hasError = selectedBill.failed;
    const livraisonNumber =
      selectedBill.payload?.vbeln ||
      selectedBill.payload?.deliveryNumber ||
      "N/A";

    return (
      <View style={styles.modalContent}>
        <View style={styles.actionModalContainer}>
          <Text style={styles.actionModalTitle}>Actions sur la facture</Text>

          {/* <View style={styles.billInfoContainer}>
            <MaterialIcons name="receipt" size={24} color="#03A9F4" />
            <View style={styles.billInfo}>
              <Text style={styles.billInfoText}>
                Livraison N° {livraisonNumber}
              </Text>
              <Text style={styles.billInfoSubText}>{clientName}</Text>
            </View>
          </View> */}

          {isServerReachable && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleRetryBill(hasError)}
            >
              <MaterialIcons name="refresh" size={24} color="#FF9800" />
              <Text style={styles.actionButtonText}>
                {hasError ? "Réessayer la facture" : "Synchroniser la facture"}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDeleteBill}
          >
            <MaterialIcons name="delete" size={24} color="#F44336" />
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
              Supprimer la facture
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#03A9F4" barStyle="light-content" />

      {offlineBills.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="cloud-done" size={64} color="#E0E0E0" />
          <Text style={styles.emptyTitle}>Aucune facture hors ligne</Text>
          <Text style={styles.emptySubtitle}>
            Toutes vos factures sont synchronisées
          </Text>
        </View>
      ) : (
        <FlatList
          data={offlineBills}
          renderItem={renderOfflineBill}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  billCardError: {
    borderLeftWidth: 4,
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
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#757575",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9E9E9E",
    marginTop: 8,
    textAlign: "center",
  },
  listContainer: {
    marginTop: 10,
  },
  billCard: {
    backgroundColor: "white",
    padding: 16,
    marginBottom: 2,
  },
  billHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  billTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  billTypeInfo: {
    marginLeft: 12,
  },
  billType: {
    fontSize: 16,
    fontWeight: "bold",
  },
  billDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#424242",
  },
  // Styles pour la modalize
  modal: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  overlay: {
    backgroundColor: "rgba(209, 214, 222, 0.25)",
  },
  modalContent: {},
  actionModalContainer: {
    padding: 24,
  },
  actionModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  billInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  billInfo: {
    marginLeft: 12,
    flex: 1,
  },
  billInfoText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  billInfoSubText: {
    fontSize: 14,
    color: "#757575",
    marginTop: 2,
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
});

export default OfflineBillsScreen;
