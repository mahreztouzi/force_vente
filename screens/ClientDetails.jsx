// import React, { useLayoutEffect, useRef, useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   StatusBar,
//   SafeAreaView,
//   Linking,
//   Dimensions,
//   Animated,
// } from "react-native";
// import {
//   Ionicons,
//   MaterialIcons,
//   MaterialCommunityIcons,
//   Feather,
// } from "@expo/vector-icons";
// import { useNavigation } from "@react-navigation/native";
// import { Modalize } from "react-native-modalize";
// import { useDispatch, useSelector } from "react-redux";
// import { toggleFavorite } from "../redux/slices/clientSlice";

// const { height } = Dimensions.get("window");

// const ClientDetailsScreen = ({ route }) => {
//   const navigation = useNavigation();
//   const { client } = route.params;
//   const dispatch = useDispatch();
//   const { favorites } = useSelector((state) => state.clients);
//   const { motifs } = useSelector((state) => state.orders);

//   const isFavorite = favorites.includes(client.kunnr);

//   const handleToggleFavorite = () => {
//     dispatch(toggleFavorite(client.kunnr));
//   };
//   useLayoutEffect(() => {
//     navigation.setOptions({
//       //   title: client.name1,
//       title: "",
//     });
//   }, [navigation, client]);

//   const handleCall = (phoneNumber) => {
//     if (phoneNumber) {
//       Linking.openURL(`tel:${phoneNumber}`);
//     } else {
//       alert("Numéro de téléphone non disponible");
//     }
//   };

//   const handleSMS = (phoneNumber) => {
//     if (phoneNumber) {
//       Linking.openURL(`sms:${phoneNumber}`);
//     } else {
//       alert("Numéro de téléphone non disponible");
//     }
//   };

//   const handleEmail = (email) => {
//     if (email) {
//       Linking.openURL(`mailto:${email}`);
//     } else {
//       alert("Adresse e-mail non disponible");
//     }
//   };
//   const [showGrid, setShowGrid] = useState(false);
//   const slideAnim = useRef(new Animated.Value(height)).current;

//   const toggleGrid = () => {
//     if (showGrid) {
//       // Animate out
//       Animated.timing(slideAnim, {
//         toValue: height,
//         duration: 300,
//         useNativeDriver: true,
//       }).start(() => setShowGrid(false));
//     } else {
//       // Show and animate in
//       setShowGrid(true);
//       Animated.timing(slideAnim, {
//         toValue: 0,
//         duration: 300,
//         useNativeDriver: true,
//       }).start();
//     }
//   };

//   const modalizeRef = useRef(null);

//   const openModal = () => {
//     if (modalizeRef.current) {
//       modalizeRef.current.open();
//     }
//   };
//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar backgroundColor="#03A9F4" barStyle="light-content" />

//       {/* Client info section */}
//       <View style={styles.clientInfoSection}>
//         <Text style={styles.clientName}>{client.name1} </Text>
//         <Text style={styles.clientType}>{client?.Civilite} </Text>
//         {/* <Text style={styles.balanceInfo}>Solde 0.00</Text> */}
//       </View>

//       {/* Action buttons */}
//       <View style={styles.actionButtons}>
//         <TouchableOpacity
//           style={styles.actionButton}
//           onPress={handleToggleFavorite}
//         >
//           {/* <Feather name="stars" size={24} color="#03A9F4" /> */}
//           <MaterialCommunityIcons
//             name={isFavorite ? "star" : "star-outline"}
//             size={24}
//             color={isFavorite ? "#FE9900" : "#03A9F4"}
//           />
//           <Text
//             style={[
//               styles.actionText,
//               { color: isFavorite ? "#FE9900" : "#03A9F4" },
//             ]}
//           >
//             FAVORIS
//           </Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.actionButton}
//           onPress={() => handleEmail(client?.Email)}
//         >
//           {/* <Feather name="stars" size={24} color="#03A9F4" /> */}
//           <MaterialCommunityIcons name="email" size={24} color="#03A9F4" />
//           <Text style={styles.actionText}>Email</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.actionButton}
//           onPress={() => handleCall(client?.num_tel)}
//         >
//           <Feather name="phone" size={24} color="#03A9F4" />
//           <Text style={styles.actionText}>APPELER</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.actionButton}
//           onPress={() => handleSMS(client?.num_tel)}
//         >
//           <MaterialCommunityIcons
//             name="email-outline"
//             size={24}
//             color="#03A9F4"
//           />
//           <Text style={styles.actionText}>SMS</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Location section */}
//       <View style={styles.divider} />
//       <View style={styles.locationSection}>
//         <View style={styles.locationHeader}>
//           <MaterialIcons name="location-on" size={24} color="#03A9F4" />
//           <Text style={styles.locationName}>
//             {client?.Rue} {client?.CodePostale} {client?.ville}
//           </Text>
//         </View>

