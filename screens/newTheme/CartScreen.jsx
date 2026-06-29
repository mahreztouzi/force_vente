import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Avatar } from "react-native-elements";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import { Colors, Typography, Spacing, Radius } from "../../constants/Theme";
import ScreenBackground from "../../components/common/ScreenBackground";
import { scale, fs } from "../../utils/responsive";
import {
  getCartItems,
  saveCartItems,
  removeCartItem,
  clearCart,
  getCartTotal,
} from "../../utils/cartStorage";
import { addOrder, resetOrderState } from "../../redux/slices/orderSlice";
import { getClients } from "../../redux/slices/clientSlice";
import SearchInput from "../../components/common/SearchInput";

const CartScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const userData = useSelector((state) => state.auth.user);
  const { clients } = useSelector((state) => state.clients);
  const {
    loading: orderLoading,
    error: orderError,
    success: orderSuccess,
  } = useSelector((state) => state.orders);

  const [cartItems, setCartItems] = useState([]);
  const [loadingCart, setLoadingCart] = useState(true);

  const [selectedClient, setSelectedClient] = useState(null);
  const [clientSearch, setClientSearch] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        setLoadingCart(true);
        const items = await getCartItems();
        setCartItems(items);
        setLoadingCart(false);
      };
      load();
    }, []),
  );

  useEffect(() => {
    const grp = userData?.grp;
    if (!grp) return;
    dispatch(getClients({ grpVendeur: grp }));
  }, [dispatch]);

  useEffect(() => {
    if (orderSuccess) {
      Alert.alert(t("cart.successTitle"), t("cart.successMsg"), [
        {
          text: "OK",
          onPress: async () => {
            await clearCart();
            setCartItems([]);
            setSelectedClient(null);
            dispatch(resetOrderState());
            navigation.navigate("Accueil");
          },
        },
      ]);
    }
  }, [orderSuccess, dispatch, navigation]);

  const filteredClients = (clients || []).filter((c) =>
    (c.name1 || "").toLowerCase().includes(clientSearch.toLowerCase()),
  );

  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setClientSearch(client.name1);
    setShowClientDropdown(false);
  };

  // CORRIGÉ : empêche toute quantité de descendre sous 1 — pour retirer un article, on passe par handleRemove
  const updateQuantity = async (id, delta) => {
    const updated = cartItems.map((it) => {
      if (it.id !== id) return it;
      const nextQty = it.quantity + delta;
      return { ...it, quantity: nextQty < 1 ? 1 : nextQty };
    });
    setCartItems(updated);
    await saveCartItems(updated);
  };

  const handleRemove = (id) => {
    Alert.alert(t("cart.removeTitle"), t("cart.removeMsg"), [
      { text: t("cart.removeCancel"), style: "cancel" },
      {
        text: t("cart.removeConfirm"),
        style: "destructive",
        onPress: async () => {
          const updated = await removeCartItem(id);
          setCartItems(updated);
        },
      },
    ]);
  };

  const subtotal = getCartTotal(cartItems);
  const total = subtotal;

  const handleCreateOrder = () => {
    if (!selectedClient) {
      Alert.alert("Erreur", t("cart.errorNoClient"));
      return;
    }
    if (cartItems.length === 0) {
      Alert.alert("Erreur", t("cart.errorEmpty"));
      return;
    }

    const commandeData = {
      SalesOrderType: "ZCMD",
      SoldToParty: selectedClient.kunnr,
      to_Item: cartItems.map((item) => ({
        Material: item.id,
        RequestedQuantity: item.quantity.toString(),
      })),
    };

    dispatch(addOrder(commandeData));
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <View style={styles.cartItemImageWrap}>
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={styles.cartItemImage}
            resizeMode="cover"
          />
        ) : (
          <MaterialCommunityIcons
            name="cube-outline"
            size={scale(28)}
            color={Colors.textMuted}
          />
        )}
      </View>

      <View style={styles.cartItemInfo}>
        <Text style={styles.cartItemName} numberOfLines={1}>
          {item.designation}
        </Text>
        <Text style={styles.cartItemPrice}>
          {parseFloat(item.prix).toLocaleString("fr-DZ", {
            style: "currency",
            currency: "DZD",
          })}
        </Text>
      </View>

      <View style={styles.qtyControl}>
        <TouchableOpacity
          style={[
            styles.qtyBtnSmall,
            item.quantity <= 1 && styles.qtyBtnDisabled,
          ]}
          onPress={() => updateQuantity(item.id, -1)}
          disabled={item.quantity <= 1}
          activeOpacity={0.7}
        >
          <Ionicons
            name="remove"
            size={scale(14)}
            color={item.quantity <= 1 ? Colors.textMuted : Colors.textPrimary}
          />
        </TouchableOpacity>
        <Text style={styles.qtyValue}>{item.quantity}</Text>
        <TouchableOpacity
          style={[styles.qtyBtnSmall, styles.qtyBtnAdd]}
          onPress={() => updateQuantity(item.id, 1)}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={scale(14)} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => handleRemove(item.id)}
        style={styles.removeBtn}
      >
        <Ionicons name="trash-outline" size={scale(16)} color={Colors.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScreenBackground />
      <StatusBar barStyle="dark-content" />

      {/* Liste SCROLLABLE — uniquement les articles */}
      <FlatList
        data={cartItems}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderCartItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.headerRow}>
              <Text style={styles.title}>
                {t("cart.title")}{" "}
                <Text style={styles.titleCount}>
                  ({cartItems.length} {t("cart.articles")})
                </Text>
              </Text>
            </View>
            <Text style={styles.label}>
              {t("cart.clientLabel")}
              <Text style={styles.required}>*</Text> :
            </Text>

            <SearchInput
              placeholder={t("cart.clientPlaceholder")}
              onPress={() =>
                navigation.navigate("ClientPicker", {
                  onSelectClient: (client) => setSelectedClient(client),
                })
              }
              showChevron
              fullWidth
              // isRTL={isAr}
              style={styles.clientPickerWrap}
              rightSlot={
                selectedClient ? (
                  <View style={styles.selectedClientBadge}>
                    <Avatar
                      rounded
                      size={scale(28)}
                      title={selectedClient.name1?.charAt(0)}
                      containerStyle={styles.selectedClientAvatar}
                    />
                    <Text style={styles.selectedClientName} numberOfLines={1}>
                      {selectedClient.name1}
                    </Text>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation?.();
                        setSelectedClient(null);
                      }}
                      style={styles.removeClientBtn}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons
                        name="close-circle"
                        size={scale(18)}
                        color={Colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                ) : undefined
              }
            />
          </View>
        }
        ListEmptyComponent={
          loadingCart ? (
            <ActivityIndicator
              size="large"
              color={Colors.primary}
              style={styles.loader}
            />
          ) : (
            <View style={styles.emptyWrap}>
              <Ionicons
                name="cart-outline"
                size={scale(48)}
                color={Colors.textMuted}
              />
              <Text style={styles.emptyText}>{t("cart.empty")}</Text>
            </View>
          )
        }
        ListFooterComponent={
          cartItems.length > 0 ? (
            <View style={styles.totalsBlock}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{t("cart.subtotal")} :</Text>
                <Text style={styles.totalValue}>
                  {subtotal.toLocaleString("fr-DZ", {
                    minimumFractionDigits: 0,
                  })}{" "}
                  DZD
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabelFinal}>{t("cart.total")} :</Text>
                <Text style={styles.totalValueFinal}>
                  {total.toLocaleString("fr-DZ", { minimumFractionDigits: 0 })}{" "}
                  DZD
                </Text>
              </View>
            </View>
          ) : null
        }
      />

      {/* Bouton FIXE en bas — hors de la FlatList, ne scrolle jamais */}
      {cartItems.length > 0 && (
        <View style={styles.fixedFooter}>
          {orderError && <Text style={styles.errorText}>{orderError}</Text>}
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={handleCreateOrder}
            disabled={orderLoading}
            activeOpacity={0.85}
          >
            {orderLoading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.confirmText}>{t("cart.createOrder")}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

export default CartScreen;

const FIXED_FOOTER_HEIGHT = scale(96);
const TAB_BAR_HEIGHT = scale(58) + scale(20);

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    // Espace pour : footer fixe (bouton) + tab bar, pour que le dernier item ne soit jamais caché
    paddingBottom: FIXED_FOOTER_HEIGHT + TAB_BAR_HEIGHT,
  },
  headerRow: { marginBottom: Spacing.lg },
  title: { ...Typography.h1 },
  titleCount: {
    fontSize: fs(16),
    fontWeight: "400",
    color: Colors.textMuted,
  },
  label: { ...Typography.body, marginBottom: Spacing.sm },
  required: { color: Colors.error },

  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  cartItemImageWrap: {
    width: scale(48),
    height: scale(48),
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  cartItemImage: { width: "100%", height: "100%" },
  cartItemInfo: { flex: 1 },
  cartItemName: { ...Typography.body, fontSize: fs(13) },
  cartItemPrice: {
    ...Typography.h3,
    fontSize: fs(14),
    color: Colors.primary,
    marginTop: 2,
  },
  qtyControl: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  qtyBtnSmall: {
    width: scale(26),
    height: scale(26),
    borderRadius: scale(13),
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnDisabled: {
    opacity: 0.4,
  },
  qtyBtnAdd: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  qtyValue: { ...Typography.body, minWidth: scale(20), textAlign: "center" },
  removeBtn: { padding: Spacing.xs },

  totalsBlock: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  totalLabel: { ...Typography.body, color: Colors.textMuted },
  totalValue: { ...Typography.body, fontWeight: "700" },
  totalLabelFinal: { ...Typography.h3 },
  totalValueFinal: { ...Typography.h3, color: Colors.primary },

  // Footer fixe — au-dessus de la tab bar, ne scrolle pas
  fixedFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: TAB_BAR_HEIGHT,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    // backgroundColor: "rgba(255,255,255,0.92)",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  confirmBtn: {
    backgroundColor: Colors.secondary,
    borderRadius: Radius.pill,
    height: scale(52),
    alignItems: "center",
    justifyContent: "center",
  },
  confirmText: {
    color: Colors.white,
    fontWeight: "800",
    fontSize: fs(15),
    letterSpacing: 1,
  },

  loader: { marginTop: Spacing.xxxl },
  emptyWrap: { alignItems: "center", marginTop: Spacing.xxxl, gap: Spacing.sm },
  emptyText: { ...Typography.caption },
  errorText: {
    color: Colors.error,
    fontSize: fs(12),
    marginBottom: Spacing.sm,
    textAlign: "center",
  },

  selectedClientBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center", // centre verticalement avatar + texte + croix sur une seule ligne
    gap: Spacing.sm,
    height: "100%", // s'aligne sur la hauteur fixe du searchWrap, évite tout débordement
  },
  selectedClientAvatar: {
    backgroundColor: Colors.primary,
    alignSelf: "center", // empêche l'avatar de "monter" si un parent applique alignItems: flex-start ailleurs
  },
  selectedClientName: {
    ...Typography.body,
    fontWeight: "600",
    flex: 1,
    textAlignVertical: "center", // Android : centre le texte verticalement dans sa propre ligne
  },
  removeClientBtn: {
    padding: Spacing.xs,
    alignSelf: "center",
  },
});
