// import React from "react";
// import { View, Text, StyleSheet } from "react-native";
// import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

// const WelcomeDashboardSection = ({ user, tasks }) => {
//   // Obtenir l'heure actuelle
//   const currentHour = new Date().getHours();

//   // Déterminer la salutation en fonction de l'heure
//   const getGreeting = () => {
//     if (currentHour < 12) return "Bonjour";
//     if (currentHour < 18) return "Bon après-midi";
//     return "Bonsoir";
//   };

//   // Calculer le nombre de projets actifs
//   const activeProjects = tasks ? tasks.length : 0;

//   return (
//     <View style={styles.container}>
//       <View style={styles.welcomeHeader}>
//         <MaterialCommunityIcons
//           name="checkbox-marked-circle-outline"
//           size={24}
//           color="#5883C9"
//         />
//         <Text style={styles.welcomeText}>
//           {getGreeting()},{" "}
//           <Text style={styles.userName}>
//             {user?.nom_utilisateur || "Utilisateur"}
//           </Text>
//         </Text>
//       </View>

//       <View style={styles.statsContainer}>
//         <View style={styles.statCard}>
//           <MaterialCommunityIcons
//             name="folder-multiple"
//             size={24}
//             color="#5883C9"
//           />
//           <View style={styles.statInfo}>
//             <Text style={styles.statNumber}>{activeProjects}</Text>
//             <Text style={styles.statLabel}>Projets actifs</Text>
//           </View>
//         </View>

//         <View style={styles.separator} />

//         <View style={styles.statCard}>
//           <MaterialCommunityIcons
//             name={user?.role === "admin" ? "shield-account" : "account"}
//             size={24}
//             color={user?.role === "admin" ? "#84BB62" : "#5883C9"}
//           />
//           <View style={styles.statInfo}>
//             <Text style={styles.statNumber}>
//               {user?.role === "admin" ? "Admin" : "User"}
//             </Text>
//             <Text style={styles.statLabel}>Status</Text>
//           </View>
//         </View>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: "#fff",
//     padding: 20,
//     marginBottom: 10,
//     borderRadius: 10,
//     elevation: 2,
//     margin: 15,
//   },
//   welcomeHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 20,
//   },
//   welcomeText: {
//     fontSize: 18,
//     marginLeft: 10,
//     color: "#333",
//   },
//   userName: {
//     fontWeight: "bold",
//     color: "#5883C9",
//   },
//   statsContainer: {
//     flexDirection: "row",
//     justifyContent: "space-around",
//     alignItems: "center",
//     backgroundColor: "#f8f9fa",
//     borderRadius: 8,
//     padding: 15,
//   },
//   statCard: {
//     flexDirection: "row",
//     alignItems: "center",
//     flex: 1,
//     justifyContent: "center",
//   },
//   statInfo: {
//     marginLeft: 10,
//   },
//   statNumber: {
//     fontSize: 16,
//     fontWeight: "bold",
//     color: "#333",
//   },
//   statLabel: {
//     fontSize: 12,
//     color: "#666",
//   },
//   separator: {
//     width: 1,
//     height: "100%",
//     backgroundColor: "#ddd",
//     marginHorizontal: 15,
//   },
// });

// export default WelcomeDashboardSection;

// import React from "react";
// import { View, Text, StyleSheet, TextInput } from "react-native";
// import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

// const WelcomeDashboardSection = ({ user, tasks }) => {
//   const currentHour = new Date().getHours();

//   const getGreeting = () => {
//     if (currentHour < 12) return "Bonjour";
//     if (currentHour < 18) return "Bon après-midi";
//     return "Bonsoir";
//   };

//   const activeProjects = tasks ? tasks.length : 0;

//   return (
//     <View style={styles.container}>
//       <View style={styles.row}>
//         <View style={styles.welcomeSection}>
//           <MaterialCommunityIcons name="hand-wave" size={22} color="#4A90E2" />
//           <Text style={styles.greeting}>
//             {getGreeting()},{" "}
//             <Text style={styles.name}>
//               {user?.nom_utilisateur || "Utilisateur"}
//             </Text>
//           </Text>
//         </View>
//         <View style={styles.badge}>
//           <MaterialCommunityIcons
//             name="folder-multiple"
//             size={18}
//             color="#4A90E2"
//           />
//           <Text style={styles.statNumber}>{activeProjects}</Text>
//         </View>
//       </View>

//       {/* Nouveau champ de recherche */}
//       <View style={styles.searchContainer}>
//         <MaterialCommunityIcons
//           name="magnify"
//           size={20}
//           color="#64748B"
//           style={styles.searchIcon}
//         />
//         <TextInput
//           style={styles.searchInput}
//           placeholder="Rechercher une mission..."
//           placeholderTextColor="#64748B"
//         />
//       </View>

