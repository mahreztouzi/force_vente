// import React, { useState, useRef, useEffect } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   TextInput,
//   StatusBar,
//   SafeAreaView,
//   ActivityIndicator,
//   KeyboardAvoidingView,
//   Platform,
//   Alert,
//   Keyboard,
//   ScrollView,
// } from "react-native";
// import {
//   MaterialIcons,
//   MaterialCommunityIcons,
//   Feather,
// } from "@expo/vector-icons";
// import { useNavigation } from "@react-navigation/native";
// import { printForms } from "../services/printFormsService";
// import * as FileSystem from "expo-file-system";
// import * as Sharing from "expo-sharing";
// import * as Print from "expo-print";
// import AsyncStorage from "@react-native-async-storage/async-storage";

// export const DocumentViewerScreen = () => {
//   const navigation = useNavigation();
//   const [documentNumber, setDocumentNumber] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [isPrintSuccess, setIsPrintSuccess] = useState(false);
//   const [validatedNumbers, setValidatedNumbers] = useState([]);
//   const inputRef = useRef(null);

//   const STORAGE_KEY = "validated_document_numbers";

//   // Charger l'historique des numéros validés depuis le localStorage
//   useEffect(() => {
//     const loadValidatedNumbers = async () => {
//       try {
//         const storedNumbers = await AsyncStorage.getItem(STORAGE_KEY);
//         if (storedNumbers) {
//           setValidatedNumbers(JSON.parse(storedNumbers));
//         }
//       } catch (error) {
//         console.error("Erreur lors du chargement de l'historique:", error);
//       }
//     };

//     loadValidatedNumbers();
//   }, []);

//   useEffect(() => {
//     if (isPrintSuccess) {
//       // Réinitialiser après 3 secondes
//       const timer = setTimeout(() => {
//         setIsPrintSuccess(false);
//         setDocumentNumber("");
//       }, 3000);
//       return () => clearTimeout(timer);
//     }
//   }, [isPrintSuccess]);

//   // Configurer la barre de navigation
//   useEffect(() => {
//     navigation.setOptions({
//       title: "Impression de document",
//       headerStyle: {
//         backgroundColor: "#03A9F4",
//       },
//       headerTintColor: "white",
//       headerLeft: () => (
//         <TouchableOpacity
//           style={styles.headerButton}
//           onPress={() => navigation.goBack()}
//         >
//           <MaterialCommunityIcons
//             name="arrow-left-circle"
//             size={30}
//             color="white"
//             style={{ marginLeft: 1 }}
//           />
//         </TouchableOpacity>
//       ),
//       headerRight: () => (
//         <TouchableOpacity
//           style={styles.headerButton}
//           onPress={() => {
//             Alert.alert(
//               "Aide",
//               "Saisissez le numéro du document et appuyez sur 'Imprimer' pour lancer l'impression directe."
//             );
//           }}
//         >
//           <MaterialIcons name="help-outline" size={24} color="white" />
//         </TouchableOpacity>
//       ),
//     });
//   }, [navigation]);

//   // Focus sur l'input au chargement
//   useEffect(() => {
//     setTimeout(() => {
//       inputRef.current?.focus();
//     }, 300);
//   }, []);

//   // Fonction pour sauvegarder l'historique dans le localStorage
//   const saveValidatedNumbers = async (numbers) => {
//     try {
//       await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(numbers));
//     } catch (error) {
//       console.error("Erreur lors de la sauvegarde de l'historique:", error);
//     }
//   };

//   // Fonction pour ajouter un numéro validé
//   const addValidatedNumber = (number) => {
//     if (!validatedNumbers.includes(number)) {
//       const newValidatedNumbers = [number, ...validatedNumbers];
//       setValidatedNumbers(newValidatedNumbers);
//       saveValidatedNumbers(newValidatedNumbers);
//     }
//   };

//   // Fonction pour supprimer un numéro validé
//   const removeValidatedNumber = (number) => {
//     const newValidatedNumbers = validatedNumbers.filter(
//       (num) => num !== number
//     );
//     setValidatedNumbers(newValidatedNumbers);
//     saveValidatedNumbers(newValidatedNumbers);
//   };

//   // Fonction pour gérer l'impression
//   const handlePrint = async () => {
//     if (!documentNumber.trim()) {
//       Alert.alert("Erreur", "Veuillez saisir un numéro de document");
//       return;
//     }

//     Keyboard.dismiss();
//     setIsLoading(true);

//     try {
//       // ZLIV est le type de document, vous pouvez l'adapter selon votre besoin
//       const response = await printForms(documentNumber.trim(), "ZLIV");

//       // Conversion du Blob en base64 pour l'impression
//       const reader = new FileReader();

//       reader.onload = async () => {
//         const base64Data = reader.result.split(",")[1];
//         const fileUri =
//           FileSystem.documentDirectory +
//           `document_${documentNumber.trim()}.pdf`;

