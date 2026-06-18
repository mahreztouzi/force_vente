// import React, { useEffect, useRef, useState, useCallback } from "react";
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   ActivityIndicator,
//   Alert,
//   AppState,
//   ToastAndroid,
//   Platform,
//   Animated,
// } from "react-native";
// import { useDispatch, useSelector } from "react-redux";
// import NetInfo from "@react-native-community/netinfo";
// import { Ionicons } from "@expo/vector-icons";
// import {
//   checkAndUpdateConnectionStatus,
//   syncOfflineData,
// } from "../redux/offlineActions/offlineActions";
// import {
//   fetchPendingActionsCount,
//   resetSyncStatus,
// } from "../redux/slices/offlineSlice";

// // Configuration
// const CONNECTION_CHECK_INTERVAL = 30000; // Check every 30 seconds
// const SYNC_STATUS_DISPLAY_TIME = 5000; // Display sync status for 5 seconds
// const SAP_POLLING_INTERVAL = 15000; // Test SAP connection every 15 seconds when internet available but SAP not
// const AUTO_SYNC_ENABLED = false; // DÉSACTIVÉ - Flag to enable/disable automatic synchronization
// const ONLINE_DISPLAY_DURATION = 3000; // Durée d'affichage en ligne (3 secondes)
// const SYNC_COLOR = "#2196F3"; // Couleur pour l'état de synchronisation (bleu)

// // Helper function to show toast notifications on Android
// const showToast = (message) => {
//   if (Platform.OS === "android") {
//     ToastAndroid.show(message, ToastAndroid.SHORT);
//   }
//   // On iOS you might want to implement something similar with Alert or a custom component
// };

// // Global sync lock - to prevent simultaneous syncs
// let isSyncInProgress = false;

// const ConnectionManager = ({ currentRoute }) => {
//   const dispatch = useDispatch();
//   const fadeAnim = useRef(new Animated.Value(1)).current;
//   // Check if current route is splash
//   const isSplashRoute = currentRoute === "splash" || currentRoute === "Login";

//   // Si on est sur la route splash, ne pas rendre le composant
//   if (isSplashRoute) {
//     console.log("issplashscreeen route", currentRoute, isSplashRoute);
//   }

//   // Get state from Redux
//   const {
//     isConnected,
//     isServerReachable,
//     pendingActions,
//     syncStatus,
//     isSyncing,
//   } = useSelector((state) => state.offline);

//   // Local state
//   const [isTestingSap, setIsTestingSap] = useState(false);
//   const [isPolling, setIsPolling] = useState(false);
//   const [lastSyncTimestamp, setLastSyncTimestamp] = useState(0);
//   const [visible, setVisible] = useState(true);
//   const [manualSyncCompleted, setManualSyncCompleted] = useState(false);
//   const [isAppInitialLoad, setIsAppInitialLoad] = useState(true);

//   // Refs
//   const intervalRef = useRef(null);
//   const sapPollingIntervalRef = useRef(null);
//   const appState = useRef(AppState.currentState);
//   const hideTimeoutRef = useRef(null);

//   // Determine connection state
//   const networkConnected = isConnected;
//   const serverReachable = isServerReachable;
//   const connectionState = !networkConnected
//     ? "offline"
//     : serverReachable
//     ? "online"
//     : "internet_only";

//   // Get status text and color based on connection state
//   const getStatusInfo = () => {
//     switch (connectionState) {
//       case "online":
//         return {
//           text: "Connexion rétablie.",
//           color: "rgb(37, 198, 72)",
//           Ionicons: "earth",
//         };
//       case "internet_only":
//         return {
//           text: "Internet disponible (SAP inaccessible)",
//           color: "rgb(0, 0, 0)",
//           Ionicons: "cloud-offline",
//         };
//       case "offline":
//         return {
//           text: "Aucune connexion Internet.",
//           color: "rgb(0, 0, 0)",
//           Ionicons: "cloud-offline-outline",
//           textColor: "rgb(224, 67, 67)",
//         };
//       default:
//         return { text: "Statut inconnu", color: "#9E9E9E" };
//     }
//   };

//   const statusInfo = getStatusInfo();

//   // Function to check connection and update status
//   const checkConnection = useCallback(async () => {
//     try {
//       const result = await dispatch(checkAndUpdateConnectionStatus());
//       return result.payload;
//     } catch (error) {
//       console.error("Error checking connection:", error);
//       return null;
//     }
//   }, [dispatch]);

//   // Function to check connection ONLY (sans synchronisation automatique)
//   const checkConnectionOnly = useCallback(async () => {
//     // Prevent check if already in progress
//     if (isSyncInProgress) {
//       console.log("Sync already in progress, skipping connection check");
//       return;
//     }

//     // First update the connection status
//     const connectionStatus = await checkConnection();

//     // Log the connection status but don't auto-sync
//     if (connectionStatus) {
//       console.log("Connection status updated:", {
//         network: connectionStatus.isNetworkConnected,
//         server: connectionStatus.isServerReachable,
//         pendingActions: pendingActions,
//       });

//       // Just show a toast when connection is restored (optional)
//       if (
//         connectionStatus.isNetworkConnected &&
//         connectionStatus.isServerReachable &&
//         pendingActions > 0
//       ) {
//         console.log(
//           `Connection restored. ${pendingActions} actions ready for manual sync`
//         );
//       }
//     }
//   }, [checkConnection, pendingActions]);

//   // Start SAP polling
//   const startSapPolling = useCallback(() => {
//     if (sapPollingIntervalRef.current) return; // Avoid duplicates

//     setIsPolling(true);
//     console.log("Starting SAP connection polling");
//     showToast("Testing SAP connection automatically...");

//     sapPollingIntervalRef.current = setInterval(() => {
//       setIsTestingSap(true);
//       checkConnection()
//         .then((status) => {
//           if (status && status.isServerReachable) {
//             console.log("SAP connection restored");
//             showToast("SAP connection restored!");

