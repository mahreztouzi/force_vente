// // src/redux/slices/orderSlice.js
// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import {
//   addOrderItemService,
//   createOrder,
//   createOrderReturn,
//   deleteOrderItemService,
//   fetchMotifRetour,
//   fetchOrders,
//   fetchOrdersApprouve,
//   updateOrderItemService,
// } from "../../services/orderService";
// import {
//   getStoredConnectionStatus,
//   isConnected,
// } from "../../utils/offlineUtils";

// // Action synchrone pour indiquer que la vérification de connexion est en cours
// export const connectionCheckStarted = () => ({
//   type: "orders/connection/checkStarted",
// });
// export const connectionCheckStartedForOthers = () => ({
//   type: "orders/connection/checkStartedForOthers",
// });

// // Thunk pour créer une commande
// // export const addOrder = createAsyncThunk(
// //   "orders/addOrder",
// //   async (orderData, { rejectWithValue }) => {
// //     try {
// //       const order = await createOrder(orderData);
// //       return order;
// //     } catch (error) {
// //       return rejectWithValue(error.message);
// //     }
// //   }
// // );

// // Assurez-vous que cette fonction appelle réellement l'API
// export const addOrder = createAsyncThunk(
//   "orders/addOrder",
//   async (orderData, { rejectWithValue, getState, dispatch }) => {
//     try {
//       // Important: vérifiez si cette action est appelée depuis la synchronisation
//       const bypassQueue = !!orderData.meta?.bypassOfflineQueue;

//       console.log(
//         `[ORDER] Création d'une commande${
//           bypassQueue ? " (bypass queue)" : ""
//         }:`,
//         orderData
//       );

//       dispatch(connectionCheckStarted());
//       // const { connected } = await getStoredConnectionStatus();
//       const isFullyConnected = await isConnected();
//       // const isFullyConnected = await isConnected();
//       if (!isFullyConnected) {
//         console.log("je suis appelé dans cration order ", isFullyConnected);
//         return;
//       }

//       // Appel à l'API pour créer la commande
//       const response = await createOrder(orderData);

//       console.log(
//         "[ORDER] Réponse de l'API pour la création de commande:",
//         response.data
//       );

//       return response; // Important: retournez les données de la réponse
//     } catch (error) {
//       console.error(
//         "[ORDER] Erreur lors de la création de la commande:",
//         error
//       );
//       return rejectWithValue(error.response?.data || error.message);
//     }
//   }
// );

// // Thunk pour créer une commande retour
// export const addOrderReturn = createAsyncThunk(
//   "orders/addOrderReturn",
//   async (orderData, { rejectWithValue, dispatch }) => {
//     try {
//       dispatch(connectionCheckStarted());
//       // const { connected } = await getStoredConnectionStatus();
//       const isFullyConnected = await isConnected();
//       // const isFullyConnected = await isConnected();
//       if (!isFullyConnected) {
//         return;
//       }
//       const order = await createOrderReturn(orderData);
//       return order;
//     } catch (error) {
//       return rejectWithValue(error.message);
//     }
//   }
// );

// // Thunk pour récupérer les commandes
// export const getOrders = createAsyncThunk(
//   "orders/getOrders",
//   async (_, { rejectWithValue }) => {
//     try {
//       const orders = await fetchOrders();
//       return orders;
//     } catch (error) {
//       return rejectWithValue(error.message);
//     }
//   }
// );

// // Thunk pour récupérer les commandes approuvés
// // export const getCommandesApprouves = createAsyncThunk(
// //   "orders/getOrdersApprouves",
// //   // async ({ user, client }, { rejectWithValue }) => {
// //   async ({ user }, { rejectWithValue }) => {
// //     try {
// //       // const { isNetworkConnected, isServerReachable } = isConnected();
// //       // if (!isNetworkConnected || !isServerReachable) {
// //       //   return ordersApprouve;
// //       // }
// //       // const ordersApprouve = await fetchOrdersApprouve(user, client);
// //       const ordersApprouve = await fetchOrdersApprouve(user);
// //       console.log("user dans slice order", user);
// //       return ordersApprouve;
// //     } catch (error) {
// //       return rejectWithValue(error.message);
// //     }
// //   }
// // );

