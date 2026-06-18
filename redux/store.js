// src/redux/store.js
// import { configureStore } from "@reduxjs/toolkit";
// import authReducer from "./slices/authSlice";
// import clientReducer from "./slices/clientSlice";
// import articleReducer from "./slices/articleSlice";
// import orderReducer from "./slices/orderSlice";
// import outboundReducer from "./slices/outboundSlice";
// import billReducer from "./slices/billSlice";
// import goodReceiptReducer from "./slices/goodReceiptSlice";
// import stockReducer from "./slices/stockSlice";
// import DocumentReducer from "./slices/documentSlice";
// import EncaissementReducer from "./slices/encaissementSlice";
// import offlineReducer from "./slices/offlineSlice";

// export const store = configureStore({
//   reducer: {
//     offline: offlineReducer,
//     auth: authReducer,
//     clients: clientReducer,
//     articles: articleReducer,
//     orders: orderReducer,
//     outbounds: outboundReducer,
//     bills: billReducer,
//     goodReceipt: goodReceiptReducer,
//     stock: stockReducer,
//     document: DocumentReducer,
//     encaissement: EncaissementReducer,
//   },
// });

// // src/redux/store.js
// import { configureStore, combineReducers } from "@reduxjs/toolkit";
// import { persistStore, persistReducer } from "redux-persist";
// import AsyncStorage from "@react-native-async-storage/async-storage";

// // Importation des reducers
// import authReducer from "./slices/authSlice";
// import clientReducer from "./slices/clientSlice";
// import articleReducer from "./slices/articleSlice";
// import orderReducer from "./slices/orderSlice";
// import outboundReducer from "./slices/outboundSlice";
// import billReducer from "./slices/billSlice";
// import goodReceiptReducer from "./slices/goodReceiptSlice";
// import stockReducer from "./slices/stockSlice";
// import DocumentReducer from "./slices/documentSlice";
// import EncaissementReducer from "./slices/encaissementSlice";
// import quotationReducer from "./slices/quotationSlice";
// import offlineReducer from "./slices/offlineSlice";
// import offlineMiddleware from "./offlineMiddleware";
// import processDeliveryReducer from "./slices/processDeliverySlice";

// // Polyfill pour crypto.getRandomValues si nécessaire
// import "react-native-get-random-values";

// // Configuration de Redux Persist
// const persistConfig = {
//   key: "root",
//   storage: AsyncStorage,
//   // Spécifier quels reducers persister
//   whitelist: [
//     "auth",
//     "clients",
//     "articles",
//     "stock",
//     "offline",
//     "orders",
//     "document",
//     "goodReceipt",
//     "outbounds",
//     "bills",
//     "encaissement",
//     "Quotations",
//   ],
//   // Debug pour voir les logs
//   debug: __DEV__,
// };

// // Combiner tous les reducers
// const rootReducer = combineReducers({
//   offline: offlineReducer,
//   auth: authReducer,
//   clients: clientReducer,
//   articles: articleReducer,
//   orders: orderReducer,
//   outbounds: outboundReducer,
//   bills: billReducer,
//   goodReceipt: goodReceiptReducer,
//   stock: stockReducer,
//   document: DocumentReducer,
//   encaissement: EncaissementReducer,
//   Quotations: quotationReducer,
//   deliveries: processDeliveryReducer,
// });

// // Création du reducer persistant
// const persistedReducer = persistReducer(persistConfig, rootReducer);

// // Configuration du store avec le reducer persistant
// export const store = configureStore({
//   reducer: persistedReducer,
//   middleware: (getDefaultMiddleware) =>
//     getDefaultMiddleware({
//       immutableCheck: false,
//       serializableCheck: false,
//     }).concat(offlineMiddleware),
// });

// // Création du persistor pour la réhydratation
// export const persistor = persistStore(store);

// 1. D'abord, modifiez votre rootReducer pour gérer une action RESET
// Dans votre fichier store/index.js

import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Importation des reducers
import authReducer from "./slices/authSlice";
import clientReducer from "./slices/clientSlice";
import articleReducer from "./slices/articleSlice";
import orderReducer from "./slices/orderSlice";
import outboundReducer from "./slices/outboundSlice";
import billReducer from "./slices/billSlice";
import goodReceiptReducer from "./slices/goodReceiptSlice";
import stockReducer from "./slices/stockSlice";
import DocumentReducer from "./slices/documentSlice";
import EncaissementReducer from "./slices/encaissementSlice";
import quotationReducer from "./slices/quotationSlice";
import offlineReducer from "./slices/offlineSlice";
import offlineMiddleware from "./offlineMiddleware";
import processDeliveryReducer from "./slices/processDeliverySlice";

import "react-native-get-random-values";

// Configuration de Redux Persist
const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  whitelist: [
    "auth",
    "clients",
    "articles",
    "stock",
    "offline",
    "orders",
    "document",
    "goodReceipt",
    "outbounds",
    "bills",
    "encaissement",
    "Quotations",
  ],
  debug: __DEV__,
};

// Combiner tous les reducers
const appReducer = combineReducers({
  offline: offlineReducer,
  auth: authReducer,
  clients: clientReducer,
  articles: articleReducer,
  orders: orderReducer,
  outbounds: outboundReducer,
  bills: billReducer,
  goodReceipt: goodReceiptReducer,
  stock: stockReducer,
  document: DocumentReducer,
  encaissement: EncaissementReducer,
  Quotations: quotationReducer,
  deliveries: processDeliveryReducer,
});

// Root reducer qui gère l'action RESET
const rootReducer = (state, action) => {
  if (action.type === "RESET_ALL") {
    // Retourner undefined force Redux à utiliser l'état initial
    state = undefined;
  }
  return appReducer(state, action);
};

// Création du reducer persistant
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configuration du store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      immutableCheck: false,
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(offlineMiddleware),
});

export const persistor = persistStore(store);

// Action pour réinitialiser tout le store
export const resetAll = () => ({
  type: "RESET_ALL",
});