//         await FileSystem.writeAsStringAsync(fileUri, base64Data, {
//           encoding: FileSystem.EncodingType.Base64,
//         });

//         // Impression directe sur les plateformes compatibles
//         if (Platform.OS === "ios" || Platform.OS === "android") {
//           await Print.printAsync({ uri: fileUri });
//         } else if (await Sharing.isAvailableAsync()) {
//           await Sharing.shareAsync(fileUri);
//         }

//         // Ajouter à l'historique des numéros validés
//         addValidatedNumber(documentNumber.trim());

//         setIsLoading(false);
//         setIsPrintSuccess(true);
//       };

//       reader.readAsDataURL(
//         new Blob([response.data], { type: "application/pdf" })
//       );
//     } catch (error) {
//       console.error("Erreur lors de l'impression:", error);
//       setIsLoading(false);
//       Alert.alert(
//         "Erreur d'impression",
//         "Impossible d'imprimer le document. Vérifiez que le numéro est correct."
//       );
//     }
//   };

//   // Fonction pour sélectionner un document de l'historique
//   const selectHistoryDocument = (number) => {
//     setDocumentNumber(number);
//     setTimeout(() => {
//       handlePrint();
//     }, 300);
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar backgroundColor="#03A9F4" barStyle="light-content" />

//       <KeyboardAvoidingView
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//         style={styles.keyboardAvoidingView}
//       >
//         <ScrollView style={styles.contentContainer}>
//           {/* Icon et titre */}
//           <View style={styles.headerSection}>
//             <View style={styles.iconCircle}>
//               <MaterialCommunityIcons
//                 name="printer"
//                 size={40}
//                 color="#3F51B5"
//               />
//             </View>
//             <Text style={styles.headerTitle}>Impression de document</Text>
//             <Text style={styles.headerSubtitle}>
//               Saisissez le numéro du document à imprimer
//             </Text>
//           </View>

//           {/* Formulaire */}
//           <View style={styles.formContainer}>
//             <View style={styles.inputContainer}>
//               <TextInput
//                 ref={inputRef}
//                 style={styles.input}
//                 placeholder="N° du document"
//                 placeholderTextColor="#9E9E9E"
//                 value={documentNumber}
//                 onChangeText={setDocumentNumber}
//                 keyboardType="default"
//                 autoCapitalize="characters"
//                 returnKeyType="go"
//                 onSubmitEditing={handlePrint}
//               />
//               {documentNumber.length > 0 && (
//                 <TouchableOpacity
//                   style={styles.clearButton}
//                   onPress={() => setDocumentNumber("")}
//                 >
//                   <Feather name="x" size={18} color="#757575" />
//                 </TouchableOpacity>
//               )}
//             </View>

//             <TouchableOpacity
//               style={[
//                 styles.printButton,
//                 (!documentNumber.trim() || isLoading) && styles.disabledButton,
//               ]}
//               onPress={handlePrint}
//               disabled={!documentNumber.trim() || isLoading}
//             >
//               {isLoading ? (
//                 <ActivityIndicator color="white" size="small" />
//               ) : isPrintSuccess ? (
//                 <View style={styles.successButtonContent}>
//                   <MaterialIcons name="check-circle" size={20} color="white" />
//                   <Text style={styles.buttonText}>Imprimé avec succès</Text>
//                 </View>
//               ) : (
//                 <View style={styles.buttonContent}>
//                   <MaterialCommunityIcons
//                     name="printer"
//                     size={20}
//                     color="white"
//                   />
//                   <Text style={styles.buttonText}>Imprimer</Text>
//                 </View>
//               )}
//             </TouchableOpacity>
//           </View>

//           {/* Historique des numéros validés */}
//           {validatedNumbers.length > 0 && (
//             <View style={styles.historyContainer}>
//               <Text style={styles.historyTitle}>Historique des numéros</Text>
//               <View style={styles.historyGrid}>
//                 {validatedNumbers.map((number, index) => (
//                   <View key={index} style={styles.bubbleContainer}>
//                     <TouchableOpacity
//                       style={styles.bubble}
//                       onPress={() => selectHistoryDocument(number)}
//                     >
//                       <Text style={styles.bubbleText}>{number}</Text>
//                       <TouchableOpacity
//                         style={styles.removeBubble}
//                         onPress={() => removeValidatedNumber(number)}
//                       >
//                         <Feather name="x" size={16} color="white" />
//                       </TouchableOpacity>
//                     </TouchableOpacity>
//                   </View>
//                 ))}
//               </View>
//             </View>
//           )}
//         </ScrollView>
//       </KeyboardAvoidingView>