//         <View style={styles.locationDetails}>
//           <View style={styles.locationItem}>
//             <Text style={styles.locationLabel}>
//               {client?.DesignationWilaya
//                 ? client?.DesignationWilaya
//                 : "Information indisponible"}{" "}
//             </Text>
//             <Text style={styles.locationValue}>Wilaya</Text>
//           </View>

//           <View style={styles.locationItem}>
//             <Text style={styles.locationLabel}>
//               {client?.Pays ? client?.Pays : "Information indisponible"}{" "}
//             </Text>
//             <Text style={styles.locationValue}>Pays</Text>
//           </View>
//         </View>
//       </View>

//       {/* Phone section */}
//       <View style={styles.divider} />
//       <View style={styles.phoneSection}>
//         <Feather name="phone" size={24} color="#03A9F4" />
//         <Text style={styles.phoneInfo}>
//           {client?.num_tel ? client?.num_tel : "Information indisponible"}
//         </Text>
//       </View>

//       <View style={styles.phoneSection}>
//         <MaterialIcons name="fax" size={24} color="#03A9F4" />
//         <Text style={styles.phoneInfo}>
//           {client?.Fax ? client?.Fax : "Information indisponible"}
//         </Text>
//       </View>
//       <View style={styles.phoneSection}>
//         <MaterialIcons name="email" size={24} color="#03A9F4" />
//         <Text style={styles.phoneInfo}>
//           {client?.Email ? client?.Email : "Information indisponible"}
//         </Text>
//       </View>
//       <View style={styles.phoneSection}>
//         <MaterialIcons name="web" size={24} color="#03A9F4" />
//         <Text style={styles.phoneInfo}>
//           {client?.SiteWeb ? client?.SiteWeb : "Information indisponible"}
//         </Text>
//       </View>

//       {/* FAB */}
//       <TouchableOpacity style={styles.fab} onPress={openModal}>
//         <MaterialIcons name="add" size={24} color="white" />
//       </TouchableOpacity>

//       {/* Modalize Modal */}
//       <Modalize
//         ref={modalizeRef}
//         adjustToContentHeight={true}
//         handleStyle={styles.modalHandle}
//         modalStyle={styles.modalContainer}
//         HeaderComponent={
//           <View style={styles.gridHeader}>
//             <Text style={styles.gridHeaderText}>NOUVEAU</Text>
//           </View>
//         }
//       >
//         <View style={styles.gridContainer}>
//           {/* First row */}
//           <View style={styles.gridRow}>
//             <TouchableOpacity
//               style={styles.menuItem}
//               onPress={() => navigation.navigate("create_cmd", { client })}
//             >
//               <View style={[styles.iconCircle, { backgroundColor: "#9E9E9E" }]}>
//                 <MaterialIcons name="assignment" size={24} color="white" />
//               </View>
//               <Text style={styles.menuItemText}>Commande</Text>
//             </TouchableOpacity>
//             <TouchableOpacity
//               style={styles.menuItem}
//               onPress={() => navigation.navigate("livraison", { client })}
//             >
//               <View style={[styles.iconCircle, { backgroundColor: "#4CAF50" }]}>
//                 <MaterialIcons name="receipt" size={24} color="white" />
//               </View>
//               <Text style={styles.menuItemText}>Livraison sortante</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={styles.menuItem}
//               onPress={() => navigation.navigate("Facturation", { client })}
//             >
//               <View style={[styles.iconCircle, { backgroundColor: "#2196F3" }]}>
//                 <MaterialIcons name="attach-money" size={24} color="white" />
//               </View>
//               <Text style={styles.menuItemText}>Facture</Text>
//             </TouchableOpacity>
//           </View>

//           {/* Second row */}
//           <View style={styles.gridRow}>
//             <TouchableOpacity style={styles.menuItem}>
//               <View style={[styles.iconCircle, { backgroundColor: "#FF9800" }]}>
//                 <MaterialIcons
//                   name="assignment-return"
//                   size={24}
//                   color="white"
//                 />
//               </View>
//               <Text style={styles.menuItemText}>Commande Retour</Text>
//             </TouchableOpacity>

//             {/* <TouchableOpacity style={styles.menuItem}>
//               <View style={[styles.iconCircle, { backgroundColor: "#9E9E9E" }]}>
//                 <MaterialIcons name="close" size={24} color="white" />
//               </View>
//               <Text style={styles.menuItemText}>Non Vente</Text>
//             </TouchableOpacity> */}
//             <TouchableOpacity
//               style={styles.menuItem}
//               onPress={() => navigation.navigate("encaissement", { client })}
//             >
//               <View style={[styles.iconCircle, { backgroundColor: "#FF1199" }]}>
//                 <MaterialIcons name="attach-money" size={24} color="white" />
//               </View>
//               <Text style={styles.menuItemText}>Encaissement</Text>
//             </TouchableOpacity>

//             <TouchableOpacity style={styles.menuItem}>
//               <View style={[styles.iconCircle, { backgroundColor: "#fff" }]}>
//                 {/* <MaterialIcons name="watch-later" size={24} color="white" /> */}
//               </View>
//               {/* <Text style={styles.menuItemText}>Vente</Text> */}
//             </TouchableOpacity>
//           </View>

