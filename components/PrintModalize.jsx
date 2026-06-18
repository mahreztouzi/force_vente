import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Clipboard,
} from "react-native";
import { Modalize } from "react-native-modalize";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";

const PrintModalize = ({
  reference,
  createdOrderId,
  motif,
  handlePrintOrder,
  cleanupAndNavigateBack,
}) => {
  const copyToClipboard = () => {
    if (createdOrderId) {
      Clipboard.setString(createdOrderId);
      Alert.alert("Copié", "Le numéro a été copié dans le presse-papiers");
    }
  };

  return (
    <Modalize
      ref={reference}
      adjustToContentHeight
      modalStyle={styles.modalContainer}
      disableScrollIfPossible
      closeOnOverlayTap={false}
      onClose={cleanupAndNavigateBack}
    >
      <View style={styles.printModal}>
        <MaterialCommunityIcons
          name="check-circle"
          size={60}
          color="#4CAF50"
          style={styles.successIcon}
        />

        <Text style={styles.printTitle}>
          {motif ? " Commande de  Retour" : "Offre de vente"} créée avec succès
        </Text>

        {createdOrderId && (
          <View style={styles.orderIdContainer}>
            <Text style={styles.printDeliveryId}>N° {createdOrderId}</Text>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={copyToClipboard}
            >
              <MaterialIcons name="content-copy" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.printActions}>
          <TouchableOpacity
            style={[styles.printButton, styles.printNoButton]}
            onPress={cleanupAndNavigateBack}
          >
            <Text style={styles.printButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modalize>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    padding: 16,
  },
  printModal: {
    padding: 24,
    alignItems: "center",
  },
  successIcon: {
    marginBottom: 16,
  },
  printTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 12,
    textAlign: "center",
  },
  printDeliveryId: {
    fontSize: 22,
    color: "#616161",
    // marginBottom: 20,
    textAlign: "center",
  },
  printQuestion: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  printActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  printButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 8,
  },
  printNoButton: {
    backgroundColor: "#71899A",
  },
  printYesButton: {
    backgroundColor: "#006475",
  },
  printButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  orderIdContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  copyButton: {
    marginLeft: 8,
    padding: 4,
    borderRadius: 4,
    backgroundColor: "#f0f0f0",
  },
});

export default PrintModalize;
