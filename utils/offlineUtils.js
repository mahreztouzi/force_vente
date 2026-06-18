// // src/utils/offlineUtils.js - Version améliorée
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import NetInfo from "@react-native-community/netinfo";
// import axiosInstance from "../services/axiosConfig";

// // Constants for offline storage
// const OFFLINE_QUEUE_KEY = "offline_action_queue";
// // const SAP_CONNECTION_STATUS = "sap_connection_status";
// // const CONNECTION_CHECK_TIMEOUT = 10000; // 10 seconds timeout
// // const LAST_CONNECTION_CHECK = "last_connection_check";
// // const MIN_CHECK_INTERVAL = 10000; // 10 secondes entre les vérifications

// // Constants
// const SAP_CONNECTION_STATUS = "sap_connection_status";
// const LAST_CONNECTION_CHECK = "last_connection_check";
// const CONNECTION_CHECK_TIMEOUT = 3000; // 3 seconds for connectivity check
// const MIN_CHECK_INTERVAL = 10000; // 10 seconds between checks

// // Generate a unique ID without crypto dependency
// const generateUniqueId = () => {
//   return `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
// };

// /**
//  * Fast SAP server connectivity check
//  * @returns {Promise<boolean>} true if server is reachable, false otherwise
//  */
// const checkServerConnectivity = async () => {
//   try {
//     const response = await axiosInstance.head("/ZBI_USER_DDH_CDS", {
//       timeout: CONNECTION_CHECK_TIMEOUT,
//       headers: {
//         "Cache-Control": "no-cache",
//         Accept: "application/json",
//       },
//     });
//     return response.status >= 200 && response.status < 300;
//   } catch (error) {
//     return false;
//   }
// };

// /**
//  * Get cached connection status
//  * @returns {Promise<{connected: boolean, timestamp: number}>}
//  */
// export const getStoredConnectionStatus = async () => {
//   try {
//     const status = await AsyncStorage.getItem(SAP_CONNECTION_STATUS);
//     return status ? JSON.parse(status) : { connected: false, timestamp: 0 };
//   } catch (error) {
//     console.error("Error reading connection status:", error);
//     return { connected: false, timestamp: 0 };
//   }
// };

// /**
//  * Check both network and SAP server availability with caching
//  * @returns {Promise<{isNetworkConnected: boolean, isServerReachable: boolean}>}
//  */
// export const checkConnection = async () => {
//   try {
//     // 1. Check network connection
//     const networkState = await NetInfo.fetch();
//     const isNetworkConnected =
//       networkState.isConnected && networkState.isInternetReachable;

//     if (!isNetworkConnected) {
//       return {
//         isNetworkConnected: false,
//         isServerReachable: false,
//       };
//     }

//     // 2. Check cache if we recently verified
//     const lastCheckStr = await AsyncStorage.getItem(LAST_CONNECTION_CHECK);
//     const now = Date.now();
//     const lastCheck = lastCheckStr ? parseInt(lastCheckStr, 10) : 0;

//     if (now - lastCheck < MIN_CHECK_INTERVAL) {
//       const cachedStatus = await getStoredConnectionStatus();
//       return {
//         isNetworkConnected: true,
//         isServerReachable: cachedStatus.connected,
//       };
//     }

//     // 3. Perform actual server check
//     const isServerReachable = await checkServerConnectivity();

//     // 4. Update cache
//     await AsyncStorage.setItem(LAST_CONNECTION_CHECK, now.toString());
//     await AsyncStorage.setItem(
//       SAP_CONNECTION_STATUS,
//       JSON.stringify({
//         connected: isServerReachable,
//         timestamp: now,
//       })
//     );

//     return {
//       isNetworkConnected: true,
//       isServerReachable,
//     };
//   } catch (error) {
//     console.error("Connection check error:", error);
//     return {
//       isNetworkConnected: false,
//       isServerReachable: false,
//     };
//   }
// };

// /**
//  * Quick connectivity check (combined network + SAP)
//  * @returns {Promise<boolean>}
//  */
// export const isConnected = async () => {
//   const { isNetworkConnected, isServerReachable } = await checkConnection();
//   return isNetworkConnected && isServerReachable;
// };

// /**
//  * Add an action to the offline queue
//  * @param {Object} action The action to queue
//  * @returns {Promise<boolean>} true if queued successfully, false otherwise
//  */
// export const queueOfflineAction = async (action) => {
//   try {
//     // Get existing queue
//     const queue = await getOfflineActionQueue();
//     console.log("Liste des actions hors ligne", queue);