//       {/* Barre de statut */}
//       {isLoading && (
//         <View style={styles.statusBar}>
//           <ActivityIndicator size="small" color="white" />
//           <Text style={styles.statusText}>Impression en cours...</Text>
//         </View>
//       )}
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#F5F7FA",
//   },
//   keyboardAvoidingView: {
//     flex: 1,
//   },
//   contentContainer: {
//     flex: 1,
//     padding: 20,
//   },
//   headerButton: {
//     padding: 8,
//   },
//   headerSection: {
//     alignItems: "center",
//     marginVertical: 30,
//   },
//   iconCircle: {
//     width: 90,
//     height: 90,
//     borderRadius: 45,
//     backgroundColor: "#E8EAF6",
//     justifyContent: "center",
//     alignItems: "center",
//     marginBottom: 20,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//     elevation: 2,
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: "#212121",
//     marginBottom: 8,
//   },
//   headerSubtitle: {
//     fontSize: 16,
//     color: "#757575",
//     textAlign: "center",
//   },
//   formContainer: {
//     backgroundColor: "white",
//     borderRadius: 10,
//     padding: 20,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.08,
//     shadowRadius: 2,
//     elevation: 1,
//     marginBottom: 20,
//   },
//   inputContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     borderWidth: 1,
//     borderColor: "#E0E0E0",
//     borderRadius: 8,
//     paddingHorizontal: 12,
//     marginBottom: 16,
//     backgroundColor: "#FAFAFA",
//   },
//   input: {
//     flex: 1,
//     height: 50,
//     fontSize: 16,
//     color: "#212121",
//   },
//   clearButton: {
//     padding: 6,
//   },
//   printButton: {
//     backgroundColor: "#3F51B5",
//     borderRadius: 8,
//     height: 50,
//     justifyContent: "center",
//     alignItems: "center",
//     flexDirection: "row",
//   },
//   disabledButton: {
//     backgroundColor: "#9E9E9E",
//   },
//   buttonContent: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   successButtonContent: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   buttonText: {
//     color: "white",
//     fontSize: 16,
//     fontWeight: "600",
//     marginLeft: 8,
//   },
//   historyContainer: {
//     backgroundColor: "white",
//     borderRadius: 10,
//     padding: 16,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.08,
//     shadowRadius: 2,
//     elevation: 1,
//     marginBottom: 20,
//   },
//   historyTitle: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#212121",
//     marginBottom: 12,
//   },
//   historyGrid: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     marginHorizontal: -5,
//   },
//   bubbleContainer: {
//     width: "33.33%",
//     padding: 5,
//   },
//   bubble: {
//     display: "flex",
//     backgroundColor: "#ededed",
//     borderRadius: 20,
//     paddingVertical: 5,
//     paddingHorizontal: 12,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     position: "relative",
//   },
//   bubbleText: {
//     color: "black",
//     fontWeight: "500",
//     textAlign: "center",
//     marginRight: 10,
//     marginLeft: 3,
//   },
//   removeBubble: {
//     // position: "absolute",
//     // right: 5,
//     // top: "50%",
//     // marginTop: -10,
//     width: 20,
//     height: 20,
//     borderRadius: 10,
//     backgroundColor: "rgba(0,0,0,0.2)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   statusBar: {
//     position: "absolute",
//     bottom: 0,
//     left: 0,
//     right: 0,
//     backgroundColor: "#3F51B5",
//     padding: 12,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   statusText: {
//     color: "white",
//     marginLeft: 8,
//     fontSize: 14,
//     fontWeight: "500",
//   },
// });

// import React, { useState, useRef, useEffect } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   TextInput,
//   StatusBar,
//   SafeAreaView,
//   ActivityIndicator,
//   KeyboardAvoidingView,
//   Platform,
//   Alert,
//   Keyboard,
//   ScrollView,
// } from "react-native";
// import {
//   MaterialIcons,
//   MaterialCommunityIcons,
//   Feather,
// } from "@expo/vector-icons";
// import { useNavigation } from "@react-navigation/native";
// import { printForms } from "../services/printFormsService";
// import * as FileSystem from "expo-file-system";
// import * as Sharing from "expo-sharing";
// import * as Print from "expo-print";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useLayoutEffect } from "react";

// export const DocumentViewerScreen = () => {
//   const navigation = useNavigation();
//   const [documentNumber, setDocumentNumber] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [isPrintSuccess, setIsPrintSuccess] = useState(false);
//   const [validatedNumbers, setValidatedNumbers] = useState([]);
//   const inputRef = useRef(null);

//   const STORAGE_KEY = "validated_document_numbers";

//   // Charger l'historique des numéros validés depuis le localStorage
//   useEffect(() => {
//     const loadValidatedNumbers = async () => {
//       try {
//         const storedNumbers = await AsyncStorage.getItem(STORAGE_KEY);
//         if (storedNumbers) {
//           setValidatedNumbers(JSON.parse(storedNumbers));
//         }
//       } catch (error) {
//         console.error("Erreur lors du chargement de l'historique:", error);
//       }
//     };

//     loadValidatedNumbers();
//   }, []);

