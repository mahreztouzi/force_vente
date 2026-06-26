import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Modalize } from "react-native-modalize";
import { scale, fs } from "../../../utils/responsive";
import { Spacing, Radius } from "../../../constants/Theme";

const GREEN = "#4CAF50";

const PrintLivraisonModalize = ({
  reference,
  createdDeliveryId,
  onPrint,
  onClose,
}) => (
  <Modalize
    ref={reference}
    adjustToContentHeight
    modalStyle={styles.modal}
    disableScrollIfPossible
    closeOnOverlayTap={false}
  >
    <View style={styles.container}>
      <MaterialCommunityIcons
        name="check-circle"
        size={scale(64)}
        color={GREEN}
      />

      <Text style={styles.title}>Livraison créée</Text>

      {createdDeliveryId && (
        <>
          <Text style={styles.deliveryId}>BL N° {createdDeliveryId}</Text>
          <Text style={styles.question}>Imprimer le bon de livraison ?</Text>
        </>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, styles.btnGray]}
          onPress={onClose}
        >
          {createdDeliveryId && (
            <MaterialIcons name="close" size={scale(18)} color="#fff" />
          )}
          <Text style={styles.btnText}>
            {createdDeliveryId ? "Non merci" : "OK"}
          </Text>
        </TouchableOpacity>

        {createdDeliveryId && (
          <TouchableOpacity
            style={[styles.btn, styles.btnTeal]}
            onPress={onPrint}
          >
            <MaterialIcons name="print" size={scale(18)} color="#fff" />
            <Text style={styles.btnText}>Imprimer</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  </Modalize>
);

export default PrintLivraisonModalize;

const styles = StyleSheet.create({
  modal: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
  },
  container: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  title: {
    fontSize: fs(22),
    fontWeight: "700",
    color: "#4CAF50",
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  deliveryId: {
    fontSize: fs(15),
    color: "#6B7280",
    marginBottom: Spacing.sm,
  },
  question: {
    fontSize: fs(16),
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.md,
    width: "100%",
  },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(6),
    paddingVertical: Spacing.md,
    borderRadius: Radius.pill,
  },
  btnGray: { backgroundColor: "#9CA3AF" },
  btnTeal: { backgroundColor: "#006475" },
  btnText: { color: "#fff", fontSize: fs(15), fontWeight: "700" },
});
