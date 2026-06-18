import React, { useEffect, useState, useLayoutEffect, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Linking,
  RefreshControl,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { getClients, loadFavorites } from "../redux/slices/clientSlice";
import { Avatar } from "react-native-elements";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { BackHandler } from "react-native";
import { wp, hp, fs, fontWeight, scale } from "../utils/responsive";

const ClientList = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState("all");
  const { clients, favorites, loading, error } = useSelector(
    (state) => state.clients
  );
  const userData = useSelector((state) => state.auth.user);
  const { isServerReachable } = useSelector((state) => state.offline);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (isServerReachable) {
        await dispatch(getClients({ grpVendeur: userData?.grp }));
        await dispatch(loadFavorites());
      }
    } catch (error) {
      console.error("Erreur lors du rafraîchissement:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Liste des couleurs pour les avatars
  const avatarColors = [
    "#00adee",
    "#f7a21b",
    "#006838",
    "#00a551",
    "#ec1c24",
    "#131313",
  ];

  // Fonction pour obtenir la couleur d'un avatar selon l'index
  const getAvatarColor = (index) => {
    return avatarColors[index % avatarColors.length];
  };

  useEffect(() => {
    const handleBackPress = () => {
      // Comportement normal - retourner à l'écran précédent
      navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress
    );
    return () => backHandler.remove();
  }, [navigation]);

  // ✅ FIX 1: Supprimer la dépendance problématique
  useEffect(() => {
    const loadClient = async () => {
      if (isServerReachable) {
        await dispatch(getClients({ grpVendeur: userData?.grp }));
      }
    };
    loadClient();
  }, [dispatch]);

  useEffect(() => {
    dispatch(loadFavorites());
  }, [dispatch]);

  // ✅ FIX 2: Optimiser le filtrage avec useMemo
  const filteredBySearch = useMemo(() => {
    if (searchTerm.trim() === "") {
      return clients;
    }
    return clients.filter(
      (client) =>
        client.name1.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.code &&
          client.code.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [clients, searchTerm]);

  // ✅ FIX 3: Optimiser le filtrage final avec useMemo
  const displayClients = useMemo(() => {
    if (activeTab === "all") {
      return filteredBySearch;
    }
    return filteredBySearch.filter((client) =>
      favorites.includes(client.kunnr)
    );
  }, [activeTab, filteredBySearch, favorites]);

  const handleCall = (phoneNumber) => {
    console.log("phone number :", phoneNumber);
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      alert("Numéro de téléphone non disponible");
    }
  };

  // ✅ FIX 4: Fonction pour gérer le changement d'onglet
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Réinitialiser la recherche quand on change d'onglet
    if (tab === "favorites") {
      setSearchTerm("");
    }
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Erreur: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Barre de recherche */}
      <StatusBar backgroundColor="#03A9F4" barStyle="light-content" />
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "all" && styles.activeTab]}
          onPress={() => handleTabChange("all")} // ✅ Utiliser la nouvelle fonction
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "all" && styles.activeTabText,
            ]}
          >
            Tous les clients
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "favorites" && styles.activeTab]}
          onPress={() => handleTabChange("favorites")} // ✅ Utiliser la nouvelle fonction
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "favorites" && styles.activeTabText,
            ]}
          >
            Favoris ({favorites.length})
          </Text>
        </TouchableOpacity>
      </View>
      {activeTab === "all" && (
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un client..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm !== "" && (
            <TouchableOpacity onPress={() => setSearchTerm("")}>
              <MaterialCommunityIcons name="close" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
        </View>
      ) : (
        <FlatList
          data={displayClients}
          keyExtractor={(item) => item.kunnr}
          removeClippedSubviews={true}
          // ✅ Augmenter ces valeurs pour permettre l'affichage de plus d'éléments
          maxToRenderPerBatch={30}
          initialNumToRender={20}
          windowSize={15}
          // ✅ Utiliser une clé composite pour forcer le reset du FlatList
          key={`${activeTab}-${favorites.length}`}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#03A9F4"]} // Couleur pour Android
              tintColor="#03A9F4" // Couleur pour iOS
              title="Actualisation..." // Texte pour iOS
              titleColor="#666" // Couleur du texte pour iOS
            />
          }
          renderItem={({ item, index }) => (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("ClientDetails", { client: item })
              }
              style={styles.clientCard}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "start",
                  alignItems: "center",
                }}
              >
                <View style={{ position: "relative" }}>
                  <Avatar
                    rounded
                    size={50}
                    title={item.name1.charAt(0)}
                    containerStyle={[
                      styles.avatar,
                      { backgroundColor: getAvatarColor(index) },
                    ]}
                  />
                  {favorites.includes(item.kunnr) && (
                    <TouchableOpacity
                      // onPress={() => dispatch(toggleFavorite(item.kunnr))}
                      style={{
                        position: "absolute",
                        top: -6,
                        right: 46,
                      }}
                    >
                      <MaterialCommunityIcons
                        name={
                          favorites.includes(item.kunnr)
                            ? "star"
                            : "star-outline"
                        }
                        size={20}
                        color={
                          favorites.includes(item.kunnr) ? "#FE9900" : "#666"
                        }
                      />
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.clientInfo}>
                  <Text style={styles.clientName}>{item.name1}</Text>
                  <Text style={styles.clientKunnr}>{item.kunnr}</Text>
                </View>
              </View>
              {/* Icône d'appel */}
              <View
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "end",
                  alignItems: "center",
                  padding: 5,
                }}
              >
                {item?.num_tel && (
                  <TouchableOpacity onPress={() => handleCall(item?.num_tel)}>
                    <MaterialCommunityIcons
                      name="phone"
                      size={28}
                      color="#03A9F4"
                    />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    fontSize: fs(16),
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: scale(10),
    marginTop: hp(0.5),
    marginHorizontal: wp(2.5),
    borderRadius: scale(10),
    marginBottom: hp(1),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: scale(3),
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: scale(10),
    fontSize: fs(16),
    color: "#333",
  },
  clientCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: scale(15),
    borderRadius: scale(3),
    marginVertical: hp(0.1),
    paddingHorizontal: wp(5),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: scale(3),
    elevation: 1,
  },
  avatar: {
    // backgroundColor supprimé d'ici car maintenant défini dynamiquement
  },
  clientInfo: {
    marginLeft: scale(15),
    width: "67%",
  },
  clientName: {
    fontSize: fs(18),
    fontWeight: fontWeight.medium,
    color: "#333",
    numberOfLines: "1",
    ellipsizeMode: "tail",
  },
  clientKunnr: {
    fontSize: fs(14),
    color: "#666",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    elevation: 2,
    marginBottom: hp(1),
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: hp(1.6),
    paddingHorizontal: wp(4),
  },
  activeTab: {
    borderBottomWidth: scale(3),
    borderBottomColor: "#03A9F4",
  },
  tabText: {
    marginLeft: scale(8),
    fontSize: fs(14),
    color: "#757575",
  },
  activeTabText: {
    color: "#03A9F4",
    fontWeight: fontWeight.semiBold,
  },
});

export default ClientList;
