import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Alert,
  ActivityIndicator,
  BackHandler,
} from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import {
  processDeliveryComplete,
  resetDeliveryProcess,
  resetoutboundstate,
} from "../../../redux/slices/outboundSlice";
import { getCommandesApprouves } from "../../../redux/slices/orderSlice";
import { getstocks } from "../../../redux/slices/stockSlice";
import { loadOfflineLivraisons } from "../../../redux/slices/offlineSlice";
import {
  generateA4InvoicePDF,
  generateThermalPDFContent,
} from "../../../utils/pdf/pdfGenerators";

import DeliveryProcessModal from "../../../components/DeliveryProcessModal";
import ScreenBackground from "../../../components/common/ScreenBackground";

import { scale, fs } from "../../../utils/responsive";
import { Spacing, Radius } from "../../../constants/Theme";
import ArticleLivraisonCard from "../../../components/common/livraison/Articlelivraisoncard";
import QuantityLivraisonModalize from "../../../components/common/livraison/Quantitylivraisonmodalize";
import PrintLivraisonModalize from "../../../components/common/livraison/Printlivraisonmodalize";

const BLUE = "#03A9F4";
const TEAL = "#006475";
const TEXT_DARK = "#1F2937";
const TEXT_MUTED = "#6B7280";
const BORDER = "#E5E7EB";

