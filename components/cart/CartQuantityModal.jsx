import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { Modalize } from "react-native-modalize";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors, Spacing, Radius, Typography } from "../../constants/Theme";
import { scale, fs } from "../../utils/responsive";
import { upsertCartItem } from "../../utils/cartStorage";

const CartQuantityModal = ({ reference, article, onConfirm }) => {
  const [quantity, setQuantity] = useState("1");

  useEffect(() => {
    if (article) setQuantity("1");
  }, [article]);

  if (!article) return null;

  const unitPrice = parseFloat(article.prix || 0);
  const qteNumber = parseInt(quantity) || 0;
  const total = unitPrice * qteNumber;

  const handleIncrement = () =>
    setQuantity(String((parseInt(quantity) || 0) + 1));
  const handleDecrement = () => {
    const next = (parseInt(quantity) || 0) - 1;
    setQuantity(String(next > 0 ? next : 1));
  };

  const handleConfirm = async () => {
    const qte = parseInt(quantity);
    if (!qte || qte <= 0) return;
    await upsertCartItem(article, qte);
    reference.current?.close();
    onConfirm?.(qte);
  };

  return (
    <Modalize
      ref={reference}
      adjustToContentHeight
      modalStyle={styles.modal}
      handlePosition="inside"
      handleStyle={styles.handle}
      withHandle
    >
      <View style={styles.content}>
        {/* Image pleine largeur, prix en overlay en bas-gauche */}
        <View style={styles.imageWrap}>
          {article.image ? (
            <Image
              source={{ uri: article.image }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialCommunityIcons
                name="cube-outline"
                size={scale(44)}
                color={Colors.textMuted}
              />
            </View>
          )}
          <View style={styles.imageOverlay} />
          <View style={styles.priceTag}>
            <Text style={styles.priceTagLabel}>Prix unitaire</Text>
            <Text style={styles.priceTagValue}>
              {unitPrice.toLocaleString("fr-DZ", {
                style: "currency",
                currency: "DZD",
              })}
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.articleName} numberOfLines={2}>
            {article.designation}
          </Text>
          {article.Category && (
            <Text style={styles.articleCategory}>{article.Category}</Text>
          )}

          {/* Sélecteur de quantité */}
          <View style={styles.qtySection}>
            <Text style={styles.qtyLabel}>Quantité</Text>
            <View style={styles.qtyRow}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={handleDecrement}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="remove"
                  size={scale(20)}
                  color={Colors.textPrimary}
                />
              </TouchableOpacity>

              <TextInput
                style={styles.qtyInput}
                value={quantity}
                onChangeText={(t) => setQuantity(t.replace(/[^0-9]/g, ""))}
                keyboardType="numeric"
                selectTextOnFocus
                textAlign="center"
              />

              <TouchableOpacity
                style={[styles.qtyBtn, styles.qtyBtnAdd]}
                onPress={handleIncrement}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={scale(20)} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {total.toLocaleString("fr-DZ", {
                style: "currency",
                currency: "DZD",
              })}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={handleConfirm}
            activeOpacity={0.85}
          >
            <Ionicons
              name="cart"
              size={scale(18)}
              color={Colors.white}
              style={{ marginRight: scale(8) }}
            />
            <Text style={styles.confirmText}>AJOUTER AU PANIER</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modalize>
  );
};

export default CartQuantityModal;

const styles = StyleSheet.create({
  modal: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    overflow: "hidden",
  },
  handle: {
    backgroundColor: "rgba(255,255,255,0.7)",
    width: scale(44),
    height: scale(5),
  },
  content: {
    paddingBottom: 80,
  },

  // Image en haut, pleine largeur, coins arrondis seulement en haut (suit la modal)
  imageWrap: {
    width: "100%",
    height: scale(180),
    backgroundColor: Colors.primaryLight,
    position: "relative",
  },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  priceTag: {
    position: "absolute",
    bottom: Spacing.md,
    left: Spacing.lg,
  },
  priceTagLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: fs(11),
    marginBottom: 2,
  },
  priceTagValue: {
    color: Colors.white,
    fontWeight: "800",
    fontSize: fs(20),
  },

  body: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  articleName: {
    ...Typography.h3,
    fontSize: fs(17),
    marginBottom: Spacing.xs,
  },
  articleCategory: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
  },

  qtySection: {
    backgroundColor: "#F7F8FA",
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  qtyLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
  },
  qtyBtn: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnAdd: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  qtyInput: {
    width: scale(72),
    height: scale(48),
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    fontSize: fs(20),
    fontWeight: "700",
    color: Colors.textPrimary,
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalLabel: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  totalValue: {
    ...Typography.h2,
    color: Colors.primary,
  },

  confirmBtn: {
    flexDirection: "row",
    backgroundColor: Colors.secondary,
    borderRadius: Radius.pill,
    height: scale(54),
    alignItems: "center",
    justifyContent: "center",
  },
  confirmText: {
    color: Colors.white,
    fontWeight: "800",
    fontSize: fs(15),
    letterSpacing: 1,
  },
});