//     // Vérifiez si une action similaire existe déjà pour éviter les doublons
//     // On compare uniquement le type d'action et le payload
//     const isDuplicate = queue.some(
//       (queuedAction) =>
//         queuedAction.type === action.type &&
//         JSON.stringify(queuedAction.payload) === JSON.stringify(action.payload)
//     );

//     if (isDuplicate) {
//       console.log(`Action en double ignorée: ${action.type}`);
//       return true;
//     }

//     // Nettoyer l'action pour assurer la sérialisation
//     const cleanAction = {
//       ...action,
//       // Supprimer des propriétés qui pourraient causer des problèmes de sérialisation
//       meta: action.meta
//         ? {
//             ...action.meta,
//             requestId: undefined, // Supprimer les propriétés non-sérialisables
//             signal: undefined,
//             dispatch: undefined,
//             getState: undefined,
//             extra: undefined,
//             rejectWithValue: undefined,
//           }
//         : {},
//     };

//     // Add new action with a unique ID
//     const queuedAction = {
//       ...cleanAction,
//       id: generateUniqueId(),
//       timestamp: new Date().toISOString(),
//     };

//     queue.push(queuedAction);

//     // Save updated queue
//     await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));

//     console.log(
//       `Action ajoutée à la file d'attente hors ligne: ${action.type}`
//     );
//     return true;
//   } catch (error) {
//     console.error("Erreur lors de l'ajout à la file d'attente:", error);
//     return false;
//   }
// };

// /**
//  * Get the queue of offline actions
//  * @returns {Promise<Array>} - The list of pending actions
//  */
// export const getOfflineActionQueue = async () => {
//   try {
//     const queueString = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
//     return queueString ? JSON.parse(queueString) : [];
//   } catch (error) {
//     console.error(
//       "Erreur lors de la récupération de la file d'attente:",
//       error
//     );
//     return [];
//   }
// };

// /**
//  * Remove an action from the queue
//  * @param {string} actionId - The ID of the action to remove
//  * @returns {Promise<boolean>} - true if removal succeeded, false otherwise
//  */
// export const removeFromOfflineQueue = async (actionId) => {
//   try {
//     const queue = await getOfflineActionQueue();
//     const newQueue = queue.filter((action) => action.id !== actionId);
//     await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(newQueue));
//     console.log(`Action ${actionId} supprimée de la file d'attente hors ligne`);
//     return true;
//   } catch (error) {
//     console.error("Erreur lors de la suppression de l'action:", error);
//     return false;
//   }
// };

// /**
//  * Update an action in the offline queue
//  * @param {string} actionId - The ID of the action to update
//  * @param {Object} updates - The properties to update
//  * @returns {Promise<boolean>} - true if update succeeded, false otherwise
//  */
// export const updateOfflineAction = async (actionId, updates) => {
//   try {
//     const queue = await getOfflineActionQueue();
//     const actionIndex = queue.findIndex((action) => action.id === actionId);

//     if (actionIndex === -1) {
//       console.warn(
//         `Action ${actionId} non trouvée dans la file d'attente hors ligne`
//       );
//       return false;
//     }

//     // Mettre à jour l'action en gardant toutes les propriétés existantes
//     queue[actionIndex] = {
//       ...queue[actionIndex],
//       ...updates,
//     };

//     await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
//     console.log(
//       `Action ${actionId} mise à jour dans la file d'attente hors ligne`,
//       updates
//     );
//     return true;
//   } catch (error) {
//     console.error("Erreur lors de la mise à jour de l'action:", error);
//     return false;
//   }
// };

// /**
//  * Clear the entire queue
//  * @returns {Promise<boolean>} - true if clearing succeeded, false otherwise
//  */
// export const clearOfflineQueue = async () => {
//   try {
//     await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
//     console.log("File d'attente hors ligne vidée");
//     return true;
//   } catch (error) {
//     console.error("Erreur lors du vidage de la file d'attente:", error);
//     return false;
//   }
// };

// /**
//  * Get the number of pending actions
//  * @returns {Promise<number>} - The number of pending actions
//  */
// export const getPendingActionsCount = async () => {
//   try {
//     const queue = await getOfflineActionQueue();
//     return queue.length;
//   } catch (error) {
//     console.error("Erreur lors du comptage des actions en attente:", error);
//     return 0;
//   }
// };

