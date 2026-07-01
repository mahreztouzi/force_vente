import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Modalize } from "react-native-modalize";
import { scale, fs } from "../../../utils/responsive";
import { Spacing, Radius } from "../../../constants/Theme";
import { useTranslation } from "react-i18next";
import PriceDisplay from "../Pricedisplay";

const BLUE = "#03A9F4";
const TEAL = "#006475";

/**
 * QuotationQuantityModalize — modal quantité/prix pour offres.
 *
 * Props :
 *   reference         — ref Modalize
 *   statusOperation   — "add" | "update"
 *   selectedArticle   — article en cours d'édition
 *   selectedNewArticle — article de remplacement (ajout)
 *   quantity          — string
 *   setQuantity       — (v) => void
 *   minQuantity       — number
 *   loading           — bool
 *   onConfirm         — () => void
 *   onChooseOther     — () => void
 */
const QuotationQuantityModalize = ({
  reference,
  statusOperation,
  selectedArticle,
  selectedNewArticle,
  quantity,
  setQuantity,
  minQuantity = 0,
  loading = false,
  onConfirm,
  onChooseOther,
  onClosed,
}) => {
  const { t } = useTranslation();
  const article = selectedNewArticle || selectedArticle;
  const prix = parseFloat(article?.prix) || 0;
  const total = prix * (parseFloat(quantity) || 0);

  const decrement = () => {
    const val = parseFloat(quantity);
    if (!isNaN(val) && val > minQuantity) setQuantity((val - 1).toString());
  };

  const increment = () => {
    const val = parseFloat(quantity);
    setQuantity(
      (!isNaN(val) ? val + 1 : minQuantity > 0 ? minQuantity : 1).toString(),
    );
  };

  return (
    <Modalize
      ref={reference}
      adjustToContentHeight
      modalStyle={styles.modal}
      onClosed={onClosed}
    >
      <View style={styles.container}>
        <Text style={styles.title}>
          {statusOperation === "add"
            ? t("order.newArticleTitle")
            : t("order.editTitle")}
        </Text>
        <Text style={styles.designation} numberOfLines={2}>
          {article?.designation}
        </Text>

        {minQuantity > 0 && (
          <View style={styles.warning}>
            <MaterialIcons name="warning" size={scale(16)} color="#FF9800" />
            <Text style={styles.warningText}>
              {t("order.alreadyValidatedQty", {
                qty: minQuantity,
                unit: selectedArticle?.kmein,
              })}
            </Text>
          </View>
        )}

        {/* Stepper */}
        <View style={styles.stepperRow}>
          <Text style={styles.label}>{t("order.quantityLabel")}</Text>
          <View style={styles.controls}>
            <TouchableOpacity
              style={[
                styles.stepBtn,
                parseFloat(quantity) <= minQuantity && styles.stepBtnDisabled,
              ]}
              onPress={decrement}
              disabled={parseFloat(quantity) <= minQuantity}
            >
              <MaterialIcons
                name="remove"
                size={scale(20)}
                color={parseFloat(quantity) <= minQuantity ? "#BDBDBD" : "#fff"}
              />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={(v) => {
                const n = parseFloat(v);
                if (v === "" || isNaN(n)) setQuantity(v);
                else setQuantity(n >= minQuantity ? v : minQuantity.toString());
              }}
              keyboardType="numeric"
              selectTextOnFocus
            />
            <TouchableOpacity style={styles.stepBtn} onPress={increment}>
              <MaterialIcons name="add" size={scale(20)} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Prix preview */}
        <View style={styles.priceBox}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>{t("order.unitPrice")}</Text>

            <PriceDisplay
              amount={prix}
              color={"black"}
              intSize={15}
              decSize={10}
            />
          </View>
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>{t("order.total")}</Text>

            <PriceDisplay
              amount={total}
              color={TEAL}
              intSize={20}
              decSize={13}
            />
          </View>
        </View>

        {/* Changer article (update seulement si pas déjà livré) */}
        {statusOperation === "update" && minQuantity <= 0 && (
          <TouchableOpacity style={styles.changeBtn} onPress={onChooseOther}>
            <MaterialIcons name="swap-horiz" size={scale(18)} color={BLUE} />
            <Text style={styles.changeBtnText}>
              {t("order.chooseOtherArticle")}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={onConfirm}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.confirmText}>{t("common.confirm")}</Text>
          )}
        </TouchableOpacity>
      </View>
    </Modalize>
  );
};

export default QuotationQuantityModalize;

const styles = StyleSheet.create({
  modal: { borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl },
  container: { padding: Spacing.lg },
  title: {
    fontSize: fs(18),
    fontWeight: "700",
    color: TEAL,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  designation: {
    fontSize: fs(13),
    color: "#03A9F4",
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  warning: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "#FFF3E0",
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    marginBottom: Spacing.md,
  },
  warningText: { fontSize: fs(13), color: "#FF9800" },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  label: { fontSize: fs(16), fontWeight: "700", color: "#1F2937" },
  controls: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  stepBtn: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnDisabled: { backgroundColor: "#E0E0E0" },
  input: {
    width: scale(64),
    height: scale(42),
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: Radius.sm,
    textAlign: "center",
    fontSize: fs(16),
    fontWeight: "700",
    color: "#1F2937",
  },
  priceBox: {
    backgroundColor: "#F9F9F9",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  priceLabel: { fontSize: fs(13), color: "#6B7280" },
  priceValue: {
    fontSize: fs(13),
    fontWeight: "700",
    color: "#1F2937",
    letterSpacing: 0.5,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingTop: Spacing.xs,
    marginTop: Spacing.xs,
    marginBottom: 0,
  },
  totalLabel: { fontSize: fs(14), fontWeight: "700", color: "#1F2937" },
  totalValue: {
    fontSize: fs(14),
    fontWeight: "700",
    color: TEAL,
    letterSpacing: 0.5,
  },
  changeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: BLUE,
    borderRadius: Radius.md,
  },
  changeBtnText: { color: BLUE, fontSize: fs(13), fontWeight: "600" },
  confirmBtn: {
    backgroundColor: TEAL,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  confirmText: { color: "#fff", fontSize: fs(15), fontWeight: "700" },
});
