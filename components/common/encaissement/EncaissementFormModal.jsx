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
import DateField from "react-native-datefield";
import { getPaymentIcon } from "./EncaissementCard";
import { scale, fs } from "../../../utils/responsive";
import { Spacing, Radius } from "../../../constants/Theme";

const TEAL = "#006475";
const TEXT_DARK = "#212121";
const TEXT_MUTED = "#757575";
const BORDER = "#E5E7EB";
const BLUE = "#2196F3";

const MODES_PAIEMENT = ["ESPECE", "CHEQUE"];

/**
 * Modalize formulaire création/édition encaissement — composant contrôlé,
 * tout l'état (form, montant affiché, date) vient du parent.
 */
const EncaissementFormModal = ({
  reference,
  formMode,
  form,
  setForm,
  displayMontant,
  setDisplayMontant,
  dateValue,
  onDateChange,
  isSubmitting,
  onSubmit,
  onCancel,
}) => {
  const formatMontantInput = (value) => {
    const numericValue = value.replace(/[^0-9.]/g, "");
    const parts = numericValue.split(".");
    if (parts.length > 2) return displayMontant;
    if (numericValue) {
      const [integerPart, decimalPart] = parts;
      const formattedInteger = integerPart.replace(
        /\B(?=(\d{3})+(?!\d))/g,
        " ",
      );
      return decimalPart !== undefined
        ? `${formattedInteger}.${decimalPart.slice(0, 2)}`
        : formattedInteger;
    }
    return "";
  };

  return (
    <Modalize
      ref={reference}
      adjustToContentHeight
      closeOnOverlayTap
      withHandle
    >
      <View style={styles.container}>
        <Text style={styles.title}>
          {formMode === "create"
            ? "Nouvel encaissement"
            : "Modifier l'encaissement"}
        </Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Date d'encaissement</Text>
          <DateField
            styleInput={styles.dateInput}
            labelDate="Jour"
            labelMonth="Mois"
            labelYear="Année"
            defaultValue={dateValue}
            containerStyle={{ width: "100%" }}
            onSubmit={onDateChange}
            placeholderTextColor="#999"
            maxDate={new Date()}
            minDate={new Date(2000, 0, 1)}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Montant (DZD)</Text>
          <TextInput
            style={styles.input}
            value={displayMontant}
            onChangeText={(text) => {
              const numericValue = text.replace(/[^0-9.]/g, "");
              setForm({ ...form, Montant: numericValue });
              setDisplayMontant(formatMontantInput(text));
            }}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Mode de paiement</Text>
          <View style={styles.modesRow}>
            {MODES_PAIEMENT.map((mode) => {
              const selected = form.ModePaiement === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  style={[styles.modeBtn, selected && styles.modeBtnSelected]}
                  onPress={() => setForm({ ...form, ModePaiement: mode })}
                >
                  {getPaymentIcon(mode, scale(18))}
                  <Text
                    style={[
                      styles.modeText,
                      selected && styles.modeTextSelected,
                    ]}
                  >
                    {mode}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {form.ModePaiement === "CHEQUE" && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Référence (optionnelle)</Text>
            <TextInput
              style={styles.input}
              value={form.Reference}
              onChangeText={(text) => setForm({ ...form, Reference: text })}
              placeholder="N° chèque"
            />
          </View>
        )}

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelText}>Annuler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitText}>
                {formMode === "create" ? "Créer" : "Modifier"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modalize>
  );
};

export default EncaissementFormModal;

const styles = StyleSheet.create({
  container: { padding: Spacing.xl },
  title: {
    fontSize: fs(17),
    fontWeight: "700",
    color: TEXT_DARK,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  formGroup: { marginBottom: Spacing.lg },
  label: {
    fontSize: fs(13),
    color: TEXT_MUTED,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: fs(15),
    fontWeight: "600",
    borderWidth: 1,
    borderColor: BORDER,
  },
  dateInput: {
    height: scale(42),
    width: "30%",
    fontSize: fs(15),
    fontWeight: "700",
    color: TEXT_DARK,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: Radius.md,
  },
  modesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  modeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "#F5F5F5",
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: BORDER,
    flex: 1,
    minWidth: "45%",
  },
  modeBtnSelected: {
    backgroundColor: "#E3F2FD",
    borderColor: BLUE,
  },
  modeText: {
    fontSize: fs(13),
    color: TEXT_DARK,
  },
  modeTextSelected: {
    color: BLUE,
    fontWeight: "700",
  },
  actionsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.md,
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
