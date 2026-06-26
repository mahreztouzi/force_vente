import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { fs, scale } from "../../../utils/responsive";

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
 * Ligne du tableau d'articles dans la modalize de détail livraison.
 * Props :
 *   article  — { article, designation_article, qte, unite, lot, prix_unitaire }
 *   index    — pour alterner la couleur de fond
 */
const ArticleRowLivraison = ({ article, index }) => (
  <View style={[styles.row, index % 2 === 0 && styles.evenRow]}>
    <View style={styles.codeColumn}>
      <Text style={styles.articleCode}>{article.article}</Text>
      <Text style={styles.articleDesignation} numberOfLines={3}>
        {article.designation_article}
      </Text>
      {article.lot ? (
        <Text style={styles.articleLot}>{article.lot}</Text>
      ) : null}
    </View>
    <View style={styles.qteColumn}>
      <Text style={styles.qteText}>
        {parseFloat(article.qte).toFixed(2)} {article.unite}
      </Text>
    </View>
    <View style={styles.qteColumn}>
      <Text style={styles.qteText}>{formatPrix(article.prix_unitaire)} DA</Text>
    </View>
  </View>
);

export default ArticleRowLivraison;

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
  articleCode: {
    fontSize: fs(10),
    color: BLUE,
    fontWeight: "700",
    marginBottom: 2,
  },
  articleDesignation: {
    fontSize: fs(11),
    color: "#374151",
    fontWeight: "500",
    lineHeight: fs(15),
  },
  articleLot: {
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
});
