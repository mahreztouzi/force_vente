import React, { useLayoutEffect, useState, useRef, useEffect } from "react";
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
  ScrollView,
  Animated,
  ActivityIndicator,
} from "react-native";
import {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
  Feather,
  AntDesign,
} from "@expo/vector-icons";
import { createSelector } from "@reduxjs/toolkit";
import { useNavigation } from "@react-navigation/native";
import { Modalize } from "react-native-modalize";
import { useDispatch, useSelector } from "react-redux";
import { getArticles } from "../redux/slices/articleSlice";
import {
  addOrder,
  addOrderReturn,
  getCommandesApprouves,
  resetOrderState,
} from "../redux/slices/orderSlice";
import { printForms } from "../services/printFormsService";
import AsyncStorage from "@react-native-async-storage/async-storage";

// import Animated from "react-native-reanimated";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

const { width, height } = Dimensions.get("window");
import { BackHandler } from "react-native";
import ArticlesModalize from "../components/ArticlesModalize";
import QuantityModalize from "../components/QuantityModalize";
import PrintModalize from "../components/PrintModalize";
import { wp, hp, fs, fontWeight, scale } from "../utils/responsive";

const CommandeScreen = ({ route }) => {
  const navigation = useNavigation();
  const { client, motif } = route.params;
  const dispatch = useDispatch();
  const userData = useSelector((state) => state.auth.user);
  const { articles, loading, error } = useSelector((state) => state.articles);
  const {
    loading: orderLoading,
    error: orderError,
    success: orderSuccess,
    successOffline,
  } = useSelector((state) => state.orders);
  const [commandeItems, setCommandeItems] = useState([]);
  const [totalHT, setTotalHT] = useState(0);
  const [totalTTC, setTotalTTC] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [quantity, setQuantity] = useState("1");
  const [discount, setDiscount] = useState("0"); // New state for discount
  const [comments, setComments] = useState("");
  const [dateCommande, setDateCommande] = useState(new Date());
  const [validatedNumbers, setValidatedNumbers] = useState([]);
  // État pour suivre la dernière livraison créée
  const [createdOrderId, setCreatedOrderId] = useState(null);
  const [batch, setBatch] = useState(""); // Nouveau state pour le lot

  const articlesModalizeRef = useRef(null);
  const quantityModalizeRef = useRef(null);

  // Nouvelle référence pour le modal d'impression
  const printModalizeRef = useRef(null);

  // Fonction qui sera appelée lorsque le bouton retour matériel est pressé
  useEffect(() => {
    const handleBackPress = () => {
      // Si un modal est ouvert, le fermer au lieu de revenir en arrière
      if (articlesModalizeRef.current?.isOpen) {
        articlesModalizeRef.current?.close();
        return true; // Empêche le comportement par défaut
      }

      if (quantityModalizeRef.current?.isOpen) {
        quantityModalizeRef.current?.close();
        return true;
      }

      if (printModalizeRef.current?.isOpen) {
        // Si vous voulez empêcher la fermeture du modal d'impression via le bouton retour
        return true;
      }

      // Si nous sommes en train de charger quelque chose, empêcher le retour
      if (orderLoading) {
        return true;
      }
      if (orderSuccess) {
        return true;
      }

      // Si nous avons des modifications non sauvegardées
      if (commandeItems.length > 0 && !orderSuccess) {
        // Vous pouvez afficher une alerte de confirmation ici
        Alert.alert(
          "Quitter sans sauvegarder ?",
          "Vous avez des articles dans votre commande. Voulez-vous vraiment quitter sans sauvegarder ?",
          [
            { text: "Rester", style: "cancel" },
            {
              text: "Quitter",
              onPress: () => {
                dispatch(resetOrderState());
                navigation.goBack();
              },
            },
          ],
        );
        return true; // Empêche le comportement par défaut
      }

      // Comportement normal - retourner à l'écran précédent
      dispatch(resetOrderState());
      navigation.goBack();
      return true; // Empêche le comportement par défaut
    };

    // Ajouter l'écouteur d'événements
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress,
    );

    // Nettoyer l'écouteur lors du démontage du composant
    return () => backHandler.remove();
  }, [navigation, commandeItems, orderLoading, orderSuccess, dispatch]);

  useEffect(() => {
    // Charger l'historique des numéros validés
    const loadValidatedNumbers = async () => {
      try {
        const storedNumbers = await AsyncStorage.getItem(
          "validated_commande_numbers",
        );
        if (storedNumbers) {
          setValidatedNumbers(JSON.parse(storedNumbers));
        }
      } catch (error) {
        console.error("Erreur lors du chargement de l'historique:", error);
      }
    };

    loadValidatedNumbers();
    dispatch(resetOrderState());
  }, []);

  // Fonction pour sauvegarder l'historique dans le localStorage
  const saveValidatedNumbers = async (numbers) => {
    try {
      await AsyncStorage.setItem(
        "validated_commande_numbers",
        JSON.stringify(numbers),
      );
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de l'historique:", error);
    }
  };

  // Fonction pour ajouter un numéro validé ( historique commande crée)
  const addValidatedNumber = (number) => {
    if (!validatedNumbers.includes(number)) {
      const newValidatedNumbers = [number, ...validatedNumbers];
      // Limiter l'historique à 20 éléments pour ne pas surcharger le stockage
      const limitedNumbers = newValidatedNumbers.slice(0, 20);
      setValidatedNumbers(limitedNumbers);
      saveValidatedNumbers(limitedNumbers);
    }
  };

  useEffect(() => {
    // Vérifie si les articles sont déjà chargés ou s'il y a eu une erreur
    if (articles.length === 0 && !loading && !error) {
      dispatch(getArticles());
    }
  }, [dispatch, articles.length, loading, error]);

  const filteredArticles = articles.filter(
    (article) =>
      article.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: motif ? "Nouvelle Commande Retour" : "Nouvelle Commande Vente",
      headerStyle: {
        backgroundColor: "#03A9F4",
      },
      headerTintColor: "white", // Changer la couleur du texte et des icônes
      // headerTintColor: "white",
      headerLeft: () => (
        <MaterialCommunityIcons
          name="arrow-left-circle" // Icône personnalisée
          size={30} // Taille de l'icône
          color="white" // Couleur de l'icône
          style={{ marginLeft: 15 }} // Espacement à gauche
          onPress={() => navigation.goBack()} // Retour à l'écran précédent
        />
      ),
    });
  }, [navigation, commandeItems, comments]);

  const updateTotals = () => {
    const ht = commandeItems.reduce((sum, item) => {
      // Calculate price after discount
      const discountRate = item.discount ? parseFloat(item.discount) / 100 : 0;
      const priceAfterDiscount = item.prix * (1 - discountRate);
      return sum + priceAfterDiscount * item.quantity;
    }, 0);
    setTotalHT(ht);
    setTotalTTC(ht * 1.19); // TVA à 19% par exemple
  };

  const handleAddArticle = () => {
    articlesModalizeRef.current?.open();
  };

  const handleArticleSelect = (article) => {
    setSelectedArticle(article);
    articlesModalizeRef.current?.close();
    setQuantity("1");
    setDiscount("0");
    setBatch("");
    quantityModalizeRef.current?.open();
  };

  // const handleQuantityConfirm = () => {
  //   const qte = parseInt(quantity);
  //   const disc = parseFloat(discount);

  //   if (isNaN(qte) || qte <= 0) {
  //     Alert.alert("Erreur", "Veuillez entrer une quantité valide");
  //     return;
  //   }

  //   if (isNaN(disc) || disc < 0 || disc > 100) {
  //     Alert.alert("Erreur", "Veuillez entrer une remise valide (0-100%)");
  //     return;
  //   }

  //   // Vérifier si l'article est déjà dans la commande
  //   const existingItemIndex = commandeItems.findIndex(
  //     (item) => item.id === selectedArticle.id
  //   );

  //   if (existingItemIndex !== -1) {
  //     // Mettre à jour la quantité et la remise si l'article existe déjà
  //     const updatedItems = [...commandeItems];
  //     updatedItems[existingItemIndex].quantity = qte;
  //     updatedItems[existingItemIndex].discount = disc;
  //     setCommandeItems(updatedItems);
  //   } else {
  //     // Ajouter le nouvel article avec remise
  //     setCommandeItems([
  //       ...commandeItems,
  //       { ...selectedArticle, quantity: qte, discount: disc },
  //     ]);
  //   }

  //   quantityModalizeRef.current?.close();
  //   setQuantity("1");
  //   setDiscount("0");
  //   setSelectedArticle(null);

  //   // Mettre à jour les totaux
  //   setTimeout(() => updateTotals(), 100);
  // };

  const handleQuantityConfirm = () => {
    const qte = parseInt(quantity);
    const disc = parseFloat(discount);
    console.log("selected article dans retours", selectedArticle);

    if (isNaN(qte) || qte <= 0) {
      Alert.alert("Erreur", "Veuillez entrer une quantité valide");
      return;
    }

    // ✅ Validation du batch UNIQUEMENT pour les retours de "Produits revente en état"
    const isProduitGererParLot = selectedArticle?.gerer_par_lot === true;

    if (motif && isProduitGererParLot && !batch.trim()) {
      Alert.alert("Erreur", "Veuillez renseigner le numéro de lot");
      return;
    }

    if (isNaN(disc) || disc < 0 || disc > 100) {
      Alert.alert("Erreur", "Veuillez entrer une remise valide (0-100%)");
      return;
    }

    const existingItemIndex = commandeItems.findIndex(
      (item) => item.id === selectedArticle.id,
    );

    if (existingItemIndex !== -1) {
      const updatedItems = [...commandeItems];
      updatedItems[existingItemIndex].quantity = qte;
      updatedItems[existingItemIndex].discount = disc;
      // ✅ Ajouter le batch uniquement si c'est un retour ET "Produits revente en état"
      if (motif && isProduitGererParLot) {
        updatedItems[existingItemIndex].batch = batch;
      }
      setCommandeItems(updatedItems);
    } else {
      const newItem = {
        ...selectedArticle,
        quantity: qte,
        discount: disc,
      };
      // ✅ Ajouter le batch uniquement si c'est un retour ET "Produits revente en état"
      if (motif && isProduitGererParLot) {
        newItem.batch = batch;
      }
      setCommandeItems([...commandeItems, newItem]);
    }

    quantityModalizeRef.current?.close();
    setQuantity("1");
    setDiscount("0");
    setBatch("");
    setSelectedArticle(null);

    setTimeout(() => updateTotals(), 100);
  };

  useEffect(() => {
    updateTotals();
  }, [handleQuantityConfirm]);

  const handleRemoveItem = (index) => {
    Alert.alert("Confirmation", "Voulez-vous supprimer cet article ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        onPress: () => {
          const newItems = [...commandeItems];
          newItems.splice(index, 1);
          setCommandeItems(newItems);
          setTimeout(() => updateTotals(), 100);
          dispatch(resetOrderState());
        },
        style: "destructive",
      },
    ]);
  };

  const handleUpdateQuantity = (index, value) => {
    const qte = parseInt(value);
    if (!isNaN(qte) && qte > 0) {
      const updatedItems = [...commandeItems];
      updatedItems[index].quantity = qte;
      setCommandeItems(updatedItems);
      setTimeout(() => updateTotals(), 100);
    }
  };

  const handleUpdateDiscount = (index, value) => {
    const disc = parseFloat(value);
    if (!isNaN(disc) && disc >= 0 && disc <= 100) {
      const updatedItems = [...commandeItems];
      updatedItems[index].discount = disc;
      setCommandeItems(updatedItems);
      setTimeout(() => updateTotals(), 100);
    }
  };
  const handleEditItem = (item, index) => {
    setSelectedArticle({ ...item, index }); // Ajouter l'index pour savoir quel item modifier
    setQuantity(item.quantity.toString());
    setDiscount(item.discount ? item.discount.toString() : "0");
    setBatch(item.batch || "");
    quantityModalizeRef.current?.open();
  };

  const handleSaveCommande = async () => {
    if (commandeItems.length === 0) {
      Alert.alert(
        "Erreur",
        "Veuillez ajouter au moins un article à la commande",
      );
      return;
    }

    const commandeData = {
      SalesOrderType: "ZCMD",
      SoldToParty: client.kunnr,
      to_Item: commandeItems.map((item) => {
        const itemData = {
          Material: item.id,
          RequestedQuantity: item.quantity.toString(),
        };

        // Add pricing element for discount if discount exists
        if (item.discount && parseFloat(item.discount) > 0) {
          itemData.to_PricingElement = [
            {
              ConditionType: "ZREM",
              ConditionRateValue: item.discount.toString(),
            },
          ];
        }

        return itemData;
      }),
    };

    // Dispatch l'action pour créer la commande
    if (motif) {
      const commandeRetourData = {
        CustomerReturnType: "ZCRN",
        SoldToParty: client.kunnr,
        SDDocumentReason: motif.Augru,
        to_Item: commandeItems.map((item) => {
          const itemData = {
            Material: item.id,
            RequestedQuantity: item.quantity.toString(),
          };
          if (item.batch) {
            itemData.Batch = item.batch;
          }
          return itemData;
        }),
      };
      const orderReturnId = await dispatch(addOrderReturn(commandeRetourData));
      if (orderReturnId.error) {
      } else {
        setCreatedOrderId(orderReturnId.payload.CustomerReturn);
      }
    } else {
      const orderId = await dispatch(addOrder(commandeData));
      console.log("order save", orderId);
      if (orderId.error) {
      } else {
        console.log(
          "order save test offline",
          orderId,
          orderId.payload.SalesOrder,
        );
        orderId.payload.SalesOrder &&
          addValidatedNumber(orderId.payload.SalesOrder);
        setCreatedOrderId(orderId.payload.SalesOrder);
        // addValidatedNumber(orderId.payload.SalesOrder);
      }
    }
  };

  useEffect(() => {
    if (orderSuccess) {
      // Ouvrir le modal d'impression
      dispatch(
        getCommandesApprouves({
          user: userData?.code,
          client: client?.kunnr,
        }),
      );
      const timer = setTimeout(() => {
        printModalizeRef.current?.open();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [orderSuccess, dispatch]);

  const handlePrintOrder = async () => {
    try {
      const response = await printForms(createdOrderId, "ZCMD");
      console.log("response forms", response);

      // Convertir le blob en base64
      const reader = new FileReader();

      reader.onload = async () => {
        const base64Data = reader.result.split(",")[1];

        // Créer le fichier dans le système de fichiers
        const fileUri =
          FileSystem.documentDirectory + `commande_${createdOrderId}.pdf`;

        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Ouvrir le PDF
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert(
            "Erreur",
            "Le partage de fichiers n'est pas disponible sur cet appareil",
          );
        }
      };

      reader.readAsDataURL(
        new Blob([response.data], { type: "application/pdf" }),
      );

      printModalizeRef.current?.close();
      cleanupAndNavigateBack();
    } catch (error) {
      console.error("Erreur lors de l'impression:", error);
      Alert.alert("Erreur", "Impossible d'imprimer le document");
    }
  };

  // Nettoyer l'état et revenir en arrière
  const cleanupAndNavigateBack = () => {
    // Réinitialiser l'état
    dispatch(resetOrderState());
    // Naviguer en arrière
    navigation.goBack();
  };

  // Calculate price after discount
  const calculatePriceAfterDiscount = (price, discount) => {
    const discountRate = discount ? parseFloat(discount) / 100 : 0;
    return price * (1 - discountRate);
  };

  // const renderCommandeItem = ({ item, index }) => {
  //   const priceAfterDiscount = calculatePriceAfterDiscount(
  //     item.prix,
  //     item.discount
  //   );

  //   return (
  //     <View style={styles.commandeItem}>
  //       <View style={styles.itemHeader}>
  //         <Text style={styles.itemId}>{item.id}</Text>
  //         <TouchableOpacity onPress={() => handleRemoveItem(index)}>
  //           <MaterialIcons name="delete" size={24} color="#e53935" />
  //         </TouchableOpacity>
  //       </View>
  //       <Text style={styles.itemName}>{item.designation}</Text>
  //       <View
  //         style={{
  //           flexDirection: "row",
  //           justifyContent: "space-between",
  //         }}
  //       >
  //         <View>
  //           <View style={styles.itemDetails}>
  //             <View style={styles.quantityContainer}>
  //               <Text style={styles.itemLabel}>Quantité :</Text>
  //               <TextInput
  //                 style={styles.quantityInput}
  //                 value={item.quantity.toString()}
  //                 keyboardType="numeric"
  //                 onChangeText={(value) => handleUpdateQuantity(index, value)}
  //               />
  //               <Text style={styles.itemUnit}>{item.unite}</Text>
  //             </View>
  //           </View>

  //           {/* Add discount display and control */}
  //           {/* <View style={styles.quantityContainer}>
  //             <Text style={styles.itemLabel}>Remise :</Text>
  //             <TextInput
  //               style={styles.quantityInput}
  //               value={item.discount ? item.discount.toString() : "0"}
  //               keyboardType="numeric"
  //               onChangeText={(value) => handleUpdateDiscount(index, value)}
  //             />
  //             <Text style={styles.itemUnit}>%</Text>

  //           </View> */}
  //         </View>
  //         <View style={styles.priceContainer}>
  //           {/* <Text style={styles.itemPrice}>{item.prix.toFixed(2)} DZD</Text> */}
  //           {/* <Text style={styles.itemPrice}>
  //             {parseFloat(item.prix).toLocaleString("fr-DZ", {
  //               style: "currency",
  //               currency: "DZD",
  //             })}
  //           </Text> */}
  //           {/* <Text style={styles.itemTotal}>
  //             {(priceAfterDiscount * item.quantity).toFixed(2)} DZD
  //           </Text> */}
  //           <Text style={styles.itemTotal}>
  //             {parseFloat(priceAfterDiscount * item.quantity).toLocaleString(
  //               "fr-DZ",
  //               {
  //                 style: "currency",
  //                 currency: "DZD",
  //               }
  //             )}
  //           </Text>
  //         </View>
  //       </View>
  //     </View>
  //   );
  // };

  const renderCommandeItem = ({ item, index }) => {
    const priceAfterDiscount = calculatePriceAfterDiscount(
      item.prix,
      item.discount,
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
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <View>
            <View style={styles.itemDetails}>
              <View style={styles.quantityContainer}>
                <Text style={styles.itemLabel}>Quantité :</Text>
                <Text style={styles.quantityDisplayInItem}>
                  {/* {item.quantity} */}
                  {parseFloat(item.quantity).toLocaleString("fr-DZ")}{" "}
                  {item.unite}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.itemTotal}>
              {parseFloat(priceAfterDiscount * item.quantity).toLocaleString(
                "fr-DZ",
                {
                  style: "currency",
                  currency: "DZD",
                },
              )}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // 2. Ajouter cette nouvelle fonction après la fonction handleUpdateDiscount :

  const scrollY = useRef(new Animated.Value(0)).current;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#03A9F4" barStyle="light-content" />

      {/* Client info */}
      <View style={styles.headerContainer}>
        <View style={styles.clientSection}>
          <View style={styles.clientIconContainer}>
            <MaterialIcons name="person" size={24} color="white" />
          </View>
          <View style={styles.clientDetails}>
            {/* <Text style={styles.clientLabel}>Client</Text> */}
            <Text style={styles.clientName}>{client.name1}</Text>
            <Text style={styles.clientCode}>{client.kunnr}</Text>
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

        {/* Add article button */}
        <TouchableOpacity style={styles.addButton} onPress={handleAddArticle}>
          <MaterialIcons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Totals */}
      <View style={styles.totalsSection}>
        {/* <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total HT:</Text>
          <Text style={styles.totalValue}>{totalHT.toFixed(2)} DZD</Text>
          <Text style={styles.totalValue}>
       
            {parseFloat(totalHT).toLocaleString("fr-DZ", {
              style: "currency",
              currency: "DZD",
            })}
          </Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TVA (19%):</Text>
          <Text style={styles.totalValue}>
            {(totalTTC - totalHT).toFixed(2)} DZD
          </Text>
          <Text style={styles.totalValue}>
            {parseFloat(totalTTC - totalHT).toLocaleString("fr-DZ", {
              style: "currency",
              currency: "DZD",
            })}
          </Text>
        </View> */}
        <View
          style={[
            styles.totalRow,
            // styles.finalTotal
          ]}
        >
          <Text style={styles.totalLabelFinal}>Total :</Text>
          {/* <Text style={styles.totalValueFinal}>{totalTTC.toFixed(2)} DZD</Text> */}
          <Text style={styles.totalValueFinal}>
            {parseFloat(totalHT).toLocaleString("fr-DZ", {
              style: "currency",
              currency: "DZD",
            })}
          </Text>
        </View>
      </View>

      {orderError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{orderError}</Text>
        </View>
      )}

      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={[
            styles.buttonContainer,
            orderSuccess ? styles.successButton : null,
          ]}
          onPress={handleSaveCommande}
          disabled={orderLoading || orderSuccess}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.button,
              orderSuccess ? styles.successButtonInner : null,
            ]}
          >
            {orderLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : orderSuccess ? (
              <MaterialCommunityIcons
                name="check-circle"
                size={24}
                color="white"
              />
            ) : (
              <MaterialIcons name="save" size={24} color="white" />
            )}
            <Text style={styles.buttonText}>
              {orderLoading
                ? "Enregistrement..."
                : orderSuccess
                  ? "Enregistré"
                  : "Enregistrer"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Articles selection modal */}
      <ArticlesModalize
        reference={articlesModalizeRef}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredArticles={filteredArticles}
        handleArticleSelect={handleArticleSelect}
        scrollY={scrollY}
      />

      {/* Quantity modal with discount */}
      <QuantityModalize
        reference={quantityModalizeRef}
        selectedArticle={selectedArticle}
        quantity={quantity}
        setQuantity={setQuantity}
        discount={discount}
        setDiscount={setDiscount}
        batch={batch} // Nouveau prop
        setBatch={setBatch} // Nouveau prop
        handleQuantityConfirm={handleQuantityConfirm}
        motif={motif}
      />

      {/* Modal pour impression de commande */}
      <PrintModalize
        reference={printModalizeRef}
        createdOrderId={createdOrderId}
        motif={motif}
        handlePrintOrder={handlePrintOrder}
        cleanupAndNavigateBack={cleanupAndNavigateBack}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
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
  clientCard: {
    backgroundColor: "#03A9F4",
    padding: scale(12),
  },
  clientHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale(8),
  },
  clientCardTitle: {
    marginLeft: scale(8),
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
  },
  clientInfo: {
    marginLeft: scale(30),
  },
  commandeSection: {
    flex: 1,
    margin: scale(12),
    backgroundColor: "white",
    borderRadius: scale(15),
    padding: scale(12),
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale(12),
  },
  sectionTitle: {
    fontSize: fs(18),
    fontWeight: fontWeight.bold,
  },
  itemCount: {
    fontSize: fs(14),
    color: "#757575",
  },
  emptyList: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: scale(20),
  },
  emptyText: {
    marginTop: scale(12),
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
    color: "#757575",
  },
  emptySubtext: {
    fontSize: fs(14),
    color: "#9E9E9E",
    marginTop: scale(4),
  },
  commandeList: {
    paddingBottom: scale(80),
  },
  commandeItem: {
    backgroundColor: "#F9F9F9",
    borderRadius: scale(6),
    padding: scale(12),
    marginBottom: scale(10),
    borderLeftWidth: scale(4),
    borderLeftColor: "#03A9F4",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemId: {
    fontSize: fs(14),
    fontWeight: fontWeight.bold,
    color: "#03A9F4",
  },
  itemName: {
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
    marginTop: scale(4),
    marginBottom: scale(8),
  },
  itemDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale(4),
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemLabel: {
    fontSize: fs(14),
    marginRight: scale(4),
    width: scale(64),
  },
  quantityDisplayInItem: {
    fontSize: fs(16),
    fontWeight: fontWeight.semiBold,
    color: "#333",
    marginHorizontal: scale(8),
  },
  quantityInput: {
    backgroundColor: "#EEEEEE",
    borderRadius: scale(4),
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
    width: scale(40),
    textAlign: "center",
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
  totalPreviewValue: {
    fontWeight: fontWeight.bold,
    letterSpacing: scale(2),
    color: "#006475",
  },
  itemUnit: {
    fontSize: fs(14),
    marginLeft: scale(4),
    color: "#757575",
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  itemPrice: {
    fontSize: fs(14),
    color: "#757575",
    marginBottom: scale(4),
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
    backgroundColor: "#FFA000",
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  commentsSection: {
    margin: scale(12),
    backgroundColor: "white",
    borderRadius: scale(8),
    padding: scale(12),
    elevation: 2,
  },
  commentLabel: {
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
    marginBottom: scale(8),
  },
  commentInput: {
    backgroundColor: "#F9F9F9",
    borderRadius: scale(6),
    padding: scale(8),
    height: scale(80),
    textAlignVertical: "top",
  },
  totalsSection: {
    margin: scale(12),
    marginBottom: scale(12),
    backgroundColor: "white",
    borderRadius: scale(15),
    padding: scale(12),
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: scale(6),
  },
  totalLabel: {
    fontSize: fs(16),
  },
  totalValue: {
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
  },
  finalTotal: {
    borderTopWidth: scale(1),
    borderTopColor: "#E0E0E0",
    marginTop: scale(8),
    paddingTop: scale(8),
  },
  totalLabelFinal: {
    fontSize: fs(18),
    fontWeight: fontWeight.bold,
  },
  totalValueFinal: {
    fontSize: fs(18),
    fontWeight: fontWeight.bold,
    color: "#03A9F4",
  },
  buttonSection: {
    marginBottom: scale(12),
    padding: scale(12),
  },
  buttonContainer: {
    marginRight: scale(10),
    marginLeft: scale(10),
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#006475",
    paddingHorizontal: scale(12),
    paddingVertical: scale(15),
    borderRadius: scale(16),
  },
  buttonText: {
    color: "white",
    fontWeight: fontWeight.bold,
    marginLeft: scale(5),
    fontSize: fs(18),
  },
  errorContainer: {
    backgroundColor: "#FFEBEE",
    padding: scale(10),
    margin: scale(12),
    borderRadius: scale(8),
    borderLeftWidth: scale(4),
    borderLeftColor: "#D32F2F",
  },
  errorText: {
    color: "#D32F2F",
    fontSize: fs(14),
  },
  successButton: {
    opacity: 1,
  },
  successButtonInner: {
    backgroundColor: "#4CAF50",
  },
});

export default CommandeScreen;
