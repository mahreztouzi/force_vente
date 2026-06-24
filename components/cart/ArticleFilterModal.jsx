// import React, { useState, useEffect } from "react";
// import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
// import { Modalize } from "react-native-modalize";
// import { Ionicons } from "@expo/vector-icons";
// import { Colors, Spacing, Radius, Typography } from "../../constants/Theme";
// import { scale, fs } from "../../utils/responsive";

// const CRITERIA = [
//   {
//     key: "prix",
//     label: "Prix",
//     ascLabel: "Croissant",
//     descLabel: "Décroissant",
//   },
//   {
//     key: "quantite",
//     label: "Quantité",
//     ascLabel: "Croissant",
//     descLabel: "Décroissant",
//   },
//   {
//     key: "alphabet",
//     label: "Alphabétique",
//     ascLabel: "A → Z",
//     descLabel: "Z → A",
//   },
// ];

// const ArticleFilterModal = ({
//   reference,
//   initialSorts = [],
//   initialStockFilter = "all",
//   onApply,
// }) => {
//   const [activeSorts, setActiveSorts] = useState(initialSorts);
//   const [stockFilter, setStockFilter] = useState(initialStockFilter);

//   useEffect(() => {
//     setActiveSorts(initialSorts);
//     setStockFilter(initialStockFilter);
//   }, [initialSorts, initialStockFilter]);

//   const getDirectionForKey = (key) =>
//     activeSorts.find((s) => s.key === key)?.direction || null;
//   const getPriorityIndex = (key) => activeSorts.findIndex((s) => s.key === key);

//   const toggleDirection = (key, direction) => {
//     const current = getDirectionForKey(key);

//     if (current === direction) {
//       setActiveSorts((prev) => prev.filter((s) => s.key !== key));
//     } else if (current) {
//       setActiveSorts((prev) =>
//         prev.map((s) => (s.key === key ? { ...s, direction } : s)),
//       );
//     } else {
//       setActiveSorts((prev) => [...prev, { key, direction }]);
//     }
//   };

//   const handleReset = () => {
//     setActiveSorts([]);
//     setStockFilter("all");
//   };

//   const handleApply = () => {
//     onApply?.(activeSorts, stockFilter);
//     reference.current?.close();
//   };

//   return (
//     <Modalize
//       ref={reference}
//       adjustToContentHeight
//       modalStyle={styles.modal}
//       handlePosition="inside"
//       handleStyle={styles.handle}
//       withHandle
//     >
//       <View style={styles.content}>
//         <Text style={styles.title}>Filtrer et trier</Text>

//         <Text style={styles.sectionLabel}>Disponibilité</Text>
//         <View style={styles.chipRow}>
//           {[
//             { key: "all", label: "Tous" },
//             { key: "in_stock", label: "En stock" },
//             { key: "out_of_stock", label: "Hors stock" },
//           ].map((opt) => (
//             <TouchableOpacity
//               key={opt.key}
//               style={[
//                 styles.chip,
//                 stockFilter === opt.key && styles.chipActive,
//               ]}
//               onPress={() => setStockFilter(opt.key)}
//               activeOpacity={0.7}
//             >
//               <Text
//                 style={[
//                   styles.chipText,
//                   stockFilter === opt.key && styles.chipTextActive,
//                 ]}
//               >
//                 {opt.label}
//               </Text>
//             </TouchableOpacity>
//           ))}
//         </View>

//         <Text style={styles.sectionLabel}>Trier par</Text>
//         {CRITERIA.map((criterion) => {
//           const direction = getDirectionForKey(criterion.key);
//           const priority = getPriorityIndex(criterion.key);

//           return (
//             <View key={criterion.key} style={styles.criterionRow}>
//               <View style={styles.criterionLabelRow}>
//                 <Text style={styles.criterionLabel}>{criterion.label}</Text>
//                 {priority !== -1 && (
//                   <View style={styles.priorityBadge}>
//                     <Text style={styles.priorityBadgeText}>{priority + 1}</Text>
//                   </View>
//                 )}
//               </View>

