import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Modalize } from "react-native-modalize";
import { scale, fs } from "../../../utils/responsive";
import { Spacing, Radius } from "../../../constants/Theme";

/**
 * QuotationActionModalize — modal actions sur un article d'offre.
 *
 * Props :
 *   reference      — ref Modalize
 *   article        — article sélectionné
 *   deleteLoading  — bool
 *   onEdit         — () => void
 *   onDelete       — () => void
 */
const QuotationActionModalize = ({
  reference,
  article,
  deleteLoading,
  onEdit,
  onDelete,
}) => {
  const canDelete = !article || article.qte_accepte <= 0;

  return (
    <Modalize
      ref={reference}
      adjustToContentHeight
      closeOnOverlayTap
      withHandle
    >
      <View style={styles.container}>
        {deleteLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#03A9F4" />
            <Text style={styles.loadingText}>Suppression en cours...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.title}>Actions</Text>

            <TouchableOpacity style={styles.row} onPress={onEdit}>
              <MaterialIcons name="edit" size={scale(22)} color="#2196F3" />
              <Text style={styles.rowText}>Modifier l'article</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.row, styles.rowLast]}
              onPress={onDelete}
              disabled={!canDelete}
            >
              <MaterialIcons
                name="delete"
                size={scale(22)}
                color={canDelete ? "#F44336" : "#BDBDBD"}
              />
              <Text style={[styles.rowText, !canDelete && styles.disabledText]}>
                Supprimer l'article
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => reference.current?.close()}
            >
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </Modalize>
  );
};

export default QuotationActionModalize;

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    paddingBottom: scale(32),
  },
  title: {
    fontSize: fs(18),
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  rowLast: { borderBottomWidth: 0, marginBottom: Spacing.md },
  rowText: { fontSize: fs(15), color: "#374151", fontWeight: "500" },
  disabledText: { color: "#9CA3AF" },
  cancelBtn: {
    backgroundColor: "#F1F5F9",
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  cancelText: { fontSize: fs(15), color: "#475569", fontWeight: "600" },
  loadingWrap: { padding: Spacing.xl, alignItems: "center" },
  loadingText: { marginTop: Spacing.md, fontSize: fs(14), color: "#3B82F6" },
});
