// import React, {
//   useEffect,
//   useMemo,
//   useState,
//   useCallback,
//   useRef,
// } from "react";
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   FlatList,
//   StyleSheet,
//   Image,
//   ActivityIndicator,
//   StatusBar,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { Ionicons } from "@expo/vector-icons";
// import { useDispatch, useSelector } from "react-redux";
// import { Colors, Typography, Spacing, Radius } from "../../constants/Theme";
// import ScreenBackground from "../../components/common/ScreenBackground";
// import { getArticles } from "../../redux/slices/articleSlice";
// import { fs, scale } from "../../utils/responsive";
// import CartQuantityModal from "../../components/cart/CartQuantityModal";
// import { getCartItems } from "../../utils/cartStorage";
// import ArticleFilterModal from "../../components/cart/ArticleFilterModal";
// import SearchInput from "../../components/common/SearchInput";
// import { applySorts, applyStockFilter } from "../../utils/articleSort";
// import ArticleCard from "../../components/common/ArticleCard";
// import BottomFade from "../../components/common/Bottomfade";
// import { useTranslation } from "react-i18next";

// const HomeScreen = ({ navigation }) => {
//   const dispatch = useDispatch();
//   const { t } = useTranslation();
//   const { articles, loading, error } = useSelector((state) => state.articles);

//   const [searchQuery, setSearchQuery] = useState("");
//   const [selectedCategory, setSelectedCategory] = useState("Tous");
//   const [cartQuantities, setCartQuantities] = useState({});
//   const [selectedArticleForCart, setSelectedArticleForCart] = useState(null);
//   const [activeSorts, setActiveSorts] = useState([]);
//   const [stockFilter, setStockFilter] = useState("all");

//   // ── Modale filtre ──────────────────────────
//   const [filterVisible, setFilterVisible] = useState(false);
//   // Position du bouton filtre mesurée pour ancrer la modale juste en dessous
//   const [filterAnchor, setFilterAnchor] = useState({
//     top: scale(100),
//     right: scale(12),
//   });
//   const filterBtnRef = useRef(null);

//   const cartModalizeRef = useRef(null);

//   useEffect(() => {
//     dispatch(getArticles());
//   }, [dispatch]);

//   const refreshCartQuantities = useCallback(async () => {
//     const items = await getCartItems();
//     const map = {};
//     items.forEach((it) => {
//       map[it.id] = it.quantity;
//     });
//     setCartQuantities(map);
//   }, []);

//   useEffect(() => {
//     refreshCartQuantities();
//   }, [refreshCartQuantities]);

//   const categories = useMemo(() => {
//     if (!articles?.length) return ["Tous"];
//     return [
//       "Tous",
//       ...new Set(articles.map((item) => item.Category).filter(Boolean)),
//     ];
//   }, [articles]);

//   const filteredArticles = useMemo(() => {
//     let list = articles || [];
//     if (selectedCategory !== "Tous") {
//       list = list.filter((item) => item.Category === selectedCategory);
//     }
//     if (searchQuery.trim()) {
//       const q = searchQuery.trim().toLowerCase();
//       list = list.filter((item) =>
//         (item.designation || "").toLowerCase().includes(q),
//       );
//     }
//     list = applyStockFilter(list, stockFilter);
//     list = applySorts(list, activeSorts);
//     return list;
//   }, [articles, selectedCategory, searchQuery, stockFilter, activeSorts]);

//   const handleApplyFilters = useCallback((sorts, stock) => {
//     setActiveSorts(sorts);
//     setStockFilter(stock);
//   }, []);

//   const hasActiveFilters = activeSorts.length > 0 || stockFilter !== "all";

//   // Mesure la position du bouton filtre puis ouvre la modale
//   const handleOpenFilter = () => {
//     filterBtnRef.current?.measure((_x, _y, _w, h, _px, pageY) => {
//       setFilterAnchor({
//         top: pageY + h + scale(6), // juste sous le bouton + petit gap
//         right: scale(12),
//       });
//       setFilterVisible(true);
//     });
//   };

//   const handleAddToCart = useCallback((item) => {
//     setSelectedArticleForCart(item);
//     requestAnimationFrame(() => cartModalizeRef.current?.open());
//   }, []);

//   const handleCartConfirm = useCallback(() => {
//     refreshCartQuantities();
//   }, [refreshCartQuantities]);

//   const renderCategoryChip = ({ item: category }) => {
//     const isActive = selectedCategory === category;
//     return (
//       <TouchableOpacity
//         style={styles.categoryChip}
//         onPress={() => setSelectedCategory(category)}
//         activeOpacity={0.6}
//       >
//         <Text
//           style={[styles.categoryLabel, isActive && styles.categoryLabelActive]}
//         >
//           {category}
//         </Text>
//         {isActive && <View style={styles.activeUnderline} />}
//       </TouchableOpacity>
//     );
//   };

