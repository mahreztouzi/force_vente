// import React from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { Colors, Typography, Spacing, Radius } from "../../constants/Theme";
// import { scale } from "../../utils/responsive";

// /**
//  * Input de recherche réutilisable.
//  *
//  * Mode "édition directe" — filtre sur place (ex: ClientPickerScreen) :
//  *   <SearchInput value={query} onChangeText={setQuery} placeholder="Rechercher..." autoFocus />
//  *
//  * Mode "déclencheur" — ouvre un autre écran au tap (ex: ClientListScreen) :
//  *   <SearchInput placeholder="Rechercher un client..." onPress={() => navigation.navigate("ClientPicker")} />
//  *
//  * Mode "déclencheur + sélection personnalisée" (ex: CartScreen avec badge avatar du client choisi) :
//  *   <SearchInput onPress={openPicker} rightSlot={<MonBadge />} fullWidth />
//  *
//  * Bouton filtre intégré DANS le bloc searchWrap, collé à droite (ex: HomeScreen) :
//  *   <SearchInput onPress={openSearch} onFilterPress={openFilters} filterActive={hasFilters} fullWidth />
//  *
//  * fullWidth: retire le padding horizontal du conteneur — à utiliser quand l'écran
//  * appelant a déjà son propre padding extérieur (ex: CartScreen, HomeScreen).
//  */
// const SearchInput = ({
//   value = "",
//   onChangeText,
//   placeholder = "Rechercher...",
//   onBackPress,
//   onPress,
//   autoFocus = false,
//   rightSlot,
//   showChevron = false,
//   fullWidth = false,
//   onFilterPress,
//   filterActive = false,
//   filterBtnRef,
// }) => {
//   const isTrigger = !!onPress;

//   // Le bouton filtre est maintenant un élément interne de searchWrap, pas un frère séparé.
//   const filterButton = onFilterPress && (
//     <TouchableOpacity
//       ref={filterBtnRef}
//       style={[styles.filterBtn, filterActive && styles.filterBtnActive]}
//       onPress={(e) => {
//         e.stopPropagation?.(); // évite de déclencher aussi onPress du conteneur en mode déclencheur
//         onFilterPress();
//       }}
//       activeOpacity={0.7}
//     >
//       <Ionicons
//         name="options-outline"
//         size={scale(26)}
//         color={filterActive ? Colors.primary : Colors.textPrimary}
//       />
//     </TouchableOpacity>
//   );

//   return (
//     <View style={[styles.row, fullWidth && styles.rowFullWidth]}>
//       {onBackPress && (
//         <TouchableOpacity onPress={onBackPress} style={styles.backBtn}>
//           <Ionicons
//             name="arrow-back"
//             size={scale(22)}
//             color={Colors.textPrimary}
//           />
//         </TouchableOpacity>
//       )}

//       {isTrigger ? (
//         <TouchableOpacity
//           style={[styles.searchWrap]}
//           onPress={onPress}
//           activeOpacity={0.7}
//         >
//           {rightSlot ? (
//             rightSlot
//           ) : (
//             <>
//               <Ionicons
//                 name="search"
//                 size={scale(18)}
//                 color={Colors.textMuted}
//                 style={{
//                   backgroundColor: "black",
//                   paddingHorizontal: 12,
//                   paddingVertical: 5,
//                   borderRadius: 30,
//                 }}
//               />
//               <Text style={styles.placeholderText} numberOfLines={1}>
//                 {value || placeholder}
//               </Text>
//             </>
//           )}
//           {showChevron && (
//             <Ionicons
//               name="chevron-forward"
//               size={scale(18)}
//               color={Colors.textMuted}
//             />
//           )}
//           {filterButton}
//         </TouchableOpacity>
//       ) : (
//         <View style={[styles.searchWrap]}>
//           <Ionicons
//             name="search"
//             size={scale(18)}
//             color={Colors.textMuted}
//             style={{
//               backgroundColor: "black",
//               paddingHorizontal: 12,
//               paddingVertical: 5,
//               borderRadius: 30,
//             }}
//           />
//           <TextInput
//             style={styles.searchInput}
//             placeholder={placeholder}
//             placeholderTextColor={Colors.textMuted}
//             value={value}
//             onChangeText={onChangeText}
//             autoFocus={autoFocus}
//           />
//           {value !== "" && (
//             <TouchableOpacity onPress={() => onChangeText("")}>
//               <Ionicons
//                 name="close-circle"
//                 size={scale(18)}
//                 color={Colors.textMuted}
//               />
//             </TouchableOpacity>
//           )}
//           {filterButton}
//         </View>
//       )}
//     </View>
//   );
// };

// export default SearchInput;

// const styles = StyleSheet.create({
//   row: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: Spacing.lg,
//     paddingVertical: Spacing.md,
//     gap: Spacing.sm,
//   },
//   rowFullWidth: {
//     paddingHorizontal: 0,
//   },
//   backBtn: {
//     padding: Spacing.xs,
//   },

