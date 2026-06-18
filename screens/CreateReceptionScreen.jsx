import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import {
  MaterialIcons,
  MaterialCommunityIcons,
  FontAwesome,
} from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
// Supposons que vous avez une action pour soumettre la réception
import {
  addGoodReceipt,
  getTransfertDocument,
  resetCreationState,
  resetGoodReceiptState,
} from "../redux/slices/goodReceiptSlice";
import { wp, hp, fs, fontWeight, scale } from "../utils/responsive";
import { Modalize } from "react-native-modalize";

// const CreateReceptionScreen = ({ route }) => {
//   const { transfert } = route.params;
//   const navigation = useNavigation();
//   const dispatch = useDispatch();

//   // Récupération des données depuis Redux
//   const { loading, error, success } = useSelector((state) => state.goodReceipt);
//   const userData = useSelector((state) => state.auth.user);

//   // États pour le formulaire
//   const [articlesData, setArticlesData] = useState([]);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const formatDate = (date) => {
//     return date.toISOString().slice(0, 19); // Prend seulement YYYY-MM-DDThh:mm:ss
//   };

//   const [postingDate, setPostingDate] = useState(formatDate(new Date()));
//   const [keyboardVisible, setKeyboardVisible] = useState(false);

//   // Initialiser les données des articles avec les quantités à zéro
//   useEffect(() => {
//     if (transfert && transfert.articles) {
//       const initialArticles = transfert.articles.map((article) => ({
//         ...article,
//         quantiteRecue: "0", // On commence avec 0 par défaut
//         isInvalid: false,
//       }));
//       setArticlesData(initialArticles);
//     }
//     // Reset seulement les états de création au montage
//     dispatch(resetCreationState());
//   }, [transfert, dispatch]);

//   // Réinitialiser après succès
//   useEffect(() => {
//     if (success) {
//       Alert.alert(
//         "Réception enregistrée",
//         "La réception a été correctement enregistrée.",
//         [
//           {
//             text: "OK",
//             onPress: () => {
//               // Reset avant de naviguer
//               dispatch(resetCreationState());
//               navigation.navigate("transfert_list");
//             },
//           },
//         ]
//       );
//       // Rafraîchir la liste des transferts
//       dispatch(getTransfertDocument({ magasin: userData?.magasin }));
//     }
//   }, [success, navigation, dispatch, userData?.magasin]);

//   // Gérer les événements du clavier
//   useEffect(() => {
//     const keyboardDidShowListener = Keyboard.addListener(
//       "keyboardDidShow",
//       () => {
//         setKeyboardVisible(true);
//       }
//     );
//     const keyboardDidHideListener = Keyboard.addListener(
//       "keyboardDidHide",
//       () => {
//         setKeyboardVisible(false);
//       }
//     );

//     return () => {
//       keyboardDidShowListener.remove();
//       keyboardDidHideListener.remove();
//     };
//   }, []);

//   // Gérer les erreurs
//   useEffect(() => {
//     if (error) {
//       Alert.alert("Erreur", error, [
//         {
//           text: "OK",
//           onPress: () => dispatch(resetCreationState()),
//         },
//       ]);
//     }
//   }, [error, dispatch]);

//   const handleQuantityChange = (text, index) => {
//     const updatedArticles = [...articlesData];

//     // Remplacer les virgules par des points pour la conversion
//     const sanitizedText = text.replace(",", ".");
//     // Valider uniquement les chiffres et un point décimal
//     const numericRegex = /^(\d*\.?\d*)$/;

//     updatedArticles[index].quantiteRecue = sanitizedText;

//     // Vérification de la validité des valeurs
//     const numericValue = parseFloat(sanitizedText);
//     const maxQuantity = parseFloat(updatedArticles[index].QuantiteRestante);

//     if (!numericRegex.test(sanitizedText)) {
//       updatedArticles[index].isInvalid = true;
//       updatedArticles[index].errorMessage = "Format invalide";
//     } else if (isNaN(numericValue)) {
//       updatedArticles[index].isInvalid = false;
//       updatedArticles[index].errorMessage = "";
//     } else if (numericValue < 0) {
//       updatedArticles[index].isInvalid = true;
//       updatedArticles[index].errorMessage = "Doit être positif";
//     } else if (numericValue > maxQuantity) {
//       updatedArticles[index].isInvalid = true;
//       updatedArticles[index].errorMessage = "Dépasse la quantité restante";
//     } else {
//       updatedArticles[index].isInvalid = false;
//       updatedArticles[index].errorMessage = "";
//     }

//     setArticlesData(updatedArticles);
//   };

//   const validateForm = () => {
//     // Vérifier si au moins un article a une quantité supérieure à 0
//     const hasQuantity = articlesData.some(
//       (article) => parseFloat(article.quantiteRecue) > 0
//     );

//     // Vérifier s'il y a des erreurs de validation
//     const hasErrors = articlesData.some((article) => article.isInvalid);

//     return hasQuantity && !hasErrors;
//   };

//   const handleSubmit = async () => {
//     if (!validateForm()) {
//       Alert.alert(
//         "Validation",
//         "Veuillez vérifier les quantités saisies. Au moins un article doit avoir une quantité supérieure à 0."
//       );
//       return;
//     }

//     Keyboard.dismiss();
//     setIsSubmitting(true);

//     // Nouvelle logique pour correspondre au format JSON demandé
//     const receptionData = {
//       PostingDate: postingDate,
//       GoodsMovementCode: "04", // Pour un transfert de stock (313->315)
//       ReferenceDocument: transfert.NumeroDocument, // Référence au document de sortie
//       to_MaterialDocumentItem: articlesData
//         .filter((article) => parseFloat(article.quantiteRecue) > 0)
//         .map((article) => ({
//           GoodsMovementType: "315",
//           Plant: transfert.Division,
//           QuantityInEntryUnit: article.quantiteRecue,
//           StorageLocation: transfert.MagasinDestinataire,
//           Material: article.Article,
//           Batch: article.lot,
//         })),
//     };