// // Modified version of getCommandesApprouves in orderSlice.js

// // Thunk pour récupérer les commandes approuvés
// export const getCommandesApprouves = createAsyncThunk(
//   "orders/getCommandesApprouves",
//   async ({ user }, { rejectWithValue, getState, dispatch }) => {
//     try {
//       // Check connection status first
//       dispatch(connectionCheckStarted());
//       const isFullyConnected = await isConnected();

//       // If offline, try to use cached data from the store
//       if (!isFullyConnected) {
//         // Return cached data if available
//         const cachedOrdersApprouve = getState().orders.ordersApprouve;

//         // If we have cached data, use it
//         // if (cachedOrdersApprouve && cachedOrdersApprouve.length > 0) {
//         //   console.log("Returning cached approved orders while offline");
//         //   return cachedOrdersApprouve;
//         // }

//         // // If no cached data, reject with a meaningful message
//         // return rejectWithValue(
//         //   "Cette fonctionnalité n'est pas disponible en mode hors ligne"
//         // );
//         return cachedOrdersApprouve;
//       }

//       // If online, fetch fresh data
//       const ordersApprouve = await fetchOrdersApprouve(user);
//       console.log("Fetched fresh approved orders:", ordersApprouve);
//       return ordersApprouve;
//     } catch (error) {
//       return rejectWithValue(error.message);
//     }
//   }
// );

// // Thunk pour récupérer les motfis de retours
// export const getMotifsRetours = createAsyncThunk(
//   "orders/getMotifsRetours",
//   async (_, { rejectWithValue, getState, dispatch }) => {
//     try {
//       dispatch(connectionCheckStartedForOthers());
//       const isFullyConnected = await isConnected();

//       // If offline, try to use cached data from the store
//       if (!isFullyConnected) {
//         // Return cached data if available
//         const cached = getState().orders.motifs;
//         return cached;
//       }
//       const motifs = await fetchMotifRetour();
//       return motifs;
//     } catch (error) {
//       return rejectWithValue(error.message);
//     }
//   }
// );

// // Thunk pour la suppression d'une commande item
// export const deleteOrderItem = createAsyncThunk(
//   "orders/deleteOrderItem",
//   async ({ commande, itemNumber }, { rejectWithValue, dispatch }) => {
//     try {
//       dispatch(connectionCheckStartedForOthers());
//       const isFullyConnected = await isConnected();
//       if (!isFullyConnected) {
//         return;
//       }
//       const response = await deleteOrderItemService(commande, itemNumber);
//       return response;
//     } catch (error) {
//       return rejectWithValue(error.message);
//     }
//   }
// );

// // Thunk pour la modification d'un article item
// export const updateOrderItem = createAsyncThunk(
//   "orders/updateOrderItem",
//   async (
//     { commande, itemNumber, article, qte },
//     { rejectWithValue, dispatch }
//   ) => {
//     try {
//       dispatch(connectionCheckStartedForOthers());
//       const isFullyConnected = await isConnected();

//       if (!isFullyConnected) {
//         return;
//       }
//       const response = await updateOrderItemService(
//         commande,
//         itemNumber,
//         article,
//         qte
//       );

//       return response;
//     } catch (error) {
//       return rejectWithValue(error.message);
//     }
//   }
// );

// // Thunk pour la modification d'un article item
// export const addOrderItem = createAsyncThunk(
//   "orders/addOrderItem",
//   async ({ commande, article, qte }, { rejectWithValue, dispatch }) => {
//     try {
//       dispatch(connectionCheckStartedForOthers());
//       const isFullyConnected = await isConnected();
//       if (!isFullyConnected) {
//         return;
//       }
//       const response = await addOrderItemService(commande, article, qte);

