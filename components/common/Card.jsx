import React from "react";
import { View, StyleSheet } from "react-native";
import { Colors, Radius, Spacing, Shadows } from "../../constants/Theme";

/**
 * Carte blanche réutilisable.
 *
 * Usage:
 *   <Card>{...contenu...}</Card>
 *
 * Avec ombre (pour les écrans qui en ont besoin):
 *   <Card shadow>{...}</Card>
 *
 * Padding top plus grand (pour laisser la place à un avatar qui chevauche):
 *   <Card topInset={58}>{...}</Card>
 */
const Card = ({ children, shadow = false, topInset, style }) => {
  return (
    <View
      style={[
        styles.card,
        shadow && Shadows.card,
        topInset !== undefined && { paddingTop: topInset },
        style,
      ]}
    >
      {children}
    </View>
  );
};

export default Card;

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: Colors.background,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.xxl,
    paddingTop: Spacing.xxl,
  },
});
