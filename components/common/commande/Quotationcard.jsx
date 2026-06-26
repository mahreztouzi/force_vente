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
 * QuotationCard — carte réutilisable pour la liste des offres.
 *
 * Props :
 *   item     — { cmd, erdat, status, statutGlobal, totalArticles, montantTtc, isOffline }
 *   onPress  — () => void
 */
const QuotationCard = ({ item, onPress }) => {
  const statusColor = STATUS_COLORS[item.status] || "#9CA3AF";

  return (
    <TouchableOpacity
      style={[styles.card, item.isOffline && styles.offlineCard]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.dateText}>{item.erdat}</Text>
          {!item.isOffline && (
            <Text style={styles.cmdNumber}>N°{item.cmd}</Text>
          )}
        </View>

        <View
          style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}
        >
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {item.statutGlobal}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <View style={styles.statItem}>
            <MaterialIcons name="inventory" size={scale(15)} color="#6B7280" />
            <Text style={styles.statText}>{item.totalArticles} articles</Text>
          </View>
          <Text style={styles.montantText}>{item.montantTtc}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={scale(20)} color="#9CA3AF" />
      </View>

      {item.isOffline && (
        <View style={styles.offlineBadge}>
          <MaterialIcons name="cloud-off" size={scale(12)} color="#F59E0B" />
        </View>
      )}
    </TouchableOpacity>
  );
};

export default QuotationCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  offlineCard: {
    backgroundColor: "#FFFBEB",
    borderLeftWidth: scale(4),
    borderLeftColor: "#F59E0B",
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
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: scale(4),
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
  footerLeft: { flex: 1 },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    marginBottom: scale(2),
  },
  statText: {
    fontSize: fs(12),
    color: "#6B7280",
    fontWeight: "500",
  },
  montantText: {
    fontSize: fs(15),
    fontWeight: "700",
    color: "#006475",
  },
  offlineBadge: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: "#FEF3C7",
    borderRadius: scale(10),
    padding: scale(4),
  },
});