//       return response;
//     } catch (error) {
//       return rejectWithValue(error.message);
//     }
//   }
// );

// // Créer le slice Redux
// const orderSlice = createSlice({
//   name: "orders",
//   initialState: {
//     orders: [],
//     motifs: [],
//     ordersApprouve: [],
//     currentOrder: null,
//     loading: false,
//     loadingOrdersApprouve: false,
//     errorOrdersApprouve: null,
//     successOrdersApprouve: false,
//     error: null,
//     success: false,
//     successOffline: false,
//     deleteLoading: false,
//     deleteError: null,
//     deleteSuccess: false,
//   },
//   reducers: {
//     resetOrderState: (state) => {
//       state.currentOrder = null;
//       state.loading = false;
//       state.error = null;
//       state.success = false;
//       state.loadingOrdersApprouve = false;
//       state.errorOrdersApprouve = null;
//       state.successOrdersApprouve = false;
//       state.successOffline = false;
//       state.deleteError = null;
//       state.deleteLoading = false;
//       state.deleteSuccess = false;
//     },
//   },
//   extraReducers: (builder) => {
//     builder

//       .addCase("orders/connection/checkStarted", (state) => {
//         state.loading = true;
//         state.loadingOrdersApprouve = true;
//         state.deleteLoading = true;
//       })
//       .addCase("orders/connection/checkStartedForOthers", (state) => {
//         state.deleteLoading = true;
//       })
//       // Cas pour la création de commande
//       .addCase(addOrder.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//         state.success = false;
//       })
//       .addCase(addOrder.fulfilled, (state, action) => {
//         state.loading = false;
//         state.currentOrder = action.payload;
//         state.orders.push(action.payload);
//         state.success = true;
//       })
//       .addCase(addOrder.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//         state.success = false;
//       })
//       // Dans orderSlice.js, ajouter ces cas aux extraReducers :
//       // .addCase("OFFLINE_QUEUE_PENDING", (state, action) => {
//       //   state.loading = true;
//       //   state.success = false;
//       // })
//       // .addCase("orders/addOrder/offlineQueued", (state, action) => {
//       //   state.loading = false;
//       //   state.currentOrder = {
//       //     ...action.payload,
//       //     offlineQueued: true,
//       //   };
//       //   // state.success = true;
//       //   state.successOffline = true;
//       // })
//       // .addCase("orders/addOrder/queueFailed", (state, action) => {
//       //   state.loading = false;
//       //   state.error =
//       //     "Action mise en file d'attente échouée: " + action.payload;
//       //   state.success = false;
//       // })
//       // Cas pour la création de commande retour
//       .addCase(addOrderReturn.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//         state.success = false;
//       })
//       .addCase(addOrderReturn.fulfilled, (state, action) => {
//         state.loading = false;
//         state.success = true;
//       })
//       .addCase(addOrderReturn.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//         state.success = false;
//       })
//       // Cas pour la récupération des commandes
//       .addCase(getOrders.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(getOrders.fulfilled, (state, action) => {
//         state.loading = false;
//         state.orders = action.payload;
//       })
//       .addCase(getOrders.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       // Cas pour la récupération des commandes approuvés
//       .addCase(getCommandesApprouves.pending, (state) => {
//         state.loadingOrdersApprouve = true;
//         state.errorOrdersApprouve = null;
//       })
//       .addCase(getCommandesApprouves.fulfilled, (state, action) => {
//         state.loadingOrdersApprouve = false;
//         state.ordersApprouve = action.payload;
//       })
//       .addCase(getCommandesApprouves.rejected, (state, action) => {
//         state.loadingOrdersApprouve = false;
//         state.errorOrdersApprouve = action.payload;
//       })
//       // Cas pour la récupération des motifs de retours
//       .addCase(getMotifsRetours.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(getMotifsRetours.fulfilled, (state, action) => {
//         state.loading = false;
//         state.motifs = action.payload;
//       })
//       .addCase(getMotifsRetours.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       // Cas pour la suppression d'un article commmande
//       .addCase(deleteOrderItem.pending, (state) => {
//         state.deleteLoading = true;
//         state.deleteError = null;
//         state.deleteSuccess = false;
//       })
//       .addCase(deleteOrderItem.fulfilled, (state, action) => {
//         state.deleteLoading = false;
//         state.deleteSuccess = true;
//       })
//       .addCase(deleteOrderItem.rejected, (state, action) => {
//         state.deleteLoading = false;
//         state.deleteError = action.payload;
//         state.deleteSuccess = false;
//       })
//       // Cas pour la modification d'un article
//       .addCase(updateOrderItem.pending, (state) => {
//         state.deleteLoading = true;
//         state.deleteError = null;
//         state.deleteSuccess = false;
//       })
//       .addCase(updateOrderItem.fulfilled, (state, action) => {
//         state.deleteLoading = false;
//         state.deleteSuccess = true;
//       })
//       .addCase(updateOrderItem.rejected, (state, action) => {
//         state.deleteLoading = false;
//         state.deleteError = action.payload;
//         state.deleteSuccess = false;
//       })
//       // Cas pour ajouter un nv article
//       .addCase(addOrderItem.pending, (state) => {
//         state.deleteLoading = true;
//         state.deleteError = null;
//         state.deleteSuccess = false;
//       })
//       .addCase(addOrderItem.fulfilled, (state, action) => {
//         state.deleteLoading = false;
//         state.deleteSuccess = true;
//       })
//       .addCase(addOrderItem.rejected, (state, action) => {
//         state.deleteLoading = false;
//         state.deleteError = action.payload;
//         state.deleteSuccess = false;
//       });
//   },
// });

