import React from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const InvoiceConfirmationModal = ({
  modalVisible,
  setModalVisible,
  selectedLivraison,
  handleConfirmFacturation,
  loading,
  error,
}) => {
  return (
    <Modal
      transparent={true}
      visible={modalVisible}
      animationType="fade"
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.headerContainer}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="receipt" size={28} color="#4c6ef5" />
            </View>
            <Text style={styles.modalTitle}>Facturation</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.contentContainer}>
            <Text style={styles.modalText}>
              Vous êtes sur le point de générer une facture pour la livraison
              suivante :
            </Text>

            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Livraison :</Text>
                <Text style={styles.detailValue}>
                  {selectedLivraison?.vbeln}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Commande :</Text>
                <Text style={styles.detailValue}>
                  {selectedLivraison?.vgbel}
                </Text>
              </View>
            </View>

            {/* <Text style={styles.confirmationText}>
              Souhaitez-vous continuer avec cette opération ?
            </Text> */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>

          <View style={styles.buttonContainer}>
            {loading ? (
              <Pressable
                style={[styles.button, styles.confirmButton]}
                onPress={handleConfirmFacturation}
                android_ripple={{ color: "rgba(255, 255, 255, 0.2)" }}
              >
                <ActivityIndicator color="#FFFFFF" size="small" />
                {/* <Text style={styles.confirmButtonText}>Confirmer</Text> */}
              </Pressable>
            ) : (
              <Pressable
                style={[styles.button, styles.confirmButton]}
                onPress={handleConfirmFacturation}
                android_ripple={{ color: "rgba(255, 255, 255, 0.2)" }}
              >
                {/* <MaterialIcons
                name="check"
                size={18}
                color="#fff"
                style={styles.buttonIcon}
              /> */}
                <Text style={styles.confirmButtonText}>Confirmer</Text>
              </Pressable>
            )}

            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={() => setModalVisible(false)}
              android_ripple={{ color: "rgba(0, 0, 0, 0.1)" }}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(105, 177, 248, 0.14)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "95%",
    maxWidth: 400,
    backgroundColor: "#fff",
    // backgroundColor: "rgb(252, 252, 252)",
    borderRadius: 12,
    padding: 0,
    overflow: "hidden",
    elevation: 7, // Pour Android
    shadowColor: "#000", // Pour iOS
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    paddingBottom: 15,
  },
  iconContainer: {
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#172b4d",
  },
  divider: {
    height: 1,
    backgroundColor: "#e9ecef",
    marginHorizontal: 0,
  },
  contentContainer: {
    padding: 20,
  },
  modalText: {
    fontSize: 16,
    color: "#495057",
    marginBottom: 15,
    textAlign: "center",
  },
  detailsContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 15,
    // marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(183, 185, 189, 0.47)",
  },
  detailRow: {
    display: "flex",
    justifyContent: "center",
    alignContent: "center",
    flexDirection: "row",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#495057",
    textAlign: "right",
    marginRight: 10,
    letterSpacing: 1,
    width: "50%",
  },
  detailValue: {
    fontSize: 15,
    color: "#212529",
    fontWeight: "600",
    letterSpacing: 2,
    width: "50%",
  },
  errorContainer: {
    marginTop: 25,
    borderWidth: 1,
    borderRadius: 5,
    borderColor: "rgba(231, 56, 56, 0.37)",
    backgroundColor: "rgba(245, 158, 158, 0.27)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  errorText: {
    fontSize: 15,
    color: "rgba(185, 36, 36, 0.95)",
    fontWeight: 700,
    fontStyle: "italic",
  },
  buttonContainer: {
    flexDirection: "column",
    justifyContent: "flex-end",
    padding: 16,
    paddingTop: 10,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    // backgroundColor: "#f8f9fa",
    elevation: 0,
    marginTop: 5,
    width: "50%",
    margin: "auto",
  },
  confirmButton: {
    // backgroundColor: "#4c6ef5",
    backgroundColor: "#006475",
  },
  cancelButtonText: {
    color: "#495057",
    fontWeight: "500",
    fontSize: 15,
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 15,
  },
  buttonIcon: {
    marginRight: 5,
  },
});

export default InvoiceConfirmationModal;
