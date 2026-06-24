import React, { useState } from "react";
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  useNavigation,
} from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from "react-native";
import {
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
} from "@react-navigation/drawer";
import {
  createStackNavigator,
  TransitionPresets,
} from "@react-navigation/stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { Avatar } from "react-native-elements";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import {
  horizontalScale,
  verticalScale,
  moderateScale,
} from "../constants/Scale";
import NotFoundScreen from "../screens/NotFoundScreen";
import LoginScreen from "../screens/LoginScreen";
import SplashScreenLogo from "../screens/SplashScreenLogo";
import UserProfile from "../screens/UserProfile";
import Tabs from "../screens/Tabs";
import ClientList from "../screens/ClientList";
import Dashboard from "../screens/Dashboard";
import { useDispatch, useSelector } from "react-redux";
import ClientDetails from "../screens/ClientDetails";
import CommandeScreen from "../screens/CommandeScreen";
import * as SecureStore from "expo-secure-store";
import LivraisonScreen from "../screens/LivraisonScreen";
import { CreateLivraisonScreen } from "../screens/CreateLivraisonScreen";
import BillingScreen from "../screens/BillingScreen";
import ReceptionListScreen from "../screens/ReceptionListScreen";
import CreateReceptionScreen from "../screens/CreateReceptionScreen";
import StockScreen from "../screens/StockScreen";
import { DocumentViewerScreen } from "../screens/DocumentViewerScreen";
import EncaissementScreen from "../screens/EncaissementScreen";
import CommandeListesScreen from "../screens/CommandeListesScreen";
import OfflineOrdersScreen from "../screens/OfflineOrdersScreen";
import EditOfflineOrderScreen from "../screens/EditOfflineOrderScreen";
import { logoutUser } from "../redux/slices/authSlice";
import OfflineLivraisonsScreen from "../screens/OfflineLivraisonsScreen";
import EditOfflineLivraisonScreen from "../screens/EditOfflineLivraisonScreen";
import { PDFViewerScreen } from "../screens/PDFViewerScreen";
import HeaderRightButton from "../components/HeaderRightButton";
import LivraisonsAllListScreen from "../screens/LivraisonsListAllScreen";
import BrouillonScreen from "../screens/BrouillonScreen";
import DraftCommandeScreen from "../screens/DraftCommandeScreen";
import CreateQuotationScreen from "../screens/CreateQutationScreen";
import QuotationListesScreen from "../screens/QuotationListesScreen";
import CommandeVenteListeScreen from "../screens/CommandeVenteRetourScreen";
import ConnectionIndicator from "../components/ConnectionIndicator";
import ConnectionManager from "../components/ConnectionLister";
import ServerConfigScreen from "../screens/ServerConfigScreen";
import SettingsScreen from "../screens/SettingsScreen";
import ClientEtatList from "../screens/ClientEtatList";
import BottomTabs from "./BottomTabs";
import ClientPickerScreen from "../screens/newTheme/ClientPickerScreen";
import ArticleSearchScreen from "../screens/newTheme/ArticleSearchScreen";
import ClientDetailsScreen from "../screens/newTheme/ClientDetailsScreen";
import AppDrawerWrapper from "./AppDrawerWrapper";
import QuotationScreen from "../screens/newTheme/commande/QuotationScreen";
import OrderReturnScreen from "../screens/newTheme/commande/OrderReturnScreen";

// Ajoutez ce composant CustomDrawerContent dans le même fichier
const CustomDrawerContent = (props) => {
  // Mock user data - à remplacer avec les données réelles de l'utilisateur
  const { user: userData } = useSelector((state) => state.auth);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const logout = async () => {
    const responeLogout = await dispatch(logoutUser());
    if (responeLogout) {
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    }
  };
  const handleAlertLogout = () => {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Oui",
          onPress: logout,
        },
      ],
      { cancelable: false },
    );
    return true; // Empêche le comportement par défaut du bouton retour
  };

  // Éléments du menu du drawer avec icônes
  const menuItems = [
    {
      name: "Accueil",
      icon: "view-dashboard",
      onPress: () => props.navigation.navigate("Dashboard"),
    },
    {
      name: "Clients",
      icon: "account-group",
      onPress: () => props.navigation.navigate("Clients"),
    },
    // Ajoutez d'autres éléments de menu selon vos besoins
    {
      name: "Déconnexion",
      icon: "logout",
      onPress: () => {
        handleAlertLogout();
      },
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Section d'en-tête utilisateur */}
      <TouchableOpacity
        style={styles.userSection}
        onPress={() => navigation.navigate("Profile")}
      >
        <Avatar
          rounded
          size={60}
          title={`${userData?.code.charAt(0)}${userData?.code.charAt(1)}`}
          containerStyle={styles.avatar}
          // source={user.avatar ? { uri: user.avatar } : null}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{`${userData?.fullName}`}</Text>
          <Text style={styles.userEmail}>{userData?.code}</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.separator} />

      {/* Éléments du menu */}
      <ScrollView style={styles.menuItems}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <MaterialCommunityIcons
              name={item.icon}
              size={24}
              color="#006475"
            />
            <Text style={styles.menuItemText}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Version de l'application */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Doudah v1.0.0</Text>
      </View>
    </SafeAreaView>
  );
};