//   useEffect(() => {
//     if (isPrintSuccess) {
//       // Réinitialiser après 3 secondes
//       const timer = setTimeout(() => {
//         setIsPrintSuccess(false);
//         setDocumentNumber("");
//       }, 3000);
//       return () => clearTimeout(timer);
//     }
//   }, [isPrintSuccess]);

//   // Configurer la barre de navigation
//   useLayoutEffect(() => {
//     navigation.setOptions({
//       title: "Impression de document",
//       headerStyle: {
//         backgroundColor: "#03A9F4",
//       },
//       headerTintColor: "white",
//       headerLeft: () => (
//         <TouchableOpacity
//           style={styles.headerButton}
//           onPress={() => navigation.goBack()}
//         >
//           <MaterialCommunityIcons
//             name="arrow-left-circle"
//             size={30}
//             color="white"
//             style={{ marginLeft: 5 }}
//           />
//         </TouchableOpacity>
//       ),
//       headerRight: () => (
//         <TouchableOpacity
//           style={styles.headerButton}
//           onPress={() => {
//             Alert.alert(
//               "Aide",
//               "Saisissez le numéro du document (maximum 10 chiffres) et appuyez sur 'Imprimer' pour lancer l'impression directe."
//             );
//           }}
//         >
//           <MaterialIcons name="help-outline" size={24} color="white" />
//         </TouchableOpacity>
//       ),
//     });
//   }, [navigation]);

//   // Focus sur l'input au chargement
//   useEffect(() => {
//     setTimeout(() => {
//       inputRef.current?.focus();
//     }, 300);
//   }, []);

//   // Fonction pour sauvegarder l'historique dans le localStorage
//   const saveValidatedNumbers = async (numbers) => {
//     try {
//       await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(numbers));
//     } catch (error) {
//       console.error("Erreur lors de la sauvegarde de l'historique:", error);
//     }
//   };

//   // Fonction pour ajouter un numéro validé
//   const addValidatedNumber = (number) => {
//     if (!validatedNumbers.includes(number)) {
//       const newValidatedNumbers = [number, ...validatedNumbers];
//       setValidatedNumbers(newValidatedNumbers);
//       saveValidatedNumbers(newValidatedNumbers);
//     }
//   };

//   // Fonction pour supprimer un numéro validé
//   const removeValidatedNumber = (number) => {
//     const newValidatedNumbers = validatedNumbers.filter(
//       (num) => num !== number
//     );
//     setValidatedNumbers(newValidatedNumbers);
//     saveValidatedNumbers(newValidatedNumbers);
//   };

//   // Fonction pour valider et mettre à jour le numéro de document
//   const handleDocumentNumberChange = (text) => {
//     // Ne conserver que les chiffres
//     const numbersOnly = text.replace(/[^0-9]/g, "");

//     // Limiter à 10 caractères
//     if (numbersOnly.length <= 10) {
//       setDocumentNumber(numbersOnly);
//     }
//   };

//   // Fonction pour gérer l'impression
//   const handlePrint = async () => {
//     if (!documentNumber.trim()) {
//       Alert.alert("Erreur", "Veuillez saisir un numéro de document");
//       return;
//     }

//     Keyboard.dismiss();
//     setIsLoading(true);

//     try {
//       // ZLIV est le type de document, vous pouvez l'adapter selon votre besoin
//       const response = await printForms(documentNumber.trim(), "ZLIV");

//       // Conversion du Blob en base64 pour l'impression
//       const reader = new FileReader();

//       reader.onload = async () => {
//         const base64Data = reader.result.split(",")[1];
//         const fileUri =
//           FileSystem.documentDirectory +
//           `document_${documentNumber.trim()}.pdf`;

//         await FileSystem.writeAsStringAsync(fileUri, base64Data, {
//           encoding: FileSystem.EncodingType.Base64,
//         });

//         // Impression directe sur les plateformes compatibles
//         if (Platform.OS === "ios" || Platform.OS === "android") {
//           await Print.printAsync({ uri: fileUri });
//         } else if (await Sharing.isAvailableAsync()) {
//           await Sharing.shareAsync(fileUri);
//         }

//         // Ajouter à l'historique des numéros validés
//         addValidatedNumber(documentNumber.trim());

//         setIsLoading(false);
//         setIsPrintSuccess(true);
//       };

//       reader.readAsDataURL(
//         new Blob([response.data], { type: "application/pdf" })
//       );
//     } catch (error) {
//       console.error("Erreur lors de l'impression:", error);
//       setIsLoading(false);
//       Alert.alert(
//         "Erreur d'impression",
//         "Impossible d'imprimer le document. Vérifiez que le numéro est correct."
//       );
//     }
//   };

//   // Dans votre composant
//   useEffect(() => {
//     // Ne déclencher l'impression que si le numéro est dans l'historique
//     // (pour éviter des impressions accidentelles lors de la saisie manuelle)
//     if (documentNumber && validatedNumbers.includes(documentNumber)) {
//       const timer = setTimeout(() => {
//         handlePrint();
//       }, 600);

