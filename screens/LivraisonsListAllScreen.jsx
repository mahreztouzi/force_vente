import React, {
  useLayoutEffect,
  useState,
  useEffect,
  useRef,
  useCallback,
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
  ScrollView,
} from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { BackHandler } from "react-native";
import {
  getAllOutbounds,
  processCreateBill,
  processValidationAndGoodsIssue,
} from "../redux/slices/outboundSlice";
import HeaderRightButton from "../components/HeaderRightButton";
import { Modalize } from "react-native-modalize";
import { isConnected } from "../utils/offlineUtils";

const { width, height } = Dimensions.get("window");
import { wp, hp, fs, fontWeight, scale } from "../utils/responsive";
import { generateA4InvoicePDF } from "../utils/pdf/pdfGenerators";

const LivraisonsAllListScreen = ({ route }) => {
  const navigation = useNavigation();
  const { client } = route.params;
  const dispatch = useDispatch();

  const userData = useSelector((state) => state.auth.user);

  const {
    allOutbounds: livraisonsList,
    loading,
    error,
  } = useSelector((state) => state.outbounds);

  const { isServerReachable } = useSelector((state) => state.offline);

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredLivraisons, setFilteredLivraisons] = useState([]);
  const [selectedLivraison, setSelectedLivraison] = useState(null);
  const [articlesLivraison, setArticlesLivraison] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [availableYears, setAvailableYears] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);
  const livraisonDetailModalizeRef = useRef(null);

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 4; i <= currentYear; i++) {
      years.push(i);
    }
    setAvailableYears(years);
  }, []);

  const handleYearChange = async (year) => {
    setSelectedYear(year);
    setShowYearPicker(false);

    const { startDateFormatted, endDateFormatted } = getMonthDateRange(
      year,
      selectedMonth,
    );

    await dispatch(
      getAllOutbounds({
        user: userData?.code,
        dateDebut: startDateFormatted,
        dateFin: endDateFormatted,
      }),
    );
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

  const getMonthDateRange = (year, month) => {
    const startDate = new Date(Date.UTC(year, month, 1));
    const endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

    const startDateFormatted = `${year}-${String(month + 1).padStart(
      2,
      "0",
    )}-01`;
    const endDateFormatted = `${year}-${String(month + 1).padStart(
      2,
      "0",
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

  const handleMonthChange = async (monthIndex) => {
    setSelectedMonth(monthIndex);
    setSelectedLivraison(null);

    const { startDateFormatted, endDateFormatted } = getMonthDateRange(
      selectedYear,
      monthIndex,
    );

    await dispatch(
      getAllOutbounds({
        user: userData?.code,
        dateDebut: startDateFormatted,
        dateFin: endDateFormatted,
      }),
    );
  };

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

  const statusOptions = [
    { key: "all", label: "Tous les statuts", color: "#757575" },
    { key: "initial", label: "En préparation", color: "#FF9800" },
    { key: "sortie", label: "Expédiée", color: "#2196F3" },
    { key: "facturé", label: "Facturée", color: "#4CAF50" },
  ];

  // Get current month name - memoized to avoid recalculation
  const currentMonthName = getMonthName(selectedMonth);
  // Set navigation header options
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <>
          <Text style={{ color: "white", fontSize: 16, fontWeight: "500" }}>
            Listes des livraisons
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
          link="livraison"
        />
      ),
    });
  }, [navigation, route.params, currentMonthName, selectedYear]);

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
    const { startDateFormatted, endDateFormatted } = getMonthDateRange(
      selectedYear,
      selectedMonth,
    );
    if (isServerReachable) {
      dispatch(
        getAllOutbounds({
          user: userData?.code,
          dateDebut: startDateFormatted,
          dateFin: endDateFormatted,
        }),
      );
    }
  }, [dispatch, userData?.code, selectedMonth, selectedYear]);

  useEffect(() => {
    const grouped = groupLivraisonsByDocument(
      livraisonsList.filter((livraison) => livraison.client === client?.kunnr),
    );

    let filtered = grouped;

    if (selectedStatus !== "all") {
      filtered = filtered.filter(
        (item) => item.staut_globale === selectedStatus,
      );
    }

    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(
        (item) =>
          item.num_doc.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.num_cmd.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.clientName &&
            item.clientName.toLowerCase().includes(searchQuery.toLowerCase())),
      );
    }

    setFilteredLivraisons(filtered);
  }, [livraisonsList, searchQuery, selectedStatus]);

  const convertirDateSAP = (dateSAP) => {
    const timestampMatch = dateSAP.match(/\/Date\((\d+)\)\//);

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

  const formatPrix = (prix) => {
    if (!prix || isNaN(prix)) return "0,00";
    return parseFloat(prix).toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const groupLivraisonsByDocument = (livraisonsList) => {
    const groupedObj = {};

    livraisonsList.forEach((item) => {
      const key = `${item.num_doc}-${item.commercial}-${item.client}`;

      if (!groupedObj[key]) {
        groupedObj[key] = {
          num_doc: item.num_doc,
          commercial: item.commercial,
          client: item.client,
          clientName: client?.name1,
          date_liv: convertirDateSAP(item.date_liv),
          num_cmd: item.num_cmd,
          staut_globale: item.staut_globale,
          articles: [],
          totalArticles: 0,
          totalQuantity: 0,
          montantTotal: 0,
        };
      }

      const quantite = parseFloat(item.qte) || 0;
      const prixUnitaire = parseFloat(item.prix_unitaire) || 0;
      const montantArticle = quantite * prixUnitaire;

      groupedObj[key].articles.push({
        num_poste: item.num_poste,
        article: item.article,
        designation_article:
          item.designation_article || `Article ${item.article}`,
        qte: quantite,
        unite: item.unite,
        lot: item.lot,
        prix_unitaire: prixUnitaire,
        montant: montantArticle,
      });

      groupedObj[key].totalArticles += 1;
      groupedObj[key].totalQuantity += quantite;
      groupedObj[key].montantTotal += montantArticle;
    });

    return Object.values(groupedObj);
  };

  const handleLivraisonPress = (livraison) => {
    setSelectedLivraison(livraison);
    setArticlesLivraison(livraison.articles);
    livraisonDetailModalizeRef.current?.open();
  };

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find((option) => option.key === status);
    return statusOption ? statusOption.color : "#757575";
  };

  const getStatusLabel = (status) => {
    const statusOption = statusOptions.find((option) => option.key === status);
    return statusOption ? statusOption.label : status;
  };

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
            data={availableYears}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.yearPickerButton,
                  selectedYear === item && styles.activeYearPicker,
                ]}
                onPress={() => handleYearChange(item)}
              >
                <Text
                  style={[
                    styles.yearPickerText,
                    selectedYear === item && styles.activeYearPickerText,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.yearPickerList}
          />
        </View>
      )}

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
              item.isCurrentMonth &&
                selectedMonth !== item.index &&
                styles.currentMonthFilter,
            ]}
            onPress={() => handleMonthChange(item.index)}
          >
            <Text
              style={[
                styles.monthFilterText,
                selectedMonth === item.index && styles.activeMonthFilterText,
                item.isCurrentMonth &&
                  selectedMonth !== item.index &&
                  styles.currentMonthText,
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

  const renderLivraisonItem = ({ item }) => (
    <TouchableOpacity
      style={styles.modernCard}
      onPress={() => handleLivraisonPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.cmdNumber}>{item.date_liv}</Text>
          <Text style={styles.dateText}>N°{item.num_doc}</Text>
          {/* <Text style={styles.vgbelText}>Commande N°: {item.num_cmd}</Text> */}
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: getStatusColor(item.staut_globale) + "20",
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: getStatusColor(item.staut_globale) },
            ]}
          />
          <Text
            style={[
              styles.statusBadgeText,
              { color: getStatusColor(item.staut_globale) },
            ]}
          >
            {getStatusLabel(item.staut_globale)}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.cardFooter}>
        <View style={styles.footerLeft}>
          <View style={styles.statItem}>
            <MaterialIcons name="inventory" size={16} color="#6B7280" />
            <Text style={styles.statText}>{item.totalArticles} articles</Text>
          </View>
          <View style={styles.statItem}>
            {/* <MaterialIcons name="attach-money" size={16} color="#6B7280" /> */}
            <Text style={styles.montantText}>
              {formatPrix(item.montantTotal)} DA
            </Text>
          </View>
        </View>

        <View style={styles.chevronContainer}>
          <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
        </View>
      </View>
    </TouchableOpacity>
  );

  const generateThermalPDFContent = (livraisonData) => {
    const currentDate = new Date().toLocaleDateString("fr-FR");
    const currentTime = new Date().toLocaleTimeString("fr-FR");

    // Calculer les totaux
    const totalItems = livraisonData.articles.length;
    const totalQuantity = livraisonData.articles.reduce(
      (sum, item) => sum + item.qte,
      0,
    );
    const totalPrice = livraisonData.montantTotal;

    return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bon de Livraison</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 2mm;
            }

            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              font-family: 'Courier New', monospace;
              font-size: 20px;
              line-height: 1.2;
              width: 76mm;
              color: #000;
              background: white;
            }

            .receipt-container {
              width: 100%;
              padding: 2mm;
            }

            .header {
              text-align: center;
              border-bottom: 1px dashed #000;
              padding-bottom: 3mm;
              margin-bottom: 3mm;
            }

            .company-name {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 1mm;
            }

            .document-title {
              font-size: 20px;
              font-weight: bold;
              margin: 2mm 0;
              text-transform: uppercase;
            }

            .delivery-number {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 1mm;
            }

            .info-section {
              margin: 3mm 0;
              font-size: 16px;
            }

            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 1mm;
              align-items: flex-start;
            }

            .info-label {
              font-weight: bold;
              min-width: 25mm;
              font-size: 16px;
            }

            .info-value {
              text-align: right;
              flex: 1;
              word-wrap: break-word;
              font-size: 16px;
            }

            .separator {
              border-top: 1px dashed #000;
              margin: 3mm 0;
            }

            .items-header {
              font-weight: bold;
              border-bottom: 1px solid #000;
              padding: 1mm 0;
              margin-bottom: 2mm;
              font-size: 14px;
            }

            .item-row {
              margin-bottom: 2mm;
              padding-bottom: 2mm;
              font-size: 12px;
              font-weight: bold;
            }

            .item-code {
              font-weight: bold;
              margin-bottom: 0.5mm;
              font-size: 12px;
            }

            .item-desc {
              margin-bottom: 1mm;
              word-wrap: break-word;
              font-size: 12px;
            }

            .details-container {
              display: flex;
              flex-direction: column;
              align-items: flex-end;
              margin-top: 1mm;
            }

            .separator-article {
              border-top: 1px dashed #000;
              margin-bottom: 1mm;
            }

            .separator-details {
              border-top: 1px solid #000;
              margin-bottom: 1mm;
              width: 65%;
            }

            .item-details {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 10px;
              font-weight: bold;
              color: black;
              margin-bottom: 0.5mm;
              width: 65%;
            }

            .item-lot {
              color: black;
              font-style: italic;
              margin-bottom: 0.5mm;
            }

            .quantity-box {
              text-align: left;
              font-weight: bold;
              font-size: 10px;
            }

            .quantity-box-val {
              text-align: right;
              font-weight: bold;
              font-size: 10px;
            }

            .totals {
              border-top: 1px solid #000;
              padding-top: 2mm;
              margin-top: 3mm;
            }

            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 1mm;
              font-weight: bold;
              font-size: 16px;
              color: black;
            }

            .footer {
              text-align: center;
              margin-top: 5mm;
              padding-top: 3mm;
              border-top: 1px dashed #000;
              font-size: 22px;
            }

            .signature-section {
              margin-top: 5mm;
              text-align: center;
            }

            .signature-line {
              border-top: 1px solid #000;
              width: 30mm;
              margin: 10mm auto 2mm auto;
            }

            .signature-label {
              font-size: 16px;
              color: #666;
            }

            @media print {
              body {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <!-- En-tête -->
            <div class="header">
              <div class="document-title">Bon de Facture</div>
              <div class="delivery-number">N° ${livraisonData.num_doc}</div>
            </div>

            <!-- Informations générales -->
            <div class="info-section">
              <div class="info-row">
                <span class="info-label">Date:</span>
                <span class="info-value">${currentDate}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Heure:</span>
                <span class="info-value">${currentTime}</span>
              </div>
                 <!--       
                 <div class="info-row">
                   <span class="info-label">Commande:</span>
                   <span class="info-value">${livraisonData.num_cmd}</span>
                 </div>
                 -->
              <div class="info-row">
                <span class="info-label">Client:</span>
                <span class="info-value">${livraisonData.client}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Nom:</span>
                <span class="info-value">${
                  livraisonData.clientName || "N/A"
                }</span>
              </div>
              <div class="info-row">
                <span class="info-label">Livreur:</span>
                <span class="info-value">${userData?.magasin}</span>
              </div>
            </div>

            <div class="separator"></div>

            <!-- Articles -->
            <div class="items-header">ARTICLES LIVRES</div>

            ${livraisonData.articles
              .map(
                (item, index) => `
                <div class="item-row">
              ${index !== 0 ? '<div class="separator-article"></div>' : ""}

                  <div class="item-code">${item.article}</div>
                  <div class="item-desc">${item.designation_article}</div>
                  <div class="details-container">
                    <div class="separator-details"></div>
                    <div class="item-details">
                      <span class="quantity-box">Qté livrée :</span>
                      <span class="quantity-box-val">${item.qte} ${
                        item.unite
                      }</span>
                    </div>
                    <div class="item-details">
                      <span class="quantity-box">Prix unitaire :</span>
                      <span class="quantity-box-val">${(
                        item.prix_unitaire || 0
                      ).toFixed(2)} DA</span>
                    </div>
                    ${
                      item.lot
                        ? `
                    <div class="item-details">
                      <span class="quantity-box">Lot :</span>
                      <span class="quantity-box-val">${item.lot}</span>
                    </div>
                    `
                        : ""
                    }
                  </div>
                </div>
              `,
              )
              .join("")}

            <!-- Totaux -->
            <div class="totals">
              <div class="total-row">
                <span>Total :</span>
                <span>${totalPrice.toFixed(2)} DA</span>
              </div>
            </div>

            <!-- Pied de page -->
            <div class="footer">
              <div>Merci pour votre confiance</div>
            </div>
          </div>
        </body>
        </html>
      `;
  };

  // const handlePrintLivraison = async (livraison) => {
  //   try {
  //     const htmlContent = generateThermalPDFContent(livraison);
  //     livraisonDetailModalizeRef.current?.close();
  //     console.log("livraison dans list all livraison", livraison);
  //     navigation.navigate("PDFViewerScreen", {
  //       htmlContent: htmlContent,
  //       deliveryId: livraison.num_doc,
  //       documentType: "livraison",
  //       orderData: {
  //         cmd: livraison.num_cmd,
  //         client: livraison.client,
  //         clientName: livraison.clientName || "N/A",
  //       },
  //       deliveryItems: livraison.articles,
  //       userData: userData,
  //       livraisonData: livraison,
  //       clientData: client,
  //     });
  //   } catch (error) {
  //     console.error("Erreur lors de la préparation de l'impression:", error);
  //     Alert.alert(
  //       "Erreur d'impression",
  //       "Impossible de préparer le document pour l'impression. Veuillez réessayer.",
  //       [{ text: "OK" }]
  //     );
  //   }
  // };

  const handlePrintLivraison = async (livraison) => {
    try {
      // Transformation des données de livraison au format requis
      const transformedData = {
        numero: livraison.num_doc,
        date: new Date().toLocaleDateString("fr-FR"),
        heure: new Date().toLocaleTimeString("fr-FR"), // Heure actuelle si pas disponible
        clientId: livraison.client,
        clientNom: livraison.clientName || "N/A",
        livreur: userData?.magasin, // Ou utilisez une autre valeur appropriée
        articles: livraison.articles.map((article) => ({
          code: article.article,
          description: article.designation_article,
          quantite: article.qte.toString(),
          unite: article.unite,
          lot: article.lot || "-",
          prixUnitaire: article.prix_unitaire || 0,
          prix: article.prix_unitaire.toLocaleString("fr-DZ", {
            style: "currency",
            currency: "DZD",
            minimumFractionDigits: 2,
          }),
        })),
        totalMontant: livraison.montantTotal || 0,
        total: livraison.montantTotal
          ? livraison.montantTotal.toLocaleString("fr-DZ", {
              style: "currency",
              currency: "DZD",
              minimumFractionDigits: 2,
            })
          : "0,00 DA",
      };

      console.log("Données transformées:", transformedData);

      const htmlContent = generateThermalPDFContent(livraison);
      const htmlContentPDFA4 = generateA4InvoicePDF(transformedData);
      livraisonDetailModalizeRef.current?.close();

      navigation.navigate("PDFViewerScreen", {
        htmlContent: htmlContentPDFA4,
        htmlContentThermal: htmlContent,
        deliveryId: livraison.num_doc,
        documentType: "livraison",
        orderData: {
          cmd: livraison.num_cmd,
          client: livraison.client,
          clientName: livraison.clientName || "N/A",
        },
        deliveryItems: livraison.articles,
        userData: userData,
        deliveryData: transformedData, // Utiliser les données transformées
        clientData: client,
      });
    } catch (error) {
      console.error("Erreur lors de la préparation de l'impression:", error);
      Alert.alert(
        "Erreur d'impression",
        "Impossible de préparer le document pour l'impression. Veuillez réessayer.",
        [{ text: "OK" }],
      );
    }
  };

  const getProcessButtonConfig = (statut) => {
    const statutLower = statut?.toLowerCase();

    switch (statutLower) {
      case "initial":
        return {
          title: "Expédier",
          icon: "local-shipping",
          show: true,
        };
      case "sortie":
        return {
          title: "Facturer",
          icon: "receipt",
          show: true,
        };
      default:
        return {
          show: false,
        };
    }
  };

  // Fonction handleProcessLivraison modifiée avec loading
  const handleProcessLivraison = async (livraison) => {
    try {
      setIsProcessing(true);

      const isFullyConnected = await isConnected();

      if (!isFullyConnected) {
        Alert.alert(
          "Erreur de connexion",
          `Veuillez vérifier votre connexion internet et réessayer.`,
          [{ text: "OK" }],
        );
        return;
      }

      const statut = livraison.staut_globale?.toLowerCase();

      if (statut === "initial") {
        const deliveryDocument = livraison.num_doc;
        const deliveryItems = livraison.articles.map((article) => ({
          ReferenceSDDocumentItem: article.num_poste,
          ActualDeliveryQuantity: article.qte,
        }));

        const result = await dispatch(
          processValidationAndGoodsIssue({
            deliveryDocument,
            deliveryItems,
          }),
        ).unwrap();
        const { startDateFormatted, endDateFormatted } = getMonthDateRange(
          selectedYear,
          selectedMonth,
        );
        if (isServerReachable) {
          dispatch(
            getAllOutbounds({
              user: userData?.code,
              dateDebut: startDateFormatted,
              dateFin: endDateFormatted,
            }),
          );
        }
      } else if (statut === "sortie") {
        console.log(
          "📦 Statut expédié détecté - Lancement de la création de facture",
        );

        const deliveryDocument = livraison.num_doc;

        const result = await dispatch(
          processCreateBill({
            deliveryDocument,
          }),
        ).unwrap();

        const { startDateFormatted, endDateFormatted } = getMonthDateRange(
          selectedYear,
          selectedMonth,
        );
        if (isServerReachable) {
          dispatch(
            getAllOutbounds({
              user: userData?.code,
              dateDebut: startDateFormatted,
              dateFin: endDateFormatted,
            }),
          );
        }
      } else {
        console.log(
          `ℹ️ Statut '${statut}' - Aucune action définie pour ce statut`,
        );
        Alert.alert(
          "Information",
          `Aucune action disponible pour le statut: ${livraison.staut_globale}`,
          [{ text: "OK" }],
        );
      }
    } catch (error) {
      // console.error("❌ Erreur lors du traitement de la livraison:", error);

      let errorMessage = "Une erreur est survenue lors du traitement.";

      if (error?.step === "validation_sortie") {
        errorMessage = error?.error?.message;
      } else if (error?.step === "facture") {
        errorMessage =
          error?.error || "Erreur lors de la création de la facture.";
      }

      Alert.alert("Erreur de traitement", errorMessage, [{ text: "OK" }]);
    } finally {
      setIsProcessing(false);
      livraisonDetailModalizeRef.current?.close();
      setShowScrollToTop(false);
    }
  };
  const handleRefresh = () => {
    const { startDateFormatted, endDateFormatted } = getMonthDateRange(
      selectedYear,
      selectedMonth,
    );
    if (isServerReachable) {
      dispatch(
        getAllOutbounds({
          user: userData?.code,
          dateDebut: startDateFormatted,
          dateFin: endDateFormatted,
        }),
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#03A9F4" barStyle="light-content" />

      {renderStatusFilter()}
      {isServerReachable && renderMonthFilter()}

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={24} color="#757575" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une livraison..."
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

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#03A9F4" />
          <Text style={styles.loaderText}>Chargement des livraisons...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#e53935" />
          <Text style={styles.errorText}>Erreur: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : filteredLivraisons.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="truck-delivery-outline"
            size={64}
            color="#E0E0E0"
          />
          <Text style={styles.emptyText}>
            {searchQuery.trim() !== "" || selectedStatus !== "all"
              ? "Aucune livraison ne correspond à vos critères"
              : "Aucune livraison trouvée"}
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={filteredLivraisons}
          renderItem={renderLivraisonItem}
          keyExtractor={(item) => `${item.num_doc}-${item.client}`}
          contentContainerStyle={styles.livraisonsList}
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

      {showScrollToTop && (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={scrollToTop}
          activeOpacity={0.8}
        >
          <MaterialIcons name="keyboard-arrow-up" size={28} color="white" />
        </TouchableOpacity>
      )}

      {/* Modalize pour les détails de la livraison */}
      <Modalize
        ref={livraisonDetailModalizeRef}
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
        {selectedLivraison && (
          <View style={styles.modalContent}>
            <View style={styles.commandeDetails}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={styles.commandeClient}>
                  {selectedLivraison?.clientName}
                </Text>
                <TouchableOpacity
                  onPress={() => livraisonDetailModalizeRef.current?.close()}
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
                <Text style={styles.commandeReference}>
                  Commande N°: {selectedLivraison.num_cmd}
                </Text>
                <Text style={styles.commandeDate}>
                  {selectedLivraison?.date_liv}
                </Text>
              </View>
            </View>

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
                {articlesLivraison.length} article(s)
              </Text>

              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.codeColumn]}>
                  Code/Désignation
                </Text>
                <Text style={[styles.tableHeaderRightText, styles.qteColumn]}>
                  Qté
                </Text>
                <Text style={[styles.tableHeaderRightText, styles.qteColumn]}>
                  P.U.
                </Text>
              </View>

              <ScrollView
                style={styles.scrollableArticleContainer}
                contentContainerStyle={styles.articleContainer}
              >
                {articlesLivraison.map((article, index) => (
                  <View
                    key={`${article.article}-${index}`}
                    style={[styles.tableRow, index % 2 === 0 && styles.evenRow]}
                  >
                    <View style={styles.codeColumn}>
                      <Text style={styles.designationCellText}>
                        {article.article}
                      </Text>
                      <Text
                        style={styles.designationCellText}
                        numberOfLines={10}
                      >
                        {article.designation_article}
                      </Text>
                      {article.lot && (
                        <Text style={styles.chargText}>{article.lot}</Text>
                      )}
                    </View>

                    <View style={styles.qteColumn}>
                      <Text style={styles.tableCellTextRight}>
                        {parseFloat(article.qte).toFixed(2)} {article.unite}
                      </Text>
                    </View>

                    <View style={styles.qteColumn}>
                      <Text style={styles.tableCellTextRight}>
                        {formatPrix(article.prix_unitaire)} DA
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>

              {/* <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalAmount}>
                  {formatPrix(selectedLivraison.montantTotal)} DA
                </Text>
              </View> */}

              {/* <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.printButton]}
                  onPress={() => handlePrintLivraison(selectedLivraison)}
                >
                  <MaterialIcons name="print" size={20} color="#0891B2" />
                  <Text style={styles.actionButtonText}>Imprimer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.printButton]}
                  onPress={() => handleProcessLivraison(selectedLivraison)}
                >
                  <MaterialIcons name="print" size={20} color="#0891B2" />
                  <Text style={styles.actionButtonText}>Imprimer</Text>
                </TouchableOpacity>
              </View> */}
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.printButton]}
                  onPress={() => handlePrintLivraison(selectedLivraison)}
                >
                  <MaterialIcons name="print" size={20} color="#0891B2" />
                  <Text style={styles.actionButtonText}>Imprimer</Text>
                </TouchableOpacity>

                {(() => {
                  const buttonConfig = getProcessButtonConfig(
                    selectedLivraison?.staut_globale,
                  );

                  // Ne pas afficher le bouton si show est false
                  if (!buttonConfig.show || !isServerReachable) return null;

                  return (
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        styles.processButton,
                        isProcessing && styles.disabledButton,
                      ]}
                      onPress={() => handleProcessLivraison(selectedLivraison)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <ActivityIndicator size="small" color="#0891B2" />
                          <Text style={styles.actionButtonText}>
                            {buttonConfig.title === "Expédier"
                              ? "Expédition..."
                              : "Facturation..."}
                          </Text>
                        </>
                      ) : (
                        <>
                          <MaterialIcons
                            name={buttonConfig.icon}
                            size={20}
                            color="#0891B2"
                          />
                          <Text style={styles.actionButtonText}>
                            {buttonConfig.title}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  );
                })()}
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
    paddingHorizontal: wp(3.9), // 16px -> 3.9%
    paddingTop: wp(3.9),
    paddingBottom: wp(5.8), // 24px -> 5.8%
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
    padding: wp(3.9), // 16px -> 3.9%
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
    padding: wp(3.9),
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
    padding: wp(5.8), // 24px -> 5.8%
    backgroundColor: "#F8FAFC",
  },

  errorText: {
    marginTop: scale(16),
    fontSize: fs(16),
    color: "#DC2626",
    textAlign: "center",
    marginBottom: wp(5.8),
    fontWeight: fontWeight.medium,
  },

  retryButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: wp(5.8),
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
    padding: wp(5.8),
    backgroundColor: "#F8FAFC",
  },

  emptyText: {
    marginTop: wp(5.8),
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
    paddingBottom: wp(5.8),
    flex: 1,
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
    paddingVertical: scale(16),
    paddingHorizontal: scale(12),
    borderBottomWidth: scale(1),
    borderBottomColor: "#F1F5F9",
    backgroundColor: "#FFFFFF",
    minHeight: scale(60),
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

  chargText: {
    fontSize: fs(10),
    color: "#888",
    lineHeight: scale(16),
    fontWeight: fontWeight.medium,
    fontStyle: "italic",
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
    paddingVertical: scale(14),
    paddingHorizontal: wp(4.9), // 20px -> 4.9%
    borderRadius: scale(10),
    backgroundColor: "#E0F2FE",
    borderWidth: scale(1),
    borderColor: "#0891B2",
    flex: 1,
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
    padding: wp(5.8),
    backgroundColor: "#FFFFFF",
    borderTopRightRadius: scale(8),
    borderTopLeftRadius: scale(8),
  },

  actionModalTitle: {
    fontSize: fs(20),
    fontWeight: fontWeight.bold,
    marginBottom: wp(5.8),
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
    padding: wp(7.8), // 32px -> 7.8%
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
    paddingHorizontal: wp(3.9),
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
    right: wp(3.9),
    bottom: wp(3.9),
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
    paddingHorizontal: wp(3.9),
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
    padding: wp(3.9),
  },

  quantityModal: {
    padding: wp(3.9),
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
    maxHeight: scale(300),
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
    padding: wp(3.9),
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
    paddingTop: wp(3.9),
    paddingHorizontal: scale(8),
    flexDirection: "row",
    gap: scale(10),
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
    padding: wp(3.9),
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
    paddingHorizontal: wp(3.9),
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
    paddingHorizontal: wp(3.9),
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
    paddingHorizontal: wp(3.9),
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
    marginHorizontal: wp(3.9),
  },

  monthFilterTitle: {
    fontSize: fs(14),
    fontWeight: fontWeight.semiBold,
    color: "#424242",
  },

  yearPickerContainer: {
    paddingVertical: scale(8),
    marginHorizontal: wp(3.9),
    borderRadius: scale(8),
    marginBottom: scale(8),
  },

  yearPickerList: {
    paddingHorizontal: scale(8),
  },

  yearPickerButton: {
    paddingHorizontal: wp(3.9),
    paddingVertical: scale(8),
    borderRadius: scale(16),
    marginRight: scale(8),
    backgroundColor: "white",
    borderWidth: scale(1),
    borderColor: "#E9ECEF",
  },

  activeYearPicker: {
    backgroundColor: "#03A9F4",
    borderColor: "#03A9F4",
  },

  yearPickerText: {
    fontSize: fs(14),
    fontWeight: fontWeight.semiBold,
    color: "#6C757D",
  },

  activeYearPickerText: {
    color: "white",
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

  livraisonsList: {
    paddingHorizontal: scale(12),
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

  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#E6E7E8",
    padding: scale(12),
    borderRadius: scale(8),
  },

  totalLabel: {
    fontSize: fs(14),
    fontWeight: fontWeight.semiBold,
    color: "#2E7D32",
  },

  totalAmount: {
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
    color: "#2E7D32",
  },

  disabledButton: {
    opacity: 0.6,
  },
});

export default LivraisonsAllListScreen;
