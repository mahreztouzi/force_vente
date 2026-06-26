import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { fs, scale } from "../../../utils/responsive";

/**
 * Ligne du tableau d'articles dans la modalize de détail commande.
 */
const ArticleRowDetail = ({ article, index }) => (
  <View style={[styles.row, index % 2 === 0 && styles.evenRow]}>
    <View style={styles.codeColumn}>
      <Text style={styles.code}>{article.matnr}</Text>
      <Text style={styles.designation} numberOfLines={3}>
        {article.designation}
      </Text>
      {article.charg && <Text style={styles.lot}>Lot: {article.charg}</Text>}
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
          parseFloat(article.qte_restante) <= 0
            ? styles.negative
            : styles.positive,
        ]}
      >
        {parseFloat(article.qte_restante).toFixed(2)} {article.kmein}
      </Text>
    </View>
  </View>
);

export default ArticleRowDetail;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingVertical: scale(8),
    paddingHorizontal: scale(12),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  evenRow: {
    backgroundColor: "#F8FAFC",
  },
  codeColumn: {
    flex: 4,
    paddingRight: scale(6),
  },
  qteColumn: {
    flex: 2,
    alignItems: "flex-end",
  },
  code: {
    fontSize: fs(10),
    color: "#03A9F4",
    fontWeight: "700",
    marginBottom: 2,
  },
  designation: {
    fontSize: fs(11),
    color: "#374151",
    lineHeight: fs(15),
    fontWeight: "500",
  },
  lot: {
    fontSize: fs(9),
    color: "#6B7280",
    fontStyle: "italic",
    marginTop: 2,
  },
  qteText: {
    fontSize: fs(11),
    fontWeight: "600",
    textAlign: "right",
  },
  positive: { color: "#374151" },
  negative: { color: "#e53935" },
});
