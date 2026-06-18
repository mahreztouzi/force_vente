// src/redux/slices/clientSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchClientEtat, fetchClients } from "../../services/clientService"; // Importer la fonction du service
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isConnected } from "../../utils/offlineUtils";

export const connectionCheckStarted = () => ({
  type: "clients/connection/checkStarted",
});

// Créer un thunk pour récupérer les clients
export const getClients = createAsyncThunk(
  "clients/getClients",
  async ({ grpVendeur }, { getState, dispatch }) => {
    console.log("groupe de vendeur", grpVendeur);
    dispatch(connectionCheckStarted());
    const isFullyConnected = await isConnected();

    // If offline, try to use cached data from the store
    if (!isFullyConnected) {
      const cached = getState().clients.clients;
      return cached;
    }
    const clients = await fetchClients(grpVendeur);
    console.log("groupe de vendeur", grpVendeur, clients);
    return clients;
  }
);

// Charger les favoris depuis AsyncStorage
export const loadFavorites = createAsyncThunk(
  "clients/loadFavorites",
  async () => {
    try {
      const favoritesJson = await AsyncStorage.getItem("clientFavorites");
      return favoritesJson ? JSON.parse(favoritesJson) : [];
    } catch (error) {
      console.error("Erreur lors du chargement des favoris:", error);
      return [];
    }
  }
);

// Ajouter/supprimer un client des favoris
export const toggleFavorite = createAsyncThunk(
  "clients/toggleFavorite",
  async (clientId, { getState }) => {
    try {
      const { clients } = getState();
      const newFavorites = [...clients.favorites];

      const index = newFavorites.indexOf(clientId);
      if (index === -1) {
        // Ajouter aux favoris
        newFavorites.push(clientId);
      } else {
        // Retirer des favoris
        newFavorites.splice(index, 1);
      }

      // Sauvegarder dans AsyncStorage
      await AsyncStorage.setItem(
        "clientFavorites",
        JSON.stringify(newFavorites)
      );

      return newFavorites;
    } catch (error) {
      console.error("Erreur lors de la modification des favoris:", error);
      return getState().clients.favorites;
    }
  }
);

// Thunk pour récupérer l'état des clients
export const getClientEtat = createAsyncThunk(
  "clientEtat/getClientEtat",
  async ({ codeUtilisateur }, { getState, dispatch }) => {
    dispatch(connectionCheckStarted());
    const isFullyConnected = await isConnected();

    // Si hors ligne, utiliser les données en cache
    if (!isFullyConnected) {
      const cached = getState().clients.clientsEtat;
      return cached;
    }
    const clientsEtat = await fetchClientEtat(codeUtilisateur);
    console.log("État des clients:", clientsEtat);
    return clientsEtat;
  }
);

// Créer le slice Redux
const clientSlice = createSlice({
  name: "clients",
  initialState: {
    clients: [],
    favorites: [],
    clientsEtat: [],
    loadingEtat: false,
    errorEtat: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase("clients/connection/checkStarted", (state) => {
        state.loading = true;
      })
      .addCase(getClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getClients.fulfilled, (state, action) => {
        state.loading = false;
        state.clients = action.payload; // Stocker les clients dans l'état
      })
      .addCase(getClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message; // Gérer l'erreur
      });
    builder.addCase(loadFavorites.fulfilled, (state, action) => {
      state.favorites = action.payload;
    });

    builder.addCase(toggleFavorite.fulfilled, (state, action) => {
      state.favorites = action.payload;
    });
    builder
      .addCase("clientEtat/connection/checkStarted", (state) => {
        state.loadingEtat = true;
      })
      .addCase(getClientEtat.pending, (state) => {
        state.loadingEtat = true;
        state.errorEtat = null;
      })
      .addCase(getClientEtat.fulfilled, (state, action) => {
        state.loadingEtat = false;
        state.clientsEtat = action.payload;
      })
      .addCase(getClientEtat.rejected, (state, action) => {
        state.loadingEtat = false;
        state.errorEtat = action.error.message;
      });
  },
});
export default clientSlice.reducer;