//   const renderArticleCard = ({ item }) => (
//     <ArticleCard
//       item={item}
//       cartQuantity={cartQuantities[item.id]}
//       onPress={() => {}}
//       onAddToCart={() => handleAddToCart(item)}
//     />
//   );

//   return (
//     <SafeAreaView style={styles.safeArea} edges={["top"]}>
//       <ScreenBackground />
//       <StatusBar barStyle="dark-content" />

//       <View style={styles.fixedHeader}>
//         <View style={styles.topBar}>
//           <Image
//             source={require("../../assets/images/Logo_no_back.png")}
//             style={styles.logo}
//             resizeMode="contain"
//           />
//           <View style={styles.taglineWrap}>
//             <Text style={styles.taglineSmall}>Fast</Text>
//             <Text style={styles.taglineBig}>Delivery</Text>
//           </View>
//         </View>

//         {/* SearchInput avec ref sur le bouton filtre via onFilterRef */}
//         <SearchInput
//           // placeholder="Rechercher des produits..."
//           placeholder={t("home.searchPlaceholder")}
//           onPress={() =>
//             navigation.navigate("ArticleSearch", {
//               onSelectArticle: () => {},
//             })
//           }
//           // On passe la ref du bouton filtre et le handler d'ouverture
//           filterBtnRef={filterBtnRef}
//           onFilterPress={handleOpenFilter}
//           filterActive={hasActiveFilters}
//           fullWidth
//         />

//         <FlatList
//           data={categories}
//           keyExtractor={(item) => item}
//           renderItem={renderCategoryChip}
//           horizontal
//           showsHorizontalScrollIndicator={false}
//           contentContainerStyle={styles.categoriesList}
//         />
//       </View>

//       <FlatList
//         data={filteredArticles}
//         keyExtractor={(item) => String(item.id)}
//         renderItem={renderArticleCard}
//         numColumns={2}
//         columnWrapperStyle={styles.row}
//         contentContainerStyle={styles.listContent}
//         showsVerticalScrollIndicator={false}
//         ListHeaderComponent={
//           error ? (
//             <Text style={styles.errorText}>
//               Une erreur est survenue lors du chargement des articles.
//             </Text>
//           ) : null
//         }
//         ListEmptyComponent={
//           loading ? (
//             <ActivityIndicator
//               size="large"
//               color={Colors.primary}
//               style={styles.loader}
//             />
//           ) : (
//             <View style={styles.emptyWrap}>
//               <Ionicons
//                 name="cube-outline"
//                 size={scale(48)}
//                 color={Colors.textMuted}
//               />
//               <Text style={styles.emptyText}>Aucun article trouvé</Text>
//             </View>
//           )
//         }
//       />

//       <CartQuantityModal
//         reference={cartModalizeRef}
//         article={selectedArticleForCart}
//         onConfirm={handleCartConfirm}
//       />

//       {/* Modale filtre style Outlook — positionnée sous le bouton */}
//       <ArticleFilterModal
//         visible={filterVisible}
//         onClose={() => setFilterVisible(false)}
//         anchorTop={filterAnchor.top}
//         anchorRight={filterAnchor.right}
//         initialSorts={activeSorts}
//         initialStockFilter={stockFilter}
//         onApply={handleApplyFilters}
//       />

//       <BottomFade />
//     </SafeAreaView>
//   );
// };

// export default HomeScreen;

