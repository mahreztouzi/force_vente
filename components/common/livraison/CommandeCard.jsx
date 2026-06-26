import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { scale, fs } from "../../../utils/responsive";
import { Spacing, Radius } from "../../../constants/Theme";

const STATUS_COLORS = {
  initial: "#3B82F6",
  encours: "#10B981",
  termine: "#8B5CF6",
};

/**
 * Carte commande réutilisable — liste principale "Commandes à livrer".
 */
const CommandeCard = ({ commande, onPress }) => {
  const statusColor = STATUS_COLORS[commande.status] || "#9CA3AF";

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.dateText}>{commande.erdat}</Text>
          <Text style={styles.cmdNumber}>N°{commande.cmd}</Text>
          {commande.vgbel && (
            <Text style={styles.vgbelText}>Réf: {commande.vgbel}</Text>
          )}
        </View>

        <View
          style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}
        >
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {commande.statutGlobal}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.footer}>
        <View style={styles.statItem}>
          <MaterialIcons name="inventory" size={scale(15)} color="#6B7280" />
          <Text style={styles.statText}>{commande.totalArticles} articles</Text>
        </View>
        <MaterialIcons name="chevron-right" size={scale(20)} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );
};

export default CommandeCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: { flex: 1 },
  dateText: {
    fontSize: fs(13),
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 2,
  },
  cmdNumber: {
    fontSize: fs(11),
    color: "#6B7280",
    fontWeight: "500",
  },
  vgbelText: {
    fontSize: fs(10),
    color: "#9CA3AF",
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    marginLeft: Spacing.sm,
  },
  statusDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    marginRight: scale(4),
  },
  statusText: {
    fontSize: fs(10),
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: Spacing.sm,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: fs(12),
    color: "#6B7280",
    fontWeight: "500",
  },
});
