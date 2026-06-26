import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { scale, fs } from "../../../utils/responsive";
import { Spacing, Radius } from "../../../constants/Theme";

const TEXT_DARK = "#1F2937";
const TEXT_MUTED = "#6B7280";
const BORDER = "#F1F5F9";

const formatPrix = (prix) => {
  if (!prix || isNaN(prix)) return "0,00";
  return parseFloat(prix).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Card livraison réutilisable — liste des livraisons groupées par document.
 * Props :
 *   item            — objet livraison groupé { num_doc, date_liv, staut_globale, totalArticles, montantTotal }
 *   onPress         — callback tap
 *   getStatusColor  — (staut_globale) => string couleur hex
 *   getStatusLabel  — (staut_globale) => string label lisible
 */
const LivraisonCard = ({ item, onPress, getStatusColor, getStatusLabel }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.cardHeader}>
      <View style={styles.headerLeft}>
        <Text style={styles.cardDate}>{item.date_liv}</Text>
        <Text style={styles.cardNum}>N°{item.num_doc}</Text>
      </View>
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.staut_globale) + "20" },
        ]}
      >
        <View
          style={[
            styles.statusDot,
            { backgroundColor: getStatusColor(item.staut_globale) },
          ]}
        />
        <Text
          style={[
            styles.statusBadgeText,
            { color: getStatusColor(item.staut_globale) },
          ]}
        >
          {getStatusLabel(item.staut_globale)}
        </Text>
      </View>
    </View>

    <View style={styles.cardDivider} />

    <View style={styles.cardFooter}>
      <View style={styles.statItem}>
        <MaterialIcons name="inventory" size={scale(14)} color={TEXT_MUTED} />
        <Text style={styles.statText}>{item.totalArticles} articles</Text>
      </View>
      <Text style={styles.montantText}>{formatPrix(item.montantTotal)} DA</Text>
      <MaterialIcons name="chevron-right" size={scale(18)} color="#9CA3AF" />
    </View>
  </TouchableOpacity>
);

export default LivraisonCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: { flex: 1 },
  cardDate: {
    fontSize: fs(13),
    fontWeight: "700",
    color: TEXT_DARK,
    marginBottom: 2,
  },
  cardNum: { fontSize: fs(11), color: TEXT_MUTED, fontWeight: "500" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: scale(3),
    borderRadius: Radius.pill,
    marginLeft: Spacing.sm,
  },
  statusDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    marginRight: scale(4),
  },
  statusBadgeText: {
    fontSize: fs(10),
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  cardDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: Spacing.sm,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  statItem: { flexDirection: "row", alignItems: "center", gap: scale(4) },
  statText: { fontSize: fs(11), color: TEXT_MUTED, fontWeight: "500" },
  montantText: {
    flex: 1,
    fontSize: fs(14),
    fontWeight: "700",
    color: "#006475",
  },
});
