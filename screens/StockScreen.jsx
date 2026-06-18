import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  BackHandler,
} from "react-native";
import {
  MaterialCommunityIcons,
  MaterialIcons,
  Feather,
} from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSelector, useDispatch } from "react-redux";
import { getstocks } from "../redux/slices/stockSlice";
import { wp, hp, fs, fontWeight, scale } from "../utils/responsive";

const SearchBar = React.memo(({ value, onChangeText }) => {
  const [search, setSearch] = useState(value);
  const inputRef = useRef(null);

  const handleSubmit = useCallback(() => {
    onChangeText(search);
  }, [search, onChangeText]);

  return (
    <View style={styles.searchBar}>
      <Feather name="search" size={20} color="#999" style={styles.searchIcon} />
      <TextInput
        ref={inputRef}
        style={styles.searchInput}
        placeholder="Rechercher un article..."
        onChangeText={setSearch}
        value={search}
        placeholderTextColor="#999"
        autoCorrect={false}
        autoCapitalize="none"
        onSubmitEditing={handleSubmit}
        returnKeyType="search"
      />
      {search.length > 0 && (
        <TouchableOpacity
          onPress={() => {
            setSearch("");
            onChangeText("");
          }}
        >
          <Feather name="x" size={20} color="#999" />
        </TouchableOpacity>
      )}
    </View>
  );
});

const CategoryPill = React.memo(({ category, isSelected, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.categoryPill, isSelected && styles.selectedCategoryPill]}
      onPress={onPress}
    >
      <Text
        style={[styles.categoryText, isSelected && styles.selectedCategoryText]}
      >
        {category}
      </Text>
    </TouchableOpacity>
  );
});

