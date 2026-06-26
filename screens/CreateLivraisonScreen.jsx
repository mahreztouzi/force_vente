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
} from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Modalize } from "react-native-modalize";
import { useDispatch, useSelector } from "react-redux";
import {
  addOutbound,
  createDelivery,
  getAutorisedDate,
  issueGoods,
  processDeliveryComplete,
  resetDeliveryProcess,
  resetoutboundstate,
  validateDelivery,
} from "../redux/slices/outboundSlice";
import { getCommandesApprouves } from "../redux/slices/orderSlice";

import { getstocks } from "../redux/slices/stockSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { BackHandler } from "react-native";
import DeliveryProcessModal from "../components/DeliveryProcessModal";
import {
  selectDeliveryProcess,
  startDeliveryProcess,
} from "../redux/slices/processDeliverySlice";
import { loadOfflineLivraisons } from "../redux/slices/offlineSlice";
import { wp, hp, fs, fontWeight, scale } from "../utils/responsive";
import {
  generateA4InvoicePDF,
  generateThermalPDFContent,
} from "../utils/pdf/pdfGenerators";

export const CreateLivraisonScreen = ({ route }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { order, client } = route.params;
  const {
    loading: livraisonLoading,
    error: livraisonError,
    success: livraisonSuccess,
    dateAutorise,
  } = useSelector((state) => state.outbounds);
  const { stocks, loadingStocks } = useSelector((state) => state.stock);
  const userData = useSelector((state) => state.auth.user);

  const deliveryProcess = useSelector(
    (state) => state.deliveries.deliveryProcess,
  );

  const { isServerReachable } = useSelector((state) => state.offline);
  const isProcessing = deliveryProcess?.isProcessing || false;
  const isComplete = deliveryProcess?.isComplete || false;

  const [livraisonItems, setLivraisonItems] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [quantity, setQuantity] = useState("1");
  // Ajoutez cet état dans vos autres déclarations d'état
  const [stockInfo, setStockInfo] = useState({});
  const [isDateAuthorized, setIsDateAuthorized] = useState(true);
  const [isDateChecked, setIsDateChecked] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);

  // Référence pour le modal de quantité
  const quantityModalizeRef = useRef(null);
  // Nouvelle référence pour le modal d'impression
  const printModalizeRef = useRef(null);
  const processModalRef = useRef(null);
  // État pour suivre la dernière livraison créée
  const [createdDeliveryId, setCreatedDeliveryId] = useState(null);
  // retour en arriere
  useEffect(() => {
    const handleBackPress = async () => {
      // Si le processus est en cours, BLOQUER complètement
      if (isProcessing) {
        console.log("🚫 Navigation bloquée - Processus en cours");
        return true; // Bloque la navigation
      }

      // Si la modal de processus est ouverte mais processus terminé
      if (showProcessModal && isComplete) {
        handleCloseModal();
        return true;
      }

      // Si la modal de processus est ouverte mais pas encore démarrée
      if (showProcessModal) {
        handleCloseModal();
        return true;
      }

      // Autres modals...
      if (quantityModalizeRef.current?.isOpen) {
        quantityModalizeRef.current?.close();
        return true;
      }

      if (printModalizeRef.current?.isOpen) {
        printModalizeRef.current?.close();
        return true;
      }

      // Navigation normale
      await dispatch(resetoutboundstate());
      navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress,
    );

    return () => backHandler.remove();
  }, [navigation, showProcessModal, isProcessing, isComplete]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: `Livraison de la commande n° ${order.cmd}`,
      headerStyle: {
        backgroundColor: "#03A9F4",
      },
      headerTintColor: "white",
      headerLeft: () => (
        <MaterialCommunityIcons
          name="arrow-left-circle"
          size={30}
          color="white"
          style={{ marginLeft: 15 }}
          onPress={() => {
            if (showProcessModal) return; // Bloque l'action si la modal est ouverte
            navigation.goBack();
            dispatch(resetoutboundstate());
          }}
        />
      ),
    });
  }, [navigation, order, showProcessModal]);

  useEffect(() => {
    if (isServerReachable) {
      dispatch(getstocks({ magasin: userData?.magasin }));
    }
  }, [dispatch, isServerReachable]);

  // verifié si les dates ouvrantes sont autorisé transaction mmpv / ob52
  useEffect(() => {
    dispatch(resetoutboundstate());
    dispatch(resetDeliveryProcess());
  }, [dispatch, order.codeSociete]);

  useEffect(() => {
    if (stocks && stocks.length > 0) {
      const stockData = {};

      // Organiser les stocks par article et par lot
      stocks.forEach((item) => {
        if (!stockData[item.Material]) {
          stockData[item.Material] = {
            AvailableStock: parseFloat(item.AvailableStock),
            BaseUnitOfMeasure: item.BaseUnitOfMeasure,
            MaterialDescription: item.MaterialDescription,
            // Créer un objet pour stocker les informations de stock par lot
            lotDetails: {},
          };
        }

        // Ajouter les détails du lot
        stockData[item.Material].lotDetails[item.lot] = {
          lot: item.lot,
          AvailableStockByLot: parseFloat(item.AvailableStockByLot),
        };
      });

      setStockInfo(stockData);
    }
  }, [stocks]);

  useEffect(() => {
    // Initialiser les articles disponibles à la livraison
    const availableItems = order.articles
      .filter((article) => parseFloat(article.qte_restante) > 0)
      .map((article) => ({
        id: article.matnr,
        posnr: article.posnr,
        charg: article.charg,
        designation: article.designation,
        unite: article.kmein,
        kbetr: article.kbetr,
        qteCommandee: parseFloat(article.lsmeng),
        qteRestante: parseFloat(article.qte_restante),
        qteALivrer: 0,
      }));

    setLivraisonItems(availableItems);
  }, [order]);

  useEffect(() => {
    if (livraisonSuccess) {
      // Ouvrir le modal d'impression
      const timer = setTimeout(() => {
        printModalizeRef.current?.open();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [livraisonSuccess, dispatch]);

  const handleArticleSelect = (article) => {
    setSelectedArticle(article);
    quantityModalizeRef.current?.open();
  };

  // Nouvelle fonction pour sélectionner tous les articles disponibles en stock

  const handleQuantityConfirm = () => {
    const qte = parseFloat(quantity);
    const stockItem = stockInfo[selectedArticle.id];
    const hasLot =
      selectedArticle.charg && stockItem?.lotDetails?.[selectedArticle.charg];
    const lotStock = hasLot
      ? stockItem.lotDetails[selectedArticle.charg].AvailableStockByLot || 0
      : stockItem?.AvailableStock || 0;

    // Utiliser le stock par lot plutôt que le stock total
    const stockQuantity = lotStock;

    if (isNaN(qte) || qte <= 0) {
      Alert.alert("Erreur", "Veuillez entrer une quantité valide");
      return;
    }

    if (qte > selectedArticle.qteRestante) {
      Alert.alert(
        "Erreur",
        "La quantité ne peut pas dépasser la quantité restante",
      );
      return;
    }

    if (qte > stockQuantity) {
      Alert.alert(
        "Erreur",
        "La quantité ne peut pas dépasser le stock disponible",
      );
      return;
    }

    // Mettre à jour la quantité à livrer
    const updatedItems = livraisonItems.map((item) => {
      if (
        item.id === selectedArticle.id &&
        item.posnr === selectedArticle.posnr
      ) {
        return { ...item, qteALivrer: qte };
      }
      return item;
    });

    setLivraisonItems(updatedItems);
    quantityModalizeRef.current?.close();
    setQuantity("1");
    setSelectedArticle(null);
  };

  const handleSelectAll = () => {
    if (loadingStocks) {
      Alert.alert(
        "Chargement en cours",
        "Veuillez attendre le chargement des stocks",
      );
      return;
    }

    const updatedItems = livraisonItems.map((item) => {
      // Récupérer le stock disponible pour cet article ET ce lot spécifique
      const stockItem = stockInfo[item.id];
      const hasLot = item.charg && stockItem?.lotDetails?.[item.charg];
      const lotStock = hasLot
        ? stockItem.lotDetails[item.charg].AvailableStockByLot || 0
        : stockItem?.AvailableStock || 0;
      // const lotStock =
      //   stockItem?.lotDetails[item.charg]?.AvailableStockByLot || 0;
      const stockQuantity = lotStock;

      // Calculer la quantité à livrer (min entre stock disponible et quantité restante)
      if (stockQuantity > 0) {
        const newQte = Math.min(stockQuantity, item.qteRestante);
        return { ...item, qteALivrer: newQte };
      }
      return item;
    });

    setLivraisonItems(updatedItems);
  };

  const handleDeselectArticle = (article) => {
    if (article.qteALivrer > 0) {
      const updatedItems = livraisonItems.map((item) => {
        if (item.id === article.id && item.posnr === article.posnr) {
          return { ...item, qteALivrer: 0 };
        }
        return item;
      });

      setLivraisonItems(updatedItems);
    }
  };

  const handleSaveLivraison = async () => {
    const itemsToDeliver = livraisonItems.filter((item) => item.qteALivrer > 0);

    if (itemsToDeliver.length === 0) {
      Alert.alert("Erreur", "Veuillez spécifier au moins un article à livrer");
      return;
    }

    // Préparer les données de livraison
    const livraisonData = {
      to_DeliveryDocumentItem: {
        results: itemsToDeliver.map((item) => ({
          ReferenceSDDocument: order.cmd,
          ReferenceSDDocumentItem: item.posnr,
          ActualDeliveryQuantity: item.qteALivrer.toString(),
          DeliveryQuantityUnit: item.unite,
        })),
      },
    };
    setShowProcessModal(true);
    try {
      // Réinitialiser l'état du processus
      await dispatch(resetDeliveryProcess());
      // dispatch(startDeliveryProcess());
      // Ouvrir le modal de suivi
      processModalRef.current?.open();

      // Lancer le processus de livraison complet
      const result = await dispatch(
        processDeliveryComplete({
          deliveryData: livraisonData,
        }),
      );

      if (
        result.type === "outbound/deliveries/processDeliveryComplete/fulfilled"
      ) {
        console.log("Processus de livraison terminé avec succès", result);
        setCreatedDeliveryId(result.payload.deliveryDocument);
        // Si c'est un processus offline, on peut fermer le modal automatiquement après un délai
        // if (result.payload.offline) {
        //   setTimeout(() => {
        //     processModalRef.current?.close();
        //   }, 2000);
        // }
        if (result.payload.offline) {
          dispatch(loadOfflineLivraisons(client));
        }
      } else if (
        result.type === "outbound/deliveries/processDeliveryComplete/rejected"
      ) {
        console.error("Erreur dans le processus de livraison:", result.payload);
        Alert.alert(
          "Erreur",
          result.payload?.steps?.creation?.error ||
            "Une erreur s'est produite lors de la livraison",
        );
      }
    } catch (error) {
      console.error("Erreur générale dans handleSaveLivraison:", error);
      Alert.alert("Erreur", "Une erreur inattendue s'est produite");
      processModalRef.current?.close();
    } finally {
      if (isServerReachable) {
        await dispatch(getCommandesApprouves({ user: userData?.code }));
        await dispatch(getstocks({ magasin: userData?.magasin }));
      }
      setShowProcessModal(false);
    }
  };

  const cleanupAndNavigateBack = () => {
    // Fermer le modal sans réinitialiser l'état
    printModalizeRef.current?.close();

    // Naviguer vers l'écran de liste des commandes ou l'écran précédent
    navigation.goBack();

    // Réinitialiser l'état après la navigation
    setTimeout(() => {
      dispatch(resetoutboundstate());
    }, 500);
  };

  const renderLivraisonItem = ({ item }) => {
    if (loadingStocks) {
      return (
        <View style={styles.livraisonItem}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemId}>{item.id}</Text>
          </View>
          <Text style={styles.itemName}>
            {item.designation} - Lot: {item.charg}
          </Text>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#03A9F4" />
            <Text style={styles.loadingText}>Chargement du stock...</Text>
          </View>
        </View>
      );
    }

    const stockItem = stockInfo[item.id];
    // const hasLot = item.charg && stockItem?.lotDetails?.[item.charg];
    // const stockQuantity = hasLot
    //   ? stockItem.lotDetails[item.charg].AvailableStockByLot || 0
    //   : stockItem?.AvailableStock || 0;

    const hasLot = item.charg && stockItem?.lotDetails?.[item.charg];

    const stockQuantity = item.charg
      ? hasLot
        ? stockItem.lotDetails[item.charg].AvailableStockByLot
        : 0 // Article géré par lot
      : stockItem?.AvailableStock || 0;

    // Déterminer l'état du stock
    const isInStock = stockQuantity > 0;
    const isStockSufficient = stockQuantity >= item.qteRestante;
    const isStockInsufficient =
      stockQuantity > 0 && stockQuantity < item.qteRestante;

    // Déterminer le style selon l'état
    const getItemStyle = () => {
      if (!isInStock) return styles.outOfStockItem; // Rouge
      if (isStockInsufficient) {
        return item.qteALivrer > 0
          ? styles.insufficientStockSelectedItem
          : styles.insufficientStockItem; // Orange / Orange foncé
      }
      return item.qteALivrer > 0 ? styles.selectedItem : null; // Vert / Normal
    };

    return (
      <TouchableOpacity
        style={[styles.livraisonItem, getItemStyle()]}
        onPress={() =>
          isInStock
            ? handleArticleSelect(item)
            : Alert.alert(
                "Stock insuffisant",
                "Cet article n'est pas disponible en stock.",
              )
        }
        disabled={!isInStock}
      >
        <View style={styles.itemHeader}>
          <View style={styles.headerActions}>
            {item.qteALivrer > 0 && (
              <MaterialIcons name="check-circle" size={18} color="#4CAF50" />
            )}
            <Text style={styles.itemId}>{item.id}</Text>
          </View>
          {item.qteALivrer > 0 && (
            <TouchableOpacity
              onPress={() => handleDeselectArticle(item)}
              style={styles.deselectButton}
            >
              <MaterialIcons name="close" size={22} color="#F44336" />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.itemName}>
          {item.designation} - Lot: {item.charg}
        </Text>

        <View style={styles.qtyContainer}>
          <View style={styles.qtySection}>
            <Text style={styles.qtyLabel}>Commandée:</Text>
            <Text style={styles.qtyValue}>
              {item.qteCommandee} {item.unite}
            </Text>
          </View>

          <View style={styles.qtySection}>
            <Text style={styles.qtyLabel}>Restante:</Text>
            <Text style={styles.qtyValue}>
              {item.qteRestante} {item.unite}
            </Text>
          </View>

          <View style={styles.qtySection}>
            <Text style={styles.qtyLabel}>Stock:</Text>
            <Text
              style={[
                styles.qtyValue,
                !isInStock
                  ? styles.redText
                  : isStockInsufficient
                    ? styles.orangeText
                    : styles.greenText,
              ]}
            >
              {stockQuantity} {item.unite}
            </Text>
          </View>

          <View style={styles.qtySection}>
            <Text style={styles.qtyLabel}>À livrer:</Text>
            <Text
              style={[
                styles.qtyValue,
                item.qteALivrer > 0 ? styles.greenText : styles.grayText,
              ]}
            >
              {item.qteALivrer > 0
                ? `${item.qteALivrer} ${item.unite}`
                : "Non défini"}
            </Text>
          </View>
        </View>

        {item.qteALivrer === 0 && isInStock ? (
          <View style={styles.actionPrompt}>
            <MaterialIcons
              name="add-circle-outline"
              size={20}
              color="#03A9F4"
            />
            <Text style={styles.actionText}>
              {isStockInsufficient
                ? "Stock insuffisant - Appuyez pour définir la quantité disponible"
                : "Appuyez pour définir la quantité à livrer"}
            </Text>
          </View>
        ) : !isInStock ? (
          <View style={styles.actionPrompt}>
            <MaterialIcons name="error-outline" size={20} color="#F44336" />
            <Text style={[styles.actionText, styles.redText]}>
              Stock insuffisant
            </Text>
          </View>
        ) : isStockInsufficient ? (
          <View style={styles.actionPrompt}>
            <MaterialIcons name="warning" size={20} color="#FF9800" />
            <Text style={[styles.actionText, styles.orangeText]}>
              Stock insuffisant pour la quantité restante
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  const handlePrintDelivery = async () => {
    try {
      // Filtrer les articles avec quantité > 0
      const articlesLivres = livraisonItems.filter(
        (item) => item.qteALivrer > 0,
      );

      // Calculer le montant total
      const totalPrice = articlesLivres.reduce(
        (sum, item) => sum + item.qteALivrer * (item.kbetr || 0),
        0,
      );

      // Transformation des données au format requis
      const transformedData = {
        numero: createdDeliveryId,
        date: new Date().toLocaleDateString("fr-FR"),
        heure: new Date().toLocaleTimeString("fr-FR"),
        clientId: order.client,
        clientNom: client.name1 || "N/A",
        livreur: userData?.magasin || "N/A",
        articles: articlesLivres.map((item) => ({
          code: item.id,
          description: item.designation,
          quantite: item.qteALivrer.toString(),
          lot: item.lot || "-",
          unite: item.unite,
          prixUnitaire: item.kbetr || 0,
          prix: (item.kbetr || 0).toLocaleString("fr-DZ", {
            style: "currency",
            currency: "DZD",
            minimumFractionDigits: 2,
          }),
        })),
        totalMontant: totalPrice || 0,
        total: totalPrice.toLocaleString("fr-DZ", {
          style: "currency",
          currency: "DZD",
          minimumFractionDigits: 2,
        }),
      };

      // Générer le contenu HTML avec les données transformées
      const htmlContent = generateThermalPDFContent(
        transformedData,
        livraisonItems,
        createdDeliveryId,
      );
      const htmlContentPDFA4 = generateA4InvoicePDF(transformedData);

      // Fermer le modal
      printModalizeRef.current?.close();

      // Naviguer vers l'écran PDF avec les données nécessaires
      navigation.navigate("PDFViewerScreen", {
        htmlContent: htmlContentPDFA4,
        htmlContentThermal: htmlContent,
        deliveryId: createdDeliveryId,
        documentType: "livraison",
        orderData: {
          cmd: order.cmd,
          client: order.client,
          clientName: client.name1 || "N/A",
        },
        deliveryItems: articlesLivres,
        userData: userData,
        clientData: client,
        deliveryData: transformedData, // Ajouter les données transformées
      });

      // Nettoyer l'état après un délai pour permettre la navigation
      setTimeout(() => {
        dispatch(resetoutboundstate());
      }, 500);
    } catch (error) {
      Alert.alert(
        "Erreur",
        "Impossible d'ouvrir le document PDF. Veuillez réessayer.",
        [{ text: "OK" }],
      );
    }
  };
  const handleCloseModal = () => {
    dispatch(resetDeliveryProcess());
    navigation.goBack();
  };
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#03A9F4" barStyle="light-content" />

      {/* Header avec info commande et client */}
      <View style={styles.headerContainer}>
        <View style={styles.orderSection}>
          <View style={styles.orderIconContainer}>
            <MaterialIcons name="assignment" size={24} color="white" />
          </View>
          <View style={styles.orderDetails}>
            <Text style={styles.orderLabel}>N° Commande</Text>
            <Text style={styles.orderNumber}>{order.cmd}</Text>
            <Text style={styles.orderDate}>{order.erdat}</Text>
          </View>
        </View>

        <View style={styles.separator} />

        <View style={styles.clientSection}>
          <View style={styles.clientIconContainer}>
            <MaterialIcons name="person" size={24} color="white" />
          </View>
          <View style={styles.clientDetails}>
            {/* <Text style={styles.clientLabel}>Client</Text> */}
            <Text style={styles.clientName}>{client.name1}</Text>
            <Text style={styles.clientCode}>{order.client}</Text>
          </View>
        </View>
      </View>

      {/* Items de livraison */}
      <View style={styles.livraisonSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Articles à livrer</Text>
          <View style={styles.sectionActions}>
            <TouchableOpacity
              style={styles.selectAllButton}
              onPress={handleSelectAll}
              disabled={loadingStocks}
            >
              <MaterialIcons name="select-all" size={18} color="#03A9F4" />
              <Text style={styles.selectAllButtonText}>Sélectionner tout</Text>
            </TouchableOpacity>
            <Text style={styles.itemCount}>
              {livraisonItems.filter((item) => item.qteALivrer > 0).length} /{" "}
              {livraisonItems.length} article(s)
            </Text>
          </View>
        </View>

        {livraisonItems.length === 0 ? (
          <View style={styles.emptyList}>
            <MaterialIcons name="assignment" size={48} color="#E0E0E0" />
            <Text style={styles.emptyText}>Aucun article à livrer</Text>
            <Text style={styles.emptySubtext}>
              Tous les articles ont déjà été livrés
            </Text>
          </View>
        ) : (
          <FlatList
            data={livraisonItems}
            renderItem={renderLivraisonItem}
            keyExtractor={(item, index) => `${item.id}-${item.posnr}-${index}`}
            contentContainerStyle={styles.livraisonList}
          />
        )}
      </View>

      {livraisonError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{livraisonError}</Text>
        </View>
      )}

      {/* Bouton de sauvegarde */}
      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={[
            styles.buttonContainer,
            livraisonSuccess ? styles.successButton : null,
          ]}
          onPress={handleSaveLivraison}
          disabled={
            livraisonLoading ||
            livraisonSuccess ||
            livraisonItems.filter((item) => item.qteALivrer > 0).length === 0
          }
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.button,
              livraisonSuccess ? styles.successButtonInner : null,
            ]}
          >
            {livraisonLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : livraisonSuccess ? (
              <MaterialCommunityIcons
                name="check-circle"
                size={24}
                color="white"
              />
            ) : (
              <MaterialIcons name="local-shipping" size={24} color="white" />
            )}
            <Text style={styles.buttonText}>
              {livraisonLoading
                ? "Enregistrement..."
                : livraisonSuccess
                  ? "Livraison créée"
                  : "Créer la livraison"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Modal de définition de quantité */}
      <Modalize
        ref={quantityModalizeRef}
        adjustToContentHeight
        modalStyle={styles.modalContainer}
      >
        {selectedArticle && (
          <View style={styles.quantityModal}>
            <Text style={styles.quantityTitle}>
              Définir la quantité à livrer
            </Text>
            <Text style={styles.quantityArticle}>
              {selectedArticle.designation} - Lot: {selectedArticle.charg}
            </Text>

            <View style={styles.quantityInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Quantité commandée:</Text>
                <Text style={styles.infoValue}>
                  {selectedArticle.qteCommandee} {selectedArticle.unite}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Quantité restante:</Text>
                <Text style={styles.infoValue}>
                  {selectedArticle.qteRestante} {selectedArticle.unite}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Stock disponible:</Text>
                <Text style={styles.infoValue}>
                  {selectedArticle.charg &&
                  stockInfo[selectedArticle.id]?.lotDetails?.[
                    selectedArticle.charg
                  ]
                    ? stockInfo[selectedArticle.id]?.lotDetails[
                        selectedArticle.charg
                      ].AvailableStockByLot
                    : stockInfo[selectedArticle.id]?.AvailableStock}{" "}
                  {selectedArticle.unite}
                </Text>
              </View>
            </View>

            <View style={styles.quantityRow}>
              <Text style={styles.quantityLabel}>Quantité à livrer:</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => {
                    const currentQty = parseFloat(quantity);
                    if (!isNaN(currentQty) && currentQty > 1) {
                      setQuantity((currentQty - 1).toString());
                    }
                  }}
                >
                  <MaterialIcons name="remove" size={20} color="white" />
                </TouchableOpacity>

                <TextInput
                  style={styles.quantityModalInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  selectTextOnFocus={true}
                />

                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => {
                    const currentQty = parseFloat(quantity);
                    if (!isNaN(currentQty)) {
                      // Ne pas dépasser la quantité restante
                      const newQty = Math.min(
                        currentQty + 1,
                        selectedArticle.qteRestante,
                      );
                      setQuantity(newQty.toString());
                    } else {
                      setQuantity("1");
                    }
                  }}
                >
                  <MaterialIcons name="add" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.maxContainer}>
              <TouchableOpacity
                style={styles.maxButton}
                onPress={() => {
                  const stockItem = stockInfo[selectedArticle.id];

                  const hasLot =
                    selectedArticle.charg &&
                    stockItem?.lotDetails?.[selectedArticle.charg];
                  const stockQuantity = hasLot
                    ? stockItem.lotDetails[selectedArticle.charg]
                        .AvailableStockByLot
                    : stockItem?.AvailableStock;
                  // Prendre le minimum entre la quantité restante et le stock disponible
                  const maxQty = Math.min(
                    selectedArticle.qteRestante,
                    stockQuantity,
                  );
                  setQuantity(maxQty.toString());
                }}
              >
                <Text style={styles.maxButtonText}>Quantité maximale</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleQuantityConfirm}
            >
              <Text style={styles.confirmButtonText}>Confirmer</Text>
            </TouchableOpacity>
          </View>
        )}
      </Modalize>

      {/* Modal pour impression de livraison */}
      <Modalize
        ref={printModalizeRef}
        adjustToContentHeight
        modalStyle={styles.modalContainer}
        disableScrollIfPossible
        closeOnOverlayTap={false}
      >
        <View style={styles.printModal}>
          <MaterialCommunityIcons
            name="check-circle"
            size={60}
            color="#4CAF50"
            style={styles.successIcon}
          />

          <Text style={styles.printTitle}>Livraison créée avec succès</Text>

          {createdDeliveryId && (
            <Text style={styles.printDeliveryId}>
              Bon de livraison N° {createdDeliveryId}
            </Text>
          )}

          {createdDeliveryId && (
            <Text style={styles.printQuestion}>
              Souhaitez-vous imprimer le bon de livraison ?
            </Text>
          )}

          <View style={styles.printActions}>
            <TouchableOpacity
              style={[styles.printButton, styles.printNoButton]}
              onPress={cleanupAndNavigateBack}
            >
              {createdDeliveryId && (
                <MaterialIcons name="close" size={20} color="white" />
              )}
              <Text style={styles.printButtonText}>
                {createdDeliveryId ? "Non merci" : "OK"}
              </Text>
            </TouchableOpacity>

            {createdDeliveryId && (
              <TouchableOpacity
                style={[styles.printButton, styles.printYesButton]}
                onPress={handlePrintDelivery}
              >
                <MaterialIcons name="print" size={20} color="white" />
                <Text style={styles.printButtonText}>Imprimer</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modalize>
      {/* Modal pour le processus de livraison*/}
      <DeliveryProcessModal
        ref={processModalRef}
        orderNumber={order?.cmd}
        deliveryId={createdDeliveryId}
        onPrintDelivery={handlePrintDelivery}
        onClose={handleCloseModal}
      />
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  orderCard: {
    backgroundColor: "#03A9F4",
    padding: scale(12),
  },
  orderInfo: {
    alignItems: "center",
  },
  clientCard: {
    backgroundColor: "#03A9F4",
    paddingBottom: scale(12),
    paddingHorizontal: scale(12),
  },
  clientInfo: {
    marginLeft: scale(30),
  },
  livraisonSection: {
    flex: 1,
    margin: scale(12),
    backgroundColor: "white",
    borderRadius: scale(8),
    padding: scale(12),
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: "column",
    marginBottom: scale(12),
  },
  sectionTitle: {
    fontSize: fs(18),
    fontWeight: fontWeight.bold,
    marginBottom: scale(8),
  },
  sectionActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectAllButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: scale(6),
    backgroundColor: "#E3F2FD",
    borderRadius: scale(4),
  },
  selectAllButtonText: {
    color: "#03A9F4",
    fontSize: fs(14),
    marginLeft: scale(4),
  },
  itemCount: {
    fontSize: fs(14),
    color: "#757575",
  },
  livraisonList: {
    paddingBottom: scale(12),
  },
  livraisonItem: {
    backgroundColor: "#FAFAFA",
    borderRadius: scale(8),
    padding: scale(12),
    marginBottom: scale(8),
    borderLeftWidth: scale(4),
    borderLeftColor: "#03A9F4",
  },
  selectedItem: {
    borderLeftColor: "#4CAF50",
    backgroundColor: "#F1F8E9",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale(4),
  },
  headerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemId: {
    fontWeight: fontWeight.bold,
    fontSize: fs(16),
    color: "#03A9F4",
    marginLeft: scale(2),
  },
  itemName: {
    fontSize: fs(14),
    color: "#616161",
    marginBottom: scale(8),
  },
  qtyContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: scale(8),
  },
  qtySection: {
    flex: 1,
  },
  qtyLabel: {
    fontSize: fs(12),
    color: "#9E9E9E",
  },
  qtyValue: {
    fontSize: fs(14),
    fontWeight: fontWeight.bold,
  },
  greenText: {
    color: "#4CAF50",
  },
  grayText: {
    color: "#9E9E9E",
  },
  actionPrompt: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: scale(8),
    borderTopWidth: scale(1),
    borderTopColor: "#EEEEEE",
  },
  actionText: {
    marginLeft: scale(8),
    color: "#03A9F4",
    fontSize: fs(14),
  },
  emptyList: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: scale(20),
  },
  emptyText: {
    fontSize: fs(18),
    fontWeight: fontWeight.bold,
    color: "#9E9E9E",
    marginTop: scale(16),
  },
  emptySubtext: {
    fontSize: fs(14),
    color: "#BDBDBD",
    textAlign: "center",
    marginTop: scale(8),
  },
  errorContainer: {
    backgroundColor: "#FFEBEE",
    padding: scale(12),
    marginHorizontal: scale(12),
    marginBottom: scale(12),
    borderRadius: scale(8),
    borderLeftWidth: scale(4),
    borderLeftColor: "#D32F2F",
  },
  errorText: {
    color: "#D32F2F",
  },
  buttonSection: {
    padding: scale(12),
  },
  buttonContainer: {
    backgroundColor: "#006475",
    borderRadius: scale(8),
    overflow: "hidden",
  },
  successButton: {
    backgroundColor: "#388E3C",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: scale(12),
  },
  successButtonInner: {
    backgroundColor: "#388E3C",
  },
  buttonText: {
    color: "white",
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
    marginLeft: scale(8),
  },
  modalContainer: {
    padding: scale(16),
    borderTopLeftRadius: scale(16),
    borderTopRightRadius: scale(16),
  },
  quantityModal: {
    padding: scale(16),
  },
  quantityTitle: {
    fontSize: fs(20),
    fontWeight: fontWeight.bold,
    marginBottom: scale(8),
    textAlign: "center",
    color: "#006475",
  },
  quantityArticle: {
    fontSize: fs(16),
    color: "#616161",
    marginBottom: scale(16),
    textAlign: "center",
  },
  quantityInfo: {
    backgroundColor: "#F5F5F5",
    borderWidth: scale(1),
    borderColor: "rgba(25, 38, 32, 0.21)",
    padding: scale(12),
    borderRadius: scale(8),
    marginBottom: scale(16),
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: scale(8),
  },
  infoLabel: {
    fontSize: fs(14),
    color: "#757575",
  },
  infoValue: {
    fontSize: fs(14),
    fontWeight: fontWeight.bold,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(16),
  },
  quantityLabel: {
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    backgroundColor: "#03A9F4",
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    justifyContent: "center",
    alignItems: "center",
  },
  quantityModalInput: {
    width: scale(60),
    height: scale(40),
    borderWidth: scale(1),
    borderColor: "#E0E0E0",
    borderRadius: scale(4),
    textAlign: "center",
    fontSize: fs(16),
    marginHorizontal: scale(8),
  },
  maxContainer: {
    alignItems: "flex-end",
    marginBottom: scale(16),
  },
  maxButton: {
    paddingVertical: scale(8),
    paddingHorizontal: scale(16),
    borderWidth: scale(1),
    borderColor: "#03A9F4",
    borderRadius: scale(4),
  },
  maxButtonText: {
    color: "#03A9F4",
    fontSize: fs(14),
  },
  confirmButton: {
    backgroundColor: "#006475",
    padding: scale(12),
    borderRadius: scale(8),
    alignItems: "center",
  },
  confirmButtonText: {
    color: "white",
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
  },
  headerContainer: {
    backgroundColor: "#03A9F4",
    padding: scale(12),
    borderBottomLeftRadius: scale(15),
    borderBottomRightRadius: scale(15),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
    elevation: 3,
  },
  orderSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale(5),
  },
  orderIconContainer: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: scale(12),
  },
  orderDetails: {
    flex: 1,
  },
  orderLabel: {
    fontSize: fs(12),
    color: "rgba(255, 255, 255, 0.8)",
  },
  orderNumber: {
    fontSize: fs(16),
    fontWeight: fontWeight.medium,
    color: "white",
  },
  orderDate: {
    fontSize: fs(13),
    color: "rgba(255, 255, 255, 0.8)",
  },
  separator: {
    height: scale(1),
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  clientSection: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: scale(8),
  },
  clientIconContainer: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: scale(12),
  },
  clientDetails: {
    flex: 1,
  },
  clientLabel: {
    fontSize: fs(12),
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: scale(2),
  },
  clientName: {
    fontSize: fs(16),
    fontWeight: fontWeight.medium,
    color: "white",
  },
  clientCode: {
    fontSize: fs(13),
    color: "rgba(255, 255, 255, 0.8)",
  },
  printModal: {
    padding: scale(24),
    alignItems: "center",
  },
  successIcon: {
    marginBottom: scale(16),
  },
  printTitle: {
    fontSize: fs(22),
    fontWeight: fontWeight.bold,
    color: "#4CAF50",
    marginBottom: scale(12),
    textAlign: "center",
  },
  printDeliveryId: {
    fontSize: fs(16),
    color: "#616161",
    marginBottom: scale(20),
    textAlign: "center",
  },
  printQuestion: {
    fontSize: fs(18),
    fontWeight: fontWeight.bold,
    marginBottom: scale(24),
    textAlign: "center",
  },
  printActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  printButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: scale(12),
    borderRadius: scale(8),
    flex: 1,
    marginHorizontal: scale(8),
  },
  printNoButton: {
    backgroundColor: "#757575",
  },
  printYesButton: {
    backgroundColor: "#006475",
  },
  printButtonText: {
    color: "white",
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
    marginLeft: scale(8),
  },
  outOfStockItem: {
    borderLeftColor: "#F44336",
    backgroundColor: "#FFEBEE",
    opacity: 0.8,
  },
  redText: {
    color: "#F44336",
  },
  insufficientStockItem: {
    borderLeftWidth: scale(4),
    borderLeftColor: "#FF9800",
    backgroundColor: "#FFF3E0",
  },
  insufficientStockSelectedItem: {
    borderLeftWidth: scale(4),
    borderLeftColor: "#E65100",
    backgroundColor: "#FFE0B2",
  },
  orangeText: {
    color: "#FF9800",
    fontWeight: fontWeight.semiBold,
  },
  loadingText: {
    color: "#4CAF50",
    fontSize: fs(12),
    fontWeight: fontWeight.bold,
    textAlign: "center",
  },
});
