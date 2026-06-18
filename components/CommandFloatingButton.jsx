import React, { useState, useRef } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Text,
} from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";

const CommandFloatingButton = ({ navigation, client, onReturnPress }) => {
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
  const saleStyle = {
    transform: [
      { scale: animation },
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -140],
        }),
      },
    ],
    opacity: animation,
  };

  const returnStyle = {
    transform: [
      { scale: animation },
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -80],
        }),
      },
    ],
    opacity: animation,
  };

  // Animation de rotation pour l'icône principale
  const rotation = {
    transform: [
      {
        rotate: animation.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "360deg"],
        }),
      },
    ],
  };

  // Fond semi-transparent
  const backdropStyle = {
    opacity: animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.3],
    }),
    display: isOpen ? "flex" : "none",
  };

  return (
    <>
      {/* Fond semi-transparent */}
      <Animated.View
        style={[styles.backdrop, backdropStyle]}
        pointerEvents={isOpen ? "auto" : "none"}
        onTouchStart={toggleMenu}
      />

      {/* Bouton Commande Vente */}
      <Animated.View style={[styles.buttonContainer, saleStyle]}>
        <TouchableOpacity
          style={[styles.button, styles.saleButton]}
          onPress={() => {
            toggleMenu();
            navigation.navigate("brouillon_cmd", {
              client,
            });
          }}
        >
          <MaterialIcons name="shopping-cart" size={20} color="white" />
        </TouchableOpacity>
        <View style={styles.labelContainer}>
          <Text style={styles.buttonLabel}>Vente</Text>
        </View>
      </Animated.View>

      {/* Bouton Commande Retour */}
      <Animated.View style={[styles.buttonContainer, returnStyle]}>
        <TouchableOpacity
          style={[styles.button, styles.returnButton]}
          onPress={() => {
            toggleMenu();
            // navigation.navigate("brouillon_cmd", {
            //   client,
            //   motif: "return",
            // });
            onReturnPress();
          }}
        >
          <MaterialCommunityIcons
            name="cart-arrow-down"
            size={20}
            color="white"
          />
        </TouchableOpacity>
        <View style={styles.labelContainer}>
          <Text style={styles.buttonLabel}>Retour</Text>
        </View>
      </Animated.View>

      {/* Bouton principal */}
      <Animated.View style={[styles.mainButtonContainer, rotation]}>
        <TouchableOpacity
          style={[styles.button, styles.mainButton]}
          onPress={toggleMenu}
        >
          <MaterialIcons
            // name={isOpen ? "close" : "add"}
            name="shopping-cart"
            size={28}
            color="white"
          />
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
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 1,
  },
  mainButtonContainer: {
    position: "absolute",
    bottom: 30,
    right: 20,
    zIndex: 3,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 20,
    right: 20,
    zIndex: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  labelContainer: {
    position: "absolute",
    right: 60,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  buttonLabel: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  button: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  mainButton: {
    backgroundColor: "#03A9F4",
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  saleButton: {
    backgroundColor: "#4CAF50", // Vert
  },
  returnButton: {
    backgroundColor: "#FF5722", // Orange
  },
});

export default CommandFloatingButton;
