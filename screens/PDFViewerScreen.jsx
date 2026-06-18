// import React, { useEffect, useState, useLayoutEffect } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   StatusBar,
//   SafeAreaView,
//   Alert,
//   ActivityIndicator,
//   Dimensions,
//   ScrollView,
//   BackHandler,
// } from "react-native";
// import { WebView } from "react-native-webview";
// import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
// import { useNavigation } from "@react-navigation/native";
// import * as Print from "expo-print";
// import * as Sharing from "expo-sharing";
// import * as FileSystem from "expo-file-system";

// const { width, height } = Dimensions.get("window");
// import { wp, hp, fs, fontWeight, scale } from "../utils/responsive";
// import BluetoothPrinterManager from "../components/BluetoothPrinterManager";

// export const PDFViewerScreen = ({ route }) => {
//   const navigation = useNavigation();
//   const {
//     htmlContent,
//     htmlContentThermal, // PDF Ticket
//     encaissementId,
//     deliveryId,
//     documentType,
//     orderData,
//     deliveryItems,
//     userData,
//     clientData,
//     deliveryData,
//     encaissementData,
//   } = route.params;
//   const client = clientData;
//   const [pdfUri, setPdfUri] = useState(null);
//   const [isGenerating, setIsGenerating] = useState(true);
//   const [isSharing, setIsSharing] = useState(false);
//   const [htmlPreview, setHtmlPreview] = useState(null);
//   const [viewMode, setViewMode] = useState("html"); // 'html' ou 'pdf'

//   const [showPrinterModal, setShowPrinterModal] = useState(false);
//   const [showBluetoothManager, setShowBluetoothManager] = useState(false);
//   const [currentPrintData, setCurrentPrintData] = useState(null);

//   useLayoutEffect(() => {
//     navigation.setOptions({
//       //   title: `Bon de livraison N° ${deliveryId}`,
//       title: `Impression Document`,
//       headerStyle: {
//         backgroundColor: "#03A9F4",
//       },
//       headerTintColor: "white",
//       headerLeft: () => (
//         <TouchableOpacity
//           onPress={() => navigation.navigate("ClientDetails", { client })}
//           //   style={styles.headerButton}
//         >
//           <MaterialCommunityIcons
//             name="arrow-left-circle"
//             size={30}
//             color="white"
//             style={{ marginLeft: 15 }}
//           />
//         </TouchableOpacity>
//       ),
//       headerRight: () => (
//         <View style={styles.headerRightContainer}>
//           {/* <TouchableOpacity
//             onPress={() => setViewMode(viewMode === "html" ? "pdf" : "html")}
//             style={styles.headerButton}
//           >
//             <MaterialIcons
//               name={viewMode === "html" ? "picture-as-pdf" : "web"}
//               size={24}
//               color="white"
//             />
//           </TouchableOpacity> */}
//           <TouchableOpacity
//             onPress={handleSharePDF}
//             style={styles.headerButtonRight}
//             disabled={!pdfUri || isSharing}
//           >
//             {isSharing ? (
//               <ActivityIndicator size="small" color="white" />
//             ) : (
//               <MaterialIcons name="share" size={24} color="white" />
//             )}
//           </TouchableOpacity>
//         </View>
//       ),
//     });
//   }, [navigation, deliveryId, pdfUri, isSharing, viewMode]);

//   useEffect(() => {
//     const handleBackPress = () => {
//       // Comportement normal - retourner à l'écran précédent
//       navigation.navigate("ClientDetails", { client });
//       return true;
//     };

//     const backHandler = BackHandler.addEventListener(
//       "hardwareBackPress",
//       handleBackPress,
//     );
//     return () => backHandler.remove();
//   }, [navigation]);

//   useEffect(() => {
//     generatePDF();
//     prepareHtmlPreview();
//   }, []);

//   const prepareHtmlPreview = () => {
//     // Améliorer le HTML pour l'affichage mobile
//     const mobileOptimizedHtml = `
//       <!DOCTYPE html>
//       <html>
//         <head>
//           <meta charset="utf-8">
//           <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
//           <style>
//             body {
//               margin: 0;
//               padding: 20px;
//               font-family: Arial, sans-serif;
//               background-color: #fff;
//               // zoom: 1.2;