//     console.log(
//       "Données de réception à envoyer:",
//       JSON.stringify(receptionData, null, 2)
//     );

//     try {
//       // Envoyer les données à l'API via Redux
//       await dispatch(addGoodReceipt(receptionData)).unwrap();
//       // Le succès sera géré par l'useEffect qui écoute 'success'
//     } catch (error) {
//       console.error("Erreur lors de la création de la réception:", error);
//       // L'erreur sera gérée par l'useEffect qui écoute 'error'
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const renderArticleItem = ({ item, index }) => {
//     const quantiteSortie = parseFloat(item.QuantiteSortie);
//     const quantiteRecue = parseFloat(item.TotalQuantiteRecue);
//     const quantiteRestante = parseFloat(item.QuantiteRestante);

//     return (
//       <View style={styles.articleItem}>
//         <View style={styles.articleHeader}>
//           <Text style={styles.articleTitle}>Article {item.Article}</Text>
//           <Text style={styles.articleLot}>{item.Designation}</Text>
//           <Text style={styles.articleLot}>Lot: {item.lot}</Text>
//         </View>

//         <View style={styles.quantityContainer}>
//           <View style={styles.quantityInfo}>
//             <Text style={styles.quantityLabel}>Qté envoyée:</Text>
//             <Text style={styles.quantityValue}>
//               {quantiteSortie.toFixed(2)} {item.UniteMesure}
//             </Text>
//           </View>

//           <View style={styles.quantityInfo}>
//             <Text style={styles.quantityLabel}>Déjà reçue:</Text>
//             <Text style={styles.quantityValue}>
//               {quantiteRecue.toFixed(2)} {item.UniteMesure}
//             </Text>
//           </View>

//           <View style={styles.quantityInfo}>
//             <Text style={styles.quantityLabel}>Restante:</Text>
//             <Text style={styles.quantityValue}>
//               {quantiteRestante.toFixed(2)} {item.UniteMesure}
//             </Text>
//           </View>
//         </View>

//         <View style={styles.inputContainer}>
//           <Text style={styles.inputLabel}>Quantité reçue:</Text>
//           <View style={styles.inputWrapper}>
//             <TextInput
//               style={[
//                 styles.quantityInput,
//                 item.isInvalid && styles.invalidInput,
//               ]}
//               value={item.quantiteRecue}
//               onChangeText={(text) => handleQuantityChange(text, index)}
//               keyboardType="numeric"
//               placeholder="0.00"
//               returnKeyType="done"
//             />
//             <Text style={styles.unitText}>{item.UniteMesure}</Text>
//           </View>
//         </View>

//         {item.isInvalid && (
//           <Text style={styles.errorText}>{item.errorMessage}</Text>
//         )}

//         <View style={styles.statusContainer}>
//           <View
//             style={[
//               styles.statusIndicator,
//               { backgroundColor: getStatusColor(item.StatutReception) },
//             ]}
//           />
//           <Text style={styles.statusText}>{item.StatutReception}</Text>
//         </View>
//       </View>
//     );
//   };

//   const getStatusColor = (status) => {
//     switch (status) {
//       case "Non réceptionné":
//         return "#F44336"; // Rouge
//       case "Partiellement réceptionné":
//         return "#FFA000"; // Orange
//       case "Réceptionné":
//         return "#4CAF50"; // Vert
//       default:
//         return "#757575"; // Gris par défaut
//     }
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar backgroundColor="#03A9F4" barStyle="light-content" />
//       <View style={styles.scrollContainer}>
//         <View style={styles.headerSection}>
//           <View style={styles.headerInfo}>
//             <Text style={styles.headerTitle}>Réception du transfert</Text>
//             <Text style={styles.documentNumber}>
//               Document N° {transfert.NumeroDocument} - {transfert.Annee}
//             </Text>
//             <Text style={styles.dateText}>
//               {transfert.DateComptabilisation}
//             </Text>
//           </View>
//         </View>

//         <View style={styles.warehouseSection}>
//           <View style={styles.warehouseContainer}>
//             <View style={styles.warehouseBlock}>
//               <Text style={styles.warehouseLabel}>Magasin source</Text>
//               <Text style={styles.warehouseValue}>
//                 {transfert.MagasinSource}
//               </Text>
//             </View>
//             <MaterialIcons
//               name="arrow-forward"
//               size={24}
//               color="#757575"
//               style={styles.arrowIcon}
//             />
//             <View style={styles.warehouseBlock}>
//               <Text style={styles.warehouseLabel}>Magasin destination</Text>
//               <Text style={styles.warehouseValue}>
//                 {transfert.MagasinDestinataire}
//               </Text>
//             </View>
//           </View>
//         </View>

//         <View style={styles.articlesSection}>
//           <Text style={styles.sectionTitle}>Articles à réceptionner</Text>
//           <Text style={styles.helperText}>
//             Entrez la quantité reçue pour chaque article
//           </Text>

//           <FlatList
//             data={articlesData}
//             renderItem={renderArticleItem}
//             keyExtractor={(item, index) =>
//               `${item.Article}-${item.lot}-${index}`
//             }
//             contentContainerStyle={styles.articlesList}
//             scrollEnabled={true}
//             removeClippedSubviews={false}
//             keyboardShouldPersistTaps="handled"
//           />
//         </View>

//         {error && (
//           <View style={styles.errorContainer}>
//             <Text style={styles.errorMessage}>{error}</Text>
//           </View>
//         )}

//         <View
//           style={[
//             styles.buttonSection,
//             keyboardVisible && styles.keyboardVisibleButtons,
//           ]}
//         >
//           <TouchableOpacity
//             style={[
//               styles.submitButton,
//               (!validateForm() || isSubmitting || loading) &&
//                 styles.disabledButton,
//             ]}
//             onPress={handleSubmit}
//             disabled={!validateForm() || isSubmitting || loading}
//           >
//             {isSubmitting || loading ? (
//               <ActivityIndicator size="small" color="white" />
//             ) : (
//               <>
//                 <MaterialIcons name="check-circle" size={20} color="white" />
//                 <Text style={styles.submitButtonText}>
//                   Valider la réception
//                 </Text>
//               </>
//             )}
//           </TouchableOpacity>
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#F5F5F5",
//   },
//   scrollContainer: {
//     flex: 1,
//   },
//   headerSection: {
//     backgroundColor: "#03A9F4",
//     padding: scale(16),
//     borderBottomLeftRadius: scale(15),
//     borderBottomRightRadius: scale(15),
//     elevation: 3,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: scale(2) },
//     shadowOpacity: 0.2,
//     shadowRadius: scale(3),
//   },
//   headerInfo: {
//     alignItems: "center",
//   },
//   headerTitle: {
//     fontSize: fs(18),
//     fontWeight: fontWeight.bold,
//     color: "white",
//     marginBottom: scale(4),
//   },
//   documentNumber: {
//     fontSize: fs(16),
//     color: "white",
//     marginBottom: scale(2),
//   },
//   dateText: {
//     fontSize: fs(14),
//     color: "rgba(255, 255, 255, 0.8)",
//   },
//   warehouseSection: {
//     backgroundColor: "white",
//     margin: scale(16),
//     borderRadius: scale(8),
//     padding: scale(16),
//     elevation: 2,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: scale(1) },
//     shadowOpacity: 0.1,
//     shadowRadius: scale(2),
//   },
//   warehouseContainer: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   warehouseBlock: {
//     flex: 1,
//     alignItems: "center",
//   },
//   warehouseLabel: {
//     fontSize: fs(12),
//     color: "#757575",
//     marginBottom: scale(4),
//   },
//   warehouseValue: {
//     fontSize: fs(16),
//     fontWeight: fontWeight.bold,
//     color: "#424242",
//   },
//   arrowIcon: {
//     marginHorizontal: scale(8),
//   },
//   articlesSection: {
//     backgroundColor: "white",
//     margin: scale(16),
//     marginTop: 0,
//     borderRadius: scale(8),
//     padding: scale(16),
//     elevation: 2,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: scale(1) },
//     shadowOpacity: 0.1,
//     shadowRadius: scale(2),
//     flex: 1,
//   },
//   sectionTitle: {
//     fontSize: fs(16),
//     fontWeight: fontWeight.bold,
//     color: "#424242",
//     marginBottom: scale(4),
//   },
//   helperText: {
//     fontSize: fs(12),
//     color: "#757575",
//     marginBottom: scale(16),
//   },
//   articlesList: {
//     flexGrow: 1,
//   },
//   articleItem: {
//     borderWidth: scale(1),
//     borderColor: "#E0E0E0",
//     borderRadius: scale(6),
//     padding: scale(12),
//     marginBottom: scale(12),
//   },
//   articleHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: scale(10),
//   },
//   articleTitle: {
//     fontSize: fs(16),
//     fontWeight: fontWeight.medium,
//     color: "#03A9F4",
//   },
//   articleLot: {
//     fontSize: fs(14),
//     color: "#757575",
//   },
//   quantityContainer: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: scale(16),
//     paddingBottom: scale(12),
//     borderBottomWidth: scale(1),
//     borderBottomColor: "#EEEEEE",
//   },
//   quantityInfo: {
//     alignItems: "center",
//   },
//   quantityLabel: {
//     fontSize: fs(12),
//     color: "#757575",
//     marginBottom: scale(4),
//   },
//   quantityValue: {
//     fontSize: fs(14),
//     fontWeight: fontWeight.medium,
//   },
//   inputContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     marginBottom: scale(8),
//   },
//   inputLabel: {
//     fontSize: fs(14),
//     fontWeight: fontWeight.medium,
//   },
//   inputWrapper: {
//     flexDirection: "row",
//     alignItems: "center",
//     borderWidth: scale(1),
//     borderColor: "#BDBDBD",
//     borderRadius: scale(4),
//     width: "50%",
//     height: scale(40),
//     paddingHorizontal: scale(8),
//   },
//   quantityInput: {
//     flex: 1,
//     height: scale(40),
//     textAlign: "right",
//     paddingRight: scale(5),
//   },
//   unitText: {
//     marginLeft: scale(5),
//     color: "#757575",
//   },
//   invalidInput: {
//     borderColor: "#F44336",
//   },
//   errorText: {
//     color: "#F44336",
//     fontSize: fs(12),
//     marginBottom: scale(8),
//     textAlign: "right",
//   },
//   statusContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginTop: scale(8),
//   },
//   statusIndicator: {
//     width: scale(10),
//     height: scale(10),
//     borderRadius: scale(5),
//     marginRight: scale(6),
//   },
//   statusText: {
//     fontSize: fs(10),
//     letterSpacing: 1,
//     fontWeight: fontWeight.bold,
//   },
//   buttonSection: {
//     margin: scale(16),
//     marginTop: scale(8),
//     marginBottom: scale(24),
//   },
//   keyboardVisibleButtons: {
//     // Styles commentés conservés pour référence future
//   },
//   submitButton: {
//     backgroundColor: "#006475",
//     borderRadius: scale(8),
//     padding: scale(14),
//     alignItems: "center",
//     flexDirection: "row",
//     justifyContent: "center",
//     marginBottom: scale(12),
//     elevation: 2,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: scale(2) },
//     shadowOpacity: 0.2,
//     shadowRadius: scale(2),
//   },
//   submitButtonText: {
//     color: "white",
//     fontWeight: fontWeight.bold,
//     fontSize: fs(16),
//     marginLeft: scale(8),
//   },
//   disabledButton: {
//     backgroundColor: "#BDBDBD",
//     elevation: 0,
//   },
//   cancelButton: {
//     backgroundColor: "white",
//     borderRadius: scale(8),
//     padding: scale(14),
//     alignItems: "center",
//     flexDirection: "row",
//     justifyContent: "center",
//     borderWidth: scale(1),
//     borderColor: "#E0E0E0",
//   },
//   cancelButtonText: {
//     color: "#757575",
//     fontWeight: fontWeight.medium,
//     fontSize: fs(16),
//     marginLeft: scale(8),
//   },
//   errorContainer: {
//     backgroundColor: "#FFEBEE",
//     margin: scale(16),
//     marginTop: 0,
//     borderRadius: scale(8),
//     padding: scale(16),
//     borderLeftWidth: scale(4),
//     borderLeftColor: "#F44336",
//   },
//   errorMessage: {
//     color: "#D32F2F",
//     fontSize: fs(14),
//   },
// });

// export default CreateReceptionScreen;

const CreateReceptionScreen = ({ route }) => {
  const { transfert } = route.params;
  const navigation = useNavigation();
  const dispatch = useDispatch();

  // Référence pour la modale
  const quantityModalizeRef = useRef(null);

  // Récupération des données depuis Redux
  const { loading, error, success } = useSelector((state) => state.goodReceipt);
  const userData = useSelector((state) => state.auth.user);

  // États pour le formulaire
  const [articlesData, setArticlesData] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [quantity, setQuantity] = useState("0");
  const [selectedIndex, setSelectedIndex] = useState(null);

  const formatDate = (date) => {
    return date.toISOString().slice(0, 19);
  };

  const [postingDate, setPostingDate] = useState(formatDate(new Date()));
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Initialiser les données des articles avec les quantités à zéro
  useEffect(() => {
    if (transfert && transfert.articles) {
      const initialArticles = transfert.articles.map((article) => ({
        ...article,
        quantiteRecue: "0",
        isInvalid: false,
        isSelected: false, // Nouvel état pour gérer la sélection
      }));
      setArticlesData(initialArticles);
    }
    dispatch(resetCreationState());
  }, [transfert, dispatch]);

  // Réinitialiser après succès
  useEffect(() => {
    if (success) {
      Alert.alert(
        "Réception enregistrée",
        "La réception a été correctement enregistrée.",
        [
          {
            text: "OK",
            onPress: () => {
              dispatch(resetCreationState());
              navigation.navigate("transfert_list");
            },
          },
        ]
      );
      dispatch(getTransfertDocument({ magasin: userData?.magasin }));
    }
  }, [success, navigation, dispatch, userData?.magasin]);

  // Gérer les événements du clavier
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Gérer les erreurs
  useEffect(() => {
    if (error) {
      Alert.alert("Erreur", error, [
        {
          text: "OK",
          onPress: () => dispatch(resetCreationState()),
        },
      ]);
    }
  }, [error, dispatch]);

  // Fonction pour ouvrir la modale de quantité
  const openQuantityModal = (article, index) => {
    setSelectedArticle(article);
    setSelectedIndex(index);
    setQuantity(article.quantiteRecue || "0");
    quantityModalizeRef.current?.open();
  };

  // Fonction pour confirmer la quantité
  const handleQuantityConfirm = () => {
    if (selectedIndex !== null) {
      const updatedArticles = [...articlesData];
      const sanitizedText = quantity.replace(",", ".");
      const numericRegex = /^(\d*\.?\d*)$/;

      updatedArticles[selectedIndex].quantiteRecue = sanitizedText;

      // Vérification de la validité des valeurs
      const numericValue = parseFloat(sanitizedText);
      const maxQuantity = parseFloat(
        updatedArticles[selectedIndex].QuantiteRestante
      );

      if (!numericRegex.test(sanitizedText)) {
        updatedArticles[selectedIndex].isInvalid = true;
        updatedArticles[selectedIndex].errorMessage = "Format invalide";
      } else if (isNaN(numericValue)) {
        updatedArticles[selectedIndex].isInvalid = false;
        updatedArticles[selectedIndex].errorMessage = "";
        updatedArticles[selectedIndex].isSelected = false;
      } else if (numericValue < 0) {
        updatedArticles[selectedIndex].isInvalid = true;
        updatedArticles[selectedIndex].errorMessage = "Doit être positif";
        updatedArticles[selectedIndex].isSelected = false;
      } else if (numericValue > maxQuantity) {
        updatedArticles[selectedIndex].isInvalid = true;
        updatedArticles[selectedIndex].errorMessage =
          "Dépasse la quantité restante";
        updatedArticles[selectedIndex].isSelected = false;
      } else {
        updatedArticles[selectedIndex].isInvalid = false;
        updatedArticles[selectedIndex].errorMessage = "";
        // Marquer comme sélectionné si quantité > 0
        updatedArticles[selectedIndex].isSelected = numericValue > 0;
      }

      setArticlesData(updatedArticles);
    }

    quantityModalizeRef.current?.close();
    setSelectedArticle(null);
    setSelectedIndex(null);
  };

  const validateForm = () => {
    const hasQuantity = articlesData.some(
      (article) => parseFloat(article.quantiteRecue) > 0
    );
    const hasErrors = articlesData.some((article) => article.isInvalid);
    return hasQuantity && !hasErrors;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert(
        "Validation",
        "Veuillez vérifier les quantités saisies. Au moins un article doit avoir une quantité supérieure à 0."
      );
      return;
    }

    Keyboard.dismiss();
    setIsSubmitting(true);

    const receptionData = {
      PostingDate: postingDate,
      GoodsMovementCode: "04",
      ReferenceDocument: transfert.NumeroDocument,
      to_MaterialDocumentItem: articlesData
        .filter((article) => parseFloat(article.quantiteRecue) > 0)
        .map((article) => ({
          GoodsMovementType: "315",
          Plant: transfert.Division,
          QuantityInEntryUnit: article.quantiteRecue,
          StorageLocation: transfert.MagasinDestinataire,
          Material: article.Article,
          Batch: article.lot,
        })),
    };

    console.log(
      "Données de réception à envoyer:",
      JSON.stringify(receptionData, null, 2)
    );

    try {
      await dispatch(addGoodReceipt(receptionData)).unwrap();
    } catch (error) {
      console.error("Erreur lors de la création de la réception:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderArticleItem = ({ item, index }) => {
    const quantiteSortie = parseFloat(item.QuantiteSortie);
    const quantiteRecue = parseFloat(item.TotalQuantiteRecue);
    const quantiteRestante = parseFloat(item.QuantiteRestante);
    const quantiteSaisie = parseFloat(item.quantiteRecue) || 0;

    return (
      <TouchableOpacity
        style={[
          styles.articleItem,
          item.isSelected && styles.selectedArticleItem,
        ]}
        onPress={() => openQuantityModal(item, index)}
        activeOpacity={0.7}
      >
        <View style={styles.articleHeader}>
          <Text style={styles.articleLot}>{item.Article}</Text>
          <Text style={styles.articleTitle}>{item.Designation}</Text>
          <Text style={styles.articleLot}>Lot: {item.lot}</Text>
        </View>

        <View style={styles.quantityContainer}>
          <View style={styles.quantityInfo}>
            <Text style={styles.quantityLabelArticleItem}>Qté envoyée:</Text>
            <Text style={styles.quantityValue}>
              {quantiteSortie.toFixed(2)} {item.UniteMesure}
            </Text>
          </View>

          <View style={styles.quantityInfo}>
            <Text style={styles.quantityLabelArticleItem}>Déjà reçue:</Text>
            <Text style={styles.quantityValue}>
              {quantiteRecue.toFixed(2)} {item.UniteMesure}
            </Text>
          </View>

          <View style={styles.quantityInfo}>
            <Text style={styles.quantityLabelArticleItem}>Restante:</Text>
            <Text style={styles.quantityValue}>
              {quantiteRestante.toFixed(2)} {item.UniteMesure}
            </Text>
          </View>
        </View>

        {/* Affichage de la quantité saisie */}
        <View style={styles.inputDisplayContainer}>
          <Text style={styles.inputLabel}>Quantité à recevoir:</Text>
          <View style={styles.quantityDisplayWrapper}>
            <Text
              style={[
                styles.quantityDisplayText,
                quantiteSaisie > 0
                  ? styles.quantityDisplayActive
                  : styles.quantityDisplayInactive,
              ]}
            >
              {quantiteSaisie.toFixed(2)} {item.UniteMesure}
            </Text>
            <MaterialIcons
              name="edit"
              size={16}
              color={quantiteSaisie > 0 ? "#03A9F4" : "#BDBDBD"}
            />
          </View>
        </View>

        {item.isInvalid && (
          <Text style={styles.errorText}>{item.errorMessage}</Text>
        )}

        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: getStatusColor(item.StatutReception) },
            ]}
          />
          <Text style={styles.statusText}>{item.StatutReception}</Text>
        </View>

        {/* Indicateur de sélection */}
        {item.isSelected && (
          <View style={styles.selectionIndicator}>
            <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Non réceptionné":
        return "#F44336";
      case "Partiellement réceptionné":
        return "#FFA000";
      case "Réceptionné":
        return "#4CAF50";
      default:
        return "#757575";
    }
  };

  const handleQuantityDecrease = useCallback(() => {
    setQuantity((prevQuantity) => {
      const currentQty = parseFloat(prevQuantity) || 0;
      const newQty = Math.max(0, currentQty - 1);
      return newQty.toString();
    });
  }, []);

  const handleQuantityIncrease = useCallback(() => {
    setQuantity((prevQuantity) => {
      const currentQty = parseFloat(prevQuantity) || 0;
      const maxQuantity = parseFloat(selectedArticle?.QuantiteRestante) || 0;
      const newQty = Math.min(currentQty + 1, maxQuantity);
      return newQty.toString();
    });
  }, [selectedArticle?.QuantiteRestante]);

  const handleMaxQuantity = useCallback(() => {
    if (selectedArticle?.QuantiteRestante) {
      setQuantity(selectedArticle.QuantiteRestante.toString());
    }
  }, [selectedArticle?.QuantiteRestante]);

  // 2. Fonction améliorée pour la saisie manuelle
  const handleQuantityChange = useCallback((text) => {
    // Nettoyer le texte : autoriser seulement les chiffres et un point
    const cleanedText = text.replace(/[^0-9.]/g, "");

    // Éviter les points multiples
    const parts = cleanedText.split(".");
    const finalText =
      parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : cleanedText;

    setQuantity(finalText);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#03A9F4" barStyle="light-content" />
      <View style={styles.scrollContainer}>
        <View style={styles.headerSection}>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Réception du transfert</Text>
            <Text style={styles.documentNumber}>
              Document N° {transfert.NumeroDocument} - {transfert.Annee}
            </Text>
            <Text style={styles.dateText}>
              {transfert.DateComptabilisation}
            </Text>
          </View>
        </View>

        <View style={styles.warehouseSection}>
          <View style={styles.warehouseContainer}>
            <View style={styles.warehouseBlock}>
              <Text style={styles.warehouseLabel}>Magasin source</Text>
              <Text style={styles.warehouseValue}>
                {transfert.MagasinSource}
              </Text>
            </View>
            <MaterialIcons
              name="arrow-forward"
              size={24}
              color="#757575"
              style={styles.arrowIcon}
            />
            <View style={styles.warehouseBlock}>
              <Text style={styles.warehouseLabel}>Magasin destination</Text>
              <Text style={styles.warehouseValue}>
                {transfert.MagasinDestinataire}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.articlesSection}>
          <Text style={styles.sectionTitle}>Articles à réceptionner</Text>
          <Text style={styles.helperText}>
            Appuyez sur un article pour définir la quantité reçue
          </Text>

          <FlatList
            data={articlesData}
            renderItem={renderArticleItem}
            keyExtractor={(item, index) =>
              `${item.Article}-${item.lot}-${index}`
            }
            contentContainerStyle={styles.articlesList}
            scrollEnabled={true}
            removeClippedSubviews={false}
            keyboardShouldPersistTaps="handled"
          />
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorMessage}>{error}</Text>
          </View>
        )}

        <View
          style={[
            styles.buttonSection,
            keyboardVisible && styles.keyboardVisibleButtons,
          ]}
        >
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!validateForm() || isSubmitting || loading) &&
                styles.disabledButton,
            ]}
            onPress={handleSubmit}
            disabled={!validateForm() || isSubmitting || loading}
          >
            {isSubmitting || loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <MaterialIcons name="check-circle" size={20} color="white" />
                <Text style={styles.submitButtonText}>
                  Valider la réception
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal de définition de quantité */}
      {/* <Modalize
        ref={quantityModalizeRef}
        adjustToContentHeight
        modalStyle={styles.modalContainer}
      >
        {selectedArticle && (
          <View style={styles.quantityModal}>
            <Text style={styles.quantityTitle}>
              Définir la quantité à recevoir
            </Text>
            <Text style={styles.quantityArticle}>
              {selectedArticle.Designation} - Lot: {selectedArticle.lot}
            </Text>

            <View style={styles.quantityInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Quantité envoyée:</Text>
                <Text style={styles.infoValue}>
                  {selectedArticle.QuantiteSortie} {selectedArticle.UniteMesure}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Déjà reçue:</Text>
                <Text style={styles.infoValue}>
                  {selectedArticle.TotalQuantiteRecue}{" "}
                  {selectedArticle.UniteMesure}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Quantité restante:</Text>
                <Text style={styles.infoValue}>
                  {selectedArticle.QuantiteRestante}{" "}
                  {selectedArticle.UniteMesure}
                </Text>
              </View>
            </View>

            <View style={styles.quantityRow}>
              <Text style={styles.quantityLabel}>QUANTITÉ À SAISIR :</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => {
                    const currentQty = parseFloat(quantity);
                    if (!isNaN(currentQty) && currentQty > 0) {
                      setQuantity(Math.max(0, currentQty - 1).toString());
                    }
                  }}
                >
                  <MaterialIcons name="remove" size={20} color="white" />
                </TouchableOpacity>

                <TextInput
                  style={styles.quantityModalInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                />

                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => {
                    const currentQty = parseFloat(quantity);
                    if (!isNaN(currentQty)) {
                      const newQty = Math.min(
                        currentQty + 1,
                        parseFloat(selectedArticle.QuantiteRestante)
                      );
                      setQuantity(newQty.toString());
                    } else {
                      setQuantity("1");
                    }
                  }}
                >
                  <MaterialIcons name="add" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.maxContainer}>
              <TouchableOpacity
                style={styles.maxButton}
                onPress={() => {
                  setQuantity(selectedArticle.QuantiteRestante.toString());
                }}
              >
                <Text style={styles.maxButtonText}>Quantité maximale</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleQuantityConfirm}
              >
                <Text style={styles.confirmButtonText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modalize> */}
      <Modalize
        ref={quantityModalizeRef}
        adjustToContentHeight
        modalStyle={styles.modalContainer}
        keyboardAvoidingBehavior="padding" // Ajout pour éviter les conflits clavier
      >
        {selectedArticle && (
          <View style={styles.quantityModal}>
            <Text style={styles.quantityTitle}>
              Définir la quantité à recevoir
            </Text>
            <Text style={styles.quantityArticle}>
              {selectedArticle.Designation} - Lot: {selectedArticle.lot}
            </Text>

            <View style={styles.quantityInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Quantité envoyée:</Text>
                <Text style={styles.infoValue}>
                  {selectedArticle.QuantiteSortie} {selectedArticle.UniteMesure}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Déjà reçue:</Text>
                <Text style={styles.infoValue}>
                  {selectedArticle.TotalQuantiteRecue}{" "}
                  {selectedArticle.UniteMesure}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Quantité restante:</Text>
                <Text style={styles.infoValue}>
                  {selectedArticle.QuantiteRestante}{" "}
                  {selectedArticle.UniteMesure}
                </Text>
              </View>
            </View>

            <View style={styles.quantityRow}>
              <Text style={styles.quantityLabel}>QUANTITÉ À SAISIR :</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={[
                    styles.quantityButton,
                    { opacity: parseFloat(quantity) <= 0 ? 0.5 : 1 },
                  ]}
                  onPress={handleQuantityDecrease}
                  disabled={parseFloat(quantity) <= 0}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="remove" size={20} color="white" />
                </TouchableOpacity>

                <TextInput
                  style={styles.quantityModalInput}
                  value={quantity}
                  onChangeText={handleQuantityChange}
                  keyboardType="decimal-pad"
                  selectTextOnFocus={true}
                  returnKeyType="done"
                  maxLength={10}
                />

                <TouchableOpacity
                  style={[
                    styles.quantityButton,
                    {
                      opacity:
                        parseFloat(quantity) >=
                        parseFloat(selectedArticle.QuantiteRestante)
                          ? 0.5
                          : 1,
                    },
                  ]}
                  onPress={handleQuantityIncrease}
                  disabled={
                    parseFloat(quantity) >=
                    parseFloat(selectedArticle.QuantiteRestante)
                  }
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="add" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.maxContainer}>
              <TouchableOpacity
                style={styles.maxButton}
                onPress={handleMaxQuantity}
                activeOpacity={0.7}
              >
                <Text style={styles.maxButtonText}>Quantité maximale</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleQuantityConfirm}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmButtonText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modalize>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollContainer: {
    flex: 1,
  },
  headerSection: {
    backgroundColor: "#03A9F4",
    padding: scale(16),
    borderBottomLeftRadius: scale(15),
    borderBottomRightRadius: scale(15),
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.2,
    shadowRadius: scale(3),
  },
  headerInfo: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: fs(18),
    fontWeight: fontWeight.bold,
    color: "white",
    marginBottom: scale(4),
  },
  documentNumber: {
    fontSize: fs(16),
    color: "white",
    marginBottom: scale(2),
  },
  dateText: {
    fontSize: fs(14),
    color: "rgba(255, 255, 255, 0.8)",
  },
  warehouseSection: {
    backgroundColor: "white",
    margin: scale(16),
    borderRadius: scale(8),
    padding: scale(16),
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(1) },
    shadowOpacity: 0.1,
    shadowRadius: scale(2),
  },
  warehouseContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  warehouseBlock: {
    flex: 1,
    alignItems: "center",
  },
  warehouseLabel: {
    fontSize: fs(12),
    color: "#757575",
    marginBottom: scale(4),
  },
  warehouseValue: {
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
    color: "#424242",
  },
  arrowIcon: {
    marginHorizontal: scale(8),
  },
  articlesSection: {
    backgroundColor: "white",
    margin: scale(16),
    marginTop: 0,
    borderRadius: scale(8),
    padding: scale(16),
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(1) },
    shadowOpacity: 0.1,
    shadowRadius: scale(2),
    flex: 1,
  },
  sectionTitle: {
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
    color: "#424242",
    marginBottom: scale(4),
  },
  helperText: {
    fontSize: fs(12),
    color: "#757575",
    marginBottom: scale(16),
  },
  articlesList: {
    flexGrow: 1,
  },
  articleItem: {
    borderWidth: scale(1),
    borderColor: "#E0E0E0",
    borderRadius: scale(6),
    padding: scale(12),
    marginBottom: scale(12),
    position: "relative",
  },
  selectedArticleItem: {
    borderColor: "#03A9F4",
    borderWidth: scale(2),
    backgroundColor: "#F3F9FF",
  },
  articleHeader: {
    flexDirection: "column",
    // justifyContent: "space-between",
    marginBottom: scale(10),
  },
  articleTitle: {
    fontSize: fs(12),
    fontWeight: fontWeight.medium,
    color: "#03A9F4",
  },
  articleLot: {
    fontSize: fs(10),
    color: "#757575",
  },
  quantityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: scale(16),
    paddingBottom: scale(12),
    borderBottomWidth: scale(1),
    borderBottomColor: "#EEEEEE",
    gap: 2,
  },
  quantityInfo: {
    alignItems: "center",
    flex: 1,
  },
  quantityLabel: {
    fontSize: fs(12),
    color: "#757575",
    marginBottom: scale(4),
  },
  quantityLabelArticleItem: {
    fontSize: fs(10),
    color: "#757575",
    marginBottom: scale(4),
  },
  quantityValue: {
    fontSize: fs(14),
    fontWeight: fontWeight.medium,
  },
  inputDisplayContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(8),
  },
  inputLabel: {
    fontSize: fs(14),
    fontWeight: fontWeight.medium,
  },
  quantityDisplayWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: scale(4),
    padding: scale(8),
    minWidth: scale(80),
  },
  quantityDisplayText: {
    fontSize: fs(14),
    marginRight: scale(8),
  },
  quantityDisplayActive: {
    color: "#03A9F4",
    fontWeight: fontWeight.bold,
  },
  quantityDisplayInactive: {
    color: "#BDBDBD",
  },
  errorText: {
    color: "#F44336",
    fontSize: fs(12),
    marginBottom: scale(8),
    textAlign: "right",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: scale(8),
  },
  statusIndicator: {
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
    marginRight: scale(6),
  },
  statusText: {
    fontSize: fs(10),
    letterSpacing: 1,
    fontWeight: fontWeight.bold,
  },
  selectionIndicator: {
    position: "absolute",
    top: scale(8),
    right: scale(8),
  },
  buttonSection: {
    margin: scale(16),
    marginTop: scale(8),
    marginBottom: scale(24),
  },
  keyboardVisibleButtons: {
    // Styles commentés conservés pour référence future
  },
  submitButton: {
    backgroundColor: "#006475",
    borderRadius: scale(8),
    padding: scale(14),
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: scale(12),
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.2,
    shadowRadius: scale(2),
  },
  submitButtonText: {
    color: "white",
    fontWeight: fontWeight.bold,
    fontSize: fs(16),
    marginLeft: scale(8),
  },
  disabledButton: {
    backgroundColor: "#BDBDBD",
    elevation: 0,
  },
  errorContainer: {
    backgroundColor: "#FFEBEE",
    margin: scale(16),
    marginTop: 0,
    borderRadius: scale(8),
    padding: scale(16),
    borderLeftWidth: scale(4),
    borderLeftColor: "#F44336",
  },
  errorMessage: {
    color: "#D32F2F",
    fontSize: fs(14),
  },

  // Styles pour la modale
  // modalContainer: {
  //   backgroundColor: "white",
  //   borderTopLeftRadius: scale(20),
  //   borderTopRightRadius: scale(20),
  // },
  // quantityModal: {
  //   padding: scale(20),
  // },
  // quantityTitle: {
  //   fontSize: fs(18),
  //   fontWeight: fontWeight.bold,
  //   color: "#424242",
  //   textAlign: "center",
  //   marginBottom: scale(8),
  // },
  // quantityArticle: {
  //   fontSize: fs(16),
  //   color: "#03A9F4",
  //   textAlign: "center",
  //   marginBottom: scale(20),
  // },
  // infoRow: {
  //   flexDirection: "row",
  //   justifyContent: "space-between",
  //   marginBottom: scale(8),
  // },
  // infoLabel: {
  //   fontSize: fs(14),
  //   color: "#757575",
  // },
  // infoValue: {
  //   fontSize: fs(14),
  //   fontWeight: fontWeight.medium,
  //   color: "#424242",
  // },
  // quantityRow: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   justifyContent: "space-between",
  //   marginVertical: scale(20),
  // },
  // quantityControls: {
  //   flexDirection: "row",
  //   alignItems: "center",
  // },
  // quantityButton: {
  //   backgroundColor: "#03A9F4",
  //   borderRadius: scale(20),
  //   width: scale(40),
  //   height: scale(40),
  //   alignItems: "center",
  //   justifyContent: "center",
  // },
  // quantityModalInput: {
  //   borderWidth: scale(1),
  //   borderColor: "#BDBDBD",
  //   borderRadius: scale(4),
  //   padding: scale(8),
  //   marginHorizontal: scale(12),
  //   minWidth: scale(80),
  //   textAlign: "center",
  //   fontSize: fs(16),
  // },
  // maxContainer: {
  //   alignItems: "center",
  //   marginBottom: scale(20),
  // },
  // maxButton: {
  //   backgroundColor: "#F0F8FF",
  //   borderColor: "#03A9F4",
  //   borderWidth: scale(1),
  //   borderRadius: scale(4),
  //   paddingVertical: scale(8),
  //   paddingHorizontal: scale(16),
  // },
  // maxButtonText: {
  //   color: "#03A9F4",
  //   fontSize: fs(14),
  //   fontWeight: fontWeight.medium,
  // },
  // modalButtons: {
  //   flexDirection: "row",
  //   justifyContent: "space-between",
  //   gap: scale(12),
  // },
  // cancelModalButton: {
  //   flex: 1,
  //   backgroundColor: "#F5F5F5",
  //   borderRadius: scale(8),
  //   paddingVertical: scale(12),
  //   alignItems: "center",
  // },
  // cancelModalButtonText: {
  //   color: "#757575",
  //   fontSize: fs(16),
  //   fontWeight: fontWeight.medium,
  // },
  // confirmButton: {
  //   flex: 1,
  //   backgroundColor: "#03A9F4",
  //   borderRadius: scale(8),
  //   paddingVertical: scale(12),
  //   alignItems: "center",
  // },
  // confirmButtonText: {
  //   color: "white",
  //   fontSize: fs(16),
  //   fontWeight: fontWeight.bold,
  // },

  quantityModal: {
    padding: scale(16),
  },
  quantityTitle: {
    fontSize: fs(20),
    fontWeight: fontWeight.bold,
    marginBottom: scale(8),
    textAlign: "center",
    color: "#006475",
  },
  quantityArticle: {
    fontSize: fs(16),
    color: "#616161",
    marginBottom: scale(16),
    textAlign: "center",
  },
  quantityInfo: {
    backgroundColor: "#F5F5F5",
    borderWidth: scale(1),
    borderColor: "rgba(25, 38, 32, 0.21)",
    padding: scale(12),
    borderRadius: scale(8),
    marginBottom: scale(16),
    flex: 1,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: scale(8),
  },
  infoLabel: {
    fontSize: fs(14),
    color: "#757575",
  },
  infoValue: {
    fontSize: fs(14),
    fontWeight: fontWeight.bold,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale(16),
  },
  // quantityLabel: {
  //   fontSize: fs(16),
  //   fontWeight: fontWeight.bold,
  // },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    backgroundColor: "#03A9F4",
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    justifyContent: "center",
    alignItems: "center",
  },
  quantityModalInput: {
    width: scale(60),
    height: scale(40),
    borderWidth: scale(1),
    borderColor: "#E0E0E0",
    borderRadius: scale(4),
    textAlign: "center",
    fontSize: fs(16),
    marginHorizontal: scale(8),
  },
  maxContainer: {
    alignItems: "flex-end",
    marginBottom: scale(16),
  },
  maxButton: {
    paddingVertical: scale(8),
    paddingHorizontal: scale(16),
    borderWidth: scale(1),
    borderColor: "#03A9F4",
    borderRadius: scale(4),
  },
  maxButtonText: {
    color: "#03A9F4",
    fontSize: fs(14),
  },
  confirmButton: {
    backgroundColor: "#006475",
    padding: scale(12),
    borderRadius: scale(8),
    alignItems: "center",
  },
  confirmButtonText: {
    color: "white",
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
  },
});

export default CreateReceptionScreen;
