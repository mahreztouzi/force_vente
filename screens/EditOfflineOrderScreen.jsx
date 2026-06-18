// import React, { useLayoutEffect, useState, useRef, useEffect } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   StatusBar,
//   SafeAreaView,
//   TextInput,
//   FlatList,
//   Alert,
//   ScrollView,
//   ActivityIndicator,
//   Animated,
// } from "react-native";
// import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
// import { useNavigation } from "@react-navigation/native";
// import { useSelector } from "react-redux";
// import ArticlesModalize from "../components/ArticlesModalize";
// import QuantityModalize from "../components/QuantityModalize";
// import {
//   queueOfflineAction,
//   removeFromOfflineQueue,
// } from "../utils/offlineUtils";

// const EditOfflineOrderScreen = ({ route }) => {
//   const navigation = useNavigation();
//   const { orderAction, client, items: initialItems, motif } = route.params;
//   const { articles } = useSelector((state) => state.articles);

//   const [commandeItems, setCommandeItems] = useState(initialItems || []);
//   const [totalHT, setTotalHT] = useState(0);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [selectedArticle, setSelectedArticle] = useState(null);
//   const [quantity, setQuantity] = useState("1");
//   const [discount, setDiscount] = useState("0");
//   const [loading, setLoading] = useState(false);

//   const articlesModalizeRef = useRef(null);
//   const quantityModalizeRef = useRef(null);
//   const scrollY = useRef(new Animated.Value(0)).current;

//   useLayoutEffect(() => {
//     navigation.setOptions({
//       title: motif ? "Modifier Commande Retour" : "Modifier Commande Vente",
//       headerStyle: {
//         backgroundColor: "#03A9F4",
//       },
//       headerTintColor: "white",
//       headerLeft: () => (
//         <MaterialCommunityIcons
//           name="arrow-left-circle"
//           size={30}
//           color="white"
//           style={{ marginLeft: 15 }}
//           onPress={() => navigation.goBack()}
//         />
//       ),
//     });
//   }, [navigation, motif]);

//   useEffect(() => {
//     updateTotals();
//   }, [commandeItems]);

//   const filteredArticles = articles.filter(
//     (article) =>
//       article.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       article.id.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   const updateTotals = () => {
//     const ht = commandeItems.reduce((sum, item) => {
//       const discountRate = item.discount ? parseFloat(item.discount) / 100 : 0;
//       const priceAfterDiscount = item.prix * (1 - discountRate);
//       return sum + priceAfterDiscount * item.quantity;
//     }, 0);
//     setTotalHT(ht);
//   };

//   const handleAddArticle = () => {
//     articlesModalizeRef.current?.open();
//   };

//   const handleArticleSelect = (article) => {
//     setSelectedArticle(article);
//     articlesModalizeRef.current?.close();
//     setQuantity("1");
//     setDiscount("0");
//     quantityModalizeRef.current?.open();
//   };

//   const handleQuantityConfirm = () => {
//     const qte = parseInt(quantity);
//     const disc = parseFloat(discount);

//     if (isNaN(qte) || qte <= 0) {
//       Alert.alert("Erreur", "Veuillez entrer une quantité valide");
//       return;
//     }

//     if (isNaN(disc) || disc < 0 || disc > 100) {
//       Alert.alert("Erreur", "Veuillez entrer une remise valide (0-100%)");
//       return;
//     }

//     const existingItemIndex = commandeItems.findIndex(
//       (item) => item.id === selectedArticle.id
//     );

//     if (existingItemIndex !== -1) {
//       const updatedItems = [...commandeItems];
//       updatedItems[existingItemIndex].quantity = qte;
//       updatedItems[existingItemIndex].discount = disc;
//       setCommandeItems(updatedItems);
//     } else {
//       setCommandeItems([
//         ...commandeItems,
//         { ...selectedArticle, quantity: qte, discount: disc },
//       ]);
//     }

//     quantityModalizeRef.current?.close();
//     setQuantity("1");
//     setDiscount("0");
//     setSelectedArticle(null);
//   };

