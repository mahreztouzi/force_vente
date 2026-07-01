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
import { useTranslation } from "react-i18next";

import { getAllCommande } from "../../../redux/slices/orderSlice";
import {
  fetchPendingActionsCount,
  loadOfflineOrders,
} from "../../../redux/slices/offlineSlice";

import { scale, fs } from "../../../utils/responsive";
import { Spacing, Radius } from "../../../constants/Theme";
import ScreenBackground from "../../../components/common/ScreenBackground";

import MonthStatusFilter from "../../../components/common/Monthstatusfilter";
import CommandeVenteDetailModalize from "../../../components/common/commande/Commandeventedetailmodalize";
import StatusListCard from "../../../components/common/StatusListCard";

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

const STATUS_COLORS = {
  initial: "#3B82F6",
  encours: "#10B981",
  termine: "#8B5CF6",
};

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

// ─── Écran ────────────────────────────────────────────────────────────────────
const CommandeVenteListeScreen = ({ route }) => {
  const navigation = useNavigation();
  const { client, retour } = route.params;
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const userData = useSelector((s) => s.auth.user);
  const { isServerReachable, offlineOrders } = useSelector((s) => s.offline);
  const {
    allOrders: commandesVenteData,
    allOrdersLoading: loading,
    allOrdersError: error,
  } = useSelector((s) => s.orders);

  // ── Statut options (réactif i18n) ────────────────
  const STATUS_OPTIONS = [
    { key: "all", label: t("order.statusAll"), color: TEXT_MUTED },
    { key: "initial", label: t("order.statusInitial"), color: "#3B82F6" },
    { key: "encours", label: t("order.statusEncours"), color: "#10B981" },
    { key: "termine", label: t("order.statusTermine"), color: "#8B5CF6" },
  ];

  const STATUT_MAPPING = {
    initial: t("order.statusInitial"),
    encours: t("order.statusEncours"),
    termine: t("order.statusTermine"),
  };

  // Filtres
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Toggle vente / retour
  const [showRetours, setShowRetours] = useState(retour ? true : false);

  // Données
  const [commandesDistinctes, setCommandesDistinctes] = useState([]);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [postesCommande, setPostesCommande] = useState([]);

  // UI
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  const detailModalRef = useRef(null);
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
    }, [offlineOrders.length]),
  );

  // ── Chargement ───────────────────────────────
  const { startDateFormatted, endDateFormatted } = getMonthDateRange(
    selectedYear,
    selectedMonth,
  );

  const loadData = useCallback(() => {
    if (isServerReachable) {
      dispatch(
        getAllCommande({
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

  // ── Extraction ───────────────────────────────
  const extraireCommandes = useCallback(
    (data) => {
      if (!data?.length) return [];
      const map = new Map();
      data
        .filter((c) => c.client === client?.kunnr)
        .filter((c) => (showRetours ? c.auart === "ZCRN" : c.auart === "ZCMD"))
        .forEach((c) => {
          if (!map.has(c.cmd)) {
            map.set(c.cmd, {
              cmd: c.cmd,
              commercial: c.commercial,
              client: c.client,
              clientName: client.name1,
              auart: c.auart,
              bukrs: c.bukrs,
              vgbel: c.vgbel,
              montantTtc: c.ttc,
              erdat: convertirDateSAP(c.erdat),
              statutGlobal:
                STATUT_MAPPING[c.statu_global] || t("order.statusUnknown"),
              status: c.statu_global,
              isOffline: c?.isOffline || false,
              totalArticles: data.filter((x) => x.cmd === c.cmd && !x.isDeleted)
                .length,
            });
          }
        });
      return Array.from(map.values());
    },
    [client?.kunnr, client?.name1, showRetours, t],
  );

  const chargerPostes = useCallback(
    (cmd) => {
      if (!commandesVenteData?.length) return [];
      return commandesVenteData
        .filter((c) => c.cmd === cmd && !c.isDeleted)
        .map((c) => ({
          matnr: c.matnr,
          posnr: c.posnr,
          kmein: c.kmein,
          lsmeng: parseFloat(c.lsmeng),
          qte_restante: parseFloat(c.qte_restante),
          designation: c.maktx || `Article ${c.matnr}`,
          prix: c.prix_unitaire,
          remise_pourcentage: c.remise_pourcentage,
          charg: c.charg,
          auart: c.auart,
          isOffline: c.isOffline || false,
        }));
    },
    [commandesVenteData],
  );

  useEffect(() => {
    setCommandesDistinctes(extraireCommandes(commandesVenteData));
  }, [commandesVenteData, extraireCommandes]);

  useEffect(() => {
    setCommandesDistinctes(extraireCommandes(commandesVenteData));
  }, [showRetours]);

  // ── Filtrage ─────────────────────────────────
  const commandesFiltrees = useMemo(() => {
    let result = commandesDistinctes;
    if (selectedStatus !== "all")
      result = result.filter((c) => c.status === selectedStatus);
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
  }, [commandesDistinctes, searchQuery, selectedStatus]);

  // ── Handlers ─────────────────────────────────
  const handleCommandePress = (commande) => {
    setSelectedCommande(commande);
    setPostesCommande(chargerPostes(commande.cmd));
    detailModalRef.current?.open();
  };

  const handleRefresh = () => {
    dispatch(loadOfflineOrders(client.kunnr));
    dispatch(fetchPendingActionsCount());
    loadData();
  };

  const handleToggle = (isRetour) => {
    setShowRetours(isRetour);
    flatListRef.current?.scrollToOffset({ animated: false, offset: 0 });
    setShowScrollToTop(false);
  };

  // ── Render ───────────────────────────────────
  const emptyLabel = showRetours
    ? t("order.noReturnOrder")
    : t("order.noSaleOrder");

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
          <Text style={styles.headerTitle}>
            {showRetours ? t("order.returnOrders") : t("order.saleOrders")}
          </Text>
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
        searchPlaceholder={t("order.searchOrder")}
      />

      {/* Toggle */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, !showRetours && styles.tabActive]}
          onPress={() => handleToggle(false)}
        >
          <Text style={[styles.tabText, !showRetours && styles.tabTextActive]}>
            {t("order.tabSale")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, showRetours && styles.tabActive]}
          onPress={() => handleToggle(true)}
        >
          <Text style={[styles.tabText, showRetours && styles.tabTextActive]}>
            {t("order.tabReturn")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenu */}
      {loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={BLUE} />
          <Text style={styles.centerText}>
            {showRetours ? t("order.loadingReturns") : t("order.loadingSales")}
          </Text>
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
            <Text style={styles.retryText}>{t("order.retry")}</Text>
          </TouchableOpacity>
        </View>
      ) : commandesFiltrees.length === 0 ? (
        <View style={styles.centerWrap}>
          <MaterialCommunityIcons
            name={showRetours ? "truck-delivery-outline" : "truck-delivery"}
            size={scale(56)}
            color="#E0E0E0"
          />
          <Text style={styles.centerText}>
            {searchQuery.trim()
              ? t("order.noMatch", { label: emptyLabel })
              : t("order.noItems", { label: emptyLabel })}
          </Text>
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
              onRefresh={handleRefresh}
              colors={[BLUE]}
              tintColor={BLUE}
            />
          }
          renderItem={({ item }) => (
            <StatusListCard
              date={item.erdat}
              number={`N°${item.cmd}`}
              reference={item.vgbel ? `Réf: ${item.vgbel}` : undefined}
              hideNumber={item.isOffline}
              statusColor={STATUS_COLORS[item.status] || "#9CA3AF"}
              statusLabel={item.statutGlobal}
              articlesCount={item.totalArticles}
              amount={item.montantTtc}
              isOffline={item.isOffline}
              onPress={() => handleCommandePress(item)}
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
      <CommandeVenteDetailModalize
        reference={detailModalRef}
        commande={selectedCommande}
        postes={postesCommande}
      />
    </View>
  );
};

export default CommandeVenteListeScreen;

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

  // Tabs
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tab: { paddingVertical: Spacing.sm },
  tabActive: { borderBottomWidth: 2, borderBottomColor: BLUE },
  tabText: { fontSize: fs(14), color: TEXT_MUTED, fontWeight: "400" },
  tabTextActive: { color: BLUE, fontWeight: "700" },

  // États
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
    direction: "ltr",
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
