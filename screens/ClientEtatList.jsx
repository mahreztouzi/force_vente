import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { getClientEtat, getClients } from "../redux/slices/clientSlice";
import { Avatar } from "react-native-elements";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { BackHandler } from "react-native";
import { wp, hp, fs, fontWeight, scale } from "../utils/responsive";

const ClientEtatList = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const {
    clientsEtat,
    clients,
    loadingEtat: loading,
    errorEtat: error,
  } = useSelector((state) => state.clients);
  const userData = useSelector((state) => state.auth.user);
  const { isServerReachable } = useSelector((state) => state.offline);
  const [refreshing, setRefreshing] = useState(false);

  const avatarColors = [
    "#00adee",
    "#f7a21b",
    "#006838",
    "#00a551",
    "#ec1c24",
    "#131313",
  ];

  const getAvatarColor = (index) => {
    return avatarColors[index % avatarColors.length];
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (isServerReachable) {
        await dispatch(getClientEtat({ codeUtilisateur: userData?.code }));
        await dispatch(getClients({ grpVendeur: userData?.grp }));
      }
    } catch (error) {
      console.error("Erreur lors du rafraîchissement:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const handleBackPress = () => {
      navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress
    );
    return () => backHandler.remove();
  }, [navigation]);

  useEffect(() => {
    const loadData = async () => {
      if (isServerReachable) {
        await dispatch(getClientEtat({ codeUtilisateur: userData?.code }));
        if (clients.length === 0) {
          await dispatch(getClients({ grpVendeur: userData?.grp }));
        }
      }
    };
    loadData();
  }, [dispatch]);

  const clientsEnAttente = useMemo(() => {
    if (!clientsEtat || clientsEtat.length === 0) return [];

    const filtered = clientsEtat.filter(
      (clientEtat) =>
        clientEtat.offres_en_attente > 0 ||
        clientEtat.commandes_en_attente > 0 ||
        clientEtat.livraisons_en_attente > 0
    );

    const sorted = filtered.sort((a, b) => {
      const totalA =
        a.offres_en_attente + a.commandes_en_attente + a.livraisons_en_attente;
      const totalB =
        b.offres_en_attente + b.commandes_en_attente + b.livraisons_en_attente;
      return totalB - totalA;
    });

    return sorted.map((clientEtat) => {
      const clientComplet = clients.find((c) => c.kunnr === clientEtat.client);
      return {
        ...clientEtat,
        clientData: clientComplet || null,
      };
    });
  }, [clientsEtat, clients]);

  const renderBadge = (count, icon, color, label, navigateTo, item) => {
    if (count === 0) return null;
    return (
      <TouchableOpacity
        style={styles.badgeWrapper}
        onPress={() => {
          const clientData = item.clientData || {
            kunnr: item.client,
            name1: item.nom_client,
            code: item.client,
          };
          navigation.navigate(navigateTo, { client: clientData });
        }}
        activeOpacity={0.7}
      >
        <View style={[styles.badge, { backgroundColor: color }]}>
          <MaterialCommunityIcons
            name={icon}
            size={scale(18)}
            color="#FFFFFF"
          />
          <Text style={styles.badgeCount}>{count}</Text>
        </View>
        <Text style={styles.badgeLabel}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const handleClientPress = (item) => {
    if (item.clientData) {
      navigation.navigate("ClientDetails", { client: item.clientData });
    } else {
      const clientMinimal = {
        kunnr: item.client,
        name1: item.nom_client,
        code: item.client,
      };
      navigation.navigate("ClientDetails", { client: clientMinimal });
    }
  };

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.errorContent}>
          <View style={styles.errorIconContainer}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={scale(64)}
              color="#E53935"
            />
          </View>
          <Text style={styles.errorTitle}>Une erreur est survenue</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <MaterialCommunityIcons
              name="refresh"
              size={scale(20)}
              color="#FFFFFF"
            />
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#03A9F4" barStyle="light-content" />

      <View style={styles.headerCard}>
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <MaterialCommunityIcons
              name="clipboard-alert-outline"
              size={scale(28)}
              color="#03A9F4"
            />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Documents en attente</Text>
            <Text style={styles.headerSubtitle}>
              {clientsEnAttente.length} client
              {clientsEnAttente.length > 1 ? "s" : ""} concerné
              {clientsEnAttente.length > 1 ? "s" : ""}
            </Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#03A9F4" />
          <Text style={styles.loadingText}>Chargement des données...</Text>
        </View>
      ) : clientsEnAttente.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyContent}>
            <View style={styles.emptyIconContainer}>
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={scale(80)}
                color="#4CAF50"
              />
            </View>
            <Text style={styles.emptyTitle}>Aucun document en attente</Text>
            <Text style={styles.emptySubtitle}>
              Tous vos clients sont à jour !
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={clientsEnAttente}
          keyExtractor={(item) => item.client}
          removeClippedSubviews={true}
          maxToRenderPerBatch={20}
          initialNumToRender={15}
          windowSize={10}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#03A9F4"]}
              tintColor="#03A9F4"
              title="Actualisation..."
              titleColor="#666666"
            />
          }
          renderItem={({ item, index }) => {
            const totalAttente =
              item.offres_en_attente +
              item.commandes_en_attente +
              item.livraisons_en_attente;

            return (
              <View style={styles.clientCard}>
                <TouchableOpacity
                  onPress={() => handleClientPress(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.clientHeader}>
                    <View style={styles.clientMainInfo}>
                      <Avatar
                        rounded
                        size={scale(56)}
                        title={item.nom_client.charAt(0)}
                        titleStyle={styles.avatarTitle}
                        containerStyle={[
                          styles.avatarContainer,
                          { backgroundColor: getAvatarColor(index) },
                        ]}
                      />
                      <View style={styles.clientTextInfo}>
                        <Text style={styles.clientName} numberOfLines={1}>
                          {item.nom_client}
                        </Text>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "flex-start",
                            gap: scale(10),
                          }}
                        >
                          <Text style={styles.clientCode}>{item.client}</Text>
                          <View style={styles.totalBadge}>
                            <MaterialCommunityIcons
                              name="clock-alert-outline"
                              size={scale(14)}
                              color="#F57C00"
                              style={styles.totalBadgeIcon}
                            />
                            <Text style={styles.totalBadgeText}>
                              {totalAttente} document
                              {totalAttente > 1 ? "s" : ""}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={scale(24)}
                      color="#BDBDBD"
                    />
                  </View>

                  <View style={styles.divider} />
                </TouchableOpacity>

                <View style={styles.badgesContainer}>
                  {renderBadge(
                    item.offres_en_attente,
                    "file-document-outline",
                    "#ff7809ff",
                    "Offres",
                    "quotation_liste",
                    item
                  )}
                  {renderBadge(
                    item.commandes_en_attente,
                    "cart-outline",
                    "#2196F3",
                    "Commandes",
                    "livraison",
                    item
                  )}
                  {renderBadge(
                    item.livraisons_en_attente,
                    "truck-delivery-outline",
                    "#4CAF50",
                    "Livraisons",
                    "allOutbounds",
                    item
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: wp(5),
  },
  loadingText: {
    marginTop: hp(2),
    fontSize: fs(15),
    color: "#757575",
    fontWeight: fontWeight.medium,
  },
  errorContent: {
    alignItems: "center",
    maxWidth: wp(85),
  },
  errorIconContainer: {
    marginBottom: hp(2),
  },
  errorTitle: {
    fontSize: fs(20),
    fontWeight: fontWeight.semiBold,
    color: "#212121",
    marginBottom: hp(1),
    textAlign: "center",
  },
  errorMessage: {
    color: "#E53935",
    fontSize: fs(15),
    textAlign: "center",
    marginBottom: hp(3),
    lineHeight: fs(22),
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#03A9F4",
    paddingHorizontal: wp(6),
    paddingVertical: hp(1.5),
    borderRadius: scale(10),
    gap: scale(8),
    shadowColor: "#03A9F4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: scale(8),
    elevation: 4,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: fs(16),
    fontWeight: fontWeight.semiBold,
  },
  emptyContent: {
    alignItems: "center",
    maxWidth: wp(80),
  },
  emptyIconContainer: {
    marginBottom: hp(2),
  },
  emptyTitle: {
    fontSize: fs(22),
    fontWeight: fontWeight.semiBold,
    color: "#212121",
    marginBottom: hp(1),
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: fs(16),
    color: "#757575",
    textAlign: "center",
    lineHeight: fs(24),
  },
  headerCard: {
    backgroundColor: "#FFFFFF",
    paddingVertical: scale(18),
    paddingHorizontal: scale(20),
    marginTop: hp(2),
    marginBottom: hp(1.5),
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconContainer: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(12),
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTextContainer: {
    marginLeft: scale(16),
    flex: 1,
  },
  headerTitle: {
    fontSize: fs(19),
    fontWeight: fontWeight.bold,
    color: "#212121",
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: fs(14),
    color: "#757575",
    marginTop: scale(4),
    fontWeight: fontWeight.medium,
  },
  listContent: {
    paddingBottom: hp(2),
  },
  clientCard: {
    backgroundColor: "#FFFFFF",
    paddingVertical: scale(10),
    paddingHorizontal: scale(8),
    marginHorizontal: wp(3),
    marginVertical: hp(0.3),
    borderRadius: scale(8),
    elevation: 0.1,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  clientHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  clientMainInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
    elevation: 2,
  },
  avatarTitle: {
    fontSize: fs(20),
    fontWeight: fontWeight.bold,
  },
  clientTextInfo: {
    marginLeft: scale(14),
    flex: 1,
  },
  clientName: {
    fontSize: fs(17),
    fontWeight: fontWeight.semiBold,
    color: "#212121",
    letterSpacing: 0.1,
    marginBottom: scale(2),
  },
  clientCode: {
    fontSize: fs(13),
    color: "#9E9E9E",
    fontWeight: fontWeight.medium,
    letterSpacing: 0.3,
  },
  totalBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8E1",
    paddingHorizontal: scale(4),
    paddingVertical: scale(4),
    borderRadius: scale(8),
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  totalBadgeIcon: {
    marginRight: scale(4),
  },
  totalBadgeText: {
    fontSize: fs(12),
    color: "#F57C00",
    fontWeight: fontWeight.semiBold,
    letterSpacing: 0.2,
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: hp(1),
  },
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(14),
  },
  badgeWrapper: {
    alignItems: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(20),
    paddingVertical: scale(8),
    borderRadius: scale(24),
    gap: scale(6),
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: scale(4),
    elevation: 3,
  },
  badgeCount: {
    color: "#FFFFFF",
    fontSize: fs(14),
    fontWeight: fontWeight.bold,
    letterSpacing: 0.3,
  },
  badgeLabel: {
    fontSize: fs(11),
    color: "#757575",
    marginTop: scale(6),
    fontWeight: fontWeight.medium,
    letterSpacing: 0.2,
  },
});

export default ClientEtatList;
