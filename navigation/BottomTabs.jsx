import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { scale, fs } from "../utils/responsive";
import { Colors } from "../constants/Theme";
import {
  getCartItems,
  getCartCount,
  subscribeToCart,
} from "../utils/cartStorage";

import HomeScreen from "../screens/newTheme/HomeScreen";
import ClientListScreen from "../screens/newTheme/ClientListScreen";
import CartScreen from "../screens/newTheme/CartScreen";

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Accueil: { active: "home", inactive: "home-outline" },
  Clients: { active: "people", inactive: "people-outline" },
  Panier: { active: "cart", inactive: "cart-outline" },
};

const ICON_SIZE = scale(22);
const ACTIVE_COLOR = "#e0732f";
const INACTIVE_COLOR = "#5B5F66";
const PILL_BG = "#ffa31834";

// 2. Dans TabIcon — remplacer les noms hardcodés par t()
const TabIcon = ({ routeName, focused }) => {
  const { t } = useTranslation();
  const icon = TAB_ICONS[routeName];
  const color = focused ? ACTIVE_COLOR : INACTIVE_COLOR;

  const LABELS = {
    Accueil: t("tabs.home"),
    Clients: t("tabs.clients"),
    Panier: t("tabs.cart"),
  };

  return (
    <View style={[styles.pill, focused && styles.pillActive]}>
      <Ionicons
        name={focused ? icon.active : icon.inactive}
        size={ICON_SIZE}
        color={color}
      />
      <Text style={[styles.label, { color }, focused && styles.labelFocused]}>
        {LABELS[routeName]}
      </Text>
    </View>
  );
};

const CustomTabBar = ({
  state,
  descriptors,
  navigation,
  openDrawer,
  cartCount,
}) => {
  const { t } = useTranslation();
  return (
    <View style={styles.tabBarWrap}>
      <View style={StyleSheet.absoluteFill}>
        <BlurView intensity={0} tint="light" style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={["transparent", "rgba(214,229,246,0.85)"]}
          locations={[0, 1]}
          start={{ x: 0, y: 1 }}
          end={{ x: 0.9, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View style={styles.tabBarRow}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tabItem}
              onPress={onPress}
              activeOpacity={0.7}
            >
              <View>
                <TabIcon routeName={route.name} focused={focused} />
                {route.name === "Panier" && cartCount > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{cartCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Bouton hamburger — ouvre le drawer */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={openDrawer}
          activeOpacity={0.7}
        >
          <View style={styles.pill}>
            <Ionicons name="menu" size={ICON_SIZE} color={INACTIVE_COLOR} />
            <Text style={styles.label}>{t("tabs.menu")}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const BottomTabs = ({ openDrawer }) => {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    getCartItems().then((items) => setCartCount(getCartCount(items)));
    const unsubscribe = subscribeToCart((items) =>
      setCartCount(getCartCount(items)),
    );
    return unsubscribe;
  }, []);

  return (
    <Tab.Navigator
      tabBar={(props) => (
        <CustomTabBar
          {...props}
          openDrawer={openDrawer}
          cartCount={cartCount}
        />
      )}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Accueil" component={HomeScreen} />
      <Tab.Screen name="Clients" component={ClientListScreen} />
      <Tab.Screen name="Panier" component={CartScreen} />
    </Tab.Navigator>
  );
};

export default BottomTabs;

const styles = StyleSheet.create({
  tabBarWrap: {
    height: scale(58),
    paddingTop: scale(8),
    paddingBottom: scale(12),
    backgroundColor: "rgba(255,255,255,0.55)",
    borderTopWidth: 0,
    elevation: 0,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: scale(22),
    borderTopRightRadius: scale(22),
    overflow: "hidden",
    // direction: "ltr",
  },
  tabBarRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pill: {
    alignItems: "center",
    justifyContent: "center",
    gap: scale(3),
    paddingHorizontal: scale(10),
    paddingTop: scale(6),
    paddingBottom: scale(5),
    borderRadius: scale(16),
  },
  pillActive: { backgroundColor: PILL_BG },
  label: { fontSize: fs(10.5), fontWeight: "500", color: INACTIVE_COLOR },
  labelFocused: { fontWeight: "700" },
  cartBadge: {
    position: "absolute",
    top: -2,
    right: 4,
    backgroundColor: Colors.secondary,
    minWidth: scale(16),
    height: scale(16),
    borderRadius: scale(8),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: fs(9),
    fontWeight: "800",
  },
});
