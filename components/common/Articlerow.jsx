import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { fs, scale } from "../../utils/responsive";
import { Spacing } from "../../constants/Theme";

const BLUE = "#03A9F4";
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
 * ArticleRow — ligne tableau réutilisable pour commandes & livraisons.
 *
 * Props :
 *   article   — objet article (voir modes ci-dessous)
 *   index     — pour alterner la couleur de fond
 *   mode      — "commande" | "livraison" (défaut : "livraison")
 *
 * Mode "commande" lit : matnr, designation, charg, lsmeng, qte_restante, kmein
 * Mode "livraison" lit : article, designation_article, lot, qte, unite, prix_unitaire
 */
const ArticleRow = ({ article, index, mode = "livraison" }) => {
  const isEven = index % 2 === 0;

  if (mode === "commande") {
    const qteRestante = parseFloat(article.qte_restante);
    return (
      <View style={[styles.row, isEven && styles.evenRow]}>
        <View style={styles.codeColumn}>
          <Text style={styles.code}>{article.matnr}</Text>
          <Text style={styles.designation} numberOfLines={3}>
            {article.designation}
          </Text>
          {article.charg ? (
            <Text style={styles.lot}>Lot: {article.charg}</Text>
          ) : null}
        </View>
        <View style={styles.qteColumn}>
          <Text style={styles.qteText}>
            {parseFloat(article.lsmeng).toFixed(2)} {article.kmein}
          </Text>
        </View>
        <View style={styles.qteColumn}>
          <Text
            style={[
              styles.qteText,
              qteRestante <= 0 ? styles.negative : styles.positive,
            ]}
          >
            {qteRestante.toFixed(2)} {article.kmein}
          </Text>
        </View>
      </View>
    );
  }

  // mode "livraison"
  return (
    <View style={[styles.row, isEven && styles.evenRow]}>
      <View style={styles.codeColumn}>
        <Text style={styles.code}>{article.article}</Text>
        <Text style={styles.designation} numberOfLines={3}>
          {article.designation_article}
        </Text>
        {article.lot ? <Text style={styles.lot}>{article.lot}</Text> : null}
      </View>
      <View style={styles.qteColumn}>
        <Text style={styles.qteText}>
          {parseFloat(article.qte).toFixed(2)} {article.unite}
        </Text>
      </View>
      <View style={styles.qteColumn}>
        <Text style={styles.qteText}>
          {formatPrix(article.prix_unitaire)} DA
        </Text>
      </View>
    </View>
  );
};

export default ArticleRow;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingVertical: scale(8),
    paddingHorizontal: scale(12),
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: "#fff",
  },
  evenRow: { backgroundColor: "#F8FAFC" },
  codeColumn: { flex: 4, paddingRight: scale(6) },
  qteColumn: { flex: 2, alignItems: "flex-end" },
  code: {
    fontSize: fs(10),
    color: BLUE,
    fontWeight: "700",
    marginBottom: 2,
  },
  designation: {
    fontSize: fs(11),
    color: "#374151",
    fontWeight: "500",
    lineHeight: fs(15),
  },
  lot: {
    fontSize: fs(9),
    color: TEXT_MUTED,
    fontStyle: "italic",
    marginTop: 2,
  },
  qteText: {
    fontSize: fs(11),
    fontWeight: "600",
    color: "#374151",
    textAlign: "right",
  },
  positive: { color: "#374151" },
  negative: { color: "#e53935" },
});
