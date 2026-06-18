import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  TextInput,
  FlatList,
  Alert,
  Dimensions,
  ActivityIndicator,
  Modal,
  Pressable,
  Animated,
} from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { getOutboundsToBill } from "../redux/slices/outboundSlice";
import InvoiceConfirmationModal from "../components/InvoiceConfirmationModal";
import { addBill, resetBillState } from "../redux/slices/billSlice";
import { printForms } from "../services/printFormsService";
import { Modalize } from "react-native-modalize";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { BackHandler } from "react-native";
import {
  fetchPendingActionsCount,
  loadOfflineBills,
} from "../redux/slices/offlineSlice";
import OfflineBillsScreen from "./OfflineBillsScreen";

const { width, height } = Dimensions.get("window");

const BillingScreen = ({ route }) => {
  const { client } = route.params;
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const userData = useSelector((state) => state.auth.user);

  const { outboundsToBill, loading, error } = useSelector(
    (state) => state.outbounds
  );
  const {
    loading: billLoading,
    error: billError,
    success,
  } = useSelector((state) => state.bills);
  const { isConnected, isServerReachable, offlineBills } = useSelector(
    (state) => state.offline
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filtredOutbounds, setfiltredOutbounds] = useState([]);
  const [selectedLivraison, setSelectedLivraison] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [createdBillId, setCreatedBillId] = useState(null);
  const [validatedNumbers, setValidatedNumbers] = useState([]);
  const [showofflineBills, setShowofflineBills] = useState(false);

  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        setShowScrollToTop(offsetY > 200); // Affiche le bouton après 200px de scroll
      },
    }
  );
  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
  };

  const printModalizeRef = useRef(null);

  console.log("outbounds listes", outboundsToBill);

  useFocusEffect(
    useCallback(() => {
      dispatch(loadOfflineBills(client.kunnr));
      dispatch(fetchPendingActionsCount()); // Recharger la liste
    }, [navigation, dispatch])
  );

  useEffect(() => {
    const handleBackPress = () => {
      // Comportement normal - retourner à l'écran précédent
      navigation.goBack();
      dispatch(resetBillState());
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress
    );
    return () => backHandler.remove();
  }, [navigation]);

  useEffect(() => {
    dispatch(resetBillState());
    // Charger l'historique des numéros validés
    const loadValidatedNumbers = async () => {
      try {
        const storedNumbers = await AsyncStorage.getItem(
          "validated_facture_numbers"
        );
        if (storedNumbers) {
          setValidatedNumbers(JSON.parse(storedNumbers));
        }
      } catch (error) {
        console.error("Erreur lors du chargement de l'historique:", error);
      }
    };

    loadValidatedNumbers();
  }, []);

  // Fonction pour sauvegarder l'historique dans le localStorage
  const saveValidatedNumbers = async (numbers) => {
    try {
      await AsyncStorage.setItem(
        "validated_facture_numbers",
        JSON.stringify(numbers)
      );
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de l'historique:", error);
    }
  };

  // Fonction pour ajouter un numéro validé
  const addValidatedNumber = (number) => {
    if (!validatedNumbers.includes(number)) {
      const newValidatedNumbers = [number, ...validatedNumbers];
      // Limiter l'historique à 20 éléments pour ne pas surcharger le stockage
      const limitedNumbers = newValidatedNumbers.slice(0, 20);
      setValidatedNumbers(limitedNumbers);
      saveValidatedNumbers(limitedNumbers);
    }
  };

  useEffect(() => {
    if (outboundsToBill.length === 0) {
    }
    dispatch(
      getOutboundsToBill({
        user: userData?.code,
        // client: client?.kunnr,
      })
    );
    cleanupAndNavigateBack();
  }, [dispatch, client]);

  useEffect(() => {
    if (outboundsToBill.length > 0) {
      const grouped = groupLivraisons(
        outboundsToBill.filter(
          (bill) => bill.kunag === client?.kunnr && bill?.offlineStatus != true
        )
      );

      if (searchQuery.trim() === "") {
        setfiltredOutbounds(grouped);
      } else {
        const filtered = grouped.filter(
          (item) =>
            item.vbeln.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.kunag.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.vgbel.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setfiltredOutbounds(filtered);
      }
    }
  }, [outboundsToBill, searchQuery]);

  const convertirDateSAP = (dateSAP) => {
    const timestampMatch = dateSAP.match(/\/Date\((\d+)\)\//);
    if (!timestampMatch || timestampMatch.length < 2) {
      return "Date invalide";
    }

    const timestamp = parseInt(timestampMatch[1]);
    const date = new Date(timestamp);

    const options = {
      day: "2-digit",
      month: "long",
      year: "numeric",
    };

    return date.toLocaleDateString("fr-FR", options);
  };

  const groupLivraisons = (livraisonsList) => {
    const uniqueLivraisons = [];
    const seen = new Set();

    livraisonsList.forEach((item) => {
      if (!seen.has(item.vbeln)) {
        seen.add(item.vbeln);
        uniqueLivraisons.push({
          vbeln: item.vbeln,
          ernam: item.ernam,
          kunag: item.kunag,
          vgbel: item.vgbel,
          erdat: convertirDateSAP(item.erdat),
        });
      }
    });

    return uniqueLivraisons;
  };

  const handleLivraisonPress = (livraison) => {
    dispatch(resetBillState());
    setSelectedLivraison(livraison);
    setModalVisible(true);
  };

  // const handleConfirmFacturation = async () => {
  //   if (selectedLivraison) {
  //     const numFacture = await dispatch(addBill(selectedLivraison.vbeln));
  //     console.log("num facture payload", numFacture);
  //     if (success) {
  //       setCreatedBillId(numFacture.payload);
  //       addValidatedNumber(numFacture.payload);
  //       dispatch(
  //         getOutboundsToBill({
  //           user: userData?.code,
  //           client: client?.kunnr,
  //         })
  //       );
  //       setModalVisible(false);
  //     }
  //   }
  // };

  const handleConfirmFacturation = async () => {
    if (selectedLivraison) {
      try {
        const result = await dispatch(addBill(selectedLivraison.vbeln));

        if (result.error) {
        } else {
          // Succès - le numéro est dans result.payload
          setCreatedBillId(result.payload);
          addValidatedNumber(result.payload);

          // Rafraîchir la liste
          dispatch(
            getOutboundsToBill({
              user: userData?.code,
              client: client?.kunnr,
            })
          );
        }
      } catch (error) {}
    }
  };
  useEffect(() => {
    if (success) {
      setModalVisible(false);
      // Ouvrir le modal d'impression
      const timer = setTimeout(() => {
        printModalizeRef.current?.open();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [success, dispatch]);

  const handlePrintOrder = async () => {
    try {
      const response = await printForms(createdBillId, "ZFLC");
      console.log("response forms", response);

      // Convertir le blob en base64
      const reader = new FileReader();

      reader.onload = async () => {
        const base64Data = reader.result.split(",")[1];

        // Créer le fichier dans le système de fichiers
        const fileUri =
          FileSystem.documentDirectory + `facture_${createdBillId}.pdf`;

        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Ouvrir le PDF
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert(
            "Erreur",
            "Le partage de fichiers n'est pas disponible sur cet appareil"
          );
        }
      };

      reader.readAsDataURL(
        new Blob([response.data], { type: "application/pdf" })
      );

      printModalizeRef.current?.close();
    } catch (error) {
      console.error("Erreur lors de l'impression:", error);
      Alert.alert("Erreur", "Impossible d'imprimer le document");
    }
  };
  // Nettoyer l'état et revenir en arrière
  const cleanupAndNavigateBack = async () => {
    // Réinitialiser l'état
    await dispatch(resetBillState());
    printModalizeRef.current?.close();
  };

  const renderLivraisonItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.commandeContainer}
        onPress={() => handleLivraisonPress(item)}
      >
        <View style={styles.commandeHeader}>
          <View style={styles.commandeInfo}>
            <Text style={styles.commandeNumber}>Livraison N° {item.vbeln}</Text>
            <Text style={styles.commandeDate}>Créée le: {item.erdat}</Text>
            <Text style={styles.commandeDate}>Commande N°: {item.vgbel}</Text>
          </View>
          <View style={styles.commandeStats}>
            <MaterialIcons name="receipt" size={24} color="#03A9F4" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#03A9F4" barStyle="light-content" />

      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            !showofflineBills && styles.activeToggleButton,
          ]}
          onPress={() => setShowofflineBills(false)}
        >
          <Text
            style={[
              styles.toggleButtonText,
              !showofflineBills && styles.activeToggleButtonText,
            ]}
          >
            Livraisons à facturer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            showofflineBills && styles.activeToggleButton,
          ]}
          onPress={() => {
            setShowofflineBills(true);
            scrollToTop;
            setShowScrollToTop(false);
          }}
        >
          <Text
            style={[
              styles.toggleButtonText,
              showofflineBills && styles.activeToggleButtonText,
            ]}
          >
            Factures en attente ( {offlineBills?.length} )
          </Text>
        </TouchableOpacity>
      </View>

      {!showofflineBills && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={24} color="#757575" />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher une livraison..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== "" && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <MaterialIcons name="clear" size={20} color="#757575" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#03A9F4" />
          <Text style={styles.loaderText}>Chargement des livraisons...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#e53935" />
          <Text style={styles.errorText}>Erreur: {error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => dispatch(getOutboundsToBill())}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : showofflineBills ? (
        <OfflineBillsScreen route={{ params: { client } }} />
      ) : filtredOutbounds.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="truck-delivery"
            size={64}
            color="#E0E0E0"
          />
          <Text style={styles.emptyText}>
            {searchQuery.trim() !== ""
              ? "Aucune livraison ne correspond à votre recherche"
              : "Aucune livraison à facturer"}
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={filtredOutbounds}
          renderItem={renderLivraisonItem}
          keyExtractor={(item) => item.vbeln}
          contentContainerStyle={styles.commandesList}
          onScroll={handleScroll} // Ajoutez cette ligne
          scrollEventThrottle={16} // Ajoutez cette ligne
        />
      )}
      {/* Modal de confirmation */}
      <InvoiceConfirmationModal
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        selectedLivraison={selectedLivraison}
        handleConfirmFacturation={handleConfirmFacturation}
        loading={billLoading}
        error={billError}
      />

      {/* modlaise printer */}
      <Modalize
        ref={printModalizeRef}
        adjustToContentHeight
        modalStyle={styles.modalContainer}
        disableScrollIfPossible
        closeOnOverlayTap={false}
      >
        <View style={styles.printModal}>
          <MaterialCommunityIcons
            name="check-circle"
            size={60}
            color="#4CAF50"
            style={styles.successIcon}
          />

          <Text style={styles.printTitle}>Facture créée avec succès</Text>

          {createdBillId && (
            <Text style={styles.printDeliveryId}>
              Facture N° {createdBillId}
            </Text>
          )}

          {createdBillId && (
            <Text style={styles.printQuestion}>
              Souhaitez-vous imprimer la Facture ?
            </Text>
          )}

          <View style={styles.printActions}>
            <TouchableOpacity
              style={[styles.printButton, styles.printNoButton]}
              onPress={cleanupAndNavigateBack}
            >
              {createdBillId && (
                <MaterialIcons name="close" size={20} color="white" />
              )}

              <Text style={styles.printButtonText}>
                {createdBillId ? "Non merci" : "OK"}
              </Text>
            </TouchableOpacity>

            {createdBillId && (
              <TouchableOpacity
                style={[styles.printButton, styles.printYesButton]}
                onPress={handlePrintOrder}
              >
                <MaterialIcons name="print" size={20} color="white" />
                <Text style={styles.printButtonText}>Imprimer</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modalize>

      {!showofflineBills && showScrollToTop && (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={scrollToTop}
          activeOpacity={0.8}
        >
          <MaterialIcons name="keyboard-arrow-up" size={28} color="white" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  searchContainer: {
    marginTop: 10,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  commandesList: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 20,
  },
  commandeContainer: {
    backgroundColor: "white",
    borderRadius: 5,
    marginBottom: 2,
    elevation: 1,
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.1,
    // shadowRadius: 2,
  },
  commandeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  commandeInfo: {
    flex: 1,
  },
  commandeNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#03A9F4",
  },
  commandeDate: {
    fontSize: 12,
    color: "#757575",
    marginTop: 4,
  },
  commandeStats: {
    justifyContent: "center",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    marginTop: 12,
    fontSize: 16,
    color: "#757575",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
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
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#757575",
    textAlign: "center",
  },
  // Styles pour le modal d'impression
  printModal: {
    padding: 24,
    alignItems: "center",
  },
  successIcon: {
    marginBottom: 16,
  },
  printTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 12,
    textAlign: "center",
  },
  printDeliveryId: {
    fontSize: 16,
    color: "#616161",
    marginBottom: 20,
    textAlign: "center",
  },
  printQuestion: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  printActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  printButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 8,
  },
  printNoButton: {
    backgroundColor: "#757575",
  },
  printYesButton: {
    backgroundColor: "#006475",
  },
  printButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  // mode hors ligne
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    elevation: 2,
  },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  activeToggleButton: {
    borderBottomWidth: 3,
    borderBottomColor: "#03A9F4",
  },
  toggleButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#757575",
  },
  activeToggleButtonText: {
    color: "#03A9F4",
    fontWeight: "600",
  },
  floatingButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 28,
    backgroundColor: "#03A9F4",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 4 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    zIndex: 1000,
  },
});

export default BillingScreen;