// export const { resetOrderState } = orderSlice.actions;
// export default orderSlice.reducer;

// version 2

import {
  createSlice,
  createAsyncThunk,
  createAction,
  current,
} from "@reduxjs/toolkit";
import {
  addOrderItemService,
  createOrder,
  createOrderReturn,
  deleteOrderItemService,
  fetchAllOrders,
  fetchMotifRetour,
  fetchOrders,
  fetchOrdersApprouve,
  updateOrderItemService,
} from "../../services/orderService";
import {
  getStoredConnectionStatus,
  isConnected,
} from "../../utils/offlineUtils";

// Actions synchrones pour indiquer que la vérification de connexion est en cours
export const connectionCheckStarted = createAction(
  "orders/connection/checkStarted"
);
export const connectionCheckStartedForOthers = createAction(
  "orders/connection/checkStartedForOthers"
);

// Actions offline explicites
export const addOrderOfflineQueued = createAction(
  "orders/addOrder/offlineQueueds"
);
export const addOrderReturnOfflineQueued = createAction(
  "orders/addOrderReturn/offlineQueued"
);
export const updateOrderItemOfflineQueued = createAction(
  "orders/updateOrderItem/offlineQueued"
);
export const deleteOrderItemOfflineQueued = createAction(
  "orders/deleteOrderItem/offlineQueued"
);
export const addOrderItemOfflineQueued = createAction(
  "orders/addOrderItem/offlineQueued"
);
export const updateOrderToLiv = createAction(
  "orders/updateOrderToLiv/offlineQueued"
);
export const updateOrderToNotLiv = createAction(
  "orders/updateOrderToNotLiv/offlineQueued"
);

// Fonction utilitaire pour générer un cmd temporaire
let sessionOrderCounter = 1;

const generateTempCmd = (state) => {
  const tempPrefix = "TEMP_ORDER_";
  const timestamp = Date.now();
  let tempId;

  do {
    tempId = `${tempPrefix}${timestamp}_${sessionOrderCounter}`;
    sessionOrderCounter++;
  } while (state.orders.some((item) => item.cmd === tempId));

  return tempId;
};

