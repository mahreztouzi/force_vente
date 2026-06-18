import React from "react";
import {
  createBottomTabNavigator,
  TransitionSpecs,
} from "@react-navigation/bottom-tabs";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Dashboard from "./Dashboard";
import UserProfile from "./UserProfile";
import {
  horizontalScale,
  verticalScale,
  moderateScale,
} from "../constants/Scale";

function Tabs() {
  const Tab = createBottomTabNavigator();

  return (
    <Tab.Navigator
      initialRouteName="dash"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#5883C9",
        tabBarStyle: { height: 60, backgroundColor: "#ffffff" },
        tabBarLabelStyle: { fontSize: moderateScale(12) },
        tabBarItemStyle: { backgroundColor: "#ffffff" },
      }}
    >
      <Tab.Screen
        name="dash"
        component={Dashboard}
        options={{
          tabBarLabel: "Accueil",
          tabBarLabelStyle: { height: 20 },
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={30} />
          ),
        }}
      />

      <Tab.Screen
        name="settings"
        component={UserProfile}
        options={{
          tabBarLabel: "Profile",
          tabBarLabelStyle: { height: 20 },
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" color={color} size={30} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default Tabs;
