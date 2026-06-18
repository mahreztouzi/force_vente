// src/redux/slices/documentSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchStockArticle } from "../../services/stockService";

// Créer un thunk pour récupérer les stocks
export const getDocumentDetails = createAsyncThunk(
  "stocks/getDocumentDetails",
  async () => {
    const stocks = await fetchStockArticle(); // Appeler la fonction du service
    return stocks;
  }
);

// Créer le slice Redux
const documentSlice = createSlice({
  name: "stocks",
  initialState: {
    stocks: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getDocumentDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDocumentDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.stocks = action.payload; // Stocker les stocks dans l'état
      })
      .addCase(getDocumentDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message; // Gérer l'erreur
      });
  },
});

export default documentSlice.reducer;