//             }
//             .container {
//               max-width: 100%;
//               margin: 0 auto;
//             }
//             }
//           </style>
//         </head>
//         <body>
//           <div class="container">
//             ${htmlContent}
//           </div>
//         </body>
//       </html>
//     `;
//     setHtmlPreview(mobileOptimizedHtml);
//   };

//   const generatePDF = async () => {
//     try {
//       setIsGenerating(true);
//       console.log("Génération du PDF...");

//       // Créer le PDF avec expo-print
//       const { uri } = await Print.printToFileAsync({
//         html: htmlContent,
//         base64: false,
//         // width: 226, // 80mm en pixels
//       });

//       console.log("PDF généré:", uri);

//       // Copier le PDF vers un emplacement accessible
//       const fileName = `document_${deliveryId}_${Date.now()}.pdf`;
//       const newUri = `${FileSystem.documentDirectory}${fileName}`;

//       await FileSystem.copyAsync({
//         from: uri,
//         to: newUri,
//       });

//       setPdfUri(newUri);
//     } catch (error) {
//       console.error("Erreur lors de la génération du PDF:", error);
//       Alert.alert("Erreur", "Impossible de générer le document PDF.", [
//         {
//           text: "Réessayer",
//           onPress: generatePDF,
//         },
//         {
//           text: "Retour",
//           onPress: () => navigation.goBack(),
//         },
//       ]);
//     } finally {
//       setIsGenerating(false);
//     }
//   };

//   const handleSharePDF = async () => {
//     if (!pdfUri) return;

//     try {
//       setIsSharing(true);

//       if (await Sharing.isAvailableAsync()) {
//         await Sharing.shareAsync(pdfUri, {
//           mimeType: "application/pdf",
//           dialogTitle: "Partager le bon de livraison",
//           UTI: "com.adobe.pdf",
//         });
//       } else {
//         // Alternative pour les appareils où le partage n'est pas disponible
//         await Print.printAsync({
//           uri: pdfUri,
//         });
//       }
//     } catch (error) {
//       console.error("Erreur lors du partage:", error);
//       Alert.alert("Erreur", "Impossible de partager le document.", [
//         { text: "OK" },
//       ]);
//     } finally {
//       setIsSharing(false);
//     }
//   };

//   const handlePrintDirect = async () => {
//     if (!pdfUri) return;

//     try {
//       await Print.printAsync({
//         uri: pdfUri,
//       });
//     } catch (error) {
//       console.error("Erreur lors de l'impression:", error);
//       Alert.alert("Erreur d'impression", "Impossible d'imprimer le document.", [
//         { text: "OK" },
//       ]);
//     }
//   };

//   const handleSaveToDisk = async () => {
//     if (!pdfUri) return;

//     try {
//       // Partager le fichier pour permettre à l'utilisateur de le sauvegarder
//       if (await Sharing.isAvailableAsync()) {
//         await Sharing.shareAsync(pdfUri, {
//           mimeType: "application/pdf",
//           dialogTitle: "Sauvegarder le bon de livraison",
//         });
//       }

//       Alert.alert("Succès", "Le document a été préparé pour la sauvegarde.", [
//         { text: "OK" },
//       ]);
//     } catch (error) {
//       console.error("Erreur lors de la sauvegarde:", error);
//       Alert.alert("Erreur", "Impossible de sauvegarder le document.", [
//         { text: "OK" },
//       ]);
//     }
//   };

//   const openPDFExternally = async () => {
//     if (!pdfUri) return;

//     try {
//       await Sharing.shareAsync(pdfUri, {
//         mimeType: "application/pdf",
//         dialogTitle: "Ouvrir le PDF",
//         UTI: "com.adobe.pdf",
//       });
//     } catch (error) {
//       console.error("Erreur lors de l'ouverture:", error);
//       Alert.alert("Erreur", "Impossible d'ouvrir le document.", [
//         { text: "OK" },
//       ]);
//     }
//   };

