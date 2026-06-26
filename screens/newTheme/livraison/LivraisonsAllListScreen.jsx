import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Animated,
  BackHandler,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  MaterialIcons,
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";

import {
  getAllOutbounds,
  processCreateBill,
  processValidationAndGoodsIssue,
} from "../../../redux/slices/outboundSlice";
import { isConnected } from "../../../utils/offlineUtils";
import { generateA4InvoicePDF } from "../../../utils/pdf/pdfGenerators";
import { scale, fs } from "../../../utils/responsive";
import { Spacing, Radius } from "../../../constants/Theme";

import ScreenBackground from "../../../components/common/ScreenBackground";

import LivraisonCard from "../../../components/common/livraison/LivraisonCard";
// import LivraisonDetailModalize from "../../../components/common/livraison/LivraisonDetailModalize";
import MonthStatusFilter from "../../../components/common/Monthstatusfilter";
import LivraisonDetailModalize from "../../../components/common/livraison/Livraisondetailmodalize";

// ─── Constantes ───────────────────────────────────────────────────────────────
const BLUE = "#03A9F4";
const TEXT_DARK = "#1F2937";
const TEXT_MUTED = "#6B7280";

const MONTHS = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Jun",
  "Jul",
  "Aoû",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

const STATUS_OPTIONS = [
  { key: "all", label: "Tous", color: TEXT_MUTED },
  { key: "initial", label: "En préparation", color: "#FF9800" },
  { key: "sortie", label: "Expédiée", color: "#2196F3" },
  { key: "facturé", label: "Facturée", color: "#4CAF50" },
];

// ─── Utilitaires ──────────────────────────────────────────────────────────────
const getMonthDateRange = (year, month) => {
  const end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
  const pad = (n) => String(n).padStart(2, "0");
  return {
    startDateFormatted: `${year}-${pad(month + 1)}-01`,
    endDateFormatted: `${year}-${pad(month + 1)}-${pad(end.getUTCDate())}`,
  };
};

