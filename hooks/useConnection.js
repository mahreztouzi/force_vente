// src/hooks/useConnection.js
import { useState, useCallback, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  checkAndUpdateConnectionStatus,
  syncOfflineData,
} from "../redux/offlineActions/offlineActions";
import { fetchPendingActionsCount } from "../redux/slices/offlineSlice";

const useConnection = () => {
  const dispatch = useDispatch();
  const [isConnecting, setIsConnecting] = useState(false);

  // Récupérer l'état de connexion depuis le store Redux
  const {
    isConnected,
    isServerReachable,
    syncStatus,
    pendingActions,
    lastCheck,
  } = useSelector((state) => state.offline);

  // Vérifier la connexion au réseau et au serveur
  const checkConnection = useCallback(async () => {
    try {
      await dispatch(checkAndUpdateConnectionStatus());
      return true;
    } catch (error) {
      console.error("Erreur lors de la vérification de la connexion:", error);
      return false;
    }
  }, [dispatch]);

  // Synchroniser les données en attente
  const handleSync = useCallback(async () => {
    if (!isConnected || !isServerReachable) {
      console.log("Impossible de synchroniser: pas de connexion");
      return false;
    }

    setIsConnecting(true);
    try {
      await dispatch(syncOfflineData());
      // Rafraîchir le compteur d'actions en attente
      await dispatch(fetchPendingActionsCount());
      return true;
    } catch (error) {
      console.error("Erreur lors de la synchronisation:", error);
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [dispatch, isConnected, isServerReachable]);

  // Récupérer périodiquement le nombre d'actions en attente
  useEffect(() => {
    const getPendingActions = async () => {
      await dispatch(fetchPendingActionsCount());
    };

    // Appel immédiat
    getPendingActions();

    // Puis toutes les minutes
    const interval = setInterval(getPendingActions, 60000);

    return () => clearInterval(interval);
  }, [dispatch]);

  return {
    // État de la connexion
    isConnected: isConnected && isServerReachable,
    networkConnected: isConnected, // Juste la connexion réseau
    serverReachable: isServerReachable, // Le serveur SAP est-il accessible
    isConnecting, // En cours de synchronisation
    syncStatus, // Statut de la dernière synchro
    pendingActions, // Nombre d'actions en attente
    lastCheck, // Dernière vérification de la connexion

    // Fonctions utiles
    checkConnection, // Vérifier manuellement la connexion
    handleSync, // Synchroniser manuellement
  };
};

export default useConnection;
