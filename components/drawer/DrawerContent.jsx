// import React from "react";
// import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
// import {
//   Ionicons,
//   MaterialCommunityIcons,
//   MaterialIcons,
// } from "@expo/vector-icons";
// import { useSelector, useDispatch } from "react-redux";
// import { useNavigation } from "@react-navigation/native";
// import { logoutUser } from "../../redux/slices/authSlice";
// import { scale, fs } from "../../utils/responsive";
// import { Spacing, Radius } from "../../constants/Theme";

// const BLUE = "#1E5FD9";
// const GREEN = "#1D9E75";
// const TEXT_DARK = "#1A1F36";
// const TEXT_MUTED = "#8A93A6";
// const ORANGE = "#FF9800";
// const RED = "#E24B4A";
// const BORDER = "#EEF1F6";

// const DrawerContent = ({ onClose }) => {
//   const navigation = useNavigation();
//   const dispatch = useDispatch();
//   const userData = useSelector((state) => state.auth.user);
//   const { totalMontant } = useSelector((state) => state.offline);

//   const initials = userData?.fullName
//     ? userData.fullName
//         .split(" ")
//         .map((p) => p.charAt(0))
//         .slice(0, 2)
//         .join("")
//         .toUpperCase()
//     : "U";

//   const splitAmount = (value) => {
//     const num = parseFloat(value || 0);
//     const fixed = num.toFixed(2);
//     const [integerPart, decimalPart] = fixed.split(".");
//     const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
//     return { integer: formattedInteger, decimal: decimalPart };
//   };

//   const montantSplit = splitAmount(userData?.montant);

//   const handleReception = () => {
//     onClose?.();
//     navigation.navigate("transfert_list", { magasin: userData?.magasin });
//   };

//   const handleSettings = () => {
//     onClose?.();
//     navigation.navigate("Settings");
//   };

//   const handleEncaissement = () => {
//     // Écran à créer
//   };

//   const handleLogout = () => {
//     Alert.alert(
//       "Déconnexion",
//       "Êtes-vous sûr de vouloir vous déconnecter ?",
//       [
//         { text: "Annuler", style: "cancel" },
//         {
//           text: "Oui",
//           onPress: () => {
//             onClose?.();
//             dispatch(logoutUser()).then(() => {
//               navigation.reset({ index: 0, routes: [{ name: "Login" }] });
//             });
//           },
//         },
//       ],
//       { cancelable: false },
//     );
//   };

//   const NAV_ITEMS = [
//     {
//       key: "reception",
//       label: "Nouvelle réception",
//       icon: "package-down",
//       color: BLUE,
//       bg: "#E6F1FB",
//       onPress: handleReception,
//     },
//     {
//       key: "encaissement",
//       label: "Nouvel encaissement",
//       icon: "cash-multiple",
//       color: GREEN,
//       bg: "#E1F5EE",
//       onPress: handleEncaissement,
//     },
//   ];

//   return (
//     <View style={styles.container}>
//       {/* Header : titre + X */}
//       <View style={styles.topHeader}>
//         <Text style={styles.topHeaderTitle}>Menu</Text>
//         <TouchableOpacity
//           onPress={onClose}
//           style={styles.closeBtn}
//           hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//         >
//           <Ionicons name="close" size={scale(22)} color={TEXT_DARK} />
//         </TouchableOpacity>
//       </View>

//       {/* Card profil + montant */}
//       <View style={styles.profileCard}>
//         {/* Ligne avatar + nom + code */}
//         <View style={styles.profileRow}>
//           <View style={styles.avatar}>
//             <Text style={styles.avatarText}>{initials}</Text>
//           </View>
//           <View style={styles.profileTextWrap}>
//             <Text style={styles.profileName} numberOfLines={1}>
//               {userData?.fullName || "Utilisateur"}
//             </Text>
//             <Text style={styles.profileCode}>{userData?.code}</Text>
//           </View>
//         </View>

//         {/* Séparateur interne */}
//         <View style={styles.cardDivider} />

