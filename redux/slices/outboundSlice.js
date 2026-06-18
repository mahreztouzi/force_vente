// src/redux/slices/outboundSlice.js
import { createSlice, createAsyncThunk, createAction } from "@reduxjs/toolkit";
import {
  completeDeliveryProcess,
  createDeliveryHeaderText,
  createDeliveryItemTexts,
  createDeliveryOnly,
  createOutbound,
  executeGoodsIssue,
  fecthDeliveryToBill,
  fetchAllOutboundsService,
  fetchDateAutorise,
  getDeliveryHeader,
  getDeliveryItems,
  validateDeliveryItems,
} from "../../services/outboundService";
import { createBill } from "../../services/billService";
import { isConnected, removeFromOfflineQueue } from "../../utils/offlineUtils";
import {
  getCommandesApprouves,
  updateOrderToLiv,
  updateOrderToNotLiv,
} from "./orderSlice";
import { getstocks, updateStockAfterDelivery } from "./stockSlice";
import { fetchPendingActionsCount } from "./offlineSlice";

const connectionCheckStarted = () => ({
  type: "outbounds/connection/checkStarted",
});

const connectionCheckStartedForOthers = () => ({
  type: "outbounds/connection/checkStartedForOthers",
});

export const updateOutboundToBillsOfflineQueued = createAction(
  "outbound/updateOutboundToBillsOfflineQueued/offlineQueued"
);

export const updateOutboundToBillsNotOfflineQueued = createAction(
  "outbound/updateOutboundToBillsNotOfflineQueued/offlineQueued"
);