// Thunk pour créer une commande
export const addOrder = createAsyncThunk(
  "orders/addOrder",
  async (orderData, { rejectWithValue, getState, dispatch }) => {
    try {
      const bypassQueue = !!orderData.meta?.bypassOfflineQueue;

      console.log(
        `[ORDER] Création d'une commande${
          bypassQueue ? " (bypass queue)" : ""
        }:`,
        orderData
      );

      dispatch(connectionCheckStarted());
      const isFullyConnected = await isConnected();

      if (!isFullyConnected && !bypassQueue) {
        console.log("Mode offline - commande mise en file d'attente");
        dispatch(addOrderOfflineQueued(orderData));
        return { offline: true, data: orderData };
      }

      const response = await createOrder(orderData);
      console.log(
        "[ORDER] Réponse de l'API pour la création de commande:",
        response.data
      );
      return response;
    } catch (error) {
      console.error(
        "[ORDER] Erreur lors de la création de la commande:",
        error
      );
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Thunk pour créer une commande retour
export const addOrderReturn = createAsyncThunk(
  "orders/addOrderReturn",
  async (orderData, { rejectWithValue, dispatch }) => {
    try {
      dispatch(connectionCheckStarted());
      const isFullyConnected = await isConnected();

      if (!isFullyConnected) {
        // dispatch(addOrderReturnOfflineQueued(orderData));
        return { offline: true, data: orderData };
      }

      const order = await createOrderReturn(orderData);
      return order;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk pour récupérer les commandes
export const getOrders = createAsyncThunk(
  "orders/getOrders",
  async (_, { rejectWithValue }) => {
    try {
      const orders = await fetchOrders();
      return orders;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk pour récupérer les commandes approuvées
export const getCommandesApprouves = createAsyncThunk(
  "orders/getCommandesApprouves",
  async ({ user }, { rejectWithValue, getState, dispatch }) => {
    try {
      dispatch(connectionCheckStarted());
      const isFullyConnected = await isConnected();

      if (!isFullyConnected) {
        const cachedOrdersApprouve = getState().orders.ordersApprouve;
        return cachedOrdersApprouve;
      }

      const ordersApprouve = await fetchOrdersApprouve(user);
      console.log("Fetched fresh approved orders:", ordersApprouve);
      return ordersApprouve;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// recueprer toutes les commandes vente et retours
export const getAllCommande = createAsyncThunk(
  "orders/getAllCommande",
  async (
    { user, dateDebut, dateFin },
    { rejectWithValue, getState, dispatch }
  ) => {
    try {
      dispatch(connectionCheckStarted());
      const isFullyConnected = await isConnected();

      if (!isFullyConnected) {
        const cachedQuotationsApprouve = getState().orders.allOrders;
        return cachedQuotationsApprouve;
      }

      const allOrders = await fetchAllOrders(user, dateDebut, dateFin);
      return allOrders;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk pour récupérer les motifs de retours
export const getMotifsRetours = createAsyncThunk(
  "orders/getMotifsRetours",
  async (_, { rejectWithValue, getState, dispatch }) => {
    try {
      dispatch(connectionCheckStartedForOthers());
      const isFullyConnected = await isConnected();

      if (!isFullyConnected) {
        const cached = getState().orders.motifs;
        return cached;
      }

      const motifs = await fetchMotifRetour();
      return motifs;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk pour la suppression d'une commande item
export const deleteOrderItem = createAsyncThunk(
  "orders/deleteOrderItem",
  async ({ commande, itemNumber }, { rejectWithValue, dispatch }) => {
    try {
      dispatch(connectionCheckStartedForOthers());
      const isFullyConnected = await isConnected();

      if (!isFullyConnected) {
        // dispatch(deleteOrderItemOfflineQueued({ commande, itemNumber }));
        return { offline: true, data: { commande, itemNumber } };
      }

      const response = await deleteOrderItemService(commande, itemNumber);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk pour la modification d'un article item
export const updateOrderItem = createAsyncThunk(
  "orders/updateOrderItem",
  async (
    { commande, itemNumber, article, qte },
    { rejectWithValue, dispatch }
  ) => {
    try {
      dispatch(connectionCheckStartedForOthers());
      const isFullyConnected = await isConnected();

      if (!isFullyConnected) {
        return { offline: true, data: { commande, itemNumber, article, qte } };
      }

      const response = await updateOrderItemService(
        commande,
        itemNumber,
        article,
        qte
      );

      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk pour ajouter un article item
export const addOrderItem = createAsyncThunk(
  "orders/addOrderItem",
  async ({ commande, article, qte }, { rejectWithValue, dispatch }) => {
    try {
      dispatch(connectionCheckStartedForOthers());
      const isFullyConnected = await isConnected();

      if (!isFullyConnected) {
        // dispatch(addOrderItemOfflineQueued({ commande, article, qte }));
        return { offline: true, data: { commande, article, qte } };
      }

      const response = await addOrderItemService(commande, article, qte);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Créer le slice Redux
const orderSlice = createSlice({
  name: "orders",
  initialState: {
    orders: [],
    motifs: [],
    ordersApprouve: [], // Structure plate: [{cmd, matnr, maktx, ...}, ...]
    allOrders: [],
    allOrdersLoading: false,
    allOrdersError: null,
    currentOrder: null,
    loading: false,
    loadingOrdersApprouve: false,
    errorOrdersApprouve: null,
    successOrdersApprouve: false,
    error: null,
    success: false,
    successOffline: false,
    deleteLoading: false,
    deleteError: null,
    deleteSuccess: false,
  },
  reducers: {
    resetOrderState: (state) => {
      state.currentOrder = null;
      state.loading = false;
      state.error = null;
      state.success = false;
      state.loadingOrdersApprouve = false;
      state.errorOrdersApprouve = null;
      state.successOrdersApprouve = false;
      state.successOffline = false;
      state.deleteError = null;
      state.deleteLoading = false;
      state.deleteSuccess = false;
    },
    // Reducer pour forcer la mise à jour du state
    // forceUpdateOrdersApprouve: (state, action) => {
    //   state.ordersApprouve = action.payload;
    // },
  },
  extraReducers: (builder) => {
    builder
      // === ACTIONS DE CONNECTION ===
      .addCase(connectionCheckStarted, (state) => {
        state.loading = true;
        state.loadingOrdersApprouve = true;
        state.deleteLoading = true;
      })
      .addCase(connectionCheckStartedForOthers, (state) => {
        state.deleteLoading = true;
      })

      // === ACTIONS OFFLINE AVEC ACTIONS EXPLICITES ===
      .addCase(addOrderOfflineQueued, (state, action) => {
        const tempCmd = generateTempCmd(state);

        // Transformer chaque article de to_Item en objet article individuel
        const transformedArticles = action.payload.to_Item?.map(
          (item, index) => ({
            bukrs: "S001",
            charg: "",
            client: action.payload.SoldToParty,
            cmd: tempCmd,
            commercial: action.payload.commercial,
            erdat: `/Date(${Date.now()})/`,
            isOffline: true,
            isOfflineAdded: true,
            kmein: "UN",
            lsmeng: parseInt(item.RequestedQuantity) || 1,
            maktx: item.description || `Article ${item.Material}`,
            matnr: item.Material,
            offlineStatus: "pending",
            posnr: String((index + 1) * 10).padStart(6, "0"), // 000010, 000020, etc.
            qte_restante: parseInt(item.RequestedQuantity) || 1,
            tempId: `TEMP_ARTICLE_${Date.now()}_${Math.random()}`,
          })
        );

        console.log(
          "je suis iciiiiiiiiiiiiiiiiii  transform",
          transformedArticles
        );

        // Ajouter tous les articles transformés
        // state.ordersApprouve.push(...transformedArticles);
        state.loading = false;
        state.success = true;
      })

      .addCase(addOrderReturnOfflineQueued, (state, action) => {
        const newOrderReturn = {
          ...action.payload,
          cmd: generateTempCmd(state),
          isOffline: true,
          offlineStatus: "pending",
          type: "return",
          statusGlobal: "Retour en attente",
        };

        state.orders.push(newOrderReturn);
        state.currentOrder = newOrderReturn;
        state.loading = false;
        state.success = true;
        state.successOffline = true;
        state.error = null;
      })

      .addCase(updateOrderItemOfflineQueued, (state, action) => {
        const { commande, itemNumber, article, qte } = action.payload;

        // Créer une nouvelle référence du tableau avec les modifications
        state.ordersApprouve = state.ordersApprouve.map((item, index) => {
          // Vérifier si c'est l'article à modifier
          // itemNumber peut être l'index ou le matnr
          const isTargetItem =
            item.cmd === commande &&
            (index === itemNumber || item.matnr === article);

          if (isTargetItem) {
            return {
              ...item,
              lsmeng: qte,
              isModified: true,
              isOffline: true,
              offlineStatus: item.cmd.toString().startsWith("TEMP_")
                ? "pending"
                : "modified",
            };
          }
          return item;
        });

        state.deleteLoading = false;
        state.deleteSuccess = true;
        state.deleteError = null;
      })

      .addCase(deleteOrderItemOfflineQueued, (state, action) => {
        const { commande, itemNumber } = action.payload;

        // Transformation directe similaire au premier cas
        const updatedArticles = state.ordersApprouve.map((item) => {
          const isTargetItem =
            item.cmd === commande && item.posnr === itemNumber;

          if (isTargetItem) {
            return {
              ...item,
              isDeleted: true,
              isOfflineDeleted: true,
              isOffline: true,
              offlineStatus: item.cmd.toString().startsWith("TEMP_")
                ? "pending"
                : "modified",
            };
          }
          return item;
        });

        // Mise à jour simple du state comme dans le premier cas
        state.ordersApprouve = updatedArticles;
        state.deleteLoading = false;
        state.deleteSuccess = true;
        state.deleteError = null;
      })

      .addCase(addOrderItemOfflineQueued, (state, action) => {
        const { commande, article, qte } = action.payload;

        // Trouver un article existant de cette commande pour copier les métadonnées
        const existingItem = state.ordersApprouve.find(
          (item) => item.cmd === commande
        );

        if (existingItem) {
          // Créer le nouvel article basé sur la structure existante
          const newArticle = {
            __metadata: existingItem.__metadata,
            cmd: commande,
            commercial: existingItem.commercial,
            client: existingItem.client,
            bukrs: existingItem.bukrs,
            erdat: existingItem.erdat,
            matnr: article,
            maktx: `Article ${article}`, // Vous pouvez améliorer cela
            posnr: `${(
              Math.max(
                ...state.ordersApprouve
                  .filter((item) => item.cmd === commande)
                  .map((item) => parseInt(item.posnr) || 0)
              ) + 10
            )
              .toString()
              .padStart(6, "0")}`,
            charg: "",
            lsmeng: qte,
            kmein: "UN",
            qte_restante: qte,
            isOfflineAdded: true,
            isOffline: true,
            offlineStatus: commande.toString().startsWith("TEMP_")
              ? "pending"
              : "modified",
            tempId: `TEMP_ARTICLE_${Date.now()}_${Math.random()}`,
          };

          // Ajouter le nouvel article à la liste plate
          state.ordersApprouve = [...state.ordersApprouve, newArticle];
        }

        state.deleteLoading = false;
        state.deleteSuccess = true;
        state.deleteError = null;
      })

      .addCase(updateOrderToLiv, (state, action) => {
        console.log("Payload complet:", action.payload);
        const commande = action.payload;

        state.ordersApprouve.forEach((item, index) => {
          if (item.cmd === commande) {
            item.isModified = true;
          }
        });
      })

      .addCase(updateOrderToNotLiv, (state, action) => {
        console.log("Payload complet:", action.payload);
        const commande = action.payload;

        state.ordersApprouve.forEach((item, index) => {
          if (item.cmd === commande) {
            item.isModified = false;
          }
        });
      })

      // === ACTIONS ONLINE NORMALES ===
      .addCase(addOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
        state.successOffline = false;
      })
      .addCase(addOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
        state.success = true;
      })
      .addCase(addOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
        state.successOffline = false;
      })

      // Cas pour la création de commande retour
      .addCase(addOrderReturn.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
        state.successOffline = false;
      })
      .addCase(addOrderReturn.fulfilled, (state, action) => {
        state.loading = false;
        state.success = !action.payload.offline;
        state.successOffline = !!action.payload.offline;
      })
      .addCase(addOrderReturn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
        state.successOffline = false;
      })

      // Cas pour la récupération des commandes
      .addCase(getOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(getOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Cas pour la récupération des commandes approuvées
      .addCase(getCommandesApprouves.pending, (state) => {
        state.loadingOrdersApprouve = true;
        state.errorOrdersApprouve = null;
      })
      // .addCase(getCommandesApprouves.fulfilled, (state, action) => {
      //   state.loadingOrdersApprouve = false;
      //   state.deleteLoading = false;
      //   // Garder la structure plate - pas de groupement
      //   state.ordersApprouve = action.payload;
      // })
      .addCase(getCommandesApprouves.fulfilled, (state, action) => {
        state.loadingOrdersApprouve = false;
        state.deleteLoading = false;

        // Créer une map des commandes existantes avec leurs modifications
        const existingModifications = new Map();
        state.ordersApprouve.forEach((item) => {
          if (item.isModified) {
            existingModifications.set(item.cmd, item.isModified);
          }
        });

        // Mettre à jour avec les nouvelles données tout en préservant isModified
        state.ordersApprouve = action.payload.map((item) => ({
          ...item,
          isModified: existingModifications.get(item.cmd) || false,
        }));
      })
      .addCase(getCommandesApprouves.rejected, (state, action) => {
        state.loadingOrdersApprouve = false;
        state.errorOrdersApprouve = action.payload;
      })

      // Cas pour la récupération de toute commande vente et retours
      .addCase(getAllCommande.pending, (state) => {
        state.allOrdersLoading = true;
        state.allOrdersError = null;
      })
      .addCase(getAllCommande.fulfilled, (state, action) => {
        state.allOrdersLoading = false;
        state.allOrders = action.payload;
      })
      .addCase(getAllCommande.rejected, (state, action) => {
        state.allOrdersLoading = false;
        state.allOrdersError = action.payload;
      })

      // Cas pour la récupération des motifs de retours
      .addCase(getMotifsRetours.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMotifsRetours.fulfilled, (state, action) => {
        state.loading = false;
        state.motifs = action.payload;
      })
      .addCase(getMotifsRetours.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Cas pour la suppression d'un article commande
      .addCase(deleteOrderItem.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
        state.deleteSuccess = false;
      })
      .addCase(deleteOrderItem.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.deleteSuccess = !action.payload.offline;
      })
      .addCase(deleteOrderItem.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload;
        state.deleteSuccess = false;
      })

      // Cas pour la modification d'un article
      .addCase(updateOrderItem.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
        state.deleteSuccess = false;
      })
      .addCase(updateOrderItem.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.deleteSuccess = !action.payload.offline;
      })
      .addCase(updateOrderItem.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload;
        state.deleteSuccess = false;
      })

      // Cas pour ajouter un nouvel article
      .addCase(addOrderItem.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
        state.deleteSuccess = false;
      })
      .addCase(addOrderItem.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.deleteSuccess = !action.payload.offline;
      })
      .addCase(addOrderItem.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload;
        state.deleteSuccess = false;
      });
  },
});

export const { resetOrderState } = orderSlice.actions;
export default orderSlice.reducer;
