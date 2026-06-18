import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  Dimensions,
  Vibration,
  BackHandler,
  PermissionsAndroid,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ThermalPrinterModule from "react-native-thermal-printer";
import { BleManager } from "react-native-ble-plx";

const { height: screenHeight } = Dimensions.get("window");

const BluetoothPrinterManager = ({
  visible = false,
  onClose,
  printData = null,
  onPrintSuccess,
  onPrintError,
  type,
}) => {
  console.log("type dans bluetoothprintMangaer", type, printData);
  // États principaux simplifiés
  const [devices, setDevices] = useState([]);
  const [printText, setPrintText] = useState("");

  // États de chargement et statuts
  const [isLoading, setIsLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(null);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);

  // Instance BLE Manager
  const [bleManager] = useState(() => new BleManager());

  // Constantes
  const CONNECTION_TIMEOUT = 6000;

  // Génération du texte formaté
  useEffect(() => {
    if (printData && visible) {
      const timer = setTimeout(() => {
        const generatedText = generateFormattedText(printData);
        console.log("📝 PrintText généré, longueur:", generatedText?.length);
      }, 100);

      return () => clearTimeout(timer);
    } else if (!printData) {
      setPrintText("");
    }
  }, [printData, visible]);

  // Initialisation à l'ouverture du modal
  useEffect(() => {
    if (visible) {
      initializeManager();
    } else {
      resetState();
    }
  }, [visible]);

  // Gestion du bouton retour Android
  useEffect(() => {
    const backAction = () => {
      if (visible && (isPrinting || isConnecting !== null)) {
        Alert.alert("Opération en cours", "Voulez-vous vraiment annuler ?", [
          { text: "Attendre", style: "cancel" },
          { text: "Annuler", style: "destructive", onPress: handleForceClose },
        ]);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );
    return () => backHandler.remove();
  }, [visible, isPrinting, isConnecting]);

  // Listener Bluetooth pour surveiller l'état
  useEffect(() => {
    let stateSubscription;

    const setupBluetoothListener = () => {
      if (visible && bleManager) {
        stateSubscription = bleManager.onStateChange((state) => {
          const isEnabled = state === "PoweredOn";
          setBluetoothEnabled(isEnabled);

          if (!isEnabled && connectionStatus === "device_selection") {
            setConnectionStatus("bluetooth_disabled");
            setStatusMessage("Bluetooth désactivé");
          }
        }, true);
      }
    };

    setupBluetoothListener();

    return () => {
      if (stateSubscription) {
        stateSubscription.remove();
      }
    };
  }, [visible, connectionStatus, bleManager]);

  const resetState = () => {
    setDevices([]);
    setIsLoading(false);
    setIsConnecting(null);
    setConnectionStatus("idle");
    setStatusMessage("");
    setBluetoothEnabled(null);
    setPrintText("");
    setSelectedDevice(null); // ← Ajouter cette ligne
    setIsPrinting(false); // ← Ajouter cette ligne
  };

  const generateFormattedText = (data) => {
    if (!data) {
      setPrintText("");
      return;
    }

    let formattedText = "";

    if (type === "livraison") {
      // Template pour les factures
      formattedText =
        "[C]<u><font size='big'>BON DE FACTURE</font></u>\n" +
        "[L]\n" +
        `[C]<font size='normal'>N° ${data.numero || "DL-2023-12345"}</font>\n` +
        "[L]\n" +
        "[C]------------------------------------------------\n" +
        "[L]\n" +
        `[L]<b>Date :</b>[R]${data.date}\n` +
        `[L]<b>Heure :</b>[R]${data.heure}\n` +
        `[L]<b>Client :</b>[R]${data.clientId}\n` +
        `[L]<b>Nom :</b>[R]${data.clientNom}\n` +
        `[L]<b>Livreur :</b>[R]${data.livreur}\n` +
        "[L]\n" +
        "[C]------------------------------------------------\n" +
        "[L]\n" +
        "[C]<b><u>ARTICLES LIVRES</u></b>\n" +
        "[L]\n";

      if (data.articles && data.articles.length > 0) {
        data.articles.forEach((article, index) => {
          formattedText +=
            `[L]<b># ${article.code}</b>\n` +
            `[L]${article.description}\n` +
            "[R]<b>_______________________________</b>\n" +
            `[R][R]Qté livrée :[R]${article.quantite} ${article.unite}\n` +
            `[R][R]Prix unitaire :[R]${article.prix}\n` +
            "[L]\n" +
            "[L]\n";
        });
      }

      formattedText +=
        "[C]------------------------------------------------\n" +
        "[L]\n" +
        "[L]\n" +
        `[C]<b><font size='big'>Total : ${data.total}</font></b>\n` +
        "[L]\n" +
        "[L]\n" +
        "[C]<font size='tall'>Merci pour votre confiance</font>\n" +
        "[L]\n";
    } else if (type === "encaissement") {
      // Template pour les encaissements
      const currentDate = new Date().toLocaleDateString("fr-FR");
      const currentTime = new Date().toLocaleTimeString("fr-FR");

      // Formater la date d'encaissement
      const formatEncaissementDate = (dateSAP) => {
        if (!dateSAP) return currentDate;

        try {
          // Si c'est déjà une date normale (pour les encaissements offline)
          if (!dateSAP.includes("/Date(")) {
            return new Date(dateSAP).toLocaleDateString("fr-FR");
          }

          // Sinon extraire le timestamp SAP
          const timestampMatch = dateSAP.match(/\/Date\((\d+)\)\//);
          if (timestampMatch && timestampMatch.length >= 2) {
            const timestamp = parseInt(timestampMatch[1]);
            const date = new Date(timestamp);
            return date.toLocaleDateString("fr-FR");
          }
        } catch (error) {
          console.error("Erreur format date:", error);
        }

        return currentDate;
      };

      formattedText =
        "[C]<u><font size='big'>RECU D'ENCAISSEMENT</font></u>\n" +
        "[L]\n" +
        `[C]<font size='normal'>N° ${data.Id || data.numero}</font>\n` +
        "[L]\n" +
        "[C]------------------------------------------------\n" +
        "[L]\n" +
        `[L]<b>Date :</b>[R]${currentDate}\n` +
        `[L]<b>Heure :</b>[R]${currentTime}\n` +
        `[L]<b>Client :</b>[R]${data.Client}\n` +
        `[L]<b>Nom :</b>[R]${data.clientName}\n` +
        `[L]<b>Commercial :</b>[R]${data.commercial}\n` +
        `[L]<b>Date Encaissement :</b>[R]${formatEncaissementDate(
          data.DateEncaissement
        )}\n` +
        "[L]\n" +
        "[C]------------------------------------------------\n" +
        "[L]\n" +
        "[C]<b><u>DETAILS DU PAIEMENT</u></b>\n" +
        "[L]\n" +
        `[L]<b>Mode de paiement :</b>[R]${data.ModePaiement}\n`;

      // Ajouter la référence si elle existe
      if (data.Reference) {
        formattedText += `[L]<b>Référence :</b>[R]${data.Reference}\n`;
      }

      formattedText +=
        "[L]\n" +
        "[C]================================================\n" +
        "[L]\n" +
        "[C]<b><u>MONTANT ENCAISSE</u></b>\n" +
        "[L]\n" +
        `[C]<b><font size='big'>${data.Montant}</font></b>\n` +
        "[L]\n" +
        "[C]================================================\n" +
        "[L]\n" +
        "[L]\n" +
        "[C]<font size='tall'>Merci pour votre confiance</font>\n" +
        "[L]\n";
    }

    setPrintText(formattedText);
    return formattedText;
  };

  const requestBluetoothPermissions = async () => {
    if (Platform.OS !== "android") {
      return true;
    }

    try {
      // Utiliser Platform.Version au lieu de Device.osVersion
      const deviceVersion = Platform.Version;

      if (deviceVersion >= 31) {
        // Android 12 = API Level 31
        const permissions = [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ];

        const results = await PermissionsAndroid.requestMultiple(permissions);

        return (
          results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] ===
            "granted" &&
          results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] ===
            "granted" &&
          results[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
            "granted"
        );
      } else {
        const locationPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return locationPermission === "granted";
      }
    } catch (error) {
      console.error("Erreur demande permissions:", error);
      return false;
    }
  };

  // Test de connexion et impression directe - CORRIGÉ
  const testConnectionAndPrint = async (device) => {
    return new Promise(async (resolve) => {
      let timeoutId;
      const currentMacAddress = device.macAddress;

      try {
        console.log(
          `🔍 Test connexion vers: ${device.deviceName} (${device.macAddress})`
        );

        // Générer le printText si pas encore fait
        let textToPrint = printText;
        if (!textToPrint && printData) {
          textToPrint = generateFormattedText(printData);
        }
        if (!textToPrint) {
          throw new Error("Aucune donnée à imprimer");
        }

        // ⚠️ IMPORTANT: Forcer une mise à jour de l'interface avant l'opération
        await new Promise((resolve) => setTimeout(resolve, 50));

        timeoutId = setTimeout(() => {
          throw new Error("Timeout de connexion");
        }, CONNECTION_TIMEOUT);

        // Mettre à jour le message de statut
        setStatusMessage(`Impression en cours sur ${device.deviceName}...`);

        await ThermalPrinterModule.printBluetooth({
          payload: textToPrint,
          printerNbrCharactersPerLine: 48,
          autoCut: true,
          printerWidthMM: 80,
          printerDpi: 203,
          mmFeedPaper: 15,
          macAddress: device.macAddress,
          openCashbox: true,
        });

        clearTimeout(timeoutId);
        console.log("✅ Connexion et impression réussies!");
        resolve(true);
      } catch (error) {
        clearTimeout(timeoutId);
        const errorMessage = error.message || error.toString();
        console.warn(
          `❌ Connexion/Impression échouée pour ${device.deviceName}:`,
          errorMessage
        );
        resolve(false);
      }
    });
  };

  // Initialisation simplifiée - seulement permissions et Bluetooth
  const initializeManager = async () => {
    try {
      setConnectionStatus("checking");
      setStatusMessage("Vérification des permissions...");

      // Vérification des permissions
      const permissionsOk = await requestBluetoothPermissions();
      if (!permissionsOk) {
        setConnectionStatus("permissions_denied");
        setStatusMessage("Permissions Bluetooth refusées");
        return;
      }
      setPermissionsGranted(true);

      setStatusMessage("Vérification du Bluetooth...");

      // État Bluetooth
      const state = await bleManager.state();
      const isEnabled = state === "PoweredOn";
      setBluetoothEnabled(isEnabled);

      if (!isEnabled) {
        setConnectionStatus("bluetooth_disabled");
        setStatusMessage("Bluetooth désactivé");
        return;
      }

      // Génération du printText
      if (printData) {
        generateFormattedText(printData);
      }

      // Chargement direct de la liste des imprimantes
      await loadAvailableDevices();
      setConnectionStatus("device_selection");
    } catch (error) {
      console.error("Erreur d'initialisation:", error);
      setConnectionStatus("error");
      setStatusMessage("Erreur d'initialisation du Bluetooth");
    }
  };

  const loadAvailableDevices = async () => {
    setIsLoading(true);
    setStatusMessage("Recherche des imprimantes...");

    try {
      const pairedDevices = await ThermalPrinterModule.getBluetoothDeviceList();
      if (Array.isArray(pairedDevices) && pairedDevices.length > 0) {
        console.log(
          `📱 ${pairedDevices.length} imprimantes appairées trouvées`
        );
        setDevices(pairedDevices);
        setStatusMessage(`${pairedDevices.length} imprimante(s) disponible(s)`);
      } else {
        console.log("📱 Aucune imprimante appairée, scan BLE...");
        await scanForDevices();
      }
    } catch (error) {
      console.error("Erreur recherche appareils:", error);
      await scanForDevices();
    } finally {
      setIsLoading(false);
    }
  };

  const scanForDevices = async () => {
    try {
      setStatusMessage("Scan des appareils Bluetooth...");
      const foundDevices = [];

      await bleManager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error("Erreur scan BLE:", error);
          return;
        }
        console.log("devices scaned", device);
        if (
          device &&
          device.name &&
          !foundDevices.find((d) => d.id === device.id)
        ) {
          const printerNames = [
            "print",
            "thermal",
            "pos",
            "receipt",
            "58mm",
            "80mm",
          ];
          const deviceNameLower = device.name.toLowerCase();

          if (printerNames.some((name) => deviceNameLower.includes(name))) {
            foundDevices.push({
              deviceName: device.name,
              macAddress: device.id,
              id: device.id,
            });
          }
        }
      });

      setTimeout(async () => {
        await bleManager.stopDeviceScan();

        if (foundDevices.length > 0) {
          console.log(
            `📡 ${foundDevices.length} imprimantes trouvées par scan`,
            foundDevices
          );
          setDevices(foundDevices);
          setStatusMessage(`${foundDevices.length} imprimante(s) trouvée(s)`);
        } else {
          console.log("📡 Aucune imprimante trouvée par scan");
          setDevices([]);
          setStatusMessage("Aucune imprimante trouvée");
        }
      }, 5000);
    } catch (error) {
      console.error("Erreur scan BLE:", error);
      setDevices([]);
      setStatusMessage("Erreur lors du scan");
    }
  };

  // Sélection d'imprimante - CORRIGÉ
  const handleDeviceSelect = async (device) => {
    // Empêcher les clics multiples
    if (isConnecting !== null || isPrinting) return;

    console.log(`🖨️ Sélection de l'imprimante: ${device.deviceName}`);

    // ⚠️ IMPORTANT: Définir les états IMMÉDIATEMENT et de manière synchrone
    setSelectedDevice(device.macAddress);
    setIsConnecting(device.macAddress);
    setIsPrinting(true);
    setStatusMessage(`Connexion à ${device.deviceName}...`);

    try {
      const success = await testConnectionAndPrint(device);

      if (success) {
        setStatusMessage("✅ Impression réussie!");
        Vibration.vibrate([100, 50, 100]);

        setTimeout(() => {
          onPrintSuccess?.("Impression réussie!");
          onClose?.();
        }, 1500);
      } else {
        setStatusMessage(`❌ Échec de l'impression sur ${device.deviceName}`);
        Vibration.vibrate(300);

        Alert.alert(
          "Erreur d'impression",
          `Impossible d'imprimer sur ${device.deviceName}.\n\nVérifiez que l'imprimante est allumée et à portée.`,
          [{ text: "OK" }]
        );

        onPrintError?.("Erreur lors de l'impression");
      }
    } catch (error) {
      console.error("❌ Erreur handleDeviceSelect:", error);
      setStatusMessage("❌ Erreur lors de l'impression");
      onPrintError?.("Erreur lors de l'impression");
    } finally {
      // ⚠️ IMPORTANT: Réinitialiser les états dans finally
      setIsPrinting(false);
      setIsConnecting(null);
      setSelectedDevice(null);
    }
  };

  const handleForceClose = () => {
    setIsConnecting(null);
    setIsPrinting(false);
    setSelectedDevice(null); // ← Ajouter cette ligne
    onClose?.();
  };

  const handleModalClose = () => {
    if (isPrinting || isConnecting !== null) {
      Alert.alert(
        "Opération en cours",
        "Une opération est en cours. Voulez-vous vraiment fermer ?",
        [
          { text: "Attendre", style: "cancel" },
          { text: "Fermer", style: "destructive", onPress: handleForceClose },
        ]
      );
    } else {
      onClose?.();
    }
  };

  const enableBluetooth = async () => {
    Alert.alert(
      "Activer le Bluetooth",
      "Veuillez activer le Bluetooth dans les paramètres de votre appareil, puis appuyez sur 'Réessayer'.",
      [{ text: "Réessayer", onPress: initializeManager }]
    );
  };

  const requestPermissions = () => {
    Alert.alert(
      "Permissions requises",
      "Cette application a besoin des permissions Bluetooth et de localisation pour fonctionner correctement.",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Réessayer", onPress: initializeManager },
      ]
    );
  };

  // Rendu conditionnel basé sur l'état
  const renderContent = () => {
    switch (connectionStatus) {
      case "checking":
        return (
          <View style={styles.centerContainer}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.statusText}>{statusMessage}</Text>
            </View>
          </View>
        );

      case "permissions_denied":
        return (
          <View style={styles.centerContainer}>
            <View style={styles.errorContainer}>
              <Text style={styles.errorIcon}>🔒</Text>
              <Text style={styles.errorTitle}>Permissions Requises</Text>
              <Text style={styles.errorText}>
                L'application a besoin des permissions Bluetooth et de
                localisation pour scanner les imprimantes.
              </Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={requestPermissions}
              >
                <Text style={styles.primaryButtonText}>
                  Accorder les Permissions
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case "bluetooth_disabled":
        return (
          <View style={styles.centerContainer}>
            <View style={styles.errorContainer}>
              <Text style={styles.errorIcon}>📶</Text>
              <Text style={styles.errorTitle}>Bluetooth Désactivé</Text>
              <Text style={styles.errorText}>
                L'imprimante nécessite une connexion Bluetooth active.
              </Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={enableBluetooth}
              >
                <Text style={styles.primaryButtonText}>
                  Activer le Bluetooth
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={initializeManager}
              >
                <Text style={styles.secondaryButtonText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case "device_selection":
      default:
        return (
          <View style={styles.contentContainer}>
            <View style={styles.headerSection}>
              <Text style={styles.sectionTitle}>
                Sélectionner une imprimante
              </Text>
              <Text style={styles.sectionSubtitle}>
                Choisissez une imprimante pour lancer l'impression
              </Text>

              <TouchableOpacity
                style={styles.refreshButton}
                onPress={loadAvailableDevices}
                disabled={isLoading}
              >
                <Text style={styles.refreshIcon}>🔄</Text>
                <Text style={styles.refreshButtonText}>
                  {isLoading ? "Recherche..." : "Actualiser"}
                </Text>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <View style={styles.loadingListContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>{statusMessage}</Text>
              </View>
            ) : (
              <FlatList
                data={devices}
                keyExtractor={(item) => item.macAddress}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.deviceItem,
                      selectedDevice === item.macAddress &&
                        styles.connectingDevice,
                    ]}
                    onPress={() => handleDeviceSelect(item)}
                    disabled={isConnecting !== null || isPrinting}
                  >
                    <View style={styles.deviceContent}>
                      <View style={styles.deviceIcon}>
                        <Text style={styles.deviceIconText}>🖨️</Text>
                      </View>

                      <View style={styles.deviceInfo}>
                        <Text style={styles.deviceName}>{item.deviceName}</Text>
                        <Text style={styles.deviceAddress}>
                          {item.macAddress}
                        </Text>
                      </View>

                      <View style={styles.deviceAction}>
                        {selectedDevice === item.macAddress ? (
                          <ActivityIndicator size="small" color="#2563eb" />
                        ) : (
                          <Text style={styles.actionIcon}>▶</Text>
                        )}
                      </View>
                    </View>

                    {selectedDevice === item.macAddress && (
                      <View style={styles.connectingOverlay}>
                        <ActivityIndicator
                          size="small"
                          color="#ffffff"
                          style={{ marginRight: 8 }}
                        />
                        <Text style={styles.connectingText}>
                          {statusMessage || "Connexion..."}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={() => (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>🔍</Text>
                    <Text style={styles.emptyTitle}>
                      Aucune imprimante trouvée
                    </Text>
                    <Text style={styles.emptyText}>
                      Assurez-vous que votre imprimante est:
                    </Text>
                    <View style={styles.checkList}>
                      <Text style={styles.checkItem}>✓ Allumée et prête</Text>
                      <Text style={styles.checkItem}>
                        ✓ Appairée avec cet appareil
                      </Text>
                      <Text style={styles.checkItem}>✓ À portée Bluetooth</Text>
                    </View>
                  </View>
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleModalClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerIcon}>🖨️</Text>
              <View style={styles.headerText}>
                <Text style={styles.title}>Impression</Text>
                <Text style={styles.subtitle}>
                  {type === "livraison"
                    ? "Impression de facture"
                    : "Impression d'encaissement"}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleModalClose}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {renderContent()}

          {statusMessage &&
            connectionStatus === "device_selection" &&
            !isLoading && (
              <View style={styles.statusBar}>
                <Text style={styles.statusBarText}>{statusMessage}</Text>
                {(isPrinting || selectedDevice !== null) && (
                  <ActivityIndicator
                    size="small"
                    color="#2563eb"
                    style={styles.statusBarLoader}
                  />
                )}
              </View>
            )}
        </View>
      </View>
    </Modal>
  );
};

// Styles professionnels
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    // backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#ffffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(58, 64, 78, 0.05)",
    maxHeight: "85%",
    minHeight: "85%",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 18,
    color: "#64748b",
    fontWeight: "600",
  },
  contentContainer: {
    flex: 1,
    // paddingHorizontal: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  headerSection: {
    paddingVertical: 24,
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 20,
    textAlign: "center",
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  refreshIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  refreshButtonText: {
    fontSize: 14,
    color: "#475569",
    fontWeight: "500",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingListContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#64748b",
    marginTop: 16,
    textAlign: "center",
  },
  statusText: {
    fontSize: 16,
    color: "#64748b",
    marginTop: 16,
    textAlign: "center",
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 40,
    maxWidth: 300,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 22,
  },
  listContent: {
    paddingBottom: 24,
  },
  deviceItem: {
    backgroundColor: "#ffffff",
    // borderRadius: 16,
    // marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  connectingDevice: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  deviceContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  deviceIcon: {
    width: 48,
    height: 48,
    backgroundColor: "#f1f5f9",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  deviceIconText: {
    fontSize: 20,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  deviceAddress: {
    fontSize: 13,
    color: "#64748b",
    fontFamily: "monospace",
  },
  deviceAction: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  actionIcon: {
    fontSize: 16,
    color: "#2563eb",
    fontWeight: "600",
  },
  connectingOverlay: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#dbeafe",
  },
  connectingText: {
    fontSize: 14,
    color: "#2563eb",
    fontWeight: "500",
    textAlign: "center",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 16,
    textAlign: "center",
  },
  checkList: {
    alignItems: "flex-start",
  },
  checkItem: {
    fontSize: 14,
    color: "#059669",
    marginBottom: 4,
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    minWidth: 200,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Styles manquants à ajouter à votre StyleSheet existant

  secondaryButton: {
    backgroundColor: "transparent",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2563eb",
    minWidth: 200,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#2563eb",
    fontSize: 16,
    fontWeight: "600",
  },
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "#f8fafc",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  statusBarText: {
    fontSize: 14,
    color: "#475569",
    fontWeight: "500",
    flex: 1,
  },
  statusBarLoader: {
    marginLeft: 12,
  },
});

export default BluetoothPrinterManager;
