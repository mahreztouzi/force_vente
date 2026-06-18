// import React, {
//   useLayoutEffect,
//   useState,
//   useEffect,
//   useCallback,
// } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   StatusBar,
//   SafeAreaView,
//   FlatList,
//   Alert,
//   RefreshControl,
// } from "react-native";
// import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
// import { useNavigation, useFocusEffect } from "@react-navigation/native";
// import {
//   getOfflineActionQueue,
//   removeFromOfflineQueue,
//   clearOfflineQueue,
// } from "../utils/offlineUtils";
// import { useSelector } from "react-redux";

// const OfflineOrdersScreen = ({ route }) => {
//   const navigation = useNavigation();
//   const { client } = route.params;
//   const [offlineOrders, setOfflineOrders] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const { articles } = useSelector((state) => state.articles);
//   console.log("article dans offlineOrders", articles);

//   useLayoutEffect(() => {
//     navigation.setOptions({
//       title: "Commandes Hors Ligne",
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
//       headerRight: () => (
//         <TouchableOpacity
//           style={{ marginRight: 15 }}
//           onPress={handleClearAllOrders}
//         >
//           <MaterialIcons name="clear-all" size={24} color="white" />
//         </TouchableOpacity>
//       ),
//     });
//   }, [navigation]);

//   const loadOfflineOrders = async () => {
//     setLoading(true);
//     try {
//       const queue = await getOfflineActionQueue();
//       // Filtrer uniquement les actions addOrder
//       const orderActions = queue.filter(
//         (action) =>
//           (action.type === "orders/addOrder" ||
//             action.type === "orders/addOrderReturn") &&
//           action.payload.SoldToParty === client.kunnr
//       );
//       setOfflineOrders(orderActions);
//     } catch (error) {
//       console.error(
//         "Erreur lors du chargement des commandes hors ligne:",
//         error
//       );
//       Alert.alert("Erreur", "Impossible de charger les commandes hors ligne");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useFocusEffect(
//     useCallback(() => {
//       loadOfflineOrders();
//     }, [])
//   );

//   const handleClearAllOrders = () => {
//     if (offlineOrders.length === 0) {
//       Alert.alert("Information", "Aucune commande hors ligne à supprimer");
//       return;
//     }

//     Alert.alert(
//       "Confirmation",
//       "Voulez-vous supprimer toutes les commandes hors ligne ?",
//       [
//         { text: "Annuler", style: "cancel" },
//         {
//           text: "Supprimer tout",
//           style: "destructive",
//           onPress: async () => {
//             try {
//               await clearOfflineQueue();
//               setOfflineOrders([]);
//               Alert.alert(
//                 "Succès",
//                 "Toutes les commandes hors ligne ont été supprimées"
//               );
//             } catch (error) {
//               Alert.alert("Erreur", "Impossible de supprimer les commandes");
//             }
//           },
//         },
//       ]
//     );
//   };

//   const handleDeleteOrder = (orderAction) => {
//     Alert.alert(
//       "Confirmation",
//       "Voulez-vous supprimer cette commande de la file d'attente ?",
//       [
//         { text: "Annuler", style: "cancel" },
//         {
//           text: "Supprimer",
//           style: "destructive",
//           onPress: async () => {
//             try {
//               await removeFromOfflineQueue(orderAction.id);
//               await loadOfflineOrders(); // Recharger la liste
//               Alert.alert("Succès", "Commande supprimée de la file d'attente");
//             } catch (error) {
//               Alert.alert("Erreur", "Impossible de supprimer la commande");
//             }
//           },
//         },
//       ]
//     );
//   };

//   const handleEditOrder = (orderAction) => {
//     // Préparer les données pour l'écran d'édition
//     const { payload } = orderAction;
//     const isReturn = orderAction.type === "orders/addOrderReturn";

//     // Créer un objet client basique à partir des données disponibles
//     const client = {
//       kunnr: payload.SoldToParty || payload.SoldToParty,
//       name1: `Client ${payload.SoldToParty}`, // Nom générique
//     };

//     // Transformer les items en format attendu par l'écran d'édition
//     const items = payload.to_Item.map((item) => {
//       // Rechercher l'article correspondant dans le tableau articles
//       const articleFound = articles.find(
//         (article) => article.id === item.Material
//       );

