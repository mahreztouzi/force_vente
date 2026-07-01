import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Modalize } from "react-native-modalize";
import { scale, fs } from "../../../utils/responsive";
import { Spacing, Radius } from "../../../constants/Theme";
import { useTranslation } from "react-i18next";

const BLUE = "#03A9F4";
const TEAL = "#006475";
const TEXT_DARK = "#1F2937";
const TEXT_MUTED = "#6B7280";
const BORDER = "#F1F5F9";

/**
 * QuotationDetailModalize — modalize réutilisable pour le détail d'une offre.
 *
 * Props :
 *   reference         — ref Modalize
 *   quotation         — objet offre sélectionné
 *   postes            — articles de l'offre
 *   isServerReachable — bool
 *   onArticlePress    — (article) => void
 *   onAddItem         — () => void
 */
const QuotationDetailModalize = ({
  reference,
  quotation,
  postes = [],
  isServerReachable,
  onArticlePress,
  onAddItem,
  onClosed,
}) => {
  const { t } = useTranslation();
  if (!quotation) return null;

  const canEdit = isServerReachable && quotation.status === "initial";

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
      onClosed={onClosed}
    >
      <View style={styles.content}>
        {/* Top */}
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.clientName}>{quotation.clientName}</Text>
            <View style={styles.subRow}>
              <Text style={styles.meta}>
                {postes.length} {t("cart.articles")}
              </Text>
              <Text style={styles.meta}>{quotation.erdat}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => reference.current?.close()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="close" size={scale(20)} color={TEXT_MUTED} />
          </TouchableOpacity>
        </View>

        {/* Table articles */}
        <View style={styles.tableWrap}>
          {/* En-têtes */}
          <View style={styles.tableHeader}>
            <Text style={[styles.thText, { flex: 4 }]}>
              {t("order.codeDesignation")}
            </Text>
            <Text style={[styles.thText, styles.right, { flex: 2 }]}>
              {t("order.qty")}
            </Text>
            <Text style={[styles.thText, styles.right, { flex: 2 }]}>
              {t("order.qtyAccepted")}
            </Text>
            <Text style={[styles.thText, styles.right, { flex: 2 }]}>
              {t("order.price")}
            </Text>
          </View>

          <ScrollView style={styles.tableScroll} nestedScrollEnabled>
            {postes.map((article, i) => (
              <TouchableOpacity
                key={`${article.matnr}-${i}`}
                style={[styles.row, i % 2 === 0 && styles.evenRow]}
                onPress={() => onArticlePress?.(article)}
                disabled={!canEdit}
                activeOpacity={canEdit ? 0.6 : 1}
              >
                <View style={{ flex: 4, paddingRight: scale(6) }}>
                  <Text style={styles.code}>{article.matnr}</Text>
                  <Text style={styles.designation} numberOfLines={3}>
                    {article.designation}
                  </Text>
                </View>
                <View style={[styles.cell, { flex: 2 }]}>
                  <Text style={styles.cellText}>
                    {parseFloat(article.kwmeng).toFixed(2)} {article.kmein}
                  </Text>
                </View>
                <View style={[styles.cell, { flex: 2 }]}>
                  <Text style={styles.cellText}>
                    {parseFloat(article.qte_accepte).toFixed(2)} {article.kmein}
                  </Text>
                </View>
                <View style={[styles.cell, { flex: 2 }]}>
                  <Text style={styles.cellText}>
                    {article.prix
                      ? `${parseFloat(article.prix).toFixed(2)} DA`
                      : "—"}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Actions */}
        {canEdit && (
          <TouchableOpacity style={styles.addBtn} onPress={onAddItem}>
            <MaterialIcons name="add" size={scale(18)} color={TEAL} />
            <Text style={styles.addBtnText}>{t("order.addArticle")}</Text>
          </TouchableOpacity>
        )}

        {isServerReachable && quotation.status !== "initial" && (
          <View style={styles.infoBanner}>
            <MaterialIcons
              name="info-outline"
              size={scale(18)}
              color="#FF9800"
            />
            <Text style={styles.infoText}>
              {t("order.notEditable", { status: quotation.statutGlobal })}
            </Text>
          </View>
        )}
      </View>
    </Modalize>
  );
};

export default QuotationDetailModalize;

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
  clientName: { fontSize: fs(15), fontWeight: "700", color: TEXT_DARK },
  subRow: { flexDirection: "row", gap: Spacing.md, marginTop: 2 },
  meta: { fontSize: fs(11), color: TEXT_MUTED },

  tableWrap: { marginBottom: Spacing.md },
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
    maxHeight: scale(300),
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
    borderBottomColor: BORDER,
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
  cellText: {
    fontSize: fs(11),
    fontWeight: "600",
    color: "#374151",
    textAlign: "right",
  },

  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: "#E0F2FE",
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "#B3E5FC",
    marginBottom: Spacing.sm,
  },
  addBtnText: { color: TEAL, fontWeight: "700", fontSize: fs(14) },

  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "#FFF3E0",
    borderLeftWidth: scale(4),
    borderLeftColor: "#FF9800",
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  infoText: { flex: 1, fontSize: fs(13), color: "#E65100", fontWeight: "500" },
});