//       return () => clearTimeout(timer);
//     }
//   }, [documentNumber]);

//   // Fonction simplifiée
//   const selectHistoryDocument = (number) => {
//     setDocumentNumber(number);
//     inputRef.current?.focus(); // Optionnel
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar backgroundColor="#03A9F4" barStyle="light-content" />

//       <KeyboardAvoidingView
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//         style={styles.keyboardAvoidingView}
//       >
//         <ScrollView style={styles.contentContainer}>
//           {/* Icon et titre */}
//           <View style={styles.headerSection}>
//             <View style={styles.iconCircle}>
//               <MaterialCommunityIcons
//                 name="printer"
//                 size={40}
//                 color="#006475"
//               />
//             </View>
//             <Text style={styles.headerTitle}>Impression de document</Text>
//             <Text style={styles.headerSubtitle}>
//               Saisissez le numéro du document à imprimer.
//             </Text>
//           </View>

//           {/* Formulaire */}
//           <View style={styles.formContainer}>
//             <View style={styles.inputContainer}>
//               <TextInput
//                 ref={inputRef}
//                 style={styles.input}
//                 placeholder="N° du document (chiffres uniquement)"
//                 placeholderTextColor="#9E9E9E"
//                 value={documentNumber}
//                 onChangeText={handleDocumentNumberChange}
//                 keyboardType="numeric"
//                 maxLength={10}
//                 returnKeyType="go"
//                 onSubmitEditing={handlePrint}
//               />
//               {documentNumber.length > 0 && (
//                 <TouchableOpacity
//                   style={styles.clearButton}
//                   onPress={() => setDocumentNumber("")}
//                 >
//                   <Feather name="x" size={18} color="#757575" />
//                 </TouchableOpacity>
//               )}
//             </View>

//             {/* Compteur de caractères */}
//             {/* <View style={styles.counterContainer}>
//               <Text style={styles.counterText}>
//                 {documentNumber.length}/10 caractères
//               </Text>
//             </View> */}

//             <TouchableOpacity
//               style={[
//                 styles.printButton,
//                 (!documentNumber.trim() || isLoading) && styles.disabledButton,
//               ]}
//               onPress={handlePrint}
//               disabled={!documentNumber.trim() || isLoading}
//             >
//               {isLoading ? (
//                 <ActivityIndicator color="white" size="small" />
//               ) : isPrintSuccess ? (
//                 <View style={styles.successButtonContent}>
//                   <MaterialIcons name="check-circle" size={20} color="white" />
//                   <Text style={styles.buttonText}>Imprimé avec succès</Text>
//                 </View>
//               ) : (
//                 <View style={styles.buttonContent}>
//                   <MaterialCommunityIcons
//                     name="printer"
//                     size={20}
//                     color="white"
//                   />
//                   <Text style={styles.buttonText}>Imprimer</Text>
//                 </View>
//               )}
//             </TouchableOpacity>
//           </View>

//           {/* Historique des numéros validés */}
//           {validatedNumbers.length > 0 && (
//             <View style={styles.historyContainer}>
//               <View style={styles.histyoryHeader}>
//                 <MaterialCommunityIcons
//                   name="history"
//                   size={28}
//                   color="black"
//                   style={{ marginRight: 5 }}
//                 />
//                 <Text style={styles.historyTitle}>Historique :</Text>
//               </View>
//               <View style={styles.historyGrid}>
//                 {validatedNumbers.map((number, index) => (
//                   <View key={index} style={styles.bubbleContainer}>
//                     <TouchableOpacity
//                       style={styles.bubble}
//                       onPress={() => selectHistoryDocument(number)}
//                     >
//                       <Text style={styles.bubbleText}>{number}</Text>
//                       <TouchableOpacity
//                         style={styles.removeBubble}
//                         onPress={(e) => {
//                           e.stopPropagation();
//                           removeValidatedNumber(number);
//                         }}
//                       >
//                         <Feather name="x" size={16} color="white" />
//                       </TouchableOpacity>
//                     </TouchableOpacity>
//                   </View>
//                 ))}
//               </View>
//             </View>
//           )}
//         </ScrollView>
//       </KeyboardAvoidingView>