//               <View style={styles.directionRow}>
//                 <TouchableOpacity
//                   style={[
//                     styles.directionBtn,
//                     direction === "asc" && styles.directionBtnActive,
//                   ]}
//                   onPress={() => toggleDirection(criterion.key, "asc")}
//                   activeOpacity={0.7}
//                 >
//                   <Ionicons
//                     name="arrow-up"
//                     size={scale(14)}
//                     color={
//                       direction === "asc" ? Colors.white : Colors.textMuted
//                     }
//                   />
//                   <Text
//                     style={[
//                       styles.directionText,
//                       direction === "asc" && styles.directionTextActive,
//                     ]}
//                   >
//                     {criterion.ascLabel}
//                   </Text>
//                 </TouchableOpacity>

//                 <TouchableOpacity
//                   style={[
//                     styles.directionBtn,
//                     direction === "desc" && styles.directionBtnActive,
//                   ]}
//                   onPress={() => toggleDirection(criterion.key, "desc")}
//                   activeOpacity={0.7}
//                 >
//                   <Ionicons
//                     name="arrow-down"
//                     size={scale(14)}
//                     color={
//                       direction === "desc" ? Colors.white : Colors.textMuted
//                     }
//                   />
//                   <Text
//                     style={[
//                       styles.directionText,
//                       direction === "desc" && styles.directionTextActive,
//                     ]}
//                   >
//                     {criterion.descLabel}
//                   </Text>
//                 </TouchableOpacity>
//               </View>
//             </View>
//           );
//         })}

//         <View style={styles.footerRow}>
//           <TouchableOpacity
//             style={styles.resetBtn}
//             onPress={handleReset}
//             activeOpacity={0.7}
//           >
//             <Text style={styles.resetText}>Réinitialiser</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.applyBtn}
//             onPress={handleApply}
//             activeOpacity={0.85}
//           >
//             <Text style={styles.applyText}>Appliquer</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </Modalize>
//   );
// };

// export default ArticleFilterModal;

// const styles = StyleSheet.create({
//   modal: {
//     borderTopLeftRadius: Radius.xl,
//     borderTopRightRadius: Radius.xl,
//   },
//   handle: {
//     backgroundColor: Colors.border,
//     width: scale(40),
//   },
//   content: {
//     padding: Spacing.xl,
//     paddingBottom: Spacing.xxxl,
//   },
//   title: {
//     ...Typography.h2,
//     marginBottom: Spacing.lg,
//   },
//   sectionLabel: {
//     ...Typography.caption,
//     color: Colors.textMuted,
//     fontWeight: "700",
//     marginBottom: Spacing.sm,
//     marginTop: Spacing.md,
//   },
//   chipRow: {
//     flexDirection: "row",
//     gap: Spacing.sm,
//     marginBottom: Spacing.sm,
//   },
//   chip: {
//     paddingHorizontal: Spacing.md,
//     paddingVertical: Spacing.sm,
//     borderRadius: Radius.pill,
//     borderWidth: 1,
//     borderColor: Colors.border,
//   },
//   chipActive: {
//     backgroundColor: Colors.primary,
//     borderColor: Colors.primary,
//   },
//   chipText: {
//     ...Typography.caption,
//     fontWeight: "600",
//   },
//   chipTextActive: {
//     color: Colors.white,
//   },
//   criterionRow: {
//     marginBottom: Spacing.lg,
//   },
//   criterionLabelRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: Spacing.sm,
//     marginBottom: Spacing.sm,
//   },
//   criterionLabel: {
//     ...Typography.body,
//     fontWeight: "600",
//   },
//   priorityBadge: {
//     width: scale(18),
//     height: scale(18),
//     borderRadius: scale(9),
//     backgroundColor: Colors.secondary,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   priorityBadgeText: {
//     color: Colors.white,
//     fontSize: fs(10),
//     fontWeight: "800",
//   },
//   directionRow: {
//     flexDirection: "row",
//     gap: Spacing.sm,
//   },
//   directionBtn: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: Spacing.xs,
//     paddingVertical: Spacing.sm,
//     borderRadius: Radius.md,
//     borderWidth: 1,
//     borderColor: Colors.border,
//   },
//   directionBtnActive: {
//     backgroundColor: Colors.primary,
//     borderColor: Colors.primary,
//   },
//   directionText: {
//     ...Typography.caption,
//     fontWeight: "600",
//   },
//   directionTextActive: {
//     color: Colors.white,
//   },
//   footerRow: {
//     flexDirection: "row",
//     gap: Spacing.md,
//     marginTop: Spacing.lg,
//   },
//   resetBtn: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: Spacing.md,
//     borderRadius: Radius.pill,
//     borderWidth: 1.5,
//     borderColor: Colors.border,
//   },
//   resetText: {
//     ...Typography.body,
//     fontWeight: "700",
//     color: Colors.textSecondary,
//   },
//   applyBtn: {
//     flex: 2,
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: Spacing.md,
//     borderRadius: Radius.pill,
//     backgroundColor: Colors.secondary,
//   },
//   applyText: {
//     color: Colors.white,
//     fontWeight: "800",
//     letterSpacing: 0.5,
//   },
// });

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Radius, Typography } from "../../constants/Theme";
import { scale, fs } from "../../utils/responsive";

