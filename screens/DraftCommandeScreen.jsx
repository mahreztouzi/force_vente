import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  FlatList,
  Alert,
  BackHandler,
  Animated,
} from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from "react-redux";

// Composants modaux
import ArticlesModalize from "../components/ArticlesModalize";
import QuantityModalize from "../components/QuantityModalize";
import { getArticles } from "../redux/slices/articleSlice";
import { wp, hp, fs, fontWeight, scale } from "../utils/responsive";

// Hook personnalisé pour la sauvegarde
const useDraftSave = (key, getDraftData) => {
  const timeoutRef = useRef(null);

  // Sauvegarde immédiate
  const saveImmediately = async () => {
    try {
      const data = getDraftData();
      await AsyncStorage.setItem(key, JSON.stringify(data));
      console.log(`Brouillon sauvegardé immédiatement: ${key}`);
      return true;
    } catch (error) {
      console.error("Erreur lors de la sauvegarde immédiate:", error);
      return false;
    }
  };

  // Sauvegarde différée (pour les changements mineurs comme les commentaires)
  const saveDelayed = (delay = 2000) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        const data = getDraftData();
        await AsyncStorage.setItem(key, JSON.stringify(data));
        console.log(`Brouillon sauvegardé (différé): ${key}`);
      } catch (error) {
        console.error("Erreur lors de la sauvegarde différée:", error);
      }
    }, delay);
  };

  // Nettoyer le timeout
  const clearSaveTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  return { saveImmediately, saveDelayed, clearSaveTimeout };
};

