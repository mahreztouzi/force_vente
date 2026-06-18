import { View, Text, TouchableOpacity } from "react-native";
import React from "react";

const ButtonAdd = ({ onPress }) => {
  return (
    <TouchableOpacity
      style={{
        position: "absolute",
        bottom: 60,
        right: 35,
        height: 70,
        width: 70,
        backgroundColor: "#5883C9",
        zIndex: 1,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 35,
        elevation: 10,
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 5 },
        shadowRadius: 6,
      }}
      onPress={onPress}
    >
      <Text
        style={{
          fontSize: 40, // Taille ajustée pour s'intégrer harmonieusement
          fontWeight: "bold",
          color: "#FFFFFF", // Contraste élevé avec le fond
        }}
      >
        +
      </Text>
    </TouchableOpacity>
  );
};

export default ButtonAdd;
