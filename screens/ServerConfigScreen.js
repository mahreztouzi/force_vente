import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";

const ServerConfigScreen = ({ navigation }) => {
  const [isHttps, setIsHttps] = useState(true);
  const [domain, setDomain] = useState("");
  const [port, setPort] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  useEffect(() => {
    loadSavedConfig();
  }, []);

  // Charger la configuration sauvegardée
  const loadSavedConfig = async () => {
    try {
      const savedConfig = await SecureStore.getItemAsync("server_config");
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        setIsHttps(config.isHttps);
        setDomain(config.domain);
        setPort(config.port);
      }
    } catch (error) {
      console.error("Erreur lors du chargement de la configuration:", error);
    }
  };

  // Sauvegarder la configuration
  const saveConfig = async (config) => {
    try {
      await SecureStore.setItemAsync("server_config", JSON.stringify(config));
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      throw error;
    }
  };

  // Construire l'URL complète
  const buildServerUrl = () => {
    // const protocol = isHttps ? "https" : "http";
    const protocol = "http";
    const portSuffix = port ? `:${port}` : "";
    return `${protocol}://${domain}${portSuffix}`;
  };

  // Tester la connexion au serveur
  const testConnection = async () => {
    if (!domain.trim() || !port.trim()) {
      Alert.alert("Erreur", "Veuillez saisir un domaine et un port");
      return false;
    }

    setIsTestingConnection(true);
    const serverUrl = buildServerUrl();

    try {
      // Test simple avec HEAD request sur la racine du serveur
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 secondes

      const response = await fetch(serverUrl, {
        method: "HEAD", // HEAD request pour juste vérifier la disponibilité
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Si on obtient une réponse (même une erreur), le serveur est accessible
      console.log("Réponse du serveur:", response);
      return true;
    } catch (error) {
      console.error("Erreur de connexion:", error);

      let errorMessage = "Serveur inaccessible";

      if (error.name === "AbortError") {
        errorMessage = "Timeout - Le serveur ne répond pas dans les temps.";
      } else if (error.message.includes("Network request failed")) {
        errorMessage =
          "Erreur réseau. Vérifiez l'adresse du serveur et votre connexion.";
      }

      Alert.alert("Erreur de connexion", errorMessage);
      return false;
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSaveAndContinue = async () => {
    setIsLoading(true);

    try {
      // Tester la connexion
      const connectionSuccess = await testConnection();
      console.log("Connection success:", connectionSuccess);

      if (connectionSuccess) {
        // Sauvegarder la configuration
        const config = {
          isHttps,
          domain: domain.trim(),
          port: port.trim(),
          serverUrl: buildServerUrl(),
          lastUpdated: new Date().toISOString(),
        };

        await saveConfig(config);
        console.log("Configuration sauvegardée:", config);

        Alert.alert("Succès", "Configuration sauvegardée avec succès !", [
          {
            text: "Continuer",
            onPress: () => navigation.navigate("Login"),
          },
        ]);
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      Alert.alert("Erreur", "Erreur lors de la sauvegarde de la configuration");
    } finally {
      setIsLoading(false);
    }
  };
  // Tester uniquement la connexion
  const handleTestOnly = async () => {
    const success = await testConnection();
    if (success) {
      Alert.alert("Succès", "Connexion au serveur réussie !");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <MaterialCommunityIcons
            name="server-network"
            size={60}
            color="#03A9F4"
          />
          <Text style={styles.title}>Configuration du Serveur</Text>
          <Text style={styles.subtitle}>
            Configurez les paramètres de connexion à votre serveur backend
          </Text>
        </View>

        <View style={styles.form}>
          {/* Protocole HTTPS/HTTP */}
          {/* <View style={styles.inputGroup}>
            <Text style={styles.label}>Protocole</Text>
            <View style={styles.switchContainer}>
              <Text
                style={[
                  styles.switchLabel,
                  isHttps
                    ? { color: "" }
                    : { color: "#176f14ff", fontWeight: "500" },
                ]}
              >
                HTTP
              </Text>
              <Switch
                value={isHttps}
                onValueChange={setIsHttps}
                trackColor={{ false: "#176f14ff", true: "#03A9F4" }}
                thumbColor={isHttps ? "#ffffff" : "#f4f3f4"}
              />
              <Text
                style={[
                  styles.switchLabel,
                  isHttps
                    ? { color: "#03A9F4", fontWeight: "500" }
                    : { color: "" },
                ]}
              >
                HTTPS
              </Text>
            </View>
          </View> */}

          {/* Domaine */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Domaine *</Text>
            <TextInput
              style={styles.input}
              placeholder="exemple.com ou 192.168.1.100"
              value={domain}
              onChangeText={setDomain}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Port */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Port *</Text>
            <TextInput
              style={styles.input}
              placeholder="8000"
              value={port}
              onChangeText={setPort}
              keyboardType="numeric"
              maxLength={5}
            />
          </View>

          {/* URL générée */}
          <View style={styles.urlPreview}>
            <Text style={styles.urlLabel}>URL générée :</Text>
            <Text style={styles.urlText}>{buildServerUrl()}</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          {/* Bouton tester uniquement */}
          {/* <TouchableOpacity
            style={[styles.button, styles.testButton]}
            onPress={handleTestOnly}
            disabled={isTestingConnection || isLoading}
          >
            {isTestingConnection ? (
              <ActivityIndicator color="#095C28" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="wifi" size={20} color="#095C28" />
                <Text style={styles.testButtonText}>Tester la connexion</Text>
              </>
            )}
          </TouchableOpacity> */}

          {/* Bouton sauvegarder et continuer */}
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSaveAndContinue}
            disabled={isLoading || isTestingConnection}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="content-save"
                  size={20}
                  color="white"
                />
                <Text style={styles.saveButtonText}>
                  Sauvegarder et Continuer
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
    marginTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  form: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchLabel: {
    fontSize: 16,
    color: "#666",
  },
  urlPreview: {
    backgroundColor: "#f0f8ff",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#03A9F4",
    marginTop: 10,
  },
  urlLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#03A9F4",
    marginBottom: 5,
  },
  urlText: {
    fontSize: 16,
    color: "#333",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  buttonContainer: {
    gap: 15,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 8,
    gap: 10,
  },
  testButton: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#095C28",
  },
  testButtonText: {
    color: "#095C28",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#095C28",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ServerConfigScreen;
