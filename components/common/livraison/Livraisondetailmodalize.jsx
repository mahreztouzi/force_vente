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
import ArticleRow from "../Articlerow";
import { useTranslation } from "react-i18next";

const BLUE = "#03A9F4";
const TEXT_DARK = "#1F2937";
const TEXT_MUTED = "#6B7280";
const BORDER = "#F1F5F9";

/**
 * LivraisonDetailModalize — modalize réutilisable pour le détail d'une livraison.
 *
 * Props :
 *   reference         — ref Modalize
 *   livraison         — objet livraison sélectionné
 *   articles          — liste articles
 *   isProcessing      — bool
 *   isServerReachable — bool
 *   getProcessButtonConfig — (statut) => { show, title, icon }
 *   onPrint           — () => void
 *   onProcess         — (livraison) => void
 */
const LivraisonDetailModalize = ({
  reference,
  livraison,
  articles = [],
  isProcessing = false,
  isServerReachable = true,
  getProcessButtonConfig,
  onPrint,
  onProcess,
}) => {
  const { t } = useTranslation();
  if (!livraison) return null;

  const processConfig = getProcessButtonConfig?.(livraison.staut_globale);

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
        {/* Top row */}
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.clientName}>{livraison.clientName}</Text>
            <View style={styles.subRow}>
              <Text style={styles.meta}>
                {t("livraison.cmdNum")}
                {livraison.num_cmd}
              </Text>
              <Text style={styles.meta}>{livraison.date_liv}</Text>
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
        <Text style={styles.articlesTitle}>
          {articles.length} {t("livraison.articlesTitle")}
        </Text>

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 4 }]}>
            {t("livraison.codeDesignationShort")}
          </Text>
          <Text style={[styles.tableHeaderText, styles.right, { flex: 2 }]}>
            {t("livraison.qtyShort")}
          </Text>
          <Text style={[styles.tableHeaderText, styles.right, { flex: 2 }]}>
            {t("livraison.unitPrice")}
          </Text>
        </View>

        <ScrollView style={styles.articlesScroll} nestedScrollEnabled>
          {articles.map((a, i) => (
            <ArticleRow
              key={`${a.article}-${i}`}
              article={a}
              index={i}
              mode="livraison"
            />
          ))}
        </ScrollView>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <ActionBtn
            icon="print"
            label={t("livraison.print")}
            onPress={() => onPrint?.(livraison)}
          />
          {processConfig?.show && isServerReachable && (
            <ActionBtn
              icon={isProcessing ? null : processConfig.icon}
              label={
                isProcessing ? t("livraison.processing") : processConfig.title
              }
              onPress={() => onProcess?.(livraison)}
              disabled={isProcessing}
              loading={isProcessing}
            />
          )}
        </View>
      </View>
    </Modalize>
  );
};

const ActionBtn = ({ icon, label, onPress, disabled, loading }) => (
  <TouchableOpacity
    style={[styles.actionBtn, disabled && styles.actionBtnDisabled]}
    onPress={onPress}
    disabled={disabled}
  >
    {loading ? (
      <ActivityIndicator size="small" color={BLUE} />
    ) : (
      <MaterialIcons name={icon} size={scale(18)} color={BLUE} />
    )}
    <Text style={styles.actionBtnText}>{label}</Text>
  </TouchableOpacity>
);

export default LivraisonDetailModalize;

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
  articlesTitle: {
    fontSize: fs(13),
    fontWeight: "700",
    color: TEXT_DARK,
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
  tableHeaderText: {
    fontSize: fs(10),
    fontWeight: "700",
    color: "#334155",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  right: { textAlign: "right" },
  articlesScroll: {
    maxHeight: scale(280),
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#E5E7EB",
    borderBottomLeftRadius: Radius.md,
    borderBottomRightRadius: Radius.md,
  },
  actionsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: "#EAF6FE",
    borderWidth: 1,
    borderColor: "#B3E5FC",
  },
  actionBtnDisabled: { opacity: 0.6 },
  actionBtnText: { color: BLUE, fontWeight: "700", fontSize: fs(13) },
});
