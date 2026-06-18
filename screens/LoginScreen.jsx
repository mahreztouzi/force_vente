// import {
//   SafeAreaView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
//   KeyboardAvoidingView,
//   Platform,
//   ActivityIndicator,
//   StatusBar,
//   Image,
//   Animated,
//   TextInput,
//   ScrollView,
//   Keyboard,
//   Alert,
// } from "react-native";
// import React, { useState, useEffect, useRef } from "react";
// import { Ionicons } from "@expo/vector-icons";
// import Font from "../constants/Font";
// import { Sign } from "../services/sign.service";
// import { useDispatch, useSelector } from "react-redux";
// import { loginUser, clearError, resetAuth } from "../redux/slices/authSlice";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import * as SecureStore from "expo-secure-store";
// import { wp, hp, fs, fontWeight, scale } from "../utils/responsive";
// import { getstocks } from "../redux/slices/stockSlice";
// import { getClients } from "../redux/slices/clientSlice";
// import { getTransfertDocument } from "../redux/slices/goodReceiptSlice";
// import { checkAndUpdateConnectionStatus } from "../redux/offlineActions/offlineActions";

// const CustomInput = ({
//   label,
//   icon,
//   placeholder,
//   value,
//   onChangeText,
//   secureTextEntry = false,
//   isUsername = false, // Nouveau prop pour identifier le champ username
//   isMandant = false,
// }) => {
//   const [isSecure, setIsSecure] = useState(secureTextEntry);
//   const [isFocused, setIsFocused] = useState(false);

//   return (
//     <View
//       style={[
//         styles.inputWrapper,
//         { flex: isMandant ? 0 : 1, width: isMandant ? 60 : undefined }, // Largeur fixe pour mandant
//       ]}
//     >
//       <Text style={styles.inputLabel}>{label}</Text>
//       <View
//         style={[
//           styles.customInputContainer,
//           isFocused && styles.inputFocused, // Ajuster la largeur pour le username
//         ]}
//       >
//         {isMandant ? null : (
//           <Ionicons
//             name={icon}
//             size={20}
//             color="#095C28"
//             style={styles.inputIcon}
//           />
//         )}
//         <TextInput
//           style={styles.customInput}
//           placeholder={placeholder}
//           placeholderTextColor="#AAAAAA"
//           value={value}
//           onChangeText={onChangeText}
//           secureTextEntry={isSecure}
//           // Solution 1 : Utiliser autoCapitalize pour le username
//           autoCapitalize={isUsername ? "characters" : "none"}
//           // Désactiver la correction automatique pour le username
//           autoCorrect={!isUsername}
//           // Désactiver les suggestions pour éviter les conflits
//           spellCheck={!isUsername}
//           // Type de clavier approprié
//           keyboardType={isMandant ? "numeric" : "default"}
//           maxLength={isMandant ? 3 : undefined}
//         />
//         {secureTextEntry && (
//           <TouchableOpacity
//             onPress={() => setIsSecure(!isSecure)}
//             style={styles.eyeIcon}
//           >
//             <Ionicons
//               name={isSecure ? "eye-off-outline" : "eye-outline"}
//               size={20}
//               color="#095C28"
//             />
//           </TouchableOpacity>
//         )}
//       </View>
//     </View>
//   );
// };

// const LoginScreen = ({ navigation }) => {
//   // const [isLoading, setIsLoading] = useState(false);
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [mandant, setMandant] = useState("600");
//   const [keyboardVisible, setKeyboardVisible] = useState(false);
//   const dispatch = useDispatch();
//   const { loading, error, isAuthenticated } = useSelector(
//     (state) => state.auth,
//   );

//   useEffect(() => {
//     // Vérifier l'authentification au démarrage
//     dispatch(resetAuth());
//   }, [dispatch]);

//   console.log("loading error isauthenticated", loading, error, isAuthenticated);

//   // Animation references
//   const animatedValue1 = useRef(new Animated.Value(0)).current;
//   const animatedValue2 = useRef(new Animated.Value(0)).current;

//   // Monitor keyboard visibility
//   useEffect(() => {
//     const keyboardDidShowListener = Keyboard.addListener(
//       "keyboardDidShow",
//       () => {
//         setKeyboardVisible(true);
//       },
//     );
//     const keyboardDidHideListener = Keyboard.addListener(
//       "keyboardDidHide",
//       () => {
//         setKeyboardVisible(false);
//       },
//     );

//     return () => {
//       keyboardDidShowListener.remove();
//       keyboardDidHideListener.remove();
//     };
//   }, []);

//   // Animation effect for background
//   useEffect(() => {
//     const createAnimation = (value, duration) => {
//       return Animated.loop(
//         Animated.sequence([
//           Animated.timing(value, {
//             toValue: 1,
//             duration: duration,
//             useNativeDriver: false,
//           }),
//           Animated.timing(value, {
//             toValue: 0,
//             duration: duration,
//             useNativeDriver: false,
//           }),
//         ]),
//       );
//     };