//         {/* Montant — sans titre, juste le chiffre */}
//         <View style={styles.montantValueRow}>
//           <Text style={styles.montantInteger}>{montantSplit.integer}</Text>
//           <Text style={styles.montantDecimal}>,{montantSplit.decimal}</Text>
//           <Text style={styles.montantCurrency}> DA</Text>
//         </View>

//         {/* Offline sync si besoin */}
//         {totalMontant && totalMontant != 0 ? (
//           <View style={styles.offlineRow}>
//             <MaterialIcons
//               name="sync-disabled"
//               size={scale(13)}
//               color={ORANGE}
//             />
//             <Text style={styles.offlineLabel}>En attente de sync</Text>
//             <Text style={styles.offlineAmount}>
//               {parseFloat(totalMontant).toLocaleString("fr-DZ", {
//                 style: "currency",
//                 currency: "DZD",
//                 minimumFractionDigits: 2,
//               })}
//             </Text>
//           </View>
//         ) : null}
//       </View>

//       <View style={styles.separator} />

//       {/* Paramètres */}
//       <TouchableOpacity
//         style={styles.settingsRow}
//         onPress={handleSettings}
//         activeOpacity={0.6}
//       >
//         <View style={styles.settingsLeft}>
//           <MaterialCommunityIcons
//             name="cog-outline"
//             size={scale(20)}
//             color={TEXT_DARK}
//           />
//           <Text style={styles.settingsLabel}>Paramètres</Text>
//         </View>
//         <MaterialCommunityIcons
//           name="chevron-right"
//           size={scale(20)}
//           color={TEXT_MUTED}
//         />
//       </TouchableOpacity>

//       <View style={styles.separator} />

//       {/* Titre section navigation */}
//       <Text style={styles.sectionTitle}>Autre navigation</Text>

//       {/* Navigation */}
//       <View style={styles.navList}>
//         {NAV_ITEMS.map((item) => (
//           <TouchableOpacity
//             key={item.key}
//             style={styles.navRow}
//             onPress={item.onPress}
//             activeOpacity={0.6}
//           >
//             <View style={[styles.navIconWrap, { backgroundColor: item.bg }]}>
//               <MaterialCommunityIcons
//                 name={item.icon}
//                 size={scale(20)}
//                 color={item.color}
//               />
//             </View>
//             <Text style={styles.navLabel}>{item.label}</Text>
//             <MaterialCommunityIcons
//               name="chevron-right"
//               size={scale(18)}
//               color={TEXT_MUTED}
//             />
//           </TouchableOpacity>
//         ))}
//       </View>

//       {/* Spacer */}
//       <View style={{ flex: 1 }} />

//       {/* Déconnexion */}
//       <TouchableOpacity
//         style={styles.logoutBtn}
//         onPress={handleLogout}
//         activeOpacity={0.7}
//       >
//         <Ionicons name="log-out-outline" size={scale(20)} color={RED} />
//         <Text style={styles.logoutText}>Déconnexion</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// export default DrawerContent;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     paddingHorizontal: Spacing.lg,
//     paddingTop: scale(56),
//     paddingBottom: scale(32),
//   },

//   // Header
//   topHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     marginBottom: Spacing.xl,
//   },
//   topHeaderTitle: {
//     fontSize: fs(18),
//     fontWeight: "800",
//     color: TEXT_DARK,
//   },
//   closeBtn: {
//     padding: Spacing.xs,
//   },

//   // Card profil + montant
//   profileCard: {
//     backgroundColor: "#fff",
//     borderRadius: Radius.lg,
//     padding: Spacing.lg,
//     marginBottom: Spacing.lg,
//     borderWidth: 1,
//     borderColor: BORDER,
//   },
//   profileRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: Spacing.md,
//   },
//   avatar: {
//     width: scale(48),
//     height: scale(48),
//     borderRadius: scale(24),
//     backgroundColor: "#E6F1FB",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   avatarText: {
//     fontSize: fs(16),
//     fontWeight: "700",
//     color: BLUE,
//   },
//   profileTextWrap: {
//     flex: 1,
//   },
//   profileName: {
//     fontSize: fs(16),
//     fontWeight: "700",
//     color: TEXT_DARK,
//   },
//   profileCode: {
//     fontSize: fs(12),
//     color: TEXT_MUTED,
//     marginTop: 2,
//   },