//       return {
//         id: item.Material,
//         designation: articleFound
//           ? articleFound.designation
//           : `Article ${item.Material}`, // Utiliser la vraie désignation ou nom générique
//         quantity: parseInt(item.RequestedQuantity),
//         prix: articleFound ? articleFound.prix : 0, // Utiliser le vrai prix ou 0 par défaut
//         unite: articleFound ? articleFound.unite : "", // Utiliser la vraie unité ou "PC" par défaut
//         discount: 0,
//       };
//     });

//     navigation.navigate("edit_offline_cmd", {
//       orderAction,
//       client,
//       items,
//       motif: isReturn ? { Augru: payload.SDDocumentReason } : null,
//     });
//   };

//   const getOrderTypeDisplay = (action) => {
//     if (action.type === "orders/addOrderReturn") {
//       return {
//         type: "Commande Retour",
//         icon: "assignment-return",
//         color: "#FF5722",
//       };
//     }
//     return {
//       type: "Commande Vente",
//       icon: "assignment",
//       color: "#03A9F4",
//     };
//   };

//   const formatDate = (timestamp) => {
//     return new Date(timestamp).toLocaleString("fr-FR", {
//       day: "2-digit",
//       month: "2-digit",
//       year: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   };

//   const renderOfflineOrder = ({ item }) => {
//     const orderType = getOrderTypeDisplay(item);
//     const itemCount = item.payload.to_Item?.length || 0;

//     return (
//       <View style={styles.orderCard}>
//         <View style={styles.orderHeader}>
//           <View style={styles.orderTypeContainer}>
//             <MaterialIcons
//               name={orderType.icon}
//               size={24}
//               color={orderType.color}
//             />
//             <View style={styles.orderTypeInfo}>
//               <Text style={[styles.orderType, { color: orderType.color }]}>
//                 {orderType.type}
//               </Text>
//               <Text style={styles.orderId}>ID: {item.id.split("-")[0]}</Text>
//             </View>
//           </View>
//           <TouchableOpacity
//             style={styles.deleteButton}
//             onPress={() => handleDeleteOrder(item)}
//           >
//             <MaterialIcons name="delete" size={24} color="#e53935" />
//           </TouchableOpacity>
//         </View>

//         <View style={styles.orderDetails}>
//           <View style={styles.detailRow}>
//             <MaterialIcons name="person" size={16} color="#757575" />
//             <Text style={styles.detailText}>
//               Client: {item.payload.SoldToParty}
//             </Text>
//           </View>

//           <View style={styles.detailRow}>
//             <MaterialIcons name="shopping-cart" size={16} color="#757575" />
//             <Text style={styles.detailText}>
//               {itemCount} article{itemCount > 1 ? "s" : ""}
//             </Text>
//           </View>

//           <View style={styles.detailRow}>
//             <MaterialIcons name="access-time" size={16} color="#757575" />
//             <Text style={styles.detailText}>
//               Créé le: {formatDate(item.timestamp)}
//             </Text>
//           </View>
//         </View>

//         <View style={styles.orderActions}>
//           <TouchableOpacity
//             style={[styles.actionButton, styles.editButton]}
//             onPress={() => handleEditOrder(item)}
//           >
//             <MaterialIcons name="edit" size={20} color="white" />
//             <Text style={styles.actionButtonText}>Modifier</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     );
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar backgroundColor="#03A9F4" barStyle="light-content" />

//       <View style={styles.headerContainer}>
//         <View style={styles.statsContainer}>
//           <MaterialIcons name="cloud-off" size={24} color="white" />
//           <Text style={styles.statsText}>
//             {offlineOrders.length} commande{offlineOrders.length > 1 ? "s" : ""}{" "}
//             en attente
//           </Text>
//         </View>
//       </View>

