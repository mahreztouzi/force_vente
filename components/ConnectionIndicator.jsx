// src/components/ConnectionIndicator.js (version améliorée)
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch } from "react-redux";
import useConnection from "../hooks/useConnection";
import {
  fetchPendingActionsCount,
  resetSyncStatus,
} from "../redux/slices/offlineSlice";

const ConnectionIndicator = () => {
  const dispatch = useDispatch();
  const {
    isConnected,
    isConnecting,
    syncStatus,
    pendingActions,
    handleSync,
    checkConnection,
    networkConnected,
    serverReachable,
  } = useConnection();

  // État local pour le statut du test de connexion SAP
  const [isTestingSap, setIsTestingSap] = useState(false);
  // Indicateur si on est en train de tester périodiquement la connexion SAP
  const [isPolling, setIsPolling] = useState(false);
  // Référence pour stocker l'intervalle de polling
  const [pollingInterval, setPollingIntervalRef] = useState(null);
  // État local pour forcer le rendu si besoin
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Détermination de l'état de connexion
  const connectionState = !networkConnected
    ? "offline"
    : serverReachable
    ? "online"
    : "internet_only";

  // Rafraîchir les actions en attente périodiquement
  const refreshPendingActions = useCallback(() => {
    dispatch(fetchPendingActionsCount());
  }, [dispatch]);

  // Texte et couleur en fonction de l'état de la connexion
  const getStatusInfo = () => {
    switch (connectionState) {
      case "online":
        return { text: "En ligne (SAP connecté)", color: "#4CAF50" };
      case "internet_only":
        return { text: "Connecté (SAP non disponible)", color: "#FF9800" };
      case "offline":
        return { text: "Hors ligne", color: "#F44336" };
      default:
        return { text: "État inconnu", color: "#9E9E9E" };
    }
  };

  const statusInfo = getStatusInfo();

  // Force refresh pour s'assurer que le composant affiche toujours les données actuelles
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      refreshPendingActions();
      setRefreshTrigger((prev) => prev + 1);
    }, 10000); // Tous les 10 secondes

    return () => clearInterval(refreshInterval);
  }, [refreshPendingActions]);

  // Démarrer/arrêter le polling SAP quand on est connecté à internet mais pas à SAP
  useEffect(() => {
    if (networkConnected && !serverReachable && !pollingInterval) {
      // Démarrer le polling
      startSapPolling();
    } else if ((!networkConnected || serverReachable) && pollingInterval) {
      // Arrêter le polling si on n'a plus de connexion internet ou si SAP est accessible
      stopSapPolling();
    }
  }, [networkConnected, serverReachable]);

  // Nettoyage au démontage du composant
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Afficher une notification lorsque le statut de connexion change
  useEffect(() => {
    let timeout;
    if (syncStatus && syncStatus.message) {
      // Si synchronisation réussie, masquer le message après 5 secondes
      if (syncStatus.success) {
        timeout = setTimeout(() => {
          dispatch(resetSyncStatus());
        }, 5000);
      }
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [syncStatus, dispatch]);

  // Fonction pour démarrer le polling SAP (test tous les 15 secondes)
  const startSapPolling = () => {
    if (pollingInterval) return; // Éviter les doublons

    setIsPolling(true);
    const interval = setInterval(() => {
      setIsTestingSap(true);
      checkConnection().finally(() => {
        setIsTestingSap(false);
      });
    }, 15000); // 15 secondes

    setPollingIntervalRef(interval);
  };

  // Fonction pour arrêter le polling SAP
  const stopSapPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingIntervalRef(null);
      setIsPolling(false);
    }
  };

  // Tester manuellement la connexion
  const handleTestConnection = () => {
    setIsTestingSap(true);
    refreshPendingActions();
    checkConnection().finally(() => {
      setIsTestingSap(false);
    });
  };

  // Demander confirmation avant de synchroniser
  const confirmSync = () => {
    Alert.alert(
      "Synchronisation",
      `Vous avez ${pendingActions} action(s) en attente. Voulez-vous synchroniser maintenant ?`,
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Synchroniser",
          onPress: handleSync,
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        <View
          style={[styles.statusDot, { backgroundColor: statusInfo.color }]}
        />
        <Text style={styles.statusText}>
          {statusInfo.text}
          {isPolling && " (Test auto en cours)"}
        </Text>

        {pendingActions > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pendingActions}</Text>
          </View>
        )}
      </View>

      {!isConnected && pendingActions > 0 && (
        <Text style={styles.pendingText}>
          {pendingActions} action(s) en attente de synchronisation
        </Text>
      )}

      <View style={styles.actionButtonsContainer}>
        {/* Bouton pour tester manuellement la connexion */}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "#607D8B" }]}
          onPress={handleTestConnection}
          disabled={isTestingSap}
        >
          {isTestingSap ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="refresh" size={18} color="#FFFFFF" />
              <Text style={styles.buttonText}>Tester connexion</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Bouton pour synchroniser (visible si actions en attente) */}
        {pendingActions > 0 && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: isConnected ? "#2196F3" : "#9E9E9E",
                marginLeft: 8,
              },
            ]}
            onPress={confirmSync}
            disabled={isConnecting || !isConnected}
          >
            {isConnecting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="sync" size={18} color="#FFFFFF" />
                <Text style={styles.buttonText}>
                  {isConnected ? "Synchroniser" : "En attente"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Affichage des messages de synchronisation */}
      {syncStatus && syncStatus.status === "syncing" && (
        <Text style={styles.syncingText}>{syncStatus.message}</Text>
      )}

      {syncStatus && syncStatus.status !== "syncing" && syncStatus.message && (
        <Text
          style={[
            styles.resultText,
            { color: syncStatus.success ? "#4CAF50" : "#F44336" },
          ]}
        >
          {syncStatus.message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 25,
    padding: 10,
    backgroundColor: "#F5F5F5",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  pendingText: {
    fontSize: 12,
    color: "#FF9800",
    marginTop: 4,
  },
  badge: {
    backgroundColor: "#FF5722",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    marginTop: 8,
  },
  actionButton: {
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    marginLeft: 4,
  },
  syncingText: {
    marginTop: 8,
    color: "#FF9800",
    fontSize: 12,
  },
  resultText: {
    marginTop: 8,
    fontSize: 12,
  },
});

export default ConnectionIndicator;
