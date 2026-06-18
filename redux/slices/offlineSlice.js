// src/redux/slices/offlineSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  checkAndUpdateConnectionStatus,
  syncOfflineData,
  loadOfflineData,
} from "../offlineActions/offlineActions";
import {
  clearActionError,
  getOfflineActionQueue,
  getPendingActionsCount,
} from "../../utils/offlineUtils";

export const loadOfflineOrders = createAsyncThunk(
  "offline/offlineOrder",
  async (client, {}) => {
    try {
      const queue = await getOfflineActionQueue();
      // Filtrer uniquement les actions addOrder
      console.log("client dans offline slice ", client);
      const orderActions = queue.filter(
        (action) =>
          (action.type === "orders/addOrder" ||
            action.type === "Quotations/addQuotation" ||
            action.type === "orders/addOrderReturn") &&
          action.payload.SoldToParty === client
      );
      return orderActions;
    } catch (error) {}
  }
);
// export const loadOfflineLivraisons = createAsyncThunk(
//   "offline/offlineOutbound",
//   async (client, {}) => {
//     try {
//       const queue = await getOfflineActionQueue();
//       // Filtrer uniquement les actions addOrder
//       console.log("client dans offline slice ", client, queue);
//       const outboundActions = queue.filter(
//         (action) => action.type === "outbounds/addOutbound"
//       );
//       return outboundActions;
//     } catch (error) {}
//   }
// );

export const loadOfflineLivraisons = createAsyncThunk(
  "offline/offlineOutbound",
  async (client, { getState }) => {
    try {
      const queue = await getOfflineActionQueue();
      console.log("queeeeeeeeeeeeeeeeee", queue);
      const state = getState();
      const ordersApprouve = state.orders?.ordersApprouve || [];

      const outboundActions = queue.filter((action) => {
        // if (action.type !== "outbounds/addOutbound") {
        //   return false;
        // }
        if (action.type !== "outbound/deliveries/processDeliveryComplete") {
          return false;
        }

        const referenceSDDocument =
          action.payload?.deliveryData.to_DeliveryDocumentItem?.results?.[0]
            ?.ReferenceSDDocument;

        if (referenceSDDocument) {
          const correspondingOrder = ordersApprouve.find(
            (order) => order.cmd === referenceSDDocument
          );

          if (correspondingOrder) {
            // Comparer avec le code client (kunnr)
            return correspondingOrder.client === client?.kunnr;
          }
        }
        console.log(
          "livriaons teseeeeeest",
          action,
          referenceSDDocument,
          ordersApprouve
        );
        return false;
      });

      return outboundActions;
    } catch (error) {
      console.error("Erreur lors du filtrage des actions offline:", error);
      throw error;
    }
  }
);

// load offline bils
export const loadOfflineBills = createAsyncThunk(
  "offline/offlineBills",
  async (client, { getState }) => {
    try {
      const state = getState();
      const outboundToBill = state.outbounds?.outboundsToBill || [];
      const queue = await getOfflineActionQueue();
      const orderActions = queue.filter((action) => {
        if (action.type !== "bills/addBill") {
          return false;
        }
        const outboundNumber = action.payload;

        if (outboundNumber) {
          const correspondingOutbound = outboundToBill.find(
            (outbound) => outbound.vbeln === outboundNumber
          );

          if (correspondingOutbound) {
            return correspondingOutbound.kunag === client;
          }
        }

        return false;
      });

      return orderActions;
    } catch (error) {}
  }
);
// load offline bils
export const loadOfflineEncaissements = createAsyncThunk(
  "offline/offlineEncaissments",
  async (client) => {
    try {
      const queue = await getOfflineActionQueue();
      // Filtrer uniquement les actions addOrder
      console.log("client dans offline slice encaissment offline", client);
      const orderActions = queue.filter(
        (action) =>
          action.type === "encaissement/addEncaissement" &&
          action.payload.Client === client
      );
      console.log("listes des encaissments offlines", orderActions);
      return orderActions;
    } catch (error) {}
  }
);

export const loadAllOfflineEncaissements = createAsyncThunk(
  "offline/allOfflineEncaissements",
  async () => {
    try {
      const queue = await getOfflineActionQueue();
      // Filtrer uniquement les actions addEncaissement (pour tous les clients)
      const encaissementActions = queue.filter(
        (action) => action.type === "encaissement/addEncaissement"
      );

      // Calculer la somme totale
      const totalMontant = encaissementActions.reduce((sum, action) => {
        return sum + parseFloat(action.payload.Montant || 0);
      }, 0);

      console.log("Total encaissements offline:", totalMontant);
      return totalMontant;
    } catch (error) {
      console.error(
        "Erreur lors du chargement des encaissements offline:",
        error
      );
      return { actions: [], totalMontant: 0 };
    }
  }
);

