import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Alert,
  ActivityIndicator,
  Animated,
  RefreshControl,
  BackHandler,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";

import {
  getQuotationsApprouve,
  addQuotationItem,
  deleteQuotationItem,
  updateQuotationItem,
  resetQuotationState,
} from "../../../redux/slices/quotationSlice";
import { getArticles } from "../../../redux/slices/articleSlice";
import {
  fetchPendingActionsCount,
  loadOfflineOrders,
} from "../../../redux/slices/offlineSlice";

import { scale, fs } from "../../../utils/responsive";
import { Spacing, Radius } from "../../../constants/Theme";
import ScreenBackground from "../../../components/common/ScreenBackground";

import ArticlesModalize from "../../../components/ArticlesModalize";
import MonthStatusFilter from "../../../components/common/Monthstatusfilter";
import QuotationCard from "../../../components/common/commande/Quotationcard";
import QuotationDetailModalize from "../../../components/common/commande/Quotationdetailmodalize";
import QuotationActionModalize from "../../../components/common/commande/Quotationactionmodalize";
import QuotationQuantityModalize from "../../../components/common/commande/Quotationquantitymodalize";

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
  { key: "initial", label: "Initial", color: "#3B82F6" },
  { key: "encours", label: "En cours", color: "#10B981" },
  { key: "termine", label: "Terminé", color: "#8B5CF6" },
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
  const m = dateSAP.match(/\/Date\((\d+)\)\//);
  if (!m) return "Date invalide";
  return new Date(parseInt(m[1])).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const STATUT_MAPPING = {
  initial: "Initial",
  encours: "En cours",
  termine: "Terminé",
};

// ─── Écran ────────────────────────────────────────────────────────────────────
const QuotationListScreen = ({ route }) => {
  const navigation = useNavigation();
  const { client } = route.params;
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const userData = useSelector((s) => s.auth.user);
  const { isServerReachable } = useSelector((s) => s.offline);
  const { articles } = useSelector((s) => s.articles);
  const {
    QuotationsApprouve: quotationsApprouve,
    loadingQuotationsApprouve: loading,
    errorQuotationsApprouve: error,
    deleteLoading,
    deleteError,
    deleteSuccess,
  } = useSelector((s) => s.Quotations);

  // Filtres
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Données
  const [quotationsDistinctes, setQuotationsDistinctes] = useState([]);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [postesQuotation, setPostesQuotation] = useState([]);

  // Edition article
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedNewArticle, setSelectedNewArticle] = useState(null);
  const [quantity, setQuantity] = useState("1");
  const [minQuantity, setMinQuantity] = useState(0);
  const [statusOperation, setStatusOperation] = useState("");
  const [articlesSearchQuery, setArticlesSearchQuery] = useState("");

  // UI
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  const detailModalRef = useRef(null);
  const actionModalRef = useRef(null);
  const quantityModalRef = useRef(null);
  const articlesModalRef = useRef(null);
  const flatListRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  // ── Back handler ─────────────────────────────
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      navigation.goBack();
      return true;
    });
    return () => sub.remove();
  }, [navigation]);

  // ── Focus ────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      dispatch(loadOfflineOrders(client.kunnr));
      dispatch(fetchPendingActionsCount());
    }, []),
  );

  // ── Chargement ───────────────────────────────
  const { startDateFormatted, endDateFormatted } = getMonthDateRange(
    selectedYear,
    selectedMonth,
  );

  const loadData = useCallback(() => {
    if (isServerReachable) {
      dispatch(
        getQuotationsApprouve({
          user: userData?.code,
          dateDebut: startDateFormatted,
          dateFin: endDateFormatted,
        }),
      );
    }
  }, [
    dispatch,
    userData?.code,
    startDateFormatted,
    endDateFormatted,
    isServerReachable,
  ]);

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    if (isServerReachable) dispatch(getArticles());
  }, [dispatch, isServerReachable]);

  useEffect(() => {
    dispatch(resetQuotationState());
  }, [dispatch]);

  // ── Extraction ───────────────────────────────
  const extraireQuotations = useCallback(
    (data) => {
      if (!data?.length) return [];
      const map = new Map();
      data
        .filter((q) => q.client === client?.kunnr)
        .forEach((q) => {
          if (!map.has(q.cmd)) {
            map.set(q.cmd, {
              cmd: q.cmd,
              client: q.client,
              clientName: client.name1,
              montantTtc: parseFloat(q.ttc).toLocaleString("fr-DZ", {
                style: "currency",
                currency: "DZD",
              }),
              erdat: convertirDateSAP(q.erdat),
              statutGlobal: STATUT_MAPPING[q.statu_off_entete] || "Non reliée",
              status: q.statu_off_entete,
              isOffline: q?.isOffline || false,
              totalArticles: data.filter((x) => x.cmd === q.cmd && !x.isDeleted)
                .length,
            });
          }
        });
      return Array.from(map.values());
    },
    [client?.kunnr, client?.name1],
  );

  const chargerPostes = useCallback(
    (cmd) => {
      if (!quotationsApprouve?.length) return [];
      return quotationsApprouve
        .filter((q) => q.cmd === cmd && !q.isDeleted)
        .map((q) => ({
          matnr: q.matnr,
          posnr: q.posnr,
          kmein: q.kmein,
          kwmeng: parseFloat(q.kwmeng),
          qte_accepte: parseFloat(q.qte_accepte),
          designation: q.maktx || `Article ${q.matnr}`,
          prix: q.prix_unitaire,
          statusItem: q.statu_off_poste,
          isOffline: q.isOffline || false,
        }));
    },
    [quotationsApprouve],
  );

  useEffect(() => {
    setQuotationsDistinctes(extraireQuotations(quotationsApprouve));
  }, [quotationsApprouve, extraireQuotations]);

  // ── Filtrage ─────────────────────────────────
  const commandesFiltrees = useMemo(() => {
    let result = quotationsDistinctes;
    if (selectedStatus !== "all")
      result = result.filter((q) => q.status === selectedStatus);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.cmd.toLowerCase().includes(q) ||
          c.client.toLowerCase().includes(q) ||
          c.clientName?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [quotationsDistinctes, searchQuery, selectedStatus]);

  const filteredArticles = useMemo(
    () =>
      articles.filter(
        (a) =>
          a.designation
            .toLowerCase()
            .includes(articlesSearchQuery.toLowerCase()) ||
          a.id.toLowerCase().includes(articlesSearchQuery.toLowerCase()),
      ),
    [articles, articlesSearchQuery],
  );

  // ── Handlers ─────────────────────────────────
  const handleQuotationPress = (quotation) => {
    setSelectedQuotation(quotation);
    setPostesQuotation(chargerPostes(quotation.cmd));
    detailModalRef.current?.open();
  };

  const handleArticlePress = (article) => {
    setSelectedArticle(article);
    actionModalRef.current?.open();
  };

  const handleEdit = (article) => {
    setStatusOperation("update");
    setSelectedNewArticle(null);
    setSelectedArticle(article);
    setMinQuantity(article.qte_accepte);
    setQuantity(article.kwmeng.toString());
    actionModalRef.current?.close();
    quantityModalRef.current?.open();
  };

  const handleDelete = (article) => {
    if (article.qte_restante < article.lsmeng) {
      Alert.alert(
        "Action impossible",
        "Cet article est déjà livré ou en cours de livraison.",
      );
      return;
    }
    Alert.alert("Confirmer", `Supprimer "${article.designation}" ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: () =>
          dispatch(
            deleteQuotationItem({
              commande: selectedQuotation.cmd,
              itemNumber: article.posnr,
            }),
          ),
      },
    ]);
  };

  const handleAddItem = () => {
    setStatusOperation("add");
    setMinQuantity(0);
    setQuantity("1");
    articlesModalRef.current?.open();
  };

  const handleArticleSelect = (article) => {
    setSelectedNewArticle(article);
    articlesModalRef.current?.close();
    quantityModalRef.current?.open();
  };

  const handleChooseOther = () => {
    quantityModalRef.current?.close();
    setTimeout(() => articlesModalRef.current?.open(), 300);
  };

  const handleUpdateOrAdd = async () => {
    const qte = parseFloat(quantity);
    if (isNaN(qte) || qte < minQuantity) {
      Alert.alert(
        "Quantité invalide",
        `La quantité doit être ≥ ${minQuantity}.`,
      );
      return;
    }
    try {
      const payload = {
        commande: selectedQuotation.cmd,
        article: selectedNewArticle?.id || selectedArticle?.matnr,
        qte,
      };
      const action =
        statusOperation === "update"
          ? updateQuotationItem({
              ...payload,
              itemNumber: selectedArticle.posnr,
            })
          : addQuotationItem(payload);

      const result = await dispatch(action);
      if (result.type.endsWith("/fulfilled")) {
        quantityModalRef.current?.close();
        setSelectedNewArticle(null);
      } else {
        Alert.alert("Erreur", "L'opération a échoué.");
      }
    } catch {
      Alert.alert("Erreur", "Une erreur s'est produite.");
    }
  };

  // ── Effects succès/erreur ────────────────────
  useEffect(() => {
    if (deleteSuccess) {
      const msgs = {
        add: "Article ajouté.",
        update: "Article modifié.",
        delete: "Article supprimé.",
      };
      Alert.alert("Succès", msgs[statusOperation] || "Opération réussie.");
      loadData();
      actionModalRef.current?.close();
      detailModalRef.current?.close();
      dispatch(resetQuotationState());
      setStatusOperation("");
    }
    if (deleteError) {
      Alert.alert("Erreur", deleteError);
      dispatch(resetQuotationState());
    }
  }, [deleteSuccess, deleteError]);

  // ── Render ───────────────────────────────────
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
          <Text style={styles.headerTitle}>Mes offres</Text>
          <Text style={styles.headerSubtitle}>
            {MONTHS[selectedMonth]} {selectedYear}
          </Text>
        </View>
        <View style={{ width: scale(36) }} />
      </View>

      {/* Filtres */}
      {isServerReachable && (
        <MonthStatusFilter
          statusOptions={STATUS_OPTIONS}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Rechercher une offre..."
        />
      )}

      {/* Contenu */}
      {loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={BLUE} />
          <Text style={styles.centerText}>Chargement des offres...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerWrap}>
          <MaterialIcons
            name="error-outline"
            size={scale(44)}
            color="#e53935"
          />
          <Text style={[styles.centerText, { color: "#DC2626" }]}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : commandesFiltrees.length === 0 ? (
        <View style={styles.centerWrap}>
          <MaterialCommunityIcons
            name="file-document-outline"
            size={scale(56)}
            color="#E0E0E0"
          />
          <Text style={styles.centerText}>Aucune offre trouvée</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={commandesFiltrees}
          keyExtractor={(item) => `${item.cmd}-${item.client}`}
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
              onRefresh={loadData}
              colors={[BLUE]}
              tintColor={BLUE}
            />
          }
          renderItem={({ item }) => (
            <QuotationCard
              item={item}
              onPress={() => handleQuotationPress(item)}
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

      {/* Modalizes */}
      <QuotationDetailModalize
        reference={detailModalRef}
        quotation={selectedQuotation}
        postes={postesQuotation}
        isServerReachable={isServerReachable}
        onArticlePress={handleArticlePress}
        onAddItem={handleAddItem}
      />

      <QuotationActionModalize
        reference={actionModalRef}
        article={selectedArticle}
        deleteLoading={deleteLoading}
        onEdit={() => selectedArticle && handleEdit(selectedArticle)}
        onDelete={() => selectedArticle && handleDelete(selectedArticle)}
      />

      <QuotationQuantityModalize
        reference={quantityModalRef}
        statusOperation={statusOperation}
        selectedArticle={selectedArticle}
        selectedNewArticle={selectedNewArticle}
        quantity={quantity}
        setQuantity={setQuantity}
        minQuantity={minQuantity}
        loading={deleteLoading}
        onConfirm={handleUpdateOrAdd}
        onChooseOther={handleChooseOther}
      />

      <ArticlesModalize
        reference={articlesModalRef}
        searchQuery={articlesSearchQuery}
        setSearchQuery={setArticlesSearchQuery}
        filteredArticles={filteredArticles}
        handleArticleSelect={handleArticleSelect}
        scrollY={scrollY}
      />
    </View>
  );
};

export default QuotationListScreen;

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