//   // Séparateur interne à la card
//   cardDivider: {
//     height: 1,
//     backgroundColor: BORDER,
//     marginVertical: Spacing.md,
//   },

//   // Montant (sans titre)
//   montantValueRow: {
//     flexDirection: "row",
//     justifyContent: "flex-end",
//     alignItems: "baseline",
//   },
//   montantInteger: {
//     fontSize: fs(28),
//     fontWeight: "800",
//     color: TEXT_DARK,
//     letterSpacing: -0.5,
//   },
//   montantDecimal: {
//     fontSize: fs(15),
//     fontWeight: "700",
//     color: TEXT_DARK,
//   },
//   montantCurrency: {
//     fontSize: fs(13),
//     fontWeight: "600",
//     color: TEXT_MUTED,
//     marginLeft: 2,
//   },

//   // Offline
//   offlineRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: Spacing.xs,
//     marginTop: Spacing.sm,
//     paddingTop: Spacing.sm,
//     borderTopWidth: 1,
//     borderTopColor: BORDER,
//   },
//   offlineLabel: {
//     fontSize: fs(11),
//     color: TEXT_MUTED,
//     flex: 1,
//   },
//   offlineAmount: {
//     fontSize: fs(11),
//     fontWeight: "700",
//     color: ORANGE,
//   },

//   separator: {
//     height: 1,
//     backgroundColor: BORDER,
//     marginBottom: Spacing.lg,
//   },

//   // Paramètres
//   settingsRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingVertical: Spacing.sm,
//     marginBottom: Spacing.lg,
//   },
//   settingsLeft: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: Spacing.md,
//   },
//   settingsLabel: {
//     fontSize: fs(14),
//     fontWeight: "600",
//     color: TEXT_DARK,
//   },

//   // Titre section
//   sectionTitle: {
//     fontSize: fs(11),
//     fontWeight: "700",
//     color: TEXT_MUTED,
//     textTransform: "uppercase",
//     letterSpacing: 0.5,
//     marginBottom: Spacing.md,
//   },

//   // Navigation
//   navList: {
//     gap: 2,
//   },
//   navRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: Spacing.md,
//     paddingVertical: Spacing.sm,
//   },
//   navIconWrap: {
//     width: scale(36),
//     height: scale(36),
//     borderRadius: scale(10),
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   navLabel: {
//     flex: 1,
//     fontSize: fs(14),
//     fontWeight: "600",
//     color: TEXT_DARK,
//   },

//   // Déconnexion
//   logoutBtn: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: Spacing.sm,
//     paddingVertical: Spacing.md,
//     borderTopWidth: 1,
//     borderTopColor: BORDER,
//   },
//   logoutText: {
//     fontSize: fs(14),
//     fontWeight: "700",
//     color: RED,
//   },
// });

import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useAppLanguage } from "../../hooks/useAppLanguage";
import { logoutUser } from "../../redux/slices/authSlice";
import { scale, fs } from "../../utils/responsive";
import { Spacing, Radius } from "../../constants/Theme";

const BLUE = "#1E5FD9";
const GREEN = "#1D9E75";
const TEXT_DARK = "#1A1F36";
const TEXT_MUTED = "#8A93A6";
const ORANGE = "#FF9800";
const RED = "#E24B4A";
const BORDER = "#EEF1F6";