//       {offlineOrders.length === 0 ? (
//         <View style={styles.emptyContainer}>
//           <MaterialIcons name="cloud-done" size={64} color="#E0E0E0" />
//           <Text style={styles.emptyTitle}>Aucune commande hors ligne</Text>
//           <Text style={styles.emptySubtitle}>
//             Toutes vos commandes sont synchronisées
//           </Text>
//         </View>
//       ) : (
//         <FlatList
//           data={offlineOrders}
//           renderItem={renderOfflineOrder}
//           keyExtractor={(item) => item.id}
//           contentContainerStyle={styles.listContainer}
//           refreshControl={
//             <RefreshControl
//               refreshing={loading}
//               onRefresh={loadOfflineOrders}
//               colors={["#03A9F4"]}
//             />
//           }
//         />
//       )}
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
//     padding: 16,
//     borderBottomLeftRadius: 15,
//     borderBottomRightRadius: 15,
//   },
//   statsContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   statsText: {
//     color: "white",
//     fontSize: 16,
//     fontWeight: "bold",
//     marginLeft: 8,
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 20,
//   },
//   emptyTitle: {
//     fontSize: 18,
//     fontWeight: "bold",
//     color: "#757575",
//     marginTop: 16,
//   },
//   emptySubtitle: {
//     fontSize: 14,
//     color: "#9E9E9E",
//     marginTop: 8,
//     textAlign: "center",
//   },
//   listContainer: {
//     padding: 12,
//   },
//   orderCard: {
//     backgroundColor: "white",
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 12,
//     elevation: 2,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//   },
//   orderHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 12,
//   },
//   orderTypeContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     flex: 1,
//   },
//   orderTypeInfo: {
//     marginLeft: 12,
//   },
//   orderType: {
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   orderId: {
//     fontSize: 12,
//     color: "#757575",
//     marginTop: 2,
//   },
//   deleteButton: {
//     padding: 4,
//   },
//   orderDetails: {
//     marginBottom: 16,
//   },
//   detailRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 8,
//   },
//   detailText: {
//     marginLeft: 8,
//     fontSize: 14,
//     color: "#424242",
//   },
//   orderActions: {
//     flexDirection: "row",
//     justifyContent: "flex-end",
//   },
//   actionButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 8,
//     marginLeft: 8,
//   },
//   editButton: {
//     backgroundColor: "#4CAF50",
//   },
//   actionButtonText: {
//     color: "white",
//     fontSize: 14,
//     fontWeight: "bold",
//     marginLeft: 4,
//   },
// });

// export default OfflineOrdersScreen;

import React, {
  useLayoutEffect,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  FlatList,
  Alert,
  RefreshControl,
} from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Modalize } from "react-native-modalize";
import {
  getOfflineActionQueue,
  removeFromOfflineQueue,
  clearOfflineQueue,
} from "../utils/offlineUtils";
import { useDispatch, useSelector } from "react-redux";
import { completeDeliveryProcess } from "../services/outboundService";
import {
  fetchPendingActionsCount,
  loadOfflineOrders,
  retryFailedOrder,
} from "../redux/slices/offlineSlice";
import { syncOfflineData } from "../redux/offlineActions/offlineActions";
import { wp, hp, fs, fontWeight, scale } from "../utils/responsive";

