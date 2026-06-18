import { Dimensions, PixelRatio } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Taille de référence (basée sur votre Poco F6 Pro)
const REFERENCE_WIDTH = 412; // Largeur logique du Poco F6 Pro
const REFERENCE_HEIGHT = 915; // Hauteur logique du Poco F6 Pro

// Calcul des ratios
const widthRatio = SCREEN_WIDTH / REFERENCE_WIDTH;
const heightRatio = SCREEN_HEIGHT / REFERENCE_HEIGHT;

// Fonction pour les largeurs
export const wp = (percentage) => {
  const value = (percentage * SCREEN_WIDTH) / 100;
  return Math.round(PixelRatio.roundToNearestPixel(value));
};

// Fonction pour les hauteurs
export const hp = (percentage) => {
  const value = (percentage * SCREEN_HEIGHT) / 100;
  return Math.round(PixelRatio.roundToNearestPixel(value));
};

// Fonction pour les fontSize (basée sur la largeur)
export const fs = (size) => {
  const newSize = size * widthRatio;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Fonction alternative pour fontSize (plus conservative)
export const fontSize = (size) => {
  const scale = Math.min(widthRatio, heightRatio);
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Fonction pour les fontWeight (reste identique sur tous les appareils)
export const fontWeight = {
  thin: "100",
  ultraLight: "200",
  light: "300",
  regular: "400",
  medium: "500",
  semiBold: "600",
  bold: "700",
  extraBold: "800",
  black: "900",
};

// Fonction pour les valeurs fixes avec scaling
export const scale = (size) => {
  const newSize = size * widthRatio;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Fonction pour obtenir les dimensions de l'écran
export const screenData = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  widthRatio,
  heightRatio,
};

// Fonction pour vérifier la taille de l'écran
export const isSmallScreen = () => SCREEN_WIDTH < 360;
export const isMediumScreen = () => SCREEN_WIDTH >= 360 && SCREEN_WIDTH < 420;
export const isLargeScreen = () => SCREEN_WIDTH >= 420;

// Fonction pour adapter selon la taille d'écran
export const adaptiveSize = (small, medium, large) => {
  if (isSmallScreen()) return small;
  if (isMediumScreen()) return medium;
  return large;
};

// Export par défaut avec toutes les fonctions
export default {
  wp,
  hp,
  fs,
  fontSize,
  fontWeight,
  scale,
  screenData,
  isSmallScreen,
  isMediumScreen,
  isLargeScreen,
  adaptiveSize,
};