//   const handleRemoveItem = (index) => {
//     Alert.alert("Confirmation", "Voulez-vous supprimer cet article ?", [
//       { text: "Annuler", style: "cancel" },
//       {
//         text: "Supprimer",
//         onPress: () => {
//           const newItems = [...commandeItems];
//           newItems.splice(index, 1);
//           setCommandeItems(newItems);
//         },
//         style: "destructive",
//       },
//     ]);
//   };

//   const handleUpdateQuantity = (index, value) => {
//     const qte = parseInt(value);
//     if (!isNaN(qte) && qte > 0) {
//       const updatedItems = [...commandeItems];
//       updatedItems[index].quantity = qte;
//       setCommandeItems(updatedItems);
//     }
//   };

//   const handleDeleteOrder = () => {
//     Alert.alert(
//       "Confirmation",
//       "Voulez-vous supprimer définitivement cette commande ?",
//       [
//         { text: "Annuler", style: "cancel" },
//         {
//           text: "Supprimer",
//           style: "destructive",
//           onPress: async () => {
//             try {
//               setLoading(true);
//               await removeFromOfflineQueue(orderAction.id);
//               Alert.alert("Succès", "Commande supprimée", [
//                 { text: "OK", onPress: () => navigation.goBack() },
//               ]);
//             } catch (error) {
//               Alert.alert("Erreur", "Impossible de supprimer la commande");
//             } finally {
//               setLoading(false);
//             }
//           },
//         },
//       ]
//     );
//   };

//   const handleSaveChanges = async () => {
//     if (commandeItems.length === 0) {
//       Alert.alert(
//         "Erreur",
//         "Veuillez ajouter au moins un article à la commande"
//       );
//       return;
//     }

//     try {
//       setLoading(true);

//       // Supprimer l'ancienne action de la queue
//       await removeFromOfflineQueue(orderAction.id);

//       // Créer la nouvelle action avec les modifications
//       const updatedPayload = {
//         ...orderAction.payload,
//         to_Item: commandeItems.map((item) => {
//           const itemData = {
//             Material: item.id,
//             RequestedQuantity: item.quantity.toString(),
//           };

//           if (item.discount && parseFloat(item.discount) > 0) {
//             itemData.to_PricingElement = [
//               {
//                 ConditionType: "ZREM",
//                 ConditionRateValue: item.discount.toString(),
//               },
//             ];
//           }

//           return itemData;
//         }),
//       };

//       const newAction = {
//         ...orderAction,
//         payload: updatedPayload,
//         timestamp: new Date().toISOString(),
//       };

//       // Ajouter la nouvelle action à la queue
//       await queueOfflineAction(newAction);

//       Alert.alert("Succès", "Commande modifiée et mise en file d'attente", [
//         { text: "OK", onPress: () => navigation.goBack() },
//       ]);
//     } catch (error) {
//       console.error("Erreur lors de la sauvegarde:", error);
//       Alert.alert("Erreur", "Impossible de sauvegarder les modifications");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const calculatePriceAfterDiscount = (price, discount) => {
//     const discountRate = discount ? parseFloat(discount) / 100 : 0;
//     return price * (1 - discountRate);
//   };

//   const renderCommandeItem = ({ item, index }) => {
//     const priceAfterDiscount = calculatePriceAfterDiscount(
//       item.prix,
//       item.discount
//     );

//     return (
//       <View style={styles.commandeItem}>
//         <View style={styles.itemHeader}>
//           <Text style={styles.itemId}>{item.id}</Text>
//           <TouchableOpacity onPress={() => handleRemoveItem(index)}>
//             <MaterialIcons name="delete" size={24} color="#e53935" />
//           </TouchableOpacity>
//         </View>
//         <Text style={styles.itemName}>{item.designation}</Text>
//         <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
//           <View>
//             <View style={styles.itemDetails}>
//               <View style={styles.quantityContainer}>
//                 <Text style={styles.itemLabel}>Quantité :</Text>
//                 <TextInput
//                   style={styles.quantityInput}
//                   value={item.quantity.toString()}
//                   keyboardType="numeric"
//                   onChangeText={(value) => handleUpdateQuantity(index, value)}
//                 />
//                 <Text style={styles.itemUnit}>{item.unite}</Text>
//               </View>
//             </View>
//           </View>
//           <View style={styles.priceContainer}>
//             <Text style={styles.itemTotal}>
//               {parseFloat(priceAfterDiscount * item.quantity).toLocaleString(
//                 "fr-DZ",
//                 {
//                   style: "currency",
//                   currency: "DZD",
//                 }
//               )}
//             </Text>
//           </View>
//         </View>
//       </View>
//     );
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar backgroundColor="#03A9F4" barStyle="light-content" />

