import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { getClients, loadFavorites } from "../../redux/slices/clientSlice";
import { Colors, Typography, Spacing } from "../../constants/Theme";
import { scale, fs } from "../../utils/responsive";
import ScreenBackground from "../../components/common/ScreenBackground";
import SearchInput from "../../components/common/SearchInput";
import ClientListItem from "../../components/common/ClientListItem";
import BottomFade from "../../components/common/Bottomfade";

const TAB_BAR_HEIGHT = scale(58) + scale(20);

const ClientListScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const { clients, favorites, loading, error } = useSelector(
    (state) => state.clients,
  );
  const userData = useSelector((state) => state.auth.user);

  const [activeTab, setActiveTab] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  const loadClients = useCallback(async () => {
    const grp = userData?.grp;
    if (!grp) return;
    await dispatch(getClients({ grpVendeur: grp }));
    await dispatch(loadFavorites());
  }, [dispatch, userData?.grp]);

  useEffect(() => {
    loadClients();
  }, [dispatch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadClients();
    } finally {
      setRefreshing(false);
    }
  }, [loadClients]);

  const displayClients =
    activeTab === "favorites"
      ? (clients || []).filter((c) => favorites.includes(c.kunnr))
      : clients || [];

  const handleSelect = (client) => {
    navigation.navigate("ClientDetails", { client });
  };

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScreenBackground />
        <View style={styles.emptyWrap}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScreenBackground />
      <StatusBar barStyle="dark-content" />

      <View style={styles.titleRow}>
        <Text style={styles.title}>{t("clients.title")}</Text>
      </View>

      <SearchInput
        placeholder={t("clients.searchPlaceholder")}
        onPress={() => navigation.navigate("ClientPicker")}
        showChevron
      />

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "all" && styles.tabActive]}
          onPress={() => setActiveTab("all")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "all" && styles.tabTextActive,
            ]}
          >
            {t("clients.allClients")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "favorites" && styles.tabActive]}
          onPress={() => setActiveTab("favorites")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "favorites" && styles.tabTextActive,
            ]}
          >
            {t("clients.favorites")} ({favorites.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayClients}
        keyExtractor={(item) => item.kunnr}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        renderItem={({ item, index }) => (
          <ClientListItem
            client={item}
            index={index}
            isFavorite={favorites.includes(item.kunnr)}
            onPress={() => handleSelect(item)}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator
              size="large"
              color={Colors.primary}
              style={styles.loader}
            />
          ) : (
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons
                name="account-search-outline"
                size={scale(40)}
                color={Colors.textMuted}
              />
              <Text style={styles.emptyText}>{t("clients.noResults")}</Text>
            </View>
          )
        }
      />
      <BottomFade height={100} />
    </SafeAreaView>
  );
};

export default ClientListScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  titleRow: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  title: {
    ...Typography.h1,
  },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tab: {
    paddingVertical: Spacing.sm,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    ...Typography.body,
    fontSize: fs(14),
    color: Colors.textMuted,
    fontWeight: "400",
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: "700",
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: TAB_BAR_HEIGHT,
  },
  loader: { marginTop: Spacing.xxxl },
  emptyWrap: {
    alignItems: "center",
    marginTop: Spacing.xxxl,
    gap: Spacing.sm,
  },
  emptyText: {
    ...Typography.caption,
  },
  errorText: {
    color: Colors.error,
    fontSize: fs(14),
  },
});
