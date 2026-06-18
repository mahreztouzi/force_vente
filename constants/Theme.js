import { scale, fs } from "../utils/responsive";
import Font from "./Font";

// ─── Couleurs ──────────────────────────────────────────────────────────────
export const Colors = {
  primary: "#3B82F6",
  primaryDark: "#1D4ED8",
  primaryLight: "#E8F1FA",

  secondary: "#F97316",
  secondaryDark: "#E8530A",

  textPrimary: "#1A1A1A",
  textSecondary: "#374151",
  textMuted: "#9CA3AF",
  textPlaceholder: "#CCCCCC",

  border: "#E0E0E0",
  borderFocused: "#3B82F6",

  background: "#FFFFFF",
  backgroundBeige: "rgba(248,215,190,0.9)",
  backgroundBlue: "rgba(214,229,246,0.9)",

  white: "#FFFFFF",
  black: "#000000",
  error: "#F44336",
  success: "#4CAF50",
};

// ─── Gradients ────────────────────────────────────────────────────────────
export const Gradients = {
  primaryButton: ["#F97316", "#E8530A"],
  background: {
    beige: ["rgba(248,215,190,0.9)", "transparent"],
    blue: ["transparent", "rgba(214,229,246,0.9)"],
  },
};

// ─── Espacements ──────────────────────────────────────────────────────────
export const Spacing = {
  xs: scale(4),
  sm: scale(8),
  md: scale(12),
  lg: scale(16),
  xl: scale(20),
  xxl: scale(24),
  xxxl: scale(32),
};

// ─── Rayons de bordure ────────────────────────────────────────────────────
export const Radius = {
  sm: scale(8),
  md: scale(10),
  lg: scale(12),
  xl: scale(20),
  pill: scale(30),
  circle: scale(43),
};

// ─── Typographie ──────────────────────────────────────────────────────────
export const Typography = {
  // Grands titres (écran)
  h1: {
    fontSize: fs(22),
    fontFamily: Font["poppins-bold"],
    color: Colors.textPrimary,
  },
  // Titres de section / carte
  h2: {
    fontSize: fs(20),
    fontFamily: Font["poppins-bold"],
    color: Colors.textPrimary,
  },
  // Petits titres
  h3: {
    fontSize: fs(16),
    fontFamily: Font["poppins-semiBold"],
    color: Colors.textPrimary,
  },
  // Corps de texte
  body: {
    fontSize: fs(14),
    fontFamily: Font["poppins-semiBold"],
    color: Colors.textPrimary,
  },
  // Texte petit / labels
  caption: {
    fontSize: fs(12),
    fontFamily: Font["poppins-semiBold"],
    color: Colors.textMuted,
  },
  // Label flottant des inputs
  floatLabel: {
    fontSize: fs(10),
    fontFamily: Font["poppins-semiBold"],
    color: Colors.textMuted,
  },
  // Texte de bouton
  button: {
    fontSize: fs(15),
    fontFamily: Font["poppins-bold"],
    letterSpacing: 1.2,
    color: Colors.white,
  },
};

// ─── Ombres ───────────────────────────────────────────────────────────────
export const Shadows = {
  card: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.09,
    shadowRadius: scale(16),
    elevation: 6,
  },
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  button: {
    shadowColor: Colors.secondaryDark,
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.2,
    shadowRadius: scale(6),
    elevation: 4,
  },
};

// ─── Tailles fixes communes ───────────────────────────────────────────────
export const Sizes = {
  inputHeight: scale(50),
  buttonHeight: scale(52),
  iconSm: 18,
  iconMd: 20,
  iconLg: 22,
};

export default {
  Colors,
  Gradients,
  Spacing,
  Radius,
  Typography,
  Shadows,
  Sizes,
};
