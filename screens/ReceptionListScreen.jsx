import React, { useEffect, useState, useRef } from "react";
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
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { Modalize } from "react-native-modalize";
// Supposons que vous avez une action pour récupérer les transferts
import {
  getTransfertDocument,
  resetGoodReceiptState,
  resetListState,
} from "../redux/slices/goodReceiptSlice";
import { wp, hp, fs, fontWeight, scale } from "../utils/responsive";

const { width, height } = Dimensions.get("window");
const ReceptionListScreen = ({ route }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  // États pour le composant
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTransferts, setFilteredTransferts] = useState([]);
  const [selectedTransfert, setSelectedTransfert] = useState(null);
  const [articlesTransfert, setArticlesTransfert] = useState([]);

  // Référence pour la modal
  const transfertDetailModalizeRef = useRef(null);

  // Récupération des données depuis Redux
  const { transferts, loadingTransfert, errorListTransfert } = useSelector(
    (state) => state.goodReceipt
  );
  const { isServerReachable } = useSelector((state) => state.offline);
  const userData = useSelector((state) => state.auth.user);

  useEffect(() => {
    // Charger les transferts en attente de réception
    const loadTransferts = async () => {
      await dispatch(resetListState());
      if (isServerReachable) {
        await dispatch(
          getTransfertDocument({
            magasin: userData?.magasin,
          })
        );
      }
    };
    loadTransferts();
  }, [dispatch, userData?.magasin, navigation]);

  useEffect(() => {
    // Filtrer les transferts en fonction de la recherche

    const grouped = groupTransfertsByDocumentAndYear(transferts);

    if (searchQuery.trim() === "") {
      setFilteredTransferts(grouped);
    } else {
      const filtered = grouped.filter(
        (item) =>
          item.NumeroDocument.toLowerCase().includes(
            searchQuery.toLowerCase()
          ) ||
          item.MagasinSource.toLowerCase().includes(
            searchQuery.toLowerCase()
          ) ||
          item.MagasinDestinataire.toLowerCase().includes(
            searchQuery.toLowerCase()
          )
      );
      setFilteredTransferts(filtered);
    }
  }, [transferts, searchQuery]);

  // Fonction pour convertir une date SAP au format français
  const convertirDateSAP = (dateSAP) => {
    const timestampMatch = dateSAP?.match(/\/Date\((\d+)\)\//);

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

  // Fonction pour regrouper les transferts par document et année
  const groupTransfertsByDocumentAndYear = (transfertsList) => {
    const groupedObj = {};

    transfertsList.forEach((item) => {
      const key = `${item.NumeroDocument}-${item.Annee}`;

      if (!groupedObj[key]) {
        groupedObj[key] = {
          NumeroDocument: item.NumeroDocument,
          Annee: item.Annee,
          DateComptabilisation: convertirDateSAP(item.DateComptabilisation),
          MagasinSource: item.MagasinSource,
          MagasinDestinataire: item.MagasinDestinataire,
          Division: item.Division,
          articles: [],
          totalArticles: 0,
          totalQuantity: 0,
          statut: "Non réceptionné", // Statut par défaut
        };
      }

      // Ajouter l'article au transfert
      groupedObj[key].articles.push({
        Article: item.Article,
        Designation: item.maktx,
        lot: item.lot,
        QuantiteSortie: parseFloat(item.QuantiteSortie),
        TotalQuantiteRecue: parseFloat(item.TotalQuantiteRecue),
        QuantiteRestante: parseFloat(item.QuantiteRestante),
        StatutReception: item.StatutReception,
        UniteMesure: item.UniteMesure,
      });

      // Mettre à jour les totaux
      groupedObj[key].totalArticles += 1;
      groupedObj[key].totalQuantity += parseFloat(item.QuantiteSortie);

      if (item.StatutReception === "Partiellement réceptionné") {
        groupedObj[key].statut = "Partiellement réceptionné";
      }
    });

    return Object.values(groupedObj);
  };

  const handleTransfertPress = (item) => {
    setSelectedTransfert(item);
    setArticlesTransfert(item.articles);
    transfertDetailModalizeRef.current?.open();
  };

  const handleCreateReception = (transfert) => {
    transfertDetailModalizeRef.current?.close();
    setTimeout(() => {
      navigation.navigate("create_reception", { transfert });
    }, 300);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Non réceptionné":
        return "#3B82F6"; // Bleu
      case "Partiellement réceptionné":
        return "#10B981"; // Vert
      case "Réceptionné":
        return "#8B5CF6"; // Violet
      default:
        return "#6B7280"; // Gris par défaut
    }
  };

  const getStatusBackgroundColor = (status) => {
    switch (status) {
      case "Non réceptionné":
        return "#3B82F620"; // Bleu avec opacity
      case "Partiellement réceptionné":
        return "#10B98120"; // Vert avec opacity
      case "Réceptionné":
        return "#8B5CF620"; // Violet avec opacity
      default:
        return "#6B728020"; // Gris par défaut
    }
  };

  const renderTransfertItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.modernCard]}
      onPress={() => handleTransfertPress(item)}
      activeOpacity={0.7}
    >
      {/* Header avec date et numéro */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.cmdNumber}>{item.DateComptabilisation}</Text>
          <Text style={styles.dateText}>N°{item.NumeroDocument}</Text>
          {/* <Text style={styles.vgbelText}>Année: {item.Annee}</Text> */}
        </View>

        {/* Badge statut moderne */}
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: getStatusBackgroundColor(item.statut),
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: getStatusColor(item.statut),
              },
            ]}
          />
          <Text
            style={[
              styles.statusBadgeText,
              {
                color: getStatusColor(item.statut),
              },
            ]}
          >
            {item.statut}
          </Text>
        </View>
      </View>

      {/* Divider subtile */}
      <View style={styles.divider} />

      {/* Info magasins */}
      <View style={styles.warehouseInfoCompact}>
        <Text style={styles.warehouseCompactText}>
          {item.MagasinSource} → {item.MagasinDestinataire}
        </Text>
      </View>

      {/* Footer avec stats */}
      <View style={styles.cardFooter}>
        <View style={styles.footerLeft}>
          <View style={styles.statItem}>
            <MaterialIcons name="inventory" size={16} color="#6B7280" />
            <Text style={styles.statText}>{item.totalArticles} articles</Text>
          </View>
          <View style={styles.statItem}>
            {/* <MaterialIcons name="scale" size={16} color="#6B7280" /> */}
            <Text style={styles.statText}>
              {item.totalQuantity.toFixed(2)} unités
            </Text>
          </View>
        </View>

        <View style={styles.chevronContainer}>
          <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#03A9F4" barStyle="light-content" />

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={24} color="#757575" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un transfert..."
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

      {loadingTransfert ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#03A9F4" />
          <Text style={styles.loaderText}>Chargement des transferts...</Text>
        </View>
      ) : errorListTransfert ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#DC2626" />
          <Text style={styles.errorText}>Erreur: {errorListTransfert}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() =>
              dispatch(
                getTransfertDocument({
                  magasin: userData?.magasin,
                })
              )
            }
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : filteredTransferts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="truck-delivery"
            size={64}
            color="#E0E0E0"
          />
          <Text style={styles.emptyText}>
            {searchQuery.trim() !== ""
              ? "Aucun transfert ne correspond à votre recherche"
              : "Aucun transfert en attente de réception"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTransferts}
          renderItem={renderTransfertItem}
          keyExtractor={(item) => `${item.NumeroDocument}-${item.Annee}`}
          contentContainerStyle={styles.transfertsList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal pour les détails du transfert */}
      <Modalize
        ref={transfertDetailModalizeRef}
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
        {selectedTransfert && (
          <View style={styles.modalContent}>
            {/* Informations transfert */}
            <View style={styles.transfertDetails}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={styles.transfertClient}>
                  Transfert N°{selectedTransfert?.NumeroDocument}
                </Text>
                <TouchableOpacity
                  onPress={() => transfertDetailModalizeRef.current?.close()}
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
                <Text style={styles.transfertReference}>
                  Année: {selectedTransfert.Annee}
                </Text>
                <Text style={styles.transfertDate}>
                  {selectedTransfert?.DateComptabilisation}
                </Text>
              </View>

              {/* Info magasins */}
              <View style={styles.warehouseInfo}>
                <View style={styles.warehouseBlock}>
                  <Text style={styles.warehouseLabel}>Source</Text>
                  <Text style={styles.warehouseValue}>
                    {selectedTransfert.MagasinSource}
                  </Text>
                </View>
                <MaterialIcons
                  name="arrow-forward"
                  size={24}
                  color="#757575"
                  style={styles.arrowIcon}
                />
                <View style={styles.warehouseBlock}>
                  <Text style={styles.warehouseLabel}>Destination</Text>
                  <Text style={styles.warehouseValue}>
                    {selectedTransfert.MagasinDestinataire}
                  </Text>
                </View>
              </View>
            </View>

            {/* Tableau des articles */}
            <View
              style={[
                styles.transfertDetails,
                {
                  backgroundColor: "rgba(233, 220, 188, 0.1)",
                  marginTop: 10,
                  flex: 1,
                },
              ]}
            >
              <Text style={styles.detailsTitle}>
                {articlesTransfert.length} article(s)
              </Text>

              {/* En-têtes du tableau */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.codeColumn]}>
                  Code/Désignation
                </Text>
                <Text style={[styles.tableHeaderRightText, styles.qteColumn]}>
                  Qté Envoyée
                </Text>
                <Text style={[styles.tableHeaderRightText, styles.qteColumn]}>
                  Qté Reçue
                </Text>
                <Text style={[styles.tableHeaderRightText, styles.qteColumn]}>
                  Restant
                </Text>
              </View>

              {/* Liste scrollable des articles */}
              <ScrollView
                style={styles.scrollableArticleContainer}
                contentContainerStyle={styles.articleContainer}
              >
                {articlesTransfert.map((article, index) => (
                  <View
                    key={`${article.Article}-${index}`}
                    style={[styles.tableRow, index % 2 === 0 && styles.evenRow]}
                  >
                    {/* Code et désignation */}
                    <View style={styles.codeColumn}>
                      <Text style={styles.designationCellText}>
                        {article.Article}
                      </Text>
                      <Text
                        style={styles.designationCellText}
                        numberOfLines={3}
                      >
                        {article.Designation}
                      </Text>
                      {article.lot && (
                        <Text style={styles.chargText}>Lot: {article.lot}</Text>
                      )}
                    </View>

                    {/* Quantité envoyée */}
                    <View style={styles.qteColumn}>
                      <Text style={styles.tableCellTextRight}>
                        {article.QuantiteSortie.toFixed(2)}{" "}
                        {article.UniteMesure}
                      </Text>
                    </View>

                    {/* Quantité reçue */}
                    <View style={styles.qteColumn}>
                      <Text style={styles.tableCellTextRight}>
                        {article.TotalQuantiteRecue.toFixed(2)}{" "}
                        {article.UniteMesure}
                      </Text>
                    </View>

                    {/* Quantité restante */}
                    <View style={styles.qteColumn}>
                      <Text
                        style={[
                          styles.tableCellTextRight,
                          article.QuantiteRestante <= 0
                            ? styles.negativeRemaining
                            : styles.positiveRemaining,
                        ]}
                      >
                        {article.QuantiteRestante.toFixed(2)}{" "}
                        {article.UniteMesure}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>

              {/* Actions */}
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    selectedTransfert?.statut === "Réceptionné" &&
                      styles.disabledButton,
                  ]}
                  onPress={() => handleCreateReception(selectedTransfert)}
                  disabled={selectedTransfert?.statut === "Réceptionné"}
                >
                  <MaterialIcons name="archive" size={20} color="#0891B2" />
                  <Text style={styles.actionButtonText}>Réceptionner</Text>
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
  searchContainer: {
    marginTop: hp(1.1),
    paddingHorizontal: wp(3.9),
    marginBottom: hp(1.1),
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: scale(20),
    paddingHorizontal: wp(2.9),
    paddingVertical: hp(0.7),
    elevation: 0.5,
  },
  searchInput: {
    flex: 1,
    marginLeft: wp(1.9),
    fontSize: fs(16),
  },
  transfertsList: {
    paddingHorizontal: wp(3.9),
    paddingTop: hp(1.7),
    paddingBottom: hp(2.6),
  },

  // Styles des cartes modernes
  modernCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(16),
    padding: scale(16),
    marginVertical: hp(0.3),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 0.5,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: hp(1.3),
  },

  headerLeft: {
    flex: 1,
  },

  dateText: {
    fontSize: fs(14),
    fontWeight: fontWeight.semiBold,
    color: "#1F2937",
    marginBottom: hp(0.2),
  },

  cmdNumber: {
    fontSize: fs(12),
    color: "#6B7280",
    fontWeight: fontWeight.medium,
  },

  vgbelText: {
    fontSize: fs(11),
    color: "#6B7280",
    fontWeight: fontWeight.regular,
    marginTop: hp(0.1),
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp(1.9),
    paddingVertical: hp(0.4),
    borderRadius: scale(12),
    marginLeft: wp(1.9),
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
    height: scale(1),
    backgroundColor: "#F1F5F9",
    marginVertical: hp(0.4),
  },

  warehouseInfoCompact: {
    marginBottom: hp(0.9),
  },

  warehouseCompactText: {
    fontSize: fs(13),
    color: "#6B7280",
    fontWeight: fontWeight.medium,
  },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: hp(0.9),
  },

  footerLeft: {
    flex: 1,
    flexDirection: "row",
    gap: wp(2.4),
  },

  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp(0.4),
  },

  statText: {
    fontSize: fs(12),
    color: "#6B7280",
    marginLeft: wp(1),
    fontWeight: fontWeight.medium,
  },

  chevronContainer: {
    padding: scale(4),
  },

  // Styles pour la modal
  modal: {
    backgroundColor: "white",
    borderTopLeftRadius: scale(10),
    borderTopRightRadius: scale(10),
    maxHeight: "90%",
  },

  modalContent: {
    flex: 1,
  },

  transfertDetails: {
    padding: scale(16),
    backgroundColor: "#FAFAFA",
    borderRadius: scale(8),
    marginTop: hp(1.3),
  },

  detailsTitle: {
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
    marginBottom: hp(1.3),
    color: "#424242",
  },

  transfertClient: {
    fontSize: fs(16),
    fontWeight: fontWeight.semiBold,
    color: "#212529",
    marginBottom: hp(0.9),
  },

  transfertDate: {
    fontSize: fs(14),
    color: "#6c757d",
  },

  transfertReference: {
    fontSize: fs(13),
    color: "#6B7280",
    fontWeight: fontWeight.medium,
    marginTop: hp(0.4),
  },

  warehouseInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: hp(1.7),
    paddingTop: hp(1.7),
    borderTopWidth: scale(1),
    borderTopColor: "#EEEEEE",
  },

  warehouseBlock: {
    flex: 1,
    alignItems: "center",
  },

  warehouseLabel: {
    fontSize: fs(12),
    color: "#757575",
    marginBottom: hp(0.4),
  },

  warehouseValue: {
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
    color: "#424242",
  },

  arrowIcon: {
    marginHorizontal: wp(1.9),
  },

  // Styles pour le tableau
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#E6E7E8",
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(2.9),
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

  scrollableArticleContainer: {
    flex: 1,
    maxHeight: hp(32.8),
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

  tableRow: {
    flexDirection: "row",
    paddingVertical: hp(0.9),
    paddingHorizontal: wp(2.9),
    borderBottomWidth: scale(1),
    borderBottomColor: "#F1F5F9",
    backgroundColor: "#FFFFFF",
    alignItems: "flex-start",
  },

  evenRow: {
    backgroundColor: "#F8FAFC",
  },

  codeColumn: {
    flex: 3,
    paddingRight: wp(1),
  },

  qteColumn: {
    flex: 2,
    alignItems: "flex-end",
    paddingHorizontal: wp(0.5),
  },

  designationCellText: {
    fontSize: fs(11),
    color: "#374151",
    lineHeight: fs(16),
    fontWeight: fontWeight.medium,
  },

  chargText: {
    fontSize: fs(10),
    color: "#6B7280",
    fontStyle: "italic",
    marginTop: hp(0.2),
    fontWeight: fontWeight.regular,
  },

  tableCellTextRight: {
    fontSize: fs(11),
    color: "#374151",
    textAlign: "right",
    fontWeight: fontWeight.medium,
  },

  positiveRemaining: {
    color: "#DC2626",
    fontWeight: fontWeight.semiBold,
  },

  negativeRemaining: {
    color: "#059669",
    fontWeight: fontWeight.semiBold,
  },

  actionsContainer: {
    paddingTop: hp(1.7),
    paddingHorizontal: wp(1.9),
  },

  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4.9),
    borderRadius: scale(10),
    backgroundColor: "#E0F2FE",
    borderWidth: scale(1),
    borderColor: "#0891B2",
  },

  disabledButton: {
    backgroundColor: "#F3F4F6",
    borderColor: "#D1D5DB",
  },

  actionButtonText: {
    color: "#0891B2",
    fontWeight: fontWeight.bold,
    marginLeft: wp(1.9),
    fontSize: fs(14),
    letterSpacing: 0.5,
  },

  // Styles pour les états de chargement et erreur
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },

  loaderText: {
    marginTop: hp(1.7),
    fontSize: fs(16),
    color: "#64748B",
    fontWeight: fontWeight.medium,
  },

  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: scale(24),
    backgroundColor: "#F8FAFC",
  },

  errorText: {
    marginTop: hp(1.7),
    fontSize: fs(16),
    color: "#DC2626",
    textAlign: "center",
    marginBottom: hp(2.6),
    fontWeight: fontWeight.medium,
  },

  retryButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: wp(5.8),
    paddingVertical: hp(1.3),
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
    padding: scale(24),
    backgroundColor: "#F8FAFC",
  },

  emptyText: {
    marginTop: hp(2.6),
    fontSize: fs(16),
    color: "#64748B",
    textAlign: "center",
    fontWeight: fontWeight.medium,
    lineHeight: fs(24),
  },
});

export default ReceptionListScreen;