// 4. Actions supplémentaires pour la gestion des erreurs
export const retryFailedOrder = createAsyncThunk(
  "offline/retryFailedOrder",
  async (actionId, { dispatch }) => {
    try {
      // Supprimer le marquage d'erreur
      await clearActionError(actionId);

      // Déclencher une nouvelle synchronisation
      // await dispatch(syncOfflineData());

      return {
        success: true,
        message: "Commande remise en file d'attente pour retry",
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
);

const offlineSlice = createSlice({
  name: "offline",
  initialState: {
    isConnected: true,
    isServerReachable: true,
    syncStatus: null,
    isSyncing: false,
    pendingActions: 0,
    lastCheck: null,
    offlineOrders: [],
    offlineLivraisons: [],
    offlineBills: [],
    offlineEncaissements: [],
    totalMontant: null,
  },
  reducers: {
    // Ajout d'une action pour mettre à jour le nombre d'actions en attente
    updatePendingActionsCount(state, action) {
      state.pendingActions = action.payload;
    },

    // Action pour réinitialiser le statut de synchronisation (utile pour nettoyer après un certain temps)
    resetSyncStatus(state) {
      state.syncStatus = null;
      state.isSyncing = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Gestion de la vérification de connexion
      .addCase(checkAndUpdateConnectionStatus.pending, (state) => {
        // Optionnel: on pourrait ajouter un état "checking" si nécessaire
      })
      .addCase(checkAndUpdateConnectionStatus.fulfilled, (state, action) => {
        state.isConnected = action.payload.isNetworkConnected;
        state.isServerReachable = action.payload.isServerReachable;
        state.lastCheck = new Date().toISOString();
      })
      .addCase(checkAndUpdateConnectionStatus.rejected, (state, action) => {
        // En cas d'erreur, supposons qu'il n'y a pas de connexion
        state.isConnected = false;
        state.isServerReachable = false;
        state.lastCheck = new Date().toISOString();
      })

      // Gestion de la synchronisation
      .addCase(syncOfflineData.pending, (state) => {
        state.isSyncing = true;
        state.syncStatus = {
          status: "syncing",
          message: "Synchronisation en cours...",
        };
      })
      .addCase(syncOfflineData.fulfilled, (state, action) => {
        state.syncStatus = action.payload;
        state.isSyncing = false;
        // Mettre à jour les actions en attente si disponible dans la payload
        if (
          action.payload &&
          typeof action.payload.remainingActions === "number"
        ) {
          state.pendingActions = action.payload.remainingActions;
        }
      })
      .addCase(syncOfflineData.rejected, (state, action) => {
        state.syncStatus = {
          success: false,
          status: "error",
          message: `Erreur de synchronisation: ${action.error.message}`,
        };
        state.isSyncing = false;
      })

      // Gestion du chargement des données hors ligne
      .addCase(loadOfflineData.pending, (state) => {
        // Optionnel: on pourrait ajouter un état "loading" si nécessaire
      })
      .addCase(loadOfflineData.fulfilled, (state, action) => {
        // Ici, on pourrait ajouter un indicateur que des données ont été chargées
        // depuis le stockage local
      })

      //  load offline orders
      .addCase(loadOfflineOrders.pending, (state) => {})
      .addCase(loadOfflineOrders.fulfilled, (state, action) => {
        state.offlineOrders = action.payload;
      })
      .addCase(loadOfflineOrders.rejected, (state, action) => {})
      // load offline outbounds
      .addCase(loadOfflineLivraisons.pending, (state) => {})
      .addCase(loadOfflineLivraisons.fulfilled, (state, action) => {
        state.offlineLivraisons = action.payload;
      })
      .addCase(loadOfflineLivraisons.rejected, (state, action) => {})
      // load offline bills
      .addCase(loadOfflineBills.pending, (state) => {})
      .addCase(loadOfflineBills.fulfilled, (state, action) => {
        state.offlineBills = action.payload;
      })
      .addCase(loadOfflineBills.rejected, (state, action) => {})
      // load offline encaissment
      .addCase(loadOfflineEncaissements.pending, (state) => {})
      .addCase(loadOfflineEncaissements.fulfilled, (state, action) => {
        state.offlineEncaissements = action.payload;
      })
      .addCase(loadOfflineEncaissements.rejected, (state, action) => {})
      .addCase(loadAllOfflineEncaissements.pending, (state) => {})
      .addCase(loadAllOfflineEncaissements.fulfilled, (state, action) => {
        state.totalMontant = action.payload;
      })
      .addCase(loadAllOfflineEncaissements.rejected, (state, action) => {});
  },
});

// Exportation des actions
export const { updatePendingActionsCount, resetSyncStatus } =
  offlineSlice.actions;

// Thunk pour mettre à jour le nombre d'actions en attente
export const fetchPendingActionsCount = () => async (dispatch) => {
  try {
    const count = await getPendingActionsCount();
    dispatch(updatePendingActionsCount(count));
    return count;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération du nombre d'actions en attente:",
      error
    );
    return 0;
  }
};

export default offlineSlice.reducer;
