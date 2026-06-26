import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { scale, fs } from "../../utils/responsive";
import { Spacing, Radius } from "../../constants/Theme";

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
  const [showYearPicker, setShowYearPicker] = useState(false);
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from(
    { length: 5 },
    (_, i) => currentYear - 4 + i,
  );

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
            <Text style={styles.monthTitle}>Période</Text>
            <TouchableOpacity
              style={styles.yearBtn}
              onPress={() => setShowYearPicker((v) => !v)}
            >
              <Text style={styles.yearBtnText}>{selectedYear}</Text>
              <MaterialIcons
                name="keyboard-arrow-down"
                size={scale(16)}
                color={BLUE}
              />
            </TouchableOpacity>
          </View>

          {showYearPicker && (
            <FlatList
              data={availableYears}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(y) => y.toString()}
              contentContainerStyle={styles.yearList}
              renderItem={({ item: y }) => (
                <TouchableOpacity
                  style={[styles.chip, selectedYear === y && styles.chipActive]}
                  onPress={() => {
                    onYearChange(y);
                    setShowYearPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedYear === y && styles.chipTextActive,
                    ]}
                  >
                    {y}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}

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
            placeholder={searchPlaceholder}
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
  yearList: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xs },
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