//   if (isGenerating) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <StatusBar backgroundColor="#03A9F4" barStyle="light-content" />
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#03A9F4" />
//           <Text style={styles.loadingText}>Génération du PDF en cours...</Text>
//           {/* <Text style={styles.loadingSubtext}>
//             Bon de livraison N° {deliveryId}
//           </Text> */}
//         </View>
//       </SafeAreaView>
//     );
//   }

//   // Callbacks pour le gestionnaire Bluetooth - MISE À JOUR
//   const handlePrintSuccess = () => {
//     console.log("Impression Bluetooth réussie");
//     setShowPrinterModal(false);
//   };

//   const handlePrintError = (error) => {
//     console.error("Erreur impression Bluetooth:", error);
//     setShowPrinterModal(false); // CORRECTION ICI - pas setShowBluetoothManager
//   };

//   const handlePrint = async () => {
//     // Essayer d'imprimer directement
//     try {
//       // Le composant va d'abord tenter d'imprimer avec l'imprimante sauvegardée
//       // S'il y a un problème, il affichera automatiquement la modale
//       setShowPrinterModal(true);
//     } catch (error) {
//       console.error("Erreur lors de l'impression:", error);
//       Alert.alert("Erreur", "Impossible d'imprimer le document");
//     }
//   };

//   const handleCloseModal = () => {
//     setShowPrinterModal(false);
//     setCurrentPrintData(null);
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar backgroundColor="#03A9F4" barStyle="light-content" />

//       {/* Informations de la livraison */}
//       <View style={styles.infoBar}>
//         <View style={styles.infoItem}>
//           <MaterialIcons name="person" size={16} color="#666" />
//           <Text style={styles.infoText}>Client: {orderData.client}</Text>
//         </View>
//         <View style={styles.infoItem}>
//           <MaterialIcons name="assignment" size={16} color="#666" />
//           <Text style={styles.infoText}>
//             {documentType === "encaissement" ||
//             documentType === "encaissement_offline"
//               ? `Encaissement : ${encaissementId}`
//               : `Commande : ${orderData.cmd}`}
//           </Text>
//         </View>

//         {/* <View style={styles.infoItem}>
//           <Text style={[styles.infoText, styles.viewModeText]}>
//             Mode: {viewMode === "html" ? "Aperçu" : "PDF"}
//           </Text>
//         </View> */}
//       </View>

//       {/* Contenu principal */}
//       {viewMode === "html" ? (
//         // Affichage HTML optimisé
//         htmlPreview ? (
//           <WebView
//             source={{ html: htmlPreview }}
//             style={styles.webview}
//             startInLoadingState={true}
//             renderLoading={() => (
//               <View style={styles.webviewLoading}>
//                 <ActivityIndicator size="large" color="#03A9F4" />
//                 <Text style={styles.loadingText}>
//                   Chargement de l'aperçu...
//                 </Text>
//               </View>
//             )}
//             scalesPageToFit={true}
//             showsVerticalScrollIndicator={true}
//           />
//         ) : (
//           <View style={styles.loadingContainer}>
//             <ActivityIndicator size="large" color="#03A9F4" />
//             <Text style={styles.loadingText}>Préparation de l'aperçu...</Text>
//           </View>
//         )
//       ) : (
//         // Option PDF externe
//         <View style={styles.pdfContainer}>
//           <View style={styles.pdfPlaceholder}>
//             <MaterialIcons name="picture-as-pdf" size={80} color="#03A9F4" />
//             <Text style={styles.pdfTitle}>Document PDF généré</Text>
//             <Text style={styles.pdfDescription}>
//               Le PDF est prêt. Utilisez les boutons ci-dessous pour l'ouvrir, le
//               partager ou l'imprimer.
//             </Text>
//             <TouchableOpacity
//               style={styles.openPdfButton}
//               onPress={openPDFExternally}
//             >
//               <MaterialIcons name="open-in-new" size={20} color="white" />
//               <Text style={styles.openPdfButtonText}>Ouvrir le PDF</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       )}

