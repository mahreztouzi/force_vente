import React from "react";
import { Text, View, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useSelector } from "react-redux";
import { scale, fs } from "../utils/responsive";
import { Colors, Gradients } from "../constants/Theme";

import HomeScreen from "../screens/newTheme/HomeScreen";
import ClientList from "../screens/ClientList";
import UserProfile from "../screens/UserProfile";

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Accueil: { active: "home", inactive: "home-outline" },
  Clients: { active: "people", inactive: "people-outline" },
  Panier: { active: "cart", inactive: "cart-outline" },
  Historique: { active: "time", inactive: "time-outline" },
  Compte: { active: "person", inactive: "person-outline" },
};

const ICON_SIZE = scale(22);
const ACTIVE_COLOR = "#e0732f";
const INACTIVE_COLOR = "#5B5F66";
const PILL_BG = "#ffa31834";

const TabIcon = ({ route, focused }) => {
  const icon = TAB_ICONS[route.name];
  const color = focused ? ACTIVE_COLOR : INACTIVE_COLOR;

  return (
    <View style={[styles.pill, focused && styles.pillActive]}>
      <Ionicons
        name={focused ? icon.active : icon.inactive}
        size={ICON_SIZE}
        color={color}
      />
      <Text style={[styles.label, { color }, focused && styles.labelFocused]}>
        {route.name}
      </Text>
    </View>
  );
};

const BottomTabs = () => {
  const cartCount = useSelector((state) => state.cart?.items?.length || 0);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            <BlurView
              intensity={0}
              tint="light"
              style={StyleSheet.absoluteFill}
            />
            {/* Gradient bleu concentré en bas-gauche, transparent ailleurs — reprend le halo de ScreenBackground */}
            <LinearGradient
              colors={["transparent", "rgba(214,229,246,0.85)"]}
              locations={[0, 1]}
              start={{ x: 0, y: 1 }}
              end={{ x: 0.9, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </View>
        ),
        tabBarIcon: ({ focused }) => (
          <TabIcon route={route} focused={focused} />
        ),
      })}
    >
      <Tab.Screen name="Accueil" component={HomeScreen} />
      <Tab.Screen name="Clients" component={ClientList} />
      <Tab.Screen
        name="Panier"
        component={ClientList}
        options={{
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: styles.badge,
        }}
      />
      <Tab.Screen name="Historique" component={ClientList} />
      <Tab.Screen name="Compte" component={UserProfile} />
    </Tab.Navigator>
  );
};

export default BottomTabs;

const styles = StyleSheet.create({
  tabBar: {
    height: scale(58),
    paddingTop: scale(8),
    paddingBottom: scale(12),
    backgroundColor: "rgba(255,255,255,0.55)", // le fond vient maintenant du tabBarBackground (blur + gradient)
    borderTopWidth: 0,
    elevation: 0,
    position: "absolute",
    borderTopLeftRadius: scale(22),
    borderTopRightRadius: scale(22),
  },
  tabItem: {
    paddingVertical: 0,
  },
  pill: {
    alignItems: "center",
    justifyContent: "center",
    gap: scale(3),
    paddingHorizontal: scale(14),
    paddingTop: scale(6),
    paddingBottom: scale(5),
    borderRadius: scale(16),
  },
  pillActive: {
    backgroundColor: PILL_BG,
  },
  label: {
    fontSize: fs(10.5),
    fontWeight: "500",
  },
  labelFocused: {
    fontWeight: "700",
  },
  badge: {
    backgroundColor: Colors.secondary,
    fontSize: fs(10),
  },
});