//             // Ne plus déclencher de synchronisation automatique
//             // Juste informer que la connexion est rétablie
//             if (pendingActions > 0) {
//               console.log(
//                 `SAP connection restored. ${pendingActions} actions ready for manual sync`
//               );
//             }
//           }
//         })
//         .finally(() => {
//           setIsTestingSap(false);
//         });
//     }, SAP_POLLING_INTERVAL);
//   }, [checkConnection, pendingActions]);

//   // Stop SAP polling
//   const stopSapPolling = useCallback(() => {
//     if (sapPollingIntervalRef.current) {
//       clearInterval(sapPollingIntervalRef.current);
//       sapPollingIntervalRef.current = null;
//       setIsPolling(false);
//     }
//   }, []);

//   // Handle synchronization (UNIQUEMENT MANUELLE)
//   const handleSync = useCallback(
//     async (skipConfirmation = false) => {
//       // Prevent synchronization if not connected or already in progress
//       if (
//         isSyncInProgress ||
//         isSyncing ||
//         !networkConnected ||
//         !serverReachable
//       ) {
//         console.log("Sync skipped: already in progress or not connected");
//         return;
//       }

//       // If not triggered automatically and there are multiple actions, confirm with user
//       if (!skipConfirmation && pendingActions > 1) {
//         confirmSync();
//         return;
//       }

//       // Set both global and local sync flags
//       isSyncInProgress = true;
//       setLastSyncTimestamp(Date.now());

//       try {
//         console.log(
//           `Starting MANUAL synchronization of ${pendingActions} actions`
//         );
//         await dispatch(syncOfflineData());
//         console.log("Manual synchronization completed");

//         // Marquer que la synchronisation manuelle est terminée
//         setManualSyncCompleted(true);
//       } catch (error) {
//         console.error("Sync error:", error);
//       } finally {
//         // Clear sync flags
//         isSyncInProgress = false;

//         // Update pending actions count after sync
//         dispatch(fetchPendingActionsCount());
//       }
//     },
//     [isSyncing, networkConnected, serverReachable, pendingActions, dispatch]
//   );

//   // Manually test connection
//   const handleTestConnection = () => {
//     setIsTestingSap(true);
//     dispatch(fetchPendingActionsCount());
//     checkConnection().finally(() => {
//       setIsTestingSap(false);
//     });
//   };

//   // Confirm before synchronizing
//   const confirmSync = () => {
//     Alert.alert(
//       "Synchronisation",
//       `Vous avez ${pendingActions} action(s) en attente. Voulez-vous synchroniser maintenant ?`,
//       [
//         { text: "Annuler", style: "cancel" },
//         { text: "Synchroniser", onPress: () => handleSync(true) },
//       ]
//     );
//   };

//   // Handle app state changes (sans auto-sync)
//   useEffect(() => {
//     const handleAppStateChange = (nextAppState) => {
//       if (
//         appState.current.match(/inactive|background/) &&
//         nextAppState === "active"
//       ) {
//         // Only check connection, no auto-sync
//         if (!isSyncInProgress) {
//           console.log("App returned to foreground, checking connection only");
//           checkConnectionOnly();
//         } else {
//           console.log(
//             "App returned to foreground but sync already in progress"
//           );
//         }
//       }
//       appState.current = nextAppState;
//     };

//     // Set up app state listener
//     const appStateSubscription = AppState.addEventListener(
//       "change",
//       handleAppStateChange
//     );

//     return () => {
//       appStateSubscription.remove();
//     };
//   }, [checkConnectionOnly]);

//   // Set up connection change listener and periodic checks
//   useEffect(() => {
//     // Initial check
//     dispatch(checkAndUpdateConnectionStatus());
//     dispatch(fetchPendingActionsCount());

//     // Marquer le premier chargement de l'application
//     setIsAppInitialLoad(true);

//     // Network change handler with debounce
//     let networkChangeTimeout = null;
//     const handleNetworkChange = (state) => {
//       // Clear any pending network change handlers
//       if (networkChangeTimeout) {
//         clearTimeout(networkChangeTimeout);
//       }

//       // Debounce network changes to prevent multiple rapid triggers
//       networkChangeTimeout = setTimeout(() => {
//         if (state.isConnected) {
//           // When we detect a network connection, check full status (sans auto-sync)
//           if (!isSyncInProgress) {
//             console.log(
//               "Network connection detected, checking SAP connectivity"
//             );
//             checkConnectionOnly();
//           }
//         } else {
//           // Update our redux state to show we're offline
//           console.log("Network disconnected, updating status");
//           dispatch(checkAndUpdateConnectionStatus());
//         }
//       }, 1000); // 1 second debounce
//     };

//     // Subscribe to network state changes
//     const unsubscribe = NetInfo.addEventListener(handleNetworkChange);

//     // Set up periodic check (sans auto-sync)
//     intervalRef.current = setInterval(() => {
//       if (!isSyncInProgress) {
//         console.log("Performing periodic connection check (no auto-sync)");
//         checkConnectionOnly();
//       } else {
//         console.log("Skipping periodic check - sync already in progress");
//       }
//     }, CONNECTION_CHECK_INTERVAL);

//     // Cleanup
//     return () => {
//       unsubscribe();
//       if (networkChangeTimeout) {
//         clearTimeout(networkChangeTimeout);
//       }
//       clearInterval(intervalRef.current);
//       stopSapPolling();
//       if (hideTimeoutRef.current) {
//         clearTimeout(hideTimeoutRef.current);
//       }
//     };
//   }, [dispatch, checkConnectionOnly, stopSapPolling]);

//   // Start/stop SAP polling based on connection state
//   useEffect(() => {
//     if (
//       networkConnected &&
//       !serverReachable &&
//       !sapPollingIntervalRef.current
//     ) {
//       // Start polling if we have internet but no SAP
//       startSapPolling();
//     } else if (
//       (!networkConnected || serverReachable) &&
//       sapPollingIntervalRef.current
//     ) {
//       // Stop polling if we've lost internet or SAP is now reachable
//       stopSapPolling();
//     }
//   }, [networkConnected, serverReachable, startSapPolling, stopSapPolling]);

