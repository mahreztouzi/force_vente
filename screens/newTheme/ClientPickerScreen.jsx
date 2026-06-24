import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { getClients } from "../../redux/slices/clientSlice";
import { Colors, Typography, Spacing } from "../../constants/Theme";
import { scale } from "../../utils/responsive";
import ScreenBackground from "../../components/common/ScreenBackground";
import SearchInput from "../../components/common/SearchInput";
import ClientListItem from "../../components/common/ClientListItem";
import {
  getSearchHistory,
  addSearchTerm,
  removeSearchTerm,
  clearSearchHistory,
} from "../../utils/clientSearchHistory";

const ClientPickerScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { clients, loading } = useSelector((state) => state.clients);
  const userData = useSelector((state) => state.auth.user);

  const [searchQuery, setSearchQuery] = useState("");
  const [history, setHistory] = useState([]);

  // Mode "sélection" (depuis CartScreen, avec callback) vs mode "consultation" (accès direct à la liste)
  const onSelectClient = route.params?.onSelectClient;

  useEffect(() => {
    const grp = userData?.grp;
    if (!grp) return;
    dispatch(getClients({ grpVendeur: grp }));
  }, [dispatch, userData?.grp]);

  useEffect(() => {
    getSearchHistory().then(setHistory);
  }, []);

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.trim().toLowerCase();
    return (clients || []).filter(
      (c) =>
        (c.name1 || "").toLowerCase().includes(q) ||
        (c.kunnr || "").toLowerCase().includes(q),
    );
  }, [clients, searchQuery]);

  const isSearching = searchQuery.trim().length > 0;

  // Clic sur un client : si un callback de sélection existe (mode picker), on l'utilise et on revient.
  // Sinon (mode consultation), on va directement aux détails du client.
  const handleSelect = useCallback(
    async (client) => {
      await addSearchTerm(client.name1);

      if (onSelectClient) {
        onSelectClient(client);
        navigation.goBack();
      } else {
        navigation.navigate("ClientDetails", { client });
      }
    },
    [onSelectClient, navigation],
  );

  const handleHistoryTap = (term) => setSearchQuery(term);

  const handleRemoveHistoryItem = async (term) => {
    const updated = await removeSearchTerm(term);
    setHistory(updated);
  };

  const handleClearHistory = async () => {
    await clearSearchHistory();
    setHistory([]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScreenBackground />
      <StatusBar barStyle="dark-content" />

      <SearchInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Rechercher un client..."
        onBackPress={() => navigation.goBack()}
        autoFocus
      />

      {!isSearching && (
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Recherches récentes</Text>
            {history.length > 0 && (
              <TouchableOpacity onPress={handleClearHistory}>
                <Text style={styles.clearAllText}>Tout effacer</Text>
              </TouchableOpacity>
            )}
          </View>

          {history.length === 0 ? (
            <Text style={styles.emptyHistoryText}>
              Aucune recherche récente
            </Text>
          ) : (
            <FlatList
              data={history}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.historyItem}
                  onPress={() => handleHistoryTap(item)}
                >
                  <View style={styles.historyItemLeft}>
                    <Ionicons
                      name="time-outline"
                      size={scale(18)}
                      color={Colors.textMuted}
                    />
                    <Text style={styles.historyItemText}>{item}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveHistoryItem(item)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name="close"
                      size={scale(16)}
                      color={Colors.textMuted}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}

      {isSearching && (
        <FlatList
          data={filteredClients}
          keyExtractor={(item) => item.kunnr}
          contentContainerStyle={styles.resultsList}
          renderItem={({ item, index }) => (
            <ClientListItem
              client={item}
              index={index}
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
                <Text style={styles.emptyText}>Aucun client trouvé</Text>
              </View>
            )
          }
        />
      )}
    </SafeAreaView>
  );
};

export default ClientPickerScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1 },

  historySection: {
    paddingHorizontal: Spacing.lg,
    flex: 1,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  historyTitle: {
    ...Typography.h3,
    fontSize: 14,
    color: Colors.textMuted,
  },
  clearAllText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: "600",
  },
  emptyHistoryText: {
    ...Typography.caption,
    marginTop: Spacing.lg,
    textAlign: "center",
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  historyItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  historyItemText: {
    ...Typography.body,
    fontWeight: "400",
  },

  resultsList: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
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
});