//     // Start animations with different durations for more organic feel
//     Animated.parallel([
//       createAnimation(animatedValue1, 15000),
//       createAnimation(animatedValue2, 25000),
//     ]).start();

//     return () => {
//       animatedValue1.stopAnimation();
//       animatedValue2.stopAnimation();
//     };
//   }, []);

//   // Fonction pour transformer le nom d'utilisateur en majuscules
//   const handleUsernameChange = (text) => {
//     setUsername(text.toUpperCase());
//   };

//   const handleLogin = async () => {
//     Keyboard.dismiss();
//     if (!username || !password || !mandant) {
//       Alert.alert("Erreur", "Veuillez remplir tous les champs");
//       return;
//     }

//     try {
//       await AsyncStorage.setItem("mandant", mandant);
//       await dispatch(loginUser({ email: username, password })).unwrap();
//       navigation.navigate("Tabs");
//     } catch (error) {
//       console.log("Erreur de connexion", error);
//       if (error.includes("Unauthorized")) {
//         Alert.alert("Erreur", "Nom d'utilisateur ou mot de passe incorrect");
//       } else if (error.includes("Accès refusé")) {
//         Alert.alert("Erreur", "Accès réservé aux commerciaux uniquement");
//       } else {
//         Alert.alert("Erreur", `Erreur de connexion: ${error}`);
//       }
//     }
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

//       {/* Animated background blobs with logo colors */}

//       <KeyboardAvoidingView
//         behavior={Platform.OS === "ios" ? "padding" : "height"} // <-- Modifier pour Android
//         style={styles.flex}
//         keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 20} // <-- Ajuster
//       >
//         <ScrollView
//           contentContainerStyle={styles.scrollViewContent}
//           keyboardShouldPersistTaps="handled"
//           showsVerticalScrollIndicator={false}
//           keyboardDismissMode="on-drag" // <-- Ajouter
//           overScrollMode="never" // <-- Ajouter (Android)
//         >
//           <View style={styles.headerContainer}>
//             <View style={styles.logoContainer}>
//               <Image
//                 source={require("../assets/images/logo_ddh.png")}
//                 style={styles.logo}
//                 resizeMode="contain"
//               />
//             </View>
//             <Text style={styles.welcomeText}>Bienvenue</Text>
//             <Text style={styles.subtitle}>
//               Connectez-vous pour accéder à votre compte
//             </Text>
//           </View>

//           <View style={styles.formContainer}>
//             <View style={{ flexDirection: "row", gap: 10 }}>
//               <CustomInput
//                 label="Nom d'utilisateur"
//                 icon="person-outline"
//                 placeholder="Entrez votre identifiant"
//                 value={username}
//                 onChangeText={setUsername} // Plus besoin de transformation manuelle
//                 isUsername={true} // Nouveau prop pour identifier le champ username
//               />
//               <CustomInput
//                 label="Mandant"
//                 placeholder="000"
//                 value={mandant}
//                 onChangeText={setMandant}
//                 isMandant={true}
//               />
//             </View>

//             <CustomInput
//               label="Mot de passe"
//               icon="lock-closed-outline"
//               placeholder="Entrez votre mot de passe"
//               value={password}
//               onChangeText={setPassword}
//               secureTextEntry={true}
//             />

//             {/* <TouchableOpacity style={styles.forgotPasswordContainer}>
//               <Text style={styles.forgotPasswordText}>
//                 Mot de passe oublié ?
//               </Text>
//             </TouchableOpacity> */}

//             <TouchableOpacity
//               style={styles.loginButton}
//               onPress={handleLogin}
//               disabled={loading}
//               activeOpacity={0.8}
//             >
//               {loading ? (
//                 <ActivityIndicator color="#FFFFFF" size="small" />
//               ) : (
//                 <>
//                   <Ionicons
//                     name="log-in-outline"
//                     size={22}
//                     color="#FFFFFF"
//                     style={styles.buttonIcon}
//                   />
//                   <Text style={styles.loginButtonText}>Se connecter</Text>
//                 </>
//               )}
//             </TouchableOpacity>
//           </View>

//           {!keyboardVisible && (
//             <View style={styles.footer}>
//               <Text style={styles.footerText}>
//                 © {new Date().getFullYear()} | Application DOUDAH
//               </Text>
//             </View>
//           )}
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// };

// export default LoginScreen;

