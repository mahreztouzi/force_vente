import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { fs, scale } from "../../utils/responsive";
import { useTranslation } from "react-i18next";

/**
 * Affichage montant style AliExpress : partie entière grande,
 * décimales + devise petites, alignées sur la ligne de base.
 *
 * Usage :
 *   <PriceDisplay amount={12500.75} />
 *   <PriceDisplay amount={total} color="#4CAF50" intSize={20} decSize={13} />
 */
const PriceDisplay = ({
  amount,
  color = "#03A9F4",
  intSize = 17,
  decSize = 11,
  style,
}) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  // Garde stricte : toute valeur non numérique retombe sur 0, jamais NaN/undefined
  const safeAmount = Number.isFinite(parseFloat(amount))
    ? parseFloat(amount)
    : 0;
  const fixed = safeAmount.toFixed(2);
  const dotIndex = fixed.indexOf(".");

  // Sécurité supplémentaire : si jamais le split échoue, on retombe sur des chaînes vides plutôt que undefined
  const intPart = dotIndex >= 0 ? fixed.slice(0, dotIndex) : fixed;
  const decPart = dotIndex >= 0 ? fixed.slice(dotIndex + 1) : "00";

  const intNumber = parseInt(intPart, 10);
  const intFormatted = Number.isFinite(intNumber)
    ? intNumber.toLocaleString("fr-DZ")
    : "0";

  const currency = t("common.soldeCurrency");
  return (
    <View style={[styles.wrap, style]}>
      {/* <Text style={[styles.int, { color, fontSize: fs(intSize) }]}>
        {intFormatted}
      </Text>
      <Text style={[styles.dec, { color, fontSize: fs(decSize) }]}>
        {","}
        {decPart}
      </Text>
      <Text style={[styles.currency, { color, fontSize: fs(decSize) }]}>
        {" DA"}
      </Text> */}

      {/* Si arabe : la devise s'affiche d'abord à gauche */}
      {isAr && (
        <Text style={[styles.currency, { color, fontSize: fs(decSize) }]}>
          {currency}
        </Text>
      )}

      <Text style={[styles.int, { color, fontSize: fs(intSize) }]}>
        {intFormatted}
      </Text>
      <Text style={[styles.dec, { color, fontSize: fs(decSize) }]}>
        {","}
        {decPart}
      </Text>

      {/* Si français : la devise s'affiche à la fin à droite */}
      {!isAr && (
        <Text style={[styles.currency, { color, fontSize: fs(decSize) }]}>
          {currency}
        </Text>
      )}
    </View>
  );
};

export default PriceDisplay;

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    direction: "ltr",
  },
  int: {
    fontWeight: "800",
  },
  dec: {
    fontWeight: "700",
    paddingBottom: scale(1),
  },
  currency: {
    fontWeight: "600",
    paddingBottom: scale(1),
  },
});