const OfflineOrdersScreen = ({ route }) => {
  const navigation = useNavigation();
  const { client } = route.params;
  const clientName = client.name1;
  const dispatch = useDispatch();
  const { offlineOrders, isServerReachable } = useSelector(
    (state) => state.offline
  );
  // const [offlineOrders, setOfflineOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { articles } = useSelector((state) => state.articles);
  const modalizeRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      dispatch(loadOfflineOrders(client.kunnr));
    }, [])
  );

  const handleClearAllOrders = () => {
    if (offlineOrders.length === 0) {
      Alert.alert("Information", "Aucune commande hors ligne à supprimer");
      return;
    }

    Alert.alert(
      "Confirmation",
      "Voulez-vous supprimer toutes les commandes hors ligne ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer tout",
          style: "destructive",
          onPress: async () => {
            try {
              await clearOfflineQueue();
              setOfflineOrders([]);
              Alert.alert(
                "Succès",
                "Toutes les commandes hors ligne ont été supprimées"
              );
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer les commandes");
            }
          },
        },
      ]
    );
  };

  const openOrderActions = (orderAction) => {
    setSelectedOrder(orderAction);
    modalizeRef.current?.open();
  };

  const handleDeleteOrder = () => {
    modalizeRef.current?.close();
    if (!selectedOrder) return;

    Alert.alert(
      "Confirmation",
      "Voulez-vous supprimer cette commande de la file d'attente ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await removeFromOfflineQueue(selectedOrder.id);
              await dispatch(loadOfflineOrders(client.kunnr)); // Recharger la liste
              await dispatch(fetchPendingActionsCount()); // Recharger la liste
              Alert.alert("Succès", "Commande supprimée de la file d'attente");
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer la commande");
            }
          },
        },
      ]
    );
  };

  const handleEditOrder = () => {
    modalizeRef.current?.close();
    if (!selectedOrder) return;

    // Préparer les données pour l'écran d'édition
    const { payload } = selectedOrder;
    const isReturn = selectedOrder.type === "orders/addOrderReturn";
    const error = selectedOrder?.error;
    // Créer un objet client basique à partir des données disponibles
    const client = {
      kunnr: payload.SoldToParty || payload.SoldToParty,
      name: clientName, // Nom générique
    };

    // Transformer les items en format attendu par l'écran d'édition
    const items = payload.to_Item.map((item) => {
      // Rechercher l'article correspondant dans le tableau articles
      const articleFound = articles.find(
        (article) => article.id === item.Material
      );

      return {
        id: item.Material,
        designation: articleFound
          ? articleFound.designation
          : `Article ${item.Material}`, // Utiliser la vraie désignation ou nom générique
        quantity: parseInt(item.RequestedQuantity),
        prix: articleFound ? articleFound.prix : 0, // Utiliser le vrai prix ou 0 par défaut
        unite: articleFound ? articleFound.unite : "", // Utiliser la vraie unité ou "PC" par défaut
        discount: 0,
      };
    });

    navigation.navigate("edit_offline_cmd", {
      orderAction: selectedOrder,
      client,
      items,
      motif: isReturn ? { Augru: payload.SDDocumentReason } : null,
      error,
      onEditComplete: handleRefresh,
    });
  };

  const getOrderTypeDisplay = (action) => {
    if (action.type === "orders/addOrderReturn") {
      return {
        type: "Commande Retour",
        icon: "assignment-return",
        color: "#FF5722",
      };
    }
    return {
      type: "Commande offre",
      icon: "assignment",
      color: "#03A9F4",
    };
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleRefresh = async () => {
    await dispatch(loadOfflineOrders(client.kunnr));
    await dispatch(fetchPendingActionsCount()); // Recharger la liste
  };

  const renderOfflineOrder = ({ item }) => {
    const orderType = getOrderTypeDisplay(item);
    const itemCount = item.payload.to_Item?.length || 0;
    const hasError = item.failed;

    return (
      // <TouchableOpacity
      //   style={styles.orderCard}
      //   onPress={() => openOrderActions(item)}
      //   activeOpacity={0.7}
      // >
      //   <View style={styles.orderHeader}>
      //     <View style={styles.orderTypeContainer}>
      //       <MaterialIcons
      //         name={orderType.icon}
      //         size={24}
      //         color={orderType.color}
      //       />
      //       <View style={styles.orderTypeInfo}>
      //         <Text style={[styles.orderType, { color: orderType.color }]}>
      //           {orderType.type}
      //         </Text>
      //         {/* <Text style={styles.orderId}>ID: {item.id.split("-")[0]}</Text> */}
      //       </View>
      //     </View>
      //     <MaterialIcons name="more-vert" size={24} color="#757575" />
      //   </View>

      //   <View style={styles.orderDetails}>
      //     {/* <View style={styles.detailRow}>
      //       <MaterialIcons name="person" size={16} color="#757575" />
      //       <Text style={styles.detailText}>
      //         Client: {item.payload.SoldToParty}
      //       </Text>
      //     </View> */}

      //     <View style={styles.detailRow}>
      //       <MaterialIcons name="shopping-cart" size={16} color="#757575" />
      //       <Text style={styles.detailText}>
      //         {itemCount} article{itemCount > 1 ? "s" : ""}
      //       </Text>
      //     </View>

      //     <View style={styles.detailRow}>
      //       <MaterialIcons name="access-time" size={16} color="#757575" />
      //       <Text style={styles.detailText}>
      //         Créé le: {formatDate(item.timestamp)}
      //       </Text>
      //     </View>
      //   </View>
      // </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.orderCard,
          hasError && styles.orderCardError, // Style pour les commandes en erreur
        ]}
        onPress={() => openOrderActions(item)}
        activeOpacity={0.7}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderTypeContainer}>
            <MaterialIcons
              name={hasError ? "error" : orderType.icon}
              size={24}
              color={hasError ? "#F44336" : orderType.color}
            />
            <View style={styles.orderTypeInfo}>
              <Text
                style={[
                  styles.orderType,
                  { color: hasError ? "#F44336" : orderType.color },
                ]}
              >
                {hasError ? "Commande en erreur" : orderType.type}
              </Text>
            </View>
          </View>
          <MaterialIcons name="more-vert" size={24} color="#757575" />
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <MaterialIcons name="shopping-cart" size={16} color="#757575" />
            <Text style={styles.detailText}>
              {itemCount} article{itemCount > 1 ? "s" : ""}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialIcons name="access-time" size={16} color="#757575" />
            <Text style={styles.detailText}>
              Créé le: {formatDate(item.timestamp)}
            </Text>
          </View>

          {hasError && (
            <View style={styles.detailRow}>
              <MaterialIcons name="error-outline" size={16} color="#F44336" />
              <Text style={[styles.detailText, styles.errorText]}>
                {item.error}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  // Ajouter ces fonctions dans le composant
  const handleRetryOrder = async (hasError) => {
    modalizeRef.current?.close();
    if (!selectedOrder) return;

    const executeSync = async () => {
      try {
        // Si erreur, d'abord retry, sinon synchroniser directement
        if (hasError) {
          await dispatch(retryFailedOrder(selectedOrder.id));
        }

        // Tenter la synchronisation spécifique
        const syncResult = await dispatch(syncOfflineData(selectedOrder.id));

        // Rafraîchir les données
        await handleRefresh();

        // Vérifier si la synchronisation a réussi
        if (syncResult.payload && syncResult.payload.success) {
          Alert.alert("Succès", "Commande synchronisée avec succès");
        } else {
          const errorMessage =
            syncResult.payload?.message ||
            syncResult.payload?.errorDetails?.[0]?.error ||
            "Erreur lors de la synchronisation";
          Alert.alert("Erreur", errorMessage);
        }
      } catch (error) {
        console.error("Erreur lors de l'opération:", error);
        Alert.alert(
          "Erreur",
          `Impossible de ${hasError ? "réessayer" : "synchroniser"} la commande`
        );
      }
    };

    if (hasError) {
      Alert.alert("Confirmation", "Voulez-vous réessayer cette commande ?", [
        { text: "Annuler", style: "cancel" },
        { text: "Réessayer", onPress: executeSync },
      ]);
    } else {
      await executeSync();
    }
  };

  const handleSyncSpecificOrder = async () => {
    try {
      setLoading(true);
      await dispatch(syncOfflineData(selectedOrder.id));
      await handleRefresh();
      Alert.alert("Succès", "Action synchronisée");
    } catch (error) {
      Alert.alert("Erreur", "Erreur lors de la synchronisation");
    } finally {
      setLoading(false);
    }
  };
  // const renderActionModal = () => {
  //   if (!selectedOrder) return null;

  //   const orderType = getOrderTypeDisplay(selectedOrder);

  //   return (
  //     <View style={styles.modalContent}>
  //       {/* <View style={styles.modalHeader}>
  //         <View style={styles.modalOrderInfo}>
  //           <MaterialIcons
  //             name={orderType.icon}
  //             size={28}
  //             color={orderType.color}
  //           />
  //           <View style={styles.modalOrderDetails}>
  //             <Text style={[styles.modalOrderType, { color: orderType.color }]}>
  //               {orderType.type}
  //             </Text>
  //             <Text style={styles.modalOrderId}>
  //               ID: {selectedOrder.id.split("-")[0]}
  //             </Text>
  //             <Text style={styles.modalClientText}>
  //               Client: {selectedOrder.payload.SoldToParty}
  //             </Text>
  //           </View>
  //         </View>
  //       </View>

  //       <View style={styles.modalActions}>
  //         <TouchableOpacity
  //           style={[styles.modalActionButton, styles.editActionButton]}
  //           onPress={handleEditOrder}
  //         >
  //           <MaterialIcons name="edit" size={24} color="white" />
  //           <Text style={styles.modalActionText}>Modifier</Text>
  //         </TouchableOpacity>

  //         <TouchableOpacity
  //           style={[styles.modalActionButton, styles.deleteActionButton]}
  //           onPress={handleDeleteOrder}
  //         >
  //           <MaterialIcons name="delete" size={24} color="white" />
  //           <Text style={styles.modalActionText}>Supprimer</Text>
  //         </TouchableOpacity>
  //       </View> */}
  //       <View style={styles.actionModalContainer}>
  //         <Text style={styles.actionModalTitle}>Actions</Text>

  //         <TouchableOpacity
  //           style={styles.actionButton}
  //           onPress={handleEditOrder}
  //         >
  //           <MaterialIcons name="edit" size={24} color="#2196F3" />
  //           <Text style={styles.actionButtonText}>Modifier la commande</Text>
  //         </TouchableOpacity>

  //         <TouchableOpacity
  //           style={[styles.actionButton, styles.deleteButton]}
  //           onPress={handleDeleteOrder}
  //         >
  //           <MaterialIcons name="delete" size={24} color="#F44336" />
  //           <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
  //             Supprimer la commande
  //           </Text>
  //         </TouchableOpacity>

  //         <TouchableOpacity
  //           style={styles.cancelButton}
  //           onPress={() => modalizeRef.current?.close()}
  //         >
  //           <Text style={styles.cancelButtonText}>Annuler</Text>
  //         </TouchableOpacity>
  //       </View>
  //     </View>
  //   );
  // };

  // Modifier renderActionModal pour inclure l'option retry
  const renderActionModal = () => {
    if (!selectedOrder) return null;

    const orderType = getOrderTypeDisplay(selectedOrder);
    const hasError = selectedOrder.failed;

    return (
      <View style={styles.modalContent}>
        <View style={styles.actionModalContainer}>
          <Text style={styles.actionModalTitle}>Actions</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleEditOrder}
          >
            <MaterialIcons name="edit" size={24} color="#2196F3" />
            <Text style={styles.actionButtonText}>Modifier la commande</Text>
          </TouchableOpacity>

          {isServerReachable && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleRetryOrder(hasError)}
            >
              <MaterialIcons name="refresh" size={24} color="#FF9800" />
              <Text style={styles.actionButtonText}>
                {hasError ? "Réessayer la commande" : "Syncroniser la commande"}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDeleteOrder}
          >
            <MaterialIcons name="delete" size={24} color="#F44336" />
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
              Supprimer la commande
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => modalizeRef.current?.close()}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#03A9F4" barStyle="light-content" />

      {/* <View style={styles.headerContainer}>
        <View style={styles.statsContainer}>
          <MaterialIcons name="cloud-off" size={24} color="white" />
          <Text style={styles.statsText}>
            {offlineOrders.length} commande{offlineOrders.length > 1 ? "s" : ""}{" "}
            en attente
          </Text>
        </View>
      </View> */}

      {offlineOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="cloud-done" size={64} color="#E0E0E0" />
          <Text style={styles.emptyTitle}>
            Aucune commande/offre hors ligne
          </Text>
          <Text style={styles.emptySubtitle}>
            Toutes vos commandes / offres sont synchronisées
          </Text>
        </View>
      ) : (
        <FlatList
          data={offlineOrders}
          renderItem={renderOfflineOrder}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={handleRefresh}
              colors={["#03A9F4", "#FFC107", "#4CAF50"]}
            />
          }
        />
      )}

      <Modalize
        ref={modalizeRef}
        adjustToContentHeight
        withHandle={false}
        modalStyle={styles.modal}
        overlayStyle={styles.overlay}
      >
        {renderActionModal()}
      </Modalize>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  orderCardError: {
    borderLeftWidth: scale(4),
    borderLeftColor: "#F44336",
    backgroundColor: "#FFEBEE",
  },
  errorText: {
    color: "#F44336",
    fontStyle: "italic",
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  headerContainer: {
    backgroundColor: "#03A9F4",
    padding: wp(3.9), // 16/412 * 100 ≈ 3.9
    borderBottomLeftRadius: scale(15),
    borderBottomRightRadius: scale(15),
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  statsText: {
    color: "white",
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
    marginLeft: wp(1.9), // 8/412 * 100 ≈ 1.9
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: wp(4.9), // 20/412 * 100 ≈ 4.9
  },
  emptyTitle: {
    fontSize: fs(18),
    fontWeight: fontWeight.bold,
    color: "#757575",
    marginTop: hp(1.7), // 16/915 * 100 ≈ 1.7
  },
  emptySubtitle: {
    fontSize: fs(14),
    color: "#9E9E9E",
    marginTop: hp(0.9), // 8/915 * 100 ≈ 0.9
    textAlign: "center",
  },
  listContainer: {
    marginTop: hp(1.1), // 10/915 * 100 ≈ 1.1
  },
  orderCard: {
    backgroundColor: "white",
    padding: wp(3.9), // 16/412 * 100 ≈ 3.9
    marginBottom: hp(0.2), // 2/915 * 100 ≈ 0.2
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(1.3), // 12/915 * 100 ≈ 1.3
  },
  orderTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  orderTypeInfo: {
    marginLeft: wp(2.9), // 12/412 * 100 ≈ 2.9
  },
  orderType: {
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
  },
  orderId: {
    fontSize: fs(12),
    color: "#757575",
    marginTop: hp(0.2), // 2/915 * 100 ≈ 0.2
  },
  orderDetails: {
    marginBottom: hp(0.9), // 8/915 * 100 ≈ 0.9
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp(0.9), // 8/915 * 100 ≈ 0.9
  },
  detailText: {
    marginLeft: wp(1.9), // 8/412 * 100 ≈ 1.9
    fontSize: fs(14),
    color: "#424242",
  },
  modal: {
    backgroundColor: "white",
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
  },
  overlay: {
    backgroundColor: "rgba(209, 214, 222, 0.25)",
  },
  modalContent: {
    // padding: 20,
  },
  modalHeader: {
    marginBottom: hp(2.6), // 24/915 * 100 ≈ 2.6
    paddingBottom: hp(1.7), // 16/915 * 100 ≈ 1.7
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalOrderInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalOrderDetails: {
    marginLeft: wp(3.9), // 16/412 * 100 ≈ 3.9
    flex: 1,
  },
  modalOrderType: {
    fontSize: fs(18),
    fontWeight: fontWeight.bold,
  },
  modalOrderId: {
    fontSize: fs(14),
    color: "#757575",
    marginTop: hp(0.4), // 4/915 * 100 ≈ 0.4
  },
  modalClientText: {
    fontSize: fs(14),
    color: "#424242",
    marginTop: hp(0.4), // 4/915 * 100 ≈ 0.4
  },
  modalActions: {
    gap: hp(1.3), // 12/915 * 100 ≈ 1.3
  },
  modalActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: hp(1.7), // 16/915 * 100 ≈ 1.7
    paddingHorizontal: wp(4.9), // 20/412 * 100 ≈ 4.9
    borderRadius: scale(12),
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  editActionButton: {
    backgroundColor: "#4CAF50",
  },
  deleteActionButton: {
    backgroundColor: "#e53935",
  },
  modalActionText: {
    color: "white",
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
    marginLeft: wp(1.9), // 8/412 * 100 ≈ 1.9
  },
  actionModalContainer: {
    padding: wp(5.8), // 24/412 * 100 ≈ 5.8
  },
  actionModalTitle: {
    fontSize: fs(18),
    fontWeight: fontWeight.bold,
    marginBottom: hp(2.6), // 24/915 * 100 ≈ 2.6
    textAlign: "center",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: hp(1.7), // 16/915 * 100 ≈ 1.7
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  actionButtonText: {
    fontSize: fs(16),
    marginLeft: wp(3.9), // 16/412 * 100 ≈ 3.9
    color: "#333",
  },
  deleteButton: {
    borderBottomWidth: 0,
    marginBottom: hp(1.7), // 16/915 * 100 ≈ 1.7
  },
  deleteButtonText: {
    color: "#F44336",
  },
  cancelButton: {
    backgroundColor: "#EEEEEE",
    borderRadius: scale(8),
    padding: wp(3.9), // 16/412 * 100 ≈ 3.9
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: fs(16),
    color: "#333",
    fontWeight: fontWeight.medium,
  },
});

export default OfflineOrdersScreen;
