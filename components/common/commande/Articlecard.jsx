import React, { useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { scale, fs } from "../../../utils/responsive";
import { Spacing, Radius } from "../../../constants/Theme";
import PriceDisplay from "../Pricedisplay";

const BLUE = "#03A9F4";
const RED = "#e53935";
const TEXT_DARK = "#212121";
const TEXT_MUTED = "#757575";

/**
 * Card article réutilisable — swipe vers la gauche révèle le bouton supprimer.
 * Le swipe complet (au-delà du seuil) déclenche directement la suppression,
 * sans Alert de confirmation. Une légère vibration confirme le geste au moment
 * où le bouton devient pleinement révélé.
 */
const ArticleCard = ({ item, onPress, onDelete }) => {
  const swipeableRef = useRef(null);
  const hasTriggeredHaptic = useRef(false);

  const discountRate = item?.discount ? parseFloat(item.discount) / 100 : 0;
  const priceAfterDiscount = (parseFloat(item?.prix) || 0) * (1 - discountRate);
  const quantity = parseFloat(item?.quantity) || 0;
  const total = priceAfterDiscount * quantity;

  const quantityLabel = item?.unite
    ? `${quantity.toLocaleString("fr-DZ")} ${item.unite}`
    : quantity.toLocaleString("fr-DZ");

  // Déclenche une vibration légère une seule fois quand le swipe atteint le seuil d'ouverture complète
  const handleSwipeableWillOpen = () => {
    if (!hasTriggeredHaptic.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      hasTriggeredHaptic.current = true;
    }
  };

  const handleSwipeableClose = () => {
    hasTriggeredHaptic.current = false;
  };

  // Le swipe complet (relâchement après ouverture) supprime directement, sans confirmation
  const handleSwipeableOpen = () => {
    onDelete?.();
  };

  const renderRightActions = () => (
    <TouchableOpacity
      style={styles.deleteAction}
      onPress={() => {
        swipeableRef.current?.close();
        onDelete?.();
      }}
      activeOpacity={0.8}
    >
      <MaterialIcons name="delete-outline" size={scale(22)} color="#fff" />
      <Text style={styles.deleteActionText}>Supprimer</Text>
    </TouchableOpacity>
  );

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
      rightThreshold={60}
      onSwipeableWillOpen={handleSwipeableWillOpen}
      onSwipeableOpen={handleSwipeableOpen}
      onSwipeableClose={handleSwipeableClose}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.itemHeader}>
          <Text style={styles.itemId}>{item?.id ?? ""}</Text>
          <TouchableOpacity
            onPress={onDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.deleteBtn}
          >
            <MaterialIcons name="delete-outline" size={scale(18)} color={RED} />
          </TouchableOpacity>
        </View>

        <Text style={styles.itemName} numberOfLines={2}>
          {item?.designation ?? ""}
        </Text>

        <View style={styles.itemFooter}>
          <View style={styles.quantityContainer}>
            <Text style={styles.itemLabel}>Qté :</Text>
            <Text style={styles.quantityDisplay}>{quantityLabel}</Text>
          </View>

          <PriceDisplay amount={total} intSize={14} decSize={10} />
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
};

export default ArticleCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#e9dcc552",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 0.5,
    borderColor: "#28559e33",
    direction: "ltr",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemId: {
    fontSize: fs(10),
    fontWeight: "300",
    color: BLUE,
    backgroundColor: "rgba(3, 168, 244, 0.07)",
    borderRadius: Radius.sm,
    paddingHorizontal: scale(7),
    paddingVertical: scale(2),
  },
  itemName: {
    fontSize: fs(14),
    fontWeight: "700",
    color: TEXT_DARK,
    marginBottom: Spacing.sm,
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemLabel: {
    fontSize: fs(12),
    color: TEXT_MUTED,
    marginRight: 4,
  },
  quantityDisplay: {
    fontSize: fs(13),
    fontWeight: "600",
    color: TEXT_DARK,
  },

  // Action révélée par le swipe
  deleteAction: {
    width: scale(90),
    backgroundColor: RED,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    gap: 4,
  },
  deleteActionText: {
    color: "#fff",
    fontSize: fs(11),
    fontWeight: "700",
  },
});
