import React, { useLayoutEffect, useState, useEffect, useRef } from "react";
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
  RefreshControl,
} from "react-native";
import {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
  Feather,
  AntDesign,
} from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import {
  getCommandesApprouves,
  resetOrderState,
  deleteOrderItem,
  updateOrderItem,
  addOrderItem,
} from "../redux/slices/orderSlice";
import { BackHandler } from "react-native";
import { Modalize } from "react-native-modalize";
import ArticlesModalize from "../components/ArticlesModalize"; // Importez le composant ArticlesModalize
import { getArticles } from "../redux/slices/articleSlice";
import { getOfflineActionQueue } from "../utils/offlineUtils";

import { useMemo, useCallback } from "react";
import OfflineOrdersScreen from "./OfflineOrdersScreen";
import {
  fetchPendingActionsCount,
  loadOfflineOrders,
} from "../redux/slices/offlineSlice";
const { width, height } = Dimensions.get("window");

const CommandeListesScreen = ({ route }) => {
  const navigation = useNavigation();
  const { client } = route.params;
  const dispatch = useDispatch();
  const { isConnected, isServerReachable, offlineOrders } = useSelector(
    (state) => state.offline,
  );
  const userData = useSelector((state) => state.auth.user);

  const {
    ordersApprouve,
    loadingOrdersApprouve: loading,
    errorOrdersApprouve: error,
    deleteLoading,
    deleteError,
    deleteSuccess,
  } = useSelector((state) => state.orders);
  const { articles } = useSelector((state) => state.articles);

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCommandes, setFilteredCommandes] = useState([]);
  const [expandedCommande, setExpandedCommande] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedNewArticle, setSelecteNewdArticle] = useState(null);
  const [quantity, setQuantity] = useState("1");
  const [discount, setDiscount] = useState();
  const [currentCommande, setCurrentCommande] = useState(null);
  const [articlesSearchQuery, setArticlesSearchQuery] = useState("");
  const [statusOperation, setStatusOperation] = useState("");
  // const [filteredArticles, setFilteredArticles] = useState([]);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [minQuantity, setMinQuantity] = useState(1); // Pour stocker la quantité minimale (déjà livrée)

  // offline orders
  // const [offlineOrders, setOfflineOrders] = useState([]);
  const [showOfflineOrders, setShowOfflineOrders] = useState(false);
  const [offlineOrdersLoading, setOfflineOrdersLoading] = useState(false);

  // Référence pour les modalizes
  const actionModalizeRef = useRef(null);
  const quantityModalizeRef = useRef(null);
  const articlesModalizeRef = useRef(null);

  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const flatListRef = useRef(null);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        setShowScrollToTop(offsetY > 200); // Affiche le bouton après 200px de scroll
      },
    },
  );
  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
  };
  useFocusEffect(
    useCallback(() => {
      dispatch(loadOfflineOrders(client.kunnr));
      dispatch(fetchPendingActionsCount()); // Recharger la liste
    }, [navigation, offlineOrders.length]),
  );
  useEffect(() => {
    const handleBackPress = () => {
      // Comportement normal - retourner à l'écran précédent
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
    dispatch(
      getCommandesApprouves({
        user: userData?.code,
        // client: client?.kunnr,
      }),
    );
  }, [dispatch, client]);

  useEffect(() => {
    // Vérifie si les articles sont déjà chargés ou s'il y a eu une erreur
    if (articles?.length === 0 && !loading && !error) {
      dispatch(getArticles());
    }
  }, [dispatch, articles.length, loading, error]);

  const filteredArticles = articles.filter(
    (article) =>
      article.designation
        .toLowerCase()
        .includes(articlesSearchQuery.toLowerCase()) ||
      article.id.toLowerCase().includes(articlesSearchQuery.toLowerCase()),
  );

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
  // useEffect(() => {
  //   // Filtrer les commandes en fonction de la recherche
  //   if (ordersApprouve?.length > 0) {
  //     const grouped = groupCommandesByCommercialAndClient(
  //       ordersApprouve
  //         .filter((order) => order.client === client?.kunnr)
  //         .sort((a, b) => {
  //           const dateA = convertirDateSAP(a.erdat).date;
  //           const dateB = convertirDateSAP(b.erdat).date;
  //           return dateB - dateA; // Pour trier du plus récent au plus ancien
  //         })
  //     );

  //     if (searchQuery.trim() === "") {
  //       setFilteredCommandes(grouped);
  //     } else {
  //       const filtered = grouped.filter(
  //         (item) =>
  //           item.cmd.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //           item.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //           (item.clientName &&
  //             item.clientName.toLowerCase().includes(searchQuery.toLowerCase()))
  //       );
  //       setFilteredCommandes(filtered);
  //     }
  //   }
  // }, [ordersApprouve, searchQuery]);

  // Fonction pour convertir une date SAP au format jj mmmm aaaa
  // const convertirDateSAP = (dateSAP) => {
  //   // Extraire le timestamp (millisecondes) de la chaîne SAP
  //   const timestampMatch = dateSAP.match(/\/Date\((\d+)\)\//);

  //   if (!timestampMatch || timestampMatch.length < 2) {
  //     return "Format de date invalide";
  //   }

  //   const timestamp = parseInt(timestampMatch[1]);
  //   const date = new Date(timestamp);

  //   // Options pour le format de date
  //   const options = {
  //     day: "2-digit",
  //     month: "long",
  //     year: "numeric",
  //   };

  //   // Formater la date en français
  //   return date.toLocaleDateString("fr-FR", options);
  // };

  // const groupCommandesByCommercialAndClient = (commandesList) => {
  //   // Transformer la liste de commandes en la regroupant par cmd, commercial, client
  //   const groupedObj = {};

  //   commandesList.forEach((item) => {
  //     const key = `${item.cmd}-${item.commercial}-${item.client}`;
  //     let status = "Non livré";
  //     if (
  //       parseFloat(item.qte_restante) < parseFloat(item.lsmeng) ||
  //       parseFloat(item.qte_restante) === 0
  //     ) {
  //       status = "Partiellement livré";
  //     }

  //     if (!groupedObj[key]) {
  //       groupedObj[key] = {
  //         cmd: item.cmd,
  //         commercial: item.commercial,
  //         client: item.client,
  //         clientName: client.name1, // Ajoutez le nom du client si disponible
  //         montantTtc: parseFloat(item.ttc).toLocaleString("fr-DZ", {
  //           style: "currency",
  //           currency: "DZD",
  //         }),
  //         erdat: convertirDateSAP(item.erdat).formatted,
  //         articles: [],
  //         totalArticles: 0,
  //         totalQuantity: 0,
  //         statusGlobal: status,
  //         isOffline: item?.isOffline,
  //       };
  //     }

  //     // Ajouter l'article à la commande
  //     groupedObj[key].articles.push({
  //       matnr: item.matnr,
  //       posnr: item.posnr,
  //       charg: item.charg,
  //       kmein: item.kmein,
  //       lsmeng: parseFloat(item.lsmeng),
  //       qte_restante: parseFloat(item.qte_restante),
  //       designation: item.maktx || `Article ${item.matnr}`,
  //       prix: item.prix_unitaire,
  //       remise: parseFloat(item.remise_pourcentage),
  //       devise: "DZD",
  //       statusItem:
  //         item.lsmeng === item.qte_restante
  //           ? "Non Livré"
  //           : "Partiellement livré",
  //     });

  //     // Mettre à jour les totaux
  //     groupedObj[key].totalArticles += 1;
  //     groupedObj[key].totalQuantity += parseFloat(item.lsmeng);
  //   });

  //   // Convertir l'objet en tableau
  //   return Object.values(groupedObj);
  // };

  // const groupCommandesByCommercialAndClient = (commandesList) => {
  //   const groupedObj = {};

  //   commandesList.forEach((item) => {
  //     const key = `${item.cmd}-${item.commercial}-${item.client}`;
  //     let status = "Non livré";
  //     if (
  //       parseFloat(item.qte_restante) < parseFloat(item.lsmeng) ||
  //       parseFloat(item.qte_restante) === 0
  //     ) {
  //       status = "Partiellement livré";
  //     }

  //     if (!groupedObj[key]) {
  //       groupedObj[key] = {
  //         cmd: item.cmd,
  //         commercial: item.commercial,
  //         client: item.client,
  //         clientName: client.name1,
  //         montantTtc: parseFloat(item.ttc).toLocaleString("fr-DZ", {
  //           style: "currency",
  //           currency: "DZD",
  //         }),
  //         erdat: convertirDateSAP(item.erdat).formatted,
  //         articles: [],
  //         totalArticles: 0,
  //         totalQuantity: 0,
  //         statusGlobal: status,
  //         isOffline: false, // Initialisé à false par défaut
  //       };
  //     }

  //     // Ajouter l'article à la commande
  //     const article = {
  //       matnr: item.matnr,
  //       posnr: item.posnr,
  //       charg: item.charg,
  //       kmein: item.kmein,
  //       lsmeng: parseFloat(item.lsmeng),
  //       qte_restante: parseFloat(item.qte_restante),
  //       designation: item.maktx || `Article ${item.matnr}`,
  //       prix: item.prix_unitaire,
  //       remise: parseFloat(item.remise_pourcentage),
  //       devise: "DZD",
  //       statusItem:
  //         item.lsmeng === item.qte_restante
  //           ? "Non Livré"
  //           : "Partiellement livré",
  //       isOffline: item.isOffline || false, // Garder l'info offline de l'article
  //       isDeleted: item.isDeleted || false,
  //     };

  //     groupedObj[key].articles.push(article);

  //     // Si l'article est offline, marquer toute la commande comme offline
  //     if (article.isOffline) {
  //       groupedObj[key].isOffline = true;
  //     }

  //     // Mettre à jour les totaux
  //     groupedObj[key].totalArticles = groupedObj[key].articles.length;
  //     groupedObj[key].totalQuantity = groupedObj[key].articles.reduce(
  //       (sum, art) => sum + art.lsmeng,
  //       0
  //     );
  //   });

  //   return Object.values(groupedObj);
  // };

  // Fonction de groupement optimisée avec mise en cache des calculs
  const groupCommandesByCommercialAndClient = useCallback(
    (commandesList, clientName) => {
      const groupedObj = {};

      for (let i = 0; i < commandesList.length; i++) {
        const item = commandesList[i];
        const key = `${item.cmd}-${item.commercial}-${item.client}`;

        // Calculs optimisés pour le statut
        const qteRestante = parseFloat(item.qte_restante);
        const lsmeng = parseFloat(item.lsmeng);
        const status =
          qteRestante < lsmeng || qteRestante === 0
            ? "Partiellement livré"
            : "Non livré";

        if (!groupedObj[key]) {
          groupedObj[key] = {
            cmd: item.cmd,
            commercial: item.commercial,
            client: item.client,
            clientName: clientName,
            montantTtc: parseFloat(item.ttc).toLocaleString("fr-DZ", {
              style: "currency",
              currency: "DZD",
            }),
            erdat: convertirDateSAP(item.erdat).formatted,
            articles: [],
            totalArticles: 0,
            totalQuantity: 0,
            statusGlobal: "Non livré",
            isOffline: false,
            status: item.statu_cmd, // statu de la commande approuvé ou non
          };
        }

        // Création optimisée de l'article
        const article = {
          matnr: item.matnr,
          posnr: item.posnr,
          charg: item.charg,
          kmein: item.kmein,
          lsmeng: lsmeng,
          qte_restante: qteRestante,
          designation: item.maktx || `Article ${item.matnr}`,
          prix: item.prix_unitaire,
          remise: parseFloat(item.remise_pourcentage),
          devise: "DZD",
          statusItem:
            lsmeng === qteRestante ? "Non Livré" : "Partiellement livré",
          isOffline: item.isOffline || false,
          isDeleted: item.isDeleted || false,
        };

        groupedObj[key].articles.push(article);

        // Mise à jour des propriétés de la commande
        if (article.isOffline) {
          groupedObj[key].isOffline = true;
        }
        if (article.qte_restante < article.lsmeng) {
          groupedObj[key].statusGlobal = "Partiellement livré";
        }
      }

      // Calcul final des totaux (plus efficace qu'à chaque ajout)
      const result = Object.values(groupedObj);
      for (let i = 0; i < result.length; i++) {
        const cmd = result[i];
        cmd.totalArticles = cmd.articles.length;
        cmd.totalQuantity = cmd.articles.reduce(
          (sum, art) => sum + art.lsmeng,
          0,
        );
      }

      return result;
    },
    [],
  );

  // Fonction de tri optimisée avec mise en cache des dates
  const sortOrdersByDate = useCallback((orders) => {
    // Créer un cache des dates pour éviter les recalculs
    const dateCache = new Map();

    return orders.sort((a, b) => {
      let dateA = dateCache.get(a.erdat);
      if (!dateA) {
        dateA = convertirDateSAP(a.erdat).date;
        dateCache.set(a.erdat, dateA);
      }

      let dateB = dateCache.get(b.erdat);
      if (!dateB) {
        dateB = convertirDateSAP(b.erdat).date;
        dateCache.set(b.erdat, dateB);
      }

      return dateB - dateA; // Du plus récent au plus ancien
    });
  }, []);

  // Fonction de filtrage optimisée
  const filterCommandes = useCallback((grouped, searchQuery) => {
    if (!searchQuery.trim()) return grouped;

    const lowerSearchQuery = searchQuery.toLowerCase();
    const filtered = [];

    for (let i = 0; i < grouped.length; i++) {
      const item = grouped[i];
      if (
        item.cmd.toLowerCase().includes(lowerSearchQuery) ||
        item.client.toLowerCase().includes(lowerSearchQuery) ||
        (item.clientName &&
          item.clientName.toLowerCase().includes(lowerSearchQuery))
      ) {
        filtered.push(item);
      }
    }

    return filtered;
  }, []);

  // UseEffect optimisé avec useMemo pour les calculs coûteux
  useEffect(() => {
    if (!ordersApprouve?.length || !client?.kunnr) {
      setFilteredCommandes([]);
      return;
    }

    // Filtrage initial par client (plus efficace avec filter natif)
    const clientOrders = ordersApprouve.filter(
      (order) => order.client === client.kunnr,
    );

    if (clientOrders.length === 0) {
      setFilteredCommandes([]);
      return;
    }

    // Tri optimisé
    const sortedOrders = sortOrdersByDate(clientOrders);

    // Groupement optimisé
    const grouped = groupCommandesByCommercialAndClient(
      sortedOrders,
      client.name1,
    );

    // Filtrage par recherche optimisé
    const filtered = filterCommandes(grouped, searchQuery);

    setFilteredCommandes(filtered);
  }, [
    ordersApprouve,
    searchQuery,
    client?.kunnr,
    client?.name1,
    sortOrdersByDate,
    groupCommandesByCommercialAndClient,
    filterCommandes,
  ]);

  // Alternative avec useMemo pour une optimisation encore plus poussée
  const filteredCommandesMemo = useMemo(() => {
    if (!ordersApprouve?.length || !client?.kunnr) {
      return [];
    }

    // Filtrage, tri et groupement en une seule passe
    const clientOrders = ordersApprouve.filter(
      (order) => order.client === client.kunnr,
    );

    if (clientOrders.length === 0) return [];

    const sortedOrders = sortOrdersByDate(clientOrders);
    const grouped = groupCommandesByCommercialAndClient(
      sortedOrders,
      client.name1,
    );

    return filterCommandes(grouped, searchQuery);
  }, [ordersApprouve, searchQuery, client?.kunnr, client?.name1]);

  const handleCommandePress = (item) => {
    if (expandedCommande === item.cmd) {
      setExpandedCommande(null);
    } else {
      setExpandedCommande(item.cmd);
    }
  };

  const handleAddItem = (item) => {
    // Logique pour ajouter un article
    setStatusOperation("add");
    setCurrentCommande(item);
    setMinQuantity("0");
    articlesModalizeRef.current?.open();
  };

  const handleModifierArticle = (article, commande) => {
    setStatusOperation("update");
    setSelecteNewdArticle("");
    setSelectedArticle(article);
    setCurrentCommande(commande);

    // Calculer la quantité déjà livrée
    const qteLivree = article.lsmeng - article.qte_restante;
    setMinQuantity(qteLivree); // Définir la quantité minimale

    // Initialiser avec la quantité actuelle
    setQuantity(article.lsmeng.toString());
    setDiscount(article.remise.toFixed());

    actionModalizeRef.current?.close();
    quantityModalizeRef.current?.open();
  };

  const handleUpdateOrAddItem = async () => {
    // if (!selectedArticle || !currentCommande) return;

    // Vérifier si la quantité est valide
    const qteNumerique = parseFloat(quantity);
    if (isNaN(qteNumerique) || qteNumerique < minQuantity) {
      Alert.alert(
        "Quantité invalide",
        `La quantité doit être au moins égale à la quantité déjà livrée (${minQuantity}).`,
      );
      return;
    }

    // Dispatch action to update article quantity
    if (statusOperation === "update") {
      await dispatch(
        updateOrderItem({
          commande: currentCommande.cmd,
          itemNumber: selectedArticle.posnr,
          article:
            (selectedNewArticle && selectedNewArticle?.id) ||
            selectedArticle.matnr,
          qte: parseFloat(quantity),
        }),
      );
    }
    // Dispatch action to add new articl
    if (statusOperation === "add") {
      await dispatch(
        addOrderItem({
          commande: currentCommande.cmd,
          article:
            (selectedNewArticle && selectedNewArticle?.id) ||
            selectedArticle.matnr,
          qte: parseFloat(quantity),
        }),
      );
    }
    quantityModalizeRef.current?.close();
    setSelecteNewdArticle(null);
  };

  useEffect(() => {
    // Réinitialiser l'état de suppression
    dispatch(resetOrderState());
  }, [dispatch]);

  useEffect(() => {
    if (deleteSuccess) {
      // Notification de succès
      if (statusOperation === "add") {
        Alert.alert("Article ajouté", "L'article a été ajouté avec succès.");
      }
      if (statusOperation === "update") {
        Alert.alert("Article modifié", "L'article a été modifié avec succès.");
      }
      if (statusOperation === "delete") {
        Alert.alert(
          "Article supprimé",
          "L'article a été supprimé avec succès.",
        );
      }
      // Recharger les commandes
      dispatch(
        getCommandesApprouves({
          user: userData?.code,
          client: client?.kunnr,
        }),
      );

      // Fermer la modalize
      actionModalizeRef.current?.close();

      // Réinitialiser l'état
      dispatch(resetOrderState());
    }

    if (deleteError) {
      // Notification d'erreur
      Alert.alert("Erreur", deleteError, [{ text: "OK" }]);

      // Réinitialiser l'état
      dispatch(resetOrderState());
    }
    setStatusOperation("");
  }, [deleteSuccess, deleteError, dispatch, userData, client]);

  // 5. MODIFIER LA FONCTION handleSupprimerArticle
  const handleSupprimerArticle = (article) => {
    console.log("suppression article", currentCommande.cmd, article.posnr);
    setStatusOperation("delete");
    // Vérifier si l'article est déjà livré ou en cours de livraison
    if (article.qte_restante < article.lsmeng) {
      Alert.alert(
        "Action impossible",
        "Cet article est déjà livré ou en cours de livraison et ne peut pas être supprimé.",
      );
      return;
    }

    Alert.alert(
      "Confirmer la suppression",
      `Voulez-vous vraiment supprimer l'article ${article.designation} ?`,
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Supprimer",
          onPress: () => {
            dispatch(
              deleteOrderItem({
                commande: currentCommande.cmd,
                itemNumber: article.posnr,
              }),
            );
          },
          style: "destructive",
        },
      ],
    );
  };

  const handleArticleSelect = (article) => {
    setSelecteNewdArticle(article);
    articlesModalizeRef.current?.close();
    quantityModalizeRef.current?.open();
  };

  const handleChoisirAutreArticle = () => {
    // Vérifier si l'article actuel est en livraison
    if (
      selectedArticle &&
      selectedArticle.qte_restante < selectedArticle.lsmeng
    ) {
      Alert.alert(
        "Action impossible",
        "Vous ne pouvez pas changer cet article car il est déjà en cours de livraison.",
      );
      return;
    }

    quantityModalizeRef.current?.close();
    // Ouvrir la modalize des articles après un court délai pour éviter les problèmes d'animation
    setTimeout(() => {
      articlesModalizeRef.current?.open();
    }, 300);
  };

  const renderCommandeItem = ({ item }) => {
    const isExpanded = expandedCommande === item.cmd;

    return (
      <View style={styles.commandeContainer}>
        <TouchableOpacity
          style={[
            styles.commandeHeader,
            item.isOffline && {
              backgroundColor: "#FFF3E0", // Couleur légèrement orangée pour les éléments offline
              borderLeftWidth: 3,
              borderLeftColor: "#FF9800",
            },
          ]}
          onPress={() => handleCommandePress(item)}
          disabled={!isServerReachable}
        >
          <View style={styles.commandeInfo}>
            <Text style={[styles.commandeDate, { letterSpacing: 1 }]}>
              {item.erdat}
            </Text>
            {!item.isOffline && (
              <Text style={[styles.commandeNumber, { letterSpacing: 1 }]}>
                N° {item.cmd}
              </Text>
            )}

            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-start",
                alignItems: "center",
                marginTop: 4,
              }}
            >
              <View
                style={[
                  styles.statusIndicator,
                  {
                    backgroundColor:
                      item.status === "false"
                        ? "#666"
                        : item.statusGlobal === "Non livré"
                          ? "red"
                          : "orange",
                  },
                ]}
              />
              <Text
                style={{
                  fontSize: 10,
                  color: "#757575",
                  fontWeight: 800,
                  // paddingHorizontal: 15,
                  // paddingVertical: 1,
                  // color: item.statusGlobal === "Non livré" ? "red" : "orange",
                  letterSpacing: 1,
                }}
              >
                {/* {item.isOffline
                  ? "En attente de syncronisation "
                  : item.statusGlobal} */}
                {item.status === "false"
                  ? "En attente d'approbation"
                  : item.statusGlobal}
              </Text>
            </View>
          </View>
          <View style={styles.commandeStats}>
            <Text style={styles.statsText}>{item.totalArticles} articles</Text>
            {!item.isOffline && (
              <Text style={styles.commandeNumber}>{item.montantTtc}</Text>
            )}
            <View style={styles.expandIcon}>
              <MaterialIcons
                name={isExpanded ? "expand-less" : "expand-more"}
                size={24}
                color="#03A9F4"
              />
            </View>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View
            style={[
              styles.commandeDetails,
              {
                borderTopWidth: 0.5,
                borderColor: "rgba(104, 104, 107, 0.32)",
                backgroundColor: "rgba(233, 220, 188, 0.1)",
              },
              // item.isOffline && {
              //   backgroundColor: "rgba(233, 220, 188, 0.26)",
              // },
            ]}
          >
            <Text style={styles.detailsTitle}>Postes</Text>

            {/* En-têtes du tableau */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.codeColumn]}>
                Code
              </Text>
              <Text style={[styles.tableHeaderText, styles.designationColumn]}>
                Désignation
              </Text>
              <Text style={[styles.tableHeaderText, styles.qteColumn]}>
                Qté
              </Text>
              <Text style={[styles.tableHeaderText, styles.prixColumn]}>
                Prix
              </Text>
            </View>

            <View style={styles.articleContainer}>
              <FlatList
                data={item.articles.filter((article) => !article.isDeleted)}
                keyExtractor={(article, index) => `${article.matnr}-${index}`}
                renderItem={({ item: article, index }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedArticle(article);
                      setCurrentCommande(item);
                      actionModalizeRef.current.open();
                    }}
                    style={[styles.tableRow, index % 2 === 0 && styles.evenRow]}
                    disabled={item.isOffline || item.status === "false"}
                  >
                    {/* Code */}
                    <View style={styles.codeColumn}>
                      <Text style={styles.designationCellText}>
                        {article.matnr}
                      </Text>
                    </View>

                    {/* Désignation */}
                    <View style={styles.designationColumn}>
                      <Text
                        style={styles.designationCellText}
                        numberOfLines={10}
                      >
                        {article.designation}
                      </Text>
                    </View>

                    {/* Quantité Commandée */}
                    <View style={styles.qteColumn}>
                      <Text style={styles.tableCellTextRight}>
                        {parseFloat(article.lsmeng).toFixed(2)} {article.kmein}
                      </Text>
                      {/* {!item.isOffline && (
                        <Text style={styles.unitText}>{article.kmein}</Text>
                      )} */}
                    </View>

                    {/* Prix Unitaire */}
                    <View style={styles.prixColumn}>
                      <Text style={styles.tableCellTextRight}>
                        {article.prix
                          ? `${parseFloat(article.prix).toFixed(2)} DA`
                          : "-"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.articlesList}
              />
            </View>

            {/* Affichage de la quantité restante en bas si nécessaire */}
            {/* {!item.isOffline && (
              <View style={styles.remainingInfo}>
                <Text style={styles.remainingTitle}>Quantités restantes :</Text>
                {item.articles
                  .filter((article) => !article.isDeleted)
                  .map((article, index) => (
                    <Text
                      key={`${article.matnr}-${index}`}
                      style={[
                        styles.remainingText,
                        parseFloat(article.qte_restante) <= 0 &&
                          styles.negativeRemaining,
                      ]}
                    >
                      {article.matnr}:{" "}
                      {parseFloat(article.qte_restante).toFixed(2)}
                    </Text>
                  ))}
              </View>
            )} */}

            {!(item.isOffline === false && item.status === "false") && (
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleAddItem(item)}
                >
                  <MaterialIcons name="add" size={20} color="#006475" />
                  <Text style={styles.actionButtonText}>
                    Ajouter un article
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const handleRefresh = () => {
    dispatch(loadOfflineOrders(client.kunnr));
    dispatch(fetchPendingActionsCount());
    dispatch(
      getCommandesApprouves({
        user: userData?.code,
      }),
    );
  };

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
            Mes commandes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            showOfflineOrders && styles.activeToggleButton,
          ]}
          onPress={() => {
            setShowOfflineOrders(true);
            scrollToTop;
            setShowScrollToTop(false);
          }}
        >
          <Text
            style={[
              styles.toggleButtonText,
              showOfflineOrders && styles.activeToggleButtonText,
            ]}
          >
            Commandes en attente ({offlineOrders?.length})
          </Text>
        </TouchableOpacity>
      </View>

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
          <Text style={styles.loaderText}>Chargement des commandes...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#e53935" />
          <Text style={styles.errorText}>Erreur: {error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => dispatch(getCommandesApprouves())}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : //     filteredCommandesMemo.length === 0 ? (
      //   <View style={styles.emptyContainer}>
      //     <MaterialCommunityIcons
      //       name="truck-delivery"
      //       size={64}
      //       color="#E0E0E0"
      //     />
      //     <Text style={styles.emptyText}>
      //       {searchQuery.trim() !== ""
      //         ? "Aucune commande ne correspond à votre recherche"
      //         : "Aucune commande en attente de livraison"}
      //     </Text>
      //   </View>
      // ) : (
      //   <FlatList
      //     data={filteredCommandesMemo}
      //     renderItem={renderCommandeItem}
      //     keyExtractor={(item) => `${item.cmd}-${item.client}`}
      //     contentContainerStyle={styles.commandesList}
      //   />
      //   )}
      showOfflineOrders ? (
        <OfflineOrdersScreen route={{ params: { client } }} />
      ) : filteredCommandesMemo.length === 0 ? (
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
          data={filteredCommandesMemo}
          renderItem={renderCommandeItem}
          keyExtractor={(item) => `${item.cmd}-${item.client}`}
          contentContainerStyle={styles.commandesList}
          onScroll={handleScroll} // Ajoutez cette ligne
          scrollEventThrottle={16} // Ajoutez cette ligne
          refreshControl={
            <RefreshControl
              // refreshing={loading}
              onRefresh={handleRefresh}
              colors={["#03A9F4", "#FFC107", "#4CAF50"]}
            />
          }
        />
      )}

      {/* add button new oder */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate("create_cmd", { client })}
        >
          <MaterialIcons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>
      <View style={styles.fabContainerScrollButton}>
        {!showOfflineOrders && showScrollToTop && (
          <TouchableOpacity
            style={styles.fabScrollButton}
            onPress={scrollToTop}
            activeOpacity={0.8}
          >
            <MaterialIcons name="north" size={18} color="#909397" />
          </TouchableOpacity>
        )}
      </View>
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
                  if (selectedArticle && currentCommande) {
                    handleModifierArticle(selectedArticle, currentCommande);
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
                disabled={
                  selectedArticle &&
                  selectedArticle.qte_restante < selectedArticle.lsmeng
                }
              >
                <MaterialIcons
                  name="delete"
                  size={24}
                  color={
                    selectedArticle &&
                    selectedArticle.qte_restante < selectedArticle.lsmeng
                      ? "#BDBDBD"
                      : "#F44336"
                  }
                />
                <Text
                  style={[
                    styles.actionModalizeButtonText,
                    styles.deleteButtonText,
                    selectedArticle &&
                    selectedArticle.qte_restante < selectedArticle.lsmeng
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
        {/* {selectedArticle && ( */}
        <View style={styles.quantityModal}>
          <Text style={styles.quantityTitle}>
            {statusOperation === "add" ? "Nouveau article" : "Modification"}
          </Text>
          <Text style={styles.quantityArticle}>
            {selectedNewArticle?.designation || selectedArticle?.designation}
          </Text>

          {/* Affichage de la quantité minimale */}
          {minQuantity > 0 && (
            <View style={styles.minQuantityWarning}>
              <MaterialIcons name="warning" size={18} color="#FF9800" />
              <Text style={styles.minQuantityText}>
                Quantité déjà livrée: {minQuantity} {selectedArticle?.kmein}
              </Text>
            </View>
          )}

          {/* Quantity Controls */}
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
                  // Validation pour s'assurer que la quantité n'est pas inférieure à la quantité minimale
                  const numValue = parseFloat(value);
                  if (value === "" || isNaN(numValue)) {
                    setQuantity(value);
                  } else if (numValue >= minQuantity) {
                    setQuantity(value);
                  } else {
                    // Si la valeur est inférieure au minimum, utiliser la valeur minimale
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

          {/* Discount Controls */}
          {/* <View style={styles.quantityRow}>
              <Text
                style={[
                  styles.quantityLabel,
                  { fontWeight: "bold", fontSize: 18 },
                ]}
              >
                Remise(%) :
              </Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => {
                    const currentDisc = parseFloat(discount);
                    if (!isNaN(currentDisc) && currentDisc > 0) {
                      setDiscount((currentDisc - 1).toFixed(1));
                    }
                  }}
                >
                  <MaterialIcons name="remove" size={20} color="white" />
                </TouchableOpacity>

                <TextInput
                  style={styles.quantityModalInput}
                  value={discount}
                  onChangeText={setDiscount}
                  keyboardType="numeric"
                />

                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => {
                    const currentDisc = parseFloat(discount);
                    if (!isNaN(currentDisc) && currentDisc < 100) {
                      setDiscount((currentDisc + 1).toFixed(1));
                    } else {
                      setDiscount("0");
                    }
                  }}
                >
                  <MaterialIcons name="add" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View> */}

          {/* Price calculation preview */}
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

            {/* {parseFloat(discount) > 0 && (
                <View style={styles.pricePreviewRow}>
                  <Text>Remise ({discount}%) :</Text>
                  <Text style={styles.totalPreviewValue}>
                    -
                    {parseFloat(
                      ((selectedArticle.prix * parseFloat(discount)) / 100) *
                        parseFloat(quantity || "0")
                    ).toLocaleString("fr-DZ", {
                      style: "currency",
                      currency: "DZD",
                    })}
                  </Text>
                </View>
              )} */}

            <View style={[styles.pricePreviewRow, styles.totalPreviewRow]}>
              <Text style={styles.totalPreviewLabel}>Total :</Text>
              <Text style={styles.totalPreviewValue}>
                {(selectedNewArticle &&
                  parseFloat(
                    selectedNewArticle?.prix * parseFloat(quantity),
                    // * (1 - parseFloat(discount) / 100)
                  ).toLocaleString("fr-DZ", {
                    style: "currency",
                    currency: "DZD",
                  })) ||
                  parseFloat(
                    selectedArticle?.prix * parseFloat(quantity),
                    // * (1 - parseFloat(discount) / 100)
                  ).toLocaleString("fr-DZ", {
                    style: "currency",
                    currency: "DZD",
                  })}
              </Text>
            </View>
          </View>

          {/* Bouton pour choisir un autre article - désactivé si l'article est en livraison */}
          {selectedArticle?.qte_restante < selectedArticle?.lsmeng ? (
            ""
          ) : (
            <TouchableOpacity
              style={[
                styles.chooseAnotherButton,
                selectedArticle &&
                selectedArticle.qte_restante < selectedArticle?.lsmeng
                  ? styles.disabledChooseButton
                  : {},
              ]}
              onPress={handleChoisirAutreArticle}
              disabled={
                selectedArticle &&
                selectedArticle?.qte_restante < selectedArticle?.lsmeng
              }
            >
              <MaterialIcons
                name="swap-horiz"
                size={20}
                color={
                  selectedArticle &&
                  selectedArticle?.qte_restante < selectedArticle?.lsmeng
                    ? "#BDBDBD"
                    : "#03A9F4"
                }
              />
              <Text
                style={[
                  styles.chooseAnotherButtonText,
                  selectedArticle &&
                  selectedArticle?.qte_restante < selectedArticle?.lsmeng
                    ? styles.disabledButtonText
                    : {},
                ]}
              >
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
        {/* )} */}
      </Modalize>
      {/* Modalize pour les articles (réutilisée) */}
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
    backgroundColor: "#F5F5F5",
  },
  searchContainer: {
    marginTop: 10,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  commandesList: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 20,
  },
  commandeContainer: {
    backgroundColor: "white",
    borderRadius: 5,
    marginBottom: 2,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: "hidden",
  },
  commandeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  commandeInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  commandeNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#03A9F4",
  },
  clientName: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: "500",
  },
  commandeDate: {
    fontSize: 12,
    color: "#757575",
    marginTop: 4,
  },
  commandeStats: {
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  statsText: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 8,
  },
  expandIcon: {
    justifyContent: "center",
    alignItems: "center",
  },
  commandeDetails: {
    padding: 16,
    backgroundColor: "#FAFAFA",
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#424242",
  },
  articleContainer: {
    borderWidth: 1,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 10,
    borderColor: "rgba(129, 132, 140, 0.1)",
    paddingHorizontal: 5,
    // paddingVertical: 8,
    marginBottom: 5,
    backgroundColor: "white",
  },
  articlesList: {
    marginBottom: 16,
  },
  articleItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  articleInfo: {
    flex: 1,
  },
  articleCode: {
    fontSize: 11,
    color: "#03A9F4",
    fontWeight: "500",
  },
  articleName: {
    fontSize: 11,
    marginTop: 2,
  },
  articleQuantity: {
    alignItems: "flex-end",
  },
  quantityText: {
    fontSize: 11,
    fontWeight: "500",
  },
  remainingText: {
    fontSize: 11,
    color: "#4CAF50",
    marginTop: 2,
  },
  negativeRemaining: {
    color: "#F44336",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  actionButtonText: {
    color: "#006475",
    fontWeight: "700",
    marginLeft: 8,
    fontSize: 14,
    letterSpacing: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    marginTop: 12,
    fontSize: 16,
    color: "#757575",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: "#e53935",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#03A9F4",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#757575",
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  // action modalize styles
  actionModalContainer: {
    padding: 24,
  },
  actionModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  actionModalizeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  actionModalizeButtonText: {
    fontSize: 16,
    marginLeft: 16,
    color: "#333",
  },
  deleteButton: {
    borderBottomWidth: 0,
    marginBottom: 16,
  },
  deleteButtonText: {
    color: "#F44336",
  },
  cancelButton: {
    backgroundColor: "#EEEEEE",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  modalContainer: {
    padding: 16,
  },
  quantityModal: {
    padding: 16,
  },
  quantityTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    margin: "auto",
  },
  quantityArticle: {
    fontSize: 16,
    color: "#03A9F4",
    marginBottom: 16,
    margin: "auto",
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  quantityLabel: {
    fontWeight: "bold",
    fontSize: 18,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    backgroundColor: "#03A9F4",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityModalInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginHorizontal: 8,
    width: 60,
    textAlign: "center",
    fontSize: 16,
  },
  pricePreview: {
    marginBottom: 12,
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: "#F9F9F9",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
  },
  pricePreviewRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  pricePreviewRowTitle: {
    fontSize: 14,
  },
  pricePreviewRowValue: {
    fontWeight: "bold",
    letterSpacing: 2,
  },
  totalPreviewLabel: {
    fontWeight: "bold",
  },
  totalPreviewValue: {
    fontWeight: "bold",
    letterSpacing: 2,
    color: "#006475",
  },
  totalPreviewRow: {
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    marginTop: 4,
    paddingTop: 4,
  },
  confirmButton: {
    backgroundColor: "#03A9F4",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#E0E0E0",
    opacity: 0.7,
  },
  disabledButtonText: {
    color: "#BDBDBD",
  },
  minQuantityWarning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    padding: 8,
    borderRadius: 4,
    marginBottom: 16,
  },
  minQuantityText: {
    marginLeft: 8,
    color: "#FF9800",
    fontSize: 14,
  },
  chooseAnotherButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#03A9F4",
    borderRadius: 8,
  },
  disabledChooseButton: {
    borderColor: "#BDBDBD",
    backgroundColor: "#F5F5F5",
  },
  chooseAnotherButtonText: {
    color: "#03A9F4",
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    height: 150,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#03A9F4",
    textAlign: "center",
  },
  fabContainer: {
    position: "absolute",
    right: 16,
    bottom: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  fabContainerScrollButton: {
    position: "absolute",
    bottom: 5,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 38,
    backgroundColor: "#FFA000",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  fabScrollButton: {
    marginBottom: 15,
    width: 36,
    height: 36,
    borderRadius: 28,
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
  floatingButton: {
    // position: "absolute",
    // bottom: 20,
    // right: 20,
    marginBottom: 5,
    width: 36,
    height: 36,
    borderRadius: 28,
    backgroundColor: "#03A9F4",
    justifyContent: "center",
    alignItems: "center",
    // elevation: 8,
    // shadowColor: "#000",
    // shadowOffset: { width: 5, height: 4 },
    // shadowOpacity: 0.9,
    // shadowRadius: 6,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  activeToggleButton: {
    borderBottomWidth: 3,
    borderBottomColor: "#03A9F4",
  },
  toggleButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#757575",
  },
  activeToggleButtonText: {
    color: "#03A9F4",
    fontWeight: "600",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopRightRadius: 10,
    borderTopLeftRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(129, 132, 140, 0.1)",
    borderBottomWidth: 2,
    borderBottomColor: "#ddd",
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  tableRow: {
    // flexDirection: "row",
    // paddingVertical: 12,
    // paddingHorizontal: 8,
    // borderBottomWidth: 1,
    // borderBottomColor: "#e9ecef",
    // alignItems: "center",
    flexDirection: "row",
    paddingVertical: 15,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },
  evenRow: {
    // backgroundColor: "#f8f9fa",
  },
  codeColumn: {
    flex: 2,
    paddingRight: 8,
  },
  designationColumn: {
    flex: 4,
    paddingHorizontal: 4,
  },
  qteColumn: {
    flex: 2,
    alignItems: "center",
    paddingHorizontal: 4,
  },
  prixColumn: {
    flex: 2,
    alignItems: "flex-end",
    paddingLeft: 8,
  },
  designationCellText: {
    fontSize: 10,
    color: "#212529",
    textAlign: "left",
  },
  tableCellTextRight: {
    fontSize: 10,
    color: "#212529",
    textAlign: "right",
  },
  tableCellText: {
    fontSize: 10,
    color: "#212529",
    textAlign: "center",
  },
  unitText: {
    fontSize: 10,
    color: "#6c757d",
    textAlign: "center",
    marginTop: 2,
  },
  remainingInfo: {
    backgroundColor: "#f8f9fa",
    padding: 11,
    marginTop: 8,
    borderRadius: 6,
  },
  remainingTitle: {
    fontWeight: "bold",
    fontSize: 11,
    color: "#495057",
    marginBottom: 6,
  },
  remainingText: {
    fontSize: 11,
    color: "#28a745",
    marginBottom: 2,
  },
  negativeRemaining: {
    color: "#dc3545",
    fontWeight: "bold",
  },
});

export default CommandeListesScreen;
