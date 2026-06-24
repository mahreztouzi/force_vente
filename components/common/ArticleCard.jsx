import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors, Typography, Spacing } from "../../constants/Theme";
import { scale, fs } from "../../utils/responsive";

const CATEGORY_ICONS = {
  default: "shape-outline",
};

export const getCategoryIcon = (category) => {
  const key = (category || "").toLowerCase();
  return CATEGORY_ICONS.default;
};

/**
 * Découpe un prix en { integer, decimal } pour affichage style AliExpress :
 * partie entière en grand, décimales en petit.
 * Ex: 1234.5 → { integer: "1 234", decimal: "50" }
 */
const splitPrice = (value) => {
  const num = parseFloat(value || 0);
  const fixed = num.toFixed(2); // garantit toujours 2 décimales
  const [integerPart, decimalPart] = fixed.split(".");
  // Espace fine comme séparateur de milliers, cohérent avec le formatage fr-DZ déjà utilisé ailleurs
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return { integer: formattedInteger, decimal: decimalPart };
};

/**
 * Affiche un prix avec partie entière grande, décimales + devise petites,
 * alignés sur la ligne de base (comme AliExpress).
 */
const PriceTag = ({ value, currencyLabel = "DA" }) => {
  const { integer, decimal } = splitPrice(value);
  return (
    <View style={styles.priceRow}>
      <Text style={styles.priceInteger}>{integer}</Text>
      <Text style={styles.priceDecimal}>,{decimal}</Text>
      <Text style={styles.priceCurrency}>{currencyLabel}</Text>
    </View>
  );
};

const ArticleCard = ({ item, cartQuantity, onPress, onAddToCart }) => {
  return (
    <TouchableOpacity
      style={styles.articleCard}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.articleImageWrap}>
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={styles.articleImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.articleImagePlaceholder}>
            <MaterialCommunityIcons
              name={getCategoryIcon(item.Category)}
              size={scale(36)}
              color={Colors.textMuted}
            />
          </View>
        )}
        {cartQuantity > 0 && (
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{cartQuantity}</Text>
          </View>
        )}
      </View>

      <View style={styles.articleInfo}>
        <Text style={styles.articleName} numberOfLines={1}>
          {item.designation}
        </Text>
        <View style={styles.articleFooter}>
          <PriceTag value={item.prix} />
          <TouchableOpacity
            style={styles.addToCartBtn}
            onPress={onAddToCart}
            activeOpacity={0.7}
          >
            <Ionicons name="cart-outline" size={19} color="black" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ArticleCard;

const CARD_GAP = Spacing.md;

const styles = StyleSheet.create({
  articleCard: {
    width: "49.5%",
    backgroundColor: "rgba(255, 255, 255, 0.52)",
    borderRadius: 3,
    marginBottom: CARD_GAP,
    overflow: "hidden",
  },
  articleImageWrap: {
    width: "100%",
    height: scale(170),
    backgroundColor: Colors.primaryLight,
    position: "relative",
  },
  articleImage: {
    width: "100%",
    height: "100%",
  },
  articleImagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: Colors.secondary,
    minWidth: scale(22),
    height: scale(22),
    borderRadius: scale(11),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  cartBadgeText: {
    color: Colors.white,
    fontWeight: "800",
    fontSize: fs(11),
  },
  articleInfo: {
    padding: Spacing.md,
  },
  articleName: {
    ...Typography.body,
    fontSize: fs(13),
    marginBottom: Spacing.sm,
  },
  articleFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  // Prix style AliExpress
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline", // aligne tous les segments sur la même ligne de base, malgré les tailles différentes
  },
  priceInteger: {
    fontSize: fs(18),
    fontWeight: "bold",
    letterSpacing: 0.5,
    color: "rgba(18, 35, 46, 0.8)",
  },
  priceDecimal: {
    fontSize: fs(12),
    fontWeight: "600",
    color: "rgba(18, 35, 46, 0.8)",
  },
  priceCurrency: {
    fontSize: fs(11),
    fontWeight: "600",
    color: "rgba(18, 35, 46, 0.6)",
    marginLeft: 2,
  },

  addToCartBtn: {
    width: scale(40),
    height: scale(26),
    borderRadius: scale(15),
    borderWidth: 1.5,
    borderColor: "black",
    alignItems: "center",
    justifyContent: "center",
  },
});
