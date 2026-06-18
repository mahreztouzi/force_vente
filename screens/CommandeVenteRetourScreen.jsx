import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
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
  Animated,
  ScrollView,
  RefreshControl,
} from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { BackHandler } from "react-native";
import { Modalize } from "react-native-modalize";
import ArticlesModalize from "../components/ArticlesModalize"; // Importez le composant ArticlesModalize
import { getArticles } from "../redux/slices/articleSlice";

import { useMemo, useCallback } from "react";
import OfflineOrdersScreen from "./OfflineOrdersScreen";
import {
  fetchPendingActionsCount,
  loadOfflineOrders,
} from "../redux/slices/offlineSlice";
import { getAllCommande } from "../redux/slices/orderSlice";
import HeaderRightButton from "../components/HeaderRightButton";
import { wp, hp, fs, fontWeight, scale } from "../utils/responsive";

const { width, height } = Dimensions.get("window");

const CommandeVenteListeScreen = ({ route }) => {
  const navigation = useNavigation();
  const { client, retour } = route.params;
  const dispatch = useDispatch();
  const { isConnected, isServerReachable, offlineOrders } = useSelector(
    (state) => state.offline
  );
  const userData = useSelector((state) => state.auth.user);

  const {
    allOrders: commandesVenteData,
    allOrdersLoading: loading,
    allOrdersError: error,
  } = useSelector((state) => state.orders);

  const [searchQuery, setSearchQuery] = useState("");
  const [commandesDistinctes, setCommandesDistinctes] = useState([]);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [postesCommande, setPostesCommande] = useState([]);
  const [showRetours, setShowRetours] = useState(retour ? true : false);

  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showYearPicker, setShowYearPicker] = useState(false);

  // Références pour les modalizes
  const commandeDetailModalizeRef = useRef(null);

  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const flatListRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const statusOptions = [
    { key: "all", label: "Tous les statuts", color: "#757575" },
    { key: "initial", label: "Initial", color: "#3B82F6" },
    { key: "encours", label: "En cours", color: "#10B981" },
    { key: "termine", label: "Terminé", color: "#8B5CF6" },
  ];
  const getMonthName = (monthIndex) => {
    const months = [
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
    return months[monthIndex];
  };
  const currentMonthName = getMonthName(selectedMonth);
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <>
          <Text style={{ color: "white", fontSize: 16, fontWeight: "500" }}>
            {showRetours ? "Commandes de retour" : "Commandes de vente"}
          </Text>
          <Text style={{ color: "white", fontSize: 12, fontWeight: "medium" }}>
            {currentMonthName} {selectedYear}
          </Text>
        </>
      ),
      headerRight: () => (
        <HeaderRightButton
          navigation={navigation}
          client={route.params}
          link="quotation_liste"
        />
      ),
    });
  }, [navigation, client, !showRetours, currentMonthName]);

  // Fonctions utilitaires
  const getStatusColor = (status) => {
    const statusOption = statusOptions.find((option) => option.key === status);
    return statusOption ? statusOption.color : "#757575";
  };

  const getStatusLabel = (status) => {
    const statusOption = statusOptions.find((option) => option.key === status);
    return statusOption ? statusOption.label : status;
  };

  const getMonthDateRange = (year, month) => {
    const startDate = new Date(Date.UTC(year, month, 1));
    const endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

    const startDateFormatted = `${year}-${String(month + 1).padStart(
      2,
      "0"
    )}-01`;
    const endDateFormatted = `${year}-${String(month + 1).padStart(
      2,
      "0"
    )}-${String(endDate.getUTCDate()).padStart(2, "0")}`;

    return { startDateFormatted, endDateFormatted };
  };

  const generateMonths = () => {
    const months = [];
    const currentDate = new Date();

    for (let i = 0; i < 12; i++) {
      months.push({
        index: i,
        name: getMonthName(i),
        isCurrentMonth:
          i === currentDate.getMonth() &&
          selectedYear === currentDate.getFullYear(),
      });
    }
    return months;
  };

  const generateYears = () => {
    const years = [];
    const currentYear = new Date().getFullYear();

    for (let i = currentYear - 4; i <= currentYear; i++) {
      years.push({
        year: i,
        isCurrentYear: i === currentYear,
      });
    }
    return years;
  };

  const { startDateFormatted, endDateFormatted } = getMonthDateRange(
    selectedYear,
    selectedMonth
  );

  const handleMonthChange = (monthIndex) => {
    console.log(`Changement vers: ${getMonthName(monthIndex)} ${selectedYear}`);
    setSelectedMonth(monthIndex);
  };

  const handleYearChange = (year) => {
    console.log(`Changement vers l'année: ${year}`);
    setSelectedYear(year);
  };

  // Fonction pour convertir la date SAP
  const convertirDateSAP = (dateSAP) => {
    const timestampMatch = dateSAP.match(/\/Date\((\d+)\)\//);
    if (!timestampMatch)
      return { formatted: "Date invalide", date: new Date(0) };

    const timestamp = parseInt(timestampMatch[1]);
    const date = new Date(timestamp);

    return {
      formatted: date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
      date,
    };
  };

  // Fonction pour extraire les commandes distinctes
  const extraireCommandesDistinctes = useCallback(
    (commandesData) => {
      if (!commandesData?.length) return [];

      const commandesMap = new Map();

      const statutMapping = {
        initial: "Initial",
        encours: "En cours",
        termine: "Terminé",
      };

      commandesData
        .filter((commande) => commande.client === client?.kunnr)
        .filter((commande) => {
          // Filtrer par type de commande selon l'onglet sélectionné
          if (showRetours) {
            return commande.auart === "ZCRN"; // Commandes retours
          } else {
            return commande.auart === "ZCMD"; // Commandes de vente
          }
        })
        .forEach((commande) => {
          const key = commande.cmd;

          if (!commandesMap.has(key)) {
            const statutGlobal =
              statutMapping[commande.statu_global] || "Non reliée";

            commandesMap.set(key, {
              cmd: commande.cmd,
              commercial: commande.commercial,
              client: commande.client,
              clientName: client.name1,
              auart: commande.auart,
              bukrs: commande.bukrs,
              vgbel: commande.vgbel,
              montantTtc: parseFloat(commande.ttc).toLocaleString("fr-DZ", {
                style: "currency",
                currency: "DZD",
              }),
              erdat: convertirDateSAP(commande.erdat).formatted,
              statutGlobal,
              status: commande.statu_global,
              isOffline: commande?.isOffline || false,
              totalArticles: commandesData.filter(
                (c) => c.cmd === commande.cmd && !c.isDeleted
              ).length,
            });
          }
        });

      return Array.from(commandesMap.values());
    },
    [client?.kunnr, client?.name1, showRetours]
  );

  // Fonction pour charger les postes d'une commande
  const chargerPostesCommande = useCallback(
    (numeroCommande) => {
      if (!commandesVenteData?.length) return [];

      return commandesVenteData
        .filter(
          (commande) => commande.cmd === numeroCommande && !commande.isDeleted
        )
        .map((commande) => ({
          matnr: commande.matnr,
          posnr: commande.posnr,
          kmein: commande.kmein,
          lsmeng: parseFloat(commande.lsmeng),
          qte_restante: parseFloat(commande.qte_restante),
          designation: commande.maktx || `Article ${commande.matnr}`,
          prix: commande.prix_unitaire,
          remise_pourcentage: commande.remise_pourcentage,
          charg: commande.charg,
          devise: "DZD",
          auart: commande.auart,
          isOffline: commande.isOffline || false,
          isDeleted: commande.isDeleted || false,
        }));
    },
    [commandesVenteData]
  );

  // Filtrage des commandes distinctes
  const commandesFiltrees = useMemo(() => {
    let filtered = commandesDistinctes;

    // Filtrage par recherche
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (commande) =>
          commande.cmd.toLowerCase().includes(searchLower) ||
          commande.client.toLowerCase().includes(searchLower) ||
          (commande.clientName &&
            commande.clientName.toLowerCase().includes(searchLower))
      );
    }

    // Filtrage par statut
    if (selectedStatus !== "all") {
      filtered = filtered.filter(
        (commande) => commande.status === selectedStatus
      );
    }

    return filtered;
  }, [commandesDistinctes, searchQuery, selectedStatus]);

  // Rendu des filtres
  const renderStatusFilter = () => (
    <View style={styles.statusFilterContainer}>
      <FlatList
        data={statusOptions}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.statusFilterButton,
              selectedStatus === item.key && styles.activeStatusFilter,
              { borderColor: item.color },
            ]}
            onPress={() => setSelectedStatus(item.key)}
          >
            <Text
              style={[
                styles.statusFilterText,
                selectedStatus === item.key && styles.activeStatusFilterText,
                { color: selectedStatus === item.key ? "white" : item.color },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.statusFilterList}
      />
    </View>
  );

  const renderMonthFilter = () => (
    <View style={styles.monthFilterContainer}>
      <FlatList
        data={generateMonths()}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.monthFilterButton,
              selectedMonth === item.index && styles.activeMonthFilter,
              item.isCurrentMonth && styles.currentMonthBorder,
            ]}
            onPress={() => handleMonthChange(item.index)}
          >
            <Text
              style={[
                styles.monthFilterText,
                selectedMonth === item.index && styles.activeMonthFilterText,
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.monthFilterList}
      />
    </View>
  );

  const renderYearFilter = () => (
    <View style={styles.yearFilterContainer}>
      <View style={styles.monthFilterHeader}>
        <Text style={styles.monthFilterTitle}>Filtrer par mois</Text>
        <TouchableOpacity
          style={styles.yearButton}
          onPress={() => setShowYearPicker(!showYearPicker)}
        >
          <Text style={styles.yearButtonText}>{selectedYear}</Text>
          <MaterialIcons name="keyboard-arrow-down" size={18} color="#03A9F4" />
        </TouchableOpacity>
      </View>

      {showYearPicker && (
        <View style={styles.yearPickerContainer}>
          <FlatList
            data={generateYears()}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.year.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.yearFilterButton,
                  selectedYear === item.year && styles.activeYearFilter,
                  item.isCurrentYear && styles.currentYearBorder,
                ]}
                onPress={() => handleYearChange(item.year)}
              >
                <Text
                  style={[
                    styles.yearFilterText,
                    selectedYear === item.year && styles.activeYearFilterText,
                  ]}
                >
                  {item.year}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.yearFilterList}
          />
        </View>
      )}
    </View>
  );

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        setShowScrollToTop(offsetY > 200);
      },
    }
  );

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
  };

  // Effects
  useFocusEffect(
    useCallback(() => {
      dispatch(loadOfflineOrders(client.kunnr));
      dispatch(fetchPendingActionsCount());
    }, [navigation, offlineOrders.length])
  );

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
    const { startDateFormatted, endDateFormatted } = getMonthDateRange(
      selectedYear,
      selectedMonth
    );
    if (isServerReachable) {
      dispatch(
        getAllCommande({
          user: userData?.code,
          dateDebut: startDateFormatted,
          dateFin: endDateFormatted,
        })
      );
    }
  }, [dispatch, userData?.code, selectedMonth, selectedYear]);

  useEffect(() => {
    const commandesDistinctesExtraites =
      extraireCommandesDistinctes(commandesVenteData);
    setCommandesDistinctes(commandesDistinctesExtraites);
  }, [commandesVenteData, extraireCommandesDistinctes]);

  // Gestion des actions
  const handleCommandePress = (commande) => {
    setSelectedCommande(commande);
    const postes = chargerPostesCommande(commande.cmd);
    setPostesCommande(postes);
    commandeDetailModalizeRef.current?.open();
  };

  const handleRefresh = () => {
    dispatch(loadOfflineOrders(client.kunnr));
    dispatch(fetchPendingActionsCount());
    if (isServerReachable) {
      dispatch(
        getAllCommande({
          user: userData?.code,
          dateDebut: startDateFormatted,
          dateFin: endDateFormatted,
        })
      );
    }
  };

  // Render des éléments de la liste principale
  const renderCommandeItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.modernCard, item.isOffline && styles.offlineCard]}
      onPress={() => handleCommandePress(item)}
      activeOpacity={0.7}
    >
      {/* Header avec date et numéro */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.cmdNumber}>{item.erdat}</Text>
          {!item.isOffline && <Text style={styles.dateText}>N°{item.cmd}</Text>}
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

      {/* Footer avec stats et montant */}
      <View style={styles.cardFooter}>
        <View style={styles.footerLeft}>
          <View style={styles.statItem}>
            <MaterialIcons name="inventory" size={16} color="#6B7280" />
            <Text style={styles.statText}>{item.totalArticles} articles</Text>
          </View>

          <Text style={styles.montantText}>{item.montantTtc}</Text>
        </View>

        <View style={styles.chevronContainer}>
          <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
        </View>
      </View>

      {/* Indicateur offline */}
      {item.isOffline && (
        <View style={styles.offlineIndicator}>
          <MaterialIcons name="cloud-off" size={12} color="#F59E0B" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#03A9F4" barStyle="light-content" />

      {/* Toggle entre Commandes de vente et Retours */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            !showRetours && styles.activeToggleButton,
          ]}
          onPress={() => setShowRetours(false)}
        >
          <Text
            style={[
              styles.toggleButtonText,
              !showRetours && styles.activeToggleButtonText,
            ]}
          >
            Commandes de vente
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            showRetours && styles.activeToggleButton,
          ]}
          onPress={() => {
            setShowRetours(true);
            scrollToTop();
            setShowScrollToTop(false);
          }}
        >
          <Text
            style={[
              styles.toggleButtonText,
              showRetours && styles.activeToggleButtonText,
            ]}
          >
            Commandes retours
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filtres */}
      {renderStatusFilter()}
      {isServerReachable && renderYearFilter()}
      {isServerReachable && renderMonthFilter()}

      {/* Barre de recherche */}
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

      {/* Liste des commandes */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#03A9F4" />
          <Text style={styles.loaderText}>
            Chargement des {showRetours ? "retours" : "commandes de vente"}...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#e53935" />
          <Text style={styles.errorText}>Erreur: {error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() =>
              dispatch(
                getAllCommande({
                  user: userData?.code,
                  dateDebut: startDateFormatted,
                  dateFin: endDateFormatted,
                })
              )
            }
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : commandesFiltrees.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name={showRetours ? "truck-delivery-outline" : "truck-delivery"}
            size={64}
            color="#E0E0E0"
          />
          <Text style={styles.emptyText}>
            {searchQuery.trim() !== ""
              ? `Aucune ${
                  showRetours ? "commande retour" : "commande de vente"
                } ne correspond à votre recherche`
              : `Aucune ${
                  showRetours ? "commande retour" : "commande de vente"
                }`}
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
              onRefresh={handleRefresh}
              colors={["#03A9F4", "#FFC107", "#4CAF50"]}
            />
          }
        />
      )}

      {/* Bouton scroll to top */}
      <View style={styles.fabContainerScrollButton}>
        {showScrollToTop && (
          // <TouchableOpacity
          //   style={styles.fabScrollButton}
          //   onPress={scrollToTop}
          //   activeOpacity={0.8}
          // >
          //   <MaterialIcons name="north" size={18} color="#909397" />
          // </TouchableOpacity>
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={scrollToTop}
            activeOpacity={0.8}
          >
            <MaterialIcons name="keyboard-arrow-up" size={28} color="white" />
          </TouchableOpacity>
        )}
      </View>

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
                {postesCommande.length} article(s)
              </Text>

              {/* En-têtes du tableau */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.codeColumn]}>
                  Code/Désignation
                </Text>
                <Text style={[styles.tableHeaderRightText, styles.qteColumn]}>
                  Qté
                </Text>
                {selectedCommande?.auart === "ZCMD" && (
                  <Text style={[styles.tableHeaderRightText, styles.qteColumn]}>
                    Qté Rest.
                  </Text>
                )}
                <Text style={[styles.tableHeaderRightText, styles.prixColumn]}>
                  Prix
                </Text>
              </View>

              {/* Liste scrollable des articles */}
              <ScrollView
                style={styles.scrollableArticleContainer}
                contentContainerStyle={styles.articleContainer}
              >
                {postesCommande.map((article, index) => (
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
                      {/* {article.charg && (
                        <Text style={styles.chargText}>
                          Lot: {article.charg}
                        </Text>
                      )} */}
                    </View>

                    {/* Quantité */}
                    <View style={styles.qteColumn}>
                      <Text style={styles.tableCellTextRight}>
                        {parseFloat(article.lsmeng).toFixed(2)} {article.kmein}
                      </Text>
                    </View>

                    {/* Quantité restante (seulement pour ZCMD) */}
                    {selectedCommande?.auart === "ZCMD" && (
                      <View style={styles.qteColumn}>
                        <Text style={styles.tableCellTextRight}>
                          {parseFloat(article.qte_restante).toFixed(2)}{" "}
                          {article.kmein}
                        </Text>
                      </View>
                    )}

                    {/* Prix */}
                    <View style={styles.prixColumn}>
                      <Text style={styles.tableCellTextRight}>
                        {article.prix
                          ? `${parseFloat(article.prix).toFixed(2)} DA`
                          : "-"}
                      </Text>
                      {/* {article.remise_pourcentage && (
                        <Text style={styles.remiseText}>
                          Remise:{" "}
                          {parseFloat(article.remise_pourcentage).toFixed(1)}%
                        </Text>
                      )} */}
                    </View>
                  </View>
                ))}
              </ScrollView>
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
    paddingHorizontal: wp(3.88), // 16/412 * 100
    paddingTop: wp(3.88),
    paddingBottom: wp(5.83), // 24/412 * 100
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
    padding: wp(3.88), // 16/412 * 100
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
    padding: wp(3.88),
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
    padding: wp(5.83),
    backgroundColor: "#F8FAFC",
  },

  errorText: {
    marginTop: scale(16),
    fontSize: fs(16),
    color: "#DC2626",
    textAlign: "center",
    marginBottom: wp(5.83),
    fontWeight: fontWeight.medium,
  },

  retryButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: wp(5.83),
    paddingVertical: hp(1.31), // 12/915 * 100
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
    padding: wp(5.83),
    backgroundColor: "#F8FAFC",
  },

  emptyText: {
    marginTop: wp(5.83),
    fontSize: fs(16),
    color: "#64748B",
    textAlign: "center",
    fontWeight: fontWeight.medium,
    lineHeight: fs(24),
  },

  // Styles pour les modales
  modalHeader: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: wp(4.85), // 20/412 * 100
    paddingVertical: wp(3.88),
    borderBottomWidth: scale(1),
    borderBottomColor: "#E2E8F0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale(16),
    marginTop: scale(5),
    paddingHorizontal: wp(1.46), // 6/412 * 100
  },

  modalTitle: {
    fontSize: fs(20),
    fontWeight: fontWeight.bold,
    color: "#1E293B",
    textAlign: "center",
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
    backgroundColor: "#FFFFFF",
    paddingBottom: wp(5.83),
    flex: 1,
  },

  // Styles pour le tableau des articles
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#E6E7E8",
    paddingVertical: hp(1.53), // 14/915 * 100
    paddingHorizontal: wp(2.91), // 12/412 * 100
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
    paddingVertical: wp(3.88),
    paddingHorizontal: wp(2.91),
    borderBottomWidth: scale(1),
    borderBottomColor: "#F1F5F9",
    backgroundColor: "#FFFFFF",
    minHeight: hp(6.56), // 60/915 * 100
    alignItems: "flex-end",
  },

  evenRow: {
    backgroundColor: "#F8FAFC",
  },

  codeColumn: {
    flex: 4,
    paddingRight: wp(0.49), // 2/412 * 100
  },

  qteColumn: {
    flex: 2,
    alignItems: "end",
    paddingHorizontal: wp(0.49),
  },

  prixColumn: {
    flex: 2,
    alignItems: "flex-end",
  },

  designationCellText: {
    fontSize: fs(11),
    color: "#374151",
    lineHeight: fs(16),
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
    paddingVertical: hp(1.53),
    paddingHorizontal: wp(4.85),
    borderRadius: scale(10),
    backgroundColor: "#E0F2FE",
    borderWidth: scale(1),
    borderColor: "#0891B2",
    elevation: 1,
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
    padding: wp(5.83),
    backgroundColor: "#FFFFFF",
    borderTopRightRadius: scale(8),
    borderTopLeftRadius: scale(8),
  },

  actionModalTitle: {
    fontSize: fs(20),
    fontWeight: fontWeight.bold,
    marginBottom: wp(5.83),
    textAlign: "center",
    color: "#1E293B",
  },

  actionModalizeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: hp(1.97), // 18/915 * 100
    paddingHorizontal: wp(0.97), // 4/412 * 100
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
    paddingVertical: hp(1.75), // 16/915 * 100
    alignItems: "center",
  },

  cancelButtonText: {
    fontSize: fs(16),
    color: "#475569",
    fontWeight: fontWeight.semiBold,
  },

  loadingContainer: {
    padding: wp(7.77), // 32/412 * 100
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
    paddingHorizontal: wp(3.88),
    marginBottom: scale(10),
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: scale(20),
    paddingHorizontal: wp(2.91),
    paddingVertical: hp(0.66), // 6/915 * 100
    elevation: 0.5,
  },

  searchInput: {
    flex: 1,
    marginLeft: scale(8),
    fontSize: fs(16),
  },

  fabContainer: {
    position: "absolute",
    right: wp(3.88),
    bottom: hp(1.75),
    justifyContent: "center",
    alignItems: "center",
  },

  fabContainerScrollButton: {
    position: "absolute",
    bottom: hp(0.55), // 5/915 * 100
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
    marginBottom: hp(1.64), // 15/915 * 100
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
    paddingVertical: hp(1.31),
    paddingHorizontal: wp(3.88),
  },

  activeToggleButton: {
    borderBottomWidth: scale(3),
    borderBottomColor: "#03A9F4",
  },

  toggleButtonText: {
    marginLeft: scale(8),
    fontSize: fs(14),
    color: "#757575",
  },

  activeToggleButtonText: {
    color: "#03A9F4",
    fontWeight: fontWeight.semiBold,
  },

  modalContainer: {
    padding: wp(3.88),
  },

  quantityModal: {
    padding: wp(3.88),
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
    paddingHorizontal: wp(4.37), // 18/412 * 100
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
    paddingVertical: hp(1.31),
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
    paddingVertical: hp(1.31),
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
    maxHeight: hp(32.79), // 300/915 * 100
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
    padding: wp(3.88),
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
    paddingTop: wp(3.88),
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
    padding: wp(3.88),
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
    paddingHorizontal: wp(3.88),
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
    paddingHorizontal: wp(3.88),
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
    paddingHorizontal: wp(3.88),
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
    marginHorizontal: wp(3.88),
  },

  monthFilterTitle: {
    fontSize: fs(14),
    fontWeight: fontWeight.semiBold,
    color: "#424242",
  },

  yearButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp(2.91),
    paddingVertical: hp(0.66),
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

export default CommandeVenteListeScreen;