//   // Auto-hide successful sync status messages
//   useEffect(() => {
//     let timeout;
//     if (syncStatus && syncStatus.message && syncStatus.success) {
//       timeout = setTimeout(() => {
//         dispatch(resetSyncStatus());
//       }, SYNC_STATUS_DISPLAY_TIME);
//     }

//     return () => {
//       if (timeout) clearTimeout(timeout);
//     };
//   }, [syncStatus, dispatch]);

//   // Gestion de l'affichage/masquage du composant selon l'état de connexion
//   useEffect(() => {
//     // Réinitialiser l'animation et les timeouts si nécessaire
//     if (hideTimeoutRef.current) {
//       clearTimeout(hideTimeoutRef.current);
//     }

//     // Cas particulier du premier chargement de l'app
//     if (
//       isAppInitialLoad &&
//       connectionState === "online" &&
//       pendingActions === 0
//     ) {
//       // Au premier chargement, si en ligne et pas d'actions en attente, on affiche puis masque
//       setVisible(true);
//       fadeAnim.setValue(1);

//       hideTimeoutRef.current = setTimeout(() => {
//         Animated.timing(fadeAnim, {
//           toValue: 0,
//           duration: 500,
//           useNativeDriver: true,
//         }).start(() => {
//           setVisible(false);
//         });
//       }, ONLINE_DISPLAY_DURATION);

//       // Marquer que le premier chargement est fait
//       setIsAppInitialLoad(false);
//       return;
//     }

//     // Si on a une synchronisation manuelle qui vient de se terminer avec succès
//     if (
//       manualSyncCompleted &&
//       connectionState === "online" &&
//       pendingActions === 0
//     ) {
//       // On garde visible l'indicateur vert "en ligne"
//       setVisible(true);
//       fadeAnim.setValue(1);

//       // Réinitialiser l'état de synchronisation manuelle
//       setManualSyncCompleted(false);
//       return;
//     }

//     // Si le composant est en mode synchronisation ou en attente de synchronisation
//     if (isSyncing || pendingActions > 0 || connectionState !== "online") {
//       // Toujours visible
//       setVisible(true);
//       fadeAnim.setValue(1);
//       return;
//     }

//     // Par défaut pour l'état en ligne sans actions en attente (après premier chargement)
//     // On masque après un délai, sauf si on est juste après une synchronisation
//     if (connectionState === "online" && pendingActions === 0) {
//       // Montrer d'abord le composant
//       setVisible(true);
//       fadeAnim.setValue(1);

//       // Puis le masquer après 3 secondes
//       hideTimeoutRef.current = setTimeout(() => {
//         // Animation de fondu
//         Animated.timing(fadeAnim, {
//           toValue: 0,
//           duration: 500,
//           useNativeDriver: true,
//         }).start(() => {
//           setVisible(false);
//         });
//       }, ONLINE_DISPLAY_DURATION);
//     }

//     return () => {
//       if (hideTimeoutRef.current) {
//         clearTimeout(hideTimeoutRef.current);
//       }
//     };
//   }, [
//     connectionState,
//     pendingActions,
//     fadeAnim,
//     isSyncing,
//     manualSyncCompleted,
//     isAppInitialLoad,
//   ]);

//   // Si le composant ne doit pas être affiché
//   if (!visible || isSplashRoute) {
//     return null;
//   }

//   // Fonction pour rendre le contenu principal
//   const renderContent = () => {
//     // Couleur de fond en fonction de l'état
//     let backgroundColor = statusInfo.color;

//     // Si nous sommes en train de synchroniser, utiliser la couleur bleue
//     if (isSyncing) {
//       backgroundColor = SYNC_COLOR;
//     }

//     // Si nous avons des actions en attente, on transforme la Vue en TouchableOpacity
//     if (pendingActions > 0) {
//       return (
//         <TouchableOpacity
//           style={[styles.container, { backgroundColor }]}
//           onPress={() => handleSync(false)}
//           disabled={!networkConnected || !serverReachable || isSyncing}
//           activeOpacity={!networkConnected || !serverReachable ? 1 : 0.7}
//         >
//           <View style={styles.statusContainer}>
//             <Ionicons
//               name={statusInfo?.Ionicons}
//               size={18}
//               color={
//                 statusInfo.text === "Aucune connexion Internet."
//                   ? "rgb(201, 28, 28)"
//                   : "white"
//               }
//             />
//             <Text
//               style={[
//                 styles.statusText,
//                 statusInfo.text === "Aucune connexion Internet." && {
//                   color: statusInfo.textColor,
//                 },
//               ]}
//             >
//               {isSyncing ? "Synchronisation en cours..." : statusInfo.text}
//               {/* {isPolling && !isSyncing && " (Test automatique en cours)"} */}
//               {isPolling && !isSyncing && ""}
//             </Text>
//             {pendingActions > 0 && !isSyncing && (
//               <View style={styles.badge}>
//                 <Text style={styles.badgeText}>{pendingActions}</Text>
//               </View>
//             )}
//             {isSyncing && (
//               <ActivityIndicator
//                 size="small"
//                 color="#FFFFFF"
//                 style={styles.activityIndicator}
//               />
//             )}
//           </View>
//         </TouchableOpacity>
//       );
//     } else {
//       // Sinon c'est une simple View
//       return (
//         <View style={[styles.container, { backgroundColor }]}>
//           <View style={styles.statusContainer}>
//             <Ionicons name={statusInfo?.Ionicons} size={18} color="white" />
//             <Text style={styles.statusText}>
//               {isSyncing ? "Synchronisation en cours..." : statusInfo.text}
//             </Text>
//             {isSyncing && (
//               <ActivityIndicator
//                 size="small"
//                 color="#FFFFFF"
//                 style={styles.activityIndicator}
//               />
//             )}
//           </View>
//         </View>
//       );
//     }
//   };

//   return (
//     <Animated.View style={{ opacity: fadeAnim }}>
//       {renderContent()}
//     </Animated.View>
//   );
// };

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  AppState,
  ActivityIndicator,
  Animated,
  FlatList,
  Dimensions,
  StyleSheet,
  Platform,
  ToastAndroid,
  BackHandler,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { Modalize } from "react-native-modalize";