const DrawerContent = ({ onClose }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useAppLanguage();
  const langBtnRef = useRef(null);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [langDropdownPos, setLangDropdownPos] = useState({ top: 0, right: 0 });

  const openLangPicker = () => {
    langBtnRef.current?.measure((_x, _y, w, h, px, py) => {
      setLangDropdownPos({
        top: py + h + scale(12) - scale(56),
        right: Spacing.lg,
      });
      setShowLangPicker(true);
    });
  };

  const userData = useSelector((state) => state.auth.user);
  const { totalMontant } = useSelector((state) => state.offline);

  const initials = userData?.fullName
    ? userData.fullName
        .split(" ")
        .map((p) => p.charAt(0))
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  const splitAmount = (value) => {
    const num = parseFloat(value || 0);
    const [integerPart, decimalPart] = num.toFixed(2).split(".");
    return {
      integer: integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, " "),
      decimal: decimalPart,
    };
  };

  const montantSplit = splitAmount(userData?.montant);

  const LANGUAGES = [
    { code: "fr", label: t("settings.french") },
    { code: "ar", label: t("settings.arabic") },
  ];

  const NAV_ITEMS = [
    {
      key: "reception",
      label: t("nav.reception"),
      icon: "package-down",
      color: BLUE,
      bg: "#E6F1FB",
      onPress: () => {
        onClose?.();
        navigation.navigate("transfert_list", { magasin: userData?.magasin });
      },
    },
    {
      key: "encaissement",
      label: t("nav.encaissement"),
      icon: "cash-multiple",
      color: GREEN,
      bg: "#E1F5EE",
      onPress: () => {
        // Écran à créer
      },
    },
  ];

  const handleSettings = () => {
    onClose?.();
    navigation.navigate("Settings");
  };

  const handleLogout = () => {
    Alert.alert(
      t("common.logout"),
      t("common.logoutConfirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.yes"),
          onPress: () => {
            onClose?.();
            dispatch(logoutUser()).then(() => {
              navigation.reset({ index: 0, routes: [{ name: "Login" }] });
            });
          },
        },
      ],
      { cancelable: false },
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.topHeader}>
        <Text style={styles.topHeaderTitle}>{t("common.menu")}</Text>
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={scale(22)} color={TEXT_DARK} />
        </TouchableOpacity>
      </View>

      {/* Card profil + montant */}
      <View style={styles.profileCard}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileTextWrap}>
            <Text style={styles.profileName} numberOfLines={1}>
              {userData?.fullName || "Utilisateur"}
            </Text>
            <Text style={styles.profileCode}>{userData?.code}</Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.montantValueRow}>
          <Text style={styles.montantInteger}>{montantSplit.integer}</Text>
          <Text style={styles.montantDecimal}>,{montantSplit.decimal}</Text>
          <Text style={styles.montantCurrency}> DA</Text>
        </View>

        {totalMontant && totalMontant != 0 ? (
          <View style={styles.offlineRow}>
            <MaterialIcons
              name="sync-disabled"
              size={scale(13)}
              color={ORANGE}
            />
            <Text style={styles.offlineLabel}>{t("common.pendingSync")}</Text>
            <Text style={styles.offlineAmount}>
              {parseFloat(totalMontant).toLocaleString("fr-DZ", {
                style: "currency",
                currency: "DZD",
                minimumFractionDigits: 2,
              })}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.separator} />

      {/* Paramètres */}
      <TouchableOpacity
        style={styles.settingsRow}
        onPress={handleSettings}
        activeOpacity={0.6}
      >
        <View style={styles.rowLeft}>
          <MaterialCommunityIcons
            name="cog-outline"
            size={scale(20)}
            color={TEXT_DARK}
          />
          <Text style={styles.rowLabel}>{t("settings.title")}</Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={scale(20)}
          color={TEXT_MUTED}
        />
      </TouchableOpacity>

      {/* Langue */}
      <TouchableOpacity
        ref={langBtnRef}
        style={styles.langBlock}
        onPress={openLangPicker}
        activeOpacity={0.6}
      >
        <View style={styles.rowLeft}>
          <MaterialCommunityIcons
            name="translate"
            size={scale(20)}
            color={TEXT_DARK}
          />
          <Text style={styles.rowLabel}>{t("settings.language")}</Text>
        </View>
        <View style={styles.rowLeft}>
          <Text style={styles.currentLangText}>
            {LANGUAGES.find((l) => l.code === currentLanguage)?.label}
          </Text>
          <MaterialCommunityIcons
            name={showLangPicker ? "chevron-up" : "chevron-down"}
            size={scale(18)}
            color={TEXT_MUTED}
          />
        </View>
      </TouchableOpacity>

      <Modal
        visible={showLangPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLangPicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowLangPicker(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.langDropdown,
                  { top: langDropdownPos.top, right: langDropdownPos.right },
                ]}
              >
                {LANGUAGES.map((lang) => {
                  const active = currentLanguage === lang.code;
                  return (
                    <TouchableOpacity
                      key={lang.code}
                      style={styles.langOption}
                      onPress={() => {
                        changeLanguage(lang.code);
                        setShowLangPicker(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.langOptionText,
                          active && styles.langOptionTextActive,
                        ]}
                      >
                        {lang.label}
                      </Text>
                      {active && (
                        <MaterialCommunityIcons
                          name="check"
                          size={scale(14)}
                          color={BLUE}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <View style={styles.separator} />

      {/* Autre navigation */}
      <Text style={styles.sectionTitle}>{t("nav.other")}</Text>

      <View style={styles.navList}>
        {NAV_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={styles.navRow}
            onPress={item.onPress}
            activeOpacity={0.6}
          >
            <View style={[styles.navIconWrap, { backgroundColor: item.bg }]}>
              <MaterialCommunityIcons
                name={item.icon}
                size={scale(20)}
                color={item.color}
              />
            </View>
            <Text style={styles.navLabel}>{item.label}</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={scale(18)}
              color={TEXT_MUTED}
            />
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flex: 1 }} />

      {/* Déconnexion */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <Ionicons name="log-out-outline" size={scale(20)} color={RED} />
        <Text style={styles.logoutText}>{t("common.logout")}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default DrawerContent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: scale(56),
    paddingBottom: scale(32),
  },

  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xl,
  },
  topHeaderTitle: { fontSize: fs(18), fontWeight: "800", color: TEXT_DARK },
  closeBtn: { padding: Spacing.xs },

  // Card profil + montant
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: BORDER,
  },
  profileRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  avatar: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    backgroundColor: "#E6F1FB",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: fs(16), fontWeight: "700", color: BLUE },
  profileTextWrap: { flex: 1 },
  profileName: { fontSize: fs(16), fontWeight: "700", color: TEXT_DARK },
  profileCode: { fontSize: fs(12), color: TEXT_MUTED, marginTop: 2 },
  cardDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: Spacing.md,
  },
  montantValueRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "baseline",
  },
  montantInteger: {
    fontSize: fs(28),
    fontWeight: "800",
    color: TEXT_DARK,
    letterSpacing: -0.5,
  },
  montantDecimal: { fontSize: fs(15), fontWeight: "700", color: TEXT_DARK },
  montantCurrency: {
    fontSize: fs(13),
    fontWeight: "600",
    color: TEXT_MUTED,
    marginLeft: 2,
  },
  offlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  offlineLabel: { fontSize: fs(11), color: TEXT_MUTED, flex: 1 },
  offlineAmount: { fontSize: fs(11), fontWeight: "700", color: ORANGE },

  separator: { height: 1, backgroundColor: BORDER, marginBottom: Spacing.lg },

  // Ligne générique icône + label + chevron
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  rowLabel: { fontSize: fs(14), fontWeight: "600", color: TEXT_DARK },

  // Langue
  langBlock: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  currentLangText: {
    fontSize: fs(13),
    fontWeight: "600",
    color: TEXT_MUTED,
    marginRight: Spacing.xs,
  },
  modalOverlay: { flex: 1 },
  langDropdown: {
    position: "absolute",
    backgroundColor: "#fff",
    borderRadius: Radius.md,
    paddingVertical: scale(4),
    minWidth: scale(140),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },
  langOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: scale(10),
    marginHorizontal: scale(4),
    marginVertical: scale(1),
    borderRadius: Radius.sm,
  },
  langOptionText: {
    fontSize: fs(14),
    fontWeight: "500",
    color: TEXT_DARK,
  },
  langOptionTextActive: {
    color: BLUE,
    fontWeight: "700",
  },
  // Section nav
  sectionTitle: {
    fontSize: fs(11),
    fontWeight: "700",
    color: TEXT_MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  navList: { gap: 2 },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  navIconWrap: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(10),
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: { flex: 1, fontSize: fs(14), fontWeight: "600", color: TEXT_DARK },

  // Déconnexion
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  logoutText: { fontSize: fs(14), fontWeight: "700", color: RED },
});