//       {/* Client info */}
//       <View style={styles.headerContainer}>
//         <View style={styles.clientSection}>
//           <View style={styles.clientIconContainer}>
//             <MaterialIcons name="person" size={24} color="white" />
//           </View>
//           <View style={styles.clientDetails}>
//             <Text style={styles.clientLabel}>Client</Text>
//             <Text style={styles.clientName}>{client.name1}</Text>
//             <Text style={styles.clientCode}>Code client: {client.kunnr}</Text>
//           </View>
//         </View>
//       </View>

//       {/* Commande postes */}
//       <View style={styles.commandeSection}>
//         <View style={styles.sectionHeader}>
//           <Text style={styles.sectionTitle}>Articles</Text>
//           <Text style={styles.itemCount}>
//             {commandeItems.length} article(s)
//           </Text>
//         </View>

//         {commandeItems.length === 0 ? (
//           <View style={styles.emptyList}>
//             <MaterialIcons name="assignment" size={48} color="#E0E0E0" />
//             <Text style={styles.emptyText}>Aucun article ajouté</Text>
//             <Text style={styles.emptySubtext}>
//               Appuyez sur + pour ajouter des articles
//             </Text>
//           </View>
//         ) : (
//           <FlatList
//             data={commandeItems}
//             renderItem={renderCommandeItem}
//             keyExtractor={(item, index) => `${item.id}-${index}`}
//             contentContainerStyle={styles.commandeList}
//           />
//         )}

//         <TouchableOpacity style={styles.addButton} onPress={handleAddArticle}>
//           <MaterialIcons name="add" size={24} color="white" />
//         </TouchableOpacity>
//       </View>

//       {/* Total */}
//       <View style={styles.totalsSection}>
//         <View style={styles.totalRow}>
//           <Text style={styles.totalLabelFinal}>Total :</Text>
//           <Text style={styles.totalValueFinal}>
//             {parseFloat(totalHT).toLocaleString("fr-DZ", {
//               style: "currency",
//               currency: "DZD",
//             })}
//           </Text>
//         </View>
//       </View>

//       {/* Actions */}
//       <View style={styles.buttonSection}>
//         <TouchableOpacity
//           style={[styles.buttonContainer, styles.deleteButtonContainer]}
//           onPress={handleDeleteOrder}
//           disabled={loading}
//         >
//           <View style={[styles.button, styles.deleteButton]}>
//             {loading ? (
//               <ActivityIndicator color="#FFFFFF" size="small" />
//             ) : (
//               <MaterialIcons name="delete" size={24} color="white" />
//             )}
//             <Text style={styles.buttonText}>Supprimer</Text>
//           </View>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.buttonContainer}
//           onPress={handleSaveChanges}
//           disabled={loading}
//         >
//           <View style={styles.button}>
//             {loading ? (
//               <ActivityIndicator color="#FFFFFF" size="small" />
//             ) : (
//               <MaterialIcons name="save" size={24} color="white" />
//             )}
//             <Text style={styles.buttonText}>Sauvegarder</Text>
//           </View>
//         </TouchableOpacity>
//       </View>

//       {/* Modals */}
//       <ArticlesModalize
//         reference={articlesModalizeRef}
//         searchQuery={searchQuery}
//         setSearchQuery={setSearchQuery}
//         filteredArticles={filteredArticles}
//         handleArticleSelect={handleArticleSelect}
//         scrollY={scrollY}
//       />

