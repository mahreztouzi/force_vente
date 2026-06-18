// src/redux/offlineActions/offlineActions.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  checkConnection,
  getOfflineActionQueue,
  removeFromOfflineQueue,
  clearOfflineQueue,
  getPendingActionsCount,
  markActionAsFailed,
} from "../../utils/offlineUtils";
import { getActionCreator } from "../actionCreator/actionCreators";

// Thunk to check and update connection status
export const checkAndUpdateConnectionStatus = createAsyncThunk(
  "offline/checkConnection",
  async (_, { rejectWithValue }) => {
    try {
      const connectionStatus = await checkConnection();
      return connectionStatus;
    } catch (error) {
      console.error("Error checking connection:", error);
      return rejectWithValue({
        isNetworkConnected: false,
        isServerReachable: false,
      });
    }
  }
);

// export const syncOfflineData = createAsyncThunk(
//   "offline/syncData",
//   async (_, { dispatch, getState, rejectWithValue }) => {
//     try {
//       // Vérifier la connexion d'abord
//       const connectionStatus = await checkConnection();
//       const isFullyConnected =
//         connectionStatus.isNetworkConnected &&
//         connectionStatus.isServerReachable;

//       if (!isFullyConnected) {
//         return rejectWithValue(
//           "Pas de connexion disponible pour la synchronisation"
//         );
//       }

//       // Obtenir toutes les actions en attente
//       const actionQueue = await getOfflineActionQueue();

//       console.log("je suis appelé dans aciton queue", actionQueue);

//       if (actionQueue.length === 0) {
//         return {
//           status: "complete",
//           success: true,
//           message: "Aucune action en attente à synchroniser",
//           remainingActions: 0,
//         };
//       }

//       console.log(
//         `[SYNC] Synchronisation de ${actionQueue.length} actions en attente...`
//       );

//       // Traiter chaque action dans la file d'attente
//       let successCount = 0;
//       let errorCount = 0;
//       let errorDetails = [];

//       // Trier les actions par ordre chronologique (la plus ancienne d'abord)
//       const sortedActions = [...actionQueue].sort(
//         (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
//       );

//       // Filtrer pour ne garder que les actions originales
//       const originalActions = sortedActions.filter(
//         (action) =>
//           !action.type.endsWith("/pending") &&
//           !action.type.endsWith("/rejected") &&
//           !action.type.endsWith("/fulfilled") &&
//           !action.type.endsWith("/offlineQueued")
//       );

//       console.log(
//         `[SYNC] Actions originales à traiter: ${originalActions.length}`
//       );
//       console.log(
//         `[SYNC] Types d'actions:`,
//         originalActions.map((a) => a.type)
//       );

//       // Traiter chaque action
//       for (const queuedAction of originalActions) {
//         try {
//           console.log(
//             `[SYNC] Traitement de l'action en attente: ${queuedAction.type}`
//           );
//           console.log(`[SYNC] Payload:`, JSON.stringify(queuedAction.payload));

//           // Extraire les données de l'action originale
//           const { type, payload, meta = {} } = queuedAction;

//           // IMPORTANT: Créer un nouveau méta avec bypassOfflineQueue: true
//           const newMeta = {
//             ...meta,
//             bypassOfflineQueue: true,
//           };

//           // Récupérer le créateur d'action approprié
//           const actionCreator = getActionCreator(type);
//           console.log(
//             `[SYNC] Créateur d'action trouvé pour ${type}:`,
//             !!actionCreator
//           );

//           // Vérifier si nous avons un créateur d'action spécifique
//           if (!actionCreator) {
//             console.error(`[SYNC] Pas de créateur d'action pour ${type}`);
//             errorCount++;
//             errorDetails.push({
//               type,
//               error: "Pas de créateur d'action défini",
//             });

//             // On supprime quand même pour éviter les boucles infinies
//             await removeFromOfflineQueue(queuedAction.id);
//             continue;
//           }

//           // Exécuter l'action avec gestion d'erreur explicite
//           let result;
//           try {
//             // Appeler le créateur d'action spécifique qui doit faire l'appel API directement
//             result = await dispatch(actionCreator(payload, newMeta));

//             console.log(`[SYNC] Résultat après dispatch:`, result);

//             // Vérifier explicitement si nous avons une erreur
//             if (result?.error || (result?.payload && result.payload.error)) {
//               throw new Error(
//                 result.error?.message ||
//                   result.payload?.error ||
//                   "Échec de la synchronisation"
//               );
//             }

