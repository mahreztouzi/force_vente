import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Colors,
  Gradients,
  Radius,
  Typography,
  Sizes,
  Shadows,
} from "../../constants/Theme";

/**
 * Bouton principal réutilisable (gradient orange par défaut).
 *
 * Usage:
 *   <Button title="SE CONNECTER" onPress={handleLogin} loading={loading} />
 *
 * Variante outline (ex: "Continuer avec Google"):
 *   <Button title="Continuer avec Google" variant="outline" icon={<Image .../>} onPress={...} />
 */
const Button = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary", // "primary" | "outline"
  icon,
  style,
}) => {
  if (variant === "outline") {
    return (
      <TouchableOpacity
        style={[styles.outlineBtn, style]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        {icon}
        <Text style={styles.outlineText}>{title}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[styles.btnWrap, style]}
    >
      <LinearGradient
        colors={Gradients.primaryButton}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.btn}
      >
        {loading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={Typography.button}>{title}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default Button;

const styles = StyleSheet.create({
  btnWrap: {
    borderRadius: Radius.pill,
    overflow: "hidden",
    ...Shadows.button,
  },
  btn: {
    height: Sizes.buttonHeight,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.pill,
  },
  outlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    height: Sizes.inputHeight,
    backgroundColor: Colors.background,
    gap: 10,
  },
  outlineText: {
    ...Typography.body,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
});