//       <QuantityModalize
//         reference={quantityModalizeRef}
//         selectedArticle={selectedArticle}
//         quantity={quantity}
//         setQuantity={setQuantity}
//         discount={discount}
//         setDiscount={setDiscount}
//         handleQuantityConfirm={handleQuantityConfirm}
//         motif={motif}
//       />
//     </SafeAreaView>
//   );
// };
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#F5F5F5",
//   },
//   headerContainer: {
//     backgroundColor: "#03A9F4",
//     padding: 12,
//     borderBottomLeftRadius: 15,
//     borderBottomRightRadius: 15,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   clientSection: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginTop: 8,
//   },
//   clientIconContainer: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: "rgba(255, 255, 255, 0.2)",
//     justifyContent: "center",
//     alignItems: "center",
//     marginRight: 12,
//   },
//   clientDetails: {
//     flex: 1,
//   },
//   clientLabel: {
//     fontSize: 12,
//     color: "rgba(255, 255, 255, 0.8)",
//     marginBottom: 2,
//   },
//   clientName: {
//     fontSize: 18,
//     fontWeight: "bold",
//     color: "white",
//   },
//   clientCode: {
//     fontSize: 13,
//     color: "rgba(255, 255, 255, 0.8)",
//   },
//   commandeSection: {
//     flex: 1,
//     margin: 12,
//     backgroundColor: "white",
//     borderRadius: 15,
//     padding: 12,
//     elevation: 1,
//   },
//   sectionHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 12,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: "bold",
//   },
//   itemCount: {
//     fontSize: 14,
//     color: "#757575",
//   },
//   emptyList: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 20,
//   },
//   emptyText: {
//     marginTop: 12,
//     fontSize: 16,
//     fontWeight: "bold",
//     color: "#757575",
//   },
//   emptySubtext: {
//     fontSize: 14,
//     color: "#9E9E9E",
//     marginTop: 4,
//   },
//   commandeList: {
//     paddingBottom: 80,
//   },
//   commandeItem: {
//     backgroundColor: "#F9F9F9",
//     borderRadius: 6,
//     padding: 12,
//     marginBottom: 10,
//     borderLeftWidth: 4,
//     borderLeftColor: "#03A9F4",
//   },
//   itemHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   itemId: {
//     fontSize: 14,
//     fontWeight: "bold",
//     color: "#03A9F4",
//   },
//   itemName: {
//     fontSize: 16,
//     fontWeight: "bold",
//     marginTop: 4,
//     marginBottom: 8,
//   },
//   itemDetails: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 8,
//   },
//   quantityContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   itemLabel: {
//     fontSize: 14,
//     color: "#757575",
//     marginRight: 8,
//   },
//   quantityInput: {
//     borderWidth: 1,
//     borderColor: "#E0E0E0",
//     borderRadius: 4,
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     fontSize: 14,
//     textAlign: "center",
//     width: 60,
//     marginRight: 8,
//   },
//   itemUnit: {
//     fontSize: 14,
//     color: "#757575",
//   },
//   priceContainer: {
//     alignItems: "flex-end",
//     justifyContent: "center",
//   },
//   itemTotal: {
//     fontSize: 16,
//     fontWeight: "bold",
//     color: "#2E7D32",
//   },
//   addButton: {
//     position: "absolute",
//     bottom: 12,
//     right: 12,
//     backgroundColor: "#03A9F4",
//     borderRadius: 30,
//     width: 56,
//     height: 56,
//     justifyContent: "center",
//     alignItems: "center",
//     elevation: 4,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//   },
//   totalsSection: {
//     backgroundColor: "white",
//     margin: 12,
//     marginTop: 0,
//     padding: 16,
//     borderRadius: 15,
//     // elevation: 2,
//   },
//   totalRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   totalLabelFinal: {
//     fontSize: 18,
//     fontWeight: "bold",
//   },
//   totalValueFinal: {
//     fontSize: 20,
//     fontWeight: "bold",
//     color: "#2E7D32",
//   },
//   buttonSection: {
//     flexDirection: "row",
//     paddingHorizontal: 12,
//     paddingBottom: 12,
//     gap: 12,
//   },
//   buttonContainer: {
//     flex: 1,
//   },
//   deleteButtonContainer: {
//     flex: 0.4,
//   },
//   button: {
//     backgroundColor: "#03A9F4",
//     paddingVertical: 14,
//     borderRadius: 10,
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//     gap: 8,
//     elevation: 2,
//   },
//   deleteButton: {
//     backgroundColor: "#e53935",
//   },
//   buttonText: {
//     color: "white",
//     fontSize: 16,
//     fontWeight: "bold",
//   },
// });

