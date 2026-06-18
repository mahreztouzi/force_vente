import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from "react-native";
import React from "react";
import { Card } from "react-native-elements";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTaskContext } from "../context/taskContext";
import {
  horizontalScale,
  verticalScale,
  moderateScale,
} from "../constants/Scale";

const Projectitem = ({ item }) => {
  const navigation = useNavigation();
  const { setSelectedProject } = useTaskContext();
  console.log("item dans projet item", item.id);
  function formatCustomDate(dateString) {
    const date = new Date(dateString);
    const jours = date.getDate().toString().padStart(2, "0"); // Jour à 2 chiffres
    const mois = date.toLocaleString("fr-FR", { month: "long" }); // Mois en toutes lettres
    const annee = date.getFullYear(); // Année à 4 chiffres

    return `${jours} ${mois} ${annee}`;
  }
  return (
    <Pressable
      onPress={() => {
        setSelectedProject(item.id);
        navigation.navigate("Project-details", { projet: item });
      }}
    >
      <Card containerStyle={styles.cardContainer}>
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <View>
            <Text style={styles.projectTitle}>{item.nom_projet}</Text>
            <Text style={styles.projectDescription}>{item.description}</Text>
          </View>
          <View>
            <Text style={styles.projectDescription}>
              {formatCustomDate(item.date_debut)}
            </Text>
          </View>
        </View>

        {/* Espace de 3 lignes */}
        <View style={{ height: 30 }} />

        <View
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            flexWrap: "nowrap",
            width: "97%",
          }}
        >
          <View style={styles.modulesContainer}>
            {Array.isArray(item.modules) &&
              item.modules.map((module, index) => (
                <Text key={index} style={styles.moduleTag}>
                  {module.code}
                </Text>
              ))}
          </View>
          <View>
            <MaterialCommunityIcons
              name="arrow-right-circle"
              size={30}
              color="#5883C9"
            />
          </View>
        </View>
      </Card>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 10,
    marginBottom: 15,
    padding: 15,
    elevation: 5,
    shadowColor: "#BCC1D1",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 5,
  },
  projectTitle: {
    fontSize: moderateScale(18),
    fontWeight: 500,
    marginBottom: 5,
    color: "#333",
  },
  projectDescription: {
    fontSize: moderateScale(12),
    color: "#555",
  },
  modulesContainer: {
    flexDirection: "row",
    flexWrap: "no-wrap",
    width: "80%",
    overflow: "hidden",
  },
  moduleTag: {
    // backgroundColor: "#e91e63",
    color: "black",
    paddingVertical: verticalScale(3),
    borderWidth: 1,
    paddingHorizontal: horizontalScale(12),
    borderRadius: moderateScale(20),
    marginRight: horizontalScale(5),
    marginBottom: verticalScale(5),
    fontSize: moderateScale(14),
  },
});

export default Projectitem;