import NetInfo from "@react-native-community/netinfo";
import {
  checkAndUpdateConnectionStatus,
  syncOfflineData,
} from "../redux/offlineActions/offlineActions";
import {
  fetchPendingActionsCount,
  resetSyncStatus,
} from "../redux/slices/offlineSlice";
import { getOfflineActionQueue } from "../utils/offlineUtils";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// Constantes
const CONNECTION_CHECK_INTERVAL = 30000;
const SAP_POLLING_INTERVAL = 10000;
const SYNC_STATUS_DISPLAY_TIME = 3000;
const ONLINE_DISPLAY_DURATION = 3000;
const SYNC_COLOR = "#2196F3";

let isSyncInProgress = false;
const showToast = (message) => {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  }
  // On iOS you might want to implement something similar with Alert or a custom component
};

const ConnectionManager = ({ currentRoute, navigation }) => {
  const dispatch = useDispatch();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const modalizeRef = useRef(null);

  // Check if current route is splash
  const isSplashRoute =
    currentRoute === "splash" ||
    currentRoute === "Login" ||
    currentRoute === "ServerConfig";

  // Fonction pour fermer la modal proprement
  const closeModal = useCallback(() => {
    if (modalizeRef.current) {
      modalizeRef.current.close();
    }
  }, []);

  useEffect(() => {
    const handleBackPress = () => {
      closeModal();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress
    );
    return () => backHandler.remove();
  }, [navigation]);

  // Gestionnaire d'événements pour la fermeture
  const handleModalClose = useCallback(() => {
    // Réinitialiser l'état ou effectuer des actions de nettoyage
    console.log("Modal fermée - nettoyage des états");
  }, []);

  // Get state from Redux
  const {
    isConnected,
    isServerReachable,
    pendingActions,
    syncStatus,
    isSyncing,
  } = useSelector((state) => state.offline);

  // Récupérer les clients depuis Redux
  const { clients } = useSelector((state) => state.clients);
  const { ordersApprouve } = useSelector((state) => state.orders);

  // Local state
  const [isTestingSap, setIsTestingSap] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState(0);
  const [visible, setVisible] = useState(true);
  const [manualSyncCompleted, setManualSyncCompleted] = useState(false);
  const [isAppInitialLoad, setIsAppInitialLoad] = useState(true);
  const [offlineActions, setOfflineActions] = useState([]);
  const [loadingActions, setLoadingActions] = useState(false);

  // Refs
  const intervalRef = useRef(null);
  const sapPollingIntervalRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const hideTimeoutRef = useRef(null);

  // Determine connection state
  const networkConnected = isConnected;
  const serverReachable = isServerReachable;
  const connectionState = !networkConnected
    ? "offline"
    : serverReachable
    ? "online"
    : "internet_only";

  // // Get status text and color based on connection state
  // const getStatusInfo = () => {
  //   switch (connectionState) {
  //     case "online":
  //       return {
  //         text: "Connexion rétablie.",
  //         color: "rgb(37, 198, 72)",
  //         Ionicons: "earth",
  //       };
  //     case "internet_only":
  //       return {
  //         text: "Internet disponible (SAP inaccessible)",
  //         color: "rgb(0, 0, 0)",
  //         Ionicons: "cloud-offline",
  //       };
  //     case "offline":
  //       return {
  //         text: "Aucune connexion Internet.",
  //         color: "rgb(0, 0, 0)",
  //         Ionicons: "cloud-offline-outline",
  //         textColor: "rgb(224, 67, 67)",
  //       };
  //     default:
  //       return { text: "Statut inconnu", color: "#9E9E9E" };
  //   }
  // };

  // Get status text and color based on connection state
  const getStatusInfo = () => {
    switch (connectionState) {
      case "online":
        // Si on est en ligne ET qu'il y a des actions en attente
        if (pendingActions > 0) {
          return {
            text: "Cliquez pour synchroniser",
            color: "#2196F3", // Bleu pour indiquer l'action possible
            Ionicons: "sync-outline",
          };
        }
        // Si on est en ligne SANS actions en attente
        return {
          text: "Connexion rétablie.",
          color: "rgb(32, 173, 109)", // Vert pour connexion OK
          Ionicons: "earth",
        };
      case "internet_only":
        return {
          text: "Internet disponible (SAP inaccessible)",
          color: "rgb(0, 0, 0)",
          Ionicons: "cloud-offline",
        };
      case "offline":
        return {
          text: "Aucune connexion Internet.",
          color: "rgb(0, 0, 0)",
          Ionicons: "cloud-offline-outline",
          textColor: "rgb(224, 67, 67)",
        };
      default:
        return { text: "Statut inconnu", color: "#9E9E9E" };
    }
  };
  const statusInfo = getStatusInfo();

  // Fonction pour charger les actions hors ligne
  const loadOfflineActions = useCallback(async () => {
    setLoadingActions(true);
    try {
      const queue = await getOfflineActionQueue();
      setOfflineActions(queue || []);
    } catch (error) {
      console.error("Erreur lors du chargement des actions hors ligne:", error);
      setOfflineActions([]);
    } finally {
      setLoadingActions(false);
    }
  }, []);

  // Fonction pour obtenir les informations du client
  const getClientInfo = useCallback(
    (clientId, actionType = null, actionPayload = null) => {
      if (!clients) return null;

      // Cas spécial pour les livraisons
      if (actionType === "outbound/deliveries/processDeliveryComplete") {
        const referenceSDDocument =
          actionPayload?.deliveryData?.to_DeliveryDocumentItem?.results?.[0]
            ?.ReferenceSDDocument;

        if (referenceSDDocument && ordersApprouve) {
          const correspondingOrder = ordersApprouve.find(
            (order) => order.cmd === referenceSDDocument
          );

          if (correspondingOrder) {
            const client = clients.find(
              (c) => c.kunnr === correspondingOrder.client
            );
            return client
              ? {
                  name1: client.name1,
                  kunnr: client.kunnr,
                }
              : null;
          }
        }
        return null;
      }

      // Cas normal pour les autres types d'actions
      if (!clientId) return null;

      const client = clients.find((c) => c.kunnr === clientId);
      return client
        ? {
            name1: client.name1,
            kunnr: client.kunnr,
          }
        : null;
    },
    [clients, ordersApprouve]
  );

  // Fonction pour obtenir le type d'action lisible
  const getActionTypeInfo = (type) => {
    switch (type) {
      case "encaissement/addEncaissement":
        return {
          label: "Encaissement",
          icon: "cash-outline",
          color: "#4CAF50",
          gradient: ["#4CAF50", "#45a049"],
          route: "encaissement",
        };
      case "outbound/deliveries/processDeliveryComplete":
        return {
          label: "Livraison",
          icon: "cube-outline",
          color: "#FF9800",
          gradient: ["#FF9800", "#f57c00"],
          route: "livraison",
        };
      case "Quotations/addQuotation":
        return {
          label: "Commande Vente",
          icon: "document-text-outline",
          color: "#2196F3",
          gradient: ["#2196F3", "#1976D2"],
          route: "quotation_liste",
        };
      case "orders/addOrderReturn":
        return {
          label: "Commande Retour",
          icon: "return-up-back-outline",
          color: "#F44336",
          gradient: ["#F44336", "#d32f2f"],
          route: "quotation_liste",
        };
      default:
        return {
          label: "Action inconnue",
          icon: "help-outline",
          color: "#9E9E9E",
          gradient: ["#9E9E9E", "#757575"],
          route: null,
        };
    }
  };

  // Fonction pour formater la date
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Fonction pour naviguer vers l'écran approprié
  const navigateToAction = useCallback(
    (item) => {
      const actionInfo = getActionTypeInfo(item.type);

      if (!actionInfo.route) {
        console.warn(`Route non définie pour le type d'action: ${item.type}`);
        return;
      }

      // Récupérer les informations du client
      let clientInfo = null;

      if (item.type === "encaissement/addEncaissement") {
        clientInfo = getClientInfo(item.payload.Client);
      } else if (
        item.type === "Quotations/addQuotation" ||
        item.type === "orders/addOrderReturn"
      ) {
        clientInfo = getClientInfo(item.payload.SoldToParty);
      } else if (item.type === "outbound/deliveries/processDeliveryComplete") {
        // Utiliser la fonction modifiée pour récupérer le client via ReferenceSDDocument
        clientInfo = getClientInfo(null, item.type, item.payload);
      }

      // Naviguer vers l'écran approprié avec les données du client
      navigation.navigate(actionInfo.route, {
        client: clientInfo,
        actionData: item,
        offlineList: true,
      });
      closeModal();
    },
    [navigation, getClientInfo]
  );

  // Fonction pour ouvrir la modalize
  const openOfflineActionsModal = useCallback(async () => {
    await loadOfflineActions();
    modalizeRef.current?.open();
  }, [loadOfflineActions]);

  // Function to check connection and update status
  const checkConnection = useCallback(async () => {
    try {
      const result = await dispatch(checkAndUpdateConnectionStatus());
      return result.payload;
    } catch (error) {
      console.error("Error checking connection:", error);
      return null;
    }
  }, [dispatch]);

  // Function to check connection ONLY (sans synchronisation automatique)
  const checkConnectionOnly = useCallback(async () => {
    // Prevent check if already in progress
    if (isSyncInProgress) {
      console.log("Sync already in progress, skipping connection check");
      return;
    }

    // First update the connection status
    const connectionStatus = await checkConnection();

    // Log the connection status but don't auto-sync
    if (connectionStatus) {
      console.log("Connection status updated:", {
        network: connectionStatus.isNetworkConnected,
        server: connectionStatus.isServerReachable,
        pendingActions: pendingActions,
      });

      // Just show a toast when connection is restored (optional)
      if (
        connectionStatus.isNetworkConnected &&
        connectionStatus.isServerReachable &&
        pendingActions > 0
      ) {
        console.log(
          `Connection restored. ${pendingActions} actions ready for manual sync`
        );
      }
    }
  }, [checkConnection, pendingActions]);

  // Start SAP polling
  const startSapPolling = useCallback(() => {
    if (sapPollingIntervalRef.current) return; // Avoid duplicates

    setIsPolling(true);
    showToast("Test automatique de la connexion SAP...");

    sapPollingIntervalRef.current = setInterval(() => {
      setIsTestingSap(true);
      checkConnection()
        .then((status) => {
          if (status && status.isServerReachable) {
            showToast("Connexion SAP rétablie !");

            // Ne plus déclencher de synchronisation automatique
            // Juste informer que la connexion est rétablie
            if (pendingActions > 0) {
              console.log(
                `SAP connection restored. ${pendingActions} actions ready for manual sync`
              );
            }
          }
        })
        .finally(() => {
          setIsTestingSap(false);
        });
    }, SAP_POLLING_INTERVAL);
  }, [checkConnection, pendingActions]);

  // Stop SAP polling
  const stopSapPolling = useCallback(() => {
    if (sapPollingIntervalRef.current) {
      clearInterval(sapPollingIntervalRef.current);
      sapPollingIntervalRef.current = null;
      setIsPolling(false);
    }
  }, []);

  // Handle synchronization (UNIQUEMENT MANUELLE)
  const handleSync = useCallback(
    async (skipConfirmation = false) => {
      // Prevent synchronization if not connected or already in progress
      if (
        isSyncInProgress ||
        isSyncing ||
        !networkConnected ||
        !serverReachable
      ) {
        console.log("Sync skipped: already in progress or not connected");
        return;
      }

      // If not triggered automatically and there are multiple actions, confirm with user
      if (!skipConfirmation && pendingActions > 1) {
        confirmSync();
        return;
      }

      // Set both global and local sync flags
      isSyncInProgress = true;
      setLastSyncTimestamp(Date.now());

      try {
        console.log(
          `Starting MANUAL synchronization of ${pendingActions} actions`
        );
        await dispatch(syncOfflineData());
        console.log("Manual synchronization completed");

        // Marquer que la synchronisation manuelle est terminée
        setManualSyncCompleted(true);

        // Fermer la modalize après synchronisation réussie
        modalizeRef.current?.close();
      } catch (error) {
        console.error("Sync error:", error);
      } finally {
        // Clear sync flags
        isSyncInProgress = false;

        // Update pending actions count after sync
        dispatch(fetchPendingActionsCount());
      }
    },
    [isSyncing, networkConnected, serverReachable, pendingActions, dispatch]
  );

  // Manually test connection
  const handleTestConnection = () => {
    setIsTestingSap(true);
    dispatch(fetchPendingActionsCount());
    checkConnection().finally(() => {
      setIsTestingSap(false);
    });
  };

  // Confirm before synchronizing
  const confirmSync = () => {
    Alert.alert(
      "Synchronisation",
      `Vous avez ${pendingActions} action(s) en attente. Voulez-vous synchroniser maintenant ?`,
      [
        { text: "Annuler", style: "cancel" },
        { text: "Synchroniser", onPress: () => handleSync(true) },
      ]
    );
  };

  // Rendu d'un élément de la liste des actions
  const renderActionItem = ({ item, index }) => {
    const actionInfo = getActionTypeInfo(item.type);

    // Récupérer le client selon le type d'action
    let clientInfo = null;
    if (item.type === "outbound/deliveries/processDeliveryComplete") {
      clientInfo = getClientInfo(null, item.type, item.payload);
    } else {
      clientInfo = getClientInfo(
        item.payload.Client || item.payload.SoldToParty
      );
    }

    return (
      <TouchableOpacity
        style={styles.actionCard}
        onPress={() => navigateToAction(item)}
        activeOpacity={0.7}
      >
        <View style={styles.actionCardContent}>
          {/* Header avec icône et badge */}
          <View style={styles.actionCardHeader}>
            <View
              style={[
                styles.actionIconContainer,
                { backgroundColor: actionInfo.color },
              ]}
            >
              <Ionicons name={actionInfo.icon} size={24} color="white" />
            </View>
            <View style={styles.actionMainInfo}>
              <Text style={styles.actionTitle}>{actionInfo.label}</Text>
              <Text style={styles.actionTimestamp}>
                {formatDate(item.timestamp)}
              </Text>
            </View>
            {/* <View style={styles.actionBadgeContainer}>
              <Text style={styles.actionBadgeNumber}>{index + 1}</Text>
            </View> */}
          </View>

          {/* Informations client */}
          {clientInfo && (
            <View style={styles.clientInfoContainer}>
              <Ionicons name="person-outline" size={16} color="#666" />
              <Text style={styles.clientInfoText}>{clientInfo.name1}</Text>
            </View>
          )}

          {/* Détails spécifiques selon le type */}
          <View style={styles.actionDetailsContainer}>
            {item.type === "encaissement/addEncaissement" && (
              <View style={styles.actionDetailsRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="cash-outline" size={16} color="#4CAF50" />
                  <Text style={styles.detailText}>{item.payload.Montant}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="card-outline" size={16} color="#666" />
                  <Text style={styles.detailText}>
                    {item.payload.ModePaiement}
                  </Text>
                </View>
              </View>
            )}

            {item.type === "Quotations/addQuotation" && (
              <View style={styles.actionDetailsRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="list-outline" size={16} color="#2196F3" />
                  <Text style={styles.detailText}>
                    {item.payload.to_Item?.length || 0} articles
                  </Text>
                </View>
                {/* <View style={styles.detailItem}>
                  <Ionicons name="document-outline" size={16} color="#666" />
                  <Text style={styles.detailText}>
                    {item.payload.SalesQuotationType}
                  </Text>
                </View> */}
              </View>
            )}

            {item.type === "orders/addOrderReturn" && (
              <View style={styles.actionDetailsRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="list-outline" size={16} color="#F44336" />
                  <Text style={styles.detailText}>
                    {item.payload.to_Item?.length || 0} articles
                  </Text>
                </View>
                {/* <View style={styles.detailItem}>
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color="#666"
                  />
                  <Text style={styles.detailText}>
                    Motif: {item.payload.SDDocumentReason}
                  </Text>
                </View> */}
              </View>
            )}

            {item.type === "outbound/deliveries/processDeliveryComplete" && (
              <View style={styles.actionDetailsRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="cube-outline" size={16} color="#FF9800" />
                  <Text style={styles.detailText}>
                    {item.payload.deliveryData?.to_DeliveryDocumentItem?.results
                      ?.length || 0}{" "}
                    articles
                  </Text>
                </View>
                {/* <View style={styles.detailItem}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={16}
                    color="#4CAF50"
                  />
                  <Text style={styles.detailText}>Livré</Text>
                </View> */}
                {/* Afficher le numéro de commande de référence */}
                {item.payload.deliveryData?.to_DeliveryDocumentItem
                  ?.results?.[0]?.ReferenceSDDocument && (
                  <View style={styles.detailItem}>
                    <Ionicons
                      name="document-text-outline"
                      size={16}
                      color="#666"
                    />
                    <Text style={styles.detailText}>
                      Cmd:{" "}
                      {
                        item.payload.deliveryData.to_DeliveryDocumentItem
                          .results[0].ReferenceSDDocument
                      }
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Indicateur de navigation */}
          <View style={styles.navigationIndicator}>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Handle app state changes (sans auto-sync)
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // Only check connection, no auto-sync
        if (!isSyncInProgress) {
          console.log("App returned to foreground, checking connection only");
          checkConnectionOnly();
        } else {
          console.log(
            "App returned to foreground but sync already in progress"
          );
        }
      }
      appState.current = nextAppState;
    };

    // Set up app state listener
    const appStateSubscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      appStateSubscription.remove();
    };
  }, [checkConnectionOnly]);

  // Set up connection change listener and periodic checks
  useEffect(() => {
    // Initial check
    dispatch(checkAndUpdateConnectionStatus());
    dispatch(fetchPendingActionsCount());

    // Marquer le premier chargement de l'application
    setIsAppInitialLoad(true);

    // Network change handler with debounce
    let networkChangeTimeout = null;
    const handleNetworkChange = (state) => {
      // Clear any pending network change handlers
      if (networkChangeTimeout) {
        clearTimeout(networkChangeTimeout);
      }

      // Debounce network changes to prevent multiple rapid triggers
      networkChangeTimeout = setTimeout(() => {
        if (state.isConnected) {
          // When we detect a network connection, check full status (sans auto-sync)
          if (!isSyncInProgress) {
            console.log(
              "Network connection detected, checking SAP connectivity"
            );
            checkConnectionOnly();
          }
        } else {
          // Update our redux state to show we're offline
          console.log("Network disconnected, updating status");
          dispatch(checkAndUpdateConnectionStatus());
        }
      }, 1000); // 1 second debounce
    };

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(handleNetworkChange);

    // Set up periodic check (sans auto-sync)
    intervalRef.current = setInterval(() => {
      if (!isSyncInProgress) {
        console.log("Performing periodic connection check (no auto-sync)");
        checkConnectionOnly();
      } else {
        console.log("Skipping periodic check - sync already in progress");
      }
    }, CONNECTION_CHECK_INTERVAL);

    // Cleanup
    return () => {
      unsubscribe();
      if (networkChangeTimeout) {
        clearTimeout(networkChangeTimeout);
      }
      clearInterval(intervalRef.current);
      stopSapPolling();
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [dispatch, checkConnectionOnly, stopSapPolling]);

  // Start/stop SAP polling based on connection state
  useEffect(() => {
    if (
      networkConnected &&
      !serverReachable &&
      !sapPollingIntervalRef.current
    ) {
      // Start polling if we have internet but no SAP
      startSapPolling();
    } else if (
      (!networkConnected || serverReachable) &&
      sapPollingIntervalRef.current
    ) {
      // Stop polling if we've lost internet or SAP is now reachable
      stopSapPolling();
    }
  }, [networkConnected, serverReachable, startSapPolling, stopSapPolling]);

  // Auto-hide successful sync status messages
  useEffect(() => {
    let timeout;
    if (syncStatus && syncStatus.message && syncStatus.success) {
      timeout = setTimeout(() => {
        dispatch(resetSyncStatus());
      }, SYNC_STATUS_DISPLAY_TIME);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [syncStatus, dispatch]);

  // Gestion de l'affichage/masquage du composant selon l'état de connexion
  useEffect(() => {
    // Réinitialiser l'animation et les timeouts si nécessaire
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    // Cas particulier du premier chargement de l'app
    if (
      isAppInitialLoad &&
      connectionState === "online" &&
      pendingActions === 0
    ) {
      // Au premier chargement, si en ligne et pas d'actions en attente, on affiche puis masque
      setVisible(true);
      fadeAnim.setValue(1);

      hideTimeoutRef.current = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          setVisible(false);
        });
      }, ONLINE_DISPLAY_DURATION);

      // Marquer que le premier chargement est fait
      setIsAppInitialLoad(false);
      return;
    }

    // Si on a une synchronisation manuelle qui vient de se terminer avec succès
    if (
      manualSyncCompleted &&
      connectionState === "online" &&
      pendingActions === 0
    ) {
      // On garde visible l'indicateur vert "en ligne"
      setVisible(true);
      fadeAnim.setValue(1);

      // Réinitialiser l'état de synchronisation manuelle
      setManualSyncCompleted(false);
      return;
    }

    // Si le composant est en mode synchronisation ou en attente de synchronisation
    if (isSyncing || pendingActions > 0 || connectionState !== "online") {
      // Toujours visible
      setVisible(true);
      fadeAnim.setValue(1);
      return;
    }

    // Par défaut pour l'état en ligne sans actions en attente (après premier chargement)
    // On masque après un délai, sauf si on est juste après une synchronisation
    if (connectionState === "online" && pendingActions === 0) {
      // Montrer d'abord le composant
      setVisible(true);
      fadeAnim.setValue(1);

      // Puis le masquer après 3 secondes
      hideTimeoutRef.current = setTimeout(() => {
        // Animation de fondu
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          setVisible(false);
        });
      }, ONLINE_DISPLAY_DURATION);
    }

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [
    connectionState,
    pendingActions,
    fadeAnim,
    isSyncing,
    manualSyncCompleted,
    isAppInitialLoad,
  ]);

  // Si le composant ne doit pas être affiché
  if (!visible || isSplashRoute) {
    return null;
  }

  // Fonction pour rendre le contenu principal
  const renderContent = () => {
    // Couleur de fond en fonction de l'état
    let backgroundColor = statusInfo.color;

    // Si nous sommes en train de synchroniser, utiliser la couleur bleue
    if (isSyncing) {
      backgroundColor = SYNC_COLOR;
    }

    // Si nous avons des actions en attente, on transforme la Vue en TouchableOpacity
    if (pendingActions > 0) {
      return (
        <TouchableOpacity
          style={[styles.container, { backgroundColor }]}
          onPress={openOfflineActionsModal}
          activeOpacity={0.7}
        >
          <View style={styles.statusContainer}>
            <Ionicons
              name={statusInfo?.Ionicons}
              size={18}
              color={
                statusInfo.text === "Aucune connexion Internet."
                  ? "rgb(201, 28, 28)"
                  : "white"
              }
            />
            <Text
              style={[
                styles.statusText,
                statusInfo.text === "Aucune connexion Internet." && {
                  color: statusInfo.textColor,
                },
              ]}
            >
              {isSyncing ? "Synchronisation en cours..." : statusInfo.text}
              {isPolling && !isSyncing && ""}
            </Text>
            {pendingActions > 0 && !isSyncing && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingActions}</Text>
              </View>
            )}
            {isSyncing && (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
                style={styles.activityIndicator}
              />
            )}
          </View>
        </TouchableOpacity>
      );
    } else {
      // Sinon c'est une simple View
      return (
        <View style={[styles.container, { backgroundColor }]}>
          <View style={styles.statusContainer}>
            <Ionicons name={statusInfo?.Ionicons} size={18} color="white" />
            <Text style={styles.statusText}>
              {isSyncing ? "Synchronisation en cours..." : statusInfo.text}
            </Text>
            {isSyncing && (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
                style={styles.activityIndicator}
              />
            )}
          </View>
        </View>
      );
    }
  };

  return (
    <>
      <Animated.View style={{ opacity: fadeAnim }}>
        {renderContent()}
      </Animated.View>

      {/* Modalize pour les actions hors ligne */}
      <Modalize
        ref={modalizeRef}
        modalHeight={SCREEN_HEIGHT * 1}
        disableScrollIfPossible={false}
        closeOnOverlayTap={true}
        threshold={150}
        panGestureComponentEnabled={true}
        closeSnapPointStraightEnabled={false}
        velocityThreshold={2000}
        panGestureEnabled={false}
        modalStyle={styles.modalContainer}
        keyboardAvoidingBehavior="padding"
        avoidKeyboardLikeIOS={true}
        adjustToContentHeight={false}
        onClose={handleModalClose}
        onClosed={handleModalClose}
        withReactModal={false}
        withOverlay={true}
        HeaderComponent={
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <View style={styles.modalTitleContainer}>
                <Ionicons
                  name="cloud-offline-outline"
                  size={24}
                  color="rgb(244, 250, 255)"
                />
                <Text style={styles.modalTitle}>Actions hors ligne</Text>
              </View>
              <Text style={styles.modalSubtitle}>
                {offlineActions.length} action(s) en attente de synchronisation
              </Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        }
        // FooterComponent={
        //   <View style={styles.modalFooter}>
        //     <TouchableOpacity
        //       style={[
        //         styles.syncButton,
        //         (!networkConnected || !serverReachable || isSyncing) &&
        //           styles.syncButtonDisabled,
        //       ]}
        //       onPress={() => handleSync(true)}
        //       disabled={!networkConnected || !serverReachable || isSyncing}
        //     >
        //       {isSyncing ? (
        //         <ActivityIndicator size="small" color="#FFFFFF" />
        //       ) : (
        //         <Ionicons name="sync" size={20} color="#FFFFFF" />
        //       )}
        //       <Text style={styles.syncButtonText}>
        //         {isSyncing ? "Synchronisation..." : "Synchroniser tout"}
        //       </Text>
        //     </TouchableOpacity>
        //     {(!networkConnected || !serverReachable) && (
        //       <Text style={styles.syncDisabledText}>
        //         {!networkConnected
        //           ? "Connexion Internet requise"
        //           : "Connexion au serveur SAP requise"}
        //       </Text>
        //     )}
        //   </View>
        // }
        flatListProps={{
          data: loadingActions ? [] : offlineActions,
          renderItem: renderActionItem,
          keyExtractor: (item) => item.id,
          showsVerticalScrollIndicator: false,
          contentContainerStyle: styles.listContainer,
          ItemSeparatorComponent: () => <View style={styles.separator} />,
          bounces: true,
          overScrollMode: "always",
          scrollEventThrottle: 16,
          keyboardShouldPersistTaps: "handled",
          nestedScrollEnabled: true,
          removeClippedSubviews: false,

          ListHeaderComponent: loadingActions ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2196F3" />
              <Text style={styles.loadingText}>Chargement des actions...</Text>
            </View>
          ) : (
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>
                Appuyez sur une action pour plus de détail
              </Text>
              {(!networkConnected || !serverReachable) && (
                <Text style={styles.syncDisabledText}>
                  {!networkConnected
                    ? "Connexion Internet requise"
                    : "Connexion au serveur SAP requise"}
                </Text>
              )}
            </View>
          ),

          ListEmptyComponent:
            !loadingActions && offlineActions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={64}
                  color="#4CAF50"
                />
                <Text style={styles.emptyTitle}>Aucune action en attente</Text>
                <Text style={styles.emptySubtitle}>
                  Toutes vos actions ont été synchronisées
                </Text>
              </View>
            ) : null,
        }}
      />
    </>
  );
};
const styles = StyleSheet.create({
  container: {
    padding: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "medium",
    color: "white",
    textAlign: "center",
  },
  badge: {
    backgroundColor: "#FF5722",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  activityIndicator: {
    marginLeft: 10,
  },

  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },

  // Header de la modale
  modalHeader: {
    backgroundColor: "#03A9F4",
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  modalHeaderContent: {
    alignItems: "center",
  },

  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "rgb(244, 250, 255)",
    marginLeft: 8,
  },

  modalSubtitle: {
    fontSize: 14,
    color: "rgb(219, 227, 234)",
    fontWeight: "400",
  },

  closeButton: {
    position: "absolute",
    top: 30,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(244, 250, 255, 0.33)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Footer de la modale
  modalFooter: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },

  syncButton: {
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 8,
  },

  syncButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },

  syncButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },

  syncDisabledText: {
    textAlign: "center",
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "400",
  },

  // Container de la liste
  listContainer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },

  listHeader: {
    backgroundColor: "#F8F9FA",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 20,
  },

  listHeaderText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "400",
    textAlign: "center",
  },

  separator: {
    height: 16,
  },

  // Cartes d'actions - Design épuré
  actionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 0,
  },

  actionCardContent: {
    padding: 16,
  },

  actionCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  actionMainInfo: {
    flex: 1,
  },

  actionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
    marginBottom: 2,
  },

  actionTimestamp: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "400",
  },

  actionBadgeContainer: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  actionBadgeNumber: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563EB",
  },

  // Informations client
  clientInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 12,
  },

  clientInfoText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
    marginLeft: 6,
  },

  // Détails des actions
  actionDetailsContainer: {
    backgroundColor: "#FAFAFA",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },

  actionDetailsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    flex: 1,
    minWidth: 80,
  },

  detailText: {
    fontSize: 12,
    color: "#4B5563",
    fontWeight: "500",
    marginLeft: 4,
  },

  // Indicateur de navigation
  navigationIndicator: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  // États de chargement
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "400",
  },

  // État vide
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },

  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    fontWeight: "400",
    lineHeight: 20,
  },
});

export default ConnectionManager;