// export default EditOfflineOrderScreen;

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
  ScrollView,
  ActivityIndicator,
  Animated,
} from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import ArticlesModalize from "../components/ArticlesModalize";
import QuantityModalize from "../components/QuantityModalize";
import {
  queueOfflineAction,
  removeFromOfflineQueue,
} from "../utils/offlineUtils";
import { retryFailedOrder } from "../redux/slices/offlineSlice";
import { wp, hp, fs, fontWeight, scale } from "../utils/responsive";

const EditOfflineOrderScreen = ({ route }) => {
  const navigation = useNavigation();
  const {
    orderAction,
    client,
    items: initialItems,
    motif,
    error,
    onEditComplete,
  } = route.params;
  console.log("route params", route.params);
  const { articles } = useSelector((state) => state.articles);

  const [commandeItems, setCommandeItems] = useState(initialItems || []);
  const [totalHT, setTotalHT] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [quantity, setQuantity] = useState("1");
  const [discount, setDiscount] = useState("0");
  const [loading, setLoading] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState(null); // Nouvel état pour l'index de l'item en cours de modification

  const articlesModalizeRef = useRef(null);
  const quantityModalizeRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: motif ? "Modifier Commande de Retour" : "Modifier Offre de Vente",
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
          onPress={() => navigation.goBack()}
        />
      ),
    });
  }, [navigation, motif]);

  useEffect(() => {
    updateTotals();
  }, [commandeItems]);

  const filteredArticles = articles.filter(
    (article) =>
      article.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const updateTotals = () => {
    const ht = commandeItems.reduce((sum, item) => {
      const discountRate = item.discount ? parseFloat(item.discount) / 100 : 0;
      const priceAfterDiscount = item.prix * (1 - discountRate);
      return sum + priceAfterDiscount * item.quantity;
    }, 0);
    setTotalHT(ht);
  };

  const handleAddArticle = () => {
    setEditingItemIndex(null); // Reset editing index
    articlesModalizeRef.current?.open();
  };

  const handleArticleSelect = (article) => {
    setSelectedArticle(article);
    articlesModalizeRef.current?.close();
    setQuantity("1");
    setDiscount("0");
    quantityModalizeRef.current?.open();
  };

  // Nouvelle fonction pour gérer le clic sur un item existant
  const handleEditItem = (item, index) => {
    setSelectedArticle(item);
    setQuantity(item.quantity.toString());
    setDiscount(item.discount.toString());
    setEditingItemIndex(index);
    quantityModalizeRef.current?.open();
  };

  const handleQuantityConfirm = () => {
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

    if (editingItemIndex !== null) {
      // Mode modification d'un item existant
      const updatedItems = [...commandeItems];
      updatedItems[editingItemIndex] = {
        ...updatedItems[editingItemIndex],
        quantity: qte,
        discount: disc,
      };
      setCommandeItems(updatedItems);
      setEditingItemIndex(null);
    } else {
      // Mode ajout d'un nouvel item
      const existingItemIndex = commandeItems.findIndex(
        (item) => item.id === selectedArticle.id
      );

      if (existingItemIndex !== -1) {
        const updatedItems = [...commandeItems];
        updatedItems[existingItemIndex].quantity = qte;
        updatedItems[existingItemIndex].discount = disc;
        setCommandeItems(updatedItems);
      } else {
        setCommandeItems([
          ...commandeItems,
          { ...selectedArticle, quantity: qte, discount: disc },
        ]);
      }
    }

    quantityModalizeRef.current?.close();
    setQuantity("1");
    setDiscount("0");
    setSelectedArticle(null);
  };

  const handleRemoveItem = (index) => {
    Alert.alert("Confirmation", "Voulez-vous supprimer cet article ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        onPress: () => {
          const newItems = [...commandeItems];
          newItems.splice(index, 1);
          setCommandeItems(newItems);
        },
        style: "destructive",
      },
    ]);
  };

  // Suppression de handleUpdateQuantity car on n'en a plus besoin

  const handleDeleteOrder = () => {
    Alert.alert(
      "Confirmation",
      "Voulez-vous supprimer définitivement cette commande ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await removeFromOfflineQueue(orderAction.id);
              Alert.alert("Succès", "Commande supprimée", [
                { text: "OK", onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer la commande");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // const handleSaveChanges = async () => {
  //   if (commandeItems.length === 0) {
  //     Alert.alert(
  //       "Erreur",
  //       "Veuillez ajouter au moins un article à la commande"
  //     );
  //     return;
  //   }

  //   try {
  //     setLoading(true);

  //     // Supprimer l'ancienne action de la queue
  //     await removeFromOfflineQueue(orderAction.id);

  //     // Créer la nouvelle action avec les modifications
  //     const updatedPayload = {
  //       ...orderAction.payload,
  //       to_Item: commandeItems.map((item) => {
  //         const itemData = {
  //           Material: item.id,
  //           RequestedQuantity: item.quantity.toString(),
  //         };

  //         if (item.discount && parseFloat(item.discount) > 0) {
  //           itemData.to_PricingElement = [
  //             {
  //               ConditionType: "ZREM",
  //               ConditionRateValue: item.discount.toString(),
  //             },
  //           ];
  //         }

  //         return itemData;
  //       }),
  //     };

  //     const newAction = {
  //       ...orderAction,
  //       payload: updatedPayload,
  //       timestamp: new Date().toISOString(),
  //     };

  //     console.log("new action ", newAction);
  //     // Ajouter la nouvelle action à la queue
  //     await queueOfflineAction(newAction);
  //     await retryFailedOrder(newAction.id);

  //     Alert.alert("Succès", "Commande modifiée et mise en file d'attente", [
  //       {
  //         text: "OK",
  //         onPress: () => {
  //           if (onEditComplete && typeof onEditComplete === "function") {
  //             onEditComplete();
  //           }
  //           navigation.goBack();
  //         },
  //       },
  //     ]);
  //   } catch (error) {
  //     console.error("Erreur lors de la sauvegarde:", error);
  //     Alert.alert("Erreur", "Impossible de sauvegarder les modifications");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleSaveChanges = async () => {
    if (commandeItems.length === 0) {
      Alert.alert(
        "Erreur",
        "Veuillez ajouter au moins un article à la commande"
      );
      return;
    }

    try {
      setLoading(true);

      // Supprimer l'ancienne action de la queue
      await removeFromOfflineQueue(orderAction.id);

      // Créer la nouvelle action avec les modifications
      const updatedPayload = {
        ...orderAction.payload,
        to_Item: commandeItems.map((item) => {
          const itemData = {
            Material: item.id,
            RequestedQuantity: item.quantity.toString(),
          };

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
      const {
        failed,
        error: orderError,
        failedAt,
        retryCount,
        ...cleanOrderAction
      } = orderAction;
      const newAction = {
        ...cleanOrderAction,
        payload: updatedPayload,
        timestamp: new Date().toISOString(),
      };

      // Ajouter la nouvelle action à la queue
      await queueOfflineAction(newAction);

      Alert.alert("Succès", "Commande modifiée et mise en file d'attente", [
        {
          text: "OK",
          onPress: () => {
            // Appeler la fonction de callback si elle existe
            if (onEditComplete && typeof onEditComplete === "function") {
              onEditComplete();
            }
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      Alert.alert("Erreur", "Impossible de sauvegarder les modifications");
    } finally {
      setLoading(false);
    }
  };
  const calculatePriceAfterDiscount = (price, discount) => {
    const discountRate = discount ? parseFloat(discount) / 100 : 0;
    return price * (1 - discountRate);
  };

  const renderCommandeItem = ({ item, index }) => {
    const priceAfterDiscount = calculatePriceAfterDiscount(
      item.prix,
      item.discount
    );

    return (
      <TouchableOpacity
        style={styles.commandeItem}
        onPress={() => handleEditItem(item, index)} // Clic sur l'item pour l'éditer
        activeOpacity={0.7}
      >
        <View style={styles.itemHeader}>
          <Text style={styles.itemId}>{item.id}</Text>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation(); // Empêche la propagation du clic vers le TouchableOpacity parent
              handleRemoveItem(index);
            }}
          >
            <MaterialIcons name="delete" size={24} color="#e53935" />
          </TouchableOpacity>
        </View>
        <Text style={styles.itemName}>{item.designation}</Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View>
            <View style={styles.itemDetails}>
              <View style={styles.quantityContainer}>
                <Text style={styles.itemLabel}>Quantité :</Text>
                <View style={styles.quantityDisplay}>
                  <Text style={styles.quantityText}>{item.quantity}</Text>
                </View>
                <Text style={styles.itemUnit}>{item.unite}</Text>
              </View>
              {item.discount > 0 && (
                <View style={styles.discountContainer}>
                  <Text style={styles.discountLabel}>
                    Remise : {item.discount}%
                  </Text>
                </View>
              )}
            </View>
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

      {/* Client info */}
      <View style={styles.headerContainer}>
        <View style={styles.clientSection}>
          <View style={styles.clientIconContainer}>
            <MaterialIcons name="person" size={24} color="white" />
          </View>
          <View style={styles.clientDetails}>
            <Text style={styles.clientLabel}>Client</Text>
            <Text style={styles.clientName}>{client.name}</Text>
            <Text style={styles.clientCode}>Code client: {client.kunnr}</Text>
          </View>
        </View>
      </View>

      {/* Commande postes */}
      <View style={styles.commandeSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Articles</Text>
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

        <TouchableOpacity style={styles.addButton} onPress={handleAddArticle}>
          <MaterialIcons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Total */}
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
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.buttonSection}>
        {/* <TouchableOpacity
          style={[styles.buttonContainer, styles.deleteButtonContainer]}
          onPress={handleDeleteOrder}
          disabled={loading}
        >
          <View style={[styles.button, styles.deleteButton]}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <MaterialIcons name="delete" size={24} color="white" />
            )}
            <Text style={styles.buttonText}>Supprimer</Text>
          </View>
        </TouchableOpacity> */}

        <TouchableOpacity
          style={styles.buttonContainer}
          onPress={handleSaveChanges}
          disabled={loading}
        >
          <View style={styles.button}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <MaterialIcons name="save" size={24} color="white" />
            )}
            <Text style={styles.buttonText}>Sauvegarder</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <ArticlesModalize
        reference={articlesModalizeRef}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredArticles={filteredArticles}
        handleArticleSelect={handleArticleSelect}
        scrollY={scrollY}
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
  headerContainer: {
    backgroundColor: "#03A9F4",
    padding: wp(2.9), // 12 -> responsive
    borderBottomLeftRadius: scale(15),
    borderBottomRightRadius: scale(15),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
    elevation: scale(3),
  },
  clientSection: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: hp(0.9), // 8 -> responsive
  },
  clientIconContainer: {
    width: wp(9.7), // 40 -> responsive
    height: wp(9.7), // 40 -> responsive (utilise wp pour garder le ratio)
    borderRadius: wp(4.9), // 20 -> responsive
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: wp(2.9), // 12 -> responsive
  },
  clientDetails: {
    flex: 1,
  },
  clientLabel: {
    fontSize: fs(12),
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: hp(0.2), // 2 -> responsive
  },
  clientName: {
    fontSize: fs(18),
    fontWeight: fontWeight.bold,
    color: "white",
  },
  clientCode: {
    fontSize: fs(13),
    color: "rgba(255, 255, 255, 0.8)",
  },
  commandeSection: {
    flex: 1,
    margin: wp(2.9), // 12 -> responsive
    backgroundColor: "white",
    borderRadius: scale(15),
    padding: wp(2.9), // 12 -> responsive
    elevation: scale(1),
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(1.3), // 12 -> responsive
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
    padding: wp(4.9), // 20 -> responsive
  },
  emptyText: {
    marginTop: hp(1.3), // 12 -> responsive
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
    color: "#757575",
  },
  emptySubtext: {
    fontSize: fs(14),
    color: "#9E9E9E",
    marginTop: hp(0.4), // 4 -> responsive
  },
  commandeList: {
    paddingBottom: hp(8.7), // 80 -> responsive
  },
  commandeItem: {
    backgroundColor: "#F9F9F9",
    borderRadius: scale(6),
    padding: wp(2.9), // 12 -> responsive
    marginBottom: hp(1.1), // 10 -> responsive
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
    marginTop: hp(0.4), // 4 -> responsive
    marginBottom: hp(0.9), // 8 -> responsive
  },
  itemDetails: {
    marginBottom: hp(0.9), // 8 -> responsive
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemLabel: {
    fontSize: fs(14),
    color: "#757575",
    marginRight: wp(1.9), // 8 -> responsive
  },
  quantityDisplay: {
    backgroundColor: "#E3F2FD",
    borderRadius: scale(4),
    paddingHorizontal: wp(2.9), // 12 -> responsive
    paddingVertical: hp(0.7), // 6 -> responsive
    marginRight: wp(1.9), // 8 -> responsive
    minWidth: wp(9.7), // 40 -> responsive
    alignItems: "center",
  },
  quantityText: {
    fontSize: fs(14),
    fontWeight: fontWeight.bold,
    color: "#1976D2",
  },
  itemUnit: {
    fontSize: fs(14),
    color: "#757575",
  },
  discountContainer: {
    marginTop: hp(0.4), // 4 -> responsive
  },
  discountLabel: {
    fontSize: fs(12),
    color: "#FF9800",
    fontWeight: fontWeight.bold,
  },
  priceContainer: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  itemTotal: {
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
    color: "#2E7D32",
  },
  addButton: {
    position: "absolute",
    bottom: hp(1.3), // 12 -> responsive
    right: wp(2.9), // 12 -> responsive
    backgroundColor: "#FFA000",
    borderRadius: scale(30),
    width: wp(13.6), // 56 -> responsive
    height: wp(13.6), // 56 -> responsive (utilise wp pour garder le ratio)
    justifyContent: "center",
    alignItems: "center",
    elevation: scale(4),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.2,
    shadowRadius: scale(4),
  },
  totalsSection: {
    backgroundColor: "white",
    margin: wp(2.9), // 12 -> responsive
    marginTop: 0,
    padding: wp(3.9), // 16 -> responsive
    borderRadius: scale(15),
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabelFinal: {
    fontSize: fs(18),
    fontWeight: fontWeight.bold,
  },
  totalValueFinal: {
    fontSize: fs(20),
    fontWeight: fontWeight.bold,
    color: "#2E7D32",
  },
  buttonSection: {
    flexDirection: "row",
    paddingHorizontal: wp(2.9), // 12 -> responsive
    paddingBottom: hp(1.3), // 12 -> responsive
    gap: wp(2.9), // 12 -> responsive
  },
  buttonContainer: {
    flex: 1,
  },
  deleteButtonContainer: {
    flex: 0.4,
  },
  button: {
    backgroundColor: "#006475",
    paddingVertical: hp(1.5), // 14 -> responsive
    borderRadius: scale(10),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    // Style vide conservé tel quel
  },
  buttonText: {
    color: "white",
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
  },
  errorContainer: {
    backgroundColor: "#FFEBEE",
    padding: wp(2.4), // 10 -> responsive
    margin: wp(2.9), // 12 -> responsive
    borderRadius: scale(8),
    borderLeftWidth: scale(4),
    borderLeftColor: "#D32F2F",
  },
  errorText: {
    color: "#D32F2F",
    fontSize: fs(14),
  },
});

export default EditOfflineOrderScreen;