//       {/* Boutons d'action en bas */}
//       <View style={styles.actionBar}>
//         <TouchableOpacity
//           style={[styles.actionButton, styles.bluetoothButton]}
//           onPress={handlePrint}
//           disabled={!htmlContent}
//         >
//           <MaterialIcons name="bluetooth" size={20} color="#4CAF50" />
//           <Text style={styles.bluetoothButtonText}>Bluetooth</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.actionButton, styles.printButton]}
//           onPress={handlePrintDirect}
//           disabled={!pdfUri}
//         >
//           <MaterialIcons name="print" size={20} color="#2196F3" />
//           <Text style={styles.actionButtonText}>Système</Text>
//         </TouchableOpacity>
//       </View>

//       <BluetoothPrinterManager
//         visible={showPrinterModal}
//         onClose={handleCloseModal}
//         printData={
//           documentType && documentType === "livraison"
//             ? deliveryData
//             : encaissementData
//         }
//         onPrintSuccess={handlePrintSuccess}
//         onPrintError={handlePrintError}
//         type={documentType}
//       />
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#f5f5f5",
//   },
//   headerButton: {
//     padding: scale(1),
//     backgroundColor: "white",
//     borderRadius: scale(20),
//     marginLeft: wp(2.4), // 10/412 * 100 ≈ 2.4
//   },
//   headerRightContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   headerButtonRight: {
//     padding: scale(3),
//     marginHorizontal: wp(1.9), // 8/412 * 100 ≈ 1.9
//     borderRadius: scale(20),
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     padding: wp(4.9), // 20/412 * 100 ≈ 4.9
//   },
//   loadingText: {
//     fontSize: fs(16),
//     color: "#333",
//     marginTop: hp(1.7), // 16/915 * 100 ≈ 1.7
//     textAlign: "center",
//   },
//   loadingSubtext: {
//     fontSize: fs(14),
//     color: "#666",
//     marginTop: hp(0.9), // 8/915 * 100 ≈ 0.9
//     textAlign: "center",
//   },
//   infoBar: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     backgroundColor: "white",
//     paddingHorizontal: wp(3.9), // 16/412 * 100 ≈ 3.9
//     paddingVertical: hp(1.3), // 12/915 * 100 ≈ 1.3
//     borderBottomWidth: 1,
//     borderBottomColor: "#E0E0E0",
//     flexWrap: "wrap",
//   },
//   infoItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     flex: 1,
//     minWidth: wp(24.3), // 100/412 * 100 ≈ 24.3
//     marginVertical: hp(0.2), // 2/915 * 100 ≈ 0.2
//   },
//   infoText: {
//     fontSize: fs(12),
//     color: "#666",
//     marginLeft: wp(1), // 4/412 * 100 ≈ 1
//   },
//   viewModeText: {
//     fontWeight: fontWeight.semiBold,
//     color: "#03A9F4",
//   },
//   webview: {
//     flex: 1,
//     backgroundColor: "white",
//   },
//   webviewLoading: {
//     position: "absolute",
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "white",
//   },
//   pdfContainer: {
//     flex: 1,
//     backgroundColor: "white",
//   },
//   pdfPlaceholder: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     padding: wp(9.7), // 40/412 * 100 ≈ 9.7
//   },
//   pdfTitle: {
//     fontSize: fs(20),
//     fontWeight: fontWeight.semiBold,
//     color: "#333",
//     marginTop: hp(2.2), // 20/915 * 100 ≈ 2.2
//     textAlign: "center",
//   },
//   pdfDescription: {
//     fontSize: fs(14),
//     color: "#666",
//     marginTop: hp(1.3), // 12/915 * 100 ≈ 1.3
//     textAlign: "center",
//     lineHeight: fs(20),
//   },
//   openPdfButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#03A9F4",
//     paddingHorizontal: wp(5.8), // 24/412 * 100 ≈ 5.8
//     paddingVertical: hp(1.3), // 12/915 * 100 ≈ 1.3
//     borderRadius: scale(8),
//     marginTop: hp(2.6), // 24/915 * 100 ≈ 2.6
//   },
//   openPdfButtonText: {
//     color: "white",
//     fontSize: fs(16),
//     fontWeight: fontWeight.semiBold,
//     marginLeft: wp(1.9), // 8/412 * 100 ≈ 1.9
//   },
//   actionBar: {
//     flexDirection: "row",
//     backgroundColor: "white",
//     paddingHorizontal: wp(3.9), // 16/412 * 100 ≈ 3.9
//     paddingVertical: hp(1.3), // 12/915 * 100 ≈ 1.3
//     borderTopWidth: 1,
//     borderTopColor: "#E0E0E0",
//     justifyContent: "space-around",
//   },
//   actionButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: wp(3.9), // 16/412 * 100 ≈ 3.9
//     paddingVertical: hp(1.1), // 10/915 * 100 ≈ 1.1
//     borderRadius: scale(8),
//     minWidth: wp(72.8), // 300/412 * 100 ≈ 72.8
//     justifyContent: "center",
//   },
//   printButton: {
//     color: "#2196F3",
//   },
//   saveButton: {
//     backgroundColor: "#4CAF50",
//   },
//   shareButton: {
//     backgroundColor: "#FF9800",
//   },
//   actionButtonText: {
//     color: "#2196F3",
//     fontSize: fs(14),
//     fontWeight: fontWeight.semiBold,
//     marginLeft: wp(1), // 4/412 * 100 ≈ 1
//   },

