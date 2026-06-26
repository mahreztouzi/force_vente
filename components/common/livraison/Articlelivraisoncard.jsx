import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { scale, fs } from "../../../utils/responsive";
import { Spacing, Radius } from "../../../constants/Theme";

const BLUE = "#03A9F4";
const GREEN = "#4CAF50";
const RED = "#F44336";
const ORANGE = "#FF9800";
const TEXT_DARK = "#1F2937";
const TEXT_MUTED = "#6B7280";

const ArticleLivraisonCard = ({
  item,
  stockInfo,
  onPress,
  onDeselect,
  loadingStocks,
}) => {
  const stockItem = stockInfo?.[item.id];
  const hasLot = item.charg && stockItem?.lotDetails?.[item.charg];
  const stockQuantity = item.charg
    ? hasLot
      ? stockItem.lotDetails[item.charg].AvailableStockByLot
      : 0
    : stockItem?.AvailableStock || 0;

  const isInStock = stockQuantity > 0;
  const isSelected = item.qteALivrer > 0;
  const isInsufficient = stockQuantity > 0 && stockQuantity < item.qteRestante;

  const borderColor = !isInStock
    ? RED
    : isInsufficient && isSelected
      ? "#E65100"
      : isInsufficient
        ? ORANGE
        : isSelected
          ? GREEN
          : BLUE;
  const bgColor = !isInStock
    ? "#FFEBEE"
    : isInsufficient && isSelected
      ? "#FFE0B2"
      : isInsufficient
        ? "#FFF3E0"
        : isSelected
          ? "#F1F8E9"
          : "#fff";

  const stockColor = !isInStock ? RED : isInsufficient ? ORANGE : GREEN;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { borderLeftColor: borderColor, backgroundColor: bgColor },
      ]}
      onPress={() => (isInStock ? onPress(item) : null)}
      disabled={!isInStock}
      activeOpacity={0.75}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {isSelected && (
            <MaterialIcons
              name="check-circle"
              size={scale(16)}
              color={GREEN}
              style={{ marginRight: 4 }}
            />
          )}
          <Text style={styles.itemId}>{item.id}</Text>
        </View>
        {isSelected && (
          <TouchableOpacity
            onPress={() => onDeselect(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="close" size={scale(20)} color={RED} />
          </TouchableOpacity>
        )}
      </View>

      {/* Désignation + lot */}
      <Text style={styles.designation} numberOfLines={2}>
        {item.designation}
        {item.charg ? <Text style={styles.lot}> Lot: {item.charg}</Text> : null}
      </Text>

      {/* Qtés */}
      {loadingStocks ? (
        <Text style={styles.loadingText}>Chargement du stock…</Text>
      ) : (
        <View style={styles.qtyRow}>
          <QtyBadge
            label="Cmdée"
            value={item.qteCommandee}
            unite={item.unite}
          />
          <QtyBadge
            label="Restante"
            value={item.qteRestante}
            unite={item.unite}
          />
          <QtyBadge
            label="Stock"
            value={stockQuantity}
            unite={item.unite}
            color={stockColor}
          />
          <QtyBadge
            label="À livrer"
            value={isSelected ? item.qteALivrer : "—"}
            unite={isSelected ? item.unite : ""}
            color={isSelected ? GREEN : TEXT_MUTED}
          />
        </View>
      )}

      {/* Prompt */}
      {!isInStock ? (
        <Prompt icon="error-outline" text="Stock insuffisant" color={RED} />
      ) : isSelected && isInsufficient ? (
        <Prompt
          icon="warning"
          text="Stock insuffisant pour la qté restante"
          color={ORANGE}
        />
      ) : !isSelected ? (
        <Prompt
          icon="add-circle-outline"
          text="Appuyez pour définir la quantité"
          color={BLUE}
        />
      ) : null}
    </TouchableOpacity>
  );
};

const QtyBadge = ({ label, value, unite, color = TEXT_DARK }) => (
  <View style={styles.qtyItem}>
    <Text style={styles.qtyLabel}>{label}</Text>
    <Text style={[styles.qtyValue, { color }]}>
      {value}
      {unite ? ` ${unite}` : ""}
    </Text>
  </View>
);

const Prompt = ({ icon, text, color }) => (
  <View style={styles.prompt}>
    <MaterialIcons name={icon} size={scale(16)} color={color} />
    <Text style={[styles.promptText, { color }]}>{text}</Text>
  </View>
);

export default ArticleLivraisonCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderLeftWidth: scale(4),
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  itemId: {
    fontSize: fs(15),
    fontWeight: "700",
    color: "#03A9F4",
  },
  designation: {
    fontSize: fs(13),
    color: "#374151",
    marginBottom: Spacing.sm,
    lineHeight: fs(18),
  },
  lot: {
    color: "#9CA3AF",
    fontSize: fs(12),
  },
  qtyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  qtyItem: { flex: 1 },
  qtyLabel: {
    fontSize: fs(10),
    color: "#9CA3AF",
    marginBottom: 2,
  },
  qtyValue: {
    fontSize: fs(12),
    fontWeight: "700",
  },
  prompt: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  promptText: {
    fontSize: fs(12),
    fontWeight: "500",
  },
  loadingText: {
    fontSize: fs(12),
    color: "#9CA3AF",
    fontStyle: "italic",
    marginBottom: Spacing.sm,
  },
});
