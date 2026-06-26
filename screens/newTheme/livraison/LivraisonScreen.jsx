import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  BackHandler,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import {
  getCommandesApprouves,
  resetOrderState,
} from "../../../redux/slices/orderSlice";
import { Modalize } from "react-native-modalize";
import { scale, fs } from "../../../utils/responsive";
import { Spacing, Radius } from "../../../constants/Theme";
import ScreenBackground from "../../../components/common/ScreenBackground";
import BottomFade from "../../../components/common/Bottomfade";
import CommandeCard from "../../../components/common/livraison/CommandeCard";
import ArticleRowDetail from "../../../components/common/livraison/ArticleRowDetail";

const BLUE = "#03A9F4";
const TEXT_DARK = "#212121";
const TEXT_MUTED = "#757575";
const BORDER = "#E5E7EB";

const LivraisonScreen = ({ route }) => {
  const navigation = useNavigation();
  const { client } = route.params;
  const dispatch = useDispatch();
  const userData = useSelector((state) => state.auth.user);
  const insets = useSafeAreaInsets();

  const {
    ordersApprouve,
    loadingOrdersApprouve: loading,
    errorOrdersApprouve: error,
  } = useSelector((state) => state.orders);
  const { isServerReachable } = useSelector((state) => state.offline);

  const [commandesDistinctes, setCommandesDistinctes] = useState([]);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [articlesCommande, setArticlesCommande] = useState([]);

  const commandeDetailModalizeRef = useRef(null);

  // ── Back handler ───────────────────────────
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

  // ── Chargement initial ─────────────────────
  useEffect(() => {
    dispatch(resetOrderState());
    if (isServerReachable) {
      dispatch(getCommandesApprouves({ user: userData?.code }));
    }
  }, [dispatch, client]);

  // ── Utilitaires ────────────────────────────
  const convertirDateSAP = (dateSAP) => {
    const timestampMatch = dateSAP.match(/\/Date\((\d+)\)\//);
    if (!timestampMatch || timestampMatch.length < 2)
      return "Format de date invalide";
    const timestamp = parseInt(timestampMatch[1]);
    const date = new Date(timestamp);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const extraireCommandesDistinctes = useCallback(
    (commandesList) => {
      if (!commandesList?.length) return [];

      const commandesMap = new Map();
      const statutMapping = {
        initial: "Non Livré",
        encours: "Partiellement livré",
        termine: "Terminé",
      };

      commandesList
        .filter((order) => order.client === client?.kunnr)
        .filter((order) => !order.isModified)
        .forEach((item) => {
          const key = `${item.cmd}-${item.commercial}-${item.client}`;
          if (!commandesMap.has(key)) {
            const totalArticles = commandesList.filter(
              (c) =>
                c.cmd === item.cmd &&
                c.commercial === item.commercial &&
                c.client === item.client,
            ).length;

            commandesMap.set(key, {
              cmd: item.cmd,
              commercial: item.commercial,
              client: item.client,
              clientName: client.name1,
              codeSociete: item.bukrs,
              erdat: convertirDateSAP(item.erdat),
              vgbel: item.vgbel,
              totalArticles,
              statutGlobal: statutMapping[item.statu_global],
              status: item.statu_global,
              isModified: item.isModified || false,
            });
          }
        });

      return Array.from(commandesMap.values());
    },
    [client?.kunnr, client?.name1],
  );

  const chargerArticlesCommande = useCallback(
    (numeroCommande, commercial, clientCode) => {
      if (!ordersApprouve?.length) return [];
      return ordersApprouve
        .filter(
          (item) =>
            item.cmd === numeroCommande &&
            item.commercial === commercial &&
            item.client === clientCode,
        )
        .map((item) => ({
          matnr: item.matnr,
          posnr: item.posnr,
          charg: item.charg,
          kmein: item.kmein,
          kbetr: parseFloat(item.prix_unitaire),
          lsmeng: parseFloat(item.lsmeng),
          qte_restante: parseFloat(item.qte_restante),
          designation: item.maktx || `Article ${item.matnr}`,
        }));
    },
    [ordersApprouve],
  );

  useEffect(() => {
    if (ordersApprouve.length > 0) {
      setCommandesDistinctes(extraireCommandesDistinctes(ordersApprouve));
    }
  }, [ordersApprouve, extraireCommandesDistinctes]);

  // ── Handlers ───────────────────────────────
  const handleCommandePress = (commande) => {
    setSelectedCommande(commande);
    setArticlesCommande(
      chargerArticlesCommande(
        commande.cmd,
        commande.commercial,
        commande.client,
      ),
    );
    commandeDetailModalizeRef.current?.open();
  };

  const handleCreateLivraison = (commande) => {
    commandeDetailModalizeRef.current?.close();
    const order = {
      cmd: commande.cmd,
      commercial: commande.commercial,
      client: commande.client,
      clientName: commande.clientName,
      codeSociete: commande.codeSociete,
      erdat: commande.erdat,
      vgbel: commande.vgbel,
      articles: articlesCommande,
      totalArticles: commande.totalArticles,
      statutGlobal: commande.statutGlobal,
      isModified: commande.isModified,
    };
    navigation.navigate("create_livraison", { order, client });
  };

  const handleRefresh = () => {
    if (isServerReachable) {
      dispatch(getCommandesApprouves({ user: userData?.code }));
    }
  };

  // ── Render ─────────────────────────────────
  const renderCommandeItem = ({ item }) => (
    <CommandeCard commande={item} onPress={() => handleCommandePress(item)} />
  );

  return (
    // View racine avec paddingTop = inset résolu immédiatement — pas de saut
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <ScreenBackground />

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
          {client?.name1 && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {client.name1}
            </Text>
          )}
        </View>
        <View style={{ width: scale(36) }} />
      </View>

      {/* Contenu */}
      {loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={BLUE} />
          <Text style={styles.loaderText}>Chargement des commandes...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerWrap}>
          <MaterialIcons
            name="error-outline"
            size={scale(44)}
            color="#e53935"
          />
          <Text style={styles.errorText}>Erreur : {error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() =>
              dispatch(getCommandesApprouves({ user: userData?.code }))
            }
          >
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : commandesDistinctes.length === 0 ? (
        <View style={styles.centerWrap}>
          <MaterialCommunityIcons
            name="truck-delivery"
            size={scale(56)}
            color="#E0E0E0"
          />
          <Text style={styles.emptyText}>
            Aucune commande en attente de livraison
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.headerTitleList}>
            Choisissez une commande à livrer :
          </Text>
          <FlatList
            data={commandesDistinctes}
            renderItem={renderCommandeItem}
            keyExtractor={(item) => `${item.cmd}-${item.client}`}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={handleRefresh}
                colors={[BLUE]}
                tintColor={BLUE}
              />
            }
          />
        </>
      )}

      {/* Modalize détail commande */}
      <Modalize
        ref={commandeDetailModalizeRef}
        adjustToContentHeight
        modalStyle={styles.modalContainer}
        scrollViewProps={{ scrollEnabled: false }}
        disableScrollIfPossible={false}
        closeOnOverlayTap
        threshold={100}
        withHandle={false}
        panGestureComponentEnabled={false}
        closeSnapPointStraightEnabled={false}
        velocityThreshold={0.8}
        panGestureEnabled={false}
        keyboardAvoidingBehavior="padding"
        avoidKeyboardLikeIOS
      >
        {selectedCommande && (
          <View style={styles.modalContent}>
            <View style={styles.modalTopRow}>
              <Text style={styles.modalClientName}>
                {selectedCommande.clientName}
              </Text>
              <TouchableOpacity
                onPress={() => commandeDetailModalizeRef.current?.close()}
              >
                <MaterialIcons
                  name="close"
                  size={scale(20)}
                  color={TEXT_MUTED}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSubRow}>
              {selectedCommande.vgbel && (
                <Text style={styles.modalRef}>
                  Référence : {selectedCommande.vgbel}
                </Text>
              )}
              <Text style={styles.modalDate}>{selectedCommande.erdat}</Text>
            </View>

            <View style={styles.articlesBlock}>
              <Text style={styles.articlesTitle}>
                {articlesCommande.length} article(s)
              </Text>

              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 4 }]}>
                  Code / Désignation
                </Text>
                <Text
                  style={[
                    styles.tableHeaderText,
                    styles.alignRight,
                    { flex: 2 },
                  ]}
                >
                  Qté Cmd
                </Text>
                <Text
                  style={[
                    styles.tableHeaderText,
                    styles.alignRight,
                    { flex: 2 },
                  ]}
                >
                  Qté Rest.
                </Text>
              </View>

              <ScrollView style={styles.articlesScroll}>
                {articlesCommande.map((article, index) => (
                  <ArticleRowDetail
                    key={`${article.matnr}-${index}`}
                    article={article}
                    index={index}
                  />
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.deliverBtn}
                onPress={() => handleCreateLivraison(selectedCommande)}
              >
                <MaterialIcons
                  name="local-shipping"
                  size={scale(18)}
                  color={BLUE}
                />
                <Text style={styles.deliverBtnText}>Livrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modalize>
    </View>
  );
};