export const processDeliveryComplete = createAsyncThunk(
  "outbound/deliveries/processDeliveryComplete",
  async (
    { deliveryData, offlineOutboundID },
    { rejectWithValue, dispatch, getState }
  ) => {
    try {
      let deliveryDocument = null;
      let billDocument = null;

      // ========== ÉTAPE 1: CRÉATION DE LA LIVRAISON ==========
      console.log("🚀 Démarrage étape 1: Création de la livraison");

      // Dispatch direct de l'action synchrone pour mise à jour immédiate
      dispatch({
        type: "deliveries/updateStepStatus",
        payload: {
          step: "creation",
          status: "in-progress",
          currentStep: 0,
        },
      });

      // Petite pause pour permettre au composant de se mettre à jour
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Vérifier la connexion
      dispatch(connectionCheckStarted());
      const isFullyConnected = await isConnected();

      if (!isFullyConnected) {
        console.log("📱 Mode offline - Création de livraison:", deliveryData);

        dispatch(
          updateOrderToLiv(
            deliveryData.to_DeliveryDocumentItem.results[0].ReferenceSDDocument
          )
        );

        const state = getState();
        const ordersApprouve = state.orders.ordersApprouve;

        dispatch(
          updateStockAfterDelivery({
            deliveryItems: deliveryData.to_DeliveryDocumentItem.results,
            ordersApprouve: ordersApprouve,
          })
        );

        // Mise à jour finale pour mode offline
        dispatch({
          type: "deliveries/completeOfflineProcess",
          payload: {
            message: "Livraison enregistrée en mode hors ligne",
          },
        });

        return { success: true, offline: true };
      }

      // Mode online - créer la livraison
      try {
        const createResult = await createDeliveryOnly(deliveryData);
        deliveryDocument = createResult.DeliveryDocument;

        // Étape 1 terminée
        dispatch({
          type: "deliveries/updateStepStatus",
          payload: {
            step: "creation",
            status: "completed",
            message: `Livraison créée: ${deliveryDocument}`,
            deliveryDocumentNumber: deliveryDocument,
            currentStep: 1,
          },
        });

        // ========== NOUVEAU: CRÉATION DES TEXTES DE POSTE ==========
        // Si offlineOutboundID existe, créer les textes de poste avec l'ID offline
        if (offlineOutboundID) {
          console.log(
            "🔤 Création des textes de poste avec ID offline:",
            offlineOutboundID
          );

          try {
            // Récupérer les items de la livraison créée
            const textResult = await createDeliveryHeaderText(
              deliveryDocument,
              offlineOutboundID
            );

            console.log(
              `✅ Textes créés: ${textResult.successCount} succès, ${textResult.errorCount} erreurs`
            );

            // Optionnel: Mettre à jour le statut pour indiquer la création des textes
            // dispatch({
            //   type: "deliveries/updateStepStatus",
            //   payload: {
            //     step: "creation",
            //     status: "completed",
            //     message: `Livraison créée: ${deliveryDocument} - Textes de poste: ${textResult.successCount}/${deliveryItems.length}`,
            //     deliveryDocumentNumber: deliveryDocument,
            //     currentStep: 1,
            //   },
            // });
          } catch (textError) {
            console.error(
              "⚠️ Erreur lors de la création des textes (processus continue):",
              textError
            );
            // Ne pas interrompre le processus principal pour les erreurs de texte
            // Optionnel: loguer l'erreur ou la signaler
          }
        }

        //  si l'etapes une est bien passé en supprime la livraison hors en cas c'est une livraiosn hors ligne

        if (offlineOutboundID) {
          const numeroDocument =
            deliveryData.to_DeliveryDocumentItem.results[0].ReferenceSDDocument;
          await removeFromOfflineQueue(offlineOutboundID);
          await dispatch(fetchPendingActionsCount());
          await dispatch(updateOrderToNotLiv(numeroDocument));
        }
        console.log("✅ Étape 1 terminée, passage à l'étape 2");
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        dispatch({
          type: "deliveries/updateStepStatus",
          payload: {
            step: "creation",
            status: "error",
            error: error.message || "Erreur lors de la création",
            isProcessing: false,
          },
        });
        return rejectWithValue({ step: "creation", error: error.message });
      }

      // ========== ÉTAPE 2: VALIDATION DES QUANTITÉS ==========
      console.log("🚀 Démarrage étape 2: Validation des quantités");

      dispatch({
        type: "deliveries/updateStepStatus",
        payload: {
          step: "validation",
          status: "in-progress",
          currentStep: 1,
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      try {
        const state = getState();
        const userData = state.auth.user;
        const validateResult = await validateDeliveryItems(
          userData?.magasin,
          deliveryDocument,
          deliveryData.to_DeliveryDocumentItem.results
        );

        dispatch({
          type: "deliveries/updateStepStatus",
          payload: {
            step: "validation",
            status: "completed",
            message: `${validateResult.updatedItems.length} articles validés`,
            currentStep: 2,
          },
        });

        console.log("✅ Étape 2 terminée, passage à l'étape 3");
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        dispatch({
          type: "deliveries/updateStepStatus",
          payload: {
            step: "validation",
            status: "error",
            error: error.message || "Erreur lors de la validation",
            isProcessing: false,
          },
        });
        console.log(
          "erreeeeur dans lvraison process delviery complete etape validation",
          error
        );
        return rejectWithValue({ step: "validation", error: error.message });
      }

      // ========== ÉTAPE 3: SORTIE DE MARCHANDISE ==========
      console.log("🚀 Démarrage étape 3: Sortie de marchandise");

      dispatch({
        type: "deliveries/updateStepStatus",
        payload: {
          step: "sortie",
          status: "in-progress",
          currentStep: 2,
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      try {
        const issueResult = await executeGoodsIssue(deliveryDocument);

        dispatch({
          type: "deliveries/updateStepStatus",
          payload: {
            step: "sortie",
            status: "completed",
            message: "Sortie de marchandise effectuée avec succès",
            currentStep: 3,
          },
        });

        console.log("✅ Étape 3 terminée, passage à l'étape 4");
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        dispatch({
          type: "deliveries/updateStepStatus",
          payload: {
            step: "sortie",
            status: "error",
            error: error.message || "Erreur lors de la sortie de marchandise",
            isProcessing: false,
          },
        });
        return rejectWithValue({ step: "sortie", error: error.message });
      }

      // ========== ÉTAPE 4: CRÉATION DE LA FACTURE ==========
      console.log("🚀 Démarrage étape 4: Création de la facture");

      dispatch({
        type: "deliveries/updateStepStatus",
        payload: {
          step: "facture",
          status: "in-progress",
          currentStep: 3,
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      try {
        billDocument = await createBill(deliveryDocument);

        dispatch({
          type: "deliveries/updateStepStatus",
          payload: {
            step: "facture",
            status: "completed",
            message: `Facture créée: ${billDocument}`,
            billDocumentNumber: billDocument,
            isComplete: true,
            isProcessing: false,
          },
        });

        console.log(
          "✅ Processus terminé avec succès - Facture créée:",
          billDocument
        );

        return {
          success: true,
          offline: false,
          deliveryDocument: deliveryDocument,
          billDocument: billDocument,
        };
      } catch (error) {
        dispatch({
          type: "deliveries/updateStepStatus",
          payload: {
            step: "facture",
            status: "error",
            error: error.message || "Erreur lors de la création de la facture",
            isProcessing: false,
          },
        });
        return rejectWithValue({ step: "facture", error: error.message });
      }
    } catch (error) {
      console.error("❌ Erreur générale:", error);
      dispatch({
        type: "deliveries/resetProcessWithError",
        payload: {
          error: error.message || "Une erreur inattendue s'est produite",
        },
      });
      return rejectWithValue({
        general: true,
        error: error.message || "Une erreur inattendue s'est produite",
      });
    }
  }
);

export const resetDeliveryProcess = createAsyncThunk(
  "deliveries/resetProcess",
  async (_, { dispatch }) => {
    dispatch({ type: "deliveries/resetProcess" });
    return { success: true };
  }
);
// ========== ACTION 1: VALIDATION DES QUANTITÉS + SORTIE DE MARCHANDISE ==========
export const processValidationAndGoodsIssue = createAsyncThunk(
  "outbound/deliveries/processValidationAndGoodsIssue",
  async (
    { deliveryDocument, deliveryItems },
    { rejectWithValue, dispatch, getState }
  ) => {
    try {
      console.log(
        "🚀 Démarrage: Validation des quantités + Sortie de marchandise"
      );
      const state = getState();
      const userData = state.auth.user;
      dispatch({
        type: "deliveries/updateStepStatus",
        payload: {
          step: "validation_sortie",
          status: "in-progress",
          currentStep: 1,
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Validation des quantités
      console.log("🔍 Validation des quantités en cours...");
      const validateResult = await validateDeliveryItems(
        userData?.magasin,
        deliveryDocument,
        deliveryItems
      );

      console.log("📦 Sortie de marchandise en cours...");
      // Sortie de marchandise
      const issueResult = await executeGoodsIssue(deliveryDocument);

      console.log(
        "✅ Validation et sortie de marchandise terminées avec succès"
      );

      return {
        success: true,
        validateResult,
        issueResult,
        deliveryDocument,
      };
    } catch (error) {
      console.error("❌ Erreur lors de la validation/sortie:", error);

      return rejectWithValue({
        step: "validation_sortie",
        error:
          error ||
          "Erreur lors de la validation ou de la sortie de marchandise",
      });
    }
  }
);

// ========== ACTION 2: CRÉATION DE LA FACTURE ==========
export const processCreateBill = createAsyncThunk(
  "outbound/deliveries/processCreateBill",
  async ({ deliveryDocument }, { rejectWithValue, dispatch }) => {
    try {
      console.log("🚀 Démarrage: Création de la facture");

      dispatch({
        type: "deliveries/updateStepStatus",
        payload: {
          step: "facture",
          status: "in-progress",
          currentStep: 2,
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log("🧾 Création de la facture en cours...");
      const billDocument = await createBill(deliveryDocument);

      dispatch({
        type: "deliveries/updateStepStatus",
        payload: {
          step: "facture",
          status: "completed",
          message: `Facture créée: ${billDocument}`,
          billDocumentNumber: billDocument,
          isComplete: true,
          isProcessing: false,
        },
      });

      console.log("✅ Facture créée avec succès:", billDocument);

      return {
        success: true,
        billDocument,
        deliveryDocument,
      };
    } catch (error) {
      console.error("❌ Erreur lors de la création de la facture:", error);

      dispatch({
        type: "deliveries/updateStepStatus",
        payload: {
          step: "facture",
          status: "error",
          error: error.message || "Erreur lors de la création de la facture",
          isProcessing: false,
        },
      });

      return rejectWithValue({
        step: "facture",
        error: error.message || "Erreur lors de la création de la facture",
      });
    }
  }
);

// Action pour créer uniquement la livraison
export const createDelivery = createAsyncThunk(
  "deliveries/createDelivery",
  async (deliveryData, { rejectWithValue, dispatch, getState }) => {
    try {
      // Vérifier la connexion au début
      dispatch(connectionCheckStarted());
      const isFullyConnected = await isConnected();

      if (!isFullyConnected) {
        console.log("Mode offline - Création de livraison:", deliveryData);

        // Mettre à jour la commande comme livrée (mode offline)
        dispatch(
          updateOrderToLiv(
            deliveryData.to_DeliveryDocumentItem.results[0].ReferenceSDDocument
          )
        );

        // Récupérer les commandes approuvées du state
        const state = getState();
        const ordersApprouve = state.orders.ordersApprouve;

        // Mettre à jour le stock offline
        dispatch(
          updateStockAfterDelivery({
            deliveryItems: deliveryData.to_DeliveryDocumentItem.results,
            ordersApprouve: ordersApprouve,
          })
        );

        // Retourner un indicateur de mode offline
        return {
          offline: true,
          status: "offline_queued",
          message: "Livraison enregistrée en mode hors ligne",
          data: deliveryData,
        };
      }

      // Mode online - créer la livraison normalement
      const result = await createDeliveryOnly(deliveryData);
      return {
        deliveryDocument: result.DeliveryDocument,
        status: "created",
        offline: false,
        data: result,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Action pour valider les items de la livraison
export const validateDelivery = createAsyncThunk(
  "deliveries/validateDelivery",
  async ({ deliveryDocument, originalItems }, { rejectWithValue }) => {
    try {
      const result = await validateDeliveryItems(
        deliveryDocument,
        originalItems
      );
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Action pour effectuer la sortie de marchandise
export const issueGoods = createAsyncThunk(
  "deliveries/issueGoods",
  async (deliveryDocument, { rejectWithValue, dispatch, getState }) => {
    try {
      const result = await executeGoodsIssue(deliveryDocument);

      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk pour créer une livraison
export const addOutbound = createAsyncThunk(
  "outbounds/addOutbound",
  async (outboundData, { rejectWithValue, dispatch, getState }) => {
    try {
      dispatch(connectionCheckStarted());
      const isFullyConnected = await isConnected();
      if (!isFullyConnected) {
        console.log("outbounds", outboundData);
        dispatch(
          updateOrderToLiv(
            outboundData.to_DeliveryDocumentItem.results[0].ReferenceSDDocument
          )
        );
        // Récupérer les commandes approuvées du state
        const state = getState();
        const ordersApprouve = state.orders.ordersApprouve;

        // Mettre à jour le stock offline
        dispatch(
          updateStockAfterDelivery({
            deliveryItems: outboundData.to_DeliveryDocumentItem.results,
            ordersApprouve: ordersApprouve,
          })
        );
        return;
      }
      const outbound = await completeDeliveryProcess(outboundData);
      return outbound;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk pour récupérer les entetes livraison
export const getOutbounds = createAsyncThunk(
  "outbounds/getOutbounds",
  async (_, { rejectWithValue }) => {
    try {
      const outbounds = await getDeliveryHeader();
      return outbounds;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk pour récupérer les livraison a facturer
export const getOutboundsToBill = createAsyncThunk(
  "outbounds/getOutboundsToBill",
  async ({ user }, { rejectWithValue, getState, dispatch }) => {
    try {
      dispatch(connectionCheckStartedForOthers());
      const isFullyConnected = await isConnected();

      // If offline, try to use cached data from the store
      if (!isFullyConnected) {
        const cached = getState().outbounds.outboundsToBill;
        return cached;
      }
      const outboundsToBill = await fecthDeliveryToBill(user);
      return outboundsToBill;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk pour récupérer les dates autorisés
export const getAutorisedDate = createAsyncThunk(
  "outbounds/getAutorisedDate",
  async ({ bukrs }, { rejectWithValue, getState, dispatch }) => {
    try {
      dispatch(connectionCheckStartedForOthers());
      const isFullyConnected = await isConnected();

      // If offline, try to use cached data from the store
      if (!isFullyConnected) {
        const cached = getState().outbounds.dateAutorise;
        return cached;
      }
      const response = await fetchDateAutorise(bukrs);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk pour récupérer toutes les livraison
// export const getAllOutbounds = createAsyncThunk(
//   "outbounds/getAllOutbounds",
//   async ({ user }, { rejectWithValue, getState, dispatch }) => {
//     try {
//       dispatch(connectionCheckStartedForOthers());
//       const isFullyConnected = await isConnected();

//       // If offline, try to use cached data from the store
//       if (!isFullyConnected) {
//         const cached = getState().outbounds.allOutbounds;
//         return cached;
//       }
//       const allOutbounds = await fetchAllOutboundsService(user);
//       return allOutbounds;
//     } catch (error) {
//       return rejectWithValue(error.message);
//     }
//   }
// );

export const getAllOutbounds = createAsyncThunk(
  "outbounds/getAllOutbounds",
  async (
    { user, dateDebut, dateFin },
    { rejectWithValue, getState, dispatch }
  ) => {
    try {
      dispatch(connectionCheckStartedForOthers());
      const isFullyConnected = await isConnected();

      if (!isFullyConnected) {
        const cached = getState().outbounds.allOutbounds;
        return cached;
      }
      const allOutbounds = await fetchAllOutboundsService(
        user,
        dateDebut,
        dateFin
      );
      console.log(
        "listes all outboounds dans slice",
        dateDebut,
        dateFin,
        allOutbounds
      );
      return allOutbounds;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
// Créer le slice Redux
const outboundSlice = createSlice({
  name: "outbounds",
  initialState: {
    outbounds: [],
    outboundsToBill: [],
    allOutbounds: [],
    currentOutbound: null,
    dateAutorise: [],
    dateAutoriseLoading: false,
    dateAutoriseError: null,
    loading: false,
    error: null,
    success: false,
    loadingOutboundsToBill: false,
    errorOutboundsToBill: null,
  },
  reducers: {
    resetoutboundstate: (state) => {
      state.currentOutbound = null;
      state.loading = false;
      state.dateAutoriseLoading = false;
      state.dateAutoriseError = false;
      state.loadingOutboundsToBill = false;
      state.errorOutboundsToBill = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase("outbounds/connection/checkStarted", (state) => {
        state.loading = true;
      })
      .addCase("outbounds/connection/checkStartedForOthers", (state) => {
        state.loadingOutboundsToBill = true;
      })
      // Cas pour la création d'une livraison de sortie de marchandise
      .addCase(addOutbound.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(addOutbound.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOutbound = action.payload;
        state.outbounds.push(action.payload);
        state.success = true;
      })
      .addCase(addOutbound.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      .addCase(processDeliveryComplete.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(processDeliveryComplete.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOutbound = action.payload;
        state.outbounds.push(action.payload);
        state.success = true;
      })
      .addCase(processDeliveryComplete.rejected, (state, action) => {
        state.loading = false;
        // state.error = action.payload;
        state.success = false;
      })
      // Cas pour la récupération des commandes
      // .addCase(getOutbounds.pending, (state) => {
      //   state.loading = true;
      //   state.error = null;
      // })
      // .addCase(getOutbounds.fulfilled, (state, action) => {
      //   state.loading = false;
      //   state.outbounds = action.payload;
      // })
      // .addCase(getOutbounds.rejected, (state, action) => {
      //   state.loading = false;
      //   state.error = action.payload;
      // })

      // Cas pour la récupération des livraison livré
      .addCase(getOutboundsToBill.pending, (state) => {
        state.loadingOutboundsToBill = true;
        state.errorOutboundsToBill = null;
      })
      .addCase(getOutboundsToBill.fulfilled, (state, action) => {
        state.loadingOutboundsToBill = false;
        state.outboundsToBill = action.payload;
      })
      .addCase(getOutboundsToBill.rejected, (state, action) => {
        state.loadingOutboundsToBill = false;
        state.errorOutboundsToBill = action.payload;
      })

      .addCase(updateOutboundToBillsOfflineQueued, (state, action) => {
        const outbound = action.payload;

        state.outboundsToBill = state.outboundsToBill.map((item) => {
          const isTargetItem = item.vbeln === outbound;

          if (isTargetItem) {
            return {
              ...item,
              offlineStatus: true,
            };
          }
          return item;
        });
      })
      .addCase(updateOutboundToBillsNotOfflineQueued, (state, action) => {
        const outbound = action.payload;

        state.outboundsToBill = state.outboundsToBill.map((item) => {
          const isTargetItem = item.vbeln === outbound;

          if (isTargetItem) {
            return {
              ...item,
              offlineStatus: false,
            };
          }
          return item;
        });
      })

      // Cas pour la récupération les dates autorisés
      .addCase(getAutorisedDate.pending, (state) => {
        state.dateAutoriseLoading = true;
        state.dateAutoriseError = null;
      })
      .addCase(getAutorisedDate.fulfilled, (state, action) => {
        state.dateAutoriseLoading = false;
        state.dateAutorise = action.payload;
      })
      .addCase(getAutorisedDate.rejected, (state, action) => {
        state.dateAutoriseLoading = false;
        state.dateAutoriseError = action.payload;
      })

      // Cas pour la récupération toutes les livraison
      .addCase(getAllOutbounds.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllOutbounds.fulfilled, (state, action) => {
        state.loading = false;

        state.allOutbounds = action.payload || [];
      })
      .addCase(getAllOutbounds.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.allOutbounds = [];
      });
  },
});

export const { resetoutboundstate } = outboundSlice.actions;
export default outboundSlice.reducer;