//   searchWrap: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#F2F3F5",
//     borderRadius: 25,
//     paddingHorizontal: Spacing.md,
//     height: scale(52),
//     gap: Spacing.sm,
//     borderWidth: 2,
//   },
//   searchInput: {
//     flex: 1,
//     ...Typography.body,
//     fontWeight: "400",
//   },
//   placeholderText: {
//     flex: 1,
//     ...Typography.body,
//     fontWeight: "400",
//     color: Colors.textMuted,
//   },
//   // Bouton filtre, maintenant interne au searchWrap : taille réduite pour rester dans la hauteur (52)
//   filterBtn: {
//     width: scale(36),
//     height: scale(36),
//     borderRadius: scale(18),
//     // backgroundColor: Colors.white,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   filterBtnActive: {
//     // backgroundColor: Colors.primary,
//   },
// });

import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, Radius } from "../../constants/Theme";
import { scale } from "../../utils/responsive";

const SearchInput = ({
  value = "",
  onChangeText,
  placeholder = "Rechercher...",
  onBackPress,
  onPress,
  autoFocus = false,
  rightSlot,
  showChevron = false,
  fullWidth = false,
  onFilterPress,
  filterActive = false,
  filterBtnRef,
  isRTL = false,
}) => {
  const isTrigger = !!onPress;

  const filterButton = onFilterPress && (
    <TouchableOpacity
      ref={filterBtnRef}
      style={[styles.filterBtn, filterActive && styles.filterBtnActive]}
      onPress={(e) => {
        e.stopPropagation?.();
        onFilterPress();
      }}
      activeOpacity={0.7}
    >
      <Ionicons
        name="options-outline"
        size={scale(26)}
        color={filterActive ? Colors.primary : Colors.textPrimary}
      />
    </TouchableOpacity>
  );

  const searchIcon = (
    <Ionicons
      name="search"
      size={scale(18)}
      color={Colors.textMuted}
      style={styles.searchIconBg}
    />
  );

  return (
    <View
      style={[
        styles.row,
        fullWidth && styles.rowFullWidth,
        isRTL && styles.rowRTL,
      ]}
    >
      {onBackPress && (
        <TouchableOpacity onPress={onBackPress} style={styles.backBtn}>
          <Ionicons
            name={isRTL ? "arrow-forward" : "arrow-back"}
            size={scale(22)}
            color={Colors.textPrimary}
          />
        </TouchableOpacity>
      )}

      {isTrigger ? (
        <TouchableOpacity
          style={[styles.searchWrap, isRTL && styles.searchWrapRTL]}
          onPress={onPress}
          activeOpacity={0.7}
        >
          {rightSlot ? (
            rightSlot
          ) : (
            <>
              {searchIcon}
              <Text
                style={[styles.placeholderText, isRTL && styles.textRTL]}
                numberOfLines={1}
              >
                {value || placeholder}
              </Text>
            </>
          )}
          {showChevron && (
            <Ionicons
              name={isRTL ? "chevron-back" : "chevron-forward"}
              size={scale(18)}
              color={Colors.textMuted}
            />
          )}
          {filterButton}
        </TouchableOpacity>
      ) : (
        <View style={[styles.searchWrap, isRTL && styles.searchWrapRTL]}>
          {searchIcon}
          <TextInput
            style={[styles.searchInput, isRTL && styles.textRTL]}
            placeholder={placeholder}
            placeholderTextColor={Colors.textMuted}
            value={value}
            onChangeText={onChangeText}
            autoFocus={autoFocus}
          />
          {value !== "" && (
            <TouchableOpacity onPress={() => onChangeText("")}>
              <Ionicons
                name="close-circle"
                size={scale(18)}
                color={Colors.textMuted}
              />
            </TouchableOpacity>
          )}
          {filterButton}
        </View>
      )}
    </View>
  );
};

export default SearchInput;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  rowRTL: {
    flexDirection: "row-reverse",
  },
  rowFullWidth: {
    paddingHorizontal: 0,
  },
  backBtn: {
    padding: Spacing.xs,
  },

  searchWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F3F5",
    borderRadius: 25,
    paddingHorizontal: Spacing.md,
    height: scale(52),
    gap: Spacing.sm,
    borderWidth: 2,
  },
  // En RTL : icône search à droite, bouton filtre à gauche — on inverse l'ordre des enfants
  searchWrapRTL: {
    flexDirection: "row-reverse",
  },
  searchIconBg: {
    backgroundColor: "black",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 30,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    fontWeight: "400",
  },
  placeholderText: {
    flex: 1,
    ...Typography.body,
    fontWeight: "400",
    color: Colors.textMuted,
  },
  textRTL: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  filterBtn: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    alignItems: "center",
    justifyContent: "center",
  },
  filterBtnActive: {},
});