//       {/* Barre de statut */}
//       {/* {isLoading && (
//         <View style={styles.statusBar}>
//           <ActivityIndicator size="small" color="white" />
//           <Text style={styles.statusText}>Impression en cours...</Text>
//         </View>
//       )} */}
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#F5F7FA",
//   },
//   keyboardAvoidingView: {
//     flex: 1,
//   },
//   contentContainer: {
//     flex: 1,
//     padding: 20,
//   },
//   headerButton: {
//     padding: 8,
//   },
//   headerSection: {
//     alignItems: "center",
//     marginVertical: 30,
//   },
//   iconCircle: {
//     width: 90,
//     height: 90,
//     borderRadius: 45,
//     backgroundColor: "#E8EAF6",
//     justifyContent: "center",
//     alignItems: "center",
//     marginBottom: 20,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//     elevation: 2,
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: "#212121",
//     marginBottom: 8,
//   },
//   headerSubtitle: {
//     fontSize: 16,
//     color: "#757575",
//     textAlign: "center",
//   },
//   formContainer: {
//     backgroundColor: "white",
//     borderRadius: 10,
//     padding: 20,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.08,
//     shadowRadius: 2,
//     elevation: 1,
//     marginBottom: 20,
//   },
//   inputContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     borderWidth: 1,
//     borderColor: "#E0E0E0",
//     borderRadius: 8,
//     paddingHorizontal: 12,
//     marginBottom: 16,
//     backgroundColor: "#FAFAFA",
//   },
//   input: {
//     flex: 1,
//     height: 50,
//     fontSize: 16,
//     color: "#212121",
//   },
//   clearButton: {
//     padding: 6,
//   },
//   printButton: {
//     backgroundColor: "#006475",
//     borderRadius: 8,
//     height: 50,
//     justifyContent: "center",
//     alignItems: "center",
//     flexDirection: "row",
//   },
//   disabledButton: {
//     backgroundColor: "#9E9E9E",
//   },
//   buttonContent: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   successButtonContent: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   buttonText: {
//     color: "white",
//     fontSize: 16,
//     fontWeight: "600",
//     marginLeft: 8,
//   },
//   historyContainer: {
//     backgroundColor: "white",
//     borderRadius: 10,
//     padding: 16,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.08,
//     shadowRadius: 2,
//     elevation: 1,
//     marginBottom: 20,
//   },
//   histyoryHeader: {
//     display: "flex",
//     flexDirection: "row",
//     justifyContent: "start",
//     alignItems: "center",
//     marginBottom: 12,
//   },
//   historyTitle: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#212121",
//   },
//   historyGrid: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     marginHorizontal: -5,
//   },
//   bubbleContainer: {
//     width: "33.33%",
//     padding: 5,
//   },
//   bubble: {
//     display: "flex",
//     backgroundColor: "#ededed",
//     borderRadius: 20,
//     paddingVertical: 5,
//     paddingHorizontal: 12,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     position: "relative",
//   },
//   bubbleText: {
//     color: "black",
//     fontWeight: "600",
//     textAlign: "start",
//     fontSize: 12,
//     // marginRight: 10,
//     marginLeft: 3,
//     width: "83%",
//   },
//   removeBubble: {
//     // position: "absolute",
//     // right: 5,
//     // top: "50%",
//     // marginTop: -10,
//     width: 20,
//     height: 20,
//     borderRadius: 10,
//     backgroundColor: "rgba(0,0,0,0.2)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   statusBar: {
//     position: "absolute",
//     bottom: 0,
//     left: 0,
//     right: 0,
//     backgroundColor: "#3F51B5",
//     padding: 12,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   statusText: {
//     color: "white",
//     marginLeft: 8,
//     fontSize: 14,
//     fontWeight: "500",
//   },
// });

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  ScrollView,
} from "react-native";
import {
  MaterialIcons,
  MaterialCommunityIcons,
  Feather,
} from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { printForms } from "../services/printFormsService";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLayoutEffect } from "react";

