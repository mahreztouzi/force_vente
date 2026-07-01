import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { scale, fs } from "../../utils/responsive";
import { Spacing, Radius } from "../../constants/Theme";
import { useTranslation } from "react-i18next";

const BLUE = "#03A9F4";
const TEXT_DARK = "#1F2937";
const TEXT_MUTED = "#6B7280";

const MONTHS = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Jun",
  "Jul",
  "Aoû",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

/**
 * MonthStatusFilter — barre de filtres réutilisable.
 *
 * Props :
 *   statusOptions    — [{ key, label, color }]
 *   selectedStatus   — string
 *   onStatusChange   — (key) => void
 *
 *   selectedMonth    — number 0–11
 *   onMonthChange    — (i) => void
 *   selectedYear     — number
 *   onYearChange     — (y) => void
 *   showMonthFilter  — bool (défaut true)
 *
 *   searchQuery      — string
 *   onSearchChange   — (text) => void
 *   searchPlaceholder — string
 *   showSearch       — bool (défaut true)
 */
const MonthStatusFilter = ({
  statusOptions = [],
  selectedStatus,
  onStatusChange,

  selectedMonth,
  onMonthChange,
  selectedYear,
  onYearChange,
  showMonthFilter = true,

  searchQuery,
  onSearchChange,
  searchPlaceholder = "Rechercher...",
  showSearch = true,
}) => {
  const { t } = useTranslation();
  const MONTHS = t("common.months", { returnObjects: true });
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const yearBtnRef = useRef(null);

  const currentYear = new Date().getFullYear();
  const availableYears = Array.from(
    { length: 5 },
    (_, i) => currentYear - 4 + i,
  );

  const openYearPicker = () => {
    yearBtnRef.current?.measure((_x, _y, _w, h, _px, py) => {
      setDropdownPos({ top: py + h + scale(4), right: Spacing.lg });
      setShowYearPicker(true);
    });
  };

  return (
    <View>
      {/* Status chips */}
      {statusOptions.length > 0 && (
        <View style={styles.statusRow}>
          {statusOptions.map((opt) => {
            const active = selectedStatus === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.statusChip,
                  active && {
                    backgroundColor: opt.color,
                    borderColor: opt.color,
                  },
                ]}
                onPress={() => onStatusChange(opt.key)}
              >
                <Text
                  style={[
                    styles.statusChipText,
                    { color: active ? "#fff" : opt.color },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Month/year filter */}
      {showMonthFilter && (
        <View style={styles.monthBlock}>
          <View style={styles.monthHeader}>
            <Text style={styles.monthTitle}>{t("common.period")}</Text>
            <TouchableOpacity
              ref={yearBtnRef}
              style={styles.yearBtn}
              onPress={openYearPicker}
            >
              <Text style={styles.yearBtnText}>{selectedYear}</Text>
              <MaterialIcons
                name={
                  showYearPicker ? "keyboard-arrow-up" : "keyboard-arrow-down"
                }
                size={scale(16)}
                color={BLUE}
              />
            </TouchableOpacity>
          </View>

          <FlatList
            data={MONTHS.map((name, i) => ({ name, i }))}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(m) => m.i.toString()}
            contentContainerStyle={styles.monthList}
            renderItem={({ item: m }) => (
              <TouchableOpacity
                style={[
                  styles.chip,
                  selectedMonth === m.i && styles.chipActive,
                ]}
                onPress={() => onMonthChange(m.i)}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedMonth === m.i && styles.chipTextActive,
                  ]}
                >
                  {m.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Search */}
      {showSearch && (
        <View style={styles.searchWrap}>
          <MaterialIcons name="search" size={scale(18)} color={TEXT_MUTED} />
          <TextInput
            style={styles.searchInput}
            placeholder={searchPlaceholder || t("common.search")}
            placeholderTextColor={TEXT_MUTED}
            value={searchQuery}
            onChangeText={onSearchChange}
          />
          {!!searchQuery && (
            <TouchableOpacity onPress={() => onSearchChange("")}>
              <MaterialIcons name="clear" size={scale(16)} color={TEXT_MUTED} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Year picker dropdown modal */}
      <Modal
        visible={showYearPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowYearPicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowYearPicker(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.yearDropdown,
                  { top: dropdownPos.top, right: dropdownPos.right },
                ]}
              >
                {availableYears.map((y) => {
                  const active = selectedYear === y;
                  return (
                    <TouchableOpacity
                      key={y}
                      style={[
                        styles.yearOption,
                        active && styles.yearOptionActive,
                      ]}
                      onPress={() => {
                        onYearChange(y);
                        setShowYearPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.yearOptionText,
                          active && styles.yearOptionTextActive,
                        ]}
                      >
                        {y}
                      </Text>
                      {active && (
                        <MaterialIcons
                          name="check"
                          size={scale(14)}
                          color="#fff"
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
    </View>
  );
};

export default MonthStatusFilter;

const styles = StyleSheet.create({
  statusRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  statusChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: scale(5),
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#fff",
  },
  statusChipText: { fontSize: fs(11), fontWeight: "600" },

  monthBlock: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  monthTitle: {
    fontSize: fs(12),
    fontWeight: "700",
    color: TEXT_MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  yearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#fff",
    paddingHorizontal: Spacing.sm,
    paddingVertical: scale(4),
    borderRadius: Radius.pill,
  },
  yearBtnText: { fontSize: fs(12), fontWeight: "700", color: BLUE },
  monthList: { paddingHorizontal: Spacing.md },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: scale(5),
    borderRadius: Radius.pill,
    backgroundColor: "#fff",
    marginRight: Spacing.sm,
  },
  chipActive: { backgroundColor: BLUE },
  chipText: { fontSize: fs(12), fontWeight: "600", color: TEXT_MUTED },
  chipTextActive: { color: "#fff" },

  // Year dropdown modal
  modalOverlay: {
    flex: 1,
  },
  yearDropdown: {
    position: "absolute",
    backgroundColor: "#fff",
    borderRadius: Radius.md,
    paddingVertical: scale(4),
    minWidth: scale(120),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  yearOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: scale(10),
    borderRadius: Radius.sm,
    marginHorizontal: scale(4),
    marginVertical: scale(1),
  },
  yearOptionActive: { backgroundColor: BLUE },
  yearOptionText: { fontSize: fs(13), fontWeight: "600", color: TEXT_DARK },
  yearOptionTextActive: { color: "#fff" },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "#fff",
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: scale(8),
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
  },
  searchInput: { flex: 1, fontSize: fs(13), color: TEXT_DARK, padding: 0 },
});
