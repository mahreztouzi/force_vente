import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { Colors, Typography, Spacing, Radius } from "../../constants/Theme";
import ScreenBackground from "../../components/common/ScreenBackground";
import { getArticles } from "../../redux/slices/articleSlice";
import { fs, scale } from "../../utils/responsive";

// Icône générique par catégorie — fallback si la catégorie ne matche aucune entrée connue
const CATEGORY_ICONS = {
  default: "shape-outline",
};

const getCategoryIcon = (category) => {
  const key = (category || "").toLowerCase();
  if (
    key.includes("phone") ||
    key.includes("telephone") ||
    key.includes("téléphone")
  )
    return "cellphone";
  if (
    key.includes("ordinateur") ||
    key.includes("pc") ||
    key.includes("laptop")
  )
    return "laptop";
  if (
    key.includes("mode") ||
    key.includes("vetement") ||
    key.includes("vêtement")
  )
    return "tshirt-crew-outline";
  if (key.includes("electro") || key.includes("électro") || key.includes("tv"))
    return "television";
  if (key.includes("maison") || key.includes("meuble")) return "sofa-outline";
  return CATEGORY_ICONS.default;
};

// Hauteur réelle de la tab bar custom (cf. BottomTabs.jsx : height 78 + marge de sécurité)
const TAB_BAR_HEIGHT = scale(78) + scale(20);

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { articles, loading, error } = useSelector((state) => state.articles);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous");

  useEffect(() => {
    dispatch(getArticles());
  }, [dispatch]);

  // Familles dérivées dynamiquement des articles
  const categories = useMemo(() => {
    if (!articles?.length) return ["Tous"];
    return [
      "Tous",
      ...new Set(articles.map((item) => item.Category).filter(Boolean)),
    ];
  }, [articles]);

  // Filtrage catégorie + recherche
  const filteredArticles = useMemo(() => {
    let list = articles || [];

    if (selectedCategory !== "Tous") {
      list = list.filter((item) => item.Category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((item) =>
        (item.designation || "").toLowerCase().includes(q),
      );
    }

    return list;
  }, [articles, selectedCategory, searchQuery]);

  const handleArticlePress = useCallback((item) => {
    // Branche ici la navigation vers le détail article si elle existe déjà
    // navigation.navigate("ArticleDetails", { article: item });
  }, []);

  const handleAddToCart = useCallback((item) => {
    // Branche ici l'action panier existante (ex: dispatch(addToCart(item)))
  }, []);

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
          {category}
        </Text>

        {isActive && <View style={styles.activeUnderline} />}
      </TouchableOpacity>
    );
  };

  const renderArticleCard = ({ item }) => (
    <TouchableOpacity
      style={styles.articleCard}
      onPress={() => handleArticlePress(item)}
      activeOpacity={0.85}
    >
      <View style={styles.articleImageWrap}>
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={styles.articleImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.articleImagePlaceholder}>
            <MaterialCommunityIcons
              name={getCategoryIcon(item.Category)}
              size={scale(36)}
              color={Colors.textMuted}
            />
          </View>
        )}
      </View>

      <View style={styles.articleInfo}>
        <Text style={styles.articleName} numberOfLines={1}>
          {item.designation}
        </Text>
        <View style={styles.articleFooter}>
          <Text style={styles.articlePrice}>
            {parseFloat(item.prix || 0).toLocaleString("fr-DZ", {
              style: "currency",
              currency: "DZD",
            })}
          </Text>
          <TouchableOpacity
            style={styles.addToCartBtn}
            onPress={() => handleAddToCart(item)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="cart-outline"
              size={19}
              color="black"
              style={{ opacity: 1 }}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScreenBackground />
      <StatusBar barStyle="dark-content" />

      {/* Bloc FIXE : recherche + filtres ne défilent jamais */}
      <View style={styles.fixedHeader}>
        {/* Logo + profil : SCROLLE avec les articles, disparait au scroll */}
        <View style={styles.topBar}>
          <Image
            source={require("../../assets/images/Logo_no_back.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          {/* <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => navigation.navigate("Profile")}
            activeOpacity={0.8}
          >
            <Ionicons name="person" size={scale(18)} color={Colors.primary} />
          </TouchableOpacity> */}
        </View>
        <View style={styles.searchWrap}>
          <Ionicons
            name="search"
            size={scale(25)}
            color={"white"}
            style={{
              backgroundColor: "black",
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 30,
            }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher des produits..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons
                name="close-circle"
                size={scale(18)}
                color={Colors.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>

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
          <View>
            {error && (
              <Text style={styles.errorText}>
                Une erreur est survenue lors du chargement des articles.
              </Text>
            )}
          </View>
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
              <Text style={styles.emptyText}>Aucun article trouvé</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

export default HomeScreen;

const CARD_GAP = Spacing.md;

const styles = StyleSheet.create({
  safeArea: {
    // flex: 1,
    height: "93%",
  },

  // Header fixe (recherche + catégories)
  fixedHeader: {
    paddingHorizontal: 7,
    paddingTop: Spacing.md,
    backgroundColor: "transparent",
  },

  listContent: {
    paddingHorizontal: 2,
    paddingTop: Spacing.md,
    // height: "90%",
  },
  row: {
    justifyContent: "space-between",
  },

  // Top bar (logo + profil) — scrolle avec la liste
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  logo: {
    width: scale(40),
    height: scale(40),
  },
  profileBtn: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  // Search — SANS ombre (Shadows.card retiré)
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "black",
    paddingHorizontal: 10,
    height: scale(52),
    width: "100%",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    fontWeight: "400",
  },

  // Catégories — texte seul, gras quand actif
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
    width: 15, // 50% du conteneur
    height: 2,
    backgroundColor: "black",
    borderRadius: 2,
  },

  // Article card
  articleCard: {
    width: "49.5%",
    backgroundColor: "rgba(255, 255, 255, 0.52)",
    borderRadius: 3,
    marginBottom: CARD_GAP,
    overflow: "hidden",
    // borderWidth: 1,
    // borderColor: Colors.border,
  },
  articleImageWrap: {
    width: "100%",
    height: scale(170),
    backgroundColor: Colors.primaryLight,
  },
  articleImage: {
    width: "100%",
    height: "100%",
  },
  articleImagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  articleInfo: {
    padding: Spacing.md,
  },
  articleName: {
    ...Typography.body,
    fontSize: fs(13),
    marginBottom: Spacing.sm,
  },
  articleFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  articlePrice: {
    // ...Typography.h3,
    fontSize: fs(18),
    fontWeight: "bold",
    letterSpacing: 0.5,
    color: "rgba(18, 35, 46, 0.8)",
  },
  addToCartBtn: {
    width: scale(40),
    height: scale(26),
    borderRadius: scale(15),
    borderWidth: 1.5,
    borderColor: "black",
    alignItems: "center",
    justifyContent: "center",
  },

  // Empty / loading
  loader: {
    marginTop: Spacing.xxxl,
  },
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
    fontSize: fs(12),
    marginBottom: Spacing.md,
  },
});
