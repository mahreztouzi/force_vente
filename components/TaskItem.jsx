import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import React, { useState, memo } from "react";
import { Card } from "react-native-elements";
import Collapsible from "react-native-collapsible";

const TaskItem = ({ item, index }) => {
  const [expandedItemId, setExpandedItemId] = useState(null);
  const isCollapsed = expandedItemId !== index;

  function formatCustomDate(dateString) {
    const date = new Date(dateString);
    console.log(dateString);

    const jours = date.getDate().toString().padStart(2, "0"); // Jour à 2 chiffres
    const mois = date.toLocaleString("fr-FR", { month: "long" }); // Mois en toutes lettres
    const annee = date.getFullYear(); // Année à 4 chiffres

    return `${jours} ${mois} ${date.getFullYear()}`;
  }

  return (
    <Card containerStyle={styles.cardContainer}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => {
          setExpandedItemId(isCollapsed ? index : null); // Basculer l'état
        }}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.moduleName}>{item.Module.code}</Text>
          <Text style={styles.missionTitle}>{item.Phase.nom_phase}</Text>
          <Text>{formatCustomDate(item.date)}</Text>
          <Text
            style={{
              fontWeight: "bold",
              fontSize: 16,
            }}
          >
            {item.heures} h
          </Text>
          {/* <MaterialCommunityIcons name="briefcase" size={24} color="#555" /> */}
        </View>
        <Collapsible collapsed={isCollapsed}>
          <View
            style={{
              margin: 10,
              padding: 10,
              backgroundColor: "rgba(232, 237, 243, 0.43)",
              borderRadius: 10,
            }}
          >
            <Text>{item.description}</Text>
          </View>
        </Collapsible>
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 8,
    // elevation: 3,
    padding: 15,
    backgroundColor: "#FFF",
    position: "relative",
    margin: 0,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // marginBottom: 10,
  },
  moduleName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#5883C9",
    backgroundColor: "rgba(175, 195, 220, 0.45)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  missionTitle: {
    fontSize: 14,
    color: "#555",
    textAlign: "start",
  },
  hoursWorked: {
    fontSize: 14,
    // fontWeight: "bold",
    color: "#666",
  },
  description: {
    fontSize: 12,
    fontWeight: "condensed",
    color: "#666",
  },
});

export default memo(TaskItem);
