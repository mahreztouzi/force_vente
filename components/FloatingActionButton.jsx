import React, { useState, useRef } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Text,
} from "react-native";
import {
  MaterialIcons,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

const FloatingActionButton = ({ navigation }) => {
  const [isOpen, setIsOpen] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;

  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1;

    Animated.spring(animation, {
      toValue,
      friction: 5,
      useNativeDriver: true,
    }).start();

    setIsOpen(!isOpen);
  };

  // Animations pour chaque bouton
  const commandeStyle = {
    transform: [
      { scale: animation },
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -200],
        }),
      },
    ],
    opacity: animation,
  };

  const livraisonStyle = {
    transform: [
      { scale: animation },
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -140],
        }),
      },
      //   {
      //     translateX: animation.interpolate({
      //       inputRange: [0, 1],
      //       outputRange: [0, -40],
      //     }),
      //   },
    ],
    opacity: animation,
  };

  const factureStyle = {
    transform: [
      { scale: animation },
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -75],
        }),
      },
      //   {
      //     translateX: animation.interpolate({
      //       inputRange: [0, 1],
      //       outputRange: [0, -60],
      //     }),
      //   },
    ],
    opacity: animation,
  };

  // Animation de rotation pour l'icône principale
  const rotation = {
    transform: [
      {
        rotate: animation.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "45deg"],
        }),
      },
    ],
  };

  // Fond semi-transparent qui apparaît lorsque le menu est ouvert
  const backdropStyle = {
    opacity: animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.5],
    }),
    display: isOpen ? "flex" : "none",
  };

  return (
    <>
      {/* Fond semi-transparent qui ferme le menu quand on clique dessus */}
      <Animated.View
        style={[styles.backdrop, backdropStyle]}
        pointerEvents={isOpen ? "auto" : "none"}
        onTouchStart={toggleMenu}
      />

      {/* Bouton Commande */}
      <Animated.View style={[styles.buttonContainer, commandeStyle]}>
        <TouchableOpacity
          style={[styles.button, styles.commandeButton]}
          onPress={() => {
            toggleMenu();
            navigation.navigate("DocumentViewer", { documentType: "ZCMD" });
          }}
        >
          <MaterialIcons name="assignment" size={20} color="white" />
        </TouchableOpacity>
        <View style={styles.labelContainer}>
          <Text style={styles.buttonLabel}>Commandes</Text>
        </View>
      </Animated.View>

      {/* Bouton Livraison */}
      <Animated.View style={[styles.buttonContainer, livraisonStyle]}>
        <TouchableOpacity
          style={[styles.button, styles.livraisonButton]}
          onPress={() => {
            toggleMenu();
            navigation.navigate("DocumentViewer", { documentType: "ZLIV" });
          }}
        >
          <MaterialIcons name="local-shipping" size={20} color="white" />
        </TouchableOpacity>
        <View style={styles.labelContainer}>
          <Text style={styles.buttonLabel}>Livraison</Text>
        </View>
      </Animated.View>

      {/* Bouton Facture */}
      <Animated.View style={[styles.buttonContainer, factureStyle]}>
        <TouchableOpacity
          style={[styles.button, styles.factureButton]}
          onPress={() => {
            toggleMenu();
            navigation.navigate("DocumentViewer", { documentType: "ZFLC" });
          }}
        >
          <MaterialCommunityIcons
            name="file-document"
            size={20}
            color="white"
          />
        </TouchableOpacity>
        <View style={styles.labelContainer}>
          <Text style={styles.buttonLabel}>Facture</Text>
        </View>
      </Animated.View>

      {/* Bouton principal */}
      <Animated.View style={[styles.mainButtonContainer, rotation]}>
        <TouchableOpacity
          style={[styles.button, styles.mainButton]}
          onPress={toggleMenu}
        >
          {isOpen ? (
            <MaterialIcons name="add" size={28} color="white" />
          ) : (
            <MaterialCommunityIcons
              name="file-document"
              size={28}
              color="white"
            />
          )}
        </TouchableOpacity>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // backgroundColor: "white",
    backgroundColor: "rgba(105, 177, 248, 0.14)",
    zIndex: 1,
  },
  mainButtonContainer: {
    position: "absolute",
    bottom: 33,
    right: 24,
    zIndex: 3,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 24,
    right: 24,
    zIndex: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  labelContainer: {
    position: "absolute",
    right: 56,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  buttonLabel: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.25,
    // shadowRadius: 3.84,
    // elevation: 5,
  },
  mainButton: {
    backgroundColor: "#03A9F4",
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  commandeButton: {
    backgroundColor: "#FF9800",
  },
  livraisonButton: {
    backgroundColor: "#4CAF50",
  },
  factureButton: {
    backgroundColor: "#9C27B0",
  },
});
export default FloatingActionButton;
