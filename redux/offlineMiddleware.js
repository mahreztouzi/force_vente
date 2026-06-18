// // src/redux/middleware/offlineMiddleware.js
// import { isConnected, queueOfflineAction } from "../utils/offlineUtils";
// import { fetchPendingActionsCount } from "./slices/offlineSlice";

// // Define the actions we want to intercept when offline
// const OFFLINE_ACTIONS = [
//   "orders/addOrder",
//   "orders/addOrderReturn",
//   "orders/deleteOrderItem",
//   "orders/updateOrderItem",
//   "orders/addOrderItem",
// ];

// const offlineMiddleware = (store) => (next) => async (action) => {
//   // Skip if already marked to bypass
//   if (action.meta?.bypassOfflineQueue) {
//     return next(action);
//   }
//   // Check only for pending actions from our target list
//   if (action.type?.endsWith("/pending")) {
//     const baseActionType = action.type.replace("/pending", "");

//     // Only handle actions we've specifically listed
//     if (OFFLINE_ACTIONS.includes(baseActionType)) {
//       // Important: Check network connection first
//       const isFullyConnected = await isConnected();

//       // Only intercept if we're offline
//       if (!isFullyConnected) {
//         console.log(`[Offline] Intercepting action: ${baseActionType}`);

//         try {
//           // Get the payload from the meta info
//           const payload = action.meta?.arg;

//           // Queue the action for later
//           await queueOfflineAction({
//             type: baseActionType,
//             payload,
//             meta: {
//               originalAction: true,
//               offlineQueuedAt: new Date().toISOString(),
//             },
//           });

//           // Update pending actions counter
//           store.dispatch(fetchPendingActionsCount());

//           // Skip the pending action, and immediately dispatch offlineQueued
//           store.dispatch({
//             type: `${baseActionType}/offlineQueued`,
//             payload,
//             meta: { offlineQueued: true },
//           });

//           // Return early to prevent the original pending action from continuing
//           return { type: "OFFLINE_QUEUE_SUCCESS" };
//         } catch (error) {
//           console.error("Failed to queue action:", error);
//         }
//       }
//     }
//   }

//   // For all other cases (online or non-targeted actions), pass through normally
//   return next(action);
// };

// export default offlineMiddleware;

// version 2
// src/redux/middleware/offlineMiddleware.js

// version 2
// import { isConnected, queueOfflineAction } from "../utils/offlineUtils";
// import { fetchPendingActionsCount } from "./slices/offlineSlice";

// // Define the actions we want to intercept when offline
// const OFFLINE_ACTIONS = [
//   "orders/addOrder",
//   "orders/addOrderReturn",
//   "orders/deleteOrderItem",
//   "orders/updateOrderItem",
//   "orders/addOrderItem",
//   // pour les livraison
//   "outbounds/addOutbound",
//   "deliveries/createDelivery",
//   "outbound/deliveries/processDeliveryComplete",
//   // facture
//   "bills/addBill",
//   // reception
//   "goodReceipts/addGoodReceipt",
//   // les encaisssments
//   "encaissement/deleteEncaissement",
//   "encaissement/addEncaissement",
//   "encaissement/modifyEncaissement",

//   // les offres de vente
//   "Quotations/addQuotation",
// ];

// // Define actions that should be BLOCKED when offline (not queued)
// const BLOCKED_OFFLINE_ACTIONS = [
//   "orders/getCommandesApprouves",
//   // "stocks/getstocks",
//   "outbounds/getOutbounds",
//   "outbounds/getOutboundsToBill",
//   // Add other actions you want to block here
// ];

// const offlineMiddleware = (store) => (next) => async (action) => {
//   // Skip if already marked to bypass
//   if (action.meta?.bypassOfflineQueue) {
//     return next(action);
//   }

//   // Check only for pending actions from our target list
//   if (action.type?.endsWith("/pending")) {
//     const baseActionType = action.type.replace("/pending", "");

//     // Important: Check network connection first
//     const isFullyConnected = await isConnected();

//     // For actions that should be BLOCKED when offline
//     if (!isFullyConnected && BLOCKED_OFFLINE_ACTIONS.includes(baseActionType)) {
//       console.log(`[Offline] Blocking action: ${baseActionType}`);

//       // Dispatch a rejected action directly instead of continuing with the API call
//       // store.dispatch({
//       //   type: `${baseActionType}/rejected`,
//       //   error: {
//       //     message: "Cette action n'est pas disponible en mode hors ligne",
//       //   },
//       //   payload: "Cette action n'est pas disponible en mode hors ligne",
//       // });