//       {/* <View style={styles.statsRow}>
//         <View style={styles.statItem}>
//           <MaterialCommunityIcons
//             name="folder-multiple"
//             size={18}
//             color="#4A90E2"
//           />
//           <Text style={styles.statNumber}>{activeProjects}</Text>
//           <Text style={styles.statLabel}>Projets actifs</Text>
//         </View>

//         <View style={styles.divider} />

//         <View style={styles.statItem}>
//           <MaterialCommunityIcons
//             name="clock-outline"
//             size={18}
//             color="#4A90E2"
//           />
//           <Text style={styles.statNumber}>
//             {new Date().toLocaleTimeString().slice(0, 5)}
//           </Text>
//           <Text style={styles.statLabel}>Heure locale</Text>
//         </View>
//       </View> */}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: "#FFFFFF",
//     borderRadius: 12,
//     padding: 16,
//     margin: 12,
//   },
//   row: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 12,
//   },
//   welcomeSection: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//   },
//   greeting: {
//     fontSize: 15,
//     color: "#333",
//   },
//   name: {
//     fontWeight: "600",
//     color: "#4A90E2",
//   },
//   badge: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#F5F8FF",
//     paddingVertical: 4,
//     paddingHorizontal: 8,
//     borderRadius: 6,
//     gap: 4,
//   },
//   badgeText: {
//     fontSize: 13,
//     fontWeight: "500",
//   },
//   // Styles pour le champ de recherche
//   searchContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#F8FAFC",
//     borderRadius: 15,
//     paddingHorizontal: 14,
//     paddingVertical: 10,
//     marginBottom: 12,
//     borderWidth: 1,
//     borderColor: "#E5E9F0",
//   },
//   searchIcon: {
//     marginRight: 8,
//   },
//   searchInput: {
//     flex: 1,
//     paddingVertical: 8,
//     fontSize: 14,
//     color: "#2C3E50",
//   },
//   statsRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-around",
//     backgroundColor: "#F8FAFC",
//     borderRadius: 8,
//     paddingVertical: 12,
//   },
//   statItem: {
//     alignItems: "center",
//     flex: 1,
//   },
//   divider: {
//     width: 1,
//     height: 30,
//     backgroundColor: "#E5E9F0",
//   },
//   statNumber: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#2C3E50",
//     marginTop: 4,
//   },
//   statLabel: {
//     fontSize: 12,
//     color: "#64748B",
//     marginTop: 2,
//   },
// });

// export default WelcomeDashboardSection;

import React from "react";
import { View, Text, StyleSheet, TextInput } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import {
  horizontalScale,
  verticalScale,
  moderateScale,
} from "../constants/Scale";

const WelcomeDashboardSection = ({ user, tasks }) => {
  const currentHour = new Date().getHours();

  const getGreeting = () => {
    if (currentHour < 12) return "Bonjour";
    if (currentHour < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  const activeProjects = tasks ? tasks.length : 0;

  return (
    <View style={styles.container}>
      {/* Section d'accueil */}
      <View style={styles.row}>
        <View style={styles.welcomeSection}>
          <MaterialCommunityIcons
            name="hand-wave"
            size={moderateScale(22)}
            color="#4A90E2"
          />
          <Text style={styles.greeting}>
            {getGreeting()},{" "}
            <Text style={styles.name}>
              {user?.nom} {user?.prenom}
            </Text>
          </Text>
        </View>
        <View style={styles.badge}>
          <MaterialCommunityIcons
            name="folder-multiple"
            size={moderateScale(18)}
            color="#4A90E2"
          />
          <Text style={styles.statNumber}>{activeProjects}</Text>
        </View>
      </View>

      {/* Champ de recherche */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons
          name="magnify"
          size={moderateScale(20)}
          color="#64748B"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une mission..."
          placeholderTextColor="#64748B"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginHorizontal: horizontalScale(12),
    marginVertical: verticalScale(10),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: verticalScale(2) },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(4),
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(12),
  },
  welcomeSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: horizontalScale(8),
  },
  greeting: {
    fontSize: moderateScale(15),
    color: "#333",
    fontFamily: "poppins-regular",
  },
  name: {
    fontWeight: "600",
    color: "#4A90E2",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F8FF",
    paddingVertical: verticalScale(4),
    paddingHorizontal: horizontalScale(8),
    borderRadius: moderateScale(6),
    gap: horizontalScale(4),
  },
  badgeText: {
    fontSize: moderateScale(13),
    fontWeight: "500",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: moderateScale(15),
    paddingHorizontal: horizontalScale(14),
    paddingVertical: verticalScale(10),
    borderWidth: 1,
    borderColor: "#E5E9F0",
  },
  searchIcon: {
    marginRight: horizontalScale(8),
  },
  searchInput: {
    flex: 1,
    paddingVertical: verticalScale(8),
    fontSize: moderateScale(14),
    color: "#2C3E50",
    fontFamily: "poppins-regular",
  },
  statNumber: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: "#2C3E50",
    marginLeft: horizontalScale(4),
  },
});

export default WelcomeDashboardSection;