// const styles = StyleSheet.create({
//   encaissementCardError: {
//     borderLeftWidth: scale(4),
//     borderLeftColor: "#F44336",
//     backgroundColor: "#FFEBEE",
//   },
//   errorText: {
//     color: "#F44336",
//     fontStyle: "italic",
//   },
//   container: {
//     flex: 1,
//     backgroundColor: "#FFFFFF",
//   },
//   flex: {
//     flex: 1,
//   },
//   backgroundContainer: {
//     ...StyleSheet.absoluteFillObject,
//     overflow: "hidden",
//   },
//   backgroundBlob: {
//     position: "absolute",
//     width: scale(300),
//     height: scale(300),
//     borderRadius: scale(150),
//     opacity: 0.16,
//   },
//   backgroundBlob1: {
//     backgroundColor: "#0E7B35", // Green from logo
//     top: "10%",
//     left: "0%",
//   },
//   backgroundBlob2: {
//     backgroundColor: "#E6C022", // Yellow from logo
//     bottom: "5%",
//     right: "10%",
//     width: scale(250),
//     height: scale(250),
//   },
//   scrollViewContent: {
//     flexGrow: 1,
//     justifyContent: "center",
//     paddingHorizontal: scale(24),
//     paddingVertical: scale(20),
//   },
//   headerContainer: {
//     alignItems: "center",
//     marginBottom: scale(30),
//   },
//   logoContainer: {
//     marginBottom: scale(20),
//     padding: scale(10),
//   },
//   logo: {
//     width: scale(110),
//     height: scale(110),
//   },
//   welcomeText: {
//     fontSize: fs(28),
//     fontFamily: Font["poppins-bold"],
//     color: "#095C28", // Darker green from logo
//     marginBottom: scale(8),
//   },
//   subtitle: {
//     fontSize: fs(14),
//     fontFamily: Font["poppins-semiBold"],
//     color: "#666666",
//     textAlign: "center",
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     padding: scale(20),
//   },
//   emptyTitle: {
//     fontSize: fs(18),
//     fontWeight: fontWeight.bold,
//     color: "#757575",
//     marginTop: scale(16),
//   },
//   emptySubtitle: {
//     fontSize: fs(14),
//     color: "#9E9E9E",
//     marginTop: scale(8),
//     textAlign: "center",
//   },
//   listContainer: {
//     marginTop: scale(10),
//   },
//   encaissementCard: {
//     backgroundColor: "white",
//     padding: scale(16),
//     marginBottom: scale(2),
//   },
//   encaissementHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "flex-start",
//     marginBottom: scale(12),
//   },
//   encaissementTypeContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     flex: 1,
//   },
//   encaissementIcon: {
//     marginRight: scale(12),
//   },
//   encaissementTypeInfo: {
//     flex: 1,
//   },
//   encaissementType: {
//     fontSize: fs(16),
//     fontWeight: fontWeight.bold,
//   },
//   encaissementSubType: {
//     fontSize: fs(14),
//     color: "#757575",
//     marginTop: scale(2),
//   },
//   encaissementAmount: {
//     alignItems: "flex-end",
//   },
//   montantText: {
//     fontSize: fs(16),
//     fontWeight: fontWeight.bold,
//     color: "#4CAF50",
//     marginBottom: scale(4),
//   },
//   encaissementDetails: {
//     marginBottom: scale(8),
//   },
//   detailRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: scale(8),
//   },
//   detailText: {
//     marginLeft: scale(8),
//     fontSize: fs(14),
//     color: "#424242",
//   },
//   // Styles pour la modalize
//   modal: {
//     backgroundColor: "white",
//     borderTopLeftRadius: scale(20),
//     borderTopRightRadius: scale(20),
//   },
//   overlay: {
//     backgroundColor: "rgba(209, 214, 222, 0.25)",
//   },
//   modalContent: {},
//   actionModalContainer: {
//     padding: scale(24),
//   },
//   actionModalTitle: {
//     fontSize: fs(18),
//     fontWeight: fontWeight.bold,
//     marginBottom: scale(24),
//     textAlign: "center",
//   },
//   encaissementInfoContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#F5F5F5",
//     padding: scale(16),
//     borderRadius: scale(8),
//     marginBottom: scale(24),
//   },
//   encaissementInfo: {
//     marginLeft: scale(12),
//     flex: 1,
//   },
//   encaissementInfoText: {
//     fontSize: fs(16),
//     fontWeight: fontWeight.bold,
//     color: "#333",
//   },
//   encaissementInfoSubText: {
//     fontSize: fs(14),
//     color: "#757575",
//     marginTop: scale(2),
//   },
//   actionButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: scale(16),
//     borderBottomWidth: scale(1),
//     borderBottomColor: "#EEEEEE",
//   },
//   actionButtonText: {
//     fontSize: fs(16),
//     marginLeft: scale(16),
//     color: "#333",
//   },
//   deleteButton: {
//     borderBottomWidth: 0,
//     marginBottom: scale(16),
//   },
//   deleteButtonText: {
//     color: "#F44336",
//   },
//   cancelButton: {
//     backgroundColor: "#EEEEEE",
//     borderRadius: scale(8),
//     padding: scale(16),
//     alignItems: "center",
//   },
//   cancelButtonText: {
//     fontSize: fs(16),
//     color: "#333",
//     fontWeight: fontWeight.medium,
//   },
//   formContainer: {
//     width: "100%",
//     borderRadius: scale(20),
//     padding: scale(24),
//     shadowOffset: {
//       width: 0,
//       height: scale(2),
//     },
//   },
//   formTitle: {
//     fontSize: fs(18),
//     fontWeight: fontWeight.bold,
//     marginBottom: scale(24),
//     textAlign: "center",
//     color: "#333",
//   },
//   formGroup: {
//     marginBottom: scale(20),
//   },
//   formLabel: {
//     fontSize: fs(14),
//     color: "#757575",
//     marginBottom: scale(8),
//   },
//   textInput: {
//     backgroundColor: "#F5F5F5",
//     borderRadius: scale(8),
//     padding: scale(12),
//     fontSize: fs(16),
//     fontWeight: fontWeight.bold,
//     borderWidth: scale(1),
//     borderColor: "#E0E0E0",
//   },
//   inputWrapper: {
//     marginBottom: scale(20),
//   },
//   inputLabel: {
//     fontSize: fs(14),
//     fontFamily: Font["poppins-semiBold"],
//     color: "#095C28", // Darker green from logo
//     marginBottom: scale(8),
//   },
//   customInputContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#F7F9FB",
//     borderRadius: scale(12),
//     borderWidth: scale(1),
//     borderColor: "rgba(9, 92, 40, 0.15)",
//     paddingVertical: scale(4),
//     paddingHorizontal: scale(12),
//     height: scale(54),
//   },
//   inputFocused: {
//     borderColor: "#095C28",
//     borderWidth: scale(1.5),
//     backgroundColor: "#FFFFFF",
//     shadowColor: "#095C28",
//     shadowOffset: {
//       width: 0,
//       height: scale(2),
//     },
//     shadowOpacity: 0.1,
//     shadowRadius: scale(3),
//     elevation: 2,
//   },
//   inputIcon: {
//     marginRight: scale(12),
//   },
//   customInput: {
//     flex: 1,
//     fontSize: fs(16),
//     color: "#333333",
//     fontFamily: Font["poppins-semiBold"],
//     paddingVertical: scale(8),
//     minHeight: scale(40),
//   },
//   eyeIcon: {
//     padding: scale(4),
//   },
//   forgotPasswordContainer: {
//     alignSelf: "flex-end",
//     marginBottom: scale(25),
//     marginTop: scale(5),
//   },
//   forgotPasswordText: {
//     fontSize: fs(14),
//     fontFamily: Font["poppins-semiBold"],
//     color: "#095C28", // Darker green from logo
//   },
//   loginButton: {
//     backgroundColor: "#095C28", // Darker green from logo
//     borderRadius: scale(12),
//     paddingVertical: scale(16),
//     alignItems: "center",
//     justifyContent: "center",
//     shadowColor: "#095C28",
//     shadowOffset: { width: 0, height: scale(4) },
//     shadowOpacity: 0.2,
//     shadowRadius: scale(8),
//     elevation: 4,
//     flexDirection: "row",
//   },
//   buttonIcon: {
//     marginRight: scale(10),
//   },
//   loginButtonText: {
//     color: "#FFFFFF",
//     fontSize: fs(16),
//     fontFamily: Font["poppins-bold"],
//   },
//   footer: {
//     marginTop: scale(30),
//     alignItems: "center",
//   },
//   footerText: {
//     fontSize: fs(12),
//     color: "#999999",
//     fontFamily: Font["poppins-semiBold"],
//   },
//   // Styles pour DateField
//   dateFieldContainer: {
//     borderColor: "#E0E0E0",
//     borderRadius: scale(8),
//   },
//   dateField: {
//     width: "100%",
//   },
//   dateFieldInput: {
//     height: scale(40),
//     width: "30%",
//     fontSize: fs(16),
//     fontWeight: fontWeight.bold,
//     color: "#333",
//     backgroundColor: "#F5F5F5",
//     borderWidth: scale(1),
//     borderColor: "#E0E0E0",
//     borderRadius: scale(8),
//   },
//   modesPaiementContainer: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     justifyContent: "space-between",
//   },
//   modePaiementButton: {
//     backgroundColor: "#F5F5F5",
//     borderRadius: scale(8),
//     padding: scale(12),
//     borderWidth: scale(1),
//     borderColor: "#E0E0E0",
//     width: "48%",
//     marginBottom: scale(10),
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   modePaiementButtonSelected: {
//     backgroundColor: "#E3F2FD",
//     borderColor: "#2196F3",
//   },
//   modePaiementIconContainer: {
//     marginRight: scale(8),
//   },
//   modePaiementButtonText: {
//     fontSize: fs(14),
//     color: "#333",
//   },
//   modePaiementButtonTextSelected: {
//     color: "#2196F3",
//     fontWeight: fontWeight.bold,
//   },
//   formActions: {
//     flexDirection: "column-reverse",
//     justifyContent: "space-between",
//     marginTop: scale(24),
//   },
//   cancelFormButton: {
//     borderRadius: scale(8),
//     padding: scale(16),
//     alignItems: "center",
//     flex: 1,
//   },
//   cancelFormButtonText: {
//     fontSize: fs(16),
//     color: "#333",
//     fontWeight: fontWeight.medium,
//   },
//   submitFormButton: {
//     backgroundColor: "#006475",
//     borderRadius: scale(10),
//     padding: scale(16),
//     alignItems: "center",
//     flex: 1,
//     marginBottom: scale(5),
//   },
//   submitFormButtonText: {
//     fontSize: fs(16),
//     color: "white",
//     fontWeight: fontWeight.bold,
//   },
//   submitButtonDisabled: {
//     backgroundColor: "#8CADB5",
//     opacity: 0.7,
//   },
// });

// import {
//   SafeAreaView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
//   KeyboardAvoidingView,
//   Platform,
//   ActivityIndicator,
//   StatusBar,
//   Image,
//   TextInput,
//   ScrollView,
//   Keyboard,
//   Alert,
// } from "react-native";
// import React, { useState, useEffect } from "react";
// import { Ionicons } from "@expo/vector-icons";
// import { LinearGradient } from "expo-linear-gradient";
// import Font from "../constants/Font";
// import { useDispatch, useSelector } from "react-redux";
// import { loginUser, resetAuth } from "../redux/slices/authSlice";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { fs, scale } from "../utils/responsive";

// const LoginScreen = ({ navigation }) => {
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [mandant, setMandant] = useState("600");
//   const [securePassword, setSecurePassword] = useState(true);
//   const [resterConnecte, setResterConnecte] = useState(false);
//   const [focusedField, setFocusedField] = useState(null);

//   const dispatch = useDispatch();
//   const { loading } = useSelector((state) => state.auth);

//   useEffect(() => {
//     dispatch(resetAuth());
//   }, [dispatch]);

//   const handleLogin = async () => {
//     Keyboard.dismiss();
//     if (!username || !password || !mandant) {
//       Alert.alert("Erreur", "Veuillez remplir tous les champs");
//       return;
//     }
//     try {
//       await AsyncStorage.setItem("mandant", mandant);
//       await dispatch(loginUser({ email: username, password })).unwrap();
//       navigation.navigate("Tabs");
//     } catch (err) {
//       if (err.includes("Unauthorized")) {
//         Alert.alert("Erreur", "Nom d'utilisateur ou mot de passe incorrect");
//       } else if (err.includes("Accès refusé")) {
//         Alert.alert("Erreur", "Accès réservé aux commerciaux uniquement");
//       } else {
//         Alert.alert("Erreur", `Erreur de connexion: ${err}`);
//       }
//     }
//   };

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <StatusBar
//         barStyle="dark-content"
//         translucent
//         backgroundColor="transparent"
//       />

//       {/* FOND GRADIENT EXACT */}

//       {/* <LinearGradient
//         colors={[
//           "#f8d7bedf", // beige gauche
//           "#F7E8D9",
//           "#FFFFFF", // centre
//           "#FFFFFF", // centre
//           "#FFFFFF", // centre
//           "#eaf2fbc9", // bleu clair
//           "#d6e5f6",
//         ]}
//         locations={[0, 0.25, 0.9, 0.1, 0.1, 0.1, 1]}
//         start={{ x: 0, y: 0.4 }}
//         end={{ x: 0.5, y: 0.65 }}
//         style={StyleSheet.absoluteFillObject}
//       /> */}
//       <View style={StyleSheet.absoluteFillObject}>
//         {/* Fond blanc */}
//         <View
//           style={[
//             StyleSheet.absoluteFillObject,
//             { backgroundColor: "#FFFFFF" },
//           ]}
//         />

//         {/* Halo beige */}
//         <LinearGradient
//           colors={["rgba(248,215,190,0.9)", "transparent"]}
//           locations={[0.1, 1]}
//           start={{ x: 0, y: -0.1 }}
//           end={{ x: 0.9, y: 0.2 }}
//           style={StyleSheet.absoluteFillObject}
//         />

//         {/* Halo bleu */}
//         <LinearGradient
//           colors={["transparent", "rgba(214,229,246,0.9)"]}
//           locations={[0.8, 1]}
//           start={{ x: -0.2, y: 0 }}
//           end={{ x: 1, y: 0.6 }}
//           style={StyleSheet.absoluteFillObject}
//         />
//       </View>

//       <KeyboardAvoidingView
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//         style={styles.flex}
//         keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
//       >
//         <ScrollView
//           contentContainerStyle={styles.scroll}
//           keyboardShouldPersistTaps="handled"
//           showsVerticalScrollIndicator={false}
//           keyboardDismissMode="on-drag"
//         >
//           {/* LOGO */}
//           <Image
//             source={require("../assets/images/Logo_no_back.png")}
//             style={styles.logo}
//             resizeMode="contain"
//           />

//           {/* AVATAR — en dehors de la carte */}
//           <View style={styles.avatarCircle}>
//             <Ionicons name="person" size={scale(46)} color="#4A90D9" />
//           </View>

//           {/* CARTE BLANCHE — sans shadow */}
//           <View style={styles.card}>
//             <Text style={styles.cardTitle}>Connexion</Text>

//             {/* Champ Nom utilisateur + Mandant */}
//             <View
//               style={[
//                 styles.inputWrap,
//                 focusedField === "user" && styles.inputWrapFocused,
//               ]}
//             >
//               <Text
//                 style={[
//                   styles.floatLabel,
//                   focusedField === "user" && styles.floatLabelFocused,
//                 ]}
//               >
//                 Nom d'utilisateur / Mandant
//               </Text>
//               <View style={styles.inputRow}>
//                 <Ionicons
//                   name="person-outline"
//                   size={18}
//                   color="#AAAAAA"
//                   style={styles.inputIcon}
//                 />
//                 <TextInput
//                   style={styles.input}
//                   placeholder="Identifiant"
//                   placeholderTextColor="#CCCCCC"
//                   value={username}
//                   onChangeText={(t) => setUsername(t.toUpperCase())}
//                   autoCapitalize="characters"
//                   autoCorrect={false}
//                   onFocus={() => setFocusedField("user")}
//                   onBlur={() => setFocusedField(null)}
//                 />
//                 <View style={styles.mandantSeparator} />
//                 <TextInput
//                   style={styles.mandantInput}
//                   placeholder="000"
//                   placeholderTextColor="#CCCCCC"
//                   value={mandant}
//                   onChangeText={setMandant}
//                   keyboardType="numeric"
//                   maxLength={3}
//                   onFocus={() => setFocusedField("user")}
//                   onBlur={() => setFocusedField(null)}
//                 />
//               </View>
//             </View>

//             {/* Champ Mot de passe */}
//             <View
//               style={[
//                 styles.inputWrap,
//                 focusedField === "pass" && styles.inputWrapFocused,
//               ]}
//             >
//               <View style={styles.inputRow}>
//                 <Ionicons
//                   name="lock-closed-outline"
//                   size={18}
//                   color="#AAAAAA"
//                   style={styles.inputIcon}
//                 />
//                 <TextInput
//                   style={styles.input}
//                   placeholder="Mot de passe"
//                   placeholderTextColor="#CCCCCC"
//                   value={password}
//                   onChangeText={setPassword}
//                   secureTextEntry={securePassword}
//                   autoCapitalize="none"
//                   onFocus={() => setFocusedField("pass")}
//                   onBlur={() => setFocusedField(null)}
//                 />
//                 <TouchableOpacity
//                   onPress={() => setSecurePassword(!securePassword)}
//                 >
//                   <Ionicons
//                     name={securePassword ? "eye-off-outline" : "eye-outline"}
//                     size={20}
//                     color="#CCCCCC"
//                   />
//                 </TouchableOpacity>
//               </View>
//             </View>

//             {/* Rester connecté + Mot de passe oublié */}
//             <View style={styles.optionsRow}>
//               <TouchableOpacity
//                 style={styles.checkRow}
//                 onPress={() => setResterConnecte(!resterConnecte)}
//                 activeOpacity={0.7}
//               >
//                 {/* <View
//                   style={[
//                     styles.checkbox,
//                     resterConnecte && styles.checkboxChecked,
//                   ]}
//                 >
//                   {resterConnecte && (
//                     <Ionicons name="checkmark" size={10} color="#fff" />
//                   )}
//                 </View>
//                 <Text style={styles.checkLabel}>Rester connecté</Text> */}
//               </TouchableOpacity>
//               <TouchableOpacity activeOpacity={0.7}>
//                 <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
//               </TouchableOpacity>
//             </View>

//             {/* BOUTON SE CONNECTER — gradient orange */}
//             <TouchableOpacity
//               onPress={handleLogin}
//               disabled={loading}
//               activeOpacity={0.85}
//               style={styles.btnWrap}
//             >
//               <LinearGradient
//                 colors={["#F97316", "#E8530A"]}
//                 start={{ x: 0, y: 0 }}
//                 end={{ x: 1, y: 0 }}
//                 style={styles.btn}
//               >
//                 {loading ? (
//                   <ActivityIndicator color="#fff" />
//                 ) : (
//                   <Text style={styles.btnText}>SE CONNECTER</Text>
//                 )}
//               </LinearGradient>
//             </TouchableOpacity>

//             {/* OR */}
//             {/* <View style={styles.orRow}>
//               <View style={styles.orLine} />
//               <Text style={styles.orText}>or</Text>
//               <View style={styles.orLine} />
//             </View> */}

//             {/* Google */}
//             {/* <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
//               <Image
//                 source={{
//                   uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/480px-Google_%22G%22_logo.svg.png",
//                 }}
//                 style={styles.socialIcon}
//               />
//               <Text style={styles.socialText}>Continuer avec Google</Text>
//             </TouchableOpacity> */}

//             {/* Facebook */}
//             {/* <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
//               <Ionicons
//                 name="logo-facebook"
//                 size={22}
//                 color="#1877F2"
//                 style={styles.socialIcon}
//               />
//               <Text style={styles.socialText}>Continuer avec Facebook</Text>
//             </TouchableOpacity> */}
//           </View>

//           {/* NOUVEAU — EN DEHORS de la carte */}
//           <TouchableOpacity style={styles.newAccountBtn} activeOpacity={0.7}>
//             <Text style={styles.newAccountText}>
//               Nouveau ?{" "}
//               <Text style={styles.newAccountLink}>Créer un compte</Text>
//             </Text>
//           </TouchableOpacity>
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// };

// export default LoginScreen;

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//   },
//   flex: { flex: 1 },

//   scroll: {
//     flexGrow: 1,
//     alignItems: "center",
//     paddingTop: scale(50),
//     paddingBottom: scale(30),
//     paddingHorizontal: scale(24),
//   },

//   logo: {
//     width: scale(170),
//     height: scale(90),
//     marginBottom: scale(20),
//   },

//   // Avatar EN DEHORS de la carte
//   avatarCircle: {
//     width: scale(86),
//     height: scale(86),
//     borderRadius: scale(43),
//     backgroundColor: "#E8F1FA",
//     alignItems: "center",
//     justifyContent: "center",
//     marginBottom: scale(-43), // chevauche la carte
//     zIndex: 10,
//     borderWidth: scale(3),
//     borderColor: "#fff",
//   },

//   // Carte — PAS de shadow
//   card: {
//     width: "100%",
//     backgroundColor: "#FFFFFF",
//     borderRadius: scale(20),
//     paddingTop: scale(58),
//     paddingHorizontal: scale(22),
//     paddingBottom: scale(24),
//   },

//   cardTitle: {
//     textAlign: "center",
//     fontSize: fs(20),
//     fontWeight: "700",
//     color: "#1A1A1A",
//     marginBottom: scale(24),
//   },

//   // Input
//   inputWrap: {
//     borderWidth: 1.5,
//     borderColor: "#E0E0E0",
//     borderRadius: scale(10),
//     paddingHorizontal: scale(12),
//     marginBottom: scale(14),
//     backgroundColor: "#FFFFFF",
//     position: "relative",
//   },
//   inputWrapFocused: {
//     borderColor: "#3B82F6",
//   },
//   floatLabel: {
//     position: "absolute",
//     top: scale(-9),
//     left: scale(38),
//     fontSize: fs(10),
//     color: "#9CA3AF",
//     backgroundColor: "#FFFFFF",
//     paddingHorizontal: scale(3),
//   },
//   floatLabelFocused: {
//     color: "#3B82F6",
//   },
//   inputRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     minHeight: scale(50),
//   },
//   inputIcon: {
//     marginRight: scale(10),
//   },
//   input: {
//     flex: 1,
//     fontSize: fs(14),
//     color: "#1A1A1A",
//     paddingVertical: scale(10),
//   },
//   mandantSeparator: {
//     width: 1,
//     height: scale(22),
//     backgroundColor: "#E0E0E0",
//     marginHorizontal: scale(8),
//   },
//   mandantInput: {
//     width: scale(44),
//     fontSize: fs(14),
//     color: "#1A1A1A",
//     textAlign: "center",
//     paddingVertical: scale(10),
//   },

//   // Options
//   optionsRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     marginBottom: scale(22),
//     marginTop: scale(4),
//   },
//   checkRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: scale(8),
//   },
//   checkbox: {
//     width: scale(16),
//     height: scale(16),
//     borderWidth: 1.5,
//     borderColor: "#9CA3AF",
//     borderRadius: scale(3),
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "#fff",
//   },
//   checkboxChecked: {
//     backgroundColor: "#3B82F6",
//     borderColor: "#3B82F6",
//   },
//   checkLabel: {
//     fontSize: fs(13),
//     color: "#374151",
//   },
//   forgotText: {
//     fontSize: fs(13),
//     color: "#3B82F6",
//     fontWeight: "600",
//   },

//   // Bouton
//   btnWrap: {
//     borderRadius: scale(30),
//     overflow: "hidden",
//     marginBottom: scale(20),
//   },
//   btn: {
//     height: scale(52),
//     alignItems: "center",
//     justifyContent: "center",
//     borderRadius: scale(30),
//   },
//   btnText: {
//     color: "#FFFFFF",
//     fontSize: fs(15),
//     fontWeight: "800",
//     letterSpacing: 1.5,
//   },

//   // OR
//   orRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: scale(16),
//     gap: scale(10),
//   },
//   orLine: {
//     flex: 1,
//     height: 1,
//     backgroundColor: "#E5E7EB",
//   },
//   orText: {
//     fontSize: fs(12),
//     color: "#9CA3AF",
//   },

//   // Social
//   socialBtn: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     borderWidth: 1.5,
//     borderColor: "#E5E7EB",
//     borderRadius: scale(12),
//     height: scale(50),
//     marginBottom: scale(12),
//     backgroundColor: "#FFFFFF",
//     gap: scale(10),
//   },
//   socialIcon: {
//     width: scale(22),
//     height: scale(22),
//   },
//   socialText: {
//     fontSize: fs(14),
//     color: "#374151",
//     fontWeight: "500",
//   },

//   // Nouveau compte — EN DEHORS de la carte
//   newAccountBtn: {
//     marginTop: scale(20),
//     alignItems: "center",
//   },
//   newAccountText: {
//     fontSize: fs(13),
//     color: "#6B7280",
//   },
//   newAccountLink: {
//     color: "#3B82F6",
//     fontWeight: "600",
//   },
// });

import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Image,
  ScrollView,
  Keyboard,
  Alert,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, resetAuth } from "../redux/slices/authSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { scale } from "../utils/responsive";