//       // Return early to prevent the original pending action from continuing
//       return { type: "OFFLINE_BLOCKED_ACTION" };
//     }

//     // For actions that should be QUEUED when offline
//     if (!isFullyConnected && OFFLINE_ACTIONS.includes(baseActionType)) {
//       console.log(`[Offline] Intercepting action: ${baseActionType}`);

//       try {
//         store.dispatch({
//           type: "OFFLINE_QUEUE_PENDING",
//         });
//         // Get the payload from the meta info
//         const payload = action.meta?.arg;

//         // Queue the action for later
//         await queueOfflineAction({
//           type: baseActionType,
//           payload,
//           meta: {
//             originalAction: true,
//             offlineQueuedAt: new Date().toISOString(),
//           },
//         });

//         // Update pending actions counter
//         store.dispatch(fetchPendingActionsCount());

//         // Skip the pending action, and immediately dispatch offlineQueued
//         store.dispatch({
//           type: `${baseActionType}/offlineQueued`,
//           payload,
//           meta: { offlineQueued: true },
//         });

//         // Return early to prevent the original pending action from continuing
//         return { type: "OFFLINE_QUEUE_SUCCESS" };
//       } catch (error) {
//         console.error("Failed to queue action:", error);
//       }
//     }
//   }

//   // For all other cases (online or non-targeted actions), pass through normally
//   return next(action);
// };

// export default offlineMiddleware;

// version 3
import {
  isConnected,
  queueOfflineAction,
  checkConnection,
} from "../utils/offlineUtils";
import { fetchPendingActionsCount } from "./slices/offlineSlice";

// Define the actions we want to intercept when offline
const OFFLINE_ACTIONS = [
  "orders/addOrder",
  "orders/addOrderReturn",
  "orders/deleteOrderItem",
  "orders/updateOrderItem",
  "orders/addOrderItem",
  // pour les livraison
  "outbounds/addOutbound",
  "deliveries/createDelivery",
  "outbound/deliveries/processDeliveryComplete",
  // facture
  "bills/addBill",
  // reception
  // "goodReceipts/addGoodReceipt",
  // les encaisssments
  "encaissement/deleteEncaissement",
  "encaissement/addEncaissement",
  "encaissement/modifyEncaissement",
  // les offres de vente
  "Quotations/addQuotation",
];

// Define actions that should be BLOCKED when offline (not queued)
const BLOCKED_OFFLINE_ACTIONS = [
  "orders/getCommandesApprouves",
  "outbounds/getOutbounds",
  "outbounds/getOutboundsToBill",
];

// Cache pour éviter les vérifications multiples simultanées
let connectionCheckPromise = null;
let lastConnectionResult = null;
let lastConnectionCheck = 0;

const QUICK_CHECK_INTERVAL = 5000; // 5 secondes pour le cache rapide

/**
 * Vérification de connectivité avec cache intelligent
 */
const getCachedConnectionStatus = async () => {
  const now = Date.now();

  // Si on a un résultat récent (moins de 5 secondes), on l'utilise
  if (
    lastConnectionResult &&
    now - lastConnectionCheck < QUICK_CHECK_INTERVAL
  ) {
    return lastConnectionResult;
  }

  // Si une vérification est déjà en cours, on attend son résultat
  if (connectionCheckPromise) {
    return await connectionCheckPromise;
  }

  // Démarrer une nouvelle vérification
  connectionCheckPromise = checkConnection();

  try {
    const result = await connectionCheckPromise;
    lastConnectionResult = result;
    lastConnectionCheck = now;
    return result;
  } catch (error) {
    console.error("Erreur lors de la vérification de connectivité:", error);
    return { isNetworkConnected: false, isServerReachable: false };
  } finally {
    connectionCheckPromise = null;
  }
};

