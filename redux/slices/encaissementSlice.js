// // src/redux/slices/encaissementSlice.js
// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import {
//   createEncaissement,
//   deleteEncaissements,
//   fetchBills,
//   fetchEncaissements,
//   putEncaissement,
// } from "../../services/encaissementService";
// import axiosInstance from "../../services/axiosConfig";
// import { isConnected } from "../../utils/offlineUtils";

// export const connectionCheckStarted = () => ({
//   type: "encaissement/connection/checkStarted",
// });
// export const connectionCheckStartedForOthers = () => ({
//   type: "encaissement/connection/checkStartedForOthers",
// });

// // Thunk pour créer un encaissement
// export const addEncaissement = createAsyncThunk(
//   "encaissement/addEncaissement",
//   async (encaissementData, { rejectWithValue, dispatch }) => {
//     try {
//       dispatch(connectionCheckStarted());
//       const isFullyConnected = await isConnected();
//       if (!isFullyConnected) {
//         return;
//       }

//       const encaissement = await createEncaissement(encaissementData);
//       return encaissement;
//     } catch (error) {
//       return rejectWithValue(error.message);
//     }
//   }
// );

// export const getBills = createAsyncThunk(
//   "encaissement/getBills",
//   async ({ client, commercial }, { rejectWithValue }) => {
//     try {
//       const bills = await fetchBills(client, commercial);
//       return bills;
//     } catch (error) {
//       return rejectWithValue(error.message);
//     }
//   }
// );

// export const getEncaissment = createAsyncThunk(
//   "encaissement/getEncaissment",
//   async ({ commercial }, { rejectWithValue, getState, dispatch }) => {
//     try {
//       dispatch(connectionCheckStartedForOthers());
//       const isFullyConnected = await isConnected();

//       // If offline, try to use cached data from the store
//       if (!isFullyConnected) {
//         const cached = getState().encaissement.encaissements;
//         return cached;
//       }
//       const encaissment = await fetchEncaissements(commercial);
//       return encaissment;
//     } catch (error) {
//       return rejectWithValue(error.message);
//     }
//   }
// );

// export const deleteEncaissement = createAsyncThunk(
//   "encaissement/deleteEncaissement",
//   async ({ client, commercial, numLigne }, { rejectWithValue, dispatch }) => {
//     try {
//       dispatch(connectionCheckStarted());
//       const isFullyConnected = await isConnected();
//       if (!isFullyConnected) {
//         return;
//       }
//       const response = await deleteEncaissements(client, commercial, numLigne);
//       return response;
//     } catch (error) {
//       return rejectWithValue(error.message);
//     }
//   }
// );

// export const modifyEncaissement = createAsyncThunk(
//   "encaissement/modifyEncaissement",
//   async (encaissementData, { rejectWithValue, dispatch }) => {
//     try {
//       dispatch(connectionCheckStarted());
//       const isFullyConnected = await isConnected();
//       if (!isFullyConnected) {
//         return;
//       }
//       const response = await putEncaissement(encaissementData);
//       return response;
//     } catch (error) {
//       return rejectWithValue(error.message);
//     }
//   }
// );

