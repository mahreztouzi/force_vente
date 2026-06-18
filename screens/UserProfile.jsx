import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Avatar } from "react-native-elements";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  moderateScale,
  verticalScale,
  horizontalScale,
} from "../constants/Scale";
import { useNavigation } from "@react-navigation/native";

const UserProfile = () => {
  const navigation = useNavigation();

  // Fonction de déconnexion
  const handleLogout = async () => {
    try {
      // Supprimer le token de AsyncStorage
      await AsyncStorage.removeItem("username");

      // Afficher un message de succès ou une alerte
      Alert.alert("Déconnexion", "Vous avez été déconnecté avec succès.");

      // Rediriger l'utilisateur vers la page de connexion (ou autre page)
      navigation.replace("Login"); // Remplacer "Login" par le nom de la page de connexion
    } catch (error) {
      console.error("Erreur lors de la déconnexion : ", error);
      Alert.alert("Erreur", "Une erreur est survenue lors de la déconnexion.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Avatar
          size={moderateScale(100)}
          rounded
          title="AB"
          containerStyle={styles.avatar}
          titleStyle={styles.avatarTitle}
        />
        <View style={styles.nameContainer}>
          <Text style={styles.fullName}>Test User</Text>
          <View style={styles.roleContainer}>
            <MaterialCommunityIcons
              name="account"
              size={moderateScale(18)}
              color="#5883C9"
            />
            <Text style={styles.roleText}>Utilisateur</Text>
          </View>
        </View>
      </View>

      {/* Status */}
      <View style={styles.statusSection}>
        <View style={styles.statusBadge}>
          <MaterialCommunityIcons
            name="check-circle"
            size={moderateScale(18)}
            color="#4CAF50"
          />
          <Text style={styles.statusText}>Compte actif</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* User Information */}
      <View style={styles.infoSection}>
        <ProfileItem
          icon="account-circle"
          label="Nom d'utilisateur"
          value="testuser"
        />
        <ProfileItem icon="email" label="Email" value="testuser@example.com" />
        <ProfileItem icon="identifier" label="ID Utilisateur" value="#12345" />
        <ProfileItem
          icon="clock-check"
          label="Première connexion"
          value="Oui"
        />
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleLogout}
        accessible={true}
        accessibilityLabel="Bouton de déconnexion"
      >
        <Text style={styles.buttonText}>Déconnexion</Text>
      </TouchableOpacity>
    </View>
  );
};

const ProfileItem = ({ icon, label, value }) => (
  <View style={styles.infoItem}>
    <MaterialCommunityIcons name={icon} size={moderateScale(20)} color="#333" />
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: moderateScale(16),
  },
  header: {
    flexDirection: "column",
    alignItems: "center",
    marginTop: verticalScale(30),
    marginBottom: verticalScale(30),
  },
  avatar: {
    backgroundColor: "#5883C9",
  },
  avatarTitle: {
    fontSize: moderateScale(36),
    fontWeight: "bold",
  },
  nameContainer: {
    marginTop: verticalScale(12),
    alignItems: "center",
  },
  fullName: {
    fontSize: moderateScale(24),
    fontWeight: "bold",
    color: "#333333",
    textTransform: "capitalize",
    marginBottom: verticalScale(4),
  },
  roleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  roleText: {
    marginLeft: horizontalScale(8),
    fontSize: moderateScale(16),
    fontWeight: "500",
    color: "#5883C9",
  },
  statusSection: {
    marginBottom: verticalScale(12),
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: verticalScale(8),
    paddingHorizontal: horizontalScale(16),
    borderRadius: moderateScale(12),
    backgroundColor: "#E8F5E9",
  },
  statusText: {
    marginLeft: horizontalScale(8),
    fontSize: moderateScale(16),
    fontWeight: "500",
    color: "#4CAF50",
  },
  divider: {
    height: verticalScale(1),
    backgroundColor: "#E0E0E0",
    marginVertical: verticalScale(16),
  },
  infoSection: {
    gap: verticalScale(12),
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoContent: {
    marginLeft: horizontalScale(12),
    flex: 1,
  },
  infoLabel: {
    fontSize: moderateScale(14),
    color: "#666666",
  },
  infoValue: {
    fontSize: moderateScale(16),
    fontWeight: "500",
    color: "#333333",
  },
  button: {
    backgroundColor: "#E85738",
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(8),
    alignItems: "center",
    marginTop: verticalScale(20),
  },
  buttonText: {
    fontSize: moderateScale(16),
    color: "#FFFFFF",
    fontWeight: "600",
  },
});

export default UserProfile;