import { Colors, Typography, Spacing } from "../constants/Theme";
import { Ionicons } from "@expo/vector-icons";

import ScreenBackground from "../components/common/ScreenBackground";
import Card from "../components/common/Card";
import Input from "../components/common/Input";
import Button from "../components/common/Button";

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mandant, setMandant] = useState("600");

  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(resetAuth());
  }, [dispatch]);

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!username || !password || !mandant) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }
    try {
      await AsyncStorage.setItem("mandant", mandant);
      await dispatch(loginUser({ email: username, password })).unwrap();
      navigation.navigate("Tabs");
    } catch (err) {
      if (err.includes("Unauthorized")) {
        Alert.alert("Erreur", "Nom d'utilisateur ou mot de passe incorrect");
      } else if (err.includes("Accès refusé")) {
        Alert.alert("Erreur", "Accès réservé aux commerciaux uniquement");
      } else {
        Alert.alert("Erreur", `Erreur de connexion: ${err}`);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />
      <ScreenBackground />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        >
          <Image
            source={require("../assets/images/Logo_no_back.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={scale(46)} color={Colors.primary} />
          </View>

          <Card topInset={58}>
            <Text style={[Typography.h2, styles.cardTitle]}>Connexion</Text>

            <Input
              label="Nom d'utilisateur / Mandant"
              icon="person-outline"
              placeholder="Identifiant"
              value={username}
              onChangeText={(t) => setUsername(t.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
              secondaryValue={mandant}
              onSecondaryChangeText={setMandant}
              secondaryPlaceholder="000"
            />

            <Input
              icon="lock-closed-outline"
              placeholder="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <View style={styles.optionsRow}>
              <View />
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
              </TouchableOpacity>
            </View>

            <Button
              title="SE CONNECTER"
              onPress={handleLogin}
              loading={loading}
            />
          </Card>

          <TouchableOpacity style={styles.newAccountBtn} activeOpacity={0.7}>
            <Text style={styles.newAccountText}>
              Nouveau ?{" "}
              <Text style={styles.newAccountLink}>Créer un compte</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    paddingTop: Spacing.xxxl + scale(18),
    paddingBottom: Spacing.xxxl,
    paddingHorizontal: Spacing.xxl,
  },
  logo: {
    width: scale(170),
    height: scale(90),
    marginBottom: Spacing.xl,
  },
  avatarCircle: {
    width: scale(86),
    height: scale(86),
    borderRadius: scale(43),
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: -scale(43),
    zIndex: 10,
    borderWidth: 3,
    borderColor: Colors.white,
  },
  cardTitle: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xl,
  },
  forgotText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: "600",
  },
  newAccountBtn: {
    marginTop: Spacing.xl,
    alignItems: "center",
  },
  newAccountText: {
    ...Typography.caption,
  },
  newAccountLink: {
    color: Colors.primary,
    fontWeight: "600",
  },
});
