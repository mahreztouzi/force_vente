import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { scale, fs } from "../../utils/responsive";
import { Spacing, Radius } from "../../constants/Theme";
import PriceDisplay from "./Pricedisplay";
import { useTranslation } from "react-i18next";

const TEXT_DARK = "#1F2937";
const TEXT_MUTED = "#6B7280";
const BORDER = "#F1F5F9";
const TEAL = "#006475";

/**
 * Carte générique réutilisable pour toute liste de documents avec statut :
 * commandes de vente, commandes retour, livraisons, etc.
 *
 * Remplace CommandeVenteCard, LivraisonCard, CommandeCard.
 *
 * Props :
 *   date          — string, date affichée en haut à gauche
 *   number        — string, numéro de document (ex: "N°12345") — omis si hideNumber
 *   reference     — string optionnel, affiché sous le numéro (ex: "Réf: ...")
 *   hideNumber    — bool, masque le numéro (cas commande offline sans cmd encore généré)
 *   statusColor   — string hex, couleur du badge statut
 *   statusLabel   — string, libellé du badge statut
 *   articlesCount — number, nombre d'articles affiché dans le footer
 *   amount        — number BRUT (pas une chaîne formatée) — passé à PriceDisplay
 *   amountColor   — string hex, couleur du montant (défaut TEAL)
 *   isOffline     — bool, applique le style "en attente de synchro"
 *   onPress       — callback tap
 */
const StatusListCard = ({
  date,
  number,
  reference,
  hideNumber = false,
  statusColor = "#9CA3AF",
  statusLabel,
  articlesCount,
  amount,
  amountColor = TEAL,
  isOffline = false,
  onPress,
}) => {
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      style={[styles.card, isOffline && styles.offlineCard]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.dateText}>{date}</Text>
          {!hideNumber && number ? (
            <Text style={styles.numberText}>{number}</Text>
          ) : null}
          {reference ? <Text style={styles.refText}>{reference}</Text> : null}
        </View>

        {statusLabel ? (
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${statusColor}20` },
            ]}
          >
            <View
              style={[styles.statusDot, { backgroundColor: statusColor }]}
            />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.divider} />

      <View style={styles.footer}>
        {articlesCount !== undefined && (
          <View style={styles.statItem}>
            <MaterialIcons
              name="inventory"
              size={scale(14)}
              color={TEXT_MUTED}
            />
            <Text style={styles.statText}>
              {articlesCount} {t("cart.articles")}
            </Text>
          </View>
        )}

        {amount !== undefined && (
          <PriceDisplay
            amount={amount}
            color={amountColor}
            intSize={15}
            decSize={11}
            style={styles.priceWrap}
          />
        )}

        <MaterialIcons name="chevron-right" size={scale(18)} color="#9CA3AF" />
      </View>

      {isOffline && (
        <View style={styles.offlineBadge}>
          <MaterialIcons name="cloud-off" size={scale(12)} color="#F59E0B" />
        </View>
      )}
    </TouchableOpacity>
  );
};

export default StatusListCard;

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
    color: TEXT_DARK,
    marginBottom: 2,
  },
  numberText: {
    fontSize: fs(11),
    color: TEXT_MUTED,
    fontWeight: "500",
  },
  refText: {
    fontSize: fs(10),
    color: "#9CA3AF",
    marginTop: 1,
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
    backgroundColor: BORDER,
    marginVertical: Spacing.sm,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",

    gap: Spacing.sm,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  statText: {
    fontSize: fs(11),
    color: TEXT_MUTED,
    fontWeight: "500",
  },
  priceWrap: {
    flex: 1,
    justifyContent: "flex-end",
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