export default function Navigation({ colorScheme }) {
  return (
    <NavigationContainer theme={DefaultTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
}

// A root stack navigator is often used for displaying modals on top of all other content
// Read more here: https://reactnavigation.org/docs/modal

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

function RootNavigator() {
  const navigation = useNavigation();
  const [currentRoute, setCurrentRoute] = useState("splash");

  const defaultScreenOptions = {
    headerShown: false,
    ...TransitionPresets.SlideFromRightIOS,
  };

  const headerScreenOptions = {
    headerShown: true,
    headerStyle: {
      backgroundColor: "#03A9F4",
    },
    headerTintColor: "white",
    ...TransitionPresets.SlideFromRightIOS,
  };

  const modalScreenOptions = {
    headerShown: true,
    ...TransitionPresets.ModalSlideFromBottomIOS,
  };

  const fadeScreenOptions = {
    headerShown: false,
    ...TransitionPresets.FadeFromBottomAndroid,
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Navigator
        initialRouteName="splash"
        screenOptions={defaultScreenOptions}
      >
        <Stack.Screen
          name="splash"
          component={SplashScreenLogo}
          options={{
            ...fadeScreenOptions,
          }}
          listeners={{
            focus: () => setCurrentRoute("splash"),
          }}
        />
        <Stack.Screen
          name="ServerConfig"
          component={ServerConfigScreen}
          options={{
            headerShown: false,
            gestureEnabled: false,
            ...TransitionPresets.FadeFromBottomAndroid,
          }}
          listeners={{
            focus: () => setCurrentRoute("ServerConfig"),
          }}
        />

        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            headerShown: false,
            gestureEnabled: false,
            ...TransitionPresets.FadeFromBottomAndroid,
          }}
          listeners={{
            focus: () => setCurrentRoute("Login"),
          }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            headerShown: true,
            headerStyle: {
              backgroundColor: "#03A9F4",
            },
            headerTintColor: "white",
            ...TransitionPresets.ScaleFromCenterAndroid,
            headerTitle: () => (
              <Text
                style={{ color: "white", fontSize: 16, fontWeight: "bold" }}
              >
                Paramètres
              </Text>
            ),
            headerLeft: () => (
              <MaterialCommunityIcons
                name="arrow-left-circle"
                size={30}
                color="white"
                style={{ marginLeft: 15 }}
                onPress={() => navigation.goBack()}
              />
            ),
          }}
          listeners={{
            focus: () => setCurrentRoute("Settings"),
          }}
        />

        {/* <Stack.Screen
          name="Tabs"
          component={Dashboard}
          options={{
            ...fadeScreenOptions,
          }}
          listeners={{
            focus: () => setCurrentRoute("Tabs"),
          }}
        /> */}
        <Stack.Screen
          name="ClientPicker"
          component={ClientPickerScreen}
          options={{
            ...modalScreenOptions, // réutilise le pattern de présentation modale déjà défini dans ton fichier
            headerShown: false,
          }}
          listeners={{
            focus: () => setCurrentRoute("ClientPicker"),
          }}
        />
        <Stack.Screen
          name="ArticleSearch"
          component={ArticleSearchScreen}
          options={{
            ...modalScreenOptions, // réutilise le pattern de présentation modale déjà défini dans ton fichier
            headerShown: false,
          }}
          listeners={{
            focus: () => setCurrentRoute("ArticleSearch"),
          }}
        />
        <Stack.Screen
          name="Tabs"
          component={AppDrawerWrapper}
          options={{
            ...fadeScreenOptions,
          }}
          listeners={{
            focus: () => setCurrentRoute("Tabs"),
          }}
        />

        <Stack.Screen
          name="Clients"
          component={ClientList}
          options={{
            ...headerScreenOptions,
            headerTitle: () => (
              <Text
                style={{ color: "white", fontSize: 16, fontWeight: "bold" }}
              >
                Liste des Clients
              </Text>
            ),
            headerLeft: () => (
              <MaterialCommunityIcons
                name="arrow-left-circle"
                size={30}
                color="white"
                style={{ marginLeft: 15 }}
                onPress={() => navigation.goBack()}
              />
            ),
          }}
          listeners={{
            focus: () => setCurrentRoute("Clients"),
          }}
        />

        <Stack.Screen
          name="ClientsEtat"
          component={ClientEtatList}
          options={{
            ...headerScreenOptions,
            headerTitle: () => (
              <Text
                style={{ color: "white", fontSize: 16, fontWeight: "bold" }}
              >
                Documents à traiter
              </Text>
            ),
            headerLeft: () => (
              <MaterialCommunityIcons
                name="arrow-left-circle"
                size={30}
                color="white"
                style={{ marginLeft: 15 }}
                onPress={() => navigation.goBack()}
              />
            ),
          }}
          listeners={{
            focus: () => setCurrentRoute("ClientsEtat"),
          }}
        />

        <Stack.Screen
          name="ClientDetails"
          // component={ClientDetails}
          component={ClientDetailsScreen}
          // options={{
          //   ...headerScreenOptions,
          //   headerLeft: () => (
          //     <MaterialCommunityIcons
          //       name="arrow-left-circle"
          //       size={30}
          //       color="white"
          //       style={{ marginLeft: 15 }}
          //       onPress={() => navigation.goBack()}
          //     />
          //   ),
          // }}
          listeners={{
            focus: () => setCurrentRoute("ClientDetails"),
          }}
        />

        <Stack.Screen
          name="commande_liste"
          component={CommandeListesScreen}
          options={{
            ...headerScreenOptions,
            headerTitle: () => (
              <Text
                style={{ color: "white", fontSize: 16, fontWeight: "bold" }}
              >
                Commandes
              </Text>
            ),
            headerLeft: () => (
              <MaterialCommunityIcons
                name="arrow-left-circle"
                size={30}
                color="white"
                style={{ marginLeft: 15 }}
                onPress={() => navigation.goBack()}
              />
            ),
          }}
          listeners={{
            focus: () => setCurrentRoute("commande_liste"),
          }}
        />

        <Stack.Screen
          name="quotation_liste"
          component={QuotationListesScreen}
          options={{
            ...headerScreenOptions,
            headerTitle: () => (
              <Text
                style={{ color: "white", fontSize: 16, fontWeight: "bold" }}
              >
                Listes des offres
              </Text>
            ),
            headerLeft: () => (
              <MaterialCommunityIcons
                name="arrow-left-circle"
                size={30}
                color="white"
                style={{ marginLeft: 15 }}
                onPress={() => navigation.goBack()}
              />
            ),
          }}
          listeners={{
            focus: () => setCurrentRoute("quotation_liste"),
          }}
        />

        <Stack.Screen
          name="all_orders"
          component={CommandeVenteListeScreen}
          options={{
            ...headerScreenOptions,
            headerLeft: () => (
              <MaterialCommunityIcons
                name="arrow-left-circle"
                size={30}
                color="white"
                style={{ marginLeft: 15 }}
                onPress={() => navigation.goBack()}
              />
            ),
          }}
          listeners={{
            focus: () => setCurrentRoute("all_orders"),
          }}
        />

        <Stack.Screen
          name="create_cmd"
          // component={CommandeScreen} // ancien theme
          component={OrderReturnScreen}
          // options={{
          //   ...modalScreenOptions,
          // }}
          listeners={{
            focus: () => setCurrentRoute("create_cmd"),
          }}
        />

        <Stack.Screen
          name="create_offr"
          // component={CreateQuotationScreen}  // ancien theme
          component={QuotationScreen}
          // options={{
          //   ...modalScreenOptions,
          // }}
          listeners={{
            focus: () => setCurrentRoute("create_offr"),
          }}
        />

        <Stack.Screen
          name="offline_cmd"
          component={OfflineLivraisonsScreen}
          options={{
            ...headerScreenOptions,
          }}
          listeners={{
            focus: () => setCurrentRoute("offline_cmd"),
          }}
        />

        <Stack.Screen
          name="edit_offline_livraison"
          component={EditOfflineLivraisonScreen}
          options={{
            ...modalScreenOptions,
          }}
          listeners={{
            focus: () => setCurrentRoute("edit_offline_livraison"),
          }}
        />

        <Stack.Screen
          name="edit_offline_cmd"
          component={EditOfflineOrderScreen}
          options={{
            ...modalScreenOptions,
          }}
          listeners={{
            focus: () => setCurrentRoute("edit_offline_cmd"),
          }}
        />

        <Stack.Screen
          name="livraison"
          component={LivraisonScreen}
          options={({ navigation }) => ({
            ...headerScreenOptions,
            headerTitle: () => (
              <Text style={{ color: "white", fontSize: 16, fontWeight: "500" }}>
                Choisissez une commande à livrer
              </Text>
            ),
            headerLeft: () => (
              <MaterialCommunityIcons
                name="arrow-left-circle"
                size={30}
                color="white"
                style={{ marginLeft: 15 }}
                onPress={() => navigation.goBack()}
              />
            ),
          })}
          listeners={{
            focus: () => setCurrentRoute("livraison"),
          }}
        />

        <Stack.Screen
          name="allOutbounds"
          component={LivraisonsAllListScreen}
          options={({ navigation }) => ({
            ...headerScreenOptions,
            headerLeft: () => (
              <MaterialCommunityIcons
                name="arrow-left-circle"
                size={30}
                color="white"
                style={{ marginLeft: 15 }}
                onPress={() => navigation.goBack()}
              />
            ),
          })}
          listeners={{
            focus: () => setCurrentRoute("allOutbounds"),
          }}
        />

        <Stack.Screen
          name="Facturation"
          component={BillingScreen}
          options={{
            ...headerScreenOptions,
            headerTitle: () => (
              <Text
                style={{ color: "white", fontSize: 16, fontWeight: "bold" }}
              >
                Facture
              </Text>
            ),
            headerLeft: () => (
              <MaterialCommunityIcons
                name="arrow-left-circle"
                size={30}
                color="white"
                style={{ marginLeft: 15 }}
                onPress={() => navigation.goBack()}
              />
            ),
          }}
          listeners={{
            focus: () => setCurrentRoute("Facturation"),
          }}
        />

        <Stack.Screen
          name="create_livraison"
          component={CreateLivraisonScreen}
          options={{
            ...modalScreenOptions,
          }}
          listeners={{
            focus: () => setCurrentRoute("create_livraison"),
          }}
        />

        <Stack.Screen
          name="Stock"
          component={StockScreen}
          options={{
            ...headerScreenOptions,
            headerTitle: () => (
              <Text
                style={{ color: "white", fontSize: 16, fontWeight: "bold" }}
              >
                Stock
              </Text>
            ),
            headerLeft: () => (
              <MaterialCommunityIcons
                name="arrow-left-circle"
                size={30}
                color="white"
                style={{ marginLeft: 15 }}
                onPress={() => navigation.goBack()}
              />
            ),
          }}
          listeners={{
            focus: () => setCurrentRoute("Stock"),
          }}
        />

        <Stack.Screen
          name="transfert_list"
          component={ReceptionListScreen}
          options={{
            ...headerScreenOptions,
            headerTitle: () => (
              <Text
                style={{ color: "white", fontSize: 16, fontWeight: "bold" }}
              >
                Listes des transferts
              </Text>
            ),
            headerLeft: () => (
              <MaterialCommunityIcons
                name="arrow-left-circle"
                size={30}
                color="white"
                style={{ marginLeft: 15 }}
                onPress={() => navigation.goBack()}
              />
            ),
          }}
          listeners={{
            focus: () => setCurrentRoute("transfert_list"),
          }}
        />

        <Stack.Screen
          name="create_reception"
          component={CreateReceptionScreen}
          options={{
            ...modalScreenOptions,
            headerStyle: {
              backgroundColor: "#03A9F4",
            },
            headerTintColor: "white",
            headerTitle: () => (
              <Text
                style={{ color: "white", fontSize: 16, fontWeight: "bold" }}
              >
                Création d'une réception
              </Text>
            ),
            headerLeft: () => (
              <MaterialCommunityIcons
                name="arrow-left-circle"
                size={30}
                color="white"
                style={{ marginLeft: 15 }}
                onPress={() => navigation.goBack()}
              />
            ),
          }}
          listeners={{
            focus: () => setCurrentRoute("create_reception"),
          }}
        />

        <Stack.Screen
          name="encaissement"
          component={EncaissementScreen}
          options={{
            ...headerScreenOptions,
            headerTitle: () => (
              <Text style={{ color: "white", fontSize: 16, fontWeight: "500" }}>
                Encaissement
              </Text>
            ),
            headerLeft: () => (
              <MaterialCommunityIcons
                name="arrow-left-circle"
                size={30}
                color="white"
                style={{ marginLeft: 15 }}
                onPress={() => navigation.goBack()}
              />
            ),
          }}
          listeners={{
            focus: () => setCurrentRoute("encaissement"),
          }}
        />

        <Stack.Screen
          name="Profile"
          component={UserProfile}
          options={{
            ...modalScreenOptions,
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="DocumentViewer"
          component={DocumentViewerScreen}
          options={{
            ...headerScreenOptions,
          }}
          listeners={{
            focus: () => setCurrentRoute("DocumentViewer"),
          }}
        />

        <Stack.Screen
          name="NotFound"
          component={NotFoundScreen}
          options={{
            ...fadeScreenOptions,
            title: "Oops!",
            headerShown: true,
          }}
          listeners={{
            focus: () => setCurrentRoute("NotFound"),
          }}
        />

        <Stack.Screen
          name="PDFViewerScreen"
          component={PDFViewerScreen}
          options={{
            ...modalScreenOptions,
            presentation: "card",
          }}
          listeners={{
            focus: () => setCurrentRoute("PDFViewerScreen"),
          }}
        />

        <Stack.Screen
          name="brouillon"
          component={BrouillonScreen}
          options={{
            ...headerScreenOptions,
            headerTitle: () => (
              <Text
                style={{ color: "white", fontSize: 16, fontWeight: "bold" }}
              >
                Brouillons
              </Text>
            ),
            headerLeft: () => (
              <MaterialCommunityIcons
                name="arrow-left-circle"
                size={30}
                color="white"
                style={{ marginLeft: 15 }}
                onPress={() => navigation.goBack()}
              />
            ),
          }}
          listeners={{
            focus: () => setCurrentRoute("brouillon"),
          }}
        />

        <Stack.Screen
          name="brouillon_cmd"
          component={DraftCommandeScreen}
          options={{
            ...modalScreenOptions,
          }}
          listeners={{
            focus: () => setCurrentRoute("brouillon_cmd"),
          }}
        />
      </Stack.Navigator>
      <ConnectionManager currentRoute={currentRoute} navigation={navigation} />
    </View>
  );
}

function SideBar({ navigation }) {
  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          width: "70%",
        },
      }}
    >
      <Drawer.Screen name="Dashboard" component={Dashboard} />
      {/* Ajoutez d'autres écrans au besoin */}
    </Drawer.Navigator>
  );
}

// Ajoutez les styles à la fin du fichier
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  userSection: {
    padding: moderateScale(20),
    backgroundColor: "#00b9d5",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 25,
  },
  avatar: {
    backgroundColor: "#008596",
  },
  userInfo: {
    marginLeft: horizontalScale(15),
  },
  userName: {
    color: "white",
    fontSize: moderateScale(18),
    fontWeight: "bold",
  },
  userEmail: {
    color: "rgba(255,255,255,0.8)",
    fontSize: moderateScale(14),
  },
  separator: {
    height: 2,
    backgroundColor: "#E5E9F0",
  },
  menuItems: {
    flex: 1,
    padding: moderateScale(10),
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: verticalScale(12),
    paddingHorizontal: horizontalScale(20),
    borderRadius: moderateScale(10),
    marginBottom: verticalScale(5),
  },
  menuItemText: {
    marginLeft: horizontalScale(20),
    fontSize: moderateScale(16),
    color: "#333",
  },
  versionContainer: {
    padding: moderateScale(20),
    alignItems: "center",
  },
  versionText: {
    color: "#999",
    fontSize: moderateScale(12),
  },
});
