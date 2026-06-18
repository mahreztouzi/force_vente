// components/HeaderRightButton.js
import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const HeaderRightButton = ({ navigation, client, link }) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleNavigateToOutbounds = () => {
    setShowMenu(false);
    navigation.navigate(link, client);
  };

  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity
        style={styles.headerButton}
        onPress={() => setShowMenu(!showMenu)}
      >
        <MaterialCommunityIcons name="dots-vertical" size={24} color="white" />
      </TouchableOpacity>

      {showMenu && (
        <>
          <TouchableOpacity
            style={styles.overlay}
            onPress={() => setShowMenu(false)}
          />
          <View style={styles.dropdownMenu}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleNavigateToOutbounds}
            >
              <Text style={styles.menuItemText}>
                {link === "allOutbounds"
                  ? "Afficher mes livraisons"
                  : link === "livraison"
                  ? "Afficher mes commandes à livrer"
                  : link === "quotation_liste"
                  ? "Afficher mes offres"
                  : "Afficher mes commandes"}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    position: "relative",
  },
  headerButton: {
    marginRight: 15,
    padding: 5,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: -1000,
    right: -1000,
    bottom: -1000,
    backgroundColor: "transparent",
    zIndex: 1,
  },
  dropdownMenu: {
    position: "absolute",
    top: 35,
    right: 10,
    backgroundColor: "white",
    borderRadius: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 2,
  },
  menuItem: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    minWidth: 180,
  },
  menuItemText: {
    fontSize: 15,
    color: "#333",
  },
});

export default HeaderRightButton;