export const DocumentViewerScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // Récupérer le type de document depuis les paramètres de navigation (ZLIV par défaut)
  const documentType = route.params?.documentType || "ZLIV";

  const [documentNumber, setDocumentNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPrintSuccess, setIsPrintSuccess] = useState(false);
  const [validatedNumbers, setValidatedNumbers] = useState([]);
  const inputRef = useRef(null);

  // Configuration spécifique à chaque type de document
  const documentConfig = {
    ZLIV: {
      title: "Impression de livraison",
      subtitle: "Saisissez le numéro de livraison à imprimer",
      storageKey: "validated_livraison_numbers",
      iconName: "truck-delivery",
      color: "#006475",
      maxLength: 10,
    },
    ZCMD: {
      title: "Impression de commande",
      subtitle: "Saisissez le numéro de commande à imprimer",
      storageKey: "validated_commande_numbers",
      iconName: "shopping",
      color: "#4CAF50",
      maxLength: 10,
    },
    ZFLC: {
      title: "Impression de facture",
      subtitle: "Saisissez le numéro de facture à imprimer",
      storageKey: "validated_facture_numbers",
      iconName: "file-document",
      color: "#FF9800",
      maxLength: 10,
    },
  };

  // Utiliser la configuration correspondante au type actuel
  const currentConfig = documentConfig[documentType];
  const STORAGE_KEY = currentConfig.storageKey;

  // Charger l'historique des numéros validés depuis le localStorage
  useEffect(() => {
    const loadValidatedNumbers = async () => {
      try {
        const storedNumbers = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedNumbers) {
          setValidatedNumbers(JSON.parse(storedNumbers));
        }
      } catch (error) {
        console.error("Erreur lors du chargement de l'historique:", error);
      }
    };

    loadValidatedNumbers();
    // Reset du numéro de document quand le type change
    setDocumentNumber("");
  }, [documentType, STORAGE_KEY]);

  useEffect(() => {
    if (isPrintSuccess) {
      // Réinitialiser après 3 secondes
      const timer = setTimeout(() => {
        setIsPrintSuccess(false);
        setDocumentNumber("");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isPrintSuccess]);

  // Configurer la barre de navigation
  useLayoutEffect(() => {
    navigation.setOptions({
      title: currentConfig.title,
      headerStyle: {
        // backgroundColor: currentConfig.color,
        backgroundColor: "#03A9F4",
      },
      headerTintColor: "white",
      headerLeft: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons
            name="arrow-left-circle"
            size={30}
            color="white"
            style={{ marginLeft: 5 }}
          />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            Alert.alert(
              "Aide",
              `Saisissez le numéro du document (maximum ${currentConfig.maxLength} caractères) et appuyez sur 'Imprimer' pour lancer l'impression directe.`
            );
          }}
        >
          <MaterialIcons name="help-outline" size={24} color="white" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, currentConfig]);

  // Focus sur l'input au chargement
  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
  }, []);

  // Fonction pour sauvegarder l'historique dans le localStorage
  const saveValidatedNumbers = async (numbers) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(numbers));
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de l'historique:", error);
    }
  };

  // Fonction pour ajouter un numéro validé
  const addValidatedNumber = (number) => {
    if (!validatedNumbers.includes(number)) {
      const newValidatedNumbers = [number, ...validatedNumbers];
      // Limiter l'historique à 20 éléments pour ne pas surcharger le stockage
      const limitedNumbers = newValidatedNumbers.slice(0, 20);
      setValidatedNumbers(limitedNumbers);
      saveValidatedNumbers(limitedNumbers);
    }
  };

  // Fonction pour supprimer un numéro validé
  const removeValidatedNumber = (number) => {
    const newValidatedNumbers = validatedNumbers.filter(
      (num) => num !== number
    );
    setValidatedNumbers(newValidatedNumbers);
    saveValidatedNumbers(newValidatedNumbers);
  };

  // Fonction pour valider et mettre à jour le numéro de document
  const handleDocumentNumberChange = (text) => {
    // Adapter la validation selon le type de document
    let validText = text;

    if (documentType === "ZLIV") {
      // Pour les livraisons, uniquement des chiffres
      validText = text.replace(/[^0-9]/g, "");
    } else if (documentType === "ZCMD") {
      // Pour les commandes, chiffres et lettres majuscules
      validText = text.replace(/[^0-9]/g, "").toUpperCase();
    } else if (documentType === "ZFLC") {
      // Pour les factures, chiffres, lettres et tirets
      validText = text.replace(/[^0-9]/g, "").toUpperCase();
    }

    // Limiter à la longueur maximale définie par le type
    if (validText.length <= currentConfig.maxLength) {
      setDocumentNumber(validText);
    }
  };

  // Fonction pour gérer l'impression
  const handlePrint = async () => {
    if (!documentNumber.trim()) {
      Alert.alert("Erreur", "Veuillez saisir un numéro de document");
      return;
    }

    Keyboard.dismiss();
    setIsLoading(true);

    try {
      // Utiliser le type de document passé en paramètre
      const response = await printForms(documentNumber.trim(), documentType);

      // Conversion du Blob en base64 pour l'impression
      const reader = new FileReader();

      reader.onload = async () => {
        const base64Data = reader.result.split(",")[1];
        const fileUri =
          FileSystem.documentDirectory +
          `${documentType}_${documentNumber.trim()}.pdf`;

        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Impression directe sur les plateformes compatibles
        if (Platform.OS === "ios" || Platform.OS === "android") {
          await Print.printAsync({ uri: fileUri });
        } else if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        }

        // Ajouter à l'historique des numéros validés
        addValidatedNumber(documentNumber.trim());

        setIsLoading(false);
        setIsPrintSuccess(true);
      };

      reader.readAsDataURL(
        new Blob([response.data], { type: "application/pdf" })
      );
    } catch (error) {
      console.error("Erreur lors de l'impression:", error);
      setIsLoading(false);
      Alert.alert(
        "Erreur d'impression",
        "Impossible d'imprimer le document. Vérifiez que le numéro est correct."
      );
    }
  };

  // Dans votre composant
  useEffect(() => {
    // Ne déclencher l'impression que si le numéro est dans l'historique
    // (pour éviter des impressions accidentelles lors de la saisie manuelle)
    if (documentNumber && validatedNumbers.includes(documentNumber)) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [documentNumber]);

  // Fonction simplifiée
  const selectHistoryDocument = (number) => {
    setDocumentNumber(number);
    inputRef.current?.focus(); // Optionnel
  };

  // Déterminer le keyboardType en fonction du type de document
  const getKeyboardType = () => {
    switch (documentType) {
      case "ZLIV":
        return "numeric";
      case "ZCMD":
        return "numeric";
      case "ZFLC":
        return "numeric";
      default:
        return "numeric";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#03A9F4" barStyle="light-content" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView style={styles.contentContainer}>
          {/* Icon et titre */}
          <View style={styles.headerSection}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: `${currentConfig.color}20` },
              ]}
            >
              <MaterialCommunityIcons
                name={currentConfig.iconName}
                size={40}
                color={currentConfig.color}
              />
            </View>
            <Text style={styles.headerTitle}>{currentConfig.title}</Text>
            <Text style={styles.headerSubtitle}>{currentConfig.subtitle}</Text>
          </View>

          {/* Formulaire */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder={`N° de ${
                  documentType === "ZLIV"
                    ? "livraison"
                    : documentType === "ZCMD"
                    ? "commande"
                    : "facture"
                }`}
                placeholderTextColor="#9E9E9E"
                value={documentNumber}
                onChangeText={handleDocumentNumberChange}
                keyboardType={getKeyboardType()}
                autoCapitalize={documentType !== "ZLIV" ? "characters" : "none"}
                maxLength={currentConfig.maxLength}
                returnKeyType="go"
                onSubmitEditing={handlePrint}
              />
              {documentNumber.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setDocumentNumber("")}
                >
                  <Feather name="x" size={18} color="#757575" />
                </TouchableOpacity>
              )}
            </View>

            {/* Compteur de caractères si nécessaire */}
            {documentNumber.length > 0 && (
              <View style={styles.counterContainer}>
                <Text style={styles.counterText}>
                  {documentNumber.length}/{currentConfig.maxLength} caractères
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.printButton,
                { backgroundColor: "#006475" },
                (!documentNumber.trim() || isLoading) && styles.disabledButton,
              ]}
              onPress={handlePrint}
              disabled={!documentNumber.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : isPrintSuccess ? (
                <View style={styles.successButtonContent}>
                  <MaterialIcons name="check-circle" size={20} color="white" />
                  <Text style={styles.buttonText}>Imprimé avec succès</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <MaterialCommunityIcons
                    name="printer"
                    size={20}
                    color="white"
                  />
                  <Text style={styles.buttonText}>Imprimer</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Historique des numéros validés */}
          {validatedNumbers.length > 0 && (
            <View style={styles.historyContainer}>
              <View style={styles.historyHeader}>
                <MaterialCommunityIcons
                  name="history"
                  size={28}
                  color="black"
                  style={{ marginRight: 5 }}
                />
                <Text style={[styles.historyTitle, { color: "black" }]}>
                  Historique des{" "}
                  {documentType === "ZLIV"
                    ? "livraisons"
                    : documentType === "ZCMD"
                    ? "commandes"
                    : "factures"}
                </Text>
              </View>
              <View style={styles.historyGrid}>
                {validatedNumbers.map((number, index) => (
                  <View key={index} style={styles.bubbleContainer}>
                    <TouchableOpacity
                      style={[
                        styles.bubble,
                        { borderColor: `${currentConfig.color}40` },
                      ]}
                      onPress={() => selectHistoryDocument(number)}
                    >
                      <Text style={styles.bubbleText}>{number}</Text>
                      <TouchableOpacity
                        style={[
                          styles.removeBubble,
                          { backgroundColor: currentConfig.color },
                        ]}
                        onPress={(e) => {
                          e.stopPropagation();
                          removeValidatedNumber(number);
                        }}
                      >
                        <Feather name="x" size={16} color="white" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Barre de statut pendant le chargement */}
      {isLoading && (
        <View style={[styles.statusBar, { backgroundColor: "#006475" }]}>
          <ActivityIndicator size="small" color="white" />
          <Text style={styles.statusText}>Impression en cours...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  headerButton: {
    padding: 8,
  },
  headerSection: {
    alignItems: "center",
    marginVertical: 25,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#757575",
    textAlign: "center",
  },
  formContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: "#FAFAFA",
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#212121",
  },
  clearButton: {
    padding: 6,
  },
  counterContainer: {
    alignItems: "flex-end",
    marginBottom: 16,
  },
  counterText: {
    fontSize: 12,
    color: "#757575",
  },
  printButton: {
    borderRadius: 8,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  disabledButton: {
    backgroundColor: "#9E9E9E",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  successButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  historyContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 20,
  },
  historyHeader: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  historyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -5,
  },
  bubbleContainer: {
    width: "33.33%",
    padding: 5,
  },
  bubble: {
    display: "flex",
    backgroundColor: "#f8f8f8",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
  },
  bubbleText: {
    color: "#212121",
    fontWeight: "600",
    textAlign: "start",
    fontSize: 12,
    width: "83%",
  },
  removeBubble: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  statusBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    color: "white",
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
});
