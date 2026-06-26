import React, {
  useLayoutEffect,
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
  SafeAreaView,
  TextInput,
  FlatList,
  Alert,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Easing,
  ScrollView,
} from "react-native";
import {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
  Feather,
  AntDesign,
} from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import {
  getCommandesApprouves,
  resetOrderState,
} from "../redux/slices/orderSlice";
import { BackHandler } from "react-native";
import {
  fetchPendingActionsCount,
  loadOfflineLivraisons,
} from "../redux/slices/offlineSlice";
import OfflineLivraisonsScreen from "./OfflineLivraisonsScreen";
import HeaderRightButton from "../components/HeaderRightButton";
import CommandeItem from "../components/CommandeItem";
import { Modalize } from "react-native-modalize";

const { width, height } = Dimensions.get("window");
import { wp, hp, fs, fontWeight, scale } from "../utils/responsive";

const LivraisonScreen = ({ route }) => {
  const navigation = useNavigation();
  const { client, offlineList } = route.params;
  const dispatch = useDispatch();

  const userData = useSelector((state) => state.auth.user);

  const {
    ordersApprouve,
    loadingOrdersApprouve: loading,
    errorOrdersApprouve: error,
  } = useSelector((state) => state.orders);
  const { isConnected, isServerReachable, offlineLivraisons } = useSelector(
    (state) => state.offline,
  );
  console.log(
    "orders dans livraison screeeeeeeeeen and offlineLivraison",
    ordersApprouve,
    offlineLivraisons,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [commandesDistinctes, setCommandesDistinctes] = useState([]);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [articlesCommande, setArticlesCommande] = useState([]);
  const [showofflineLivraisons, setShowofflineLivraisons] = useState(
    offlineList ? true : false,
  );
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);

  // Référence pour la modalize
  const commandeDetailModalizeRef = useRef(null);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        setShowScrollToTop(offsetY > 200);
      },
    },
  );

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
  };

  // Configuration du header avec headerRight
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderRightButton
          navigation={navigation}
          client={route.params}
          link="allOutbounds"
        />
      ),
    });
  }, [navigation, client]);

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

  useEffect(() => {
    dispatch(resetOrderState());
    if (isServerReachable) {
      dispatch(
        getCommandesApprouves({
          user: userData?.code,
        }),
      );
    }
  }, [dispatch, client]);

  useFocusEffect(
    useCallback(() => {
      dispatch(loadOfflineLivraisons(client));
      dispatch(fetchPendingActionsCount());
    }, [navigation, offlineLivraisons.length, dispatch]),
  );

  // Fonction pour convertir une date SAP au format jj mmmm aaaa
  const convertirDateSAP = (dateSAP) => {
    const timestampMatch = dateSAP.match(/\/Date\((\d+)\)\//);
    console.log(dateSAP);

    if (!timestampMatch || timestampMatch.length < 2) {
      return "Format de date invalide";
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

  // Fonction pour extraire les commandes distinctes
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
        .filter((order) => !order.isModified) // Filtrer les commandes non modifiées
        .forEach((item) => {
          const key = `${item.cmd}-${item.commercial}-${item.client}`;

          if (!commandesMap.has(key)) {
            const statutGlobal = statutMapping[item.statu_global];

            // Calculer le total des articles pour cette commande
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
              statutGlobal,
              status: item.statu_global,
              isModified: item.isModified || false,
            });
          }
        });

      return Array.from(commandesMap.values());
    },
    [client?.kunnr, client?.name1],
  );

  // Fonction pour charger les articles d'une commande
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

  // Mise à jour des commandes distinctes quand les données changent
  useEffect(() => {
    if (ordersApprouve.length > 0) {
      const commandesDistinctesExtraites =
        extraireCommandesDistinctes(ordersApprouve);
      setCommandesDistinctes(commandesDistinctesExtraites);
    }
  }, [ordersApprouve, extraireCommandesDistinctes]);

  // Filtrage des commandes en fonction de la recherche
  const commandesFiltrees = useMemo(() => {
    let filtered = commandesDistinctes;

    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (commande) =>
          commande.cmd.toLowerCase().includes(searchLower) ||
          commande.client.toLowerCase().includes(searchLower) ||
          (commande.clientName &&
            commande.clientName.toLowerCase().includes(searchLower)),
      );
    }

    return filtered;
  }, [commandesDistinctes, searchQuery]);

  // Gestion du clic sur une commande
  const handleCommandePress = (commande) => {
    setSelectedCommande(commande);
    const articles = chargerArticlesCommande(
      commande.cmd,
      commande.commercial,
      commande.client,
    );
    setArticlesCommande(articles);
    commandeDetailModalizeRef.current?.open();
  };

  const handleCreateLivraison = (commande) => {
    // Fermer la modale avant de naviguer
    commandeDetailModalizeRef.current?.close();

    // Créer l'objet order avec la structure attendue
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

    // Naviguer vers l'écran de création de livraison
    navigation.navigate("create_livraison", { order, client });
  };

  // Rendu des éléments de la liste principale
  const renderCommandeItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.modernCard]}
      onPress={() => handleCommandePress(item)}
      activeOpacity={0.7}
    >
      {/* Header avec date et numéro */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.cmdNumber}>{item.erdat}</Text>
          <Text style={styles.dateText}>N°{item.cmd}</Text>
          {item.vgbel && (
            <Text style={styles.vgbelText}>Réf: {item.vgbel}</Text>
          )}
        </View>

        {/* Badge statut moderne */}
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === "initial"
                  ? "#3B82F620"
                  : item.status === "encours"
                    ? "#10B98120"
                    : "#8B5CF620",
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  item.status === "initial"
                    ? "#3B82F6"
                    : item.status === "encours"
                      ? "#10B981"
                      : "#8B5CF6",
              },
            ]}
          />
          <Text
            style={[
              styles.statusBadgeText,
              {
                color:
                  item.status === "initial"
                    ? "#3B82F6"
                    : item.status === "encours"
                      ? "#10B981"
                      : "#8B5CF6",
              },
            ]}
          >
            {item.statutGlobal}
          </Text>
        </View>
      </View>

      {/* Divider subtile */}
      <View style={styles.divider} />

      {/* Footer avec stats */}
      <View style={styles.cardFooter}>
        <View style={styles.footerLeft}>
          <View style={styles.statItem}>
            <MaterialIcons name="inventory" size={16} color="#6B7280" />
            <Text style={styles.statText}>{item.totalArticles} articles</Text>
          </View>
        </View>

        <View style={styles.chevronContainer}>
          <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleRefresh = () => {
    dispatch(loadOfflineLivraisons(client));
    dispatch(fetchPendingActionsCount());
    if (isServerReachable) {
      dispatch(
        getCommandesApprouves({
          user: userData?.code,
        }),
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#03A9F4" barStyle="light-content" />

      {/* Toggle Container */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            !showofflineLivraisons && styles.activeToggleButton,
          ]}
          onPress={() => setShowofflineLivraisons(false)}
        >
          <Text
            style={[
              styles.toggleButtonText,
              !showofflineLivraisons && styles.activeToggleButtonText,
            ]}
          >
            Commandes à livrer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            showofflineLivraisons && styles.activeToggleButton,
          ]}
          onPress={() => {
            setShowofflineLivraisons(true);
            scrollToTop();
            setShowScrollToTop(false);
          }}
        >
          <Text
            style={[
              styles.toggleButtonText,
              showofflineLivraisons && styles.activeToggleButtonText,
            ]}
          >
            Livraisons en attente ( {offlineLivraisons?.length} )
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Container */}
      {!showofflineLivraisons && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={24} color="#757575" />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher une commande..."
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

      {/* Main Content */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#03A9F4" />
          <Text style={styles.loaderText}>Chargement des commandes...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#e53935" />
          <Text style={styles.errorText}>Erreur: {error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() =>
              dispatch(
                getCommandesApprouves({
                  user: userData?.code,
                }),
              )
            }
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : showofflineLivraisons ? (
        <OfflineLivraisonsScreen client={client} />
      ) : commandesFiltrees.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="truck-delivery"
            size={64}
            color="#E0E0E0"
          />
          <Text style={styles.emptyText}>
            {searchQuery.trim() !== ""
              ? "Aucune commande ne correspond à votre recherche"
              : "Aucune commande en attente de livraison"}
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={commandesFiltrees}
          renderItem={renderCommandeItem}
          keyExtractor={(item) => `${item.cmd}-${item.client}`}
          contentContainerStyle={styles.commandesList}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={handleRefresh}
              colors={["#03A9F4", "#FFC107", "#4CAF50"]}
            />
          }
        />
      )}

      {/* Scroll to Top Button */}
      {!showofflineLivraisons && showScrollToTop && (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={scrollToTop}
          activeOpacity={0.8}
        >
          <MaterialIcons name="keyboard-arrow-up" size={28} color="white" />
        </TouchableOpacity>
      )}

      {/* Modalize pour les détails de la commande */}
      <Modalize
        ref={commandeDetailModalizeRef}
        adjustToContentHeight
        modalStyle={styles.modal}
        scrollViewProps={{ scrollEnabled: false }}
        disableScrollIfPossible={false}
        closeOnOverlayTap={true}
        threshold={100}
        withHandle={false}
        panGestureComponentEnabled={false}
        closeSnapPointStraightEnabled={false}
        velocityThreshold={0.8}
        panGestureEnabled={false}
        keyboardAvoidingBehavior="padding"
        avoidKeyboardLikeIOS={true}
      >
        {selectedCommande && (
          <View style={styles.modalContent}>
            {/* Informations commande */}
            <View style={styles.commandeDetails}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={styles.commandeClient}>
                  {selectedCommande?.clientName}
                </Text>
                <TouchableOpacity
                  onPress={() => commandeDetailModalizeRef.current?.close()}
                >
                  <MaterialIcons name="close" size={20} color="#757575" />
                </TouchableOpacity>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignContent: "flex-end",
                }}
              >
                {selectedCommande?.vgbel && (
                  <Text style={styles.commandeReference}>
                    Référence: {selectedCommande.vgbel}
                  </Text>
                )}
                <Text style={styles.commandeDate}>
                  {selectedCommande?.erdat}
                </Text>
              </View>
            </View>

            {/* Tableau des articles */}
            <View
              style={[
                styles.commandeDetails,
                {
                  backgroundColor: "rgba(233, 220, 188, 0.1)",
                  marginTop: 10,
                  flex: 1,
                },
              ]}
            >
              <Text style={styles.detailsTitle}>
                {articlesCommande.length} article(s)
              </Text>

              {/* En-têtes du tableau */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.codeColumn]}>
                  Code/Désignation
                </Text>
                <Text style={[styles.tableHeaderRightText, styles.qteColumn]}>
                  Qté Cmd
                </Text>
                <Text style={[styles.tableHeaderRightText, styles.qteColumn]}>
                  Qté Rest.
                </Text>
              </View>

              {/* Liste scrollable des articles */}
              <ScrollView
                style={styles.scrollableArticleContainer}
                contentContainerStyle={styles.articleContainer}
              >
                {articlesCommande.map((article, index) => (
                  <View
                    key={`${article.matnr}-${index}`}
                    style={[styles.tableRow, index % 2 === 0 && styles.evenRow]}
                  >
                    {/* Code et désignation */}
                    <View style={styles.codeColumn}>
                      <Text style={styles.designationCellText}>
                        {article.matnr}
                      </Text>
                      <Text
                        style={styles.designationCellText}
                        numberOfLines={10}
                      >
                        {article.designation}
                      </Text>
                      {article.charg && (
                        <Text style={styles.chargText}>
                          Lot: {article.charg}
                        </Text>
                      )}
                    </View>

                    {/* Quantité commandée */}
                    <View style={styles.qteColumn}>
                      <Text style={styles.tableCellTextRight}>
                        {parseFloat(article.lsmeng).toFixed(2)} {article.kmein}
                      </Text>
                    </View>

                    {/* Quantité restante */}
                    <View style={styles.qteColumn}>
                      <Text
                        style={[
                          styles.tableCellTextRight,
                          parseFloat(article.qte_restante) <= 0
                            ? styles.negativeRemaining
                            : styles.positiveRemaining,
                        ]}
                      >
                        {parseFloat(article.qte_restante).toFixed(2)}{" "}
                        {article.kmein}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>

              {/* Actions */}
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleCreateLivraison(selectedCommande)}
                >
                  <MaterialIcons
                    name="local-shipping"
                    size={20}
                    color="#0891B2"
                  />
                  <Text style={styles.actionButtonText}>Livrer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modalize>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  // Styles pour la liste des commandes
  commandesList: {
    paddingHorizontal: wp(3.9), // 16px -> 3.9% de 412px
    paddingTop: wp(3.9),
    paddingBottom: wp(5.8), // 24px
  },

  commandeContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    marginBottom: scale(12),
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
    overflow: "hidden",
    borderWidth: scale(0.5),
    borderColor: "#E2E8F0",
  },

  commandeInfo: {
    flex: 1,
    padding: wp(3.9), // 16px
  },

  commandeNumber: {
    fontSize: fs(18),
    fontWeight: fontWeight.bold,
    color: "#1E293B",
    marginBottom: scale(4),
  },

  commandeDate: {
    fontSize: fs(13),
    color: "#64748B",
    marginBottom: scale(8),
    fontWeight: fontWeight.medium,
  },

  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: scale(8),
  },

  statusIndicator: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    marginRight: scale(8),
  },

  statusText: {
    fontSize: fs(13),
    fontWeight: fontWeight.semiBold,
    color: "#475569",
  },

  commandeStats: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    padding: wp(3.9), // 16px
  },

  statsText: {
    fontSize: fs(12),
    color: "#64748B",
    marginBottom: scale(12),
    fontWeight: fontWeight.medium,
  },

  // Styles pour les états de chargement et erreur
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },

  loaderText: {
    marginTop: scale(16),
    fontSize: fs(16),
    color: "#64748B",
    fontWeight: fontWeight.medium,
  },

  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: wp(5.8), // 24px
    backgroundColor: "#F8FAFC",
  },

  errorText: {
    marginTop: scale(16),
    fontSize: fs(16),
    color: "#DC2626",
    textAlign: "center",
    marginBottom: wp(5.8), // 24px
    fontWeight: fontWeight.medium,
  },

  retryButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: wp(5.8), // 24px
    paddingVertical: scale(12),
    borderRadius: scale(8),
    elevation: 2,
  },

  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: fontWeight.semiBold,
    fontSize: fs(14),
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: wp(5.8), // 24px
    backgroundColor: "#F8FAFC",
  },

  emptyText: {
    marginTop: wp(5.8), // 24px
    fontSize: fs(16),
    color: "#64748B",
    textAlign: "center",
    fontWeight: fontWeight.medium,
    lineHeight: scale(24),
  },

  // Styles pour les modales
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale(16),
    marginTop: scale(5),
    paddingHorizontal: scale(6),
  },

  modalTitle: {
    fontSize: fs(18),
    fontWeight: fontWeight.bold,
    color: "#333",
  },

  modalSubtitle: {
    marginTop: scale(8),
  },

  modalSubtitleText: {
    fontSize: fs(14),
    color: "#64748B",
    textAlign: "center",
    fontWeight: fontWeight.medium,
  },

  modalContent: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingBottom: wp(5.8), // 24px
  },

  // Styles pour le tableau des articles
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#E6E7E8",
    paddingVertical: scale(14),
    paddingHorizontal: scale(12),
    borderTopLeftRadius: scale(12),
    borderTopRightRadius: scale(12),
    borderColor: "#eee",
    borderWidth: scale(1),
  },

  tableHeaderText: {
    fontSize: fs(12),
    fontWeight: fontWeight.bold,
    color: "#334155",
    textAlign: "start",
    textTransform: "uppercase",
    letterSpacing: scale(0.5),
  },

  tableHeaderRightText: {
    fontSize: fs(12),
    fontWeight: fontWeight.bold,
    color: "#334155",
    textAlign: "right",
    textTransform: "uppercase",
    letterSpacing: scale(0.5),
  },

  tableRow: {
    flexDirection: "row",
    paddingVertical: scale(4),
    paddingHorizontal: scale(12),
    borderBottomWidth: scale(1),
    borderBottomColor: "#F1F5F9",
    backgroundColor: "#FFFFFF",
    alignItems: "flex-end",
  },

  evenRow: {
    backgroundColor: "#F8FAFC",
  },

  codeColumn: {
    flex: 4,
    paddingRight: scale(2),
  },

  qteColumn: {
    flex: 2,
    alignItems: "end",
    paddingHorizontal: scale(2),
  },

  prixColumn: {
    flex: 2,
    alignItems: "flex-end",
  },

  designationCellText: {
    fontSize: fs(11),
    color: "#374151",
    lineHeight: scale(16),
    fontWeight: fontWeight.medium,
  },

  tableCellTextRight: {
    fontSize: fs(11),
    color: "#374151",
    textAlign: "right",
    fontWeight: fontWeight.medium,
  },

  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(14),
    paddingHorizontal: wp(4.9), // 20px
    borderRadius: scale(10),
    backgroundColor: "#E0F2FE",
    borderWidth: scale(1),
    borderColor: "#0891B2",
  },

  actionButtonText: {
    color: "#0891B2",
    fontWeight: fontWeight.bold,
    marginLeft: scale(8),
    fontSize: fs(14),
    letterSpacing: scale(0.5),
  },

  // Styles pour la modale d'actions
  actionModalContainer: {
    padding: wp(5.8), // 24px
    backgroundColor: "#FFFFFF",
    borderTopRightRadius: scale(8),
    borderTopLeftRadius: scale(8),
  },

  actionModalTitle: {
    fontSize: fs(20),
    fontWeight: fontWeight.bold,
    marginBottom: wp(5.8), // 24px
    textAlign: "center",
    color: "#1E293B",
  },

  actionModalizeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: scale(18),
    paddingHorizontal: scale(4),
    borderBottomWidth: scale(1),
    borderBottomColor: "#F1F5F9",
  },

  actionModalizeButtonText: {
    fontSize: fs(16),
    marginLeft: scale(16),
    color: "#374151",
    fontWeight: fontWeight.medium,
  },

  deleteButton: {
    borderBottomWidth: 0,
    marginBottom: scale(16),
  },

  deleteButtonText: {
    color: "#DC2626",
    fontWeight: fontWeight.medium,
  },

  disabledButtonText: {
    color: "#9CA3AF",
  },

  cancelButton: {
    backgroundColor: "#F1F5F9",
    borderRadius: scale(10),
    paddingVertical: scale(16),
    alignItems: "center",
  },

  cancelButtonText: {
    fontSize: fs(16),
    color: "#475569",
    fontWeight: fontWeight.semiBold,
  },

  loadingContainer: {
    padding: wp(7.8), // 32px
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  loadingText: {
    marginTop: scale(16),
    fontSize: fs(16),
    color: "#3B82F6",
    textAlign: "center",
    fontWeight: fontWeight.medium,
  },

  // Styles existants conservés
  searchContainer: {
    marginTop: scale(10),
    paddingHorizontal: wp(3.9), // 16px
    marginBottom: scale(10),
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: scale(20),
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    elevation: 0.5,
  },

  searchInput: {
    flex: 1,
    marginLeft: scale(8),
    fontSize: fs(16),
  },

  fabContainer: {
    position: "absolute",
    right: wp(3.9), // 16px
    bottom: wp(3.9), // 16px
    justifyContent: "center",
    alignItems: "center",
  },

  fabContainerScrollButton: {
    position: "absolute",
    bottom: scale(5),
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
  },

  fab: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(38),
    backgroundColor: "#FFA000",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },

  fabScrollButton: {
    marginBottom: scale(15),
    width: scale(36),
    height: scale(36),
    borderRadius: scale(28),
    backgroundColor: "#F5F6F8",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    borderWidth: scale(0.2),
    borderColor: "#B5B8BD",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: scale(4),
    zIndex: 1000,
  },

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
    paddingVertical: scale(12),
    paddingHorizontal: wp(3.9), // 16px
  },

  activeToggleButton: {
    borderBottomWidth: scale(3),
    borderBottomColor: "#03A9F4",
  },

  toggleButtonText: {
    fontSize: fs(14),
    color: "#757575",
  },

  activeToggleButtonText: {
    color: "#03A9F4",
    fontWeight: fontWeight.semiBold,
  },

  modalContainer: {
    padding: wp(3.9), // 16px
  },

  quantityModal: {
    padding: wp(3.9), // 16px
  },

  quantityTitle: {
    fontSize: fs(18),
    fontWeight: fontWeight.bold,
    marginBottom: scale(8),
    margin: "auto",
  },

  quantityArticle: {
    fontSize: fs(16),
    color: "#03A9F4",
    marginBottom: scale(16),
    margin: "auto",
  },

  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(16),
  },

  quantityLabel: {
    fontWeight: fontWeight.bold,
    fontSize: fs(18),
  },

  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
  },

  quantityButton: {
    backgroundColor: "#03A9F4",
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    justifyContent: "center",
    alignItems: "center",
  },

  quantityModalInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: scale(4),
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    marginHorizontal: scale(8),
    width: scale(60),
    textAlign: "center",
    fontSize: fs(16),
  },

  pricePreview: {
    marginBottom: scale(12),
    paddingHorizontal: scale(18),
    paddingVertical: scale(8),
    backgroundColor: "#F9F9F9",
    borderWidth: scale(1),
    borderColor: "#E0E0E0",
    borderRadius: scale(10),
  },

  pricePreviewRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: scale(3),
  },

  pricePreviewRowTitle: {
    fontSize: fs(14),
  },

  pricePreviewRowValue: {
    fontWeight: fontWeight.bold,
    letterSpacing: scale(2),
  },

  totalPreviewLabel: {
    fontWeight: fontWeight.bold,
  },

  totalPreviewValue: {
    fontWeight: fontWeight.bold,
    letterSpacing: scale(2),
    color: "#006475",
  },

  totalPreviewRow: {
    borderTopWidth: scale(1),
    borderTopColor: "#E0E0E0",
    marginTop: scale(4),
    paddingTop: scale(4),
  },

  confirmButton: {
    backgroundColor: "#03A9F4",
    borderRadius: scale(8),
    paddingVertical: scale(12),
    alignItems: "center",
  },

  confirmButtonText: {
    color: "white",
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
  },

  disabledButton: {
    backgroundColor: "#E0E0E0",
    opacity: 0.7,
  },

  minQuantityWarning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    padding: scale(8),
    borderRadius: scale(4),
    marginBottom: scale(16),
  },

  minQuantityText: {
    marginLeft: scale(8),
    color: "#FF9800",
    fontSize: fs(14),
  },

  chooseAnotherButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(12),
    marginBottom: scale(16),
    borderWidth: scale(1),
    borderColor: "#03A9F4",
    borderRadius: scale(8),
  },

  chooseAnotherButtonText: {
    color: "#03A9F4",
    marginLeft: scale(8),
    fontSize: fs(14),
    fontWeight: fontWeight.medium,
  },

  modal: {
    backgroundColor: "white",
    borderTopLeftRadius: scale(10),
    borderTopRightRadius: scale(10),
    maxHeight: "90%",
  },

  scrollableArticleContainer: {
    flex: 1,
    maxHeight: hp(32.8), // 300px -> 32.8% de 915px
    borderWidth: scale(1),
    borderTopWidth: 0,
    borderBottomRightRadius: scale(12),
    borderBottomLeftRadius: scale(12),
    borderColor: "#eee",
  },

  articleContainer: {
    borderWidth: scale(1),
    borderTopWidth: 0,
    borderBottomRightRadius: scale(8),
    borderBottomLeftRadius: scale(8),
    borderColor: "#eee",
  },

  commandeDetails: {
    padding: wp(3.9), // 16px
    backgroundColor: "#FAFAFA",
    borderRadius: scale(8),
    marginTop: scale(12),
  },

  detailsTitle: {
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
    marginBottom: scale(12),
    color: "#424242",
  },

  commandeClient: {
    fontSize: fs(16),
    fontWeight: fontWeight.semiBold,
    color: "#212529",
    marginBottom: scale(8),
  },

  commandeItems: {
    fontSize: fs(14),
    color: "#6c757d",
  },

  actionsContainer: {
    paddingTop: scale(16),
    paddingHorizontal: scale(8),
  },

  primaryButtonText: {
    color: "#006475",
    fontWeight: fontWeight.semiBold,
    marginLeft: scale(8),
    fontSize: fs(14),
  },

  modernCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(16),
    padding: wp(3.9), // 16px
    marginVertical: scale(3),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: scale(2),
    },
    shadowOpacity: 0.06,
    shadowRadius: scale(8),
    elevation: 0.5,
  },

  offlineCard: {
    backgroundColor: "#FFFBEB",
    borderLeftWidth: scale(4),
    borderLeftColor: "#F59E0B",
    borderColor: "#FED7AA",
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: scale(12),
  },

  headerLeft: {
    flex: 1,
  },

  dateText: {
    fontSize: fs(14),
    fontWeight: fontWeight.semiBold,
    color: "#1F2937",
    marginBottom: scale(2),
  },

  cmdNumber: {
    fontSize: fs(12),
    color: "#6B7280",
    fontWeight: fontWeight.medium,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(12),
    marginLeft: scale(8),
  },

  statusDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    marginRight: scale(4),
  },

  statusBadgeText: {
    fontSize: fs(11),
    fontWeight: fontWeight.semiBold,
    textTransform: "uppercase",
    letterSpacing: scale(0.5),
  },

  divider: {
    height: scale(1),
    backgroundColor: "#F1F5F9",
    marginVertical: scale(4),
  },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: scale(8),
  },

  footerLeft: {
    flex: 1,
  },

  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale(4),
  },

  statText: {
    fontSize: fs(12),
    color: "#6B7280",
    marginLeft: scale(4),
    fontWeight: fontWeight.medium,
  },

  montantText: {
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
    color: "#006475",
    marginTop: scale(2),
  },

  chevronContainer: {
    padding: scale(4),
  },

  offlineIndicator: {
    position: "absolute",
    top: scale(8),
    right: scale(8),
    backgroundColor: "#FEF3C7",
    borderRadius: scale(10),
    padding: scale(4),
  },

  statusFilterContainer: {
    paddingVertical: scale(8),
    backgroundColor: "#fff",
  },

  statusFilterList: {
    paddingHorizontal: scale(4),
  },

  statusFilterButton: {
    paddingHorizontal: wp(3.9), // 16px
    paddingVertical: scale(8),
    marginHorizontal: scale(4),
    borderRadius: scale(20),
    borderWidth: scale(0.3),
    backgroundColor: "transparent",
  },

  activeStatusFilter: {
    backgroundColor: "#03A9F4",
    borderWidth: 0,
  },

  statusFilterText: {
    fontSize: fs(14),
    fontWeight: fontWeight.medium,
  },

  activeStatusFilterText: {
    color: "white",
  },

  monthFilterContainer: {
    paddingVertical: scale(8),
    backgroundColor: "#fff",
    borderBottomWidth: scale(1),
    borderBottomColor: "#E0E0E0",
  },

  monthFilterList: {
    paddingHorizontal: scale(4),
  },

  monthFilterButton: {
    paddingHorizontal: wp(3.9), // 16px
    paddingVertical: scale(8),
    marginHorizontal: scale(4),
    borderRadius: scale(20),
    backgroundColor: "#F5F5F5",
    borderWidth: scale(1),
    borderColor: "transparent",
  },

  activeMonthFilter: {
    backgroundColor: "#03A9F4",
  },

  currentMonthBorder: {
    borderColor: "#03A9F4",
    borderWidth: scale(2),
  },

  monthFilterText: {
    fontSize: fs(14),
    fontWeight: fontWeight.medium,
    color: "#757575",
  },

  activeMonthFilterText: {
    color: "white",
  },

  yearFilterContainer: {
    backgroundColor: "#fff",
  },

  yearFilterButton: {
    paddingHorizontal: wp(3.9), // 16px
    paddingVertical: scale(8),
    marginHorizontal: scale(4),
    borderRadius: scale(20),
    borderWidth: scale(1),
    borderColor: "#E0E0E0",
    backgroundColor: "#fff",
    minWidth: scale(60),
    alignItems: "center",
  },

  activeYearFilter: {
    backgroundColor: "#03A9F4",
    borderColor: "#03A9F4",
  },

  currentYearBorder: {
    borderColor: "#03A9F4",
    borderWidth: scale(2),
  },

  yearFilterText: {
    fontSize: fs(14),
    fontWeight: fontWeight.medium,
    color: "#757575",
  },

  activeYearFilterText: {
    color: "white",
    fontWeight: fontWeight.semiBold,
  },

  monthFilterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale(8),
    marginHorizontal: wp(3.9), // 16px
  },

  monthFilterTitle: {
    fontSize: fs(14),
    fontWeight: fontWeight.semiBold,
    color: "#424242",
  },

  yearButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(16),
    backgroundColor: "#F5F5F5",
  },

  yearButtonText: {
    fontSize: fs(14),
    fontWeight: fontWeight.semiBold,
    color: "#03A9F4",
    marginRight: scale(4),
  },

  chargText: {
    fontSize: fs(10),
    color: "#6B7280",
    fontStyle: "italic",
    marginTop: scale(2),
    fontWeight: fontWeight.regular,
  },

  remiseText: {
    fontSize: fs(10),
    color: "#059669",
    fontWeight: fontWeight.medium,
    marginTop: scale(1),
  },

  commandeReference: {
    fontSize: fs(13),
    color: "#6B7280",
    fontWeight: fontWeight.medium,
    marginTop: scale(4),
  },

  vgbelText: {
    fontSize: fs(11),
    color: "#6B7280",
    fontWeight: fontWeight.regular,
    marginTop: scale(1),
  },

  yearFilterList: {
    paddingHorizontal: scale(4),
  },

  yearPickerContainer: {
    marginTop: scale(8),
  },
  floatingButton: {
    position: "absolute",
    bottom: wp(4.9),
    right: wp(4.9),
    width: scale(50),
    height: scale(50),
    borderRadius: scale(28),
    backgroundColor: "#03A9F4",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: scale(5), height: scale(4) },
    shadowOpacity: 0.9,
    shadowRadius: scale(6),
    zIndex: 1000,
  },
});

export default LivraisonScreen;