// // Créer le slice Redux
// const encaissementSlice = createSlice({
//   name: "encaissement",
//   initialState: {
//     encaissements: [],
//     bills: [],
//     currentEncaissements: null,
//     // Utiliser des états de loading et error spécifiques pour chaque opération
//     billsLoading: false,
//     billsError: null,
//     encaissementsLoading: false,
//     encaissementsError: null,
//     submitLoading: false,
//     submitError: null,
//     deleteLoading: false,
//     deleteError: null,
//     success: false,
//   },
//   reducers: {
//     resetEncaissementState: (state) => {
//       state.currentEncaissements = null;
//       state.encaissementsLoading = false;
//       state.encaissementsError = null;
//       state.submitLoading = false;
//       state.submitError = null;
//       state.success = false;
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase("encaissement/connection/checkStarted", (state) => {
//         state.submitLoading = true;
//         state.deleteLoading = true;
//       })
//       .addCase("encaissement/connection/checkStartedForOthers", (state) => {
//         state.encaissementsLoading = true;
//       })
//       // Cas pour la création d'un encaissement
//       .addCase(addEncaissement.pending, (state) => {
//         state.submitLoading = true;
//         state.submitError = null;
//         state.success = false;
//       })
//       .addCase(addEncaissement.fulfilled, (state, action) => {
//         state.submitLoading = false;
//         state.currentEncaissements = action.payload;
//         state.success = true;
//       })
//       .addCase(addEncaissement.rejected, (state, action) => {
//         state.submitLoading = false;
//         state.submitError = action.payload;
//         state.success = false;
//       })
//       // Cas pour la récupération des factures
//       .addCase(getBills.pending, (state) => {
//         state.billsLoading = true;
//         state.billsError = null;
//       })
//       .addCase(getBills.fulfilled, (state, action) => {
//         state.billsLoading = false;
//         state.bills = action.payload;
//       })
//       .addCase(getBills.rejected, (state, action) => {
//         state.billsLoading = false;
//         state.billsError = action.payload;
//       })
//       // Cas pour la récupération des encaissements
//       .addCase(getEncaissment.pending, (state) => {
//         state.encaissementsLoading = true;
//         state.encaissementsError = null;
//       })
//       .addCase(getEncaissment.fulfilled, (state, action) => {
//         state.encaissementsLoading = false;
//         state.encaissements = action.payload;
//       })
//       .addCase(getEncaissment.rejected, (state, action) => {
//         state.encaissementsLoading = false;
//         state.encaissementsError = action.payload;
//       })
//       // Cas pour la suppression d'un encaissement
//       .addCase(deleteEncaissement.pending, (state) => {
//         state.deleteLoading = true;
//         state.deleteError = null;
//       })
//       .addCase(deleteEncaissement.fulfilled, (state, action) => {
//         state.deleteLoading = false;
//         // Filtrer l'encaissement supprimé de la liste
//         state.encaissements = state.encaissements.filter(
//           (item) => item.NumLigne !== action.payload.numLigne
//         );
//       })
//       .addCase(deleteEncaissement.rejected, (state, action) => {
//         state.deleteLoading = false;
//         state.deleteError = action.payload;
//       })
//       // Cas pour la modification d'un encaissement
//       .addCase(modifyEncaissement.pending, (state) => {
//         state.submitLoading = true;
//         state.submitError = null;
//         state.success = false;
//       })
//       .addCase(modifyEncaissement.fulfilled, (state, action) => {
//         state.submitLoading = false;
//         state.success = true;
//       })
//       .addCase(modifyEncaissement.rejected, (state, action) => {
//         state.submitLoading = false;
//         state.submitError = action.payload;
//         state.success = false;
//       });
//   },
// });

// export const { resetEncaissementState } = encaissementSlice.actions;
// export default encaissementSlice.reducer;

// src/redux/slices/encaissementSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createEncaissement,
  deleteEncaissements,
  fetchBills,
  fetchEncaissements,
  putEncaissement,
} from "../../services/encaissementService";
import axiosInstance from "../../services/axiosConfig";
import { isConnected } from "../../utils/offlineUtils";
import { addMontantOffline } from "./authSlice";

export const connectionCheckStarted = () => ({
  type: "encaissement/connection/checkStarted",
});
export const connectionCheckStartedForOthers = () => ({
  type: "encaissement/connection/checkStartedForOthers",
});

// Thunk pour créer un encaissement
export const addEncaissement = createAsyncThunk(
  "encaissement/addEncaissement",
  async (encaissementData, { rejectWithValue, dispatch }) => {
    try {
      dispatch(connectionCheckStarted());
      const isFullyConnected = await isConnected();
      if (!isFullyConnected) {
        console.log(
          "encaissment data dans offlineencaissment",
          encaissementData
        );
        return { offline: true, data: encaissementData };
      }

      const encaissement = await createEncaissement(encaissementData);
      return encaissement;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getBills = createAsyncThunk(
  "encaissement/getBills",
  async ({ client, commercial }, { rejectWithValue }) => {
    try {
      const bills = await fetchBills(client, commercial);
      return bills;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getEncaissment = createAsyncThunk(
  "encaissement/getEncaissment",
  async ({ commercial }, { rejectWithValue, getState, dispatch }) => {
    try {
      dispatch(connectionCheckStartedForOthers());
      const isFullyConnected = await isConnected();

      // If offline, try to use cached data from the store
      if (!isFullyConnected) {
        const cached = getState().encaissement.encaissements;
        return cached;
      }
      const encaissment = await fetchEncaissements(commercial);
      return encaissment;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteEncaissement = createAsyncThunk(
  "encaissement/deleteEncaissement",
  async (
    { id, client, commercial, numLigne },
    { rejectWithValue, dispatch }
  ) => {
    try {
      dispatch(connectionCheckStarted());
      const isFullyConnected = await isConnected();
      if (!isFullyConnected) {
        return;
      }
      const response = await deleteEncaissements(
        id,
        client,
        commercial,
        numLigne
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const modifyEncaissement = createAsyncThunk(
  "encaissement/modifyEncaissement",
  async (encaissementData, { rejectWithValue, dispatch }) => {
    try {
      dispatch(connectionCheckStarted());
      const isFullyConnected = await isConnected();
      if (!isFullyConnected) {
        return;
      }
      const response = await putEncaissement(encaissementData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Fonction utilitaire pour générer un NumLigne temporaire
// Au début du fichier, en dehors du slice
let sessionCounter = 1;

const generateTempNumLigne = (state) => {
  const tempPrefix = "TEMP_";
  const timestamp = Date.now();
  let tempId;

  do {
    tempId = `${tempPrefix}${timestamp}_${sessionCounter}`;
    sessionCounter++;
  } while (state.encaissements.some((item) => item.NumLigne === tempId));

  return tempId;
};

// Créer le slice Redux
const encaissementSlice = createSlice({
  name: "encaissement",
  initialState: {
    encaissements: [],
    bills: [],
    currentEncaissements: null,
    // Utiliser des états de loading et error spécifiques pour chaque opération
    billsLoading: false,
    billsError: null,
    encaissementsLoading: false,
    encaissementsError: null,
    submitLoading: false,
    submitError: null,
    deleteLoading: false,
    deleteError: null,
    success: false,
  },
  reducers: {
    resetEncaissementState: (state) => {
      state.currentEncaissements = null;
      state.encaissementsLoading = false;
      state.encaissementsError = null;
      state.submitLoading = false;
      state.submitError = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase("encaissement/connection/checkStarted", (state) => {
        state.submitLoading = true;
        state.deleteLoading = true;
      })
      .addCase("encaissement/connection/checkStartedForOthers", (state) => {
        state.encaissementsLoading = true;
      })

      // === ACTIONS OFFLINE POUR CRÉATION ===
      // .addCase(
      //   "encaissement/addEncaissement/offline",
      //   (state, action) => {
      //     const newEncaissement = {
      //       ...action.payload,
      //       NumLigne: generateTempNumLigne(state),
      //       isOffline: true,
      //       offlineStatus: "pending",
      //     };

      //     state.encaissements.push(newEncaissement);
      //     state.submitLoading = false;
      //     state.success = true;
      //     state.submitError = null;
      //     state.currentEncaissements = newEncaissement;
      //   }
      // // )
      // .addCase(
      //   "encaissement/addEncaissement/offlineQueued",
      //   (state, action) => {
      //     // Vérifier d'abord s'il existe déjà un encaissement similaire
      //     const existingOffline = state.encaissements.find(
      //       (item) =>
      //         item.isOffline &&
      //         item.Client === action.payload.Client &&
      //         item.Commercial === action.payload.Commercial &&
      //         item.DateEncaissement === action.payload.DateEncaissement &&
      //         item.Montant === action.payload.Montant &&
      //         item.ModePaiement === action.payload.ModePaiement
      //     );

      //     // Si pas de doublon, créer le nouvel encaissement
      //     if (!existingOffline) {
      //       const newEncaissement = {
      //         ...action.payload,
      //         NumLigne: generateTempNumLigne(state),
      //         isOffline: true,
      //         offlineStatus: "pending",
      //       };

      //       state.encaissements.push(newEncaissement);
      //       state.currentEncaissements = newEncaissement;
      //     }

      //     state.submitLoading = false;
      //     state.success = true;
      //     state.submitError = null;
      //   }
      // )

      // // === ACTIONS OFFLINE POUR MODIFICATION ===
      // .addCase(
      //   "encaissement/modifyEncaissement/offlineQueued",
      //   (state, action) => {
      //     const modifiedData = action.payload;
      //     const index = state.encaissements.findIndex(
      //       (item) =>
      //         item.Client === modifiedData.Client &&
      //         item.Commercial === modifiedData.Commercial &&
      //         item.NumLigne === modifiedData.NumLigne
      //     );

      //     if (index !== -1) {
      //       const existingItem = state.encaissements[index];

      //       // Cas 1: Encaissement créé offline (NumLigne temporaire)
      //       if (existingItem.NumLigne.toString().startsWith("TEMP_")) {
      //         // Juste mettre à jour les données sans changer le statut offline
      //         state.encaissements[index] = {
      //           ...existingItem,
      //           ...modifiedData,
      //           // Garder les propriétés offline existantes
      //           isOffline: true,
      //           offlineStatus: existingItem.offlineStatus || "pending",
      //         };
      //       } else {
      //         // Cas 2: Encaissement synchronisé - le marquer comme modifié
      //         state.encaissements[index] = {
      //           ...existingItem,
      //           ...modifiedData,
      //           isOffline: true,
      //           offlineStatus: "modified",
      //         };
      //       }
      //     }

      //     state.submitLoading = false;
      //     state.success = true;
      //     state.submitError = null;
      //   }
      // )

      // // === ACTIONS OFFLINE POUR SUPPRESSION ===
      // .addCase(
      //   "encaissement/deleteEncaissement/offlineQueued",
      //   (state, action) => {
      //     const { client, commercial, numLigne } = action.payload;
      //     const index = state.encaissements.findIndex(
      //       (item) =>
      //         item.Client === client &&
      //         item.Commercial === commercial &&
      //         item.NumLigne === numLigne
      //     );

      //     if (index !== -1) {
      //       const existingItem = state.encaissements[index];

      //       // Si l'encaissement était créé en offline (NumLigne temporaire), le supprimer définitivement
      //       if (existingItem.NumLigne.toString().startsWith("TEMP_")) {
      //         state.encaissements.splice(index, 1);
      //       } else {
      //         // Sinon, le marquer comme supprimé en offline
      //         state.encaissements[index] = {
      //           ...existingItem,
      //           isOffline: true,
      //           offlineStatus: "deleted",
      //           isDeleted: true,
      //         };
      //       }
      //     }

      //     state.deleteLoading = false;
      //     state.deleteError = null;
      //   }
      // )

      // === ACTIONS ONLINE NORMALES ===
      // Cas pour la création d'un encaissement
      .addCase(addEncaissement.pending, (state) => {
        state.submitLoading = true;
        state.submitError = null;
        state.success = false;
      })
      .addCase(addEncaissement.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.currentEncaissements = action.payload;
        state.success = true;
      })
      .addCase(addEncaissement.rejected, (state, action) => {
        state.submitLoading = false;
        state.submitError = action.payload;
        state.success = false;
      })

      // Cas pour la récupération des factures
      .addCase(getBills.pending, (state) => {
        state.billsLoading = true;
        state.billsError = null;
      })
      .addCase(getBills.fulfilled, (state, action) => {
        state.billsLoading = false;
        state.bills = action.payload;
      })
      .addCase(getBills.rejected, (state, action) => {
        state.billsLoading = false;
        state.billsError = action.payload;
      })

      // Cas pour la récupération des encaissements
      .addCase(getEncaissment.pending, (state) => {
        state.encaissementsLoading = true;
        state.encaissementsError = null;
      })
      .addCase(getEncaissment.fulfilled, (state, action) => {
        state.encaissementsLoading = false;
        state.encaissements = action.payload;
      })
      .addCase(getEncaissment.rejected, (state, action) => {
        state.encaissementsLoading = false;
        state.encaissementsError = action.payload;
      })

      // Cas pour la suppression d'un encaissement
      .addCase(deleteEncaissement.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
      })
      .addCase(deleteEncaissement.fulfilled, (state, action) => {
        state.deleteLoading = false;
        // Filtrer l'encaissement supprimé de la liste
        // state.encaissements = state.encaissements.filter(
        //   (item) => item.NumLigne !== action.payload.numLigne
        // );
      })
      .addCase(deleteEncaissement.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload;
      })

      // Cas pour la modification d'un encaissement
      .addCase(modifyEncaissement.pending, (state) => {
        state.submitLoading = true;
        state.submitError = null;
        state.success = false;
      })
      .addCase(modifyEncaissement.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.success = true;
      })
      .addCase(modifyEncaissement.rejected, (state, action) => {
        state.submitLoading = false;
        state.submitError = action.payload;
        state.success = false;
      });
  },
});

export const { resetEncaissementState } = encaissementSlice.actions;
export default encaissementSlice.reducer;
