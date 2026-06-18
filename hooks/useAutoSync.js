// src/hooks/useAutoSync.js
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "react-native";
import {
  checkAndUpdateConnectionStatus,
  syncOfflineData,
} from "../redux/offlineActions/offlineActions";

// Hook pour gérer la synchronisation automatique des données
const useAutoSync = (autoSyncInterval = 5 * 60 * 1000) => {
  // 5 minutes par défaut
  const dispatch = useDispatch();
  const appStateRef = useRef(AppState.currentState);
  const timerRef = useRef(null);

  const isConnected = useSelector((state) => state.offline.isConnected);
  const pendingSyncCount = useSelector(
    (state) => state.offline.pendingSyncCount
  );
  const isSyncing = useSelector((state) => state.offline.isSyncing);

  // Fonction pour vérifier l'état de la connexion et synchroniser si nécessaire
  const checkAndSync = async () => {
    // Vérifier d'abord l'état de la connexion
    const connectionResult = await dispatch(
      checkAndUpdateConnectionStatus()
    ).unwrap();

    // Si connecté et qu'il y a des actions en attente, déclencher la synchronisation
    if (connectionResult && pendingSyncCount > 0 && !isSyncing) {
      dispatch(syncOfflineData());
    }
  };

  // Démarrer le timer de synchronisation
  const startSyncTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      checkAndSync();
    }, autoSyncInterval);
  };

  // Arrêter le timer de synchronisation
  const stopSyncTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Gérer les changements d'état de l'application
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // L'application revient au premier plan, vérifier la connexion et synchroniser
        checkAndSync();
        startSyncTimer();
      } else if (nextAppState.match(/inactive|background/)) {
        // L'application passe en arrière-plan, arrêter le timer
        stopSyncTimer();
      }

      appStateRef.current = nextAppState;
    };

    // Écouter les changements d'état de l'application
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    // Démarrer le timer lors du montage du hook
    checkAndSync();
    startSyncTimer();

    // Nettoyage lors du démontage
    return () => {
      subscription.remove();
      stopSyncTimer();
    };
  }, []);

  // Réagir aux changements d'état de connexion
  useEffect(() => {
    if (isConnected && pendingSyncCount > 0 && !isSyncing) {
      // Si on est connecté et qu'il y a des actions en attente, synchroniser
      dispatch(syncOfflineData());
    }
  }, [isConnected]);

  return {
    forceSync: () => dispatch(syncOfflineData()),
    checkConnection: () => dispatch(checkAndUpdateConnectionStatus()),
  };
};

export default useAutoSync;
