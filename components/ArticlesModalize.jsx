// import React, { useMemo, useRef, useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   TextInput,
//   Dimensions,
//   Animated,
//   ScrollView,
//   FlatList,
// } from "react-native";
// import { Modalize } from "react-native-modalize";
// import { MaterialIcons, AntDesign } from "@expo/vector-icons";

// const { width, height } = Dimensions.get("window");

// const ArticlesModalize = ({
//   reference,
//   searchQuery,
//   setSearchQuery,
//   filteredArticles,
//   handleArticleSelect,
//   scrollY,
// }) => {
//   const [selectedCategory, setSelectedCategory] = useState("Tous");
//   // Extraire les catégories uniques
//   const categories = useMemo(() => {
//     return ["Tous", ...new Set(filteredArticles.map((item) => item.Category))];
//   }, [filteredArticles]);

//   // Filtrer par catégorie
//   const articlesToDisplay = useMemo(() => {
//     if (selectedCategory === "Tous") {
//       return filteredArticles;
//     }
//     return filteredArticles.filter(
//       (item) => item.Category === selectedCategory
//     );
//   }, [filteredArticles, selectedCategory]);
//   return (
//     <Modalize
//       ref={reference}
//       modalHeight={height * 0.9}
//       disableScrollIfPossible={false}
//       closeOnOverlayTap={true}
//       threshold={100}
//       panGestureComponentEnabled={false}
//       closeSnapPointStraightEnabled={false}
//       velocityThreshold={0.8}
//       panGestureEnabled={false}
//       modalStyle={styles.modalContainer}
//       keyboardAvoidingBehavior="padding"
//       avoidKeyboardLikeIOS={true}
//       withHandle={false}
//       HeaderComponent={
//         <View style={styles.modalHeader}>
//           <View
//             style={{
//               display: "flex",
//               flexDirection: "row",
//               justifyContent: "space-between",
//             }}
//           >
//             <Text style={styles.modalTitle}>Sélectionnez un article</Text>
//             <TouchableOpacity onPress={() => reference.current?.close()}>
//               <AntDesign name="close" size={26} color="#000" />
//             </TouchableOpacity>
//           </View>

//           {/* Catégories sur plusieurs lignes */}
//           <View style={styles.categoriesContainer}>
//             {categories.map((category) => (
//               <TouchableOpacity
//                 key={category}
//                 style={[
//                   styles.categoryChip,
//                   selectedCategory === category && styles.categoryChipActive,
//                 ]}
//                 onPress={() => setSelectedCategory(category)}
//               >
//                 <Text
//                   style={[
//                     styles.categoryText,
//                     selectedCategory === category && styles.categoryTextActive,
//                   ]}
//                 >
//                   {category}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </View>

//           <View style={styles.searchBar}>
//             <MaterialIcons name="search" size={24} color="#757575" />
//             <TextInput
//               style={styles.searchInput}
//               placeholder="Rechercher un article..."
//               value={searchQuery}
//               onChangeText={setSearchQuery}
//             />
//             {searchQuery !== "" && (
//               <TouchableOpacity onPress={() => setSearchQuery("")}>
//                 <MaterialIcons name="clear" size={20} color="#757575" />
//               </TouchableOpacity>
//             )}
//           </View>
//         </View>
//       }
//       flatListProps={{
//         data: articlesToDisplay,
//         renderItem: ({ item }) => (
//           <TouchableOpacity
//             style={styles.articleItem}
//             onPress={() => handleArticleSelect(item)}
//           >
//             <View style={styles.articleLeft}>
//               <Text style={styles.articleId}>{item.id}</Text>
//               <Text style={styles.articleName}>{item.designation}</Text>
//             </View>
//             <View style={styles.articleRight}>
//               <Text style={styles.articlePrice}>
//                 {parseFloat(item.prix).toLocaleString("fr-DZ", {
//                   style: "currency",
//                   currency: "DZD",
//                 })}
//               </Text>
//               {/* <Text style={styles.articleStock}>
//                 Stock: {item.stock} {item.unite}
//               </Text> */}
//             </View>
//           </TouchableOpacity>
//         ),
//         keyExtractor: (item) => item.id,
//         contentContainerStyle: styles.modalList,
//         showsVerticalScrollIndicator: true,
//         keyboardShouldPersistTaps: "always",
//         ListEmptyComponent: (
//           <View style={styles.emptySearch}>
//             <Text style={styles.emptySearchText}>Aucun article trouvé</Text>
//           </View>
//         ),
//         scrollEventThrottle: 6,
//         onScroll: Animated.event(
//           [{ nativeEvent: { contentOffset: { y: scrollY } } }],
//           {
//             useNativeDriver: true,
//           }
//         ),
//       }}
//     />
//   );
// };

// const styles = StyleSheet.create({
//   modalContainer: {
//     padding: 16,
//   },
//   modalHeader: {
//     marginBottom: 16,
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: "bold",
//     marginBottom: 12,
//   },
//   searchBar: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#F5F5F5",
//     borderRadius: 20,
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     elevation: 0.7,
//   },
//   searchInput: {
//     flex: 1,
//     marginLeft: 8,
//     fontSize: 16,
//   },
//   modalList: {
//     paddingBottom: 16,
//   },
//   articleItem: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     padding: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: "#F0F0F0",
//   },
//   articleLeft: {
//     flex: 1,
//   },
//   articleId: {
//     fontSize: 12,
//     color: "#03A9F4",
//     fontWeight: "bold",
//   },
//   articleName: {
//     fontSize: 15,
//     marginTop: 4,
//     color: "rgba(27, 31, 36, 0.77)",
//   },
//   articleRight: {
//     alignItems: "flex-end",
//     justifyContent: "center",
//   },
//   articlePrice: {
//     fontSize: 16,
//     fontWeight: "bold",
//     color: "rgba(27, 31, 36, 0.77)",
//   },
//   articleStock: {
//     fontSize: 14,
//     color: "#757575",
//     marginTop: 4,
//   },
//   emptySearch: {
//     padding: 24,
//     alignItems: "center",
//   },
//   emptySearchText: {
//     fontSize: 16,
//     color: "#757575",
//   },