const StatsCard = React.memo(({ value, label, backgroundColor, textColor }) => {
  return (
    <View style={[styles.statCard, { backgroundColor }]}>
      <Text style={[styles.statValue, { color: textColor }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
});

const SortButton = React.memo(({ title, isActive, sortOrder, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.sortButton, isActive && styles.activeSortButton]}
      onPress={onPress}
    >
      <Text
        style={[styles.sortButtonText, isActive && styles.activeSortButtonText]}
      >
        {title}
      </Text>
      {isActive && (
        <MaterialIcons
          name={sortOrder === "asc" ? "arrow-upward" : "arrow-downward"}
          size={14}
          color="#03A9F4"
        />
      )}
    </TouchableOpacity>
  );
});

const LotDetailRow = React.memo(({ lotInfo }) => {
  return (
    <View style={styles.batchRow}>
      <Text style={styles.batchLotNumber}>{lotInfo.lot}</Text>
      <Text style={styles.batchQuantity}>
        {lotInfo.quantity} {lotInfo.unit}
      </Text>
    </View>
  );
});

const ListItem = React.memo(({ item, onPress }) => {
  const [showBatchDetails, setShowBatchDetails] = useState(false);
  const isLowStock =
    parseFloat(item.AvailableStock) > 0 && parseFloat(item.AvailableStock) < 50;
  const isOutOfStock = parseFloat(item.AvailableStock) <= 0;

  // Check if the item has batch information
  const hasBatchInfo =
    item?.AvailableStockByLot && item?.AvailableStockByLot.length > 0;

  const toggleBatchDetails = (e) => {
    e.stopPropagation();
    setShowBatchDetails(!showBatchDetails);
  };

  return (
    <View style={styles.stockItem}>
      <View style={styles.stockIcon}>
        <MaterialCommunityIcons
          name="package-variant-closed"
          size={24}
          color="#03A9F4"
        />
      </View>
      <View style={styles.stockInfo}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text style={styles.stockMaterial} numberOfLines={1}>
            {item.Material || "N/A"} | {item.Category || "Non catégorisé"}
          </Text>
          <View style={styles.stockQuantity}>
            <Text style={styles.quantityValue}>
              {parseFloat(item.AvailableStock).toLocaleString("fr-DZ", {
                style: "decimal",
              })}
            </Text>
            <Text style={styles.quantityLabel}>{item.BaseUnitOfMeasure}</Text>
          </View>
        </View>
        <Text style={styles.stockName} numberOfLines={1}>
          {item.MaterialDescription}
        </Text>
        <View style={styles.stockRow}>
          <Text style={styles.stockPrice}>
            {parseFloat(item.SellPrice).toLocaleString("fr-DZ", {
              style: "currency",
              currency: "DZD",
            })}{" "}
            / {item.BaseUnitOfMeasure}
          </Text>
          <View
            style={[
              styles.stockStatusTag,
              isOutOfStock
                ? styles.outOfStockTag
                : isLowStock
                ? styles.lowStockTag
                : styles.inStockTag,
            ]}
          >
            <Text style={styles.stockStatusText}>
              {isOutOfStock
                ? "Épuisé"
                : isLowStock
                ? "Stock faible"
                : "En stock"}
            </Text>
          </View>
        </View>

        {/* Batch info button - only show if there are multiple lots */}
        {hasBatchInfo && (
          <TouchableOpacity
            onPress={toggleBatchDetails}
            style={styles.batchInfoButton}
          >
            <Text style={styles.batchInfoButtonText}>
              {showBatchDetails ? "Masquer" : "Voir"} détails de lot (
              {item?.AvailableStockByLot.length})
            </Text>
            <MaterialIcons
              name={showBatchDetails ? "expand-less" : "expand-more"}
              size={18}
              color="#006475"
            />
          </TouchableOpacity>
        )}

        {/* Batch details section */}
        {showBatchDetails && hasBatchInfo && (
          <View style={styles.batchDetails}>
            <View style={styles.batchHeader}>
              <Text style={styles.batchHeaderText}>N° de lot</Text>
              <Text style={styles.batchHeaderText}>Quantité</Text>
            </View>
            {item?.AvailableStockByLot.map((lotInfo, index) => (
              <LotDetailRow key={index} lotInfo={lotInfo} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
});

const GridItem = React.memo(({ item }) => {
  const [showBatchDetails, setShowBatchDetails] = useState(false);
  const isLowStock =
    parseFloat(item.AvailableStock) > 0 && parseFloat(item.AvailableStock) < 50;
  const isOutOfStock = parseFloat(item.AvailableStock) <= 0;

  // Check if the item has batch information
  const hasBatchInfo =
    item?.AvailableStockByLot && item?.AvailableStockByLot.length > 0;

  const toggleBatchDetails = (e) => {
    e.stopPropagation();
    setShowBatchDetails(!showBatchDetails);
  };

  return (
    <View style={styles.gridItem}>
      <View style={styles.gridIconContainer}>
        <MaterialCommunityIcons
          name="package-variant-closed"
          size={28}
          color="#03A9F4"
        />
      </View>
      <Text style={styles.gridItemName} numberOfLines={2}>
        {item.MaterialDescription}
      </Text>
      <Text style={styles.gridItemPrice}>
        {parseFloat(item.SellPrice).toLocaleString("fr-DZ", {
          style: "currency",
          currency: "DZD",
        })}
      </Text>
      <View
        style={[
          styles.gridStatusTag,
          isOutOfStock
            ? styles.outOfStockTag
            : isLowStock
            ? styles.lowStockTag
            : styles.inStockTag,
        ]}
      >
        <Text style={styles.stockStatusText}>
          {isOutOfStock
            ? "Épuisé"
            : isLowStock
            ? "Stock faible"
            : `${item.AvailableStock} ${item.BaseUnitOfMeasure}`}
        </Text>
      </View>

      {/* Batch info button - only show if there are multiple lots */}
      {hasBatchInfo && (
        <TouchableOpacity
          onPress={toggleBatchDetails}
          style={styles.gridBatchInfoButton}
        >
          <Text style={styles.batchInfoButtonText}>
            {showBatchDetails ? "Masquer" : "Voir"} détails (
            {item?.AvailableStockByLot.length})
          </Text>
          <MaterialIcons
            name={showBatchDetails ? "expand-less" : "expand-more"}
            size={16}
            color="#03A9F4"
          />
        </TouchableOpacity>
      )}

      {/* Batch details section */}
      {showBatchDetails && hasBatchInfo && (
        <View style={styles.gridBatchDetails}>
          {item?.AvailableStockByLot.map((lotInfo, index) => (
            <View key={index} style={styles.gridBatchRow}>
              <Text style={styles.gridBatchLotLabel}>
                Lot: <Text style={styles.gridBatchLotValue}>{lotInfo.lot}</Text>
              </Text>
              <Text style={styles.gridBatchQuantityLabel}>
                <Text style={styles.gridBatchQuantityValue}>
                  {lotInfo.quantity} {lotInfo.unit}
                </Text>
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
});

const EmptyState = React.memo(
  ({ loading, searchQuery, selectedCategory, onClearFilters }) => {
    if (loading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#03A9F4" />
          <Text style={styles.emptyStateText}>Chargement des stocks...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <MaterialIcons name="inventory" size={64} color="#CCCCCC" />
        <Text style={styles.emptyStateText}>
          {searchQuery || selectedCategory !== "Tous"
            ? "Aucun article ne correspond à votre recherche"
            : "Aucun article en stock"}
        </Text>
        {/* <TouchableOpacity
          style={styles.emptyStateButton}
          onPress={onClearFilters}
        >
          <Text style={styles.emptyStateButtonText}>
            {searchQuery || selectedCategory !== "Tous"
              ? "Effacer les filtres"
              : "Ajouter un article"}
          </Text>
        </TouchableOpacity> */}
      </View>
    );
  }
);

const StockTypeButtons = React.memo(({ selectedType, onTypeChange }) => {
  return (
    <View style={styles.stockTypeContainer}>
      <TouchableOpacity
        style={[
          styles.stockTypeButton,
          selectedType === "van" && styles.activeStockTypeButton,
        ]}
        onPress={() => onTypeChange("van")}
      >
        <MaterialCommunityIcons
          name="truck-delivery"
          size={20}
          color={selectedType === "van" ? "#03A9F4" : "#666666"}
        />
        <Text
          style={[
            styles.stockTypeButtonText,
            selectedType === "van" && styles.activeStockTypeButtonText,
          ]}
        >
          Stock Van
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.stockTypeButton,
          selectedType === "quota" && styles.activeStockTypeButton,
        ]}
        onPress={() => onTypeChange("quota")}
      >
        <MaterialCommunityIcons
          name="chart-box"
          size={20}
          color={selectedType === "quota" ? "#03A9F4" : "#666666"}
        />
        <Text
          style={[
            styles.stockTypeButtonText,
            selectedType === "quota" && styles.activeStockTypeButtonText,
          ]}
        >
          Stock Quota
        </Text>
      </TouchableOpacity>
    </View>
  );
});

const StockScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [currentView, setCurrentView] = useState("list"); // 'list' ou 'grid'
  const [sortBy, setSortBy] = useState("name"); // 'name', 'quantity', 'price'
  const [sortOrder, setSortOrder] = useState("asc"); // 'asc' ou 'desc'
  const [filterByLot, setFilterByLot] = useState(false);
  const [selectedLot, setSelectedLot] = useState("");
  const [stockType, setStockType] = useState("van"); // 'van' ou 'quota'

  const { stocks } = useSelector((state) => state.stock);
  const userData = useSelector((state) => state.auth.user);

  const handleStockTypeChange = useCallback((type) => {
    setStockType(type);
  }, []);

  useEffect(() => {
    const handleBackPress = () => {
      navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress
    );
    return () => backHandler.remove();
  }, [navigation]);

  // Transform the stock data to include AvailableStockByLot if not already included
  // Correction de la transformation des stocks
  const processedStocks = useMemo(() => {
    if (!stocks) return [];

    // Group items by Material and consolidate lots
    const materialMap = {};

    stocks.forEach((item) => {
      const key = item.Material;

      if (!materialMap[key]) {
        // First occurrence of this material - initialize with a properly structured AvailableStockByLot
        materialMap[key] = {
          ...item,
          AvailableStockByLot: item.lot
            ? [
                {
                  lot: item.lot,
                  quantity: item.AvailableStockByLot,
                  unit: item.BaseUnitOfMeasure,
                },
              ]
            : [],
        };
      } else {
        // This material already exists, update it
        // Add this lot to the AvailableStockByLot array if it has a lot number
        if (item.lot) {
          materialMap[key].AvailableStockByLot.push({
            lot: item.lot,
            quantity: item.AvailableStockByLot,
            unit: item.BaseUnitOfMeasure,
          });

          // Update the total available stock
          // materialMap[key].AvailableStock = (
          //   parseFloat(materialMap[key].AvailableStock) +
          //   parseFloat(item.AvailableStock)
          // ).toString();
        }
      }
    });

    return Object.values(materialMap);
  }, [stocks]);

  // Extract unique categories from the processed stock
  const categories = useMemo(() => {
    return processedStocks
      ? [
          "Tous",
          ...new Set(
            processedStocks.map((item) => item.Category || "Non catégorisé")
          ),
        ]
      : ["Tous"];
  }, [processedStocks]);

  // Extract all unique lot numbers from across all materials
  const lotNumbers = useMemo(() => {
    if (!processedStocks) return ["Tous"];

    const lots = new Set(["Tous"]);

    processedStocks.forEach((item) => {
      if (item?.AvailableStockByLot && item?.AvailableStockByLot.length > 0) {
        item?.AvailableStockByLot?.forEach((lotInfo) => {
          if (lotInfo.lot) {
            lots.add(lotInfo.lot);
          }
        });
      }
    });

    return Array.from(lots);
  }, [processedStocks]);

  // Load stocks on component mount
  useEffect(() => {
    loadStocks();
  }, []);

  const loadStocks = async () => {
    try {
      setLoading(true);
      const magasinParam =
        stockType === "van" ? userData?.magasin : userData?.magasin_quota;
      const responseStock = await dispatch(
        getstocks({ magasin: magasinParam })
      );
      console.log("response stock", responseStock, magasinParam);
    } catch (error) {
      console.error("Erreur lors du chargement des stocks:", error);

      Alert.alert(
        "Erreur",
        "Impossible de charger les données de stock. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      setLoading(true);
      loadStocks();
    }
  }, [stockType]);

  // Filter and sort stocks
  const filteredStocks = useMemo(() => {
    if (!processedStocks) return [];

    return processedStocks
      .filter((item) => {
        // Filter by search
        const matchesSearch =
          searchQuery === "" ||
          item.MaterialDescription?.toLowerCase().includes(
            searchQuery.toLowerCase()
          ) ||
          item.Material?.toLowerCase().includes(searchQuery.toLowerCase());

        // Filter by category
        const matchesCategory =
          selectedCategory === "Tous" || item.Category === selectedCategory;

        // Filter by lot - check if any of the item's lots match the selected lot
        let matchesLot = !filterByLot || selectedLot === "Tous";

        if (
          filterByLot &&
          selectedLot !== "Tous" &&
          item?.AvailableStockByLot
        ) {
          matchesLot = item?.AvailableStockByLot.some(
            (lotInfo) => lotInfo.lot === selectedLot
          );
        }

        return matchesSearch && matchesCategory && matchesLot;
      })
      .sort((a, b) => {
        // Sorting logic
        if (sortBy === "name") {
          return sortOrder === "asc"
            ? a.Material?.localeCompare(b.Material)
            : b.Material?.localeCompare(a.Material);
        } else if (sortBy === "quantity") {
          return sortOrder === "asc"
            ? parseFloat(a.AvailableStock) - parseFloat(b.AvailableStock)
            : parseFloat(b.AvailableStock) - parseFloat(a.AvailableStock);
        } else if (sortBy === "price") {
          return sortOrder === "asc"
            ? parseFloat(a.SellPrice) - parseFloat(b.SellPrice)
            : parseFloat(b.SellPrice) - parseFloat(a.SellPrice);
        }
        return 0;
      });
  }, [
    processedStocks,
    searchQuery,
    selectedCategory,
    sortBy,
    sortOrder,
    filterByLot,
    selectedLot,
  ]);

  const toggleBatchFilter = useCallback(() => {
    setFilterByLot(!filterByLot);
    if (!filterByLot) {
      setSelectedLot("Tous");
    } else {
      setSelectedLot("");
    }
  }, [filterByLot]);

  const selectLot = useCallback((lot) => {
    setSelectedLot(lot);
  }, []);

  const renderLotPills = useCallback(() => {
    if (!filterByLot) return null;

    return (
      <>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.lotContainer}
        >
          {lotNumbers.map((lot) => (
            <CategoryPill
              key={lot}
              category={lot}
              isSelected={selectedLot === lot}
              onPress={() => selectLot(lot)}
            />
          ))}
        </ScrollView>
      </>
    );
  }, [lotNumbers, selectedLot, filterByLot, selectLot]);

  // Calculate stock statistics
  const stockStats = useMemo(() => {
    return {
      total: filteredStocks.length,
      lowStock: filteredStocks.filter(
        (item) =>
          parseFloat(item.AvailableStock) > 0 &&
          parseFloat(item.AvailableStock) < 50
      ).length,
      outOfStock: filteredStocks.filter(
        (item) => parseFloat(item.AvailableStock) <= 0
      ).length,
    };
  }, [filteredStocks]);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await dispatch(getstocks());
    } catch (error) {
      console.error("Erreur lors du rafraîchissement:", error);
      Alert.alert(
        "Erreur",
        "Impossible de rafraîchir les données. Veuillez réessayer."
      );
    }
    setRefreshing(false);
  }, [dispatch]);

  // Navigate to item detail
  const handleItemPress = useCallback(
    (item) => {
      navigation.navigate("StockDetail", { item });
    },
    [navigation]
  );

  // Toggle sort order
  const toggleSortOrder = useCallback(
    (field) => {
      if (sortBy === field) {
        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
      } else {
        setSortBy(field);
        setSortOrder("asc");
      }
    },
    [sortBy, sortOrder]
  );

  // Toggle between list and grid view
  const toggleView = useCallback(() => {
    setCurrentView(currentView === "list" ? "grid" : "list");
  }, [currentView]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory("Tous");
    setFilterByLot(false);
    setSelectedLot("Tous");
  }, []);

  // Update search query
  const updateSearch = useCallback((text) => {
    setSearchQuery(text);
  }, []);

  // Select a category
  const selectCategory = useCallback((category) => {
    setSelectedCategory(category);
  }, []);

  // Render category pills
  const renderCategoryPills = useCallback(() => {
    if (!filterByLot) return null;
    return (
      <>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryContainer}
        >
          {categories.map((category) => (
            <CategoryPill
              key={category}
              category={category}
              isSelected={selectedCategory === category}
              onPress={() => selectCategory(category)}
            />
          ))}
        </ScrollView>
      </>
    );
  }, [categories, selectedCategory, filterByLot, selectCategory]);

  // FlatList header
  const ListHeader = useCallback(() => {
    return (
      <>
        <View style={styles.searchContainer}>
          <SearchBar value={searchQuery} onChangeText={updateSearch} />
          <TouchableOpacity
            style={styles.viewToggle}
            // onPress={toggleView}
            onPress={toggleBatchFilter}
          >
            {/* <MaterialIcons
              name={currentView === "list" ? "grid-view" : "view-list"}
              size={22}
              color="#03A9F4"
            /> */}
            <MaterialIcons
              name="filter-list"
              size={24}
              color={filterByLot ? "#03A9F4" : "#666666"}
            />
          </TouchableOpacity>
        </View>
        {/* Nouveaux boutons Stock Type */}
        <StockTypeButtons
          selectedType={stockType}
          onTypeChange={handleStockTypeChange}
        />
        {filterByLot && (
          <View style={styles.content}>
            {/* Section Catégories */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.iconPlaceholder}>
                  <Text style={styles.iconText}>📂</Text>
                </View>
                <Text style={styles.sectionTitle}>Par Catégorie</Text>
              </View>
              {renderCategoryPills()}
            </View>

            {/* Section Lots */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.iconPlaceholder}>
                  <Text style={styles.iconText}>📦</Text>
                </View>
                <Text style={styles.sectionTitle}>Par Lot</Text>
              </View>
              {renderLotPills()}
            </View>
          </View>
        )}

        <View style={styles.statsContainer}>
          <StatsCard
            value={stockStats.total}
            label="Total"
            backgroundColor="#E1F5FE"
            textColor="#03A9F4"
          />
          <StatsCard
            value={stockStats.lowStock}
            label="Stock faible"
            backgroundColor="#FFF9C4"
            textColor="#FFC107"
          />
          <StatsCard
            value={stockStats.outOfStock}
            label="Épuisé"
            backgroundColor="#FFEBEE"
            textColor="#F44336"
          />
        </View>

        <View style={styles.sortRow}>
          <Text style={styles.resultsText}>
            {filteredStocks.length} article
            {filteredStocks.length !== 1 ? "s" : ""}
          </Text>
          <View style={styles.sortButtons}>
            <Text style={styles.sortByText}>Trier par:</Text>
            <SortButton
              title="Nom"
              isActive={sortBy === "name"}
              sortOrder={sortOrder}
              onPress={() => toggleSortOrder("name")}
            />
            <SortButton
              title="Quantité"
              isActive={sortBy === "quantity"}
              sortOrder={sortOrder}
              onPress={() => toggleSortOrder("quantity")}
            />
            <SortButton
              title="Prix"
              isActive={sortBy === "price"}
              sortOrder={sortOrder}
              onPress={() => toggleSortOrder("price")}
            />
          </View>
        </View>
      </>
    );
  }, [
    searchQuery,
    updateSearch,
    currentView,
    toggleView,
    renderCategoryPills,
    stockStats,
    filteredStocks.length,
    sortBy,
    sortOrder,
    toggleSortOrder,
    filterByLot,
    toggleBatchFilter,
    renderLotPills,
  ]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#03A9F4" barStyle="light-content" />

      <FlatList
        data={filteredStocks}
        keyExtractor={(item) =>
          item.Material || item.id || item.MaterialDescription
        }
        renderItem={({ item }) =>
          currentView === "list" ? (
            <ListItem item={item} onPress={handleItemPress} />
          ) : (
            <GridItem item={item} onPress={handleItemPress} />
          )
        }
        numColumns={currentView === "grid" ? 2 : 1}
        key={currentView} // Force re-render when view changes
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <EmptyState
            loading={loading}
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            onClearFilters={clearFilters}
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#03A9F4", "#FFC107", "#4CAF50"]}
          />
        }
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
      />
    </SafeAreaView>
  );
};

const additionalStyles = StyleSheet.create({
  batchInfoButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: hp(0.4),
    padding: scale(2),
  },
  batchInfoButtonText: {
    fontSize: fs(12),
    color: "#006475",
    fontWeight: fontWeight.bold,
    letterSpacing: 0.2,
    marginRight: wp(1),
  },
  batchDetails: {
    backgroundColor: "#F5F7FA",
    borderWidth: scale(0.1),
    borderRadius: scale(5),
    padding: scale(8),
    marginTop: hp(0.7),
  },
  batchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: hp(0.4),
  },
  batchHeaderText: {
    fontSize: fs(12),
    color: "#000",
    fontWeight: fontWeight.bold,
  },
  batchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: hp(0.2),
    borderTopWidth: scale(1),
    borderTopColor: "#EEEEEE",
  },
  batchLotNumber: {
    fontSize: fs(12),
    color: "#333333",
  },
  batchQuantity: {
    fontSize: fs(12),
    color: "#333333",
    fontWeight: fontWeight.bold,
  },
  gridBatchInfoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: hp(0.9),
    padding: scale(4),
  },
  gridBatchDetails: {
    backgroundColor: "#F5F7FA",
    borderRadius: scale(4),
    padding: scale(8),
    marginTop: hp(0.9),
    width: "100%",
  },
  gridBatchLotLabel: {
    fontSize: fs(12),
    color: "#666666",
    marginBottom: hp(0.4),
  },
  gridBatchLotValue: {
    color: "#333333",
    fontWeight: fontWeight.bold,
  },
  gridBatchQuantityLabel: {
    fontSize: fs(12),
    color: "#666666",
  },
  gridBatchQuantityValue: {
    color: "#333333",
    fontWeight: fontWeight.bold,
  },
  filterOptions: {
    flexDirection: "row",
    paddingHorizontal: wp(3.9),
    paddingVertical: hp(0.9),
    backgroundColor: "#FFFFFF",
    borderTopWidth: scale(1),
    borderTopColor: "#EEEEEE",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp(2.9),
    paddingVertical: hp(0.7),
    borderRadius: scale(16),
    backgroundColor: "#F5F5F5",
  },
  activeFilterButton: {
    backgroundColor: "#E1F5FE",
  },
  filterButtonText: {
    fontSize: fs(12),
    color: "#666666",
    marginLeft: wp(1),
  },
  activeFilterButtonText: {
    color: "#03A9F4",
    fontWeight: fontWeight.bold,
  },
  lotContainer: {
    paddingHorizontal: wp(3.9),
    paddingVertical: hp(0.9),
    backgroundColor: "#FFFFFF",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  searchContainer: {
    marginTop: hp(1.1),
    paddingHorizontal: wp(3.9),
    marginBottom: hp(1.1),
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: scale(20),
    paddingHorizontal: wp(2.9),
    paddingVertical: hp(0.7),
    elevation: 0.5,
  },
  searchInput: {
    flex: 1,
    marginLeft: wp(1.9),
    fontSize: fs(16),
  },
  transfertsList: {
    paddingHorizontal: wp(3.9),
    paddingTop: hp(1.7),
    paddingBottom: hp(2.6),
  },

  // Styles des cartes modernes
  modernCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(16),
    padding: scale(16),
    marginVertical: hp(0.3),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 0.5,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: hp(1.3),
  },

  headerLeft: {
    flex: 1,
  },

  dateText: {
    fontSize: fs(14),
    fontWeight: fontWeight.semiBold,
    color: "#1F2937",
    marginBottom: hp(0.2),
  },

  cmdNumber: {
    fontSize: fs(12),
    color: "#6B7280",
    fontWeight: fontWeight.medium,
  },

  vgbelText: {
    fontSize: fs(11),
    color: "#6B7280",
    fontWeight: fontWeight.regular,
    marginTop: hp(0.1),
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp(1.9),
    paddingVertical: hp(0.4),
    borderRadius: scale(12),
    marginLeft: wp(1.9),
  },

  statusDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    marginRight: wp(1),
  },

  statusBadgeText: {
    fontSize: fs(11),
    fontWeight: fontWeight.semiBold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  divider: {
    height: scale(1),
    backgroundColor: "#F1F5F9",
    marginVertical: hp(0.4),
  },

  warehouseInfoCompact: {
    marginBottom: hp(0.9),
  },

  warehouseCompactText: {
    fontSize: fs(13),
    color: "#6B7280",
    fontWeight: fontWeight.medium,
  },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: hp(0.9),
  },

  footerLeft: {
    flex: 1,
    flexDirection: "row",
    gap: wp(2.4),
  },

  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp(0.4),
  },

  statText: {
    fontSize: fs(12),
    color: "#6B7280",
    marginLeft: wp(1),
    fontWeight: fontWeight.medium,
  },

  chevronContainer: {
    padding: scale(4),
  },

  // Styles pour la modal
  modal: {
    backgroundColor: "white",
    borderTopLeftRadius: scale(10),
    borderTopRightRadius: scale(10),
    maxHeight: "90%",
  },

  modalContent: {
    flex: 1,
  },

  transfertDetails: {
    padding: scale(16),
    backgroundColor: "#FAFAFA",
    borderRadius: scale(8),
    marginTop: hp(1.3),
  },

  detailsTitle: {
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
    marginBottom: hp(1.3),
    color: "#424242",
  },

  transfertClient: {
    fontSize: fs(16),
    fontWeight: fontWeight.semiBold,
    color: "#212529",
    marginBottom: hp(0.9),
  },

  transfertDate: {
    fontSize: fs(14),
    color: "#6c757d",
  },

  transfertReference: {
    fontSize: fs(13),
    color: "#6B7280",
    fontWeight: fontWeight.medium,
    marginTop: hp(0.4),
  },

  warehouseInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: hp(1.7),
    paddingTop: hp(1.7),
    borderTopWidth: scale(1),
    borderTopColor: "#EEEEEE",
  },

  warehouseBlock: {
    flex: 1,
    alignItems: "center",
  },

  warehouseLabel: {
    fontSize: fs(12),
    color: "#757575",
    marginBottom: hp(0.4),
  },

  warehouseValue: {
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
    color: "#424242",
  },

  arrowIcon: {
    marginHorizontal: wp(1.9),
  },

  // Styles pour le tableau
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#E6E7E8",
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(2.9),
    borderTopLeftRadius: scale(12),
    borderTopRightRadius: scale(12),
    borderColor: "#eee",
    borderWidth: scale(1),
  },

  tableHeaderText: {
    fontSize: fs(12),
    fontWeight: fontWeight.bold,
    color: "#334155",
    textAlign: "start",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  tableHeaderRightText: {
    fontSize: fs(12),
    fontWeight: fontWeight.bold,
    color: "#334155",
    textAlign: "right",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  scrollableArticleContainer: {
    flex: 1,
    maxHeight: hp(32.8),
    borderWidth: scale(1),
    borderTopWidth: 0,
    borderBottomRightRadius: scale(12),
    borderBottomLeftRadius: scale(12),
    borderColor: "#eee",
  },

  articleContainer: {
    borderWidth: scale(1),
    borderTopWidth: 0,
    borderBottomRightRadius: scale(8),
    borderBottomLeftRadius: scale(8),
    borderColor: "#eee",
  },

  tableRow: {
    flexDirection: "row",
    paddingVertical: hp(0.9),
    paddingHorizontal: wp(2.9),
    borderBottomWidth: scale(1),
    borderBottomColor: "#F1F5F9",
    backgroundColor: "#FFFFFF",
    alignItems: "flex-start",
  },

  evenRow: {
    backgroundColor: "#F8FAFC",
  },

  codeColumn: {
    flex: 3,
    paddingRight: wp(1),
  },

  qteColumn: {
    flex: 2,
    alignItems: "flex-end",
    paddingHorizontal: wp(0.5),
  },

  designationCellText: {
    fontSize: fs(11),
    color: "#374151",
    lineHeight: fs(16),
    fontWeight: fontWeight.medium,
  },

  chargText: {
    fontSize: fs(10),
    color: "#6B7280",
    fontStyle: "italic",
    marginTop: hp(0.2),
    fontWeight: fontWeight.regular,
  },

  tableCellTextRight: {
    fontSize: fs(11),
    color: "#374151",
    textAlign: "right",
    fontWeight: fontWeight.medium,
  },

  positiveRemaining: {
    color: "#DC2626",
    fontWeight: fontWeight.semiBold,
  },

  negativeRemaining: {
    color: "#059669",
    fontWeight: fontWeight.semiBold,
  },

  actionsContainer: {
    paddingTop: hp(1.7),
    paddingHorizontal: wp(1.9),
  },

  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4.9),
    borderRadius: scale(10),
    backgroundColor: "#E0F2FE",
    borderWidth: scale(1),
    borderColor: "#0891B2",
  },

  disabledButton: {
    backgroundColor: "#F3F4F6",
    borderColor: "#D1D5DB",
  },

  actionButtonText: {
    color: "#0891B2",
    fontWeight: fontWeight.bold,
    marginLeft: wp(1.9),
    fontSize: fs(14),
    letterSpacing: 0.5,
  },

  // Styles pour les états de chargement et erreur
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },

  loaderText: {
    marginTop: hp(1.7),
    fontSize: fs(16),
    color: "#64748B",
    fontWeight: fontWeight.medium,
  },

  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: scale(24),
    backgroundColor: "#F8FAFC",
  },

  errorText: {
    marginTop: hp(1.7),
    fontSize: fs(16),
    color: "#DC2626",
    textAlign: "center",
    marginBottom: hp(2.6),
    fontWeight: fontWeight.medium,
  },

  retryButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: wp(5.8),
    paddingVertical: hp(1.3),
    borderRadius: scale(8),
    elevation: 2,
  },

  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: fontWeight.semiBold,
    fontSize: fs(14),
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: scale(24),
    backgroundColor: "#F8FAFC",
  },

  emptyText: {
    marginTop: hp(2.6),
    fontSize: fs(16),
    color: "#64748B",
    textAlign: "center",
    fontWeight: fontWeight.medium,
    lineHeight: fs(24),
  },

  // Nouveaux styles ajoutés
  content: {
    backgroundColor: "white",
    paddingHorizontal: wp(2.4),
  },
  section: {
    marginTop: hp(0.2),
    marginBottom: hp(0.9),
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp(0.2),
  },
  iconPlaceholder: {
    width: scale(25),
    height: scale(25),
    borderRadius: scale(12),
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: wp(2.9),
  },
  iconText: {
    fontSize: fs(13),
  },
  sectionTitle: {
    fontSize: fs(13),
    fontWeight: fontWeight.semiBold,
    color: "#334155",
  },
  header: {
    backgroundColor: "#03A9F4",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp(3.9),
    paddingTop: hp(1.3),
    paddingBottom: hp(1.7),
  },
  backButton: {
    padding: scale(8),
  },
  headerTitle: {
    fontSize: fs(20),
    fontWeight: fontWeight.bold,
    color: "#FFFFFF",
  },
  optionsButton: {
    padding: scale(8),
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: wp(3.9),
    paddingVertical: hp(1.3),
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    borderBottomWidth: scale(1),
    borderBottomColor: "#EEEEEE",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: scale(8),
    paddingHorizontal: wp(2.9),
    height: hp(4.4),
  },
  searchIcon: {
    marginRight: wp(1.9),
  },
  searchInput: {
    flex: 1,
    fontSize: fs(16),
    color: "#333333",
    height: hp(4.4),
  },
  viewToggle: {
    marginLeft: wp(2.9),
    padding: scale(8),
    borderRadius: scale(8),
    backgroundColor: "#F5F5F5",
  },
  categoryContainer: {
    paddingHorizontal: wp(3.9),
    paddingVertical: hp(1.3),
    backgroundColor: "#FFFFFF",
  },
  categoryPill: {
    paddingHorizontal: wp(3.9),
    paddingVertical: hp(0.9),
    backgroundColor: "#F5F5F5",
    borderRadius: scale(20),
    marginRight: wp(1.9),
  },
  selectedCategoryPill: {
    backgroundColor: "#E1F5FE",
  },
  categoryText: {
    fontSize: fs(14),
    color: "#666666",
  },
  selectedCategoryText: {
    color: "#03A9F4",
    fontWeight: fontWeight.bold,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: scale(16),
    backgroundColor: "#FFFFFF",
    marginVertical: hp(0.9),
  },
  statCard: {
    flex: 1,
    backgroundColor: "#E1F5FE",
    borderRadius: scale(8),
    padding: scale(12),
    alignItems: "center",
    marginHorizontal: wp(1),
  },
  statValue: {
    fontSize: fs(20),
    fontWeight: fontWeight.bold,
    color: "#03A9F4",
  },
  statLabel: {
    fontSize: fs(12),
    color: "#666666",
    marginTop: hp(0.4),
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp(3.9),
    paddingVertical: hp(1.3),
    backgroundColor: "#FFFFFF",
    borderTopWidth: scale(1),
    borderTopColor: "#EEEEEE",
  },
  resultsText: {
    fontSize: fs(14),
    color: "#666666",
    borderWidth: scale(1),
    borderColor: "rgba(131, 155, 176, 0.31)",
    borderRadius: scale(10),
    paddingHorizontal: wp(1.9),
    paddingVertical: hp(0.4),
  },
  sortButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  sortByText: {
    fontSize: fs(14),
    color: "#666666",
    marginRight: wp(1.9),
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp(1.9),
    paddingVertical: hp(0.4),
    borderRadius: scale(4),
    marginLeft: wp(1),
  },
  activeSortButton: {
    backgroundColor: "#E1F5FE",
  },
  sortButtonText: {
    fontSize: fs(14),
    color: "#666666",
    marginRight: wp(1),
  },
  activeSortButtonText: {
    color: "#03A9F4",
    fontWeight: fontWeight.bold,
  },
  listContainer: {
    paddingBottom: hp(8.7),
  },
  stockItem: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: scale(16),
    marginTop: hp(0.1),
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  stockIcon: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    backgroundColor: "#E1F5FE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: wp(3.9),
  },
  stockInfo: {
    flex: 1,
  },
  stockName: {
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
    color: "#333333",
    marginBottom: hp(0.4),
  },
  stockMaterial: {
    fontSize: fs(12),
    color: "#999999",
    marginBottom: hp(0.7),
  },
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stockPrice: {
    fontSize: fs(14),
    fontWeight: fontWeight.bold,
    color: "#03A9F4",
  },
  stockStatusTag: {
    paddingHorizontal: wp(1.9),
    paddingVertical: hp(0.4),
    borderRadius: scale(4),
  },
  inStockTag: {
    backgroundColor: "#E8F5E9",
  },
  lowStockTag: {
    backgroundColor: "#FFF9C4",
  },
  outOfStockTag: {
    backgroundColor: "#FFEBEE",
  },
  stockStatusText: {
    fontSize: fs(12),
    fontWeight: fontWeight.bold,
  },
  stockQuantity: {
    alignItems: "center",
    flexDirection: "row",
  },
  quantityValue: {
    fontSize: fs(18),
    fontWeight: fontWeight.bold,
    color: "#333333",
    marginRight: wp(1.2),
  },
  quantityLabel: {
    fontSize: fs(12),
    color: "#999999",
  },
  gridItem: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    margin: scale(8),
    borderRadius: scale(8),
    padding: scale(16),
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  gridIconContainer: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    backgroundColor: "#E1F5FE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: hp(1.3),
  },
  gridItemName: {
    fontSize: fs(14),
    fontWeight: fontWeight.bold,
    color: "#333333",
    textAlign: "center",
    marginBottom: hp(0.9),
    height: hp(4.4),
  },
  gridItemPrice: {
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
    color: "#03A9F4",
    marginBottom: hp(0.9),
  },
  gridStatusTag: {
    paddingHorizontal: wp(1.9),
    paddingVertical: hp(0.4),
    borderRadius: scale(4),
    width: "100%",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: scale(32),
    marginTop: hp(3.5),
  },
  emptyStateText: {
    fontSize: fs(16),
    color: "#666666",
    textAlign: "center",
    marginTop: hp(1.7),
    marginBottom: hp(2.6),
  },
  emptyStateButton: {
    backgroundColor: "#03A9F4",
    paddingHorizontal: wp(4.9),
    paddingVertical: hp(1.3),
    borderRadius: scale(8),
  },
  emptyStateButtonText: {
    color: "#FFFFFF",
    fontSize: fs(16),
    fontWeight: fontWeight.bold,
  },
  floatingButton: {
    position: "absolute",
    bottom: hp(2.6),
    right: wp(5.8),
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    backgroundColor: "#03A9F4",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },

  // Ajouter dans StyleSheet.create au bas du fichier
  stockTypeContainer: {
    flexDirection: "row",
    paddingHorizontal: wp(3.9),
    paddingVertical: hp(1.3),
    backgroundColor: "#FFFFFF",
    gap: wp(2.9),
    borderBottomWidth: scale(1),
    borderBottomColor: "#EEEEEE",
  },
  stockTypeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: hp(1.1),
    paddingHorizontal: wp(2.9),
    borderRadius: scale(8),
    backgroundColor: "#F5F5F5",
    borderWidth: scale(1),
    borderColor: "#E0E0E0",
  },
  activeStockTypeButton: {
    backgroundColor: "#E1F5FE",
    borderColor: "#03A9F4",
  },
  stockTypeButtonText: {
    fontSize: fs(14),
    color: "#666666",
    marginLeft: wp(1.9),
    fontWeight: fontWeight.medium,
  },
  activeStockTypeButtonText: {
    color: "#03A9F4",
    fontWeight: fontWeight.bold,
  },
  batchInfoButton: additionalStyles.batchInfoButton,
  batchInfoButtonText: additionalStyles.batchInfoButtonText,
  batchDetails: additionalStyles.batchDetails,
  batchHeader: additionalStyles.batchHeader,
  batchHeaderText: additionalStyles.batchHeaderText,
  batchRow: additionalStyles.batchRow,
  batchLotNumber: additionalStyles.batchLotNumber,
  batchQuantity: additionalStyles.batchQuantity,
  gridBatchInfoButton: additionalStyles.gridBatchInfoButton,
  gridBatchDetails: additionalStyles.gridBatchDetails,
  gridBatchLotLabel: additionalStyles.gridBatchLotLabel,
  gridBatchLotValue: additionalStyles.gridBatchLotValue,
  gridBatchQuantityLabel: additionalStyles.gridBatchQuantityLabel,
  gridBatchQuantityValue: additionalStyles.gridBatchQuantityValue,
  filterOptions: additionalStyles.filterOptions,
  filterButton: additionalStyles.filterButton,
  activeFilterButton: additionalStyles.activeFilterButton,
  filterButtonText: additionalStyles.filterButtonText,
  activeFilterButtonText: additionalStyles.activeFilterButtonText,
  lotContainer: additionalStyles.lotContainer,
});

export default StockScreen;
