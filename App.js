import React, { useEffect } from "react";
import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useLoadedAssets } from "./hooks/useLoadedAssets";
import Navigation from "./navigation";
import { useColorScheme, ActivityIndicator, View } from "react-native";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store, persistor } from "./redux/store";
import { PersistGate } from "redux-persist/integration/react";
import { checkUserLoggedIn } from "./redux/slices/authSlice";
import ConnectionIndicator from "./components/ConnectionIndicator";
import {
  checkAndUpdateConnectionStatus,
  syncOfflineData,
} from "./redux/offlineActions/offlineActions";
import NetInfo from "@react-native-community/netinfo";
import ConnectionListener from "./components/ConnectionLister";
import ConnectionManager from "./components/ConnectionLister";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Composant de chargement à afficher pendant la réhydratation
const LoadingView = () => (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    <ActivityIndicator size="large" color="#0000ff" />
  </View>
);

// Contenu principal de l'application
const AppContent = () => {
  const colorScheme = useColorScheme();
  const dispatch = useDispatch();
  const { isConnected, isServerReachable, pendingActions } = useSelector(
    (state) => state.offline,
  );

  return (
    <SafeAreaProvider>
      {/* <ConnectionIndicator /> */}

      <StatusBar />

      {/* <ConnectionListener /> */}
      <Navigation colorScheme={colorScheme} />
      {/* <ConnectionManager /> */}
    </SafeAreaProvider>
  );
};

export default function App() {
  const isLoadingComplete = useLoadedAssets();

  if (!isLoadingComplete) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        {/* PersistGate attend que le state Redux soit rechargé avant d'afficher l'app */}
        <PersistGate loading={<LoadingView />} persistor={persistor}>
          <AppContent />
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}
