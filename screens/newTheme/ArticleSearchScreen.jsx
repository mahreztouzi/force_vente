import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
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
import { getArticles } from "../../redux/slices/articleSlice";
import { Colors, Typography, Spacing } from "../../constants/Theme";
import { scale } from "../../utils/responsive";
import ScreenBackground from "../../components/common/ScreenBackground";
import SearchInput from "../../components/common/SearchInput";
import ArticleCard from "../../components/common/ArticleCard";
import CartQuantityModal from "../../components/cart/CartQuantityModal";
import { getCartItems } from "../../utils/cartStorage";
import {
  getArticleSearchHistory,
  addArticleSearchTerm,
  removeArticleSearchTerm,
  clearArticleSearchHistory,
} from "../../utils/articleSearchHistory";

const ArticleSearchScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { articles, loading } = useSelector((state) => state.articles);

  const [searchQuery, setSearchQuery] = useState("");
  const [history, setHistory] = useState([]);
  const [cartQuantities, setCartQuantities] = useState({});

  const [selectedArticleForCart, setSelectedArticleForCart] = useState(null);
  const cartModalizeRef = useRef(null);

  useEffect(() => {
    dispatch(getArticles());
  }, [dispatch]);

  useEffect(() => {
    getArticleSearchHistory().then(setHistory);
  }, []);

  const refreshCartQuantities = useCallback(async () => {
    const items = await getCartItems();
    const map = {};
    items.forEach((it) => {
      map[it.id] = it.quantity;
    });
    setCartQuantities(map);
  }, []);

  useEffect(() => {
    refreshCartQuantities();
  }, [refreshCartQuantities]);

  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.trim().toLowerCase();
    return (articles || []).filter((a) =>
      (a.designation || "").toLowerCase().includes(q),
    );
  }, [articles, searchQuery]);

  const suggestions = useMemo(() => (articles || []).slice(0, 6), [articles]);

  const isSearching = searchQuery.trim().length > 0;

  // Au clic sur un article (recherche OU suggestion) : ouvre la modalize de quantité,
  // exactement comme dans HomeScreen — pas de sélection "badge dans l'input".
  const handleArticleTap = useCallback(async (article) => {
    await addArticleSearchTerm(article.designation);
    setSelectedArticleForCart(article);
    requestAnimationFrame(() => cartModalizeRef.current?.open());
  }, []);

  const handleCartConfirm = useCallback(() => {
    refreshCartQuantities();
  }, [refreshCartQuantities]);

  const handleHistoryTap = (term) => setSearchQuery(term);

  const handleRemoveHistoryItem = async (term) => {
    const updated = await removeArticleSearchTerm(term);
    setHistory(updated);
  };

  const handleClearHistory = async () => {
    await clearArticleSearchHistory();
    setHistory([]);
  };

  const renderCard = useCallback(
    ({ item }) => (
      <ArticleCard
        item={item}
        cartQuantity={cartQuantities[item.id]}
        onPress={() => handleArticleTap(item)}
        onAddToCart={() => handleArticleTap(item)}
      />
    ),
    [cartQuantities, handleArticleTap],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScreenBackground />
      <StatusBar barStyle="dark-content" />

      <SearchInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Rechercher des produits..."
        onBackPress={() => navigation.goBack()}
        autoFocus
      />

      {!isSearching && (
        <View style={styles.bodyWrap}>
          <View style={styles.historyHeader}>
            <Text style={styles.sectionTitle}>Recherches récentes</Text>
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
            history.map((term) => (
              <TouchableOpacity
                key={term}
                style={styles.historyItem}
                onPress={() => handleHistoryTap(term)}
              >
                <View style={styles.historyItemLeft}>
                  <Ionicons
                    name="time-outline"
                    size={scale(18)}
                    color={Colors.textMuted}
                  />
                  <Text style={styles.historyItemText}>{term}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveHistoryItem(term)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name="close"
                    size={scale(16)}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}

          <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>
            Suggestions
          </Text>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderCard}
            numColumns={2}
            columnWrapperStyle={styles.row}
            scrollEnabled={false}
          />
        </View>
      )}

      {isSearching && (
        <FlatList
          data={filteredArticles}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderCard}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.resultsList}
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
                  name="magnify"
                  size={scale(40)}
                  color={Colors.textMuted}
                />
                <Text style={styles.emptyText}>Aucun article trouvé</Text>
              </View>
            )
          }
        />
      )}

      {/* Même modalize de quantité que HomeScreen — composant partagé, pas dupliqué */}
      <CartQuantityModal
        reference={cartModalizeRef}
        article={selectedArticleForCart}
        onConfirm={handleCartConfirm}
      />
    </SafeAreaView>
  );
};

export default ArticleSearchScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  bodyWrap: { paddingHorizontal: Spacing.lg, flex: 1 },
  row: { justifyContent: "space-between" },

  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
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
    marginBottom: Spacing.md,
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
  historyItemText: { ...Typography.body, fontWeight: "400" },

  resultsList: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  loader: { marginTop: Spacing.xxxl },
  emptyWrap: { alignItems: "center", marginTop: Spacing.xxxl, gap: Spacing.sm },
  emptyText: { ...Typography.caption },
});