//   actionBar: {
//     flexDirection: "row",
//     backgroundColor: "#fff",
//     padding: 15,
//     borderTopWidth: 1,
//     borderTopColor: "#e0e0e0",
//     gap: 10,
//   },
//   actionButton: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 12,
//     borderRadius: 8,
//     borderWidth: 1,
//   },
//   bluetoothButton: {
//     backgroundColor: "#fff",
//     borderColor: "#4CAF50",
//   },
//   bluetoothButtonText: {
//     color: "#4CAF50",
//     marginLeft: 8,
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   printButton: {
//     backgroundColor: "#fff",
//     borderColor: "#2196F3",
//   },
//   actionButtonText: {
//     color: "#2196F3",
//     marginLeft: 8,
//     fontSize: 16,
//     fontWeight: "600",
//   },
// });

import React, { useEffect, useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  BackHandler,
} from "react-native";
import { WebView } from "react-native-webview";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";

const { width, height } = Dimensions.get("window");
import { wp, hp, fs, fontWeight, scale } from "../utils/responsive";
import BluetoothPrinterManager from "../components/BluetoothPrinterManager";

export const PDFViewerScreen = ({ route }) => {
  const navigation = useNavigation();
  const {
    htmlContent, // PDF A4
    htmlContentThermal, // PDF Ticket
    encaissementId,
    deliveryId,
    documentType,
    orderData,
    deliveryItems,
    userData,
    clientData,
    deliveryData,
    encaissementData,
  } = route.params;

  const client = clientData;
  const [pdfUri, setPdfUri] = useState(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [htmlPreview, setHtmlPreview] = useState(null);
  const [viewMode, setViewMode] = useState("html");

  // NOUVEAU : État pour le format sélectionné (uniquement pour livraison)
  const [selectedFormat, setSelectedFormat] = useState("a4"); // 'a4' ou 'ticket'
  const [currentHtmlContent, setCurrentHtmlContent] = useState(htmlContent);

  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [showBluetoothManager, setShowBluetoothManager] = useState(false);
  const [currentPrintData, setCurrentPrintData] = useState(null);

  // NOUVEAU : Effet pour changer le contenu HTML selon le format (uniquement pour livraison)
  useEffect(() => {
    if (documentType === "livraison") {
      if (selectedFormat === "a4") {
        setCurrentHtmlContent(htmlContent);
      } else {
        setCurrentHtmlContent(htmlContentThermal);
      }
    } else {
      // Pour les autres types de documents, utiliser htmlContent par défaut
      setCurrentHtmlContent(htmlContent);
    }
  }, [selectedFormat, htmlContent, htmlContentThermal, documentType]);

  // Régénérer le PDF quand le format change
  useEffect(() => {
    if (currentHtmlContent) {
      generatePDF();
      prepareHtmlPreview();
    }
  }, [currentHtmlContent]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: `Impression Document`,
      headerStyle: {
        backgroundColor: "#03A9F4",
      },
      headerTintColor: "white",
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate("Tabs", { client })}
        >
          <MaterialCommunityIcons
            name="arrow-left-circle"
            size={30}
            color="white"
            style={{ marginLeft: 15 }}
          />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={styles.headerRightContainer}>
          <TouchableOpacity
            onPress={handleSharePDF}
            style={styles.headerButtonRight}
            disabled={!pdfUri || isSharing}
          >
            {isSharing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <MaterialIcons name="share" size={24} color="white" />
            )}
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, deliveryId, pdfUri, isSharing, viewMode]);

  useEffect(() => {
    const handleBackPress = () => {
      navigation.navigate("Tabs", { client });
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress,
    );
    return () => backHandler.remove();
  }, [navigation]);

  const prepareHtmlPreview = () => {
    const mobileOptimizedHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: Arial, sans-serif;
              background-color: #fff;
              // ${documentType === "livraison" && selectedFormat === "ticket" ? "zoom: 1.2;" : "zoom: 0.6;"}
           ${
             documentType === "livraison"
               ? selectedFormat === "ticket"
                 ? "zoom: 1.2;"
                 : "zoom: 0.6;"
               : "zoom: 1.2;"
           }
            }
            .container {
              max-width: 100%;
              margin: 0 auto;
            }
            @media (max-width: 768px) {
              body {
                padding: 10px;
                margin: auto;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            ${currentHtmlContent}
          </div>
        </body>
      </html>
    `;
    setHtmlPreview(mobileOptimizedHtml);
  };

  const generatePDF = async () => {
    try {
      setIsGenerating(true);
      console.log(
        "Génération du PDF...",
        documentType === "livraison" ? selectedFormat : "default",
      );

      // Configuration selon le format
      let pdfConfig = {
        base64: false,
      };

      // Pour le ticket (uniquement pour livraison), forcer une largeur de 80mm
      if (documentType === "livraison" && selectedFormat === "ticket") {
        pdfConfig.width = 226; // 80mm en pixels
      }
      // Pour A4 ou autres types de documents, ne pas spécifier de width

      const { uri } = await Print.printToFileAsync({
        html: currentHtmlContent,
        ...pdfConfig,
      });

      console.log("PDF généré:", uri);

      const fileName = `document_${deliveryId}_${documentType === "livraison" ? selectedFormat : "default"}_${Date.now()}.pdf`;
      const newUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.copyAsync({
        from: uri,
        to: newUri,
      });

      setPdfUri(newUri);
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
      Alert.alert("Erreur", "Impossible de générer le document PDF.", [
        {
          text: "Réessayer",
          onPress: generatePDF,
        },
        {
          text: "Retour",
          onPress: () => navigation.goBack(),
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSharePDF = async () => {
    if (!pdfUri) return;

    try {
      setIsSharing(true);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: "application/pdf",
          dialogTitle: "Partager le bon de livraison",
          UTI: "com.adobe.pdf",
        });
      } else {
        await Print.printAsync({
          uri: pdfUri,
        });
      }
    } catch (error) {
      console.error("Erreur lors du partage:", error);
      Alert.alert("Erreur", "Impossible de partager le document.", [
        { text: "OK" },
      ]);
    } finally {
      setIsSharing(false);
    }
  };

  const handlePrintDirect = async () => {
    if (!pdfUri) return;

    try {
      await Print.printAsync({
        uri: pdfUri,
      });
    } catch (error) {
      console.error("Erreur lors de l'impression:", error);
      Alert.alert("Erreur d'impression", "Impossible d'imprimer le document.", [
        { text: "OK" },
      ]);
    }
  };

  const handlePrintSuccess = () => {
    console.log("Impression Bluetooth réussie");
    setShowPrinterModal(false);
  };

  const handlePrintError = (error) => {
    console.error("Erreur impression Bluetooth:", error);
    setShowPrinterModal(false);
  };

  const handlePrint = async () => {
    try {
      setShowPrinterModal(true);
    } catch (error) {
      console.error("Erreur lors de l'impression:", error);
      Alert.alert("Erreur", "Impossible d'imprimer le document");
    }
  };

  const handleCloseModal = () => {
    setShowPrinterModal(false);
    setCurrentPrintData(null);
  };

  if (isGenerating) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#03A9F4" barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#03A9F4" />
          <Text style={styles.loadingText}>Génération du PDF en cours...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#03A9F4" barStyle="light-content" />

      {/* Informations de la livraison */}
      <View style={styles.infoBar}>
        <View style={styles.infoItem}>
          <MaterialIcons name="person" size={16} color="#666" />
          <Text style={styles.infoText}>Client: {orderData.client}</Text>
        </View>
        <View style={styles.infoItem}>
          <MaterialIcons name="assignment" size={16} color="#666" />
          <Text style={styles.infoText}>
            {documentType === "encaissement" ||
            documentType === "encaissement_offline"
              ? `Encaissement : ${encaissementId}`
              : `Commande : ${orderData.cmd}`}
          </Text>
        </View>
      </View>

      {/* NOUVEAU : Sélecteur de format (uniquement pour livraison) */}
      {documentType === "livraison" && (
        <View style={styles.formatSelector}>
          <TouchableOpacity
            style={[
              styles.formatButton,
              selectedFormat === "ticket" && styles.formatButtonActive,
            ]}
            onPress={() => setSelectedFormat("ticket")}
          >
            <MaterialIcons
              name="receipt"
              size={20}
              color={selectedFormat === "ticket" ? "#fff" : "#03A9F4"}
            />
            <Text
              style={[
                styles.formatButtonText,
                selectedFormat === "ticket" && styles.formatButtonTextActive,
              ]}
            >
              Ticket (80mm)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.formatButton,
              selectedFormat === "a4" && styles.formatButtonActive,
            ]}
            onPress={() => setSelectedFormat("a4")}
          >
            <MaterialIcons
              name="description"
              size={20}
              color={selectedFormat === "a4" ? "#fff" : "#03A9F4"}
            />
            <Text
              style={[
                styles.formatButtonText,
                selectedFormat === "a4" && styles.formatButtonTextActive,
              ]}
            >
              Format A4
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Contenu principal */}
      {viewMode === "html" ? (
        htmlPreview ? (
          <WebView
            source={{ html: htmlPreview }}
            style={styles.webview}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.webviewLoading}>
                <ActivityIndicator size="large" color="#03A9F4" />
                <Text style={styles.loadingText}>
                  Chargement de l'aperçu...
                </Text>
              </View>
            )}
            scalesPageToFit={true}
            showsVerticalScrollIndicator={true}
          />
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#03A9F4" />
            <Text style={styles.loadingText}>Préparation de l'aperçu...</Text>
          </View>
        )
      ) : (
        <View style={styles.pdfContainer}>
          <View style={styles.pdfPlaceholder}>
            <MaterialIcons name="picture-as-pdf" size={80} color="#03A9F4" />
            <Text style={styles.pdfTitle}>Document PDF généré</Text>
            <Text style={styles.pdfDescription}>
              Le PDF est prêt. Utilisez les boutons ci-dessous pour l'ouvrir, le
              partager ou l'imprimer.
            </Text>
          </View>
        </View>
      )}

      {/* Boutons d'action en bas */}
      <View style={styles.actionBar}>
        {/* Bouton Bluetooth visible seulement pour livraison en format ticket */}
        {documentType === "livraison" && selectedFormat === "ticket" && (
          <TouchableOpacity
            style={[styles.actionButton, styles.bluetoothButton]}
            onPress={handlePrint}
            disabled={!currentHtmlContent}
          >
            <MaterialIcons name="bluetooth" size={20} color="#4CAF50" />
            <Text style={styles.bluetoothButtonText}>Bluetooth</Text>
          </TouchableOpacity>
        )}

        {/* Bouton Bluetooth pour les encaissements */}
        {(documentType === "encaissement" ||
          documentType === "encaissement_offline") && (
          <TouchableOpacity
            style={[styles.actionButton, styles.bluetoothButton]}
            onPress={handlePrint}
            disabled={!currentHtmlContent}
          >
            <MaterialIcons name="bluetooth" size={20} color="#4CAF50" />
            <Text style={styles.bluetoothButtonText}>Bluetooth</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.printButton]}
          onPress={handlePrintDirect}
          disabled={!pdfUri}
        >
          <MaterialIcons name="print" size={20} color="#2196F3" />
          <Text style={styles.actionButtonText}>Système</Text>
        </TouchableOpacity>
      </View>

      <BluetoothPrinterManager
        visible={showPrinterModal}
        onClose={handleCloseModal}
        printData={
          documentType && documentType === "livraison"
            ? deliveryData
            : encaissementData
        }
        onPrintSuccess={handlePrintSuccess}
        onPrintError={handlePrintError}
        type={documentType}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  headerButton: {
    padding: scale(1),
    backgroundColor: "white",
    borderRadius: scale(20),
    marginLeft: wp(2.4),
  },
  headerRightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButtonRight: {
    padding: scale(3),
    marginHorizontal: wp(1.9),
    borderRadius: scale(20),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: wp(4.9),
  },
  loadingText: {
    fontSize: fs(16),
    color: "#333",
    marginTop: hp(1.7),
    textAlign: "center",
  },
  loadingSubtext: {
    fontSize: fs(14),
    color: "#666",
    marginTop: hp(0.9),
    textAlign: "center",
  },
  infoBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "white",
    paddingHorizontal: wp(3.9),
    paddingVertical: hp(1.3),
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    flexWrap: "wrap",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: wp(24.3),
    marginVertical: hp(0.2),
  },
  infoText: {
    fontSize: fs(12),
    color: "#666",
    marginLeft: wp(1),
  },
  viewModeText: {
    fontWeight: fontWeight.semiBold,
    color: "#03A9F4",
  },

  // NOUVEAUX STYLES pour le sélecteur de format
  formatSelector: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },

  formatButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#03A9F4",
    backgroundColor: "#fff",
    gap: 8,
  },

  formatButtonActive: {
    backgroundColor: "#03A9F4",
    borderColor: "#03A9F4",
  },

  formatButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#03A9F4",
  },

  formatButtonTextActive: {
    color: "#fff",
  },

  webview: {
    flex: 1,
    backgroundColor: "white",
  },
  webviewLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  pdfContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  pdfPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: wp(9.7),
  },
  pdfTitle: {
    fontSize: fs(20),
    fontWeight: fontWeight.semiBold,
    color: "#333",
    marginTop: hp(2.2),
    textAlign: "center",
  },
  pdfDescription: {
    fontSize: fs(14),
    color: "#666",
    marginTop: hp(1.3),
    textAlign: "center",
    lineHeight: fs(20),
  },
  openPdfButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#03A9F4",
    paddingHorizontal: wp(5.8),
    paddingVertical: hp(1.3),
    borderRadius: scale(8),
    marginTop: hp(2.6),
  },
  openPdfButtonText: {
    color: "white",
    fontSize: fs(16),
    fontWeight: fontWeight.semiBold,
    marginLeft: wp(1.9),
  },
  actionBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  bluetoothButton: {
    backgroundColor: "#fff",
    borderColor: "#4CAF50",
  },
  bluetoothButtonText: {
    color: "#4CAF50",
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
  },
  printButton: {
    backgroundColor: "#fff",
    borderColor: "#2196F3",
  },
  actionButtonText: {
    color: "#2196F3",
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
  },
});