// /**
//  * Mark an action as failed with error message
//  * @param {string} actionId - The ID of the action to mark as failed
//  * @param {string} errorMessage - The error message
//  * @returns {Promise<boolean>} - true if marking succeeded, false otherwise
//  */
// export const markActionAsFailed = async (actionId, errorMessage) => {
//   try {
//     const queue = await getOfflineActionQueue();
//     const actionIndex = queue.findIndex((action) => action.id === actionId);

//     if (actionIndex !== -1) {
//       queue[actionIndex] = {
//         ...queue[actionIndex],
//         failed: true,
//         error: errorMessage,
//         failedAt: new Date().toISOString(),
//         retryCount: (queue[actionIndex].retryCount || 0) + 1,
//       };

//       await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
//       console.log(`Action ${actionId} marquée comme échouée: ${errorMessage}`);
//       return true;
//     }

//     return false;
//   } catch (error) {
//     console.error("Erreur lors du marquage de l'action comme échouée:", error);
//     return false;
//   }
// };

// /**
//  * Clear error status from an action
//  * @param {string} actionId - The ID of the action to clear error from
//  * @returns {Promise<boolean>} - true if clearing succeeded, false otherwise
//  */
// export const clearActionError = async (actionId) => {
//   try {
//     const queue = await getOfflineActionQueue();
//     const actionIndex = queue.findIndex((action) => action.id === actionId);

//     if (actionIndex !== -1) {
//       const updatedAction = { ...queue[actionIndex] };
//       delete updatedAction.failed;
//       delete updatedAction.error;
//       delete updatedAction.failedAt;

//       queue[actionIndex] = updatedAction;

//       await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
//       console.log(`Erreur supprimée pour l'action ${actionId}`);
//       return true;
//     }

//     return false;
//   } catch (error) {
//     console.error("Erreur lors de la suppression de l'erreur:", error);
//     return false;
//   }
// };

// src/utils/offlineUtils.js - Version optimisée pour éviter les race conditions
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import axiosInstance from "../services/axiosConfig";

// Constants for offline storage
const OFFLINE_QUEUE_KEY = "offline_action_queue";
const SAP_CONNECTION_STATUS = "sap_connection_status";
const LAST_CONNECTION_CHECK = "last_connection_check";
const CONNECTION_CHECK_TIMEOUT = 2000; // 2 secondes pour un check rapide
const MIN_CHECK_INTERVAL = 8000; // 8 secondes entre les vérifications
const NETWORK_CHECK_TIMEOUT = 1000; // 1 seconde pour NetInfo

// Cache global pour éviter les vérifications multiples
let cachedNetworkState = null;
let lastNetworkCheck = 0;
const NETWORK_CACHE_DURATION = 3000; // 3 secondes de cache réseau

