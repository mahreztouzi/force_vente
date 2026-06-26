import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Modalize } from "react-native-modalize";
import { scale, fs } from "../../../utils/responsive";
import { Spacing, Radius } from "../../../constants/Theme";

const TEXT_DARK = "#1F2937";
const TEXT_MUTED = "#6B7280";
const BORDER = "#F1F5F9";

/**
 * CommandeVenteDetailModalize — modalize détail commande vente / retour.
 *
 * Props :
 *   reference  — ref Modalize
 *   commande   — objet commande sélectionné
 *   postes     — articles de la commande
 */
const CommandeVenteDetailModalize = ({ reference, commande, postes = [] }) => {
  if (!commande) return null;

  const isVente = commande.auart === "ZCMD";

  return (
    <Modalize
      ref={reference}
      adjustToContentHeight
      modalStyle={styles.modal}
      scrollViewProps={{ scrollEnabled: false }}
      disableScrollIfPossible={false}
      closeOnOverlayTap
      threshold={100}
      withHandle={false}
      panGestureEnabled={false}
      panGestureComponentEnabled={false}
      closeSnapPointStraightEnabled={false}
      velocityThreshold={0.8}
      keyboardAvoidingBehavior="padding"
      avoidKeyboardLikeIOS
    >
      <View style={styles.content}>
        {/* Top */}
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.clientName}>{commande.clientName}</Text>
            <View style={styles.subRow}>
              {commande.vgbel ? (
                <Text style={styles.meta}>Réf: {commande.vgbel}</Text>
              ) : null}
              <Text style={styles.meta}>{commande.erdat}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => reference.current?.close()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="close" size={scale(20)} color={TEXT_MUTED} />
          </TouchableOpacity>
        </View>

        {/* Table */}
        <View style={styles.tableWrap}>
          <Text style={styles.articlesTitle}>{postes.length} article(s)</Text>

          {/* En-têtes */}
          <View style={styles.tableHeader}>
            <Text style={[styles.thText, { flex: 4 }]}>Code / Désignation</Text>
            <Text style={[styles.thText, styles.right, { flex: 2 }]}>Qté</Text>
            {isVente && (
              <Text style={[styles.thText, styles.right, { flex: 2 }]}>
                Qté Rest.
              </Text>
            )}
            <Text style={[styles.thText, styles.right, { flex: 2 }]}>Prix</Text>
          </View>

          <ScrollView style={styles.tableScroll} nestedScrollEnabled>
            {postes.map((article, i) => (
              <View
                key={`${article.matnr}-${i}`}
                style={[styles.row, i % 2 === 0 && styles.evenRow]}
              >
                <View style={{ flex: 4, paddingRight: scale(6) }}>
                  <Text style={styles.code}>{article.matnr}</Text>
                  <Text style={styles.designation} numberOfLines={3}>
                    {article.designation}
                  </Text>
                  {article.charg ? (
                    <Text style={styles.lot}>Lot: {article.charg}</Text>
                  ) : null}
                </View>

                <View style={[styles.cell, { flex: 2 }]}>
                  <Text style={styles.cellText}>
                    {parseFloat(article.lsmeng).toFixed(2)} {article.kmein}
                  </Text>
                </View>

                {isVente && (
                  <View style={[styles.cell, { flex: 2 }]}>
                    <Text
                      style={[
                        styles.cellText,
                        parseFloat(article.qte_restante) <= 0 &&
                          styles.negative,
                      ]}
                    >
                      {parseFloat(article.qte_restante).toFixed(2)}{" "}
                      {article.kmein}
                    </Text>
                  </View>
                )}

                <View style={[styles.cell, { flex: 2 }]}>
                  <Text style={styles.cellText}>
                    {article.prix
                      ? `${parseFloat(article.prix).toFixed(2)} DA`
                      : "—"}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modalize>
  );
};

export default CommandeVenteDetailModalize;

const styles = StyleSheet.create({
  modal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: "90%",
  },
  content: { padding: Spacing.lg, paddingBottom: scale(32) },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  clientName: { fontSize: fs(15), fontWeight: "700", color: "#1F2937" },
  subRow: { flexDirection: "row", gap: Spacing.md, marginTop: 2 },
  meta: { fontSize: fs(11), color: "#6B7280" },

  tableWrap: { marginBottom: Spacing.sm },
  articlesTitle: {
    fontSize: fs(13),
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: Spacing.sm,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    paddingVertical: Spacing.sm,
    paddingHorizontal: scale(12),
    borderTopLeftRadius: Radius.md,
    borderTopRightRadius: Radius.md,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  thText: {
    fontSize: fs(10),
    fontWeight: "700",
    color: "#334155",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  right: { textAlign: "right" },
  tableScroll: {
    maxHeight: scale(320),
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#E5E7EB",
    borderBottomLeftRadius: Radius.md,
    borderBottomRightRadius: Radius.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingVertical: scale(8),
    paddingHorizontal: scale(12),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    backgroundColor: "#fff",
  },
  evenRow: { backgroundColor: "#F8FAFC" },
  cell: { alignItems: "flex-end" },
  code: {
    fontSize: fs(10),
    color: "#03A9F4",
    fontWeight: "700",
    marginBottom: 2,
  },
  designation: {
    fontSize: fs(11),
    color: "#374151",
    fontWeight: "500",
    lineHeight: fs(15),
  },
  lot: { fontSize: fs(9), color: "#9CA3AF", fontStyle: "italic", marginTop: 2 },
  cellText: {
    fontSize: fs(11),
    fontWeight: "600",
    color: "#374151",
    textAlign: "right",
  },
  negative: { color: "#e53935" },
});