//           <View style={{ height: 40 }} />
//         </View>
//       </Modalize>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#FFFFFF",
//   },
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     backgroundColor: "#03A9F4",
//     paddingVertical: 16,
//     paddingHorizontal: 16,
//   },
//   backButton: {
//     padding: 8,
//   },
//   headerRight: {
//     flexDirection: "row",
//   },
//   clientInfoSection: {
//     backgroundColor: "#03A9F4",
//     paddingHorizontal: 16,
//     paddingBottom: 16,
//   },
//   clientName: {
//     color: "white",
//     fontSize: 20,
//     fontWeight: "bold",
//   },
//   clientType: {
//     color: "white",
//     fontSize: 16,
//   },
//   balanceInfo: {
//     color: "white",
//     fontSize: 14,
//     marginTop: 2,
//   },
//   actionButtons: {
//     flexDirection: "row",
//     backgroundColor: "#F5F5F5",
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: "#E0E0E0",
//   },
//   actionButton: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   actionText: {
//     color: "#03A9F4",
//     marginTop: 6,
//     fontSize: 12,
//   },
//   divider: {
//     height: 1,
//     backgroundColor: "#E0E0E0",
//   },
//   locationSection: {
//     padding: 16,
//   },
//   locationHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 16,
//   },
//   locationName: {
//     fontSize: 16,
//     fontWeight: "bold",
//     marginLeft: 8,
//   },
//   locationDetails: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     paddingLeft: 32,
//   },
//   locationItem: {
//     flex: 1,
//   },
//   locationLabel: {
//     fontSize: 14,
//     color: "#212121",
//   },
//   locationValue: {
//     fontSize: 12,
//     color: "#757575",
//   },
//   phoneSection: {
//     flexDirection: "row",
//     alignItems: "center",
//     padding: 16,
//   },
//   phoneInfo: {
//     marginLeft: 8,
//     color: "#212121",
//   },
//   fab: {
//     position: "absolute",
//     right: 16,
//     bottom: 72,
//     width: 56,
//     height: 56,
//     borderRadius: 38,
//     backgroundColor: "#FFA000",
//     justifyContent: "center",
//     alignItems: "center",
//     elevation: 4,
//   },
//   bottomNav: {
//     flexDirection: "row",
//     height: 56,
//     borderTopWidth: 1,
//     borderTopColor: "#E0E0E0",
//     position: "absolute",
//     bottom: 0,
//     left: 0,
//     right: 0,
//   },
//   navItem: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   navHome: {
//     width: 12,
//     height: 12,
//     borderRadius: 6,
//     borderWidth: 1,
//     borderColor: "#757575",
//   },
//   gridOverlay: {
//     position: "absolute",
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: "white",
//     zIndex: 2,
//   },
//   gridHeader: {
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: "#E0E0E0",
//     display: "flex",
//     flexDirection: "row",
//     justifyContent: "space-between",
//   },
//   gridHeaderText: {
//     fontSize: 16,
//     fontWeight: "bold",
//     color: "#212121",
//   },
//   gridContainer: {
//     flex: 1,
//     padding: 16,
//   },
//   gridRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 24,
//   },
//   menuItem: {
//     alignItems: "center",
//     width: "30%",
//   },
//   iconCircle: {
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     justifyContent: "center",
//     alignItems: "center",
//     marginBottom: 8,
//   },
//   menuItemText: {
//     fontSize: 12,
//     color: "#757575",
//     textAlign: "center",
//   },
//   modalContainer: {
//     backgroundColor: "white",
//     paddingTop: 8,
//   },
//   modalHandle: {
//     backgroundColor: "#E0E0E0",
//     width: 40,
//     height: 5,
//     borderRadius: 3,
//   },
//   gridHeader: {
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: "#E0E0E0",
//   },
//   gridHeaderText: {
//     fontSize: 16,
//     fontWeight: "bold",
//     color: "#212121",
//   },
//   gridContainer: {
//     padding: 16,
//   },
//   gridRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 24,
//   },
//   menuItem: {
//     alignItems: "center",
//     width: "30%",
//   },
//   iconCircle: {
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     justifyContent: "center",
//     alignItems: "center",
//     marginBottom: 8,
//   },
//   menuItemText: {
//     fontSize: 12,
//     color: "#757575",
//     textAlign: "center",
//   },
// });

// export default ClientDetailsScreen;
import React, { useLayoutEffect, useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Linking,
  Dimensions,
  Animated,
  FlatList,
  ScrollView,
} from "react-native";
import {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
  Feather,
  AntDesign,
} from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Modalize } from "react-native-modalize";
import { useDispatch, useSelector } from "react-redux";
import { toggleFavorite } from "../redux/slices/clientSlice";
import { getMotifsRetours } from "../redux/slices/orderSlice";
import { BackHandler } from "react-native";
const { height, width } = Dimensions.get("window");
import { wp, hp, fs, fontWeight, scale } from "../utils/responsive";
import ClientMap from "../components/ClientMap";
import PagerView from "react-native-pager-view";