// Generate a unique ID without crypto dependency
const generateUniqueId = () => {
  return `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
};

/**
 * Vérification rapide et fiable du réseau avec cache
 * @returns {Promise<boolean>} true if network is available
 */
const checkNetworkConnectivity = async () => {
  const now = Date.now();

  // Utiliser le cache si disponible et récent
  if (cachedNetworkState && now - lastNetworkCheck < NETWORK_CACHE_DURATION) {
    return (
      cachedNetworkState.isConnected && cachedNetworkState.isInternetReachable
    );
  }

  try {
    // Timeout pour éviter les blocages
    const networkPromise = NetInfo.fetch();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Network check timeout")),
        NETWORK_CHECK_TIMEOUT
      )
    );

    const networkState = await Promise.race([networkPromise, timeoutPromise]);

    // Mettre à jour le cache
    cachedNetworkState = networkState;
    lastNetworkCheck = now;

    return networkState.isConnected && networkState.isInternetReachable;
  } catch (error) {
    console.warn("Erreur lors de la vérification réseau:", error);
    // En cas d'erreur, utiliser le cache si disponible, sinon supposer hors ligne
    return cachedNetworkState
      ? cachedNetworkState.isConnected && cachedNetworkState.isInternetReachable
      : false;
  }
};

/**
 * Vérification rapide et fiable du serveur SAP
 * @returns {Promise<boolean>} true if server is reachable
 */
const checkServerConnectivity = async () => {
  try {
    // Utiliser une requête HEAD légère avec un timeout court
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      CONNECTION_CHECK_TIMEOUT
    );

    const response = await axiosInstance.head("/ZBI_USER_DDH_CDS", {
      timeout: CONNECTION_CHECK_TIMEOUT,
      signal: controller.signal,
      headers: {
        "Cache-Control": "no-cache",
        Accept: "application/json",
      },
      // Désactiver les retry automatiques
      retry: 0,
    });

    clearTimeout(timeoutId);
    return response.status >= 200 && response.status < 300;
  } catch (error) {
    // Log seulement en mode debug
    if (__DEV__) {
      console.warn("Serveur SAP non accessible:", error.message);
    }
    return false;
  }
};

/**
 * Get cached connection status with fallback
 * @returns {Promise<{connected: boolean, timestamp: number}>}
 */
export const getStoredConnectionStatus = async () => {
  try {
    const status = await AsyncStorage.getItem(SAP_CONNECTION_STATUS);
    return status ? JSON.parse(status) : { connected: false, timestamp: 0 };
  } catch (error) {
    console.error("Error reading connection status:", error);
    return { connected: false, timestamp: 0 };
  }
};

/**
 * Vérification complète de connectivité avec gestion intelligente du cache
 * @param {boolean} forceCheck - Forcer la vérification même si cache récent
 * @returns {Promise<{isNetworkConnected: boolean, isServerReachable: boolean}>}
 */
export const checkConnection = async (forceCheck = false) => {
  try {
    // 1. Vérification réseau rapide
    const isNetworkConnected = await checkNetworkConnectivity();

    if (!isNetworkConnected) {
      return {
        isNetworkConnected: false,
        isServerReachable: false,
      };
    }

    // 2. Vérifier le cache serveur si pas de force check
    if (!forceCheck) {
      const lastCheckStr = await AsyncStorage.getItem(LAST_CONNECTION_CHECK);
      const now = Date.now();
      const lastCheck = lastCheckStr ? parseInt(lastCheckStr, 10) : 0;

      if (now - lastCheck < MIN_CHECK_INTERVAL) {
        const cachedStatus = await getStoredConnectionStatus();
        return {
          isNetworkConnected: true,
          isServerReachable: cachedStatus.connected,
        };
      }
    }

    // 3. Vérification serveur avec timeout
    const isServerReachable = await checkServerConnectivity();

    // 4. Mettre à jour le cache de manière asynchrone
    const now = Date.now();
    Promise.all([
      AsyncStorage.setItem(LAST_CONNECTION_CHECK, now.toString()),
      AsyncStorage.setItem(
        SAP_CONNECTION_STATUS,
        JSON.stringify({
          connected: isServerReachable,
          timestamp: now,
        })
      ),
    ]).catch((error) => {
      console.warn("Erreur lors de la mise à jour du cache:", error);
    });

    return {
      isNetworkConnected: true,
      isServerReachable,
    };
  } catch (error) {
    console.error("Connection check error:", error);
    return {
      isNetworkConnected: false,
      isServerReachable: false,
    };
  }
};

/**
 * Vérification rapide de connectivité complète
 * @returns {Promise<boolean>}
 */
export const isConnected = async () => {
  const { isNetworkConnected, isServerReachable } = await checkConnection();
  return isNetworkConnected && isServerReachable;
};

/**
 * Add an action to the offline queue with improved error handling
 * @param {Object} action The action to queue
 * @returns {Promise<boolean>} true if queued successfully, false otherwise
 */
export const queueOfflineAction = async (action) => {
  try {
    // Validation de l'action
    if (!action || !action.type) {
      console.error("Action invalide pour la file d'attente:", action);
      return false;
    }

    // Get existing queue with timeout
    const queue = await Promise.race([
      getOfflineActionQueue(),
      new Promise((resolve) => setTimeout(() => resolve([]), 5000)),
    ]);

    // Vérifier les doublons de manière plus robuste
    const isDuplicate = queue.some((queuedAction) => {
      try {
        return (
          queuedAction.type === action.type &&
          JSON.stringify(queuedAction.payload) ===
            JSON.stringify(action.payload)
        );
      } catch (e) {
        // En cas d'erreur de sérialisation, considérer comme non-duplicate
        return false;
      }
    });

    if (isDuplicate) {
      console.log(`Action en double ignorée: ${action.type}`);
      return true;
    }

    // Nettoyer l'action pour assurer la sérialisation
    const cleanAction = {
      type: action.type,
      payload: action.payload,
      meta: action.meta
        ? {
            originalAction: action.meta.originalAction,
            offlineQueuedAt: action.meta.offlineQueuedAt,
            requestId: action.meta.requestId,
          }
        : {},
    };

    // Add new action with a unique ID
    const queuedAction = {
      ...cleanAction,
      id: generateUniqueId(),
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };

    const newQueue = [...queue, queuedAction];

    // Save with timeout protection
    await Promise.race([
      AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(newQueue)),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Storage timeout")), 5000)
      ),
    ]);

    console.log(
      `Action ajoutée à la file d'attente hors ligne: ${action.type}`
    );
    return true;
  } catch (error) {
    console.error("Erreur lors de l'ajout à la file d'attente:", error);
    return false;
  }
};

