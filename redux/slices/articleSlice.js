// src/redux/slices/articleslice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchArticle } from "../../services/articleService";
import { isConnected } from "../../utils/offlineUtils";

export const connectionCheckStarted = () => ({
  type: "articles/connection/checkStarted",
});

// Créer un thunk pour récupérer les articles
export const getArticles = createAsyncThunk(
  "articles/getArticles",
  async (_, { rejectWithValue, getState, dispatch }) => {
    try {
      dispatch(connectionCheckStarted());
      const isFullyConnected = await isConnected();

      // If offline, try to use cached data from the store
      if (!isFullyConnected) {
        // Return cached data if available
        const cached = getState().articles.articles;
        const sortedArticles = [...cached].sort((a, b) => b.prix - a.prix);
        return sortedArticles;
      }

      const articles = await fetchArticle(); // Appeler la fonction du service
      // return articles;
      // Trier les articles par prix (du plus cher daksser)
      const sortedArticles = [...articles].sort((a, b) => b.prix - a.prix);

      return sortedArticles;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Créer le slice Redux
const articleSlice = createSlice({
  name: "articles",
  initialState: {
    articles: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase("articles/connection/checkStarted", (state) => {
        state.loading = true;
      })
      .addCase(getArticles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getArticles.fulfilled, (state, action) => {
        state.loading = false;
        state.articles = action.payload; // Stocker les articles dans l'état
      })
      .addCase(getArticles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message; // Gérer l'erreur
      });
  },
});

export default articleSlice.reducer;