const CRITERIA = [
  {
    key: "prix",
    label: "Prix",
    ascLabel: "Croissant",
    descLabel: "Décroissant",
  },
  {
    key: "quantite",
    label: "Quantité",
    ascLabel: "Croissant",
    descLabel: "Décroissant",
  },
  {
    key: "alphabet",
    label: "Alphabétique",
    ascLabel: "A → Z",
    descLabel: "Z → A",
  },
];

/**
 * Petite modale style Outlook — s'ouvre en haut à droite sous le bouton filtre.
 *
 * Usage :
 *   const filterRef = useRef(null);            // ref sur le bouton filtre (pour mesurer sa position)
 *   <FilterButton ref={filterRef} onPress={openModal} />
 *   <ArticleFilterModal
 *     visible={visible}
 *     onClose={() => setVisible(false)}
 *     anchorRef={filterRef}                    // optionnel — pour positionner automatiquement
 *     anchorTop={y}                            // ou passer la position manuellement
 *     anchorRight={x}
 *     initialSorts={activeSorts}
 *     initialStockFilter={stockFilter}
 *     onApply={handleApplyFilters}
 *   />
 */
const ArticleFilterModal = ({
  visible,
  onClose,
  anchorTop = scale(100), // position Y sous le bouton (en px depuis le haut de l'écran)
  anchorRight = scale(12), // distance depuis le bord droit
  initialSorts = [],
  initialStockFilter = "all",
  onApply,
}) => {
  const [activeSorts, setActiveSorts] = useState(initialSorts);
  const [stockFilter, setStockFilter] = useState(initialStockFilter);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    setActiveSorts(initialSorts);
    setStockFilter(initialStockFilter);
  }, [initialSorts, initialStockFilter]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 200,
          friction: 18,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start();
      scaleAnim.setValue(0.92);
    }
  }, [visible]);

  const getDirectionForKey = (key) =>
    activeSorts.find((s) => s.key === key)?.direction || null;
  const getPriorityIndex = (key) => activeSorts.findIndex((s) => s.key === key);

  const toggleDirection = (key, direction) => {
    const current = getDirectionForKey(key);
    if (current === direction) {
      setActiveSorts((prev) => prev.filter((s) => s.key !== key));
    } else if (current) {
      setActiveSorts((prev) =>
        prev.map((s) => (s.key === key ? { ...s, direction } : s)),
      );
    } else {
      setActiveSorts((prev) => [...prev, { key, direction }]);
    }
  };

  const handleReset = () => {
    setActiveSorts([]);
    setStockFilter("all");
  };

  const handleApply = () => {
    onApply?.(activeSorts, stockFilter);
    onClose?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Overlay invisible qui ferme au tap hors de la modale */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      {/* Petite carte positionnée sous le bouton filtre */}
      <Animated.View
        style={[
          styles.card,
          {
            top: anchorTop,
            right: anchorRight,
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-6, 0],
                }),
              },
            ],
          },
        ]}
        pointerEvents="box-none"
      >
        {/* Flèche pointant vers le bouton */}
        <View style={styles.arrow} />

        {/* ── Disponibilité ── */}
        <Text style={styles.sectionLabel}>Disponibilité</Text>
        <View style={styles.chipRow}>
          {[
            { key: "all", label: "Tous" },
            { key: "in_stock", label: "En stock" },
            { key: "out_of_stock", label: "Hors stock" },
          ].map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.chip,
                stockFilter === opt.key && styles.chipActive,
              ]}
              onPress={() => setStockFilter(opt.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.chipText,
                  stockFilter === opt.key && styles.chipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Trier par ── */}
        <Text style={[styles.sectionLabel, { marginTop: scale(10) }]}>
          Trier par
        </Text>
        {CRITERIA.map((criterion) => {
          const direction = getDirectionForKey(criterion.key);
          const priority = getPriorityIndex(criterion.key);

          return (
            <View key={criterion.key} style={styles.criterionRow}>
              <View style={styles.criterionLabelRow}>
                <Text style={styles.criterionLabel}>{criterion.label}</Text>
                {priority !== -1 && (
                  <View style={styles.priorityBadge}>
                    <Text style={styles.priorityBadgeText}>{priority + 1}</Text>
                  </View>
                )}
              </View>
              <View style={styles.directionRow}>
                {[
                  { dir: "asc", label: criterion.ascLabel, icon: "arrow-up" },
                  {
                    dir: "desc",
                    label: criterion.descLabel,
                    icon: "arrow-down",
                  },
                ].map(({ dir, label, icon }) => (
                  <TouchableOpacity
                    key={dir}
                    style={[
                      styles.directionBtn,
                      direction === dir && styles.directionBtnActive,
                    ]}
                    onPress={() => toggleDirection(criterion.key, dir)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={icon}
                      size={scale(11)}
                      color={direction === dir ? "#fff" : Colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.directionText,
                        direction === dir && styles.directionTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}

        {/* ── Footer ── */}
        <View style={styles.footerRow}>
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={handleReset}
            activeOpacity={0.7}
          >
            <Text style={styles.resetText}>Réinit.</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={handleApply}
            activeOpacity={0.85}
          >
            <Text style={styles.applyText}>Appliquer</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

export default ArticleFilterModal;

const styles = StyleSheet.create({
  // Overlay transparent
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },

  // Carte principale
  card: {
    position: "absolute",
    width: scale(260),
    backgroundColor: "#fff",
    borderRadius: Radius.lg,
    padding: scale(14),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 12,
  },

  // Petite flèche en haut à droite pointant vers le bouton
  arrow: {
    position: "absolute",
    top: -7,
    right: scale(14),
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderBottomWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#fff",
  },

  sectionLabel: {
    fontSize: fs(10),
    fontWeight: "700",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: scale(6),
  },

  // Chips disponibilité
  chipRow: {
    flexDirection: "row",
    gap: scale(5),
    flexWrap: "wrap",
  },
  chip: {
    paddingHorizontal: scale(9),
    paddingVertical: scale(4),
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: fs(11),
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: "#fff",
  },

  // Critères de tri
  criterionRow: {
    marginBottom: scale(8),
  },
  criterionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(5),
    marginBottom: scale(4),
  },
  criterionLabel: {
    fontSize: fs(12),
    fontWeight: "600",
    color: "#1A1F36",
  },
  priorityBadge: {
    width: scale(16),
    height: scale(16),
    borderRadius: scale(8),
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  priorityBadgeText: {
    color: "#fff",
    fontSize: fs(9),
    fontWeight: "800",
  },
  directionRow: {
    flexDirection: "row",
    gap: scale(5),
  },
  directionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(3),
    paddingVertical: scale(5),
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  directionBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  directionText: {
    fontSize: fs(10),
    fontWeight: "600",
    color: Colors.textMuted,
  },
  directionTextActive: {
    color: "#fff",
  },

  // Footer
  footerRow: {
    flexDirection: "row",
    gap: scale(8),
    marginTop: scale(12),
    paddingTop: scale(10),
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  resetBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(8),
    paddingHorizontal: scale(12),
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  resetText: {
    fontSize: fs(12),
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  applyBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(8),
    borderRadius: Radius.pill,
    backgroundColor: Colors.secondary,
  },
  applyText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: fs(12),
  },
});
