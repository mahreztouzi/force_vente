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
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Radius, Typography } from "../../constants/Theme";
import { scale, fs } from "../../utils/responsive";

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
  const { t } = useTranslation();
  const [activeSorts, setActiveSorts] = useState(initialSorts);
  const [stockFilter, setStockFilter] = useState(initialStockFilter);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  const CRITERIA = [
    {
      key: "prix",
      label: t("filter.price"),
      ascLabel: t("filter.asc"),
      descLabel: t("filter.desc"),
    },
    {
      key: "quantite",
      label: t("filter.quantity"),
      ascLabel: t("filter.asc"),
      descLabel: t("filter.desc"),
    },
    {
      key: "alphabet",
      label: t("filter.alphabetic"),
      ascLabel: t("filter.az"),
      descLabel: t("filter.za"),
    },
  ];
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
        <Text style={styles.sectionLabel}>{t("filter.availability")}</Text>
        <View style={styles.chipRow}>
          {[
            { key: "all", label: t("filter.all") },
            { key: "in_stock", label: t("filter.inStock") },
            { key: "out_of_stock", label: t("filter.outOfStock") },
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
          {t("filter.sortBy")}
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
            <Text style={styles.resetText}>{t("filter.reset")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={handleApply}
            activeOpacity={0.85}
          >
            <Text style={styles.applyText}>{t("filter.apply")}</Text>
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
