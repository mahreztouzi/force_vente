import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Animated,
  ScrollView,
  FlatList,
} from "react-native";
import { Modalize } from "react-native-modalize";
import { MaterialIcons, AntDesign } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

const ArticlesModalize = ({
  reference,
  searchQuery,
  setSearchQuery,
  filteredArticles,
  handleArticleSelect,
  scrollY,
}) => {
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  // Extraire les catégories uniques
  const categories = useMemo(() => {
    return ["Tous", ...new Set(filteredArticles.map((item) => item.Category))];
  }, [filteredArticles]);

  // Filtrer par catégorie
  const articlesToDisplay = useMemo(() => {
    if (selectedCategory === "Tous") {
      return filteredArticles;
    }
    return filteredArticles.filter(
      (item) => item.Category === selectedCategory
    );
  }, [filteredArticles, selectedCategory]);
  return (
    <Modalize
      ref={reference}
      modalHeight={height * 0.9}
      disableScrollIfPossible={false}
      closeOnOverlayTap={true}
      threshold={100}
      panGestureComponentEnabled={false}
      closeSnapPointStraightEnabled={false}
      velocityThreshold={0.8}
      panGestureEnabled={false}
      modalStyle={styles.modalContainer}
      keyboardAvoidingBehavior="padding"
      avoidKeyboardLikeIOS={true}
      withHandle={false}
      HeaderComponent={
        <View style={styles.modalHeader}>
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Text style={styles.modalTitle}>Sélectionnez un article</Text>
            <TouchableOpacity onPress={() => reference.current?.close()}>
              <AntDesign name="close" size={26} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Catégories sur plusieurs lignes */}
          <View style={styles.categoriesContainer}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  selectedCategory === category && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category && styles.categoryTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={24} color="#757575" />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un article..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== "" && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <MaterialIcons name="clear" size={20} color="#757575" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      }
      flatListProps={{
        data: articlesToDisplay,
        renderItem: ({ item }) => (
          <TouchableOpacity
            style={styles.articleItem}
            onPress={() => handleArticleSelect(item)}
          >
            <View style={styles.articleLeft}>
              <Text style={styles.articleId}>{item.id}</Text>
              <Text style={styles.articleName}>{item.designation}</Text>
            </View>
            <View style={styles.articleRight}>
              <Text style={styles.articlePrice}>
                {parseFloat(item.prix).toLocaleString("fr-DZ", {
                  style: "currency",
                  currency: "DZD",
                })}
              </Text>
              {/* <Text style={styles.articleStock}>
                Stock: {item.stock} {item.unite}
              </Text> */}
            </View>
          </TouchableOpacity>
        ),
        keyExtractor: (item) => item.id,
        contentContainerStyle: styles.modalList,
        showsVerticalScrollIndicator: true,
        keyboardShouldPersistTaps: "always",
        ListEmptyComponent: (
          <View style={styles.emptySearch}>
            <Text style={styles.emptySearchText}>Aucun article trouvé</Text>
          </View>
        ),
        scrollEventThrottle: 6,
        onScroll: Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          {
            useNativeDriver: true,
          }
        ),
      }}
    />
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    padding: 16,
  },
  modalHeader: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 0.7,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  modalList: {
    paddingBottom: 16,
  },
  articleItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  articleLeft: {
    flex: 1,
  },
  articleId: {
    fontSize: 12,
    color: "#03A9F4",
    fontWeight: "bold",
  },
  articleName: {
    fontSize: 15,
    marginTop: 4,
    color: "rgba(27, 31, 36, 0.77)",
  },
  articleRight: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  articlePrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "rgba(27, 31, 36, 0.77)",
  },
  articleStock: {
    fontSize: 14,
    color: "#757575",
    marginTop: 4,
  },
  emptySearch: {
    padding: 24,
    alignItems: "center",
  },
  emptySearchText: {
    fontSize: 16,
    color: "#757575",
  },

  // category styles
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 12,
  },
  categoryChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  categoryChipActive: {
    backgroundColor: "#03A9F4",
    borderColor: "#03A9F4",
  },
  categoryText: {
    fontSize: 12,
    color: "#757575",
    fontWeight: "500",
  },
  categoryTextActive: {
    color: "#FFF",
    fontWeight: "bold",
  },
});

export default ArticlesModalize;