//   // category styles
//   categoriesContainer: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     gap: 8,
//     marginVertical: 12,
//   },
//   categoryChip: {
//     paddingHorizontal: 8,
//     paddingVertical: 5,
//     borderRadius: 20,
//     backgroundColor: "#F5F5F5",
//     borderWidth: 1,
//     borderColor: "#E0E0E0",
//   },
//   categoryChipActive: {
//     backgroundColor: "#03A9F4",
//     borderColor: "#03A9F4",
//   },
//   categoryText: {
//     fontSize: 12,
//     color: "#757575",
//     fontWeight: "500",
//   },
//   categoryTextActive: {
//     color: "#FFF",
//     fontWeight: "bold",
//   },
// });

// export default ArticlesModalize;

import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Animated,
} from "react-native";
import { Modalize } from "react-native-modalize";
import { MaterialIcons, AntDesign } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import PriceDisplay from "./common/Pricedisplay";
// import PriceDisplay from "./Pricedisplay";

const { height } = Dimensions.get("window");

const ArticlesModalize = ({
  reference,
  searchQuery,
  setSearchQuery,
  filteredArticles,
  handleArticleSelect,
  scrollY,
  onClosed,
}) => {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState(t("order.all"));

  const categories = useMemo(() => {
    return [
      t("order.all"),
      ...new Set(filteredArticles.map((item) => item.Category)),
    ];
  }, [filteredArticles, t]);

  const articlesToDisplay = useMemo(() => {
    if (selectedCategory === t("order.all")) {
      return filteredArticles;
    }
    return filteredArticles.filter(
      (item) => item.Category === selectedCategory,
    );
  }, [filteredArticles, selectedCategory, t]);

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
      withHandle={true}
      handleStyle={styles.handle}
      onClosed={onClosed}
      HeaderComponent={
        <View style={styles.modalHeader}>
          <View style={styles.headerTopRow}>
            <Text style={styles.modalTitle}>{t("order.selectArticle")}</Text>
            <TouchableOpacity
              onPress={() => reference.current?.close()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.closeBtn}
            >
              <AntDesign name="close" size={22} color="#1F2937" />
            </TouchableOpacity>
          </View>

          {/* Catégories en scroll horizontal inline */}
          <Animated.FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.categoriesContainer}
            renderItem={({ item: category }) => (
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  selectedCategory === category && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(category)}
                activeOpacity={0.7}
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
            )}
          />

          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={22} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder={t("order.searchArticle")}
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== "" && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="clear" size={18} color="#9CA3AF" />
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
            activeOpacity={0.7}
          >
            <View style={styles.articleLeft}>
              <Text style={styles.articleId}>{item.id}</Text>
              <Text style={styles.articleName} numberOfLines={2}>
                {item.designation}
              </Text>
            </View>
            <View style={styles.articleRight}>
              <PriceDisplay
                amount={parseFloat(item.prix) || 0}
                // color="#4CAF50"
                intSize={16}
                decSize={11}
              />
            </View>
          </TouchableOpacity>
        ),
        keyExtractor: (item) => item.id,
        contentContainerStyle: styles.modalList,
        showsVerticalScrollIndicator: false,
        keyboardShouldPersistTaps: "always",
        removeClippedSubviews: true,
        initialNumToRender: 12,
        maxToRenderPerBatch: 12,
        windowSize: 7,
        ListEmptyComponent: (
          <View style={styles.emptySearch}>
            <MaterialIcons name="search-off" size={40} color="#D1D5DB" />
            <Text style={styles.emptySearchText}>
              {t("order.noArticleFound")}
            </Text>
          </View>
        ),
        scrollEventThrottle: 16,
        onScroll: Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        ),
      }}
    />
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  handle: {
    backgroundColor: "#D1D5DB",
    width: 40,
  },
  modalHeader: {
    marginBottom: 8,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  closeBtn: {
    padding: 2,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: "#1F2937",
    padding: 0,
  },
  modalList: {
    paddingBottom: 24,
  },
  articleItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  articleLeft: {
    flex: 1,
    paddingRight: 12,
  },
  articleId: {
    fontSize: 12,
    color: "#03A9F4",
    fontWeight: "700",
  },
  articleName: {
    fontSize: 14,
    marginTop: 3,
    color: "#374151",
    lineHeight: 19,
  },
  articleRight: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  emptySearch: {
    padding: 40,
    alignItems: "center",
    gap: 8,
  },
  emptySearchText: {
    fontSize: 15,
    color: "#9CA3AF",
  },

  // Catégories — scroll horizontal inline
  categoriesContainer: {
    gap: 8,
    paddingVertical: 10,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  categoryChipActive: {
    backgroundColor: "#03A9F4",
    borderColor: "#03A9F4",
  },
  categoryText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  categoryTextActive: {
    color: "#FFF",
    fontWeight: "700",
  },
});

export default ArticlesModalize;
