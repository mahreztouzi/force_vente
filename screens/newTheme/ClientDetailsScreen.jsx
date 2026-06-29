import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Linking,
  ScrollView,
  BackHandler,
} from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
  Feather,
} from "@expo/vector-icons";
import { Modalize } from "react-native-modalize";
import { useDispatch, useSelector } from "react-redux";
import { toggleFavorite } from "../../redux/slices/clientSlice";
import { getMotifsRetours } from "../../redux/slices/orderSlice";
import { scale, fs } from "../../utils/responsive";
import { Spacing, Radius } from "../../constants/Theme";
import ScreenBackground from "../../components/common/ScreenBackground";
import PagerView from "react-native-pager-view";
import ClientMap from "../../components/ClientMap";
import BottomFade from "../../components/common/Bottomfade";
import PriceDisplay from "../../components/common/Pricedisplay";

const BLUE = "#03A9F4";
const TEXT_DARK = "#212121";
const TEXT_MUTED = "#757575";
const BORDER = "#E5E7EB";

/**
 * Découpe un montant en { integer, decimal } pour affichage style AliExpress
 * (même logique que PriceTag dans ArticleCard.jsx) : partie entière grande,
 * décimales + devise petites, alignées sur la ligne de base.
 */
const splitAmount = (value) => {
  const num = parseFloat(value || 0);
  const fixed = num.toFixed(2);
  const [integerPart, decimalPart] = fixed.split(".");
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return { integer: formattedInteger, decimal: decimalPart };
};

const ClientDetailsScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { client } = route.params;
  const dispatch = useDispatch();
  const { favorites } = useSelector((state) => state.clients);
  const { motifs } = useSelector((state) => state.orders);

  const motifModalizeRef = useRef(null);

  const isFavorite = favorites.includes(client.kunnr);

  useEffect(() => {
    const handleBackPress = () => {
      if (motifModalizeRef.current?.isOpen) {
        motifModalizeRef.current?.close();
        return true;
      }
      navigation.goBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress,
    );
    return () => backHandler.remove();
  }, [navigation]);

  useEffect(() => {
    dispatch(getMotifsRetours());
  }, [dispatch]);

  const handleToggleFavorite = () => dispatch(toggleFavorite(client.kunnr));

  const handleCall = (phoneNumber) => {
    if (phoneNumber) Linking.openURL(`tel:${phoneNumber}`);
    else alert(t("client.unavailablePhone"));
  };

  const handleSMS = (phoneNumber) => {
    if (phoneNumber) Linking.openURL(`sms:${phoneNumber}`);
    else alert(t("client.unavailablePhone"));
  };

  const handleEmail = (email) => {
    if (email) Linking.openURL(`mailto:${email}`);
    else alert(t("client.unavailableEmail"));
  };

  const handleMotifSelect = (motif) => {
    motifModalizeRef.current?.close();
    navigation.navigate("create_cmd", { client, motif });
  };

  // ── 7 vignettes, à plat — plus de sous-modalize intermédiaire pour Offre/Retour ──
  const QUICK_ACTIONS = [
    {
      key: "nouvelle_offre",
      label: t("client.newOffer"),
      subtitle: t("client.newOfferSub"),
      icon: "file-document-edit-outline",
      onPress: () => navigation.navigate("create_offr", { client }),
    },
    {
      key: "commande_retour",
      label: t("client.returnOrder"),
      subtitle: t("client.returnOrderSub"),
      icon: "package-variant-closed",
      onPress: () => motifModalizeRef.current?.open(),
    },
    {
      key: "nouvelle_livraison",
      label: t("client.newDelivery"),
      subtitle: t("client.newDeliverySub"),
      icon: "truck-fast-outline",
      onPress: () => navigation.navigate("livraison", { client }),
    },
    {
      key: "nouvel_encaissement",
      label: t("client.newPayment"),
      subtitle: t("client.newPaymentSub"),
      icon: "cash-multiple",
      onPress: () => navigation.navigate("encaissement", { client }),
    },
    {
      key: "historique_livraisons",
      label: t("client.historyDeliveries"),
      subtitle: t("client.historyDeliveriesSub"),
      icon: "truck-check-outline",
      onPress: () => navigation.navigate("allOutbounds", { client }),
    },
    {
      key: "historique_offres",
      label: t("client.historyOffers"),
      subtitle: t("client.historyOffersSub"),
      icon: "history",
      onPress: () => navigation.navigate("quotation_liste", { client }),
    },
    {
      key: "historique_commandes",
      label: t("client.historyOrders"),
      subtitle: t("client.historyOrdersSub"),
      icon: "history",
      onPress: () => navigation.navigate("all_orders", { client }),
    },
    // {
    //   key: "brouillon",
    //   label: "Brouillon",
    //   subtitle: "Voir les brouillons",
    //   icon: "note-text-outline",
    //   onPress: () => navigation.navigate("brouillon", { client }),
    // },
  ];

  const montantSplit = splitAmount(client.solde);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScreenBackground />
      <StatusBar barStyle="dark-content" />
      <PagerView style={styles.pager} initialPage={0}>
        <View key="details_page" style={styles.flex}>
          {/* Header — uniquement bouton retour */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
            >
              <Ionicons name="arrow-back" size={scale(20)} color={TEXT_DARK} />
            </TouchableOpacity>
          </View>
          <ScrollView
            key="details"
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Avatar */}
            <View style={styles.avatarWrap}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={scale(40)} color={BLUE} />
              </View>
            </View>

            {/* Carte principale */}
            <View style={styles.card}>
              <Text style={styles.clientName}>{client.name1}</Text>

              {/* Boutons Appeler / Message / Email / Favoris — sous le nom */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleCall(client?.num_tel)}
                >
                  <View style={styles.actionIconWrap}>
                    <Feather name="phone" size={scale(18)} color={BLUE} />
                  </View>
                  <Text style={styles.actionLabel}>{t("client.call")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleSMS(client?.num_tel)}
                >
                  <View style={styles.actionIconWrap}>
                    <MaterialCommunityIcons
                      name="message-outline"
                      size={scale(18)}
                      color={BLUE}
                    />
                  </View>
                  <Text style={styles.actionLabel}>{t("client.message")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleEmail(client?.Email)}
                >
                  <View style={styles.actionIconWrap}>
                    <MaterialIcons name="email" size={scale(18)} color={BLUE} />
                  </View>
                  <Text style={styles.actionLabel}>{t("client.email")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={handleToggleFavorite}
                >
                  <View style={styles.actionIconWrap}>
                    <MaterialCommunityIcons
                      name={isFavorite ? "star" : "star-outline"}
                      size={scale(18)}
                      color={isFavorite ? "#FE9900" : BLUE}
                    />
                  </View>
                  <Text style={styles.actionLabel}>
                    {t("client.favorites")}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Solde — space-between, montant en grand avec virgule/DA en petit */}
              <View style={styles.soldeRow}>
                <Text style={styles.soldeLabel}>{t("client.balance")}</Text>
                {/* <View style={styles.soldeValueRow}>
                  <Text style={styles.soldeInteger}>
                    {montantSplit.integer}
                  </Text>
                  <Text style={styles.soldeDecimal}>
                    ,{montantSplit.decimal}
                  </Text>
                  <Text style={styles.soldeCurrency}>DA</Text>
                </View> */}
                <PriceDisplay
                  amount={client.solde}
                  // color="#4CAF50"
                  intSize={24}
                  decSize={15}
                />
              </View>

              {/* Adresse */}
              <View style={styles.addressRow}>
                <Ionicons
                  name="location-sharp"
                  size={scale(16)}
                  color={TEXT_MUTED}
                  style={{ marginTop: 2 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.addressLabel}>
                    {t("client.address")} :
                  </Text>
                  <Text style={styles.addressValue}>
                    {client?.Rue || "—"} {client?.CodePostale || ""}
                    {"\n"}
                    {client?.DesignationWilaya ||
                      client?.ville ||
                      "Information indisponible"}
                    {client?.Pays ? `, ${client.Pays}` : ""}
                  </Text>
                </View>
              </View>
            </View>

            {/* Grille des 7 vignettes — style carte titre+description+icône, conforme à l'image */}
            <View style={styles.quickGrid}>
              {QUICK_ACTIONS.map((action) => (
                <TouchableOpacity
                  key={action.key}
                  style={styles.tile}
                  onPress={action.onPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.titleGroup}>
                    <Text style={styles.tileTitle}>{action.label}</Text>
                    {action.subtitle && (
                      <Text style={styles.tileSubtitle} numberOfLines={1}>
                        {action.subtitle}
                      </Text>
                    )}
                  </View>

                  <View style={styles.tileIconWrap}>
                    <MaterialCommunityIcons
                      name={action.icon}
                      size={scale(22)}
                      color="#fff"
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <ClientMap key="map" client={client} />
      </PagerView>

      {/* <BottomFade height={10} /> */}

      {/* Modalize motifs de retour — ouverte directement par la vignette */}
      <Modalize
        ref={motifModalizeRef}
        adjustToContentHeight
        modalStyle={styles.modalContainer}
        handlePosition="inside"
        withHandle={false}
        scrollViewProps={{ scrollEnabled: false }}
        disableScrollIfPossible={false}
        closeOnOverlayTap
        threshold={100}
        panGestureComponentEnabled={false}
        closeSnapPointStraightEnabled={false}
        velocityThreshold={0.8}
        panGestureEnabled={false}
        keyboardAvoidingBehavior="padding"
        avoidKeyboardLikeIOS
      >
        <View style={styles.motifModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {t("client.selectReturnReason")}
            </Text>
            <TouchableOpacity onPress={() => motifModalizeRef.current?.close()}>
              <MaterialIcons name="close" size={22} color={TEXT_MUTED} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollableMotifContainer}
            contentContainerStyle={styles.motifListContent}
          >
            {motifs?.map((item) => (
              <TouchableOpacity
                key={item.Augru}
                style={styles.motifItem}
                onPress={() => handleMotifSelect(item)}
              >
                <Text style={styles.motifText}>{item.Bezei}</Text>
                <Text style={styles.motifCode}>
                  {`${t("client.code")}: ${item.Augru}`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modalize>
    </SafeAreaView>
  );
};

export default ClientDetailsScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  pager: { flex: 1 },

  headerRow: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    direction: "ltr",
  },
  backBtn: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(50),
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: scale(60),
  },

  avatarWrap: {
    alignItems: "center",
    marginTop: Spacing.sm,
    marginBottom: -scale(36),
    zIndex: 10,
  },
  avatarCircle: {
    width: scale(76),
    height: scale(76),
    borderRadius: scale(38),
    backgroundColor: "#EAF6FE",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  card: {
    // backgroundColor: "#fff",
    borderRadius: Radius.lg,
    paddingTop: scale(44),
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  clientName: {
    fontSize: fs(19),
    fontWeight: "700",
    color: TEXT_DARK,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },

  // Actions sous le nom : Appeler / Message / Email / Favoris
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginBottom: Spacing.lg,
  },
  actionBtn: {
    alignItems: "center",
    gap: 4,
  },
  actionIconWrap: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: "#EAF6FE",
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontSize: fs(11),
    color: TEXT_MUTED,
    fontWeight: "600",
  },

  // Solde — space-between, montant grand avec décimales/devise petites
  soldeRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  soldeLabel: {
    fontSize: fs(18),
    fontWeight: "900",
    color: TEXT_DARK,
  },
  soldeValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  soldeInteger: {
    fontSize: fs(25),
    fontWeight: "900",
    color: BLUE,
  },
  soldeDecimal: {
    fontSize: fs(13),
    fontWeight: "700",
    color: BLUE,
  },
  soldeCurrency: {
    fontSize: fs(12),
    fontWeight: "600",
    color: TEXT_MUTED,
    marginLeft: 3,
  },

  // Adresse
  addressRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  addressLabel: {
    fontSize: fs(13),
    fontWeight: "600",
    color: TEXT_DARK,
    marginBottom: 2,
  },
  addressValue: {
    fontSize: fs(12.5),
    color: TEXT_MUTED,
    lineHeight: fs(17),
  },

  // Grille — style Fiori SAP : tiles compacts, bordure fine, fond blanc, icône + libellé en bas
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 1.5,
    marginTop: Spacing.lg,
  },
  tile: {
    width: "33%",
    height: 150,
    minHeight: scale(100),
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: Radius.md,
    padding: Spacing.md,
    justifyContent: "space-between",
  },
  tileTitle: {
    fontSize: fs(12.5),
    fontWeight: "700",
    color: TEXT_DARK,
    marginBottom: 2,
  },
  tileSubtitle: {
    fontSize: fs(10),
    color: TEXT_MUTED,
    lineHeight: fs(13),
  },
  tileIconWrap: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(8),
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    // marginTop: Spacing.xxxl,
  },

  // Modalize motifs
  modalContainer: {
    backgroundColor: "#fff",
    paddingTop: Spacing.sm,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
  },
  motifModalContent: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  modalTitle: {
    fontSize: fs(15),
    fontWeight: "700",
    color: TEXT_DARK,
  },
  scrollableMotifContainer: { maxHeight: scale(320) },
  motifListContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  motifItem: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: "#f5f5f5",
    borderRadius: Radius.md,
  },
  motifText: {
    fontSize: fs(14),
    fontWeight: "600",
    color: "#333",
  },
  motifCode: {
    fontSize: fs(11),
    color: "#666",
    marginTop: 4,
  },
});
