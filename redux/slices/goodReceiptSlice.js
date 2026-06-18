// src/redux/slices/goodReceiptSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  creatGoodReceipt,
  fetchTransfert,
} from "../../services/transfertService";
import { isConnected } from "../../utils/offlineUtils";

// Actions pour gérer les états de connexion
export const connectionCheckStarted = () => ({
  type: "goodReceipts/connection/checkStarted",
});
export const connectionCheckStartedForOthers = () => ({
  type: "goodReceipts/connection/checkStartedForOthers",
});

// Thunk pour créer une reception 315
export const addGoodReceipt = createAsyncThunk(
  "goodReceipts/addGoodReceipt",
  async (goodReceiptData, { rejectWithValue, dispatch }) => {
    try {
      dispatch(connectionCheckStarted());
      const isFullyConnected = await isConnected();
      if (!isFullyConnected) {
        // Rejeter avec une erreur spécifique pour la déconnexion
        return rejectWithValue("Pas de connexion Internet");
      }

      const response = await creatGoodReceipt(goodReceiptData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk pour récupérer les transferts
export const getTransfertDocument = createAsyncThunk(
  "transferts/getTransfertDocument",
  async ({ magasin }, { rejectWithValue, getState, dispatch }) => {
    try {
      dispatch(connectionCheckStartedForOthers());
      const isFullyConnected = await isConnected();
      if (!isFullyConnected) {
        const cached = getState().goodReceipt.transferts;
        return cached;
      }
      const transferts = await fetchTransfert(magasin);
      return transferts;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Créer le slice Redux
const goodReceiptSlice = createSlice({
  name: "goodReceipts",
  initialState: {
    goodReceipts: [],
    transferts: [],
    currentGoodReceipt: null,
    loading: false,
    loadingTransfert: false,
    error: null,
    success: false,
    successListTransfert: false,
    errorListTransfert: null,
  },
  reducers: {
    resetGoodReceiptState: (state) => {
      // Reset tous les états
      state.loading = false;
      state.loadingTransfert = false;
      state.error = null;
      state.success = false;
      state.errorListTransfert = null;
      state.successListTransfert = false;
    },
    // Nouveau reducer pour reset seulement les états de création
    resetCreationState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
    // Nouveau reducer pour reset seulement les états de liste
    resetListState: (state) => {
      state.loadingTransfert = false;
      state.errorListTransfert = null;
      state.successListTransfert = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Actions de connexion
      .addCase("goodReceipts/connection/checkStarted", (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase("goodReceipts/connection/checkStartedForOthers", (state) => {
        state.loadingTransfert = true;
        state.errorListTransfert = null;
      })

      // Cas pour la création d'une reception
      .addCase(addGoodReceipt.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(addGoodReceipt.fulfilled, (state, action) => {
        state.loading = false;
        state.currentGoodReceipt = action.payload;
        state.success = true;
        state.error = null;
      })
      .addCase(addGoodReceipt.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })

      // Cas pour la récupération des transferts
      .addCase(getTransfertDocument.pending, (state) => {
        state.loadingTransfert = true;
        state.errorListTransfert = null;
        state.successListTransfert = false;
      })
      .addCase(getTransfertDocument.fulfilled, (state, action) => {
        state.loadingTransfert = false;
        state.currentGoodReceipt = action.payload;
        state.transferts = action.payload;
        state.successListTransfert = true;
        state.errorListTransfert = null;
      })
      .addCase(getTransfertDocument.rejected, (state, action) => {
        state.loadingTransfert = false;
        state.errorListTransfert = action.payload;
        state.successListTransfert = false;
      });
  },
});

export const { resetGoodReceiptState, resetCreationState, resetListState } =
  goodReceiptSlice.actions;
export default goodReceiptSlice.reducer;
