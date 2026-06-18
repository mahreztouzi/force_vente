import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StatusBar,
  Alert,
  BackHandler,
  Dimensions,
  Animated,
} from "react-native";
import {
  MaterialCommunityIcons,
  MaterialIcons,
  FontAwesome5,
  Feather,
  AntDesign,
} from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import { useSelector, useDispatch } from "react-redux";
import { getstocks } from "../redux/slices/stockSlice";
import { loadUser, loginUser, logoutUser } from "../redux/slices/authSlice";
import { wp, hp, fs, fontWeight, scale } from "../utils/responsive";
import { loadAllOfflineEncaissements } from "../redux/slices/offlineSlice";

import { loadFavorites, getClients } from "../redux/slices/clientSlice";
import { Avatar } from "react-native-elements";

const { width, height } = Dimensions.get("window");

const Dashboard = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  // const [loading, setLoading] = useState(true);
  const { stocks } = useSelector((state) => state.stock);
  const userData = useSelector((state) => state.auth.user);
  const [animatedValue] = useState(new Animated.Value(0));
  const { isConnected, isServerReachable, lastCheck } = useSelector(
    (state) => state.offline
  );
  const { clients, favorites } = useSelector((state) => state.clients);
  // Stock summary
  const [stockSummary, setStockSummary] = useState({
    totalItems: 0,
    lowStock: 0,
    outOfStock: 0,
    recentActivity: [],
  });

  // Dans votre selector
  // const totalMontant = useSelector((state) => state.offline);
  const { totalMontant } = useSelector((state) => state.offline);

  // Animation effect
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Fetch stocks on component mount
  useEffect(() => {
    const loadStocksAndUser = async () => {
      try {
        await dispatch(getstocks({ magasin: userData.magasin }));
        await dispatch(loadUser({ user: userData.code }));
        await dispatch(loadAllOfflineEncaissements());
        await dispatch(getClients({ grpVendeur: userData?.grp })); // Ajouter
        await dispatch(loadFavorites()); // Ajouter
      } catch (error) {
        console.error("Erreur lors du chargement des stocks:", error);
      }
    };

    loadStocksAndUser();
  }, [dispatch, navigation, lastCheck]);

  // Calculate stock summary when stocks are updated
  useEffect(() => {
    if (stocks && stocks.length > 0) {
      const totalItems = stocks.length;
      const lowStock = stocks.filter(
        (item) =>
          parseFloat(item.AvailableStock) > 0 &&
          parseFloat(item.AvailableStock) < 50
      ).length;
      const outOfStock = stocks.filter(
        (item) => parseFloat(item.AvailableStock) <= 0
      ).length;

      // Generate sample recent activity (replace with real data)
      const recentActivity = [
        {
          id: 1,
          type: "livraison",
          item: "Commande #12345",
          date: "Aujourd'hui, 09:45",
        },
        {
          id: 2,
          type: "reception",
          item: "Transfert #T789",
          date: "Hier, 15:30",
        },
        {
          id: 3,
          type: "encaissement",
          item: "Client #C456",
          date: "04/11/2025, 14:20",
        },
      ];

      setStockSummary({
        totalItems,
        lowStock,
        outOfStock,
        recentActivity,
      });
    }
  }, [stocks]);

  // Filtrer les clients favoris
  const favoriteClients = useMemo(() => {
    if (!clients || !favorites || favorites.length === 0) return [];
    return clients
      .filter((client) => favorites.includes(client.kunnr))
      .slice(0, 10); // Limiter à 10 pour la performance
  }, [clients, favorites]);

  // Refresh function
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await dispatch(getstocks({ magasin: userData?.magasin }));
      await dispatch(loadUser({ user: userData?.code }));
      await dispatch(loadAllOfflineEncaissements());
    } catch (error) {
      console.error("Erreur lors du rafraîchissement:", error);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  // Back button handler
  const handleLogout = () => {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Oui",
          onPress: () => {
            dispatch(logoutUser()).then(() => {
              navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
              });
            });
          },
        },
      ],
      { cancelable: false }
    );
    return true;
  };
  const handleBackPress = () => {
    Alert.alert(
      "Fermer l'application",
      "Êtes-vous sûr de vouloir quitter l'application ?",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Quitter",
          onPress: () => {
            BackHandler.exitApp(); // Ferme l'application
          },
        },
      ],
      { cancelable: false }
    );
    return true;
  };
  // Add event listener for back button
  useFocusEffect(
    useCallback(() => {
      BackHandler.addEventListener("hardwareBackPress", handleBackPress);
      return () => {
        BackHandler.removeEventListener("hardwareBackPress", handleBackPress);
      };
    }, [])
  );

  // Custom chart component to replace PieChart
  const CustomStockVisualizer = ({ data }) => {
    const totalItems = data.reduce((sum, item) => sum + item.value, 0);

    return (
      <View style={styles.customChartContainer}>
        <View style={styles.progressBarsContainer}>
          {data.map((item, index) => (
            <View key={index} style={styles.progressBarItem}>
              <View style={styles.progressLabelContainer}>
                <View
                  style={[
                    styles.progressColorDot,
                    { backgroundColor: item.color },
                  ]}
                />
                <Text style={styles.progressLabel}>{item.name}</Text>
                <Text style={styles.progressValue}>{item.value}</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${(item.value / totalItems) * 100}%`,
                      backgroundColor: item.color,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.stockDonutContainer}>
          {data.map((item, index) => {
            const rotation =
              index === 0
                ? 0
                : data
                    .slice(0, index)
                    .reduce((sum, i) => sum + (i.value / totalItems) * 360, 0);

            return (
              <View
                key={index}
                style={[
                  styles.donutSegment,
                  {
                    backgroundColor: item.color,
                    transform: [{ rotate: `${rotation}deg` }],
                    width:
                      totalItems === 0
                        ? 0
                        : (item.value / totalItems) * 360 > 180
                        ? 100
                        : 50,
                    height: 100,
                    borderRadius: 50,
                  },
                ]}
              />
            );
          })}
          <View style={styles.donutHole} />
        </View>
      </View>
    );
  };

  // Prepare data for custom chart
  const stockChartData = [
    {
      name: "En stock",
      value: stocks?.length
        ? stocks.length - stockSummary.lowStock - stockSummary.outOfStock
        : 0,
      color: "#03A9F4",
    },
    {
      name: "Stock faible",
      value: stockSummary.lowStock,
      color: "#FFC107",
    },
    {
      name: "Épuisé",
      value: stockSummary.outOfStock,
      color: "#F44336",
    },
  ];

  const avatarColors = [
    "#00adee",
    "#f7a21b",
    "#006838",
    "#00a551",
    "#ec1c24",
    "#131313",
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#03A9F4" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Tableau de bord</Text>

          {/* <TouchableOpacity
            style={styles.avatar}
            onPress={() => navigation.navigate("Settings")}
          >
            <MaterialCommunityIcons name="cog" size={24} color="#ffff" />
          </TouchableOpacity> */}
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.avatar}
              onPress={() => navigation.navigate("ClientsEtat")}
            >
              <MaterialCommunityIcons
                name="clipboard-list-outline"
                size={24}
                color="#ffff"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.avatar}
              onPress={() => navigation.navigate("Settings")}
            >
              <MaterialCommunityIcons name="cog" size={24} color="#ffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* <ConnectionManager /> */}

        <View style={styles.headerBottom}>
          <Text style={styles.welcomeText}>
            Bienvenue, {userData?.fullName || "Utilisateur"}
          </Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>
      </View>
      {/* Main Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#03A9F4", "#FFC107", "#4CAF50"]}
            progressBackgroundColor="#FFFFFF"
            tintColor="#03A9F4"
          />
        }
      >
        {/* Chiffre d'affaire avec gradient */}
        <Animated.View
          style={[
            styles.revenueCard,
            {
              opacity: animatedValue,
              transform: [
                {
                  translateY: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.revenueHeader}>
            <View style={styles.revenueIconContainer}>
              <MaterialIcons name="payments" size={24} color="#4CAF50" />
            </View>
            <View style={styles.revenueTextContainer}>
              <Text style={styles.revenueLabel}>Montant encaissé</Text>
            </View>
          </View>

          <View style={styles.revenueAmountContainer}>
            <Text style={styles.revenueAmount}>
              {userData?.montant
                ? parseFloat(userData?.montant).toLocaleString("fr-DZ", {
                    style: "currency",
                    currency: "DZD",
                    minimumFractionDigits: 2,
                  })
                : "0.00 DA"}
            </Text>
          </View>

          {/* Nouveau: Montant des encaissements offline */}
          {totalMontant && totalMontant != 0 ? (
            <View style={styles.offlineEncaissementContainer}>
              <View style={styles.offlineHeader}>
                <View style={styles.offlineText}>
                  <MaterialIcons
                    name="sync-disabled"
                    size={18}
                    color="#FF9800"
                  />
                  <Text style={styles.offlineLabel}>
                    En attente de synchronisation
                  </Text>
                </View>
                <Text style={styles.offlineAmount}>
                  {totalMontant
                    ? parseFloat(totalMontant).toLocaleString("fr-DZ", {
                        style: "currency",
                        currency: "DZD",
                        minimumFractionDigits: 2,
                      })
                    : "0.00 DA"}
                </Text>
              </View>
            </View>
          ) : null}
        </Animated.View>
        {/* Section Clients Favoris */}
        {favoriteClients.length > 0 && (
          <Animated.View
            style={[
              styles.favoritesSection,
              {
                opacity: animatedValue,
                transform: [
                  {
                    translateY: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.favoritesSectionHeader}>
              <View style={styles.favoritesHeaderLeft}>
                {/* <MaterialCommunityIcons name="star" size={20} color="#FE9900" /> */}
                <Text style={styles.favoritesSectionTitle}>
                  Clients favoris
                </Text>
                <View style={styles.favoritesBadge}>
                  <Text style={styles.favoritesBadgeText}>
                    {favorites.length}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate("Clients")}
                style={styles.viewAllFavoritesButton}
              >
                <Text style={styles.viewAllFavoritesText}>
                  Tous mes clients
                </Text>
                <MaterialIcons name="chevron-right" size={18} color="#03A9F4" />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.favoritesScrollContent}
            >
              {favoriteClients.map((client, index) => (
                <TouchableOpacity
                  key={client.kunnr}
                  style={styles.favoriteClientCard}
                  onPress={() =>
                    navigation.navigate("ClientDetails", { client: client })
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.favoriteAvatarContainer}>
                    <Avatar
                      rounded
                      size={scale(56)}
                      title={client.name1.charAt(0)}
                      containerStyle={[
                        styles.favoriteAvatar,
                        {
                          backgroundColor:
                            avatarColors[index % avatarColors.length],
                        },
                      ]}
                      titleStyle={styles.favoriteAvatarText}
                    />
                    <View style={styles.favoriteStarBadge}>
                      <MaterialCommunityIcons
                        name="star"
                        size={12}
                        color="#FFF"
                      />
                    </View>
                  </View>
                  <Text style={styles.favoriteClientName} numberOfLines={1}>
                    {client.name1}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Stats Summary */}
        <Text style={styles.sectionTitle}>Etat du stock</Text>
        <View style={styles.statsSummaryContainer}>
          <View style={styles.statCardItem}>
            <View
              style={[
                styles.statIconBg,
                { backgroundColor: "rgba(3, 169, 244, 0.1)" },
              ]}
            >
              <MaterialIcons name="inventory" size={24} color="#03A9F4" />
            </View>
            <Text style={styles.statCardValue}>{stockSummary.totalItems}</Text>
            <Text style={styles.statCardLabel}>Articles</Text>
          </View>

          <View style={styles.statCardItem}>
            <View
              style={[
                styles.statIconBg,
                { backgroundColor: "rgba(255, 193, 7, 0.1)" },
              ]}
            >
              <Feather name="alert-triangle" size={24} color="#FFC107" />
            </View>
            <Text style={[styles.statCardValue, { color: "#FFC107" }]}>
              {stockSummary.lowStock}
            </Text>
            <Text style={styles.statCardLabel}>Stock faible</Text>
          </View>

          <View style={styles.statCardItem}>
            <View
              style={[
                styles.statIconBg,
                { backgroundColor: "rgba(244, 67, 54, 0.1)" },
              ]}
            >
              <MaterialIcons name="error-outline" size={24} color="#F44336" />
            </View>
            <Text style={[styles.statCardValue, { color: "#F44336" }]}>
              {stockSummary.outOfStock}
            </Text>
            <Text style={styles.statCardLabel}>Épuisés</Text>
          </View>
        </View>

        {/* Quick Action Cards */}
        {/* <Animated.View
          style={[
            styles.quickActions,
            {
              // opacity: animatedValue,
              transform: [
                {
                  translateY: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.actionCardsContainer}>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate("Clients")}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: "rgba(3, 169, 244, 0.1)" },
                ]}
              >
                <MaterialIcons name="people" size={24} color="#03A9F4" />
              </View>
              <Text style={styles.actionText}>Clients</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate("Stock")}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: "rgba(76, 175, 80, 0.1)" },
                ]}
              >
                <FontAwesome5 name="warehouse" size={22} color="#4CAF50" />
              </View>
              <Text style={styles.actionText}>Stock</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { width: "100%" }]}
              onPress={() =>
                navigation.navigate("transfert_list", {
                  magasin: userData?.magasin,
                })
              }
            >
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: "rgba(255, 152, 0, 0.1)",
                  },
                ]}
              >
                <MaterialIcons name="swap-horiz" size={24} color="#FF9800" />
              </View>
              <Text style={styles.actionText}>Réception</Text>
            </TouchableOpacity>
          </View>
        </Animated.View> */}
        <Animated.View
          style={[
            styles.quickActions,
            {
              transform: [
                {
                  translateY: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>
            {favoriteClients.length > 0
              ? "Gestion des stocks"
              : "Actions rapides"}
          </Text>

          <View style={styles.actionCardsContainer}>
            {/* Bouton Clients - affiché uniquement s'il n'y a pas de favoris */}
            {favoriteClients.length === 0 && (
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate("Clients")}
              >
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: "rgba(3, 169, 244, 0.1)" },
                  ]}
                >
                  <MaterialIcons name="people" size={24} color="#03A9F4" />
                </View>
                <Text style={styles.actionText}>Clients</Text>
              </TouchableOpacity>
            )}

            {/* Bouton Stock */}
            <TouchableOpacity
              style={[
                styles.actionCard,
                favoriteClients.length > 0 && { width: "48%" }, // Prend 48% quand favoris existent
              ]}
              onPress={() => navigation.navigate("Stock")}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: "rgba(76, 175, 80, 0.1)" },
                ]}
              >
                <FontAwesome5 name="warehouse" size={22} color="#4CAF50" />
              </View>
              <Text style={styles.actionText}>Stock</Text>
            </TouchableOpacity>

            {/* Bouton Réception */}
            <TouchableOpacity
              style={[
                styles.actionCard,
                favoriteClients.length > 0
                  ? { width: "48%" } // Prend 48% quand favoris existent
                  : { width: "100%" }, // Prend 100% quand pas de favoris
              ]}
              onPress={() =>
                navigation.navigate("transfert_list", {
                  magasin: userData?.magasin,
                })
              }
            >
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: "rgba(255, 152, 0, 0.1)",
                  },
                ]}
              >
                <MaterialIcons name="swap-horiz" size={24} color="#FF9800" />
              </View>
              <Text style={styles.actionText}>Réception</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Add some space at the bottom */}
      </ScrollView>
      <View style={{ height: 20 }} />
      {/* {isServerReachable && <FloatingActionButton navigation={navigation} />} */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  header: {
    paddingTop: StatusBar.currentHeight || 0,
    paddingBottom: hp(2.2),
    backgroundColor: "#03A9F4",
    borderBottomLeftRadius: scale(20),
    borderBottomRightRadius: scale(20),
    elevation: 5,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: scale(12),
    paddingTop: scale(12),
  },
  headerBottom: {
    paddingHorizontal: scale(16),
    paddingTop: scale(16),
  },
  drawerButton: {
    marginRight: scale(10),
  },
  headerTitle: {
    fontSize: fs(20),
    fontWeight: fontWeight.bold,
    color: "#FFFFFF",
  },
  profileButton: {
    padding: scale(8),
  },
  avatar: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 5,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: fs(18),
    fontWeight: fontWeight.bold,
  },
  welcomeText: {
    fontSize: fs(16),
    color: "#FFFFFF",
    opacity: 0.9,
  },
  dateText: {
    fontSize: fs(14),
    color: "#FFFFFF",
    opacity: 0.8,
    marginTop: scale(4),
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(16),
    paddingTop: scale(16),
  },
  revenueCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(20),
    padding: scale(5),
    marginBottom: scale(24),
    borderColor: "rgba(0, 0, 0, 0.04)",
  },
  revenueHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale(16),
  },
  revenueIconContainer: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(12),
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: scale(16),
  },
  revenueTextContainer: {
    flex: 1,
  },
  revenueLabel: {
    fontSize: fs(16),
    fontWeight: fontWeight.semiBold,
    color: "#374151",
    marginBottom: scale(2),
  },
  revenuePeriod: {
    fontSize: fs(14),
    color: "#9CA3AF",
  },
  revenueAmountContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "flex-end",
    marginBottom: scale(12),
  },
  revenueAmount: {
    fontSize: fs(32),
    fontWeight: fontWeight.extraBold,
    color: "#1F2937",
    letterSpacing: -1,
  },
  revenueCurrency: {
    fontSize: fs(18),
    fontWeight: fontWeight.semiBold,
    color: "#6B7280",
    marginLeft: scale(8),
  },
  revenueGrowth: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(20),
    alignSelf: "flex-end",
  },
  revenueGrowthText: {
    fontSize: fs(14),
    fontWeight: fontWeight.semiBold,
    color: "#4CAF50",
    marginLeft: scale(4),
  },
  statsMontantContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingVertical: hp(2.2),
    paddingHorizontal: scale(10),
    marginBottom: scale(20),
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
  },
  montantText: {
    fontSize: fs(33),
    fontWeight: fontWeight.bold,
    color: "#333333",
  },
  statsSummaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: scale(20),
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
  },
  statCardItem: {
    borderRadius: scale(12),
    padding: scale(10),
    flex: 1,
    marginHorizontal: scale(4),
    alignItems: "center",
  },
  statIconBg: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: scale(3),
  },
  statCardValue: {
    fontSize: fs(18),
    fontWeight: fontWeight.bold,
    color: "#03A9F4",
  },
  statCardLabel: {
    fontSize: fs(11),
    color: "#666666",
    marginTop: scale(4),
  },
  sectionTitle: {
    fontSize: fs(18),
    fontWeight: fontWeight.bold,
    color: "#333333",
    marginBottom: scale(12),
  },
  actionCardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickActions: {
    marginBottom: scale(20),
  },
  actionCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    padding: scale(16),
    marginBottom: scale(12),
    alignItems: "center",
    elevation: 1,
  },
  iconContainer: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: scale(12),
  },
  actionText: {
    fontSize: fs(14),
    fontWeight: fontWeight.bold,
    color: "#333333",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    padding: scale(20),
    marginBottom: scale(16),
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(3),
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale(20),
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  seeAllText: {
    color: "#03A9F4",
    fontSize: fs(14),
    marginRight: scale(2),
  },
  stockOverview: {
    marginBottom: scale(8),
  },
  customChartContainer: {
    marginTop: scale(10),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressBarsContainer: {
    flex: 1,
    marginRight: scale(20),
  },
  progressBarItem: {
    marginBottom: scale(12),
  },
  progressLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale(6),
  },
  progressColorDot: {
    width: scale(12),
    height: scale(12),
    borderRadius: scale(6),
    marginRight: scale(8),
  },
  progressLabel: {
    flex: 1,
    fontSize: fs(14),
    color: "#555555",
  },
  progressValue: {
    fontSize: fs(14),
    fontWeight: fontWeight.bold,
    color: "#333333",
  },
  progressBarBg: {
    height: scale(8),
    backgroundColor: "#EEEEEE",
    borderRadius: scale(4),
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: scale(4),
  },
  stockDonutContainer: {
    width: scale(100),
    height: scale(100),
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  donutSegment: {
    position: "absolute",
    width: scale(50),
    height: scale(100),
    left: scale(50),
    top: 0,
    transformOrigin: "left center",
    overflow: "hidden",
  },
  donutHole: {
    position: "absolute",
    width: scale(60),
    height: scale(60),
    backgroundColor: "#FFFFFF",
    borderRadius: scale(30),
  },
  noDataContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: scale(30),
  },
  noDataText: {
    fontSize: fs(14),
    color: "#999999",
    marginTop: scale(10),
    textAlign: "center",
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: scale(12),
    borderBottomWidth: scale(1),
    borderBottomColor: "#EEEEEE",
  },
  activityIcon: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(21),
    justifyContent: "center",
    alignItems: "center",
    marginRight: scale(16),
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: fs(15),
    fontWeight: fontWeight.medium,
    color: "#333333",
  },
  activityTime: {
    fontSize: fs(13),
    color: "#999999",
    marginTop: scale(2),
  },
  bottomButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: scale(16),
    marginTop: scale(8),
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1976D2",
    borderRadius: scale(10),
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4.9),
    elevation: 4,
    flex: 1,
    marginHorizontal: scale(6),
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: fs(14),
    fontWeight: fontWeight.bold,
    marginLeft: scale(8),
  },
  floatingButton: {
    position: "absolute",
    bottom: scale(24),
    right: scale(24),
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    backgroundColor: "#03A9F4",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.25,
    shadowRadius: scale(3.84),
  },
  offlineEncaissementContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },

  offlineHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  offlineText: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },

  offlineLabel: {
    fontSize: 11,
    color: "#666",
    marginLeft: 4,
    fontWeight: "500",
  },

  offlineAmount: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF9800",
    marginTop: 2,
  },

  favoritesSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(20),
    padding: scale(5),
    marginBottom: scale(24),
  },
  favoritesSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale(8),
  },
  favoritesHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  favoritesSectionTitle: {
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
    color: "#333333",
    marginLeft: scale(8),
  },
  favoritesBadge: {
    backgroundColor: "rgba(254, 153, 0, 0.1)",
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
    borderRadius: scale(12),
    marginLeft: scale(8),
  },
  favoritesBadgeText: {
    fontSize: fs(12),
    fontWeight: fontWeight.semiBold,
    color: "#FE9900",
  },
  viewAllFavoritesButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewAllFavoritesText: {
    fontSize: fs(14),
    color: "#03A9F4",
    fontWeight: fontWeight.medium,
  },
  favoritesScrollContent: {
    paddingRight: scale(16),
  },
  favoriteClientCard: {
    alignItems: "center",
    marginRight: scale(16),
    width: scale(80),
  },
  favoriteAvatarContainer: {
    position: "relative",
    marginBottom: scale(1),
  },
  favoriteAvatar: {
    borderWidth: scale(2),
    borderColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
  },
  favoriteAvatarText: {
    fontSize: fs(20),
    fontWeight: fontWeight.bold,
  },
  favoriteStarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#FE9900",
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    justifyContent: "center",
    alignItems: "center",
    borderWidth: scale(2),
    borderColor: "#FFFFFF",
  },
  favoriteClientName: {
    fontSize: fs(13),
    fontWeight: fontWeight.medium,
    color: "#333333",
    textAlign: "center",
    marginBottom: scale(2),
  },
  favoriteClientCode: {
    fontSize: fs(11),
    color: "#999999",
    textAlign: "center",
  },
});

export default Dashboard;
