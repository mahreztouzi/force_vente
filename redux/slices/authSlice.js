import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { authenticateUser, loadUserService } from "../../services/sign.service";

export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      // Authentifier l'utilisateur avec ses identifiants
      const response = await authenticateUser(email, password);

      // Vérifier si la réponse existe et si l'utilisateur a un magasin
      if (response && response.magasin) {
        const userData = {
          code: response?.code,
          user: {
            fullName: response.nom_complet,
            code: response.code,
            montant: response.montant,
            magasin: response.magasin,
            grp: response.grp_vendeur,
          },
          credentials: {
            username: email,
            password: password,
          },
        };

        // Sauvegarder les données utilisateur et les identifiants
        await AsyncStorage.setItem("userData", JSON.stringify(userData));
        await SecureStore.setItemAsync("username", email);
        await SecureStore.setItemAsync("password", password);

        return userData;
      } else {
        throw new Error(
          "Accès refusé : Accès réservé aux commerciaux uniquement"
        );
      }
    } catch (error) {
      return rejectWithValue(error.message || "Erreur de connexion");
    }
  }
);

export const loadUser = createAsyncThunk(
  "auth/loadUser",
  async ({ user }, { rejectWithValue }) => {
    try {
      // Authentifier l'utilisateur avec ses identifiants
      const response = await loadUserService(user);
      const userData = {
        code: response?.code,
        user: {
          fullName: response.nom_complet,
          code: response.code,
          montant: response.montant,
          magasin: response.magasin,
          magasin_quota: response.magasin_quota,
          grp: response.grp_vendeur,
        },
      };

      return userData;
    } catch (error) {
      return rejectWithValue(error.message || "Erreur de connexion");
    }
  }
);

// Vérifier si l'utilisateur est déjà connecté au démarrage
export const checkUserLoggedIn = createAsyncThunk(
  "auth/checkUser",
  async (_, { rejectWithValue }) => {
    try {
      // Vérifier AsyncStorage pour les données utilisateur
      const userData = await AsyncStorage.getItem("userData");
      const username = await SecureStore.getItemAsync("username");
      const password = await SecureStore.getItemAsync("password");

      if (userData && username && password) {
        const parsedData = JSON.parse(userData);

        return parsedData;
      }

      return rejectWithValue("Aucun utilisateur trouvé");
    } catch (error) {
      return rejectWithValue("Erreur lors de la vérification de la session");
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await AsyncStorage.removeItem("userData");
      await SecureStore.deleteItemAsync("username");
      await SecureStore.deleteItemAsync("password");
      return true;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: null,
    user: null,
    credentials: null,
    loading: false,
    error: null,
    isAuthenticated: false,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    // Reducer pour réinitialiser l'état si nécessaire
    resetAuth: (state) => {
      state.user = null;
      state.credentials = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.code;
        state.user = action.payload.user;
        state.credentials = action.payload.credentials;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
        state.credentials = null;
      })
      // loaduser
      .addCase(loadUser.pending, (state) => {})
      .addCase(loadUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
      })
      .addCase(loadUser.rejected, (state, action) => {})
      // Check user logged in
      .addCase(checkUserLoggedIn.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkUserLoggedIn.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.credentials = action.payload.credentials;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(checkUserLoggedIn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
        state.credentials = null;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.credentials = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      });
  },
});

export const { clearError, resetAuth } = authSlice.actions;
export default authSlice.reducer;