const CreateLivraisonScreen = ({ route }) => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { order, client } = route.params;

  const {
    loading: livraisonLoading,
    error: livraisonError,
    success: livraisonSuccess,
  } = useSelector((state) => state.outbounds);
  const { stocks, loadingStocks } = useSelector((state) => state.stock);
  const userData = useSelector((state) => state.auth.user);
  const { isServerReachable } = useSelector((state) => state.offline);
  const deliveryProcess = useSelector(
    (state) => state.deliveries.deliveryProcess,
  );

  const isProcessing = deliveryProcess?.isProcessing || false;
  const isComplete = deliveryProcess?.isComplete || false;

  const [livraisonItems, setLivraisonItems] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [quantity, setQuantity] = useState("1");
  const [stockInfo, setStockInfo] = useState({});
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [createdDeliveryId, setCreatedDeliveryId] = useState(null);

  const quantityModalizeRef = useRef(null);
  const printModalizeRef = useRef(null);
  const processModalRef = useRef(null);

  // ── Back handler ─────────────────────────────
  useEffect(() => {
    const onBack = async () => {
      if (isProcessing) return true;
      if (showProcessModal) {
        handleCloseModal();
        return true;
      }
      if (quantityModalizeRef.current?.isOpen) {
        quantityModalizeRef.current.close();
        return true;
      }
      if (printModalizeRef.current?.isOpen) {
        printModalizeRef.current.close();
        return true;
      }
      await dispatch(resetoutboundstate());
      navigation.goBack();
      return true;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", onBack);
    return () => sub.remove();
  }, [isProcessing, showProcessModal]);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

  // ── Init ─────────────────────────────────────
  useEffect(() => {
    if (isServerReachable) dispatch(getstocks({ magasin: userData?.magasin }));
  }, [dispatch, isServerReachable]);

  useEffect(() => {
    dispatch(resetDeliveryProcess());
    dispatch(resetoutboundstate());
  }, []);

  useEffect(() => {
    if (!stocks?.length) return;
    const data = {};
    stocks.forEach((s) => {
      if (!data[s.Material]) {
        data[s.Material] = {
          AvailableStock: parseFloat(s.AvailableStock),
          BaseUnitOfMeasure: s.BaseUnitOfMeasure,
          MaterialDescription: s.MaterialDescription,
          lotDetails: {},
        };
      }
      data[s.Material].lotDetails[s.lot] = {
        lot: s.lot,
        AvailableStockByLot: parseFloat(s.AvailableStockByLot),
      };
    });
    setStockInfo(data);
  }, [stocks]);

  useEffect(() => {
    const items = order.articles
      .filter((a) => parseFloat(a.qte_restante) > 0)
      .map((a) => ({
        id: a.matnr,
        posnr: a.posnr,
        charg: a.charg,
        designation: a.designation,
        unite: a.kmein,
        kbetr: a.kbetr,
        qteCommandee: parseFloat(a.lsmeng),
        qteRestante: parseFloat(a.qte_restante),
        qteALivrer: 0,
      }));
    setLivraisonItems(items);
  }, [order]);

  useEffect(() => {
    if (livraisonSuccess) {
      const t = setTimeout(() => printModalizeRef.current?.open(), 1000);
      return () => clearTimeout(t);
    }
  }, [livraisonSuccess]);

  // ── Handlers ─────────────────────────────────
  const handleArticleSelect = (article) => {
    setSelectedArticle(article);
    setQuantity("1");
    quantityModalizeRef.current?.open();
  };

  const handleQuantityConfirm = () => {
    const qte = parseFloat(quantity);
    const stockItem = stockInfo[selectedArticle.id];
    const hasLot =
      selectedArticle.charg && stockItem?.lotDetails?.[selectedArticle.charg];
    const stockQty = hasLot
      ? stockItem.lotDetails[selectedArticle.charg].AvailableStockByLot
      : stockItem?.AvailableStock || 0;

    if (isNaN(qte) || qte <= 0)
      return Alert.alert(
        t("common.error") || "Erreur",
        t("livraison.errorInvalid"),
      );
    if (qte > selectedArticle.qteRestante)
      return Alert.alert(
        t("common.error") || "Erreur",
        t("livraison.errorExceedsRemaining"),
      );
    if (qte > stockQty)
      return Alert.alert(
        t("common.error") || "Erreur",
        t("livraison.errorExceedsStock"),
      );

    setLivraisonItems((prev) =>
      prev.map((item) =>
        item.id === selectedArticle.id && item.posnr === selectedArticle.posnr
          ? { ...item, qteALivrer: qte }
          : item,
      ),
    );
    quantityModalizeRef.current?.close();
    setQuantity("1");
    setSelectedArticle(null);
  };

  const handleDeselect = (article) => {
    setLivraisonItems((prev) =>
      prev.map((item) =>
        item.id === article.id && item.posnr === article.posnr
          ? { ...item, qteALivrer: 0 }
          : item,
      ),
    );
  };

  const handleSelectAll = () => {
    if (loadingStocks) return Alert.alert("", t("livraison.waitStock"));
    setLivraisonItems((prev) =>
      prev.map((item) => {
        const stockItem = stockInfo[item.id];
        const hasLot = item.charg && stockItem?.lotDetails?.[item.charg];
        const stockQty = hasLot
          ? stockItem.lotDetails[item.charg].AvailableStockByLot || 0
          : stockItem?.AvailableStock || 0;
        if (stockQty <= 0) return item;
        return { ...item, qteALivrer: Math.min(stockQty, item.qteRestante) };
      }),
    );
  };

  const handleSaveLivraison = async () => {
    const itemsToDeliver = livraisonItems.filter((i) => i.qteALivrer > 0);
    if (!itemsToDeliver.length)
      return Alert.alert(
        t("common.error") || "Erreur",
        t("livraison.errorSelectOne"),
      );

    const livraisonData = {
      to_DeliveryDocumentItem: {
        results: itemsToDeliver.map((item) => ({
          ReferenceSDDocument: order.cmd,
          ReferenceSDDocumentItem: item.posnr,
          ActualDeliveryQuantity: item.qteALivrer.toString(),
          DeliveryQuantityUnit: item.unite,
        })),
      },
    };

    setShowProcessModal(true);
    try {
      await dispatch(resetDeliveryProcess());
      processModalRef.current?.open();
      const result = await dispatch(
        processDeliveryComplete({ deliveryData: livraisonData }),
      );

      if (
        result.type === "outbound/deliveries/processDeliveryComplete/fulfilled"
      ) {
        setCreatedDeliveryId(result.payload.deliveryDocument);
        if (result.payload.offline) dispatch(loadOfflineLivraisons(client));
      } else {
        Alert.alert(
          t("common.error") || "Erreur",
          result.payload?.steps?.creation?.error ||
            t("livraison.errorDelivery"),
        );
      }
    } catch {
      Alert.alert(
        t("common.error") || "Erreur",
        t("livraison.errorUnexpected"),
      );
      processModalRef.current?.close();
    } finally {
      if (isServerReachable) {
        await dispatch(getCommandesApprouves({ user: userData?.code }));
        await dispatch(getstocks({ magasin: userData?.magasin }));
      }
      setShowProcessModal(false);
    }
  };

  const handlePrintDelivery = async () => {
    try {
      const articlesLivres = livraisonItems.filter((i) => i.qteALivrer > 0);
      const totalPrice = articlesLivres.reduce(
        (s, i) => s + i.qteALivrer * (i.kbetr || 0),
        0,
      );

      const transformedData = {
        numero: createdDeliveryId,
        date: new Date().toLocaleDateString("fr-FR"),
        heure: new Date().toLocaleTimeString("fr-FR"),
        clientId: order.client,
        clientNom: client.name1 || "N/A",
        livreur: userData?.magasin || "N/A",
        articles: articlesLivres.map((item) => ({
          code: item.id,
          description: item.designation,
          quantite: item.qteALivrer.toString(),
          lot: item.lot || "-",
          unite: item.unite,
          prixUnitaire: item.kbetr || 0,
          prix: (item.kbetr || 0).toLocaleString("fr-DZ", {
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

      printModalizeRef.current?.close();
      navigation.navigate("PDFViewerScreen", {
        htmlContent: generateA4InvoicePDF(transformedData),
        htmlContentThermal: generateThermalPDFContent(
          transformedData,
          livraisonItems,
          createdDeliveryId,
        ),
        deliveryId: createdDeliveryId,
        documentType: "livraison",
        orderData: {
          cmd: order.cmd,
          client: order.client,
          clientName: client.name1 || "N/A",
        },
        deliveryItems: articlesLivres,
        userData,
        clientData: client,
        deliveryData: transformedData,
      });
      setTimeout(() => dispatch(resetDeliveryProcess()), 500);
    } catch {
      Alert.alert(t("common.error") || "Erreur", t("livraison.errorPdf"));
    }
  };

  const cleanupAndNavigateBack = () => {
    printModalizeRef.current?.close();
    navigation.goBack();
    setTimeout(() => {
      dispatch(resetDeliveryProcess());
      dispatch(resetoutboundstate());
    }, 500);
  };

  const handleCloseModal = () => {
    dispatch(resetDeliveryProcess());
    dispatch(resetoutboundstate());
    navigation.goBack();
  };

  // ── Derived ──────────────────────────────────
  const selectedCount = livraisonItems.filter((i) => i.qteALivrer > 0).length;

  // ── Render ───────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScreenBackground />
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => {
            if (!showProcessModal) navigation.goBack();
          }}
          style={styles.backBtn}
        >
          <MaterialIcons name="arrow-back" size={scale(20)} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("livraison.newDelivery")}</Text>
        <View style={{ width: scale(36) }} />
      </View>

      {/* Commande + Client */}
      <View style={styles.infoCard}>
        <View style={styles.clientBlock}>
          <View style={styles.avatarWrap}>
            <MaterialIcons name="person" size={scale(16)} color={BLUE} />
          </View>
          <View style={styles.infoTextCompact}>
            <Text style={styles.infoValueCompact} numberOfLines={1}>
              {client.name1}
            </Text>
            <Text style={styles.infoSubCompact}>{order.client}</Text>
          </View>
        </View>

        <View style={styles.infoVerticalDivider} />

        <View style={styles.cmdBlock}>
          <MaterialIcons name="assignment" size={scale(16)} color={BLUE} />
          <View style={styles.infoTextCompactRight}>
            <Text style={styles.infoValueCompact} numberOfLines={1}>
              N° {order.cmd}
            </Text>
            <Text style={styles.infoSubCompact}>{order.erdat}</Text>
          </View>
        </View>
      </View>

      {/* Section articles */}
      <View style={styles.listSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionLeft}>
            <Text style={styles.sectionTitle}>
              {t("livraison.articlesToDeliver")}
            </Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>
                {selectedCount} / {livraisonItems.length}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.selectAllBtn}
            onPress={handleSelectAll}
            disabled={loadingStocks}
          >
            <MaterialIcons name="select-all" size={scale(16)} color={BLUE} />
            <Text style={styles.selectAllText}>{t("livraison.selectAll")}</Text>
          </TouchableOpacity>
        </View>

        {livraisonItems.length === 0 ? (
          <View style={styles.emptyList}>
            <MaterialIcons
              name="local-shipping"
              size={scale(48)}
              color="#E0E0E0"
            />
            <Text style={styles.emptyText}>{t("livraison.noArticles")}</Text>
            <Text style={styles.emptySubtext}>
              {t("livraison.noArticlesSub")}
            </Text>
          </View>
        ) : (
          <FlatList
            data={livraisonItems}
            renderItem={({ item }) => (
              <ArticleLivraisonCard
                item={item}
                stockInfo={stockInfo}
                onPress={handleArticleSelect}
                onDeselect={handleDeselect}
                loadingStocks={loadingStocks}
              />
            )}
            keyExtractor={(item, index) => `${item.id}-${item.posnr}-${index}`}
            contentContainerStyle={styles.flatListContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {livraisonError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{livraisonError}</Text>
          </View>
        )}
        <TouchableOpacity
          style={[
            styles.saveBtn,
            (livraisonSuccess || selectedCount === 0) && styles.saveBtnDisabled,
          ]}
          onPress={handleSaveLivraison}
          disabled={livraisonLoading || livraisonSuccess || selectedCount === 0}
          activeOpacity={0.85}
        >
          {livraisonLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : livraisonSuccess ? (
            <MaterialCommunityIcons
              name="check-circle"
              size={scale(20)}
              color="#fff"
            />
          ) : (
            <MaterialIcons
              name="local-shipping"
              size={scale(20)}
              color="#fff"
            />
          )}
          <Text style={styles.saveBtnText}>
            {livraisonLoading
              ? t("livraison.creating")
              : livraisonSuccess
                ? t("livraison.created")
                : t("livraison.createDelivery")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <QuantityLivraisonModalize
        reference={quantityModalizeRef}
        selectedArticle={selectedArticle}
        quantity={quantity}
        setQuantity={setQuantity}
        stockInfo={stockInfo}
        onConfirm={handleQuantityConfirm}
      />
      <PrintLivraisonModalize
        reference={printModalizeRef}
        createdDeliveryId={createdDeliveryId}
        onPrint={handlePrintDelivery}
        onClose={cleanupAndNavigateBack}
      />
      <DeliveryProcessModal
        ref={processModalRef}
        orderNumber={order?.cmd}
        deliveryId={createdDeliveryId}
        onPrintDelivery={handlePrintDelivery}
        onClose={handleCloseModal}
      />
    </SafeAreaView>
  );
};

export default CreateLivraisonScreen;

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

  // Info card
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: "transparent",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  clientBlock: {
    flex: 1, // prend l'espace restant — le nom client est de longueur variable
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  avatarWrap: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: "#EAF6FE",
    alignItems: "center",
    justifyContent: "center",
  },
  cmdBlock: {
    flexShrink: 0, // ne grandit pas — le numéro de commande est fixe sur 10 caractères
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  infoTextCompact: {
    flex: 1,
  },
  infoTextCompactRight: {
    alignItems: "flex-end",
  },
  infoValueCompact: {
    fontSize: fs(12.5),
    fontWeight: "700",
    color: TEXT_DARK,
  },
  infoSubCompact: {
    fontSize: fs(10),
    color: TEXT_MUTED,
    marginTop: 1,
  },
  infoVerticalDivider: {
    width: 1,
    height: scale(28),
    backgroundColor: "#E5E7EB",
    marginHorizontal: Spacing.md,
  },

  // List
  listSection: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  sectionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: fs(15),
    fontWeight: "700",
    color: TEXT_DARK,
  },
  countBadge: {
    backgroundColor: "rgba(3,169,244,0.1)",
    borderRadius: scale(10),
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
  },
  countText: {
    fontSize: fs(11),
    fontWeight: "700",
    color: BLUE,
  },
  selectAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    backgroundColor: "#EAF6FE",
    paddingVertical: scale(6),
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
  },
  selectAllText: {
    fontSize: fs(12),
    color: BLUE,
    fontWeight: "600",
  },
  flatListContent: {
    paddingBottom: scale(160),
  },
  emptyList: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: scale(60),
  },
  emptyText: {
    fontSize: fs(15),
    fontWeight: "700",
    color: TEXT_MUTED,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: fs(12),
    color: "#9CA3AF",
    marginTop: 4,
    textAlign: "center",
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
    borderLeftColor: "#D32F2F",
    marginBottom: Spacing.sm,
  },
  errorText: {
    color: "#D32F2F",
    fontSize: fs(12),
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: TEAL,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.md,
  },
  saveBtnDisabled: {
    backgroundColor: "#9CA3AF",
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: fs(15),
  },
});