//             // Si nous arrivons ici, c'est un succès
//             await removeFromOfflineQueue(queuedAction.id);
//             successCount++;
//             console.log(
//               `[SYNC] Action traitée avec succès: ${queuedAction.type}`
//             );
//           } catch (dispatchError) {
//             console.error(`[SYNC] Erreur lors du dispatch:`, dispatchError);
//             errorCount++;
//             errorDetails.push({
//               type,
//               error: dispatchError.message || "Erreur inconnue",
//             });

//             // Décider si on supprime l'action en échec
//             // On supprime pour éviter de réessayer indéfiniment la même action en échec
//             await removeFromOfflineQueue(queuedAction.id);
//           }
//         } catch (error) {
//           console.error(
//             `[SYNC] Erreur globale pour l'action ${queuedAction.type}:`,
//             error
//           );
//           errorCount++;
//           errorDetails.push({
//             type: queuedAction.type,
//             error: error.message || "Erreur inconnue",
//           });

//           // Supprimer l'action qui a provoqué une exception
//           await removeFromOfflineQueue(queuedAction.id);
//         }
//       }

//       // Vérifier les actions restantes après la synchronisation
//       const remainingActions = await getPendingActionsCount();

//       // Retourner le statut final de la synchronisation
//       return {
//         status: "complete",
//         success: errorCount === 0,
//         message:
//           errorCount === 0
//             ? `Synchronisation réussie: ${successCount} action(s) synchronisée(s)`
//             : `Synchronisation partielle: ${successCount} réussie(s), ${errorCount} échouée(s)`,
//         errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
//         remainingActions,
//       };
//     } catch (error) {
//       console.error("[SYNC] Erreur globale pendant la synchronisation:", error);
//       return rejectWithValue(
//         "Erreur pendant la synchronisation: " +
//           (error.message || "Erreur inconnue")
//       );
//     }
//   }
// );
// Thunk to load data from local storage

// version 2 sans la suppression automatique
// export const syncOfflineData = createAsyncThunk(
//   "offline/syncData",
//   async (_, { dispatch, getState, rejectWithValue }) => {
//     try {
//       // Vérifier la connexion d'abord
//       const connectionStatus = await checkConnection();
//       const isFullyConnected =
//         connectionStatus.isNetworkConnected &&
//         connectionStatus.isServerReachable;

//       if (!isFullyConnected) {
//         return rejectWithValue(
//           "Pas de connexion disponible pour la synchronisation"
//         );
//       }

//       // Obtenir toutes les actions en attente
//       const actionQueue = await getOfflineActionQueue();

//       if (actionQueue.length === 0) {
//         return {
//           status: "complete",
//           success: true,
//           message: "Aucune action en attente à synchroniser",
//           remainingActions: 0,
//         };
//       }

//       console.log(
//         `[SYNC] Synchronisation de ${actionQueue.length} actions en attente...`
//       );

//       // Traiter chaque action dans la file d'attente
//       let successCount = 0;
//       let errorCount = 0;
//       let errorDetails = [];

//       // Trier les actions par ordre chronologique (la plus ancienne d'abord)
//       const sortedActions = [...actionQueue].sort(
//         (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
//       );

//       // Filtrer pour ne garder que les actions originales qui ne sont pas déjà marquées comme échouées
//       const originalActions = sortedActions.filter(
//         (action) =>
//           !action.type.endsWith("/pending") &&
//           !action.type.endsWith("/rejected") &&
//           !action.type.endsWith("/fulfilled") &&
//           !action.type.endsWith("/offlineQueued") &&
//           !action.failed // Ne pas retraiter les actions déjà marquées comme échouées
//       );

//       console.log(
//         `[SYNC] Actions originales à traiter: ${originalActions.length}`
//       );

//       // Traiter chaque action
//       for (const queuedAction of originalActions) {
//         try {
//           console.log(
//             `[SYNC] Traitement de l'action en attente: ${queuedAction.type}`
//           );

//           // Extraire les données de l'action originale
//           const { type, payload, meta = {} } = queuedAction;

//           // IMPORTANT: Créer un nouveau méta avec bypassOfflineQueue: true
//           const newMeta = {
//             ...meta,
//             bypassOfflineQueue: true,
//           };

//           // Récupérer le créateur d'action approprié
//           const actionCreator = getActionCreator(type);

//           if (!actionCreator) {
//             console.error(`[SYNC] Pas de créateur d'action pour ${type}`);
//             await markActionAsFailed(
//               queuedAction.id,
//               "Pas de créateur d'action défini"
//             );
//             errorCount++;
//             errorDetails.push({
//               type,
//               error: "Pas de créateur d'action défini",
//             });
//             continue;
//           }

//           // Exécuter l'action avec gestion d'erreur explicite
//           let result;
//           try {
//             result = await dispatch(actionCreator(payload, newMeta));

//             console.log(`[SYNC] Résultat après dispatch:`, result);

