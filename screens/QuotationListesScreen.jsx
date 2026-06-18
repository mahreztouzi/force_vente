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
import {
  addQuotationItem,
  deleteQuotationItem,
  getQuotationsApprouve,
  updateQuotationItem,
  resetQuotationState,
} from "../redux/slices/quotationSlice";
import HeaderRightButton from "../components/HeaderRightButton";
const { width, height } = Dimensions.get("window");
import { wp, hp, fs, fontWeight, scale } from "../utils/responsive";

const QuotationListesScreen = ({ route }) => {
  const navigation = useNavigation();
  const { client, offlineList } = route.params;
  const dispatch = useDispatch();
  const { isConnected, isServerReachable, offlineOrders } = useSelector(
    (state) => state.offline
  );
  const userData = useSelector((state) => state.auth.user);

  const {
    QuotationsApprouve: quotationsApprouve,
    loadingQuotationsApprouve: loading,
    errorQuotationsApprouve: error,
    deleteLoading,
    deleteError,
    deleteSuccess,
  } = useSelector((state) => state.Quotations);
  const { articles } = useSelector((state) => state.articles);

  const [searchQuery, setSearchQuery] = useState("");
  const [quotationsDistinctes, setQuotationsDistinctes] = useState([]);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [postesQuotation, setPostesQuotation] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedNewArticle, setSelecteNewdArticle] = useState(null);
  const [quantity, setQuantity] = useState("1");
  const [discount, setDiscount] = useState();
  const [articlesSearchQuery, setArticlesSearchQuery] = useState("");
  const [statusOperation, setStatusOperation] = useState("");
  const [minQuantity, setMinQuantity] = useState(1);
  const [showOfflineOrders, setShowOfflineOrders] = useState(
    offlineList ? true : false
  );
  const [offlineOrdersLoading, setOfflineOrdersLoading] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showYearPicker, setShowYearPicker] = useState(false);

  // Références pour les modalizes
  const quotationDetailModalizeRef = useRef(null);
  const actionModalizeRef = useRef(null);
  const quantityModalizeRef = useRef(null);
  const articlesModalizeRef = useRef(null);

  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const flatListRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const statusOptions = [
    { key: "all", label: "Tous les statuts", color: "#757575" },
    { key: "initial", label: "Initial", color: "#3B82F6" },
    { key: "encours", label: "En cours", color: "#10B981" },
    { key: "termine", label: "Terminé", color: "#8B5CF6" },
  ];

  // 3. Ajouter ces fonctions utilitaires avant les useEffect
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

    // Génère les 3 dernières années et les 2 prochaines
    for (let i = currentYear - 4; i <= currentYear; i++) {
      years.push({
        year: i,
        isCurrentYear: i === currentYear,
      });
    }
    return years;
  };
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

  const { startDateFormatted, endDateFormatted } = getMonthDateRange(
    selectedYear,
    selectedMonth
  );

  const handleMonthChange = (monthIndex) => {
    console.log(`Changement vers: ${getMonthName(monthIndex)} ${selectedYear}`);
    setSelectedMonth(monthIndex);
    // Le useEffect se chargera automatiquement de l'appel API
  };
  const handleYearChange = (year) => {
    console.log(`Changement vers l'année: ${year}`);
    setSelectedYear(year);
    // Le useEffect se chargera automatiquement de l'appel API
  };

  // 4. Ajouter cette fonction pour le rendu du filtre de statut
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

  // 5. Ajouter cette fonction pour le rendu du filtre de mois
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

  // Get current month name - memoized to avoid recalculation
  const currentMonthName = getMonthName(selectedMonth);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <>
          <Text style={{ color: "white", fontSize: 16, fontWeight: "500" }}>
            Listes des offres
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
          link="all_orders"
        />
      ),
    });
  }, [navigation, client, currentMonthName, selectedYear]);

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

  const extraireQuotationsDistinctes = useCallback(
    (quotationsData) => {
      if (!quotationsData?.length) return [];

      const quotationsMap = new Map();

      // Mapping direct du statut d'entête vers le statut global
      const statutMapping = {
        initial: "Initial",
        encours: "En cours",
        termine: "Terminé",
      };

      quotationsData
        .filter((quotation) => quotation.client === client?.kunnr)
        .forEach((quotation) => {
          const key = quotation.cmd;

          if (!quotationsMap.has(key)) {
            // Utilisation directe du statut d'entête sans recalcul sur les articles
            const statutGlobal =
              statutMapping[quotation.statu_off_entete] || "Non reliée";

            quotationsMap.set(key, {
              cmd: quotation.cmd,
              commercial: quotation.commercial,
              client: quotation.client,
              clientName: client.name1,
              montantTtc: parseFloat(quotation.ttc).toLocaleString("fr-DZ", {
                style: "currency",
                currency: "DZD",
              }),
              erdat: convertirDateSAP(quotation.erdat).formatted,
              statutGlobal,
              status: quotation.statu_off_entete,
              isOffline: quotation?.isOffline || false,
              totalArticles: quotationsData.filter(
                (q) => q.cmd === quotation.cmd && !q.isDeleted
              ).length,
            });
          }
        });

      // Retour sans tri puisque les données sont déjà dans le bon ordre
      return Array.from(quotationsMap.values());
    },
    [client?.kunnr, client?.name1]
  );

  // Fonction pour charger les postes d'une commande
  const chargerPostesQuotation = useCallback(
    (numeroQuotation) => {
      if (!quotationsApprouve?.length) return [];

      return quotationsApprouve
        .filter(
          (quotation) =>
            quotation.cmd === numeroQuotation && !quotation.isDeleted
        )
        .map((quotation) => ({
          matnr: quotation.matnr,
          posnr: quotation.posnr,
          kmein: quotation.kmein,
          kwmeng: parseFloat(quotation.kwmeng), // Changé de lsmeng
          qte_accepte: parseFloat(quotation.qte_accepte), // Nouvelle propriété
          designation: quotation.maktx || `Article ${quotation.matnr}`,
          prix: quotation.prix_unitaire,
          devise: "DZD",
          statusItem: quotation.statu_off_poste, // "initial", "encours", "termine"
          isOffline: quotation.isOffline || false,
          isDeleted: quotation.isDeleted || false,
        }));
    },
    [quotationsApprouve]
  );

  // Filtrage des commandes distinctes
  const commandesFiltrees = useMemo(() => {
    let filtered = quotationsDistinctes;

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
  }, [quotationsDistinctes, searchQuery, selectedStatus]);

  // Filtrage des articles
  const filteredArticles = articles.filter(
    (article) =>
      article.designation
        .toLowerCase()
        .includes(articlesSearchQuery.toLowerCase()) ||
      article.id.toLowerCase().includes(articlesSearchQuery.toLowerCase())
  );

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
        getQuotationsApprouve({
          user: userData?.code,
          dateDebut: startDateFormatted,
          dateFin: endDateFormatted,
        })
      );
    }
  }, [dispatch, userData?.code, selectedMonth, selectedYear]);

  useEffect(() => {
    const quotationsDistinctesExtraites =
      extraireQuotationsDistinctes(quotationsApprouve);
    setQuotationsDistinctes(quotationsDistinctesExtraites);
  }, [quotationsApprouve, extraireQuotationsDistinctes]);

  useEffect(() => {
    if (isServerReachable) {
      dispatch(getArticles());
    }
  }, [dispatch, articles.length, loading, error]);

  // Gestion des actions
  const handleQuotationPress = (quotation) => {
    setSelectedQuotation(quotation);
    const postes = chargerPostesQuotation(quotation.cmd);
    setPostesQuotation(postes);
    quotationDetailModalizeRef.current?.open();
  };

  const handleArticlePress = (article) => {
    setSelectedArticle(article);
    actionModalizeRef.current?.open();
  };

  const handleAddItem = () => {
    setStatusOperation("add");
    setMinQuantity("0");
    articlesModalizeRef.current?.open();
  };

  const handleModifierArticle = (article) => {
    setStatusOperation("update");
    setSelecteNewdArticle("");
    setSelectedArticle(article);

    // const qteLivree = article.kwmeng - article.qte_accepte;

    setMinQuantity(article.qte_accepte);
    setQuantity(article.kwmeng.toString());
    setDiscount(article?.remise?.toFixed());

    actionModalizeRef.current?.close();
    quantityModalizeRef.current?.open();
  };

  const handleSupprimerArticle = (article) => {
    setStatusOperation("delete");

    if (article.qte_restante < article.lsmeng) {
      Alert.alert(
        "Action impossible",
        "Cet article est déjà livré ou en cours de livraison et ne peut pas être supprimé."
      );
      return;
    }

    Alert.alert(
      "Confirmer la suppression",
      `Voulez-vous vraiment supprimer l'article ${article.designation} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          onPress: () => {
            dispatch(
              deleteQuotationItem({
                commande: selectedQuotation.cmd,
                itemNumber: article.posnr,
              })
            );
          },
          style: "destructive",
        },
      ]
    );
  };

  // const handleUpdateOrAddItem = async () => {
  //   const qteNumerique = parseFloat(quantity);
  //   if (isNaN(qteNumerique) || qteNumerique < minQuantity) {
  //     Alert.alert(
  //       "Quantité invalide",
  //       `La quantité doit être au moins égale à la quantité déjà livrée (${minQuantity}).`
  //     );
  //     return;
  //   }

  //   if (statusOperation === "update") {
  //     await dispatch(
  //       updateQuotationItem({
  //         commande: selectedQuotation.cmd,
  //         itemNumber: selectedArticle.posnr,
  //         article:
  //           (selectedNewArticle && selectedNewArticle?.id) ||
  //           selectedArticle.matnr,
  //         qte: parseFloat(quantity),
  //       })
  //     );
  //   }

  //   if (statusOperation === "add") {
  //     await dispatch(
  //       addQuotationItem({
  //         commande: selectedQuotation.cmd,
  //         article:
  //           (selectedNewArticle && selectedNewArticle?.id) ||
  //           selectedArticle.matnr,
  //         qte: parseFloat(quantity),
  //       })
  //     );
  //   }

  //   quantityModalizeRef.current?.close();
  //   setSelecteNewdArticle(null);
  // };

  const handleUpdateOrAddItem = async () => {
    const qteNumerique = parseFloat(quantity);
    if (isNaN(qteNumerique) || qteNumerique < minQuantity) {
      Alert.alert(
        "Quantité invalide",
        `La quantité doit être au moins égale à la quantité déjà livrée (${minQuantity}).`
      );
      return;
    }

    try {
      let result;

      if (statusOperation === "update") {
        result = await dispatch(
          updateQuotationItem({
            commande: selectedQuotation.cmd,
            itemNumber: selectedArticle.posnr,
            article:
              (selectedNewArticle && selectedNewArticle?.id) ||
              selectedArticle.matnr,
            qte: parseFloat(quantity),
          })
        );
      }

      if (statusOperation === "add") {
        result = await dispatch(
          addQuotationItem({
            commande: selectedQuotation.cmd,
            article:
              (selectedNewArticle && selectedNewArticle?.id) ||
              selectedArticle.matnr,
            qte: parseFloat(quantity),
          })
        );
      }

      // ✅ Vérifier si l'action a réussi
      if (result.type.endsWith("/fulfilled")) {
        quantityModalizeRef.current?.close();
        setSelecteNewdArticle(null);
        // Le useEffect se chargera d'afficher le message de succès
      } else {
        // Erreur
        Alert.alert("Erreur", "L'opération a échoué. Veuillez réessayer.");
      }
    } catch (error) {
      Alert.alert("Erreur", "Une erreur s'est produite.");
    }
  };
  const handleArticleSelect = (article) => {
    setSelecteNewdArticle(article);
    articlesModalizeRef.current?.close();
    quantityModalizeRef.current?.open();
  };

  const handleChoisirAutreArticle = () => {
    if (
      selectedArticle &&
      selectedArticle.qte_restante < selectedArticle.lsmeng
    ) {
      Alert.alert(
        "Action impossible",
        "Vous ne pouvez pas changer cet article car il est déjà en cours de livraison."
      );
      return;
    }

    quantityModalizeRef.current?.close();
    setTimeout(() => {
      articlesModalizeRef.current?.open();
    }, 300);
  };

  const handleRefresh = () => {
    dispatch(loadOfflineOrders(client.kunnr));
    dispatch(fetchPendingActionsCount());
    if (isServerReachable) {
      dispatch(
        getQuotationsApprouve({
          user: userData?.code,
          dateDebut: startDateFormatted,
          dateFin: endDateFormatted,
        })
      );
    }
  };

  // Effects pour la gestion des succès/erreurs
  useEffect(() => {
    dispatch(resetQuotationState());
  }, [dispatch]);

  useEffect(() => {
    if (deleteSuccess) {
      let message = "";
      if (statusOperation === "add")
        message = "L'article a été ajouté avec succès.";
      if (statusOperation === "update")
        message = "L'article a été modifié avec succès.";
      if (statusOperation === "delete")
        message = "L'article a été supprimé avec succès.";

      Alert.alert("Succès", message);

      dispatch(
        getQuotationsApprouve({
          user: userData?.code,
          dateDebut: startDateFormatted,
          dateFin: endDateFormatted,
        })
      );

      actionModalizeRef.current?.close();
      quotationDetailModalizeRef.current?.close();
      dispatch(resetQuotationState());
    }

    if (deleteError) {
      Alert.alert("Erreur", deleteError, [{ text: "OK" }]);
      dispatch(resetQuotationState());
    }
    setStatusOperation("");
  }, [deleteSuccess, deleteError, dispatch, userData, client]);

  // Render des éléments de la liste principale
  const renderQuotationItem = ({ item }) => (
    // Composant Card moderne optimisé
    <TouchableOpacity
      style={[styles.modernCard, item.isOffline && styles.offlineCard]}
      onPress={() => handleQuotationPress(item)}
      activeOpacity={0.7}
    >
      {/* Header avec date et numéro */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.cmdNumber}>{item.erdat}</Text>
          {!item.isOffline && <Text style={styles.dateText}>N°{item.cmd}</Text>}
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

      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            !showOfflineOrders && styles.activeToggleButton,
          ]}
          onPress={() => setShowOfflineOrders(false)}
        >
          <Text
            style={[
              styles.toggleButtonText,
              !showOfflineOrders && styles.activeToggleButtonText,
            ]}
          >
            Mes offres
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            showOfflineOrders && styles.activeToggleButton,
          ]}
          onPress={() => {
            setShowOfflineOrders(true);
            scrollToTop();
            setShowScrollToTop(false);
          }}
        >
          <Text
            style={[
              styles.toggleButtonText,
              showOfflineOrders && styles.activeToggleButtonText,
            ]}
          >
            Offres en attente ({offlineOrders?.length})
          </Text>
        </TouchableOpacity>
      </View>
      {!showOfflineOrders && isServerReachable && (
        <>
          {renderStatusFilter()}
          {renderYearFilter()}
          {renderMonthFilter()}
        </>
      )}

      {!showOfflineOrders && (
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

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#03A9F4" />
          <Text style={styles.loaderText}>Chargement des offres...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#e53935" />
          <Text style={styles.errorText}>Erreur: {error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() =>
              dispatch(
                getQuotationsApprouve({
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
      ) : showOfflineOrders ? (
        <OfflineOrdersScreen route={{ params: { client } }} />
      ) : commandesFiltrees.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="truck-delivery"
            size={64}
            color="#E0E0E0"
          />
          <Text style={styles.emptyText}>
            {searchQuery.trim() !== ""
              ? "Aucune offre ne correspond à votre recherche"
              : "Aucune offre"}
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={commandesFiltrees}
          renderItem={renderQuotationItem}
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
        {!showOfflineOrders && showScrollToTop && (
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
        ref={quotationDetailModalizeRef}
        adjustToContentHeight
        modalStyle={styles.modal}
        scrollViewProps={{ scrollEnabled: false }} // Désactive le scroll global
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
        {selectedQuotation && (
          <View style={styles.modalContent}>
            {/* <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Détails de l'offre {selectedQuotation?.cmd}
              </Text>
              <TouchableOpacity
                onPress={() => quotationDetailModalizeRef.current?.close()}
              >
                <MaterialIcons name="close" size={24} color="#757575" />
              </TouchableOpacity>
            </View> */}

            {/* Informations commande - partie fixe */}
            <View style={styles.commandeDetails}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={styles.commandeClient}>
                  {selectedQuotation?.clientName}
                </Text>
                <TouchableOpacity
                  onPress={() => quotationDetailModalizeRef.current?.close()}
                >
                  <MaterialIcons name="close" size={20} color="#757575" />
                </TouchableOpacity>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={styles.commandeItems}>
                  {postesQuotation.length} article(s)
                </Text>
                <Text style={styles.commandeDate}>
                  {selectedQuotation?.erdat}
                </Text>
              </View>
            </View>

            {/* Tableau des articles - partie scrollable */}
            <View
              style={[
                styles.commandeDetails,
                {
                  // borderTopWidth: 0.5,
                  // borderColor: "rgba(104, 104, 107, 0.32)",
                  backgroundColor: "rgba(233, 220, 188, 0.1)",
                  marginTop: 10,
                  flex: 1, // Prend tout l'espace disponible
                },
              ]}
            >
              <Text style={styles.detailsTitle}>Articles</Text>

              {/* En-têtes du tableau (fixe) */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.codeColumn]}>
                  Code/Désignation
                </Text>
                {/* <Text
                  style={[styles.tableHeaderText, styles.designationColumn]}
                >
                  Désignation
                </Text> */}
                <Text style={[styles.tableHeaderRightText, styles.qteColumn]}>
                  Qté
                </Text>
                <Text style={[styles.tableHeaderRightText, styles.qteColumn]}>
                  Qté App.
                </Text>
                <Text style={[styles.tableHeaderRightText, styles.prixColumn]}>
                  Prix
                </Text>
              </View>

              {/* Liste scrollable des articles */}
              <ScrollView
                style={styles.scrollableArticleContainer}
                contentContainerStyle={styles.articleContainer}
              >
                {postesQuotation.map((article, index) => (
                  <TouchableOpacity
                    key={`${article.matnr}-${index}`}
                    onPress={() => handleArticlePress(article)}
                    style={[styles.tableRow, index % 2 === 0 && styles.evenRow]}
                    disabled={
                      !isServerReachable ||
                      selectedQuotation.status !== "initial"
                    }
                  >
                    {/* Code */}
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
                    </View>

                    {/* Désignation */}
                    {/* <View style={styles.designationColumn}>
                      <Text
                        style={styles.designationCellText}
                        numberOfLines={10}
                      >
                        {article.designation}
                      </Text>
                    </View> */}

                    {/* Quantité */}
                    <View style={styles.qteColumn}>
                      <Text style={styles.tableCellTextRight}>
                        {parseFloat(article.kwmeng).toFixed(2)} {article.kmein}
                      </Text>
                    </View>
                    <View style={styles.qteColumn}>
                      <Text style={styles.tableCellTextRight}>
                        {parseFloat(article.qte_accepte).toFixed(2)}{" "}
                        {article.kmein}
                      </Text>
                    </View>

                    {/* Prix */}
                    <View style={styles.prixColumn}>
                      <Text style={styles.tableCellTextRight}>
                        {article.prix
                          ? `${parseFloat(article.prix).toFixed(2)} DA`
                          : "-"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Boutons d'action - partie fixe */}
            {/* {isServerReachable && (
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.primaryButton]}
                  onPress={handleAddItem}
                >
                  <MaterialIcons name="add" size={18} color="#006475" />
                  <Text style={styles.primaryButtonText}>
                    Ajouter un article
                  </Text>
                </TouchableOpacity>
              </View>
            )} */}
            {/* Boutons d'action - partie fixe */}
            {isServerReachable && selectedQuotation.status === "initial" && (
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.primaryButton]}
                  onPress={handleAddItem}
                >
                  <MaterialIcons name="add" size={18} color="#006475" />
                  <Text style={styles.primaryButtonText}>
                    Ajouter un article
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ✅ Message si statut différent de initial */}
            {isServerReachable && selectedQuotation.status !== "initial" && (
              <View style={styles.infoContainer}>
                <MaterialIcons name="info-outline" size={20} color="#FF9800" />
                <Text style={styles.infoText}>
                  Cette offre ne peut plus être modifiée (statut:{" "}
                  {selectedQuotation.statutGlobal})
                </Text>
              </View>
            )}
          </View>
        )}
      </Modalize>

      {/* Modalize pour les actions sur un article */}
      <Modalize
        ref={actionModalizeRef}
        adjustToContentHeight
        closeOnOverlayTap
        withHandle
      >
        <View style={styles.actionModalContainer}>
          {deleteLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#03A9F4" />
              <Text style={styles.loadingText}>Suppression en cours...</Text>
            </View>
          ) : (
            <>
              <Text style={styles.actionModalTitle}>Actions</Text>

              <TouchableOpacity
                style={styles.actionModalizeButton}
                onPress={() => {
                  if (selectedArticle) {
                    handleModifierArticle(selectedArticle);
                  }
                }}
              >
                <MaterialIcons name="edit" size={24} color="#2196F3" />
                <Text style={styles.actionModalizeButtonText}>
                  Modifier l'article
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionModalizeButton, styles.deleteButton]}
                onPress={() => {
                  if (selectedArticle) {
                    handleSupprimerArticle(selectedArticle);
                  }
                }}
                disabled={selectedArticle && selectedArticle.qte_accepte > 0}
              >
                <MaterialIcons
                  name="delete"
                  size={24}
                  color={
                    selectedArticle && selectedArticle.qte_accepte > 0
                      ? "#BDBDBD"
                      : "#F44336"
                  }
                />
                <Text
                  style={[
                    styles.actionModalizeButtonText,
                    styles.deleteButtonText,
                    selectedArticle && selectedArticle.qte_accepte > 0
                      ? styles.disabledButtonText
                      : {},
                  ]}
                >
                  Supprimer l'article
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => actionModalizeRef.current?.close()}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modalize>

      {/* Modalize pour la quantité */}
      <Modalize
        ref={quantityModalizeRef}
        adjustToContentHeight
        modalStyle={styles.modalContainer}
      >
        <View style={styles.quantityModal}>
          <Text style={styles.quantityTitle}>
            {statusOperation === "add" ? "Nouveau article" : "Modification"}
          </Text>
          <Text style={styles.quantityArticle}>
            {selectedNewArticle?.designation || selectedArticle?.designation}
          </Text>

          {minQuantity > 0 && (
            <View style={styles.minQuantityWarning}>
              <MaterialIcons name="warning" size={18} color="#FF9800" />
              <Text style={styles.minQuantityText}>
                Quantité déjà validée: {minQuantity} {selectedArticle?.kmein}
              </Text>
            </View>
          )}

          <View style={styles.quantityRow}>
            <Text style={styles.quantityLabel}>Quantité:</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={[
                  styles.quantityButton,
                  parseFloat(quantity) <= minQuantity && styles.disabledButton,
                ]}
                disabled={parseFloat(quantity) <= minQuantity}
                onPress={() => {
                  const currentQty = parseFloat(quantity);
                  if (!isNaN(currentQty) && currentQty > minQuantity) {
                    setQuantity((currentQty - 1).toString());
                  }
                }}
              >
                <MaterialIcons
                  name="remove"
                  size={20}
                  color={
                    parseFloat(quantity) <= minQuantity ? "#BDBDBD" : "white"
                  }
                />
              </TouchableOpacity>

              <TextInput
                style={styles.quantityModalInput}
                value={quantity}
                onChangeText={(value) => {
                  const numValue = parseFloat(value);
                  if (value === "" || isNaN(numValue)) {
                    setQuantity(value);
                  } else if (numValue >= minQuantity) {
                    setQuantity(value);
                  } else {
                    setQuantity(minQuantity.toString());
                  }
                }}
                keyboardType="numeric"
              />

              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => {
                  const currentQty = parseFloat(quantity);
                  if (!isNaN(currentQty)) {
                    setQuantity((currentQty + 1).toString());
                  } else {
                    setQuantity(minQuantity > 0 ? minQuantity.toString() : "1");
                  }
                }}
              >
                <MaterialIcons name="add" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.pricePreview}>
            <View style={styles.pricePreviewRow}>
              <Text style={styles.pricePreviewRowTitle}>Prix unitaire :</Text>
              <Text style={styles.pricePreviewRowValue}>
                {(selectedNewArticle &&
                  parseFloat(selectedNewArticle?.prix).toLocaleString("fr-DZ", {
                    style: "currency",
                    currency: "DZD",
                  })) ||
                  parseFloat(selectedArticle?.prix).toLocaleString("fr-DZ", {
                    style: "currency",
                    currency: "DZD",
                  })}
              </Text>
            </View>

            <View style={[styles.pricePreviewRow, styles.totalPreviewRow]}>
              <Text style={styles.totalPreviewLabel}>Total :</Text>
              <Text style={styles.totalPreviewValue}>
                {(selectedNewArticle &&
                  parseFloat(
                    selectedNewArticle?.prix * parseFloat(quantity)
                  ).toLocaleString("fr-DZ", {
                    style: "currency",
                    currency: "DZD",
                  })) ||
                  parseFloat(
                    selectedArticle?.prix * parseFloat(quantity)
                  ).toLocaleString("fr-DZ", {
                    style: "currency",
                    currency: "DZD",
                  })}
              </Text>
            </View>
          </View>

          {!minQuantity > 0 && (
            <TouchableOpacity
              style={styles.chooseAnotherButton}
              onPress={handleChoisirAutreArticle}
            >
              <MaterialIcons name="swap-horiz" size={20} color="#03A9F4" />
              <Text style={styles.chooseAnotherButtonText}>
                Choisir un autre article
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleUpdateOrAddItem}
            disabled={deleteLoading}
          >
            {deleteLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.confirmButtonText}>Confirmer</Text>
            )}
          </TouchableOpacity>
        </View>
      </Modalize>

      {/* Modalize pour les articles */}
      <ArticlesModalize
        reference={articlesModalizeRef}
        searchQuery={articlesSearchQuery}
        setSearchQuery={setArticlesSearchQuery}
        filteredArticles={filteredArticles}
        handleArticleSelect={handleArticleSelect}
        scrollY={scrollY}
      />
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
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
    paddingBottom: hp(3),
  },

  commandeContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    marginBottom: hp(1.5),
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "#E2E8F0",
  },

  commandeInfo: {
    flex: 1,
    padding: wp(4),
  },

  commandeNumber: {
    fontSize: fs(18),
    fontWeight: fontWeight.bold,
    color: "#1E293B",
    marginBottom: hp(0.5),
  },

  commandeDate: {
    fontSize: fs(13),
    color: "#64748B",
    marginBottom: hp(1),
    fontWeight: fontWeight.medium,
  },

  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: hp(1),
  },

  statusIndicator: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    marginRight: wp(2),
  },

  statusText: {
    fontSize: fs(13),
    fontWeight: fontWeight.semiBold,
    color: "#475569",
  },

  commandeStats: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    padding: wp(4),
  },

  statsText: {
    fontSize: fs(12),
    color: "#64748B",
    marginBottom: hp(1.5),
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
    marginTop: hp(2),
    fontSize: fs(16),
    color: "#64748B",
    fontWeight: fontWeight.medium,
  },

  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: wp(6),
    backgroundColor: "#F8FAFC",
  },

  errorText: {
    marginTop: hp(2),
    fontSize: fs(16),
    color: "#DC2626",
    textAlign: "center",
    marginBottom: hp(3),
    fontWeight: fontWeight.medium,
  },

  retryButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: wp(6),
    paddingVertical: hp(1.5),
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
    padding: wp(6),
    backgroundColor: "#F8FAFC",
  },

  emptyText: {
    marginTop: hp(3),
    fontSize: fs(16),
    color: "#64748B",
    textAlign: "center",
    fontWeight: fontWeight.medium,
    lineHeight: hp(3),
  },

  // Styles pour les modales
  modalHeader: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },

  modalTitle: {
    fontSize: fs(20),
    fontWeight: fontWeight.bold,
    color: "#1E293B",
    textAlign: "center",
  },

  modalSubtitle: {
    marginTop: hp(1),
  },

  modalSubtitleText: {
    fontSize: fs(14),
    color: "#64748B",
    textAlign: "center",
    fontWeight: fontWeight.medium,
  },

  modalContent: {
    backgroundColor: "#FFFFFF",
    paddingBottom: hp(3),
  },

  // Styles pour le tableau des articles
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#E6E7E8",
    paddingVertical: hp(1.75),
    paddingHorizontal: wp(3),
    borderTopLeftRadius: scale(12),
    borderTopRightRadius: scale(12),
    borderColor: "#eee",
    borderWidth: 1,
  },

  tableHeaderText: {
    fontSize: fs(12),
    fontWeight: fontWeight.bold,
    color: "#334155",
    textAlign: "start",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  tableHeaderRightText: {
    fontSize: fs(12),
    fontWeight: fontWeight.bold,
    color: "#334155",
    textAlign: "right",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  tableRow: {
    flexDirection: "row",
    paddingVertical: hp(2),
    paddingHorizontal: wp(3),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    backgroundColor: "#FFFFFF",
    minHeight: hp(7.5),
    alignItems: "flex-end",
  },

  evenRow: {
    backgroundColor: "#F8FAFC",
  },

  codeColumn: {
    flex: 4,
    paddingRight: wp(0.5),
  },

  qteColumn: {
    flex: 2,
    alignItems: "end",
    paddingHorizontal: wp(0.5),
  },

  prixColumn: {
    flex: 2,
    alignItems: "flex-end",
  },

  designationCellText: {
    fontSize: fs(11),
    color: "#374151",
    lineHeight: hp(2),
    fontWeight: fontWeight.medium,
  },

  tableCellTextRight: {
    fontSize: fs(11),
    color: "#374151",
    textAlign: "right",
    fontWeight: fontWeight.medium,
  },

  // Styles pour les actions
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: hp(1.75),
    paddingHorizontal: wp(5),
    borderRadius: scale(10),
    backgroundColor: "#E0F2FE",
    borderWidth: 1,
    borderColor: "#0891B2",
    elevation: 1,
  },

  actionButtonText: {
    color: "#0891B2",
    fontWeight: fontWeight.bold,
    marginLeft: wp(2),
    fontSize: fs(14),
    letterSpacing: 0.5,
  },

  // Styles pour la modale d'actions
  actionModalContainer: {
    padding: wp(6),
    backgroundColor: "#FFFFFF",
    borderTopRightRadius: scale(8),
    borderTopLeftRadius: scale(8),
  },

  actionModalTitle: {
    fontSize: fs(20),
    fontWeight: fontWeight.bold,
    marginBottom: hp(3),
    textAlign: "center",
    color: "#1E293B",
  },

  actionModalizeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: hp(2.25),
    paddingHorizontal: wp(1),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  actionModalizeButtonText: {
    fontSize: fs(16),
    marginLeft: wp(4),
    color: "#374151",
    fontWeight: fontWeight.medium,
  },

  deleteButton: {
    borderBottomWidth: 0,
    marginBottom: hp(2),
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
    paddingVertical: hp(2),
    alignItems: "center",
  },

  cancelButtonText: {
    fontSize: fs(16),
    color: "#475569",
    fontWeight: fontWeight.semiBold,
  },

  loadingContainer: {
    padding: wp(8),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  loadingText: {
    marginTop: hp(2),
    fontSize: fs(16),
    color: "#3B82F6",
    textAlign: "center",
    fontWeight: fontWeight.medium,
  },

  // Styles existants conservés (inchangés)
  searchContainer: {
    marginTop: hp(1.25),
    paddingHorizontal: wp(4),
    marginBottom: hp(1.25),
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: scale(20),
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.75),
    elevation: 0.5,
  },

  searchInput: {
    flex: 1,
    marginLeft: wp(2),
    fontSize: fs(16),
  },

  fabContainer: {
    position: "absolute",
    right: wp(4),
    bottom: hp(2),
    justifyContent: "center",
    alignItems: "center",
  },

  fabContainerScrollButton: {
    position: "absolute",
    bottom: hp(0.625),
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
    marginBottom: hp(1.875),
    width: scale(36),
    height: scale(36),
    borderRadius: scale(28),
    backgroundColor: "#F5F6F8",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    borderWidth: 0.2,
    borderColor: "#B5B8BD",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
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
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
  },

  activeToggleButton: {
    borderBottomWidth: 3,
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
    padding: wp(4),
  },

  quantityModal: {
    padding: wp(4),
  },

  quantityTitle: {
    fontSize: fs(18),
    fontWeight: fontWeight.bold,
    marginBottom: hp(1),
    margin: "auto",
  },

  quantityArticle: {
    fontSize: fs(16),
    color: "#03A9F4",
    marginBottom: hp(2),
    margin: "auto",
  },

  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: hp(2),
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
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
    marginHorizontal: wp(2),
    width: scale(60),
    textAlign: "center",
    fontSize: fs(16),
  },

  pricePreview: {
    marginBottom: hp(1.5),
    paddingHorizontal: wp(4.5),
    paddingVertical: hp(1),
    backgroundColor: "#F9F9F9",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: scale(10),
  },

  pricePreviewRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: hp(0.375),
  },

  pricePreviewRowTitle: {
    fontSize: fs(14),
  },

  pricePreviewRowValue: {
    fontWeight: fontWeight.bold,
    letterSpacing: 2,
  },

  totalPreviewLabel: {
    fontWeight: fontWeight.bold,
  },

  totalPreviewValue: {
    fontWeight: fontWeight.bold,
    letterSpacing: 2,
    color: "#006475",
  },

  totalPreviewRow: {
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    marginTop: hp(0.5),
    paddingTop: hp(0.5),
  },

  confirmButton: {
    backgroundColor: "#03A9F4",
    borderRadius: scale(8),
    paddingVertical: hp(1.5),
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
    padding: wp(2),
    borderRadius: scale(4),
    marginBottom: hp(2),
  },

  minQuantityText: {
    marginLeft: wp(2),
    color: "#FF9800",
    fontSize: fs(14),
  },

  chooseAnotherButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: hp(1.5),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: "#03A9F4",
    borderRadius: scale(8),
  },

  chooseAnotherButtonText: {
    color: "#03A9F4",
    marginLeft: wp(2),
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
    maxHeight: hp(37.5),
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomRightRadius: scale(12),
    borderBottomLeftRadius: scale(12),
    borderColor: "#eee",
  },

  articleContainer: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomRightRadius: scale(8),
    borderBottomLeftRadius: scale(8),
    borderColor: "#eee",
  },

  commandeDetails: {
    padding: wp(4),
    backgroundColor: "#FAFAFA",
    borderRadius: scale(8),
    marginTop: hp(1.5),
  },

  detailsTitle: {
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
    marginBottom: hp(1.5),
    color: "#424242",
  },

  commandeClient: {
    fontSize: fs(16),
    fontWeight: fontWeight.semiBold,
    color: "#212529",
    marginBottom: hp(1),
  },

  commandeItems: {
    fontSize: fs(14),
    color: "#6c757d",
  },

  actionsContainer: {
    paddingTop: hp(2),
    paddingHorizontal: wp(2),
    marginHorizontal: wp(2),
  },

  primaryButtonText: {
    color: "#006475",
    fontWeight: fontWeight.semiBold,
    marginLeft: wp(2),
    fontSize: fs(14),
  },

  modernCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(16),
    padding: wp(4),
    marginVertical: hp(0.375),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 0.5,
  },

  offlineCard: {
    backgroundColor: "#FFFBEB",
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
    borderColor: "#FED7AA",
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: hp(1.5),
  },

  headerLeft: {
    flex: 1,
  },

  dateText: {
    fontSize: fs(14),
    fontWeight: fontWeight.semiBold,
    color: "#1F2937",
    marginBottom: hp(0.25),
  },

  cmdNumber: {
    fontSize: fs(12),
    color: "#6B7280",
    fontWeight: fontWeight.medium,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
    borderRadius: scale(12),
    marginLeft: wp(2),
  },

  statusDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    marginRight: wp(1),
  },

  statusBadgeText: {
    fontSize: fs(11),
    fontWeight: fontWeight.semiBold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: hp(0.5),
  },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: hp(1),
  },

  footerLeft: {
    flex: 1,
  },

  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp(0.5),
  },

  statText: {
    fontSize: fs(12),
    color: "#6B7280",
    marginLeft: wp(1),
    fontWeight: fontWeight.medium,
  },

  montantText: {
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
    color: "#006475",
    marginTop: hp(0.25),
  },

  chevronContainer: {
    padding: wp(1),
  },

  offlineIndicator: {
    position: "absolute",
    top: hp(1),
    right: wp(2),
    backgroundColor: "#FEF3C7",
    borderRadius: scale(10),
    padding: wp(1),
  },

  statusFilterContainer: {
    paddingVertical: hp(1),
    backgroundColor: "#fff",
  },

  statusFilterList: {
    paddingHorizontal: wp(1),
  },

  statusFilterButton: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    marginHorizontal: wp(1),
    borderRadius: scale(20),
    borderWidth: 0.3,
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
    paddingVertical: hp(1),
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },

  monthFilterList: {
    paddingHorizontal: wp(1),
  },

  monthFilterButton: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    marginHorizontal: wp(1),
    borderRadius: scale(20),
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "transparent",
  },

  activeMonthFilter: {
    backgroundColor: "#03A9F4",
  },

  currentMonthBorder: {
    borderColor: "#03A9F4",
    borderWidth: 2,
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
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    marginHorizontal: wp(1),
    borderRadius: scale(20),
    borderWidth: 1,
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
    borderWidth: 2,
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
    marginBottom: hp(1),
    marginHorizontal: wp(4),
  },

  monthFilterTitle: {
    fontSize: fs(14),
    fontWeight: fontWeight.semiBold,
    color: "#424242",
  },

  yearButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.75),
    borderRadius: scale(16),
    backgroundColor: "#F5F5F5",
  },

  yearButtonText: {
    fontSize: fs(14),
    fontWeight: fontWeight.semiBold,
    color: "#03A9F4",
    marginRight: wp(1),
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

  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0", // Orange très clair
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800",
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    shadowColor: "#FF9800",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: "#E65100", // Orange foncé pour meilleure lisibilité
    fontWeight: "500",
    lineHeight: 20,
  },
});

export default QuotationListesScreen;