const offlineMiddleware = (store) => (next) => async (action) => {
  // Skip if already marked to bypass
  if (action.meta?.bypassOfflineQueue) {
    return next(action);
  }

  // Check only for pending actions from our target list
  if (action.type?.endsWith("/pending")) {
    const baseActionType = action.type.replace("/pending", "");

    // Vérification rapide : est-ce une action qui nous intéresse ?
    const isOfflineAction = OFFLINE_ACTIONS.includes(baseActionType);
    const isBlockedAction = BLOCKED_OFFLINE_ACTIONS.includes(baseActionType);

    if (!isOfflineAction && !isBlockedAction) {
      // Cette action ne nous intéresse pas, on la laisse passer
      return next(action);
    }

    try {
      // Vérification de connectivité avec cache intelligent
      const { isNetworkConnected, isServerReachable } =
        await getCachedConnectionStatus();
      const isFullyConnected = isNetworkConnected && isServerReachable;

      if (!isFullyConnected) {
        console.log(
          `[Offline] Connexion non disponible pour: ${baseActionType}`
        );

        // Pour les actions bloquées en mode hors ligne
        if (isBlockedAction) {
          console.log(`[Offline] Blocage de l'action: ${baseActionType}`);

          // Dispatch immédiat d'une action rejetée
          setTimeout(() => {
            store.dispatch({
              type: `${baseActionType}/rejected`,
              error: {
                message: "Cette action n'est pas disponible en mode hors ligne",
                name: "OfflineError",
                code: "OFFLINE_ACTION_BLOCKED",
              },
              payload: undefined,
              meta: {
                ...action.meta,
                rejectedValue:
                  "Cette action n'est pas disponible en mode hors ligne",
                offlineBlocked: true,
              },
            });
          }, 0);

          // Empêcher l'action originale de continuer
          return { type: "OFFLINE_BLOCKED_ACTION", blocked: true };
        }

        // Pour les actions à mettre en file d'attente
        if (isOfflineAction) {
          console.log(`[Offline] Mise en file d'attente: ${baseActionType}`);

          try {
            // Notifier que l'action est en cours de mise en file d'attente
            store.dispatch({
              type: "OFFLINE_QUEUE_PENDING",
              payload: { actionType: baseActionType },
            });

            // Obtenir le payload depuis les meta
            const payload = action.meta?.arg;

            // Ajouter à la file d'attente
            const queueSuccess = await queueOfflineAction({
              type: baseActionType,
              payload,
              meta: {
                originalAction: true,
                offlineQueuedAt: new Date().toISOString(),
                requestId: action.meta?.requestId,
              },
            });

            if (queueSuccess) {
              // Mettre à jour le compteur d'actions en attente
              store.dispatch(fetchPendingActionsCount());

              // Dispatch immédiat d'une action "mise en file d'attente"
              setTimeout(() => {
                store.dispatch({
                  type: `${baseActionType}/offlineQueued`,
                  payload,
                  meta: {
                    ...action.meta,
                    offlineQueued: true,
                    queuedAt: new Date().toISOString(),
                  },
                });
              }, 0);

              console.log(
                `[Offline] Action mise en file d'attente avec succès: ${baseActionType}`
              );
              return { type: "OFFLINE_QUEUE_SUCCESS", queued: true };
            } else {
              throw new Error("Échec de la mise en file d'attente");
            }
          } catch (queueError) {
            console.error(
              `[Offline] Erreur lors de la mise en file d'attente:`,
              queueError
            );

            // En cas d'erreur, on dispatch quand même un rejet
            setTimeout(() => {
              store.dispatch({
                type: `${baseActionType}/rejected`,
                error: {
                  message: "Impossible de mettre l'action en file d'attente",
                  name: "OfflineQueueError",
                  code: "QUEUE_FAILED",
                },
                payload: undefined,
                meta: {
                  ...action.meta,
                  rejectedValue:
                    "Impossible de mettre l'action en file d'attente",
                  queueError: true,
                },
              });
            }, 0);

            return { type: "OFFLINE_QUEUE_ERROR", error: queueError };
          }
        }
      }
    } catch (connectionError) {
      console.error(
        `[Offline] Erreur lors de la vérification de connectivité:`,
        connectionError
      );

      // En cas d'erreur de vérification, on considère qu'on est hors ligne
      // et on applique la même logique que ci-dessus
      if (isBlockedAction || isOfflineAction) {
        const errorAction = isBlockedAction ? "blocked" : "queued";
        console.log(
          `[Offline] Erreur de connectivité, action ${errorAction}: ${baseActionType}`
        );

        setTimeout(() => {
          store.dispatch({
            type: `${baseActionType}/rejected`,
            error: {
              message: "Impossible de vérifier la connectivité",
              name: "ConnectionCheckError",
              code: "CONNECTION_CHECK_FAILED",
            },
            payload: undefined,
            meta: {
              ...action.meta,
              rejectedValue: "Impossible de vérifier la connectivité",
              connectionError: true,
            },
          });
        }, 0);

        return { type: "OFFLINE_CONNECTION_ERROR", error: connectionError };
      }
    }
  }

  // Pour tous les autres cas (en ligne ou actions non ciblées), passer normalement
  return next(action);
};

export default offlineMiddleware;
