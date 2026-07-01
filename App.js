// import React, { useEffect, useState } from "react";
// import { I18nManager } from "react-native";
// import "react-native-gesture-handler";
// import { StatusBar } from "expo-status-bar";
// import { SafeAreaProvider } from "react-native-safe-area-context";
// import { useLoadedAssets } from "./hooks/useLoadedAssets";
// import Navigation from "./navigation";
// import { useColorScheme, ActivityIndicator, View } from "react-native";
// import { Provider, useDispatch, useSelector } from "react-redux";
// import { store, persistor } from "./redux/store";
// import { PersistGate } from "redux-persist/integration/react";
// import { checkUserLoggedIn } from "./redux/slices/authSlice";
// import ConnectionIndicator from "./components/ConnectionIndicator";
// import {
//   checkAndUpdateConnectionStatus,
//   syncOfflineData,
// } from "./redux/offlineActions/offlineActions";
// import NetInfo from "@react-native-community/netinfo";
// import ConnectionListener from "./components/ConnectionLister";
// import ConnectionManager from "./components/ConnectionLister";
// import { GestureHandlerRootView } from "react-native-gesture-handler";
// import { initI18n } from "./i18n";

// // Composant de chargement à afficher pendant la réhydratation
// const LoadingView = () => (
//   <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//     <ActivityIndicator size="large" color="#0000ff" />
//   </View>
// );

// // Contenu principal de l'application
// const AppContent = () => {
//   const colorScheme = useColorScheme();
//   const dispatch = useDispatch();
//   const { isConnected, isServerReachable, pendingActions } = useSelector(
//     (state) => state.offline,
//   );

//   return (
//     <SafeAreaProvider>
//       {/* <ConnectionIndicator /> */}

//       <StatusBar />

//       {/* <ConnectionListener /> */}
//       <Navigation colorScheme={colorScheme} />
//       {/* <ConnectionManager /> */}
//     </SafeAreaProvider>
//   );
// };

// export default function App() {
//   const isLoadingComplete = useLoadedAssets();
//   const [i18nReady, setI18nReady] = useState(false);

//   useEffect(() => {
//     initI18n().then(() => setI18nReady(true));
//   }, []);

//   if (!isLoadingComplete || !i18nReady) {
//     return null;
//   }

//   return (
//     <GestureHandlerRootView style={{ flex: 1 }}>
//       <Provider store={store}>
//         {/* PersistGate attend que le state Redux soit rechargé avant d'afficher l'app */}
//         <PersistGate loading={<LoadingView />} persistor={persistor}>
//           <AppContent />
//         </PersistGate>
//       </Provider>
//     </GestureHandlerRootView>
//   );
// }

import React, { useEffect, useState } from "react";
import {
  I18nManager,
  ActivityIndicator,
  View,
  useColorScheme,
} from "react-native";
import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useLoadedAssets } from "./hooks/useLoadedAssets";
import Navigation from "./navigation";
import { Provider, useSelector } from "react-redux";
import { store, persistor } from "./redux/store";
import { PersistGate } from "redux-persist/integration/react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { initI18n } from "./i18n";

const LoadingView = () => (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    <ActivityIndicator size="large" color="#0000ff" />
  </View>
);

const AppContent = () => {
  const colorScheme = useColorScheme();
  return (
    <SafeAreaProvider edges={["top", "bottom"]}>
      <StatusBar />
      <Navigation colorScheme={colorScheme} />
    </SafeAreaProvider>
  );
};

// ─── i18n initialisé ICI — au niveau module, avant tout render ───────────────
// On crée une promise qu'on attend avant d'afficher quoi que ce soit.
// forceRTL() sera appelé DANS initI18n(), avant que GestureHandlerRootView
// ne soit monté pour la première fois.
let i18nPromise = initI18n();

export default function App() {
  const isLoadingComplete = useLoadedAssets();
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    // On attend la promise déjà lancée — pas de double appel
    i18nPromise.then(() => setI18nReady(true));
  }, []);

  // Tant que les assets ou i18n ne sont pas prêts, on rend null
  // → GestureHandlerRootView n'est PAS encore monté
  // → forceRTL a le temps de s'appliquer avant le premier layout natif
  if (!isLoadingComplete || !i18nReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PersistGate loading={<LoadingView />} persistor={persistor}>
          <AppContent />
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}
