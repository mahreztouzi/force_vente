import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Modalize } from "react-native-modalize";
import { scale, fs } from "../../../utils/responsive";
import { Spacing, Radius } from "../../../constants/Theme";
import { useTranslation } from "react-i18next";

const BLUE = "#03A9F4";
const TEAL = "#006475";

const QuantityLivraisonModalize = ({
  reference,
  selectedArticle,
  quantity,
  setQuantity,
  stockInfo,
  onConfirm,
}) => {
  const { t } = useTranslation();
  if (!selectedArticle) return null;

  const stockItem = stockInfo?.[selectedArticle.id];
  const hasLot =
    selectedArticle.charg && stockItem?.lotDetails?.[selectedArticle.charg];
  const stockQuantity = hasLot
    ? stockItem.lotDetails[selectedArticle.charg].AvailableStockByLot
    : (stockItem?.AvailableStock ?? 0);

  const handleMax = () => {
    const max = Math.min(selectedArticle.qteRestante, stockQuantity);
    setQuantity(max.toString());
  };

  const decrement = () => {
    const val = parseFloat(quantity);
    if (!isNaN(val) && val > 1) setQuantity((val - 1).toString());
  };

  const increment = () => {
    const val = parseFloat(quantity);
    if (!isNaN(val)) {
      const next = Math.min(val + 1, selectedArticle.qteRestante);
      setQuantity(next.toString());
    } else {
      setQuantity("1");
    }
  };

  return (
    <Modalize ref={reference} adjustToContentHeight modalStyle={styles.modal}>
      <View style={styles.container}>
        <Text style={styles.title}>{t("livraison.quantityTitle")}</Text>
        <Text style={styles.designation} numberOfLines={2}>
          {selectedArticle.designation}
          {selectedArticle.charg
            ? `  —  ${t("livraison.lot")}: ${selectedArticle.charg}`
            : ""}
        </Text>

        {/* Info */}
        <View style={styles.infoBox}>
          <InfoRow
            label={t("livraison.qtyOrdered")}
            value={`${selectedArticle.qteCommandee} ${selectedArticle.unite}`}
          />
          <InfoRow
            label={t("livraison.qtyRemaining")}
            value={`${selectedArticle.qteRestante} ${selectedArticle.unite}`}
          />
          <InfoRow
            label={t("livraison.stock")}
            value={`${stockQuantity} ${selectedArticle.unite}`}
          />
        </View>

        {/* Stepper */}
        <View style={styles.stepperRow}>
          <TouchableOpacity style={styles.stepBtn} onPress={decrement}>
            <MaterialIcons name="remove" size={scale(20)} color="#fff" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            selectTextOnFocus
          />
          <TouchableOpacity style={styles.stepBtn} onPress={increment}>
            <MaterialIcons name="add" size={scale(20)} color="#fff" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.maxBtn} onPress={handleMax}>
          <Text style={styles.maxText}>{t("livraison.maxQuantity")}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm}>
          <Text style={styles.confirmText}>{t("common.confirm")}</Text>
        </TouchableOpacity>
      </View>
    </Modalize>
  );
};

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

export default QuantityLivraisonModalize;

const styles = StyleSheet.create({
  modal: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
  },
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
    color: "#6B7280",
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  infoBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  infoLabel: { fontSize: fs(13), color: "#9CA3AF" },
  infoValue: { fontSize: fs(13), fontWeight: "700", color: "#1F2937" },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
    direction: "ltr",
  },
  stepBtn: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    width: scale(70),
    height: scale(44),
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: Radius.md,
    textAlign: "center",
    fontSize: fs(18),
    fontWeight: "700",
    color: "#1F2937",
  },
  maxBtn: {
    alignSelf: "center",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    // borderWidth: 1,
    borderColor: BLUE,
    borderRadius: Radius.sm,
    marginBottom: Spacing.xxxl,
  },
  maxText: { fontSize: fs(13), color: BLUE, fontWeight: "600" },
  confirmBtn: {
    backgroundColor: TEAL,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  confirmText: { color: "#fff", fontSize: fs(15), fontWeight: "700" },
});