/**
 * Get the queue of offline actions with error handling
 * @returns {Promise<Array>} - The list of pending actions
 */
export const getOfflineActionQueue = async () => {
  try {
    const queueString = await Promise.race([
      AsyncStorage.getItem(OFFLINE_QUEUE_KEY),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Storage timeout")), 5000)
      ),
    ]);

    return queueString ? JSON.parse(queueString) : [];
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de la file d'attente:",
      error
    );
    return [];
  }
};

/**
 * Remove an action from the queue with timeout protection
 * @param {string} actionId - The ID of the action to remove
 * @returns {Promise<boolean>} - true if removal succeeded, false otherwise
 */
export const removeFromOfflineQueue = async (actionId) => {
  try {
    const queue = await getOfflineActionQueue();
    const newQueue = queue.filter((action) => action.id !== actionId);

    await Promise.race([
      AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(newQueue)),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Storage timeout")), 5000)
      ),
    ]);

    console.log(`Action ${actionId} supprimée de la file d'attente hors ligne`);
    return true;
  } catch (error) {
    console.error("Erreur lors de la suppression de l'action:", error);
    return false;
  }
};

/**
 * Update an action in the offline queue
 * @param {string} actionId - The ID of the action to update
 * @param {Object} updates - The properties to update
 * @returns {Promise<boolean>} - true if update succeeded, false otherwise
 */
export const updateOfflineAction = async (actionId, updates) => {
  try {
    const queue = await getOfflineActionQueue();
    const actionIndex = queue.findIndex((action) => action.id === actionId);

    if (actionIndex === -1) {
      console.warn(
        `Action ${actionId} non trouvée dans la file d'attente hors ligne`
      );
      return false;
    }

    // Mettre à jour l'action en gardant toutes les propriétés existantes
    queue[actionIndex] = {
      ...queue[actionIndex],
      ...updates,
      lastUpdated: new Date().toISOString(),
    };

    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    console.log(
      `Action ${actionId} mise à jour dans la file d'attente hors ligne`
    );
    return true;
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'action:", error);
    return false;
  }
};

/**
 * Clear the entire queue
 * @returns {Promise<boolean>} - true if clearing succeeded, false otherwise
 */
export const clearOfflineQueue = async () => {
  try {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
    console.log("File d'attente hors ligne vidée");
    return true;
  } catch (error) {
    console.error("Erreur lors du vidage de la file d'attente:", error);
    return false;
  }
};

/**
 * Get the number of pending actions
 * @returns {Promise<number>} - The number of pending actions
 */
export const getPendingActionsCount = async () => {
  try {
    const queue = await getOfflineActionQueue();
    return queue.length;
  } catch (error) {
    console.error("Erreur lors du comptage des actions en attente:", error);
    return 0;
  }
};

/**
 * Mark an action as failed with error message
 * @param {string} actionId - The ID of the action to mark as failed
 * @param {string} errorMessage - The error message
 * @returns {Promise<boolean>} - true if marking succeeded, false otherwise
 */
export const markActionAsFailed = async (actionId, errorMessage) => {
  return await updateOfflineAction(actionId, {
    failed: true,
    error: errorMessage,
    failedAt: new Date().toISOString(),
    retryCount:
      (await getOfflineActionQueue()).find((a) => a.id === actionId)
        ?.retryCount + 1 || 1,
  });
};

/**
 * Clear error status from an action
 * @param {string} actionId - The ID of the action to clear error from
 * @returns {Promise<boolean>} - true if clearing succeeded, false otherwise
 */
export const clearActionError = async (actionId) => {
  try {
    const queue = await getOfflineActionQueue();
    const actionIndex = queue.findIndex((action) => action.id === actionId);

    if (actionIndex !== -1) {
      const updatedAction = { ...queue[actionIndex] };
      delete updatedAction.failed;
      delete updatedAction.error;
      delete updatedAction.failedAt;

      queue[actionIndex] = updatedAction;

      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      console.log(`Erreur supprimée pour l'action ${actionId}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error("Erreur lors de la suppression de l'erreur:", error);
    return false;
  }
};