const convertirDateSAP = (dateSAP) => {
  const match = dateSAP.match(/\/Date\((\d+)\)\//);
  if (!match) return "—";
  return new Date(parseInt(match[1])).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const getStatusColor = (s) =>
  STATUS_OPTIONS.find((o) => o.key === s)?.color ?? TEXT_MUTED;
const getStatusLabel = (s) =>
  STATUS_OPTIONS.find((o) => o.key === s)?.label ?? s;

const getProcessButtonConfig = (statut) => {
  switch (statut?.toLowerCase()) {
    case "initial":
      return { title: "Expédier", icon: "local-shipping", show: true };
    case "sortie":
      return { title: "Facturer", icon: "receipt", show: true };
    default:
      return { show: false };
  }
};

// ─── Écran ────────────────────────────────────────────────────────────────────
const LivraisonsAllListScreen = ({ route }) => {
  const navigation = useNavigation();
  const { client } = route.params;
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const userData = useSelector((s) => s.auth.user);
  const {
    allOutbounds: livraisonsList,
    loading,
    error,
  } = useSelector((s) => s.outbounds);
  const { isServerReachable } = useSelector((s) => s.offline);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filteredLivraisons, setFilteredLivraisons] = useState([]);
  const [selectedLivraison, setSelectedLivraison] = useState(null);
  const [articlesLivraison, setArticlesLivraison] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  const flatListRef = useRef(null);
  const modalizeRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  // ── Back handler ─────────────────────────────
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      navigation.goBack();
      return true;
    });
    return () => sub.remove();
  }, [navigation]);

  // ── Chargement ───────────────────────────────
  const loadData = useCallback(
    (year = selectedYear, month = selectedMonth) => {
      if (!isServerReachable) return;
      const { startDateFormatted, endDateFormatted } = getMonthDateRange(
        year,
        month,
      );
      dispatch(
        getAllOutbounds({
          user: userData?.code,
          dateDebut: startDateFormatted,
          dateFin: endDateFormatted,
        }),
      );
    },
    [dispatch, userData?.code, isServerReachable, selectedYear, selectedMonth],
  );

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  // ── Groupement & filtrage ────────────────────
  const groupLivraisons = useCallback(
    (list) => {
      const grouped = {};
      list
        .filter((l) => l.client === client?.kunnr)
        .forEach((item) => {
          const key = `${item.num_doc}-${item.commercial}-${item.client}`;
          if (!grouped[key]) {
            grouped[key] = {
              num_doc: item.num_doc,
              commercial: item.commercial,
              client: item.client,
              clientName: client?.name1,
              date_liv: convertirDateSAP(item.date_liv),
              num_cmd: item.num_cmd,
              staut_globale: item.staut_globale,
              articles: [],
              totalArticles: 0,
              montantTotal: 0,
            };
          }
          const qte = parseFloat(item.qte) || 0;
          const pu = parseFloat(item.prix_unitaire) || 0;
          grouped[key].articles.push({
            num_poste: item.num_poste,
            article: item.article,
            designation_article:
              item.designation_article || `Article ${item.article}`,
            qte,
            unite: item.unite,
            lot: item.lot,
            prix_unitaire: pu,
            montant: qte * pu,
          });
          grouped[key].totalArticles += 1;
          grouped[key].montantTotal += qte * pu;
        });
      return Object.values(grouped);
    },
    [client?.kunnr, client?.name1],
  );

  useEffect(() => {
    let result = groupLivraisons(livraisonsList);
    if (selectedStatus !== "all")
      result = result.filter((l) => l.staut_globale === selectedStatus);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.num_doc.toLowerCase().includes(q) ||
          l.num_cmd.toLowerCase().includes(q) ||
          l.clientName?.toLowerCase().includes(q),
      );
    }
    setFilteredLivraisons(result);
  }, [livraisonsList, searchQuery, selectedStatus, groupLivraisons]);

  // ── Handlers ─────────────────────────────────
  const handleLivraisonPress = (livraison) => {
    setSelectedLivraison(livraison);
    setArticlesLivraison(livraison.articles);
    modalizeRef.current?.open();
  };

  const handlePrintLivraison = (livraison) => {
    const transformedData = {
      numero: livraison.num_doc,
      date: new Date().toLocaleDateString("fr-FR"),
      heure: new Date().toLocaleTimeString("fr-FR"),
      clientId: livraison.client,
      clientNom: livraison.clientName || "N/A",
      livreur: userData?.magasin,
      articles: livraison.articles.map((a) => ({
        code: a.article,
        description: a.designation_article,
        quantite: a.qte.toString(),
        unite: a.unite,
        lot: a.lot || "-",
        prixUnitaire: a.prix_unitaire || 0,
        prix: (a.prix_unitaire || 0).toLocaleString("fr-DZ", {
          style: "currency",
          currency: "DZD",
          minimumFractionDigits: 2,
        }),
      })),
      totalMontant: livraison.montantTotal || 0,
      total: (livraison.montantTotal || 0).toLocaleString("fr-DZ", {
        style: "currency",
        currency: "DZD",
        minimumFractionDigits: 2,
      }),
    };
    modalizeRef.current?.close();
    navigation.navigate("PDFViewerScreen", {
      htmlContent: generateA4InvoicePDF(transformedData),
      deliveryId: livraison.num_doc,
      documentType: "livraison",
      orderData: {
        cmd: livraison.num_cmd,
        client: livraison.client,
        clientName: livraison.clientName || "N/A",
      },
      deliveryItems: livraison.articles,
      userData,
      deliveryData: transformedData,
      clientData: client,
    });
  };

  const handleProcessLivraison = async (livraison) => {
    try {
      setIsProcessing(true);
      const connected = await isConnected();
      if (!connected) {
        Alert.alert("Connexion requise", "Vérifiez votre connexion.");
        return;
      }

      const statut = livraison.staut_globale?.toLowerCase();
      if (statut === "initial") {
        await dispatch(
          processValidationAndGoodsIssue({
            deliveryDocument: livraison.num_doc,
            deliveryItems: livraison.articles.map((a) => ({
              ReferenceSDDocumentItem: a.num_poste,
              ActualDeliveryQuantity: a.qte,
            })),
          }),
        ).unwrap();
      } else if (statut === "sortie") {
        await dispatch(
          processCreateBill({ deliveryDocument: livraison.num_doc }),
        ).unwrap();
      }
      loadData();
    } catch (err) {
      const msg =
        err?.step === "validation_sortie"
          ? err?.error?.message
          : err?.step === "facture"
            ? err?.error || "Erreur lors de la facturation."
            : "Une erreur est survenue.";
      Alert.alert("Erreur", msg);
    } finally {
      setIsProcessing(false);
      modalizeRef.current?.close();
    }
  };

  // ─── Render ────────────────────────────────
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenBackground />
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={scale(20)} color={TEXT_DARK} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Livraisons</Text>
          <Text style={styles.headerSubtitle}>
            {MONTHS[selectedMonth]} {selectedYear}
          </Text>
        </View>
        <View style={{ width: scale(36) }} />
      </View>

      {/* Filtres */}
      <MonthStatusFilter
        statusOptions={STATUS_OPTIONS}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        showMonthFilter={isServerReachable}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Rechercher une livraison..."
      />

      {/* Contenu */}
      {loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={BLUE} />
          <Text style={styles.centerText}>Chargement...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerWrap}>
          <MaterialIcons
            name="error-outline"
            size={scale(44)}
            color="#e53935"
          />
          <Text style={[styles.centerText, { color: "#DC2626" }]}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadData()}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : filteredLivraisons.length === 0 ? (
        <View style={styles.centerWrap}>
          <MaterialCommunityIcons
            name="truck-delivery-outline"
            size={scale(56)}
            color="#E0E0E0"
          />
          <Text style={styles.centerText}>Aucune livraison trouvée</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={filteredLivraisons}
          keyExtractor={(item) => `${item.num_doc}-${item.client}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            {
              useNativeDriver: false,
              listener: (e) =>
                setShowScrollToTop(e.nativeEvent.contentOffset.y > 200),
            },
          )}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => loadData()}
              colors={[BLUE]}
              tintColor={BLUE}
            />
          }
          renderItem={({ item }) => (
            <LivraisonCard
              item={item}
              onPress={() => handleLivraisonPress(item)}
              getStatusColor={getStatusColor}
              getStatusLabel={getStatusLabel}
            />
          )}
        />
      )}

      {/* FAB scroll-to-top */}
      {showScrollToTop && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() =>
            flatListRef.current?.scrollToOffset({ animated: true, offset: 0 })
          }
        >
          <MaterialIcons
            name="keyboard-arrow-up"
            size={scale(24)}
            color="#fff"
          />
        </TouchableOpacity>
      )}

      {/* Modalize détail */}
      <LivraisonDetailModalize
        reference={modalizeRef}
        livraison={selectedLivraison}
        articles={articlesLivraison}
        isProcessing={isProcessing}
        isServerReachable={isServerReachable}
        getProcessButtonConfig={getProcessButtonConfig}
        onPrint={handlePrintLivraison}
        onProcess={handleProcessLivraison}
      />
    </View>
  );
};

export default LivraisonsAllListScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

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
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
  },
  headerTitle: { fontSize: fs(17), fontWeight: "700", color: TEXT_DARK },
  headerSubtitle: {
    fontSize: fs(11),
    color: TEXT_MUTED,
    marginTop: 1,
    fontWeight: "500",
  },

  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  centerText: {
    marginTop: Spacing.md,
    fontSize: fs(14),
    color: TEXT_MUTED,
    textAlign: "center",
  },
  retryBtn: {
    marginTop: Spacing.md,
    backgroundColor: BLUE,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  retryText: { color: "#fff", fontWeight: "700", fontSize: fs(13) },

  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: scale(90),
  },

  fab: {
    position: "absolute",
    bottom: Spacing.xl,
    right: Spacing.lg,
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
});
