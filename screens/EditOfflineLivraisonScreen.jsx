import React, { useLayoutEffect, useState, useEffect, useRef } from "react";
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
  Button,
} from "react-native";
import {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
  Feather,
  AntDesign,
} from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Modalize } from "react-native-modalize";
import { useDispatch, useSelector } from "react-redux";
import {
  addOutbound,
  getAutorisedDate,
  resetoutboundstate,
} from "../redux/slices/outboundSlice";
import { getCommandesApprouves } from "../redux/slices/orderSlice";
import { printForms } from "../services/printFormsService";
import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { getstocks } from "../redux/slices/stockSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");
import { BackHandler } from "react-native";
import { wp, hp, fs, fontWeight, scale } from "../utils/responsive";
import {
  queueOfflineAction,
  removeFromOfflineQueue,
} from "../utils/offlineUtils";
const EditOfflineLivraisonScreen = ({ route }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const {
    livraisonAction,
    order,
    livraisonItems: initialItems,
    error,
    onEditComplete,
  } = route.params;

  const [livraisonItems, setLivraisonItems] = useState(initialItems || []);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [quantity, setQuantity] = useState("1");
  const [loading, setLoading] = useState(false);

  const { stocks, loadingStocks } = useSelector((state) => state.stock);
  const userData = useSelector((state) => state.auth.user);
  const [stockInfo, setStockInfo] = useState({});

  const quantityModalizeRef = useRef(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: `Livraison`,
      headerStyle: {
        backgroundColor: "#03A9F4",
      },
      headerTintColor: "white",
      headerLeft: () => (
        <MaterialCommunityIcons
          name="arrow-left-circle"
          size={30}
          color="white"
          style={{ marginLeft: 15 }}
          onPress={() => navigation.goBack()}
        />
      ),
    });
  }, [navigation, order.cmd]);

  useEffect(() => {
    dispatch(getstocks({ magasin: userData?.magasin }));
  }, [dispatch]);

  // Traitement des données de stock
  useEffect(() => {
    if (stocks && stocks.length > 0) {
      const stockData = {};
      stocks.forEach((item) => {
        if (!stockData[item.Material]) {
          stockData[item.Material] = {
            AvailableStock: parseFloat(item.AvailableStock),
            BaseUnitOfMeasure: item.BaseUnitOfMeasure,
            MaterialDescription: item.MaterialDescription,
            lotDetails: {},
          };
        }
        stockData[item.Material].lotDetails[item.lot] = {
          lot: item.lot,
          AvailableStockByLot: parseFloat(item.AvailableStockByLot),
        };
      });
      setStockInfo(stockData);
    }
  }, [stocks]);

  const handleArticleSelect = (article) => {
    setSelectedArticle(article);
    setQuantity(article.qteALivrer.toString());
    quantityModalizeRef.current?.open();
  };

  const handleQuantityConfirm = () => {
    const qte = parseFloat(quantity);
    const stockItem = stockInfo[selectedArticle.id];
    const hasLot =
      selectedArticle.charg && stockItem?.lotDetails?.[selectedArticle.charg];
    // const lotStock =
    //   stockItem?.lotDetails[selectedArticle.charg]?.AvailableStockByLot || 0;

    const lotStock = hasLot
      ? stockItem.lotDetails[selectedArticle.charg].AvailableStockByLot || 0
      : stockItem?.AvailableStock || 0;

    if (isNaN(qte) || qte < 0) {
      Alert.alert("Erreur", "Veuillez entrer une quantité valide");
      return;
    }

    if (qte > selectedArticle.qteRestante) {
      Alert.alert(
        "Erreur",
        "La quantité ne peut pas dépasser la quantité restante"
      );
      return;
    }

    if (qte > lotStock) {
      Alert.alert(
        "Erreur",
        "La quantité ne peut pas dépasser le stock disponible pour ce lot"
      );
      return;
    }

    const updatedItems = livraisonItems.map((item) => {
      if (
        item.id === selectedArticle.id &&
        item.posnr === selectedArticle.posnr
      ) {
        return { ...item, qteALivrer: qte };
      }
      return item;
    });

    setLivraisonItems(updatedItems);
    quantityModalizeRef.current?.close();
    setQuantity("1");
    setSelectedArticle(null);
  };

  const handleDeselectArticle = (article) => {
    const updatedItems = livraisonItems.map((item) => {
      if (item.id === article.id && item.posnr === article.posnr) {
        return { ...item, qteALivrer: 0 };
      }
      return item;
    });
    setLivraisonItems(updatedItems);
  };

  const handleSaveModification = async () => {
    const itemsToDeliver = livraisonItems.filter((item) => item.qteALivrer > 0);

    if (itemsToDeliver.length === 0) {
      Alert.alert("Erreur", "Veuillez spécifier au moins un article à livrer");
      return;
    }

    try {
      setLoading(true);

      // Supprimer l'ancienne action de la queue
      await removeFromOfflineQueue(livraisonAction.id);

      // Créer la nouvelle action avec les modifications
      const updatedPayload = {
        ...livraisonAction.payload,
        to_DeliveryDocumentItem: {
          results: itemsToDeliver.map((item) => ({
            ReferenceSDDocument: order.cmd,
            ReferenceSDDocumentItem: item.posnr,
            ActualDeliveryQuantity: item.qteALivrer.toString(),
            DeliveryQuantityUnit: item.unite,
          })),
        },
      };

      // Nettoyer l'action des propriétés d'erreur
      const {
        failed,
        error: actionError,
        failedAt,
        retryCount,
        ...cleanLivraisonAction
      } = livraisonAction;

      // Créer la nouvelle action
      const newAction = {
        ...cleanLivraisonAction,
        payload: updatedPayload,
        timestamp: new Date().toISOString(),
      };

      // Ajouter la nouvelle action à la queue
      await queueOfflineAction(newAction);

      Alert.alert("Succès", "Livraison modifiée et mise en file d'attente", [
        {
          text: "OK",
          onPress: () => {
            // Appeler la fonction de callback si elle existe
            if (onEditComplete && typeof onEditComplete === "function") {
              onEditComplete();
            }
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      console.error("Erreur lors de la modification:", error);
      Alert.alert("Erreur", "Impossible de modifier la livraison");
    } finally {
      setLoading(false);
    }
  };

  const renderLivraisonItem = ({ item }) => {
    if (loadingStocks) {
      return (
        <View style={styles.livraisonItem}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemId}>{item.id}</Text>
          </View>
          <Text style={styles.itemName}>
            {item.designation} - Lot: {item.charg}
          </Text>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#4CAF50" />
            <Text style={styles.loadingText}>Chargement du stock...</Text>
          </View>
        </View>
      );
    }

    const stockItem = stockInfo[item.id];
    const lotStock =
      stockItem?.lotDetails[item.charg]?.AvailableStockByLot || 0;
    const isInStock = lotStock > 0;

    return (
      <TouchableOpacity
        style={[
          styles.livraisonItem,
          item.qteALivrer > 0 && styles.selectedItem,
          !isInStock && styles.outOfStockItem,
        ]}
        onPress={() => handleArticleSelect(item)}
        disabled={!isInStock}
      >
        <View style={styles.itemHeader}>
          <View style={styles.headerActions}>
            {item.qteALivrer > 0 && (
              <MaterialIcons name="check-circle" size={18} color="#4CAF50" />
            )}
            <Text style={styles.itemId}>{item.id}</Text>
          </View>
          {item.qteALivrer > 0 && (
            <TouchableOpacity
              onPress={() => handleDeselectArticle(item)}
              style={styles.deselectButton}
            >
              <MaterialIcons name="close" size={22} color="#F44336" />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.itemName}>
          {item.designation} - Lot: {item.charg}
        </Text>

        <View style={styles.qtyContainer}>
          <View style={styles.qtySection}>
            <Text style={styles.qtyLabel}>Commandée :</Text>
            <Text style={styles.qtyValue}>
              {item.qteCommandee} {item.unite}
            </Text>
          </View>

          <View style={styles.qtySection}>
            <Text style={styles.qtyLabel}>Restante :</Text>
            <Text style={styles.qtyValue}>
              {item.qteRestante} {item.unite}
            </Text>
          </View>

          <View style={styles.qtySection}>
            <Text style={styles.qtyLabel}>Stock :</Text>
            <Text
              style={[
                styles.qtyValue,
                isInStock ? styles.greenText : styles.redText,
              ]}
            >
              {lotStock} {item.unite}
            </Text>
          </View>

          <View style={styles.qtySection}>
            <Text style={styles.qtyLabel}>À livrer :</Text>
            <Text
              style={[
                styles.qtyValue,
                item.qteALivrer > 0 ? styles.greenText : styles.grayText,
              ]}
            >
              {item.qteALivrer > 0
                ? `${item.qteALivrer} ${item.unite}`
                : "Non défini"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderQuantityModal = () => {
    if (!selectedArticle) return null;

    const stockItem = stockInfo[selectedArticle.id];
    const lotStock =
      stockItem?.lotDetails[selectedArticle.charg]?.AvailableStockByLot || 0;

    return (
      <View style={styles.quantityModal}>
        <Text style={styles.quantityTitle}>Modifier la quantité à livrer</Text>
        <Text style={styles.quantityArticle}>
          {selectedArticle.designation} - Lot: {selectedArticle.charg}
        </Text>

        <View style={styles.quantityInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Quantité restante:</Text>
            <Text style={styles.infoValue}>
              {selectedArticle.qteRestante} {selectedArticle.unite}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Stock disponible:</Text>
            <Text
              style={[
                styles.infoValue,
                { color: lotStock > 0 ? "#4CAF50" : "#F44336" },
              ]}
            >
              {lotStock} {selectedArticle.unite}
            </Text>
          </View>
        </View>

        {/* <View style={styles.quantityRow}>
          <Text style={styles.quantityLabel}>Quantité à livrer:</Text>
          <TextInput
            style={styles.quantityModalInput}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            placeholder="0"
            selectTextOnFocus
            autoFocus
          />
          <Text style={styles.quantityUnit}>{selectedArticle.unite}</Text>
        </View> */}
        <View style={styles.quantityRow}>
          <Text style={styles.quantityLabel}>Quantité à livrer:</Text>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => {
                const currentQty = parseFloat(quantity);
                if (!isNaN(currentQty) && currentQty > 1) {
                  setQuantity((currentQty - 1).toString());
                }
              }}
            >
              <MaterialIcons name="remove" size={20} color="white" />
            </TouchableOpacity>

            <TextInput
              style={styles.quantityModalInput}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              selectTextOnFocus
              autoFocus
            />

            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => {
                const currentQty = parseFloat(quantity);
                if (!isNaN(currentQty)) {
                  // Ne pas dépasser la quantité restante
                  const newQty = Math.min(
                    currentQty + 1,
                    selectedArticle.qteRestante
                  );
                  setQuantity(newQty.toString());
                } else {
                  setQuantity("1");
                }
              }}
            >
              <MaterialIcons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.maxContainer}>
          <TouchableOpacity
            style={styles.maxButton}
            onPress={() => {
              const stockItem = stockInfo[selectedArticle.id];
              const stockQuantity = stockItem ? stockItem.AvailableStock : 0;
              // Prendre le minimum entre la quantité restante et le stock disponible
              const maxQty = Math.min(
                selectedArticle.qteRestante,
                stockQuantity
              );
              setQuantity(maxQty.toString());
            }}
          >
            <Text style={styles.maxButtonText}>Quantité maximale</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modalButtonsContainer}>
          {/* <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={() => {
              quantityModalizeRef.current?.close();
              setSelectedArticle(null);
              setQuantity("1");
            }}
          >
            <Text style={styles.modalCancelButtonText}>Annuler</Text>
          </TouchableOpacity> */}

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleQuantityConfirm}
          >
            <Text style={styles.confirmButtonText}>Confirmer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* <StatusBar backgroundColor="#4CAF50" barStyle="light-content" /> */}

      {/* Header avec info commande */}
      <View style={styles.headerContainer}>
        <View style={styles.orderSection}>
          <View style={styles.orderIconContainer}>
            <MaterialIcons name="local-shipping" size={24} color="white" />
          </View>
          <View style={styles.orderDetails}>
            <Text style={styles.orderLabel}>Modification Livraison</Text>
            <Text style={styles.orderNumber}>N° {order.cmd}</Text>
            <Text style={styles.orderDate}>{order.clientName}</Text>
          </View>
        </View>
      </View>

      {/* Liste des articles */}
      <View style={styles.livraisonSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Articles de la livraison</Text>
          <Text style={styles.itemCount}>
            {livraisonItems.filter((item) => item.qteALivrer > 0).length} /{" "}
            {livraisonItems.length} article(s)
          </Text>
        </View>

        <FlatList
          data={livraisonItems}
          renderItem={renderLivraisonItem}
          keyExtractor={(item, index) => `${item.id}-${item.posnr}-${index}`}
          contentContainerStyle={styles.livraisonList}
        />
      </View>
      {/* Message d'erreur si présent */}
      {error && (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={20} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Bouton de sauvegarde */}
      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={styles.buttonContainer}
          onPress={handleSaveModification}
          disabled={
            loading ||
            livraisonItems.filter((item) => item.qteALivrer > 0).length === 0
          }
          activeOpacity={0.7}
        >
          <View style={styles.button}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <MaterialIcons name="save" size={24} color="white" />
            )}
            <Text style={styles.buttonText}>
              {loading ? "Enregistrement..." : "Sauvegarder les modifications"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Modal de quantité */}
      <Modalize
        ref={quantityModalizeRef}
        adjustToContentHeight
        modalStyle={styles.modalContainer}
      >
        {renderQuantityModal()}
      </Modalize>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  orderCard: {
    backgroundColor: "#03A9F4",
    padding: wp(2.9), // 12 -> responsive
  },
  orderInfo: {
    alignItems: "center",
  },
  clientCard: {
    backgroundColor: "#03A9F4",
    paddingBottom: hp(1.3), // 12 -> responsive
    paddingHorizontal: wp(2.9), // 12 -> responsive
  },
  clientInfo: {
    marginLeft: wp(7.3), // 30 -> responsive
  },
  livraisonSection: {
    flex: 1,
    margin: wp(2.9), // 12 -> responsive
    backgroundColor: "white",
    borderRadius: scale(8),
    padding: wp(2.9), // 12 -> responsive
    elevation: scale(1),
  },
  sectionHeader: {
    flexDirection: "column",
    marginBottom: hp(1.3), // 12 -> responsive
  },
  sectionTitle: {
    fontSize: fs(18),
    fontWeight: fontWeight.bold,
    marginBottom: hp(0.9), // 8 -> responsive
  },
  sectionActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectAllButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: wp(1.5), // 6 -> responsive
    backgroundColor: "#E3F2FD",
    borderRadius: scale(4),
  },
  selectAllButtonText: {
    color: "#03A9F4",
    fontSize: fs(14),
    marginLeft: wp(1.0), // 4 -> responsive
  },
  itemCount: {
    fontSize: fs(14),
    color: "#757575",
  },
  livraisonList: {
    paddingBottom: hp(1.3), // 12 -> responsive
  },
  livraisonItem: {
    backgroundColor: "#FAFAFA",
    borderRadius: scale(8),
    padding: wp(2.9), // 12 -> responsive
    marginBottom: hp(0.9), // 8 -> responsive
    borderLeftWidth: scale(4),
    borderLeftColor: "#03A9F4",
  },
  selectedItem: {
    borderLeftColor: "#4CAF50",
    backgroundColor: "#F1F8E9",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(0.4), // 4 -> responsive
  },
  headerActions: {
    flexDirection: "row",
    justifyItemst: "space-between",
    alignItems: "center",
  },
  itemId: {
    fontWeight: fontWeight.bold,
    fontSize: fs(16),
    color: "#03A9F4",
    marginLeft: wp(0.5), // 2 -> responsive
  },
  itemName: {
    fontSize: fs(14),
    color: "#616161",
    marginBottom: hp(0.9), // 8 -> responsive
  },
  qtyContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: hp(0.9), // 8 -> responsive
  },
  qtySection: {
    flex: 1,
  },
  qtyLabel: {
    fontSize: fs(12),
    color: "#9E9E9E",
  },
  qtyValue: {
    fontSize: fs(14),
    fontWeight: fontWeight.bold,
  },
  greenText: {
    color: "#4CAF50",
  },
  grayText: {
    color: "#9E9E9E",
  },
  actionPrompt: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: hp(0.9), // 8 -> responsive
    borderTopWidth: scale(1),
    borderTopColor: "#EEEEEE",
  },
  actionText: {
    marginLeft: wp(1.9), // 8 -> responsive
    color: "#03A9F4",
    fontSize: fs(14),
  },
  emptyList: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: wp(4.9), // 20 -> responsive
  },
  emptyText: {
    fontSize: fs(18),
    fontWeight: fontWeight.bold,
    color: "#9E9E9E",
    marginTop: hp(1.7), // 16 -> responsive
  },
  emptySubtext: {
    fontSize: fs(14),
    color: "#BDBDBD",
    textAlign: "center",
    marginTop: hp(0.9), // 8 -> responsive
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(0.5), // 2 -> responsive
    backgroundColor: "#FFEBEE",
    padding: wp(2.9), // 12 -> responsive
    marginHorizontal: wp(2.9), // 12 -> responsive
    marginBottom: hp(1.3), // 12 -> responsive
    borderRadius: scale(8),
    borderLeftWidth: scale(4),
    borderLeftColor: "#D32F2F",
  },
  errorText: {
    color: "#D32F2F",
  },
  buttonSection: {
    padding: wp(2.9), // 12 -> responsive
  },
  buttonContainer: {
    backgroundColor: "#006475",
    borderRadius: scale(8),
    overflow: "hidden",
  },
  successButton: {
    backgroundColor: "#388E3C",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: wp(2.9), // 12 -> responsive
  },
  successButtonInner: {
    backgroundColor: "#388E3C",
  },
  buttonText: {
    color: "white",
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
    marginLeft: wp(1.9), // 8 -> responsive
  },
  modalContainer: {
    padding: wp(3.9), // 16 -> responsive
    borderTopLeftRadius: scale(16),
    borderTopRightRadius: scale(16),
  },
  quantityModal: {
    padding: wp(3.9), // 16 -> responsive
  },
  quantityTitle: {
    fontSize: fs(20),
    fontWeight: fontWeight.bold,
    marginBottom: hp(0.9), // 8 -> responsive
    textAlign: "center",
    color: "#006475",
  },
  quantityArticle: {
    fontSize: fs(16),
    color: "#616161",
    marginBottom: hp(1.7), // 16 -> responsive
    textAlign: "center",
  },
  quantityInfo: {
    backgroundColor: "#F5F5F5",
    borderWidth: scale(1),
    borderColor: "rgba(25, 38, 32, 0.21)",
    padding: wp(2.9), // 12 -> responsive
    borderRadius: scale(8),
    marginBottom: hp(1.7), // 16 -> responsive
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: hp(0.9), // 8 -> responsive
  },
  infoLabel: {
    fontSize: fs(14),
    color: "#757575",
  },
  infoValue: {
    fontSize: fs(14),
    fontWeight: fontWeight.bold,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: hp(1.7), // 16 -> responsive
  },
  quantityLabel: {
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    backgroundColor: "#03A9F4",
    width: wp(8.7), // 36 -> responsive
    height: wp(8.7), // 36 -> responsive (utilise wp pour garder le ratio)
    borderRadius: wp(4.4), // 18 -> responsive
    justifyContent: "center",
    alignItems: "center",
  },
  quantityModalInput: {
    width: wp(14.6), // 60 -> responsive
    height: hp(4.4), // 40 -> responsive
    borderWidth: scale(1),
    borderColor: "#E0E0E0",
    borderRadius: scale(4),
    textAlign: "center",
    fontSize: fs(16),
    marginHorizontal: wp(1.9), // 8 -> responsive
  },
  maxContainer: {
    alignItems: "flex-end",
    marginBottom: hp(1.7), // 16 -> responsive
  },
  maxButton: {
    paddingVertical: hp(0.9), // 8 -> responsive
    paddingHorizontal: wp(3.9), // 16 -> responsive
    borderWidth: scale(1),
    borderColor: "#03A9F4",
    borderRadius: scale(4),
  },
  maxButtonText: {
    color: "#03A9F4",
    fontSize: fs(14),
  },
  confirmButton: {
    backgroundColor: "#006475",
    padding: wp(2.9), // 12 -> responsive
    borderRadius: scale(8),
    alignItems: "center",
  },
  confirmButtonText: {
    color: "white",
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
  },
  headerContainer: {
    backgroundColor: "#03A9F4",
    paddingHorizontal: wp(2.9), // 12 -> responsive
    paddingVertical: hp(0.5), // 5 -> responsive
    borderBottomLeftRadius: scale(15),
    borderBottomRightRadius: scale(15),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
    elevation: scale(3),
  },
  orderSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp(1.1), // 10 -> responsive
  },
  orderIconContainer: {
    width: wp(9.7), // 40 -> responsive
    height: wp(9.7), // 40 -> responsive (utilise wp pour garder le ratio)
    borderRadius: wp(4.9), // 20 -> responsive
    backgroundColor: "rgba(255, 255, 255, 0.24)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: wp(1.9), // 8 -> responsive
  },
  orderDetails: {
    flex: 1,
  },
  orderLabel: {
    fontSize: fs(12),
    color: "rgba(255, 255, 255, 0.8)",
  },
  orderNumber: {
    fontSize: fs(18),
    fontWeight: fontWeight.bold,
    color: "white",
  },
  orderDate: {
    fontSize: fs(13),
    color: "rgba(255, 255, 255, 0.8)",
  },
  separator: {
    height: scale(1),
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  clientSection: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: hp(0.9), // 8 -> responsive
  },
  clientIconContainer: {
    width: wp(9.7), // 40 -> responsive
    height: wp(9.7), // 40 -> responsive (utilise wp pour garder le ratio)
    borderRadius: wp(4.9), // 20 -> responsive
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: wp(2.9), // 12 -> responsive
  },
  clientDetails: {
    flex: 1,
  },
  clientLabel: {
    fontSize: fs(12),
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: hp(0.2), // 2 -> responsive
  },
  clientName: {
    fontSize: fs(18),
    fontWeight: fontWeight.bold,
    color: "white",
  },
  clientCode: {
    fontSize: fs(13),
    color: "rgba(255, 255, 255, 0.8)",
  },
  // Styles pour le modal d'impression
  printModal: {
    padding: wp(5.8), // 24 -> responsive
    alignItems: "center",
  },
  successIcon: {
    marginBottom: hp(1.7), // 16 -> responsive
  },
  printTitle: {
    fontSize: fs(22),
    fontWeight: fontWeight.bold,
    color: "#4CAF50",
    marginBottom: hp(1.3), // 12 -> responsive
    textAlign: "center",
  },
  printDeliveryId: {
    fontSize: fs(16),
    color: "#616161",
    marginBottom: hp(2.2), // 20 -> responsive
    textAlign: "center",
  },
  printQuestion: {
    fontSize: fs(18),
    fontWeight: fontWeight.bold,
    marginBottom: hp(2.6), // 24 -> responsive
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
    padding: wp(2.9), // 12 -> responsive
    borderRadius: scale(8),
    flex: 1,
    marginHorizontal: wp(1.9), // 8 -> responsive
  },
  printNoButton: {
    backgroundColor: "#757575",
  },
  printYesButton: {
    backgroundColor: "#006475",
  },
  printButtonText: {
    color: "white",
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
    marginLeft: wp(1.9), // 8 -> responsive
  },
  outOfStockItem: {
    borderLeftColor: "#F44336",
    backgroundColor: "#FFEBEE",
    opacity: 0.8,
  },
  redText: {
    color: "#F44336",
  },
  loadingText: {
    color: "#4CAF50",
    fontSize: fs(12),
    fontWeight: fontWeight.bold,
    textAlign: "center",
  },
});

export default EditOfflineLivraisonScreen;
