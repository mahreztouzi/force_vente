import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons, FontAwesome } from "@expo/vector-icons";
import { scale, fs } from "../../../utils/responsive";
import { Spacing, Radius } from "../../../constants/Theme";
import PriceDisplay from "../Pricedisplay";

const BLUE = "#03A9F4";
const TEXT_DARK = "#212121";
const TEXT_MUTED = "#757575";
const TEAL = "#006475";

export const getPaymentIcon = (modePaiement, size = 20) => {
  if (!modePaiement)
    return <MaterialIcons name="payment" size={size} color={TEXT_MUTED} />;
  switch (modePaiement.toUpperCase()) {
    case "ESPECE":
      return <MaterialIcons name="attach-money" size={size} color="#4CAF50" />;
    case "CHEQUE":
      return <FontAwesome name="money" size={size} color="#FF9800" />;
    default:
      return <MaterialIcons name="payment" size={size} color={TEXT_MUTED} />;
  }
};

export const formatMontant = (montant) => {
  if (!montant) return "0.00";
  return parseFloat(montant).toLocaleString("fr-DZ", {
    style: "currency",
    currency: "DZD",
  });
};

export const formatDateSAP = (dateSAP) => {
  if (!dateSAP) return "Date non disponible";
  const timestampMatch = dateSAP.match(/\/Date\((\d+)\)\//);
  if (!timestampMatch || timestampMatch.length < 2)
    return "Format de date invalide";
  const date = new Date(parseInt(timestampMatch[1]));
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

/**
 * Carte encaissement réutilisable — affiche icône paiement, date, référence, montant.
 */
const EncaissementCard = ({ item, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.iconWrap}>
      {getPaymentIcon(item.ModePaiement, scale(20))}
    </View>

    <View style={styles.infoWrap}>
      <Text style={styles.date}>{formatDateSAP(item.DateEncaissement)}</Text>
      <Text style={styles.ref} numberOfLines={1}>
        {(item.Reference && `${item.ModePaiement} - ${item.Reference}`) ||
          item.ModePaiement ||
          "Encaissement"}
      </Text>
    </View>
    <PriceDisplay amount={item.Montant} intSize={20} decSize={13} />
  </TouchableOpacity>
);

export default EncaissementCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
    borderBottomWidth: 0.1,
  },
  iconWrap: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  infoWrap: { flex: 1 },
  date: {
    fontSize: fs(13),
    fontWeight: "600",
    color: TEXT_DARK,
  },
  ref: {
    fontSize: fs(11),
    color: TEXT_MUTED,
    marginTop: 2,
  },
});