export default LivraisonScreen;

const styles = StyleSheet.create({
  // View racine — pas de SafeAreaView, paddingTop appliqué via insets
  root: {
    flex: 1,
  },

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
  headerTitle: {
    fontSize: fs(17),
    fontWeight: "700",
    color: TEXT_DARK,
  },
  headerSubtitle: {
    fontSize: fs(11),
    color: TEXT_MUTED,
    marginTop: 1,
    fontWeight: "500",
  },

  headerTitleList: {
    fontSize: fs(11),
    color: TEXT_MUTED,
    marginTop: 5,
    fontWeight: "500",
    marginLeft: 20,
  },

  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: scale(90),
  },

  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  loaderText: {
    marginTop: Spacing.md,
    fontSize: fs(14),
    color: TEXT_MUTED,
  },
  errorText: {
    marginTop: Spacing.md,
    fontSize: fs(14),
    color: "#DC2626",
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  retryBtn: {
    backgroundColor: BLUE,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  retryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: fs(13),
  },
  emptyText: {
    marginTop: Spacing.lg,
    fontSize: fs(14),
    color: TEXT_MUTED,
    textAlign: "center",
  },

  // Modalize
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: "90%",
  },
  modalContent: {
    padding: Spacing.lg,
  },
  modalTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalClientName: {
    fontSize: fs(15),
    fontWeight: "700",
    color: TEXT_DARK,
  },
  modalSubRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  modalRef: {
    fontSize: fs(12),
    color: TEXT_MUTED,
  },
  modalDate: {
    fontSize: fs(12),
    color: TEXT_MUTED,
  },

  articlesBlock: {
    marginTop: Spacing.md,
  },
  articlesTitle: {
    fontSize: fs(14),
    fontWeight: "700",
    color: TEXT_DARK,
    marginBottom: Spacing.sm,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    paddingVertical: Spacing.sm,
    paddingHorizontal: scale(12),
    borderTopLeftRadius: Radius.md,
    borderTopRightRadius: Radius.md,
    borderWidth: 1,
    borderColor: BORDER,
  },
  tableHeaderText: {
    fontSize: fs(10.5),
    fontWeight: "700",
    color: "#334155",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  alignRight: { textAlign: "right" },
  articlesScroll: {
    maxHeight: scale(280),
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: BORDER,
    borderBottomLeftRadius: Radius.md,
    borderBottomRightRadius: Radius.md,
  },

  deliverBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: "#EAF6FE",
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
  },
  deliverBtnText: {
    color: BLUE,
    fontWeight: "700",
    fontSize: fs(14),
  },
});