//             // Vérifier explicitement si nous avons une erreur
//             if (result?.error || (result?.payload && result.payload.error)) {
//               const errorMessage =
//                 result.error?.message ||
//                 result.payload?.error ||
//                 "Échec de la synchronisation";

//               // Marquer l'action comme échouée au lieu de la supprimer
//               await markActionAsFailed(queuedAction.id, errorMessage);
//               errorCount++;
//               errorDetails.push({
//                 type,
//                 error: errorMessage,
//               });

//               console.log(
//                 `[SYNC] Action marquée comme échouée: ${queuedAction.type} - ${errorMessage}`
//               );
//             } else {
//               // Si nous arrivons ici, c'est un succès - supprimer de la queue
//               await removeFromOfflineQueue(queuedAction.id);
//               successCount++;
//               console.log(
//                 `[SYNC] Action traitée avec succès: ${queuedAction.type}`
//               );
//             }
//           } catch (dispatchError) {
//             console.error(`[SYNC] Erreur lors du dispatch:`, dispatchError);

//             // Marquer l'action comme échouée au lieu de la supprimer
//             const errorMessage = dispatchError.message || "Erreur inconnue";
//             await markActionAsFailed(queuedAction.id, errorMessage);

//             errorCount++;
//             errorDetails.push({
//               type,
//               error: errorMessage,
//             });
//           }
//         } catch (error) {
//           console.error(
//             `[SYNC] Erreur globale pour l'action ${queuedAction.type}:`,
//             error
//           );

//           // Marquer l'action comme échouée au lieu de la supprimer
//           const errorMessage = error.message || "Erreur inconnue";
//           await markActionAsFailed(queuedAction.id, errorMessage);

//           errorCount++;
//           errorDetails.push({
//             type: queuedAction.type,
//             error: errorMessage,
//           });
//         }
//       }

//       // Vérifier les actions restantes après la synchronisation
//       const remainingActions = await getPendingActionsCount();

//       // Retourner le statut final de la synchronisation
//       return {
//         status: "complete",
//         success: errorCount === 0,
//         message:
//           errorCount === 0
//             ? `Synchronisation réussie: ${successCount} action(s) synchronisée(s)`
//             : `Synchronisation partielle: ${successCount} réussie(s), ${errorCount} échouée(s)`,
//         errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
//         remainingActions,
//       };
//     } catch (error) {
//       console.error("[SYNC] Erreur globale pendant la synchronisation:", error);
//       return rejectWithValue(
//         "Erreur pendant la synchronisation: " +
//           (error.message || "Erreur inconnue")
//       );
//     }
//   }
// );

