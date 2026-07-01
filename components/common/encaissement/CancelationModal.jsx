import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Modalize } from "react-native-modalize";
import { fs } from "../../../utils/responsive";
import { Spacing, Radius } from "../../../constants/Theme";
import { useTranslation } from "react-i18next";

const TEAL = "#006475";
const TEXT_DARK = "#212121";

const CancelationModal = ({
  reference,
  reason,
  onChangeReason,
  isCancelling,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation();
  return (
    <Modalize
      ref={reference}
      adjustToContentHeight
      closeOnOverlayTap
      withHandle
    >
      <View style={styles.container}>
        <Text style={styles.title}>{t("encaissement.cancelReasonTitle")}</Text>

        <TextInput
          style={styles.textarea}
          placeholder={t("encaissement.cancelReasonPlaceholder")}
          placeholderTextColor="#999"
          multiline
          numberOfLines={5}
          maxLength={200}
          textAlignVertical="top"
          onChangeText={onChangeReason}
          value={reason}
        />

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelText}>{t("common.cancel")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={onConfirm}
            disabled={isCancelling || !reason?.trim()}
          >
            {isCancelling ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitText}>{t("common.confirm")}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modalize>
  );
};

export default CancelationModal;

const styles = StyleSheet.create({
  container: { padding: Spacing.xl },
  title: {
    fontSize: fs(17),
    fontWeight: "700",
    color: TEXT_DARK,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  textarea: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: fs(15),
    backgroundColor: "#f9f9f9",
    minHeight: 150,
    maxHeight: 150,
  },
  actionsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  cancelBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
  },
  cancelText: {
    fontSize: fs(14),
    color: TEXT_DARK,
    fontWeight: "600",
  },
  submitBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TEAL,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
  },
  submitText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: fs(14),
  },
});
