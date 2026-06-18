import {
  createSlice,
  createAsyncThunk,
  createAction,
  current,
} from "@reduxjs/toolkit";
import {
  addQuotationItemService,
  createQuotation,
  createQuotationReturn,
  deleteQuotationItemService,
  fetchQuotations,
  fetchQuotationsApprouve,
  updateQuotationItemService,
} from "../../services/quotationService";
import {
  getStoredConnectionStatus,
  isConnected,
} from "../../utils/offlineUtils";

// Actions synchrones pour indiquer que la vérification de connexion est en cours
export const connectionCheckStarted = createAction(
  "Quotations/connection/checkStarted"
);
export const connectionCheckStartedForOthers = createAction(
  "Quotations/connection/checkStartedForOthers"
);

// Thunk pour créer une commande
export const addQuotation = createAsyncThunk(
  "Quotations/addQuotation",
  async (QuotationData, { rejectWithValue, getState, dispatch }) => {
    try {
      const bypassQueue = !!QuotationData.meta?.bypassOfflineQueue;

      console.log(
        `[Quotation] Création d'une commande${
          bypassQueue ? " (bypass queue)" : ""
        }:`,
        QuotationData,
        bypassQueue
      );

      dispatch(connectionCheckStarted());
      const isFullyConnected = await isConnected();

      if (!isFullyConnected && !bypassQueue) {
        return;
      }

      const response = await createQuotation(QuotationData);
      return response;
    } catch (error) {
      console.error(
        "[Quotation] Erreur lors de la création de la commande:",
        error
      );
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Thunk pour créer une commande retour
export const addQuotationReturn = createAsyncThunk(
  "Quotations/addQuotationReturn",
  async (QuotationData, { rejectWithValue, dispatch }) => {
    try {
      dispatch(connectionCheckStarted());
      const isFullyConnected = await isConnected();

      if (!isFullyConnected) {
        // dispatch(addQuotationReturnOfflineQueued(QuotationData));
        return { offline: true, data: QuotationData };
      }

      const Quotation = await createQuotationReturn(QuotationData);
      return Quotation;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk pour récupérer les commandes
export const getQuotations = createAsyncThunk(
  "Quotations/getQuotations",
  async (_, { rejectWithValue }) => {
    try {
      const Quotations = await fetchQuotations();
      return Quotations;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk pour récupérer les offres approuvées
export const getQuotationsApprouve = createAsyncThunk(
  "Quotations/getQuotationsApprouve",
  async (
    { user, dateDebut, dateFin },
    { rejectWithValue, getState, dispatch }
  ) => {
    try {
      dispatch(connectionCheckStarted());
      const isFullyConnected = await isConnected();

      if (!isFullyConnected) {
        const cachedQuotationsApprouve =
          getState().Quotations.QuotationsApprouve;
        return cachedQuotationsApprouve;
      }

      const QuotationsApprouve = await fetchQuotationsApprouve(
        user,
        dateDebut,
        dateFin
      );
      return QuotationsApprouve;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk pour la suppression d'une commande item
export const deleteQuotationItem = createAsyncThunk(
  "Quotations/deleteQuotationItem",
  async ({ commande, itemNumber }, { rejectWithValue, dispatch }) => {
    try {
      dispatch(connectionCheckStartedForOthers());
      const isFullyConnected = await isConnected();

      if (!isFullyConnected) {
        // dispatch(deleteQuotationItemOfflineQueued({ commande, itemNumber }));
        return { offline: true, data: { commande, itemNumber } };
      }

      const response = await deleteQuotationItemService(commande, itemNumber);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk pour la modification d'un article item
export const updateQuotationItem = createAsyncThunk(
  "Quotations/updateQuotationItem",
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

      const response = await updateQuotationItemService(
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
export const addQuotationItem = createAsyncThunk(
  "Quotations/addQuotationItem",
  async ({ commande, article, qte }, { rejectWithValue, dispatch }) => {
    try {
      dispatch(connectionCheckStartedForOthers());
      const isFullyConnected = await isConnected();

      if (!isFullyConnected) {
        // dispatch(addQuotationItemOfflineQueued({ commande, article, qte }));
        return { offline: true, data: { commande, article, qte } };
      }

      const response = await addQuotationItemService(commande, article, qte);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Créer le slice Redux
const QuotationSlice = createSlice({
  name: "Quotations",
  initialState: {
    Quotations: [],
    QuotationsApprouve: [],
    currentQuotation: null,
    loading: false,
    loadingQuotationsApprouve: false,
    errorQuotationsApprouve: null,
    successQuotationsApprouve: false,
    error: null,
    success: false,
    successOffline: false,
    deleteLoading: false,
    deleteError: null,
    deleteSuccess: false,
  },
  reducers: {
    resetQuotationState: (state) => {
      state.currentQuotation = null;
      state.loading = false;
      state.error = null;
      state.success = false;
      state.loadingQuotationsApprouve = false;
      state.errorQuotationsApprouve = null;
      state.successQuotationsApprouve = false;
      state.successOffline = false;
      state.deleteError = null;
      state.deleteLoading = false;
      state.deleteSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // === ACTIONS DE CONNECTION ===
      .addCase(connectionCheckStarted, (state) => {
        state.loading = true;
        state.loadingQuotationsApprouve = true;
        state.deleteLoading = true;
      })
      .addCase(connectionCheckStartedForOthers, (state) => {
        state.deleteLoading = true;
      })

      // === ACTIONS ONLINE NORMALES ===
      .addCase(addQuotation.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
        state.successOffline = false;
      })
      .addCase(addQuotation.fulfilled, (state, action) => {
        state.loading = false;
        state.currentQuotation = action.payload;
        state.success = true;
      })
      .addCase(addQuotation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
        state.successOffline = false;
      })

      // Cas pour la récupération des commandes
      .addCase(getQuotations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getQuotations.fulfilled, (state, action) => {
        state.loading = false;
        state.Quotations = action.payload;
      })
      .addCase(getQuotations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Cas pour la récupération des commandes approuvées
      .addCase(getQuotationsApprouve.pending, (state) => {
        state.loadingQuotationsApprouve = true;
        state.errorQuotationsApprouve = null;
      })
      .addCase(getQuotationsApprouve.fulfilled, (state, action) => {
        state.loadingQuotationsApprouve = false;
        state.deleteLoading = false;
        // Garder la structure plate - pas de groupement
        state.QuotationsApprouve = action.payload;
      })
      .addCase(getQuotationsApprouve.rejected, (state, action) => {
        state.loadingQuotationsApprouve = false;
        state.errorQuotationsApprouve = action.payload;
      })

      // Cas pour la suppression d'un article commande
      .addCase(deleteQuotationItem.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
        state.deleteSuccess = false;
      })
      .addCase(deleteQuotationItem.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.deleteSuccess = !action.payload.offline;
      })
      .addCase(deleteQuotationItem.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload;
        state.deleteSuccess = false;
      })

      // Cas pour la modification d'un article
      .addCase(updateQuotationItem.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
        state.deleteSuccess = false;
      })
      .addCase(updateQuotationItem.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.deleteSuccess = !action.payload.offline;
      })
      .addCase(updateQuotationItem.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload;
        state.deleteSuccess = false;
      })

      // Cas pour ajouter un nouvel article
      .addCase(addQuotationItem.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
        state.deleteSuccess = false;
      })
      .addCase(addQuotationItem.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.deleteSuccess = !action.payload.offline;
      })
      .addCase(addQuotationItem.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload;
        state.deleteSuccess = false;
      });
  },
});

export const { resetQuotationState } = QuotationSlice.actions;
export default QuotationSlice.reducer;
