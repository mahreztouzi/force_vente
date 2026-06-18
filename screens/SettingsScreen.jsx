import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../redux/slices/authSlice";
import { persistor, store } from "../redux/store";
const SettingsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const userData = useSelector((state) => state.auth.user);
  const [config, setConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [mandant, setMandant] = useState(null);

  useEffect(() => {
    loadServerConfig();
  }, []);

  // Charger la configuration serveur actuelle
  const loadServerConfig = async () => {
    try {
      const savedConfig = await SecureStore.getItemAsync("server_config");
      const mandant = await AsyncStorage.getItem("mandant");
      setMandant(mandant);
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig));
      }
    } catch (error) {
      console.error("Erreur lors du chargement de la configuration:", error);
    }
  };

  // Fonction de déconnexion normale utilisant votre logique existante
  const handleLogout = () => {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Oui",
          onPress: () => {
            setIsLoading(true);
            dispatch(logoutUser())
              .then(() => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: "Login" }],
                });
              })
              .finally(() => {
                setIsLoading(false);
              });
          },
        },
      ],
      { cancelable: false }
    );
  };

  // Fonction de réinitialisation complète
  const handleReset = async () => {
    Alert.alert(
      "⚠️ Réinitialisation complète",
      "Cette action va supprimer TOUTES les données de l'application :\n\n• Configuration du serveur\n• Identifiants de connexion\n• Cache et données locales\n\nCette action est irréversible !",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Réinitialiser",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Confirmation finale",
              "Êtes-vous absolument certain de vouloir tout effacer ?",
              [
                { text: "Non, annuler", style: "cancel" },
                {
                  text: "Oui, tout effacer",
                  style: "destructive",
                  onPress: performReset,
                },
              ]
            );
          },
        },
      ]
    );
  };

  // Effectuer la réinitialisation complète
  // const performReset = async () => {
  //   setIsResetting(true);
  //   try {
  //     console.log("Début de la réinitialisation complète...");

  //     // 1. Supprimer toutes les données de SecureStore
  //     const secureStoreKeys = ["server_config", "username", "password"];

  //     for (const key of secureStoreKeys) {
  //       try {
  //         await SecureStore.deleteItemAsync(key);
  //         console.log(`SecureStore: ${key} supprimé`);
  //       } catch (error) {
  //         console.log(
  //           `SecureStore: ${key} n'existe pas ou erreur:`,
  //           error.message
  //         );
  //       }
  //     }

  //     // 2. Purger le persistor (supprime d'AsyncStorage)
  //     await persistor.purge();
  //     console.log("Persistor purgé");

  //     // 3. Vider complètement AsyncStorage (sécurité supplémentaire)
  //     try {
  //       await AsyncStorage.clear();
  //       console.log("AsyncStorage complètement vidé");
  //     } catch (error) {
  //       console.error("Erreur lors du vidage d'AsyncStorage:", error);
  //     }

  //     // 4. IMPORTANT: Réinitialiser l'état Redux en mémoire
  //     store.dispatch({ type: "RESET_ALL" });
  //     console.log("Store Redux réinitialisé");

  //     // 5. Optionnel: Flush le persistor pour s'assurer que l'état vide est sauvegardé
  //     persistor.flush();

  //     console.log("Réinitialisation complète terminée");

  //     Alert.alert(
  //       "Réinitialisation réussie",
  //       "Toutes les données ont été supprimées. Vous allez être redirigé vers la configuration.",
  //       [
  //         {
  //           text: "OK",
  //           onPress: () => {
  //             navigation.reset({
  //               index: 0,
  //               routes: [{ name: "ServerConfig" }],
  //             });
  //           },
  //         },
  //       ]
  //     );
  //   } catch (error) {
  //     console.error("Erreur lors de la réinitialisation:", error);
  //     Alert.alert(
  //       "Erreur",
  //       "Une erreur s'est produite lors de la réinitialisation."
  //     );
  //   } finally {
  //     setIsResetting(false);
  //   }
  // };
  const performReset = async () => {
    setIsResetting(true);
    try {
      console.log("Début de la réinitialisation complète...");

      // 1. Supprimer toutes les données de SecureStore
      const secureStoreKeys = ["server_config", "username", "password"];
      for (const key of secureStoreKeys) {
        try {
          await SecureStore.deleteItemAsync(key);
          console.log(`SecureStore: ${key} supprimé`);
        } catch (error) {
          console.log(
            `SecureStore: ${key} n'existe pas ou erreur:`,
            error.message
          );
        }
      }

      // 2. Purger le persistor (supprime d'AsyncStorage)
      await persistor.purge();
      console.log("Persistor purgé");

      // 3. Vider complètement AsyncStorage (sécurité supplémentaire)
      try {
        await AsyncStorage.clear();
        console.log("AsyncStorage complètement vidé");
      } catch (error) {
        console.error("Erreur lors du vidage d'AsyncStorage:", error);
      }

      // 4. IMPORTANT: Réinitialiser l'état Redux en mémoire
      store.dispatch({ type: "RESET_ALL" });
      console.log("Store Redux réinitialisé");

      // 5. Optionnel: Flush le persistor pour s'assurer que l'état vide est sauvegardé
      await persistor.flush();

      Alert.alert(
        "Réinitialisation réussie",
        "Toutes les données ont été supprimées. Vous allez être redirigé vers la configuration.",
        [
          {
            text: "OK",
            onPress: () => {
              // Solution sans dépendance : Reset navigation complet
              setTimeout(() => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: "ServerConfig" }],
                });
              }, 100);
            },
          },
        ]
      );
    } catch (error) {
      console.error("Erreur lors de la réinitialisation:", error);
      Alert.alert(
        "Erreur",
        "Une erreur s'est produite lors de la réinitialisation."
      );
    } finally {
      setIsResetting(false);
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      {/* <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" /> */}

      {/* Header */}
      {/* <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paramètres</Text>
        <View style={styles.headerSpacer} />
      </View> */}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Section Utilisateur */}
        <View style={styles.section}>
          <View style={styles.userHeader}>
            <View style={styles.userAvatar}>
              <MaterialCommunityIcons
                name="account"
                size={40}
                color="#03A9F4"
              />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userData?.fullName}</Text>
              <Text style={styles.userCode}>Code : {userData?.code}</Text>
              <Text style={styles.userCode}>Mandant : {mandant}</Text>
            </View>
            <View>
              <TouchableOpacity
                style={[styles.logoutButton]}
                onPress={handleLogout}
                disabled={isLoading || isResetting}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="logout"
                      size={27}
                      color="#e7811cff"
                    />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Section Configuration Serveur */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="server" size={24} color="#03A9F4" />
            <Text style={styles.sectionTitle}>Configuration actuelle</Text>
          </View>

          {config ? (
            <View style={styles.configContainer}>
              {/* <View style={styles.configRow}>
                <View style={styles.configIcon}>
                  <MaterialCommunityIcons
                    name={config.isHttps ? "lock" : "lock-open-variant"}
                    size={20}
                    color={config.isHttps ? "#4CAF50" : "#FF9800"}
                  />
                </View>
                <View style={styles.configContent}>
                  <Text style={styles.configLabel}>Protocole</Text>
                  <Text style={styles.configValue}>
                    {config.isHttps ? "HTTPS (Sécurisé)" : "HTTP"}
                  </Text>
                </View>
              </View> */}

              <View style={styles.configRow}>
                <View style={styles.configIcon}>
                  <MaterialCommunityIcons
                    name="web"
                    size={20}
                    color="#03A9F4"
                  />
                </View>
                <View style={styles.configContent}>
                  <Text style={styles.configLabel}>Serveur</Text>
                  <Text style={styles.configValue}>{config.domain}</Text>
                </View>
              </View>

              {config.port && (
                <View style={styles.configRow}>
                  <View style={styles.configIcon}>
                    <MaterialCommunityIcons
                      name="console"
                      size={20}
                      color="#03A9F4"
                    />
                  </View>
                  <View style={styles.configContent}>
                    <Text style={styles.configLabel}>Port</Text>
                    <Text style={styles.configValue}>{config.port}</Text>
                  </View>
                </View>
              )}

              <View style={styles.configRow}>
                <View style={styles.configIcon}>
                  <MaterialCommunityIcons
                    name="link-variant"
                    size={20}
                    color="#03A9F4"
                  />
                </View>
                <View style={styles.configContent}>
                  <Text style={styles.configLabel}>URL complète</Text>
                  <Text style={[styles.configValue, styles.urlValue]}>
                    {config.serverUrl}
                  </Text>
                </View>
              </View>

              {config.lastUpdated && (
                <View style={[styles.configRow, styles.lastRow]}>
                  <View style={styles.configIcon}>
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={20}
                      color="#666"
                    />
                  </View>
                  <View style={styles.configContent}>
                    <Text style={styles.configLabel}>Dernière mise à jour</Text>
                    <Text style={styles.configDate}>
                      {new Date(config.lastUpdated).toLocaleDateString(
                        "fr-FR",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.noConfigContainer}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={48}
                color="#ccc"
              />
              <Text style={styles.noConfigText}>
                Aucune configuration trouvée
              </Text>
            </View>
          )}
        </View>

        {/* Spacer pour pousser les boutons vers le bas */}
        <View style={styles.spacer} />
      </ScrollView>

      {/* Footer avec les boutons d'action */}
      <View style={styles.footer}>
        {/* <TouchableOpacity
          style={[styles.footerButton, styles.logoutButton]}
          onPress={handleLogout}
          disabled={isLoading || isResetting}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="logout" size={22} color="white" />
              <Text style={styles.logoutButtonText}>Déconnexion</Text>
            </>
          )}
        </TouchableOpacity> */}

        <TouchableOpacity
          style={[styles.footerButton, styles.resetButton]}
          onPress={handleReset}
          disabled={isLoading || isResetting}
        >
          {isResetting ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="refresh" size={22} color="white" />
              <Text style={styles.resetButtonText}>Réinitialiser</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#212529",
  },
  headerSpacer: {
    width: 34,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: "white",
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    elevation: 0.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#e3f2fd",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 2,
  },
  userCode: {
    fontSize: 14,
    color: "#03A9F4",
    fontWeight: "600",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#6c757d",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212529",
    marginLeft: 12,
  },
  configContainer: {
    gap: 0,
  },
  configRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f8f9fa",
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  configIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  configContent: {
    flex: 1,
  },
  configLabel: {
    fontSize: 14,
    color: "#6c757d",
    fontWeight: "500",
    marginBottom: 2,
  },
  configValue: {
    fontSize: 16,
    color: "#212529",
    fontWeight: "400",
  },
  urlValue: {
    fontSize: 13,
    color: "#03A9F4",
    fontFamily: "monospace",
  },
  configDate: {
    fontSize: 14,
    color: "#495057",
  },
  noConfigContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  noConfigText: {
    fontSize: 16,
    color: "#6c757d",
    marginTop: 12,
    textAlign: "center",
  },
  spacer: {
    height: 100,
  },
  footer: {
    flexDirection: "column",
    paddingHorizontal: 20,
    paddingVertical: 5,
    paddingBottom: 5,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    gap: 5,
  },
  footerButton: {
    // flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 8,
    gap: 6,
    backgroundColor: "transparent", // la couleur sera donnée par logoutButton/resetButton
    height: 50,
  },
  resetButton: {
    backgroundColor: "#dc3545",
    color: "#dc3545",
  },
  logoutButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "500",
    // color: "#03A9F4",
  },
  resetButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "500",
    // color: "#dc3545",
  },
});

export default SettingsScreen;
