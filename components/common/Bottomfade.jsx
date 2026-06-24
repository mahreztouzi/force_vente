import React from "react";
import { StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { scale } from "../../utils/responsive";

/**
 * BottomFade — effet de fondu blanc en bas d'un ScrollView / FlatList.
 * Usage : placer en position absolute dans le parent (position: "relative").
 *
 * Props :
 *   height  — hauteur de la zone de fondu (défaut : 90)
 *   colors  — tableau de couleurs LinearGradient (optionnel)
 *   style   — styles supplémentaires sur le container
 */
const BottomFade = ({
  height = 90,
  colors = ["transparent", "rgba(255,255,255,0.85)", "rgba(255,255,255,0.98)"],
  locations = [0, 0.55, 1],
  style,
}) => (
  <LinearGradient
    colors={colors}
    locations={locations}
    pointerEvents="none"
    style={[styles.bottomFade, { height: scale(height) }, style]}
  />
);

export default BottomFade;

const styles = StyleSheet.create({
  bottomFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
});
