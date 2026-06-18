// SOLUTION 1: Créer un composant séparé pour chaque item
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Animated,
  Easing,
  View,
  TouchableOpacity,
  Text,
  FlatList,
} from "react-native";
import {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
  Feather,
  AntDesign,
} from "@expo/vector-icons";

const CommandeItem = ({
  item,
  expandedCommande,
  handleCommandePress,
  handleCreateLivraison,
  styles,
}) => {
  const isExpanded = expandedCommande === item.cmd;

  // Animation refs pour chaque item
  const expandAnimation = useRef(new Animated.Value(0)).current;
  const rotationAnimation = useRef(new Animated.Value(0)).current;

  // Effet d'animation quand l'état change
  useEffect(() => {
    Animated.parallel([
      Animated.timing(expandAnimation, {
        toValue: isExpanded ? 1 : 0,
        duration: 300,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        useNativeDriver: false,
      }),
      Animated.timing(rotationAnimation, {
        toValue: isExpanded ? 1 : 0,
        duration: 300,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        useNativeDriver: true,
      }),
    ]).start();
  }, [isExpanded]);

  // Interpolations pour les animations
  const animatedHeight = expandAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 2000], // Hauteur suffisante pour contenir le contenu
  });

  const animatedOpacity = expandAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.5, 1],
  });

  const rotateIcon = rotationAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <View style={styles.commandeContainer}>
      <TouchableOpacity
        style={[styles.modernCard, item.isOffline && styles.offlineCard]}
        onPress={() => handleCommandePress(item)}
        activeOpacity={0.7}
      >
        {/* Header avec numéro de commande et offre */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.dateText}>Commande N° {item.cmd}</Text>
            <Text style={styles.cmdNumber}>Offre N° {item.vgbel}</Text>
          </View>

          {/* Badge statut moderne */}
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  item.status === "initial"
                    ? "#3B82F620"
                    : item.status === "encours"
                    ? "#10B98120"
                    : "#8B5CF620",
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    item.status === "initial"
                      ? "#3B82F6"
                      : item.status === "encours"
                      ? "#10B981"
                      : "#8B5CF6",
                },
              ]}
            />
            <Text
              style={[
                styles.statusBadgeText,
                {
                  color:
                    item.status === "initial"
                      ? "#3B82F6"
                      : item.status === "encours"
                      ? "#10B981"
                      : "#8B5CF6",
                },
              ]}
            >
              {item.statutGlobal}
            </Text>
          </View>
        </View>

        {/* Divider subtile */}
        <View style={styles.divider} />

        {/* Footer avec stats et icône d'expansion */}
        <View style={styles.cardFooter}>
          <View style={styles.footerLeft}>
            <View style={styles.statItem}>
              <MaterialIcons name="inventory" size={16} color="#6B7280" />
              <Text style={styles.statText}>{item.totalArticles} articles</Text>
            </View>
          </View>

          <Animated.View
            style={[
              styles.chevronContainer,
              { transform: [{ rotate: rotateIcon }] },
            ]}
          >
            <MaterialIcons name="expand-more" size={20} color="#03A9F4" />
          </Animated.View>
        </View>

        {/* Indicateur offline */}
        {item.isOffline && (
          <View style={styles.offlineIndicator}>
            <MaterialIcons name="cloud-off" size={12} color="#F59E0B" />
          </View>
        )}
      </TouchableOpacity>

      {/* Section détails expandable avec animation fluide */}
      <Animated.View
        style={[
          styles.expandableSection,
          {
            maxHeight: animatedHeight,
            opacity: animatedOpacity,
            overflow: "hidden",
          },
        ]}
      >
        <View style={styles.commandeDetails}>
          <Text style={styles.detailsTitle}>Détails des articles</Text>

          {/* En-tête du tableau */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.codeColumn]}>
              Code
            </Text>
            <Text style={[styles.tableHeaderText, styles.designationColumn]}>
              Désignation
            </Text>
            <Text style={[styles.tableHeaderText, styles.qteCommandeColumn]}>
              Qté Cmd
            </Text>
            <Text style={[styles.tableHeaderText, styles.qteRestanteColumn]}>
              Qté Rest.
            </Text>
          </View>

          {/* Corps du tableau scrollable */}
          <FlatList
            data={item.articles}
            keyExtractor={(article, index) => `${article.matnr}-${index}`}
            renderItem={({ item: article }) => (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCellText, styles.codeColumn]}>
                  {article.matnr}
                </Text>
                <Text
                  style={[styles.tableCellText, styles.designationColumn]}
                  numberOfLines={2}
                >
                  {article.designation}
                </Text>
                <Text style={[styles.tableCellText, styles.qteCommandeColumn]}>
                  {parseFloat(article.lsmeng).toFixed(2)} {article.kmein}
                </Text>
                <Text
                  style={[
                    styles.tableCellText,
                    styles.qteRestanteColumn,
                    parseFloat(article.qte_restante) <= 0
                      ? styles.negativeRemaining
                      : styles.positiveRemaining,
                  ]}
                >
                  {parseFloat(article.qte_restante).toFixed(2)} {article.kmein}
                </Text>
              </View>
            )}
            // contentContainerStyle={styles.articlesList}
            style={{ maxHeight: 2000, flexGrow: 0 }}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
          />

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleCreateLivraison(item)}
            >
              <MaterialIcons name="local-shipping" size={20} color="white" />
              <Text style={styles.actionButtonText}>Livrer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

export default CommandeItem;