// const styles = StyleSheet.create({
//   safeArea: { flex: 1 },
//   fixedHeader: {
//     paddingHorizontal: 7,
//     paddingTop: Spacing.md,
//     backgroundColor: "transparent",
//   },
//   listContent: {
//     paddingHorizontal: 2,
//     paddingTop: Spacing.md,
//   },
//   row: {
//     justifyContent: "space-between",
//   },
//   topBar: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "flex-start",
//   },
//   logo: {
//     width: scale(40),
//     height: scale(40),
//   },
//   taglineWrap: {
//     marginLeft: 10,
//     justifyContent: "center",
//   },
//   taglineSmall: {
//     fontSize: fs(12),
//     fontWeight: "500",
//     color: "rgba(0,0,0,0.45)",
//     letterSpacing: 2,
//     textTransform: "capitalize",
//     marginLeft: 1,
//   },
//   taglineBig: {
//     fontSize: fs(22),
//     fontWeight: "900",
//     color: "black",
//     letterSpacing: 0.6,
//     lineHeight: fs(22),
//   },
//   categoriesList: {
//     gap: Spacing.xl,
//     paddingBottom: Spacing.md,
//   },
//   categoryChip: {
//     paddingVertical: Spacing.xs,
//     alignItems: "center",
//   },
//   categoryLabel: {
//     fontSize: fs(15),
//     fontWeight: "400",
//     color: "rgba(0,0,0,0.4)",
//   },
//   categoryLabelActive: {
//     color: "black",
//     fontWeight: "900",
//   },
//   activeUnderline: {
//     marginTop: 4,
//     width: 15,
//     height: 2,
//     backgroundColor: "black",
//     borderRadius: 2,
//   },
//   loader: { marginTop: Spacing.xxxl },
//   emptyWrap: {
//     alignItems: "center",
//     marginTop: Spacing.xxxl,
//     gap: Spacing.sm,
//   },
//   emptyText: { ...Typography.caption },
//   errorText: {
//     color: Colors.error,
//     fontSize: fs(12),
//     marginBottom: Spacing.md,
//   },
// });

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
  Image,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Colors, Typography, Spacing } from "../../constants/Theme";
import ScreenBackground from "../../components/common/ScreenBackground";
import { getArticles } from "../../redux/slices/articleSlice";
import { fs, scale } from "../../utils/responsive";
import CartQuantityModal from "../../components/cart/CartQuantityModal";
import { getCartItems } from "../../utils/cartStorage";
import ArticleFilterModal from "../../components/cart/ArticleFilterModal";
import SearchInput from "../../components/common/SearchInput";
import { applySorts, applyStockFilter } from "../../utils/articleSort";
import ArticleCard from "../../components/common/ArticleCard";
import BottomFade from "../../components/common/Bottomfade";
import { useAppLanguage } from "../../hooks/useAppLanguage";