//  version 3 ajout d'un parametre optionnel
export const syncOfflineData = createAsyncThunk(
  "offline/syncData",
  async (actionId = null, { dispatch, getState, rejectWithValue }) => {
    try {
      // Vérifier la connexion d'abord
      const connectionStatus = await checkConnection();
      const isFullyConnected =
        connectionStatus.isNetworkConnected &&
        connectionStatus.isServerReachable;

      if (!isFullyConnected) {
        return rejectWithValue(
          "Pas de connexion disponible pour la synchronisation"
        );
      }

      // Obtenir toutes les actions en attente
      const actionQueue = await getOfflineActionQueue();

      if (actionQueue.length === 0) {
        return {
          status: "complete",
          success: true,
          message: "Aucune action en attente à synchroniser",
          remainingActions: 0,
        };
      }

      let actionsToProcess = [];

      // Si un actionId est spécifié, ne traiter que cette action
      if (actionId) {
        const specificAction = actionQueue.find(
          (action) => action.id === actionId
        );

        if (!specificAction) {
          return rejectWithValue(
            `Action avec l'ID ${actionId} non trouvée dans la file d'attente`
          );
        }

        // Vérifier que l'action n'est pas déjà marquée comme échouée (optionnel)
        if (specificAction.failed) {
          console.log(
            `[SYNC] Tentative de re-synchronisation de l'action échouée: ${actionId}`
          );
        }

        actionsToProcess = [specificAction];
        console.log(
          `[SYNC] Synchronisation de l'action spécifique: ${actionId}`
        );
      } else {
        // Traitement normal de toutes les actions
        // Trier les actions par ordre chronologique (la plus ancienne d'abord)
        const sortedActions = [...actionQueue].sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );

        // Filtrer pour ne garder que les actions originales qui ne sont pas déjà marquées comme échouées
        actionsToProcess = sortedActions.filter(
          (action) =>
            !action.type.endsWith("/pending") &&
            !action.type.endsWith("/rejected") &&
            !action.type.endsWith("/fulfilled") &&
            !action.type.endsWith("/offlineQueued") &&
            !action.failed // Ne pas retraiter les actions déjà marquées comme échouées
        );

        console.log(
          `[SYNC] Synchronisation de ${actionQueue.length} actions en attente...`
        );
      }

      console.log(`[SYNC] Actions à traiter: ${actionsToProcess.length}`);

      if (actionsToProcess.length === 0) {
        return {
          status: "complete",
          success: true,
          message: actionId
            ? "L'action spécifiée ne nécessite pas de synchronisation"
            : "Aucune action originale en attente à synchroniser",
          remainingActions: await getPendingActionsCount(),
        };
      }

      // Traiter chaque action
      let successCount = 0;
      let errorCount = 0;
      let errorDetails = [];

      for (const queuedAction of actionsToProcess) {
        try {
          console.log(
            `[SYNC] Traitement de l'action en attente: ${queuedAction.type}`
          );

          // Extraire les données de l'action originale
          const { type, payload, meta = {} } = queuedAction;

          // IMPORTANT: Créer un nouveau méta avec bypassOfflineQueue: true
          const newMeta = {
            ...meta,
            bypassOfflineQueue: true,
          };

          // Récupérer le créateur d'action approprié
          const actionCreator = getActionCreator(type);

          if (!actionCreator) {
            console.error(`[SYNC] Pas de créateur d'action pour ${type}`);
            await markActionAsFailed(
              queuedAction.id,
              "Pas de créateur d'action défini"
            );
            errorCount++;
            errorDetails.push({
              type,
              error: "Pas de créateur d'action défini",
            });
            continue;
          }

          // Exécuter l'action avec gestion d'erreur explicite
          let result;
          try {
            result = await dispatch(actionCreator(payload, newMeta));

            console.log(`[SYNC] Résultat après dispatch:`, result);

            // Vérifier explicitement si nous avons une erreur
            if (result?.error || (result?.payload && result.payload.error)) {
              const errorMessage =
                result.error?.message ||
                result.payload?.error ||
                "Échec de la synchronisation";

              // Marquer l'action comme échouée au lieu de la supprimer
              await markActionAsFailed(queuedAction.id, errorMessage);
              errorCount++;
              errorDetails.push({
                type,
                error: errorMessage,
              });

              console.log(
                `[SYNC] Action marquée comme échouée: ${queuedAction.type} - ${errorMessage}`
              );
            } else {
              // Si nous arrivons ici, c'est un succès - supprimer de la queue
              await removeFromOfflineQueue(queuedAction.id);
              successCount++;
              console.log(
                `[SYNC] Action traitée avec succès: ${queuedAction.type}`
              );
            }
          } catch (dispatchError) {
            console.error(`[SYNC] Erreur lors du dispatch:`, dispatchError);

            // Marquer l'action comme échouée au lieu de la supprimer
            const errorMessage = dispatchError.message || "Erreur inconnue";
            await markActionAsFailed(queuedAction.id, errorMessage);

            errorCount++;
            errorDetails.push({
              type,
              error: errorMessage,
            });
          }
        } catch (error) {
          console.error(
            `[SYNC] Erreur globale pour l'action ${queuedAction.type}:`,
            error
          );

          // Marquer l'action comme échouée au lieu de la supprimer
          const errorMessage = error.message || "Erreur inconnue";
          await markActionAsFailed(queuedAction.id, errorMessage);

          errorCount++;
          errorDetails.push({
            type: queuedAction.type,
            error: errorMessage,
          });
        }
      }

      // Vérifier les actions restantes après la synchronisation
      const remainingActions = await getPendingActionsCount();

      // Retourner le statut final de la synchronisation
      const message = actionId
        ? errorCount === 0
          ? `Action ${actionId} synchronisée avec succès`
          : `Échec de la synchronisation de l'action ${actionId}`
        : errorCount === 0
        ? `Synchronisation réussie: ${successCount} action(s) synchronisée(s)`
        : `Synchronisation partielle: ${successCount} réussie(s), ${errorCount} échouée(s)`;

      return {
        status: "complete",
        success: errorCount === 0,
        message,
        errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
        remainingActions,
        actionId: actionId || undefined,
      };
    } catch (error) {
      console.error("[SYNC] Erreur globale pendant la synchronisation:", error);
      return rejectWithValue(
        "Erreur pendant la synchronisation: " +
          (error.message || "Erreur inconnue")
      );
    }
  }
);
export const loadOfflineData = createAsyncThunk(
  "offline/loadData",
  async (dataKey, { rejectWithValue }) => {
    try {
      // This function could be implemented in offlineUtils.js
      // to load specific data from AsyncStorage
      // const data = await getOfflineData(dataKey);
      // return data;

      // For now returning an empty object
      return {};
    } catch (error) {
      return rejectWithValue("Error loading data: " + error.message);
    }
  }
);