const ClientDetailsScreen = ({ route }) => {
  const navigation = useNavigation();
  const { client } = route.params;
  console.log("client details", client);
  const dispatch = useDispatch();
  const { favorites } = useSelector((state) => state.clients);
  const { motifs } = useSelector((state) => state.orders);

  const motifModalizeRef = useRef(null);
  const modalizeRef = useRef(null);

  const isFavorite = favorites.includes(client.kunnr);
  const [showMotifsList, setShowMotifsList] = useState(false);
  const [showCommandeButtons, setShowCommandeButtons] = useState(false);

  const slideAnimButtons = useRef(new Animated.Value(300)).current; // Commence hors écran (droite)
  const fadeAnimButtons = useRef(new Animated.Value(0)).current;
  // Animations pour le grid
  const slideAnimGrid = useRef(new Animated.Value(0)).current; // Commence visible
  const fadeAnimGrid = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const handleBackPress = () => {
      // Si un modalize est ouvert, le fermer au lieu de revenir en arrière
      if (modalizeRef.current?.isOpen) {
        modalizeRef.current?.close();
        return true;
      }

      // Comportement normal - retourner à l'écran précédent
      navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress
    );
    return () => backHandler.remove();
  }, [navigation]);

  useEffect(() => {
    // Load motifs when component mounts
    dispatch(getMotifsRetours());
  }, [dispatch]);

  const handleToggleFavorite = () => {
    dispatch(toggleFavorite(client.kunnr));
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: `${client.name1}`,
    });
  }, [navigation, client]);

  const handleCall = (phoneNumber) => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      alert("Numéro de téléphone non disponible");
    }
  };

  const handleSMS = (phoneNumber) => {
    if (phoneNumber) {
      Linking.openURL(`sms:${phoneNumber}`);
    } else {
      alert("Numéro de téléphone non disponible");
    }
  };

  const handleEmail = (email) => {
    if (email) {
      Linking.openURL(`mailto:${email}`);
    } else {
      alert("Adresse e-mail non disponible");
    }
  };

  const openModal = (motifs = false) => {
    setShowMotifsList(motifs);
    modalizeRef.current?.open();
  };

  const closeModal = () => {
    setShowMotifsList(false);
    setShowCommandeButtons(false);
    modalizeRef.current?.close();
    // Reset animations
    slideAnimButtons.setValue(300);
    fadeAnimButtons.setValue(0);
    slideAnimGrid.setValue(0);
    fadeAnimGrid.setValue(1);
  };

  const handleCommandePress = () => {
    // Animation de sortie du grid
    Animated.parallel([
      Animated.timing(slideAnimGrid, {
        toValue: -300,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnimGrid, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Une fois le grid sorti, afficher les boutons
      setShowCommandeButtons(true);

      // Animation d'entrée des boutons
      Animated.parallel([
        Animated.timing(slideAnimButtons, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnimButtons, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleBackToGrid = () => {
    // Animation de sortie des boutons
    Animated.parallel([
      Animated.timing(slideAnimButtons, {
        toValue: 300,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnimButtons, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Une fois les boutons sortis, afficher le grid
      setShowCommandeButtons(false);

      // Animation d'entrée du grid
      Animated.parallel([
        Animated.timing(slideAnimGrid, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnimGrid, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleCommandeVente = () => {
    closeModal();
    // navigation.navigate("commande_liste", { client });
    // navigation.navigate("create_cmd", { client });
    navigation.navigate("create_offr", { client });
  };

  const handleCommandeRetour = () => {
    closeModal();
    // Ouvrir la modalize des motifs
    setTimeout(() => {
      motifModalizeRef.current?.open();
    }, 100);
  };

  const handleMotifSelect = (motif) => {
    motifModalizeRef.current?.close();
    // Naviguer vers la page de commande retour avec le motif sélectionné
    navigation.navigate("create_cmd", { client, motif });
  };

  // const openModal = (showMotifs = false) => {
  //   setShowMotifsList(showMotifs);
  //   if (modalizeRef.current) {
  //     modalizeRef.current.open();
  //   }
  // };

  // const closeModal = () => {
  //   if (modalizeRef.current) {
  //     modalizeRef.current.close();
  //   }
  // };

  // const handleMotifSelect = (motif) => {
  //   navigation.navigate("create_cmd", { client, motif });
  //   closeModal();
  // };

  const renderMotifItem = ({ item }) => (
    <TouchableOpacity
      style={styles.motifItem}
      onPress={() => handleMotifSelect(item)}
    >
      <Text style={styles.motifText}>{item.Bezei}</Text>
      <Text style={styles.motifCode}>Code: {item.Augru}</Text>
    </TouchableOpacity>
  );

  const renderCommandeButtons = () => (
    <Animated.View
      style={[
        styles.commandeButtonsContainer,
        {
          transform: [{ translateX: slideAnimButtons }],
          opacity: fadeAnimButtons,
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.commandeButton, styles.commandeButtonVente]}
        onPress={handleCommandeVente}
        activeOpacity={0.8}
      >
        <View style={styles.buttonIconContainer}>
          <MaterialIcons name="shopping-cart" size={26} color="#BDC3C7" />
        </View>
        <View style={styles.buttonTextContainer}>
          <Text style={styles.commandeButtonTitle}>Offre de Vente</Text>
          <Text style={styles.commandeButtonSubtitle}>
            Créer une nouvelle offre de vente
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color="#BDC3C7" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.commandeButton, styles.commandeButtonRetour]}
        onPress={handleCommandeRetour}
        activeOpacity={0.8}
      >
        <View style={styles.buttonIconContainer}>
          <MaterialIcons name="assignment-return" size={26} color="#BDC3C7" />
        </View>
        <View style={styles.buttonTextContainer}>
          <Text style={styles.commandeButtonTitle}>Commande de Retour</Text>
          <Text style={styles.commandeButtonSubtitle}>Gérer les retours</Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color="#BDC3C7" />
      </TouchableOpacity>
      {/* <View style={{ height: 40 }} /> */}
    </Animated.View>
  );
  // const renderModalContent = () => {
  //   if (showMotifsList) {
  //     return (
  //       <View style={styles.motifListContainer}>
  //         <FlatList
  //           data={motifs}
  //           renderItem={renderMotifItem}
  //           keyExtractor={(item) => item.Augru}
  //           contentContainerStyle={styles.motifListContent}
  //         />
  //       </View>
  //     );
  //   }

  //   return (
  //     <View style={styles.gridContainer}>
  //       {/* First row */}
  //       <View style={styles.gridRow}>
  //         <TouchableOpacity
  //           style={styles.menuItem}
  //           // onPress={() => navigation.navigate("create_cmd", { client })}
  //           onPress={() => navigation.navigate("commande_liste", { client })}
  //           // onPress={() => navigation.navigate("offline_cmd", { client })}
  //         >
  //           <View style={[styles.iconCircle, { backgroundColor: "#9E9E9E" }]}>
  //             <MaterialIcons name="assignment" size={24} color="white" />
  //           </View>
  //           <Text style={styles.menuItemText}>Commande</Text>
  //         </TouchableOpacity>
  //         <TouchableOpacity
  //           style={styles.menuItem}
  //           onPress={() => navigation.navigate("livraison", { client })}
  //         >
  //           <View style={[styles.iconCircle, { backgroundColor: "#4CAF50" }]}>
  //             <MaterialIcons name="receipt" size={24} color="white" />
  //           </View>
  //           <Text style={styles.menuItemText}>Livraison sortante</Text>
  //         </TouchableOpacity>

  //         <TouchableOpacity
  //           style={styles.menuItem}
  //           onPress={() => navigation.navigate("Facturation", { client })}
  //         >
  //           <View style={[styles.iconCircle, { backgroundColor: "#2196F3" }]}>
  //             <MaterialIcons name="attach-money" size={24} color="white" />
  //           </View>
  //           <Text style={styles.menuItemText}>Facture</Text>
  //         </TouchableOpacity>
  //       </View>

  //       {/* Second row */}
  //       <View style={styles.gridRow}>
  //         <TouchableOpacity
  //           style={styles.menuItem}
  //           onPress={() => openModal(true)} // Open modal with motifs list
  //         >
  //           <View style={[styles.iconCircle, { backgroundColor: "#FF9800" }]}>
  //             <MaterialIcons name="assignment-return" size={24} color="white" />
  //           </View>
  //           <Text style={styles.menuItemText}>Commande Retour</Text>
  //         </TouchableOpacity>

  //         <TouchableOpacity
  //           style={styles.menuItem}
  //           onPress={() => navigation.navigate("encaissement", { client })}
  //         >
  //           <View style={[styles.iconCircle, { backgroundColor: "#FF1199" }]}>
  //             <MaterialIcons name="attach-money" size={24} color="white" />
  //           </View>
  //           <Text style={styles.menuItemText}>Encaissement</Text>
  //         </TouchableOpacity>

  //         <TouchableOpacity
  //           style={styles.menuItem}
  //           onPress={() => navigation.navigate("brouillon", { client })}
  //         >
  //           {/* Empty space */}
  //           <View style={[styles.iconCircle, { backgroundColor: "#333" }]}>
  //             <MaterialIcons name="insert-drive-file" size={24} color="white" />
  //           </View>
  //           {/* <Text style={styles.menuItemText}>Vente</Text> */}
  //           <Text style={styles.menuItemText}>Brouillon</Text>
  //         </TouchableOpacity>
  //       </View>

  //       <View style={{ height: 40 }} />
  //     </View>
  //   );
  // };

  // const renderModalHeader = () => {
  //   return (
  //     <View style={styles.gridHeader}>
  //       <Text style={styles.gridHeaderText}>
  //         {showMotifsList ? "MOTIFS DE RETOUR" : "NOUVEAU"}
  //       </Text>
  //       {showMotifsList && (
  //         <TouchableOpacity onPress={closeModal}>
  //           <AntDesign name="close" size={24} color="#212121" />
  //         </TouchableOpacity>
  //       )}
  //     </View>
  //   );
  // };

  const renderGridContent = () => (
    <Animated.View
      style={[
        styles.gridContainer,
        {
          transform: [{ translateX: slideAnimGrid }],
          opacity: fadeAnimGrid,
        },
      ]}
    >
      {/* First row */}
      <View style={styles.gridRow}>
        <TouchableOpacity style={styles.menuItem} onPress={handleCommandePress}>
          <View style={[styles.iconCircle, { backgroundColor: "#00adee" }]}>
            <MaterialIcons name="post-add" size={24} color="white" />
          </View>
          <Text style={styles.menuItemText}>Nouvelle Commande</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("livraison", { client })}
        >
          <View style={[styles.iconCircle, { backgroundColor: "#f7a21b" }]}>
            <MaterialIcons name="inventory" size={24} color="white" />
          </View>
          <Text style={styles.menuItemText}>Nouvelle Livraison</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("encaissement", { client })}
        >
          <View style={[styles.iconCircle, { backgroundColor: "#006838" }]}>
            <MaterialIcons name="payments" size={24} color="white" />
          </View>
          <Text style={styles.menuItemText}>Encaissement</Text>
        </TouchableOpacity>
      </View>

      {/* Second row */}
      <View style={styles.gridRow}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("quotation_liste", { client })}
        >
          <View style={[styles.iconCircle, { backgroundColor: "#00a551" }]}>
            <MaterialIcons
              name="assignment-turned-in"
              size={24}
              color="white"
            />
          </View>
          <Text style={styles.menuItemText}>Mes commandes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("allOutbounds", { client })}
        >
          <View style={[styles.iconCircle, { backgroundColor: "#ec1c24" }]}>
            <MaterialIcons name="assignment-return" size={24} color="white" />
          </View>
          <Text style={styles.menuItemText}>Mes Livraison</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("brouillon", { client })}
        >
          <View style={[styles.iconCircle, { backgroundColor: "#131313" }]}>
            <MaterialIcons name="note-add" size={24} color="white" />
          </View>
          <Text style={styles.menuItemText}>Brouillon</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
  const renderModalContent = () => {
    if (showCommandeButtons) {
      return (
        <View style={styles.commandeContainer}>
          {/* <Text style={styles.commandeTitle}>
            Choisissez le type de commande
          </Text> */}
          {renderCommandeButtons()}
        </View>
      );
    }

    return renderGridContent();
  };

  const renderModalHeader = () => {
    let headerText = "NOUVEAU";
    if (showCommandeButtons) {
      headerText = " Choisissez le type de commande";
    }

    return (
      <View style={styles.gridHeader}>
        <View
          style={{
            flexDirection: "row",
            gap: 10,
            alignItems: "center",
          }}
        >
          {showCommandeButtons && (
            <TouchableOpacity onPress={handleBackToGrid}>
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color="#212121"
              />
            </TouchableOpacity>
          )}

          <Text style={styles.gridHeaderText}>{headerText}</Text>
        </View>
        <TouchableOpacity onPress={closeModal}>
          <AntDesign name="close" size={24} color="#212121" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#03A9F4" barStyle="light-content" />
      {/* Client info section */}
      <View style={styles.clientInfoSection}>
        {/* <Text style={styles.clientName}>{client.name1} </Text>
        <Text style={styles.clientType}>{client?.Civilite} </Text> */}
        <Text style={styles.balanceInfo}>
          Solde :{" "}
          {parseFloat(client.solde).toLocaleString("fr-DZ", {
            style: "currency",
            currency: "DZD",
          })}
        </Text>
      </View>

      <PagerView style={styles.container} initialPage={0}>
        <View style={{ flex: 1 }}>
          {/* Action buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleToggleFavorite}
            >
              <MaterialCommunityIcons
                name={isFavorite ? "star" : "star-outline"}
                size={24}
                color={isFavorite ? "#FE9900" : "#03A9F4"}
              />
              <Text
                style={[
                  styles.actionText,
                  { color: isFavorite ? "#FE9900" : "#03A9F4" },
                ]}
              >
                FAVORIS
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEmail(client?.Email)}
            >
              <MaterialCommunityIcons name="email" size={24} color="#03A9F4" />
              <Text style={styles.actionText}>Email</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleCall(client?.num_tel)}
            >
              <Feather name="phone" size={24} color="#03A9F4" />
              <Text style={styles.actionText}>APPELER</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleSMS(client?.num_tel)}
            >
              <MaterialCommunityIcons
                name="email-outline"
                size={24}
                color="#03A9F4"
              />
              <Text style={styles.actionText}>SMS</Text>
            </TouchableOpacity>
          </View>
          {/* Location section */}
          <View style={styles.divider} />
          <View style={styles.locationSection}>
            <View style={styles.locationHeader}>
              <MaterialIcons name="location-on" size={24} color="#03A9F4" />
              <Text style={styles.locationName}>
                {client?.Rue} {client?.CodePostale} {client?.ville}
              </Text>
            </View>

            <View style={styles.locationDetails}>
              <View style={styles.locationItem}>
                <Text style={styles.locationLabel}>
                  {client?.DesignationWilaya
                    ? client?.DesignationWilaya
                    : "Information indisponible"}{" "}
                </Text>
                <Text style={styles.locationValue}>Wilaya</Text>
              </View>

              <View style={styles.locationItem}>
                <Text style={styles.locationLabel}>
                  {client?.Pays ? client?.Pays : "Information indisponible"}{" "}
                </Text>
                <Text style={styles.locationValue}>Pays</Text>
              </View>
            </View>
          </View>
          {/* Phone section */}
          <View style={styles.divider} />
          <View style={styles.phoneSection}>
            <Feather name="phone" size={24} color="#03A9F4" />
            <Text style={styles.phoneInfo}>
              {client?.num_tel ? client?.num_tel : "Information indisponible"}
            </Text>
          </View>
          <View style={styles.phoneSection}>
            <MaterialIcons name="fax" size={24} color="#03A9F4" />
            <Text style={styles.phoneInfo}>
              {client?.Fax ? client?.Fax : "Information indisponible"}
            </Text>
          </View>
          <View style={styles.phoneSection}>
            <MaterialIcons name="email" size={24} color="#03A9F4" />
            <Text style={styles.phoneInfo}>
              {client?.Email ? client?.Email : "Information indisponible"}
            </Text>
          </View>
          <View style={styles.phoneSection}>
            <MaterialIcons name="web" size={24} color="#03A9F4" />
            <Text style={styles.phoneInfo}>
              {client?.SiteWeb ? client?.SiteWeb : "Information indisponible"}
            </Text>
          </View>
          <TouchableOpacity style={styles.fab} onPress={() => openModal(false)}>
            <MaterialIcons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <ClientMap client={client} />
      </PagerView>
      {/* FAB */}

      {/* Modalize Modal */}
      {/* <Modalize
        ref={modalizeRef}
        // modalHeight={height * 0.8}
        overlayStyle={{
          backgroundColor: "rgba(105, 177, 248, 0.14)",
        }}
        adjustToContentHeight={true}
        disableScrollIfPossible={false}
        handleStyle={styles.modalHandle}
        modalStyle={[
          styles.modalContainer,
          showMotifsList && {
            marginTop: 50,
          },
        ]}
        closeOnOverlayTap={true}
        panGestureEnabled={!showMotifsList}
        HeaderComponent={renderModalHeader()}
      >
        {renderModalContent()}
      </Modalize> */}
      <Modalize
        ref={modalizeRef}
        overlayStyle={{
          backgroundColor: "rgba(105, 177, 248, 0.14)",
        }}
        adjustToContentHeight={true}
        disableScrollIfPossible={false}
        handleStyle={styles.modalHandle}
        modalStyle={styles.modalContainer}
        closeOnOverlayTap={true}
        panGestureEnabled={true}
        HeaderComponent={renderModalHeader()}
      >
        {renderModalContent()}
      </Modalize>
      {/* Modalize pour les motifs */}
      <Modalize
        ref={motifModalizeRef}
        adjustToContentHeight
        modalStyle={styles.modal}
        handlePosition="inside"
        withHandle={false}
        scrollViewProps={{ scrollEnabled: false }}
        disableScrollIfPossible={false}
        closeOnOverlayTap={true}
        threshold={100}
        panGestureComponentEnabled={false}
        closeSnapPointStraightEnabled={false}
        velocityThreshold={0.8}
        panGestureEnabled={false}
        keyboardAvoidingBehavior="padding"
        avoidKeyboardLikeIOS={true}
      >
        <View style={styles.modalContent}>
          {/* Entête fixe */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Sélectionnez un motif de retour
            </Text>
            <TouchableOpacity onPress={() => motifModalizeRef.current?.close()}>
              <MaterialIcons name="close" size={24} color="#757575" />
            </TouchableOpacity>
          </View>

          {/* Partie scrollable */}
          <ScrollView
            style={styles.scrollableMotifContainer}
            contentContainerStyle={styles.motifListContent}
          >
            {motifs.map((item) => (
              <TouchableOpacity
                key={item.Augru}
                style={styles.motifItem}
                onPress={() => handleMotifSelect(item)}
              >
                <Text style={styles.motifText}>{item.Bezei}</Text>
                <Text style={styles.motifCode}>Code: {item.Augru}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modalize>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#03A9F4",
    paddingVertical: scale(16),
    paddingHorizontal: scale(16),
  },
  backButton: {
    padding: scale(8),
  },
  headerRight: {
    flexDirection: "row",
  },
  clientInfoSection: {
    backgroundColor: "#03A9F4",
    paddingHorizontal: scale(16),
    paddingBottom: scale(16),
  },
  clientName: {
    color: "white",
    fontSize: fs(20),
    fontWeight: fontWeight.bold,
  },
  clientType: {
    color: "white",
    fontSize: fs(16),
  },
  balanceInfo: {
    color: "white",
    fontSize: fs(20),
    fontWeight: fontWeight.medium,
    marginTop: scale(2),
    textAlign: "right",
  },
  actionButtons: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    paddingVertical: scale(12),
    borderBottomWidth: scale(1),
    borderBottomColor: "#E0E0E0",
  },
  actionButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    color: "#03A9F4",
    marginTop: scale(6),
    fontSize: fs(12),
  },
  divider: {
    height: scale(1),
    backgroundColor: "#E0E0E0",
  },
  locationSection: {
    padding: scale(16),
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale(16),
  },
  locationName: {
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
    marginLeft: scale(8),
  },
  locationDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: scale(32),
  },
  locationItem: {
    flex: 1,
  },
  locationLabel: {
    fontSize: fs(14),
    color: "#212121",
  },
  locationValue: {
    fontSize: fs(12),
    color: "#757575",
  },
  phoneSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: scale(16),
  },
  phoneInfo: {
    marginLeft: scale(8),
    color: "#212121",
  },
  fab: {
    position: "absolute",
    right: scale(16),
    bottom: scale(16),
    width: scale(56),
    height: scale(56),
    borderRadius: scale(38),
    backgroundColor: "#FFA000",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    zIndex: 1,
  },
  bottomNav: {
    flexDirection: "row",
    height: scale(56),
    borderTopWidth: scale(1),
    borderTopColor: "#E0E0E0",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  navHome: {
    width: scale(12),
    height: scale(12),
    borderRadius: scale(6),
    borderWidth: scale(1),
    borderColor: "#757575",
  },
  gridOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "white",
    zIndex: 2,
  },
  gridHeader: {
    padding: scale(16),
    borderBottomWidth: scale(1),
    borderBottomColor: "#E0E0E0",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  gridHeaderText: {
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
    color: "#212121",
  },
  gridContainer: {
    flex: 1,
    padding: scale(16),
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: scale(24),
  },
  menuItem: {
    alignItems: "center",
    width: "30%",
  },
  iconCircle: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: scale(8),
  },
  menuItemText: {
    fontSize: fs(12),
    color: "#757575",
    textAlign: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    paddingTop: scale(8),
    borderTopWidth: scale(1),
    borderColor: "rgba(59, 54, 54, 0.06)",
  },
  modalHandle: {
    backgroundColor: "#E0E0E0",
    width: scale(40),
    height: scale(5),
    borderRadius: scale(3),
  },
  motifListContainer: {
    flex: 1,
    width: "100%",
    marginBottom: scale(50),
  },
  motifListContent: {
    padding: scale(16),
  },
  motifItem: {
    padding: scale(12),
    marginBottom: scale(8),
    backgroundColor: "#f5f5f5",
    borderRadius: scale(8),
  },
  motifText: {
    fontSize: fs(16),
    fontWeight: fontWeight.medium,
    color: "#333",
  },
  motifCode: {
    fontSize: fs(12),
    color: "#666",
    marginTop: scale(4),
  },
  commandeContainer: {
    padding: scale(20),
    alignItems: "center",
  },
  commandeTitle: {
    fontSize: fs(22),
    fontWeight: fontWeight.bold,
    color: "#1a1a1a",
    marginBottom: scale(25),
    textAlign: "center",
    letterSpacing: scale(0.5),
  },
  commandeButtonsContainer: {
    width: "100%",
  },
  commandeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: scale(20),
    paddingHorizontal: scale(20),
  },
  commandeButtonVente: {
    backgroundColor: "#FFFFFF",
    // borderBottomWidth: scale(0.3),
  },
  commandeButtonRetour: {
    backgroundColor: "#FFFFFF",
  },
  buttonIconContainer: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    backgroundColor: "#F8F9FA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(15),
  },
  buttonTextContainer: {
    flex: 1,
    alignItems: "flex-start",
  },
  commandeButtonTitle: {
    color: "#2C3E50",
    fontSize: fs(17),
    fontWeight: fontWeight.medium,
    marginBottom: scale(2),
    letterSpacing: scale(0.3),
  },
  commandeButtonSubtitle: {
    color: "#7F8C8D",
    fontSize: fs(13),
    fontWeight: fontWeight.regular,
    letterSpacing: scale(0.2),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: scale(10),
    paddingHorizontal: scale(12),
  },
  scrollableMotifContainer: {
    maxHeight: scale(300),
  },
  modalTitle: {
    fontSize: fs(18),
    fontWeight: fontWeight.bold,
    color: "#333",
  },
  modalContent: {
    flex: 1,
  },
});

export default ClientDetailsScreen;