// Clé interne stable — indépendante de la langue affichée
const ALL_KEY = "ALL";

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { isRTL } = useAppLanguage();

  const { articles, loading, error } = useSelector((state) => state.articles);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(ALL_KEY);
  const [cartQuantities, setCartQuantities] = useState({});
  const [selectedArticleForCart, setSelectedArticleForCart] = useState(null);
  const [activeSorts, setActiveSorts] = useState([]);
  const [stockFilter, setStockFilter] = useState("all");
  const [filterVisible, setFilterVisible] = useState(false);
  const [filterAnchor, setFilterAnchor] = useState({
    top: scale(100),
    right: scale(12),
  });

  const filterBtnRef = useRef(null);
  const cartModalizeRef = useRef(null);

  useEffect(() => {
    dispatch(getArticles());
  }, [dispatch]);

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

  const categories = useMemo(() => {
    if (!articles?.length) return [ALL_KEY];
    return [
      ALL_KEY,
      ...new Set(articles.map((item) => item.Category).filter(Boolean)),
    ];
  }, [articles]);

  const getCategoryLabel = useCallback(
    (category) => (category === ALL_KEY ? t("home.all") : category),
    [t],
  );

  const filteredArticles = useMemo(() => {
    let list = articles || [];
    if (selectedCategory !== ALL_KEY) {
      list = list.filter((item) => item.Category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((item) =>
        (item.designation || "").toLowerCase().includes(q),
      );
    }
    list = applyStockFilter(list, stockFilter);
    list = applySorts(list, activeSorts);
    return list;
  }, [articles, selectedCategory, searchQuery, stockFilter, activeSorts]);

  const handleApplyFilters = useCallback((sorts, stock) => {
    setActiveSorts(sorts);
    setStockFilter(stock);
  }, []);

  const hasActiveFilters = activeSorts.length > 0 || stockFilter !== "all";

  // Positionne la modale filtre sous le bouton filtre.
  // absolute positioning n'est PAS mirorré par React Native RTL natif
  // → on adapte manuellement left/right uniquement pour ce cas.
  const handleOpenFilter = () => {
    filterBtnRef.current?.measure((_x, _y, _w, h, _px, pageY) => {
      setFilterAnchor({
        top: pageY + h + scale(6),
        right: isRTL ? undefined : scale(12),
        left: isRTL ? scale(12) : undefined,
      });
      setFilterVisible(true);
    });
  };

  const handleAddToCart = useCallback((item) => {
    setSelectedArticleForCart(item);
    requestAnimationFrame(() => cartModalizeRef.current?.open());
  }, []);

  const handleCartConfirm = useCallback(() => {
    refreshCartQuantities();
  }, [refreshCartQuantities]);

  const renderCategoryChip = ({ item: category }) => {
    const isActive = selectedCategory === category;
    return (
      <TouchableOpacity
        style={styles.categoryChip}
        onPress={() => setSelectedCategory(category)}
        activeOpacity={0.6}
      >
        <Text
          style={[styles.categoryLabel, isActive && styles.categoryLabelActive]}
        >
          {getCategoryLabel(category)}
        </Text>
        {isActive && <View style={styles.activeUnderline} />}
      </TouchableOpacity>
    );
  };

  const renderArticleCard = ({ item }) => (
    <ArticleCard
      item={item}
      cartQuantity={cartQuantities[item.id]}
      onPress={() => {}}
      onAddToCart={() => handleAddToCart(item)}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScreenBackground />
      <StatusBar barStyle="dark-content" />

      <View style={styles.fixedHeader}>
        {/* TopBar — React Native miroir automatiquement en RTL */}
        <View style={styles.topBar}>
          <Image
            source={require("../../assets/images/Logo_no_back.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.taglineWrap}>
            <Text style={styles.taglineSmall}>Fast</Text>
            <Text style={styles.taglineBig}>Delivery</Text>
          </View>
        </View>

        <SearchInput
          placeholder={t("home.searchPlaceholder")}
          onPress={() =>
            navigation.navigate("ArticleSearch", { onSelectArticle: () => {} })
          }
          filterBtnRef={filterBtnRef}
          onFilterPress={handleOpenFilter}
          filterActive={hasActiveFilters}
          fullWidth
          // Seule la flèche retour change logiquement selon le sens
          isRTL={isRTL}
        />

        {/* FlatList catégories — React Native gère l'ordre RTL automatiquement */}
        <FlatList
          data={categories}
          keyExtractor={(item) => item}
          renderItem={renderCategoryChip}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      <FlatList
        data={filteredArticles}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderArticleCard}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          error ? (
            <Text style={styles.errorText}>{t("home.loadError")}</Text>
          ) : null
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator
              size="large"
              color={Colors.primary}
              style={styles.loader}
            />
          ) : (
            <View style={styles.emptyWrap}>
              <Ionicons
                name="cube-outline"
                size={scale(48)}
                color={Colors.textMuted}
              />
              <Text style={styles.emptyText}>{t("home.noResults")}</Text>
            </View>
          )
        }
      />

      <CartQuantityModal
        reference={cartModalizeRef}
        article={selectedArticleForCart}
        onConfirm={handleCartConfirm}
      />

      {/* ArticleFilterModal : seule exception où on gère left/right manuellement
          car position absolute n'est pas mirorré par le RTL natif */}
      <ArticleFilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        anchorTop={filterAnchor.top}
        anchorRight={filterAnchor.right}
        anchorLeft={filterAnchor.left}
        initialSorts={activeSorts}
        initialStockFilter={stockFilter}
        onApply={handleApplyFilters}
        isRTL={isRTL}
      />

      <BottomFade />
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1 },

  fixedHeader: {
    paddingHorizontal: 7,
    paddingTop: Spacing.md,
    backgroundColor: "transparent",
  },

  // Pas de RTL manuel — React Native le miroir automatiquement après forceRTL
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  logo: {
    width: scale(40),
    height: scale(40),
  },
  taglineWrap: {
    marginLeft: 10,
    justifyContent: "center",
  },
  taglineSmall: {
    fontSize: fs(12),
    fontWeight: "500",
    color: "rgba(0,0,0,0.45)",
    letterSpacing: 2,
    textTransform: "capitalize",
    marginLeft: 1,
  },
  taglineBig: {
    fontSize: fs(22),
    fontWeight: "900",
    color: "black",
    letterSpacing: 0.6,
    lineHeight: fs(22),
  },

  categoriesList: {
    gap: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  categoryChip: {
    paddingVertical: Spacing.xs,
    alignItems: "center",
  },
  categoryLabel: {
    fontSize: fs(15),
    fontWeight: "400",
    color: "rgba(0,0,0,0.4)",
  },
  categoryLabelActive: {
    color: "black",
    fontWeight: "900",
  },
  activeUnderline: {
    marginTop: 4,
    width: 15,
    height: 2,
    backgroundColor: "black",
    borderRadius: 2,
  },

  listContent: {
    paddingHorizontal: 2,
    paddingTop: Spacing.md,
  },
  row: {
    justifyContent: "space-between",
  },

  loader: { marginTop: Spacing.xxxl },
  emptyWrap: {
    alignItems: "center",
    marginTop: Spacing.xxxl,
    gap: Spacing.sm,
  },
  emptyText: { ...Typography.caption },
  errorText: {
    color: Colors.error,
    fontSize: fs(12),
    marginBottom: Spacing.md,
  },
});
