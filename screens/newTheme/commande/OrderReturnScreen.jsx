import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Alert,
  Animated,
  ActivityIndicator,
  BackHandler,
} from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { getArticles } from "../../../redux/slices/articleSlice";
import {
  addOrder,
  addOrderReturn,
  getCommandesApprouves,
  resetOrderState,
} from "../../../redux/slices/orderSlice";
import { printForms } from "../../../services/printFormsService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import ArticlesModalize from "../../../components/ArticlesModalize";
import QuantityModalize from "../../../components/QuantityModalize";
import PrintModalize from "../../../components/PrintModalize";
import { scale, fs } from "../../../utils/responsive";
import { Spacing, Radius } from "../../../constants/Theme";
import ScreenBackground from "../../../components/common/ScreenBackground";
import PriceDisplay from "../../../components/common/Pricedisplay";
import ArticleCard from "../../../components/common/commande/Articlecard";

const BLUE = "#03A9F4";
const GREEN = "#4CAF50";
const RED = "#e53935";
const ORANGE = "#FFA000";
const TEXT_DARK = "#212121";
const TEXT_MUTED = "#757575";
const BORDER = "#E5E7EB";
const FOOTER_HEIGHT = scale(140);

const OrderReturnScreen = ({ route }) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const navigation = useNavigation();
  const { client, motif } = route.params;
  const isRetour = !!motif;

  const dispatch = useDispatch();
  const userData = useSelector((state) => state.auth.user);
  const { articles, loading, error } = useSelector((state) => state.articles);
  const {
    loading: orderLoading,
    error: orderError,
    success: orderSuccess,
    successOffline,
  } = useSelector((state) => state.orders);

  const [commandeItems, setCommandeItems] = useState([]);
  const [totalHT, setTotalHT] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [quantity, setQuantity] = useState("1");
  const [discount, setDiscount] = useState("0");
  const [batch, setBatch] = useState("");
  const [validatedNumbers, setValidatedNumbers] = useState([]);
  const [createdOrderId, setCreatedOrderId] = useState(null);

  const articlesModalizeRef = useRef(null);
  const quantityModalizeRef = useRef(null);
  const printModalizeRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const [articlesModalKey, setArticlesModalKey] = useState(0);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      setArticlesModalKey((prev) => prev + 1);
    }
  }, [isFocused]);
  const handleArticlesModalClose = () => {
    setArticlesModalKey((prev) => prev + 1);
  };

  // ── Back handler ───────────────────────────
  useEffect(() => {
    const handleBackPress = () => {
      if (articlesModalizeRef.current?.isOpen) {
        articlesModalizeRef.current?.close();
        return true;
      }
      if (quantityModalizeRef.current?.isOpen) {
        quantityModalizeRef.current?.close();
        return true;
      }
      if (printModalizeRef.current?.isOpen) return true;
      if (orderLoading) return true;
      if (orderSuccess) return true;

      if (commandeItems.length > 0 && !orderSuccess) {
        Alert.alert(t("order.leaveTitle"), t("order.leaveMsg"), [
          { text: t("order.stay"), style: "cancel" },
          {
            text: t("order.leave"),
            onPress: () => {
              dispatch(resetOrderState());
              navigation.goBack();
            },
          },
        ]);
        return true;
      }
      dispatch(resetOrderState());
      navigation.goBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress,
    );
    return () => backHandler.remove();
  }, [navigation, commandeItems, orderLoading, orderSuccess, dispatch]);

  // ── Initialisation ─────────────────────────
  useEffect(() => {
    const loadValidatedNumbers = async () => {
      try {
        const storedNumbers = await AsyncStorage.getItem(
          "validated_commande_numbers",
        );
        if (storedNumbers) setValidatedNumbers(JSON.parse(storedNumbers));
      } catch (e) {
        console.error("Erreur lors du chargement de l'historique:", e);
      }
    };
    loadValidatedNumbers();
    dispatch(resetOrderState());
  }, []);

  useEffect(() => {
    if (articles.length === 0 && !loading && !error) {
      dispatch(getArticles());
    }
  }, [dispatch, articles.length, loading, error]);

  // ── Historique numéros ─────────────────────
  const saveValidatedNumbers = async (numbers) => {
    try {
      await AsyncStorage.setItem(
        "validated_commande_numbers",
        JSON.stringify(numbers),
      );
    } catch (e) {
      console.error("Erreur lors de la sauvegarde de l'historique:", e);
    }
  };

  const addValidatedNumber = (number) => {
    if (!validatedNumbers.includes(number)) {
      const newValidatedNumbers = [number, ...validatedNumbers].slice(0, 20);
      setValidatedNumbers(newValidatedNumbers);
      saveValidatedNumbers(newValidatedNumbers);
    }
  };

  // ── Articles ───────────────────────────────
  const filteredArticles = articles.filter(
    (article) =>
      article.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const updateTotals = () => {
    const ht = commandeItems.reduce((sum, item) => {
      const discountRate = item.discount ? parseFloat(item.discount) / 100 : 0;
      const priceAfterDiscount =
        (parseFloat(item.prix) || 0) * (1 - discountRate);
      return sum + priceAfterDiscount * (parseFloat(item.quantity) || 0);
    }, 0);
    setTotalHT(ht);
  };

  const handleAddArticle = () => articlesModalizeRef.current?.open();

  const handleArticleSelect = (article) => {
    setSelectedArticle(article);
    articlesModalizeRef.current?.close();
    setQuantity("1");
    setDiscount("0");
    setBatch("");
    quantityModalizeRef.current?.open();
  };

  const handleQuantityConfirm = () => {
    const qte = parseInt(quantity);
    const disc = parseFloat(discount);

    if (isNaN(qte) || qte <= 0) {
      Alert.alert("Erreur", t("order.errorQty"));
      return;
    }

    const isProduitGererParLot = selectedArticle?.gerer_par_lot === true;
    if (isRetour && isProduitGererParLot && !batch.trim()) {
      Alert.alert("Erreur", t("order.errorBatch"));
      return;
    }

    if (isNaN(disc) || disc < 0 || disc > 100) {
      Alert.alert("Erreur", t("order.errorDiscount"));
      return;
    }

    const existingItemIndex = commandeItems.findIndex(
      (item) => item.id === selectedArticle.id,
    );

    if (existingItemIndex !== -1) {
      const updatedItems = [...commandeItems];
      updatedItems[existingItemIndex].quantity = qte;
      updatedItems[existingItemIndex].discount = disc;
      if (isRetour && isProduitGererParLot) {
        updatedItems[existingItemIndex].batch = batch;
      }
      setCommandeItems(updatedItems);
    } else {
      const newItem = { ...selectedArticle, quantity: qte, discount: disc };
      if (isRetour && isProduitGererParLot) newItem.batch = batch;
      setCommandeItems([...commandeItems, newItem]);
    }

    quantityModalizeRef.current?.close();
    setQuantity("1");
    setDiscount("0");
    setBatch("");
    setSelectedArticle(null);
    setTimeout(() => updateTotals(), 100);
  };

  useEffect(() => {
    updateTotals();
  }, [handleQuantityConfirm]);

  // Suppression directe sans Alert
  const handleRemoveItem = (index) => {
    const newItems = [...commandeItems];
    newItems.splice(index, 1);
    setCommandeItems(newItems);
    setTimeout(() => updateTotals(), 100);
    dispatch(resetOrderState());
  };

  const handleEditItem = (item, index) => {
    setSelectedArticle({ ...item, index });
    setQuantity(item.quantity.toString());
    setDiscount(item.discount ? item.discount.toString() : "0");
    setBatch(item.batch || "");
    quantityModalizeRef.current?.open();
  };

  // ── Sauvegarde ─────────────────────────────
  const handleSaveCommande = async () => {
    if (commandeItems.length === 0) {
      Alert.alert("Erreur", t("order.errorEmpty"));
      return;
    }

    if (isRetour) {
      const commandeRetourData = {
        CustomerReturnType: "ZCRN",
        SoldToParty: client.kunnr,
        SDDocumentReason: motif.Augru,
        to_Item: commandeItems.map((item) => {
          const itemData = {
            Material: item.id,
            RequestedQuantity: item.quantity.toString(),
          };
          if (item.batch) itemData.Batch = item.batch;
          return itemData;
        }),
      };
      const orderReturnId = await dispatch(addOrderReturn(commandeRetourData));
      if (!orderReturnId.error) {
        setCreatedOrderId(orderReturnId.payload.CustomerReturn);
      }
    } else {
      const commandeData = {
        SalesOrderType: "ZCMD",
        SoldToParty: client.kunnr,
        to_Item: commandeItems.map((item) => {
          const itemData = {
            Material: item.id,
            RequestedQuantity: item.quantity.toString(),
          };
          if (item.discount && parseFloat(item.discount) > 0) {
            itemData.to_PricingElement = [
              {
                ConditionType: "ZREM",
                ConditionRateValue: item.discount.toString(),
              },
            ];
          }
          return itemData;
        }),
      };
      const orderId = await dispatch(addOrder(commandeData));
      if (!orderId.error) {
        orderId.payload.SalesOrder &&
          addValidatedNumber(orderId.payload.SalesOrder);
        setCreatedOrderId(orderId.payload.SalesOrder);
      }
    }
  };

  useEffect(() => {
    if (orderSuccess) {
      dispatch(
        getCommandesApprouves({ user: userData?.code, client: client?.kunnr }),
      );
      const timer = setTimeout(() => {
        printModalizeRef.current?.open();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [orderSuccess, dispatch]);

  // ── Impression ─────────────────────────────
  const handlePrintOrder = async () => {
    try {
      const response = await printForms(createdOrderId, "ZCMD");
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result.split(",")[1];
        const fileUri =
          FileSystem.documentDirectory + `commande_${createdOrderId}.pdf`;
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert("Erreur", t("order.shareError"));
        }
      };
      reader.readAsDataURL(
        new Blob([response.data], { type: "application/pdf" }),
      );
      printModalizeRef.current?.close();
      cleanupAndNavigateBack();
    } catch (error) {
      Alert.alert("Erreur", t("order.printError"));
    }
  };

  const cleanupAndNavigateBack = () => {
    dispatch(resetOrderState());
    navigation.goBack();
  };

  // ── Render ─────────────────────────────────
  const screenTitle = isRetour ? t("order.returnOrder") : t("order.newOrder");

  const renderCommandeItem = ({ item, index }) => (
    <ArticleCard
      item={item}
      onPress={() => handleEditItem(item, index)}
      onDelete={() => handleRemoveItem(index)}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScreenBackground />
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={scale(20)} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{screenTitle}</Text>
        <View style={{ width: scale(36) }} />
      </View>

      {/* Client + motif de retour */}
      <View style={styles.clientCard}>
        <View style={styles.clientIconWrap}>
          <MaterialIcons name="person" size={scale(20)} color={BLUE} />
        </View>
        <View style={styles.clientTextWrap}>
          <Text style={styles.clientName} numberOfLines={1}>
            {client.name1}
          </Text>
          <Text style={styles.clientCode}>{client.kunnr}</Text>
        </View>
        {isRetour && motif?.Bezei && (
          <View style={styles.motifBadge}>
            <MaterialCommunityIcons
              name="undo-variant"
              size={scale(11)}
              color="#E8530A"
            />
            <Text style={styles.motifBadgeText} numberOfLines={2}>
              {motif.Bezei}
            </Text>
          </View>
        )}
      </View>

      {/* Liste articles */}
      <View style={styles.listSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("order.articles")}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{commandeItems.length}</Text>
          </View>
        </View>

        {commandeItems.length === 0 ? (
          <View style={styles.emptyList}>
            <MaterialIcons name="assignment" size={scale(44)} color="#E0E0E0" />
            <Text style={styles.emptyText}>{t("order.noArticles")}</Text>
            <Text style={styles.emptySubtext}>{t("order.noArticlesSub")}</Text>
          </View>
        ) : (
          <FlatList
            data={commandeItems}
            renderItem={renderCommandeItem}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            contentContainerStyle={styles.commandeList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* FAB + */}
      <TouchableOpacity
        style={[
          styles.addButton,
          isAr ? { left: Spacing.lg } : { right: Spacing.lg },
        ]}
        onPress={handleAddArticle}
        activeOpacity={0.85}
      >
        <MaterialIcons name="add" size={scale(24)} color="#fff" />
      </TouchableOpacity>

      {/* Footer */}
      <View style={styles.footer}>
        {orderError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{orderError}</Text>
          </View>
        )}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{t("order.total")}</Text>
          <PriceDisplay amount={totalHT} intSize={20} decSize={13} />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, orderSuccess && styles.saveBtnSuccess]}
          onPress={handleSaveCommande}
          disabled={orderLoading || orderSuccess}
          activeOpacity={0.85}
        >
          {orderLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : orderSuccess ? (
            <MaterialCommunityIcons
              name="check-circle"
              size={20}
              color="#fff"
            />
          ) : (
            <MaterialIcons name="save" size={20} color="#fff" />
          )}
          <Text style={styles.saveBtnText}>
            {orderLoading
              ? t("order.saving")
              : orderSuccess
                ? t("order.saved")
                : t("order.save")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modalize */}
      <ArticlesModalize
        key={articlesModalKey}
        reference={articlesModalizeRef}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredArticles={filteredArticles}
        handleArticleSelect={handleArticleSelect}
        scrollY={scrollY}
        onClosed={handleArticlesModalClose}
      />
      <QuantityModalize
        reference={quantityModalizeRef}
        selectedArticle={selectedArticle}
        quantity={quantity}
        setQuantity={setQuantity}
        discount={discount}
        setDiscount={setDiscount}
        batch={batch}
        setBatch={setBatch}
        handleQuantityConfirm={handleQuantityConfirm}
        motif={motif}
      />
      <PrintModalize
        reference={printModalizeRef}
        createdOrderId={createdOrderId}
        motif={motif}
        handlePrintOrder={handlePrintOrder}
        cleanupAndNavigateBack={cleanupAndNavigateBack}
      />
    </SafeAreaView>
  );
};

export default OrderReturnScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1 },

  // Header
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    direction: "ltr",
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
    fontSize: fs(20),
    fontWeight: "700",
    color: TEXT_DARK,
  },

  // Client card
  clientCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
    direction: "ltr",
  },
  clientIconWrap: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(50),
    backgroundColor: "#EAF6FE",
    alignItems: "center",
    justifyContent: "center",
  },
  clientTextWrap: { flex: 1 },
  clientName: {
    fontSize: fs(14),
    fontWeight: "700",
    color: TEXT_DARK,
  },
  clientCode: {
    fontSize: fs(11),
    color: TEXT_MUTED,
    marginTop: 1,
  },
  motifBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(3),
    backgroundColor: "#FFF1E0",
    borderRadius: Radius.sm,
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    maxWidth: scale(120),
  },
  motifBadgeText: {
    fontSize: fs(10),
    fontWeight: "700",
    color: "#E8530A",
    flexShrink: 1,
  },

  // Bandeau retour
  retourBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: "#FFF1E0",
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: scale(7),
    borderLeftWidth: scale(3),
    borderLeftColor: "#E8530A",
  },
  retourBannerText: {
    fontSize: fs(12),
    fontWeight: "600",
    color: "#C75000",
    flex: 1,
  },

  // Liste
  listSection: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: fs(15),
    fontWeight: "700",
    color: TEXT_DARK,
  },
  countBadge: {
    backgroundColor: "rgba(3,169,244,0.1)",
    borderRadius: scale(10),
    paddingHorizontal: scale(7),
    paddingVertical: scale(1),
  },
  countText: {
    fontSize: fs(11),
    fontWeight: "700",
    color: BLUE,
  },
  emptyList: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: scale(40),
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: fs(14),
    fontWeight: "700",
    color: TEXT_MUTED,
  },
  emptySubtext: {
    fontSize: fs(12),
    color: "#9E9E9E",
    marginTop: 4,
  },
  commandeList: {
    paddingBottom: FOOTER_HEIGHT,
    direction: "ltr",
  },

  // FAB
  addButton: {
    position: "absolute",
    // right: Spacing.lg,
    bottom: FOOTER_HEIGHT + Spacing.md,
    width: scale(52),
    height: scale(52),
    borderRadius: scale(26),
    backgroundColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },

  // Footer
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  errorBox: {
    backgroundColor: "#FFEBEE",
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    borderLeftWidth: 3,
    borderLeftColor: RED,
    marginBottom: Spacing.sm,
  },
  errorText: {
    color: "#D32F2F",
    fontSize: fs(12),
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  totalLabel: {
    fontSize: fs(13),
    fontWeight: "600",
    color: TEXT_MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: "#006475",
    borderRadius: Radius.pill,
    paddingVertical: Spacing.md,
  },
  saveBtnSuccess: {
    backgroundColor: GREEN,
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: fs(15),
  },
});