const DraftCommandeScreen = ({ route }) => {
  const navigation = useNavigation();
  const { client, motif, draftData, isDraft, isModification, onSave } =
    route.params;
  const dispatch = useDispatch();
  const { articles, loading, error } = useSelector((state) => state.articles);

  // États pour la commande
  const [commandeItems, setCommandeItems] = useState(draftData?.items || []);
  const [totalHT, setTotalHT] = useState(0);
  const [totalTTC, setTotalTTC] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [quantity, setQuantity] = useState("1");
  const [discount, setDiscount] = useState("0");
  const [comments, setComments] = useState(draftData?.comments || "");
  const [dateCommande, setDateCommande] = useState(
    draftData?.dateCommande ? new Date(draftData.dateCommande) : new Date()
  );

  // Références des modaux
  const articlesModalizeRef = useRef(null);
  const quantityModalizeRef = useRef(null);

  // Générer un ID unique pour le brouillon
  const draftId = useRef(
    draftData?.id || `draft_${Date.now()}_${client?.kunnr}`
  );
  const DRAFT_KEY = `draft_order_${draftId.current}`;

  // Fonction pour créer l'objet brouillon
  const getDraftData = () => ({
    id: draftId.current,
    client,
    motif,
    items: commandeItems,
    comments,
    dateCommande: dateCommande.toISOString(),
    totalHT,
    totalTTC,
    createdAt: draftData?.createdAt || new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    type: motif ? "return" : "sale",
  });

  // Utiliser le hook de sauvegarde optimisé
  const { saveImmediately, saveDelayed, clearSaveTimeout } = useDraftSave(
    DRAFT_KEY,
    getDraftData
  );

  // Fonction pour ajouter/mettre à jour dans la liste des brouillons
  const updateDraftsList = async () => {
    try {
      const existingDrafts = await AsyncStorage.getItem("draft_orders");
      const drafts = existingDrafts ? JSON.parse(existingDrafts) : [];
      const draftOrder = getDraftData();

      // Vérifier si le brouillon existe déjà
      const existingIndex = drafts.findIndex(
        (draft) => draft.id === draftId.current
      );

      if (existingIndex !== -1) {
        // Mettre à jour le brouillon existant
        drafts[existingIndex] = draftOrder;
      } else {
        // Ajouter le nouveau brouillon
        drafts.unshift(draftOrder);
      }

      await AsyncStorage.setItem("draft_orders", JSON.stringify(drafts));
      console.log("Liste des brouillons mise à jour");
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la liste:", error);
    }
  };

  // Fonction pour supprimer le brouillon de la liste
  const removeDraftFromList = async (draftId) => {
    try {
      const existingDrafts = await AsyncStorage.getItem("draft_orders");
      if (existingDrafts) {
        const drafts = JSON.parse(existingDrafts);
        const updatedDrafts = drafts.filter((draft) => draft.id !== draftId);
        await AsyncStorage.setItem(
          "draft_orders",
          JSON.stringify(updatedDrafts)
        );
        await AsyncStorage.removeItem(`draft_order_${draftId}`);
        console.log(`Brouillon ${draftId} supprimé de la liste`);
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du brouillon:", error);
    }
  };

  // Gestion du bouton retour avec sauvegarde intelligente
  useEffect(() => {
    const handleBackPress = () => {
      if (articlesModalizeRef.current?.isOpen) {
        articlesModalizeRef.current?.close();
        return true;
      }

      if (quantityModalizeRef.current?.isOpen) {
        quantityModalizeRef.current?.close();
        return true;
      }

      // Sauvegarder immédiatement si des modifications existent
      if (commandeItems.length > 0 || comments.trim() !== "") {
        saveImmediately().then((success) => {
          if (success) {
            updateDraftsList().then(() => {
              if (onSave) onSave();
              navigation.goBack();
            });
          } else {
            // Même en cas d'erreur, on permet de quitter
            navigation.goBack();
          }
        });
      } else {
        navigation.goBack();
      }
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress
    );

    return () => {
      backHandler.remove();
      clearSaveTimeout(); // Nettoyer les timeouts à la destruction
    };
  }, [navigation, commandeItems, comments, saveImmediately, onSave]);

  // Charger les articles si nécessaire
  useEffect(() => {
    if (articles.length === 0 && !loading && !error) {
      dispatch(getArticles());
    }
  }, [dispatch, articles.length, loading, error]);

  // Filtrer les articles
  const filteredArticles = articles.filter(
    (article) =>
      article.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Configuration de l'en-tête avec sauvegarde intelligente
  useLayoutEffect(() => {
    const title = isModification
      ? motif
        ? "Modifier Commande Retour"
        : "Modifier Offre de Vente"
      : motif
      ? "Brouillon Commande Retour"
      : "Brouillon Offre de Vente";

    navigation.setOptions({
      title,
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
            if (commandeItems.length > 0 || comments.trim() !== "") {
              saveImmediately().then(() => {
                updateDraftsList().then(() => {
                  if (onSave) onSave();
                  navigation.goBack();
                });
              });
            } else {
              navigation.goBack();
            }
          }}
        />
      ),
      //   headerRight: () => (
      //     <View style={{ flexDirection: "row", marginRight: 15 }}>
      //       <MaterialCommunityIcons
      //         name="content-save"
      //         size={24}
      //         color="white"
      //         style={{ marginRight: 15 }}
      //         onPress={async () => {
      //           const success = await saveImmediately();
      //           if (success) {
      //             await updateDraftsList();
      //             if (onSave) onSave();
      //             Alert.alert("Succès", "Brouillon sauvegardé");
      //           } else {
      //             Alert.alert("Erreur", "Impossible de sauvegarder le brouillon");
      //           }
      //         }}
      //       />
      //       <MaterialCommunityIcons
      //         name="send"
      //         size={24}
      //         color="white"
      //         onPress={handleValidateOrder}
      //       />
      //     </View>
      //   ),
    });
  }, [
    navigation,
    commandeItems,
    comments,
    saveImmediately,
    isModification,
    onSave,
  ]);

  // Mettre à jour les totaux
  const updateTotals = () => {
    const ht = commandeItems.reduce((sum, item) => {
      const discountRate = item.discount ? parseFloat(item.discount) / 100 : 0;
      const priceAfterDiscount = item.prix * (1 - discountRate);
      return sum + priceAfterDiscount * item.quantity;
    }, 0);
    setTotalHT(ht);
    setTotalTTC(ht * 1.19);
  };

  useEffect(() => {
    updateTotals();
  }, [commandeItems]);

  // Sauvegarde différée pour les commentaires
  useEffect(() => {
    if (draftData?.comments !== comments) {
      saveDelayed(1500); // Sauvegarde différée pour les commentaires
    }
  }, [comments]);

  // Gérer l'ajout d'article
  const handleAddArticle = () => {
    articlesModalizeRef.current?.open();
  };

  // Gérer la sélection d'article
  const handleArticleSelect = (article) => {
    setSelectedArticle(article);
    articlesModalizeRef.current?.close();
    setQuantity("1");
    setDiscount("0");
    quantityModalizeRef.current?.open();
  };

  // Confirmer la quantité - SAUVEGARDE IMMÉDIATE
  const handleQuantityConfirm = async () => {
    const qte = parseInt(quantity);
    const disc = parseFloat(discount);

    if (isNaN(qte) || qte <= 0) {
      Alert.alert("Erreur", "Veuillez entrer une quantité valide");
      return;
    }

    if (isNaN(disc) || disc < 0 || disc > 100) {
      Alert.alert("Erreur", "Veuillez entrer une remise valide (0-100%)");
      return;
    }

    let updatedItems;
    const existingItemIndex = commandeItems.findIndex(
      (item) => item.id === selectedArticle.id
    );

    if (existingItemIndex !== -1) {
      // Modification d'un article existant
      updatedItems = [...commandeItems];
      updatedItems[existingItemIndex].quantity = qte;
      updatedItems[existingItemIndex].discount = disc;
    } else {
      // Ajout d'un nouvel article
      updatedItems = [
        ...commandeItems,
        { ...selectedArticle, quantity: qte, discount: disc },
      ];
    }

    // Mettre à jour l'état
    setCommandeItems(updatedItems);

    // Fermer le modal
    quantityModalizeRef.current?.close();
    setQuantity("1");
    setDiscount("0");
    setSelectedArticle(null);

    // SAUVEGARDE IMMÉDIATE après mise à jour de l'état
    // On utilise setTimeout pour s'assurer que l'état est bien mis à jour
    setTimeout(async () => {
      const success = await saveImmediately();
      if (success) {
        await updateDraftsList();
        console.log("Article ajouté/modifié et sauvegardé immédiatement");
      }
    }, 100);
  };

  // Supprimer un article - SAUVEGARDE IMMÉDIATE
  const handleRemoveItem = (index) => {
    Alert.alert("Confirmation", "Voulez-vous supprimer cet article ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        onPress: async () => {
          const newItems = [...commandeItems];
          newItems.splice(index, 1);
          setCommandeItems(newItems);

          // SAUVEGARDE IMMÉDIATE après suppression
          setTimeout(async () => {
            const success = await saveImmediately();
            if (success) {
              await updateDraftsList();
              console.log("Article supprimé et sauvegardé immédiatement");
            }
          }, 100);
        },
        style: "destructive",
      },
    ]);
  };

  // Modifier un article
  const handleEditItem = (item, index) => {
    setSelectedArticle({ ...item, index });
    setQuantity(item.quantity.toString());
    setDiscount(item.discount ? item.discount.toString() : "0");
    quantityModalizeRef.current?.open();
  };

  // Valider la commande
  const handleValidateOrder = async () => {
    if (commandeItems.length === 0) {
      Alert.alert(
        "Erreur",
        "Veuillez ajouter au moins un article à la commande"
      );
      return;
    }

    // Sauvegarder immédiatement avant de rediriger
    const success = await saveImmediately();
    if (success) {
      await updateDraftsList();
    }

    const draftOrder = getDraftData();

    // Rediriger vers l'écran de commande en ligne
    navigation.replace("CommandeScreen", {
      client,
      motif,
      draftData: draftOrder,
      isValidation: true,
      draftId: draftId.current,
      DRAFT_KEY,
      onSync: async () => {
        await removeDraftFromList(draftId.current);
        if (onSave) onSave();
      },
    });
  };

  // Calculer le prix après remise
  const calculatePriceAfterDiscount = (price, discount) => {
    const discountRate = discount ? parseFloat(discount) / 100 : 0;
    return price * (1 - discountRate);
  };

  // Rendu d'un article de commande
  const renderCommandeItem = ({ item, index }) => {
    const priceAfterDiscount = calculatePriceAfterDiscount(
      item.prix,
      item.discount
    );

    return (
      <TouchableOpacity
        style={styles.commandeItem}
        onPress={() => handleEditItem(item, index)}
      >
        <View style={styles.itemHeader}>
          <Text style={styles.itemId}>{item.id}</Text>
          <TouchableOpacity onPress={() => handleRemoveItem(index)}>
            <MaterialIcons name="delete" size={24} color="#e53935" />
          </TouchableOpacity>
        </View>
        <Text style={styles.itemName}>{item.designation}</Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View>
            <View style={styles.itemDetails}>
              <View style={styles.quantityContainer}>
                <Text style={styles.itemLabel}>Quantité :</Text>
                <Text style={styles.quantityDisplayInItem}>
                  {parseFloat(item.quantity).toLocaleString("fr-DZ")}{" "}
                  {item.unite}
                </Text>
              </View>
            </View>
            {item.discount > 0 && (
              <Text style={styles.discountText}>Remise: {item.discount}%</Text>
            )}
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.itemTotal}>
              {parseFloat(priceAfterDiscount * item.quantity).toLocaleString(
                "fr-DZ",
                {
                  style: "currency",
                  currency: "DZD",
                }
              )}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#03A9F4" barStyle="light-content" />

      {/* Indicateur de mode brouillon */}
      {/* <View style={styles.draftIndicator}>
        <MaterialCommunityIcons name="pencil" size={16} color="#03A9F4" />
        <Text style={styles.draftText}>
          Mode Brouillon - Sauvegarde intelligente
        </Text>
      </View> */}

      {/* Client info */}
      <View style={styles.headerContainer}>
        <View style={styles.clientSection}>
          <View style={styles.clientIconContainer}>
            <MaterialIcons name="person" size={24} color="white" />
          </View>
          <View style={styles.clientDetails}>
            <Text style={styles.clientLabel}>Client</Text>
            <Text style={styles.clientName}>{client.name1}</Text>
            <Text style={styles.clientCode}>Code client: {client.kunnr}</Text>
          </View>
        </View>
      </View>

      {/* Commande postes */}
      <View style={styles.commandeSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Postes</Text>
          <Text style={styles.itemCount}>
            {commandeItems.length} article(s)
          </Text>
        </View>

        {commandeItems.length === 0 ? (
          <View style={styles.emptyList}>
            <MaterialIcons name="assignment" size={48} color="#E0E0E0" />
            <Text style={styles.emptyText}>Aucun article ajouté</Text>
            <Text style={styles.emptySubtext}>
              Appuyez sur + pour ajouter des articles
            </Text>
          </View>
        ) : (
          <FlatList
            data={commandeItems}
            renderItem={renderCommandeItem}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            contentContainerStyle={styles.commandeList}
          />
        )}

        {/* Bouton d'ajout d'article */}
        <TouchableOpacity style={styles.addButton} onPress={handleAddArticle}>
          <MaterialIcons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Totaux */}
      <View style={styles.totalsSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabelFinal}>Total :</Text>
          <Text style={styles.totalValueFinal}>
            {parseFloat(totalHT).toLocaleString("fr-DZ", {
              style: "currency",
              currency: "DZD",
            })}
          </Text>
        </View>
      </View>

      {/* Boutons d'action */}
      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={[styles.buttonContainer, styles.draftButton]}
          onPress={async () => {
            const success = await saveImmediately();
            if (success) {
              await updateDraftsList();
              Alert.alert("Succès", "Brouillon sauvegardé");
            } else {
              Alert.alert("Erreur", "Impossible de sauvegarder le brouillon");
            }
          }}
          activeOpacity={0.7}
        >
          <View style={styles.button}>
            <MaterialIcons name="save" size={24} color="white" />
            <Text style={styles.buttonText}>Sauvegarder</Text>
          </View>
        </TouchableOpacity>

        {/* <TouchableOpacity
          style={[styles.buttonContainer, styles.validateButton]}
          onPress={handleValidateOrder}
          activeOpacity={0.7}
        >
          <View style={styles.button}>
            <MaterialCommunityIcons name="send" size={24} color="white" />
            <Text style={styles.buttonText}>Valider</Text>
          </View>
        </TouchableOpacity> */}
      </View>

      {/* Modaux */}
      <ArticlesModalize
        reference={articlesModalizeRef}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredArticles={filteredArticles}
        handleArticleSelect={handleArticleSelect}
        scrollY={useRef(new Animated.Value(0)).current}
      />

      <QuantityModalize
        reference={quantityModalizeRef}
        selectedArticle={selectedArticle}
        quantity={quantity}
        setQuantity={setQuantity}
        discount={discount}
        setDiscount={setDiscount}
        handleQuantityConfirm={handleQuantityConfirm}
        motif={motif}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  draftIndicator: {
    backgroundColor: "#F0F9FD",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: hp(0.9),
    borderBottomWidth: scale(1),
    borderBottomColor: "#FFE0B2",
  },
  draftText: {
    color: "#03A9F4",
    fontSize: fs(12),
    fontWeight: fontWeight.semiBold,
    marginLeft: scale(4),
  },
  headerContainer: {
    backgroundColor: "#03A9F4",
    paddingHorizontal: wp(3.9),
    paddingVertical: hp(1.3),
  },
  clientSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  clientIconContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: scale(25),
    width: scale(50),
    height: scale(50),
    justifyContent: "center",
    alignItems: "center",
    marginRight: scale(12),
  },
  clientDetails: {
    flex: 1,
  },
  clientLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: fs(12),
    fontWeight: fontWeight.medium,
  },
  clientName: {
    color: "white",
    fontSize: fs(18),
    fontWeight: fontWeight.bold,
  },
  clientCode: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: fs(14),
  },
  commandeSection: {
    flex: 1,
    backgroundColor: "white",
    margin: scale(16),
    borderRadius: scale(12),
    elevation: 0.7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: scale(16),
    borderBottomWidth: scale(1),
    borderBottomColor: "#F0F0F0",
  },
  sectionTitle: {
    fontSize: fs(18),
    fontWeight: fontWeight.bold,
    color: "#333",
  },
  itemCount: {
    fontSize: fs(14),
    color: "#757575",
  },
  emptyList: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: hp(5.5),
  },
  emptyText: {
    fontSize: fs(16),
    color: "#9E9E9E",
    marginTop: scale(16),
    fontWeight: fontWeight.medium,
  },
  emptySubtext: {
    fontSize: fs(14),
    color: "#BDBDBD",
    marginTop: scale(8),
    textAlign: "center",
  },
  commandeList: {
    padding: scale(16),
  },
  commandeItem: {
    backgroundColor: "#FAFAFA",
    borderRadius: scale(8),
    padding: scale(12),
    marginBottom: scale(8),
    borderLeftWidth: scale(3),
    borderLeftColor: "#FF9800",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale(8),
  },
  itemId: {
    fontSize: fs(14),
    fontWeight: fontWeight.bold,
    color: "#FF9800",
  },
  itemName: {
    fontSize: fs(16),
    fontWeight: fontWeight.medium,
    color: "#333",
    marginBottom: scale(8),
  },
  itemDetails: {
    marginBottom: scale(4),
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemLabel: {
    fontSize: fs(14),
    color: "#757575",
    marginRight: scale(8),
  },
  quantityDisplayInItem: {
    fontSize: fs(14),
    fontWeight: fontWeight.semiBold,
    color: "#333",
  },
  discountText: {
    fontSize: fs(12),
    color: "#4CAF50",
    fontWeight: fontWeight.semiBold,
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  itemTotal: {
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
    color: "#03A9F4",
  },
  addButton: {
    position: "absolute",
    right: scale(16),
    bottom: scale(16),
    backgroundColor: "#FF9800",
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.2,
    shadowRadius: scale(4),
  },
  totalsSection: {
    backgroundColor: "white",
    marginHorizontal: scale(16),
    marginBottom: scale(16),
    borderRadius: scale(12),
    padding: scale(16),
    elevation: 0.7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabelFinal: {
    fontSize: fs(18),
    fontWeight: fontWeight.bold,
    color: "#333",
  },
  totalValueFinal: {
    fontSize: fs(20),
    fontWeight: fontWeight.bold,
    color: "#03A9F4",
  },
  buttonSection: {
    flexDirection: "row",
    paddingHorizontal: scale(16),
    paddingBottom: scale(16),
    gap: scale(12),
  },
  buttonContainer: {
    flex: 1,
    borderRadius: scale(8),
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
  },
  draftButton: {
    backgroundColor: "#006475",
  },
  validateButton: {
    backgroundColor: "#4CAF50",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: hp(1.3),
    paddingHorizontal: wp(4.9),
  },
  buttonText: {
    color: "white",
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
    marginLeft: scale(8),
  },
});

export default DraftCommandeScreen;
