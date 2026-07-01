import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Modalize } from "react-native-modalize";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import PriceDisplay from "./common/Pricedisplay";

const QuantityModalize = ({
  reference,
  selectedArticle,
  quantity,
  setQuantity,
  discount,
  setDiscount,
  handleQuantityConfirm,
  motif,
  batch, // ✅ Ajouter
  setBatch,
}) => {
  const { t } = useTranslation();
  return (
    <Modalize
      ref={reference}
      adjustToContentHeight
      modalStyle={styles.modalContainer}
    >
      {selectedArticle && (
        <View style={styles.quantityModal}>
          <Text style={styles.quantityTitle}>
            {t("order.setQuantityTitle")}
          </Text>
          <Text style={styles.quantityArticle}>
            {selectedArticle.designation}
          </Text>

          {/* Quantity Controls */}
          <View style={styles.quantityRow}>
            <Text style={styles.quantityLabel}>{t("order.quantity")}</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => {
                  const currentQty = parseInt(quantity);
                  if (!isNaN(currentQty) && currentQty > 1) {
                    setQuantity((currentQty - 1).toString());
                  }
                }}
              >
                <MaterialIcons name="remove" size={20} color="white" />
              </TouchableOpacity>

              <TextInput
                style={styles.quantityModalInput}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                selectTextOnFocus={true}
              />

              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => {
                  const currentQty = parseInt(quantity);
                  if (!isNaN(currentQty)) {
                    setQuantity((currentQty + 1).toString());
                  } else {
                    setQuantity("1");
                  }
                }}
              >
                <MaterialIcons name="add" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Discount Controls */}
          {/* {!motif && (
            <View style={styles.quantityRow}>
              <Text
                style={[
                  styles.quantityLabel,
                  { fontWeight: "bold", fontSize: 18 },
                ]}
              >
                Remise(%) :
              </Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => {
                    const currentDisc = parseFloat(discount);
                    if (!isNaN(currentDisc) && currentDisc > 0) {
                      setDiscount((currentDisc - 1).toFixed(1));
                    }
                  }}
                >
                  <MaterialIcons name="remove" size={20} color="white" />
                </TouchableOpacity>

                <TextInput
                  style={styles.quantityModalInput}
                  value={discount}
                  onChangeText={setDiscount}
                  keyboardType="numeric"
                />

                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => {
                    const currentDisc = parseFloat(discount);
                    if (!isNaN(currentDisc) && currentDisc < 100) {
                      setDiscount((currentDisc + 1).toFixed(1));
                    } else {
                      setDiscount("0");
                    }
                  }}
                >
                  <MaterialIcons name="add" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          )} */}
          {/* Batch Input - Only for return orders AND "Produits revente en état" */}
          {motif && selectedArticle?.gerer_par_lot === true && (
            <View style={styles.batchContainer}>
              <Text style={styles.batchLabel}>{t("order.batchNumber")}</Text>
              <TextInput
                style={styles.batchInput}
                value={batch}
                onChangeText={setBatch}
                placeholder={t("order.batchPlaceholder")}
                autoCapitalize="characters"
                placeholderTextColor="#999"
                accessibilityLabel={t("order.batchPlaceholder")}
                maxLength={10}
              />
            </View>
          )}

          {/* Price calculation preview */}
          <View style={styles.pricePreview}>
            <View style={styles.pricePreviewRow}>
              <Text style={styles.pricePreviewRowTitle}>
                {t("order.unitPrice")} :
              </Text>
              {/* <Text style={styles.pricePreviewRowValue}>
                {parseFloat(selectedArticle.prix).toLocaleString("fr-DZ", {
                  style: "currency",
                  currency: "DZD",
                })}
              </Text> */}
              <PriceDisplay
                amount={selectedArticle.prix}
                color="#060606"
                intSize={15}
                decSize={10}
              />
            </View>

            {parseFloat(discount) > 0 && (
              <View style={styles.pricePreviewRow}>
                <Text>{t("order.discountAmount", { discount })}</Text>
                <Text style={styles.totalPreviewValue}>
                  -
                  {/* {parseFloat(
                    ((selectedArticle.prix * parseFloat(discount)) / 100) *
                      parseInt(quantity || "0"),
                  ).toLocaleString("fr-DZ", {
                    style: "currency",
                    currency: "DZD",
                  })} */}
                  <PriceDisplay
                    amount={
                      ((selectedArticle.prix * parseFloat(discount)) / 100) *
                      parseInt(quantity || "0")
                    }
                    color="#060606"
                    intSize={15}
                    decSize={10}
                  />
                </Text>
              </View>
            )}

            <View style={[styles.pricePreviewRow, styles.totalPreviewRow]}>
              <Text style={styles.totalPreviewLabel}>{t("order.total")} :</Text>
              <Text style={styles.totalPreviewValue}>
                {/* {parseFloat(
                  selectedArticle.prix *
                    parseInt(quantity || "0") *
                    (1 - parseFloat(discount) / 100),
                ).toLocaleString("fr-DZ", {
                  style: "currency",
                  currency: "DZD",
                })} */}
                <PriceDisplay
                  amount={
                    selectedArticle.prix *
                    parseInt(quantity || "0") *
                    (1 - parseFloat(discount) / 100)
                  }
                  intSize={22}
                  decSize={15}
                />
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleQuantityConfirm}
          >
            <Text style={styles.confirmButtonText}>{t("common.confirm")}</Text>
          </TouchableOpacity>
        </View>
      )}
    </Modalize>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    padding: 16,
  },
  quantityModal: {
    padding: 16,
  },
  quantityTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    margin: "auto",
  },
  quantityArticle: {
    fontSize: 16,
    color: "#03A9F4",
    marginBottom: 16,
    margin: "auto",
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  quantityLabel: {
    fontWeight: "bold",
    fontSize: 18,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    backgroundColor: "#03A9F4",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityModalInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginHorizontal: 8,
    width: 60,
    textAlign: "center",
    fontSize: 16,
  },
  pricePreview: {
    marginBottom: 12,
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: "#F9F9F9",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
  },
  pricePreviewRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  pricePreviewRowTitle: {
    fontSize: 14,
  },
  pricePreviewRowValue: {
    fontWeight: "bold",
    letterSpacing: 2,
  },
  totalPreviewLabel: {
    fontWeight: "bold",
    fontSize: 22,
  },
  totalPreviewValue: {
    fontWeight: "bold",
    letterSpacing: 2,
    color: "#006475",
  },
  totalPreviewRow: {
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    marginTop: 4,
    paddingTop: 4,
  },
  confirmButton: {
    backgroundColor: "#03A9F4",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

  batchContainer: {
    marginVertical: 30,
  },
  batchLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#a23d3dff",
    marginBottom: 8,
  },
  batchInput: {
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    color: "#333",
  },
});

export default QuantityModalize;
