// import AsyncStorage from "@react-native-async-storage/async-storage";
// import axios from "axios";
// import React, { useState } from "react";
// import {
//   Modal,
//   View,
//   Text,
//   TextInput,
//   StyleSheet,
//   TouchableOpacity,
//   ScrollView,
// } from "react-native";
// import RNPickerSelect from "react-native-picker-select";
// import { useTaskContext } from "../context/taskContext";

// const CreateTaskModale = ({ visible, onClose, data }) => {
//   const [selectedModule, setSelectedModule] = useState(null);
//   const [selectedMission, setSelectedMission] = useState(null);
//   const [hours, setHours] = useState("");
//   const [description, setDescription] = useState("");
//   const { loadTask } = useTaskContext();

//   const handleSave = async () => {
//     if (!selectedModule || !selectedMission || !hours || !description) {
//       alert("Veuillez remplir tous les champs.");
//       return;
//     }

//     // Enregistrez les données ici
//     console.log({
//       mission_id: selectedMission,
//       heures: hours,
//       description: description,
//     });
//     try {
//       const storedUser = JSON.parse(await AsyncStorage.getItem("user"));
//       if (storedUser && storedUser.token) {
//         const response = await axios.post(
//           // "http://192.168.1.9:8080/hour",
//           "http://192.168.0.105:8080/hour",
//           {
//             mission_id: selectedMission,
//             heures: hours,
//             description: description,
//           },
//           {
//             headers: { Authorization: `Bearer ${storedUser.token}` },
//           }
//         );
//       }
//       alert("Tâche ajouté avec succées.");
//       setSelectedModule(null);
//       setSelectedMission(null);
//       setHours("");
//       setDescription("");
//       loadTask();
//     } catch (error) {
//       // Gestion des erreurs
//       console.error(error);
//       alert("Erreur server.");
//     } finally {
//       onClose();
//     }
//   };

//   return (
//     <Modal
//       animationType="fade"
//       transparent={true}
//       visible={visible}
//       onRequestClose={onClose}
//     >
//       <View style={styles.modalOverlay}>
//         <View style={styles.modalContent}>
//           <ScrollView>
//             <Text style={styles.modalTitle}>Créer une Tâche</Text>

//             {/* Sélecteur de modules */}
//             <Text style={styles.label}>Sélectionnez un module :</Text>
//             <RNPickerSelect
//               items={data.modules?.map((module)=>{return module.)}
//               onValueChange={(value) => {
//                 setSelectedModule(value);
//                 setSelectedMission(null); // Réinitialiser la mission
//               }}
//               placeholder={{ label: "Choisissez un module", value: null }}
//               value={selectedModule}
//               style={pickerStyles}
//             />

//             {/* Sélecteur de missions (dépendant des modules) */}
//             <Text style={styles.label}>Sélectionnez une mission :</Text>
//             <RNPickerSelect
//               onValueChange={(value) => setSelectedMission(value)}
//               items={missions[selectedModule] || []} // Missions dépendant du module sélectionné
//               placeholder={{ label: "Choisissez une mission", value: null }}
//               value={selectedMission}
//               style={pickerStyles}
//               disabled={!selectedModule} // Désactiver si aucun module sélectionné
//             />

//             {/* Champ pour le nombre d'heures */}
//             <Text style={styles.label}>Nombre d'heures :</Text>
//             <TextInput
//               style={styles.input}
//               keyboardType="numeric"
//               placeholder="Saisissez le nombre d'heures"
//               value={hours}
//               onChangeText={(text) => setHours(text)}
//             />

//             {/* Zone de texte pour la description */}
//             <Text style={styles.label}>Description :</Text>
//             <TextInput
//               style={[styles.input, styles.textArea]}
//               placeholder="Saisissez une description"
//               value={description}
//               onChangeText={(text) => setDescription(text)}
//               multiline={true}
//               numberOfLines={4}
//             />

//             {/* Boutons */}
//             <View style={styles.buttonContainer}>
//               <TouchableOpacity style={[styles.cancelButton]} onPress={onClose}>
//                 <Text style={styles.cancelButtonText}>Annuler</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[styles.button, styles.saveButton]}
//                 onPress={handleSave}
//               >
//                 <Text style={styles.saveButtonText}>Enregistrer</Text>
//               </TouchableOpacity>
//             </View>
//           </ScrollView>
//         </View>
//       </View>
//     </Modal>
//   );
// };

// const styles = StyleSheet.create({
//   modalOverlay: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "rgba(0, 0, 0, 0.5)",
//   },
//   modalContent: {
//     width: "90%",
//     backgroundColor: "white",
//     borderRadius: 10,
//     padding: 20,
//     elevation: 5,
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: "bold",
//     textAlign: "center",
//     marginBottom: 20,
//   },
//   label: {
//     fontSize: 16,
//     marginBottom: 8,
//   },
//   input: {
//     height: 40,
//     borderColor: "#ccc",
//     borderWidth: 1,
//     borderRadius: 5,
//     paddingHorizontal: 10,
//     marginBottom: 15,
//   },
//   textArea: {
//     height: 100,
//     textAlignVertical: "top",
//   },
//   buttonContainer: {
//     flexDirection: "column-reverse",
//     justifyContent: "center",
//     gap: 5,
//     marginTop: 20,
//   },
//   button: {
//     flex: 1,
//     alignItems: "center",
//     padding: 10,
//     borderRadius: 5,
//     marginHorizontal: 5,
//   },
//   cancelButton: {
//     backgroundColor: "transparent",
//     flex: 1,
//     alignItems: "center",
//     padding: 10,
//     borderRadius: 5,
//     marginHorizontal: 5,
//   },
//   saveButton: {
//     backgroundColor: "#5883C9",
//   },
//   saveButtonText: {
//     color: "white",
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   cancelButtonText: {
//     color: "#5883C9",
//     fontSize: 16,
//     fontWeight: "bold",
//   },
// });

// const pickerStyles = {
//   inputIOS: {
//     height: 60,
//     borderColor: "#ccc",
//     borderWidth: 1,
//     borderRadius: 5,
//     paddingHorizontal: 10,
//     marginBottom: 15,
//   },
//   inputAndroid: {
//     height: 60,
//     borderColor: "#ccc",
//     borderWidth: 1,
//     borderRadius: 5,
//     paddingHorizontal: 10,
//     marginBottom: 15,
//   },
// };

// export default CreateTaskModale;

// import AsyncStorage from "@react-native-async-storage/async-storage";
// import axios from "axios";
// import React, { useEffect, useState } from "react";
// import {
//   Modal,
//   View,
//   Text,
//   TextInput,
//   StyleSheet,
//   TouchableOpacity,
//   ScrollView,
// } from "react-native";
// import RNPickerSelect from "react-native-picker-select";
// import { useTaskContext } from "../context/taskContext";
// import { getAllPhases } from "../services/projet.service";

// const CreateTaskModal = ({ visible, onClose, data }) => {
//   const [selectedModule, setSelectedModule] = useState(null);
//   const [selectedPhase, setSelectedPhase] = useState(null);
//   const [phases, setPhases] = useState([]);
//   const [hours, setHours] = useState("");
//   const [description, setDescription] = useState("");
//   const [selectedLocation, setSelectedLocation] = useState(null);
//   const { loadTask } = useTaskContext();

//   const today = new Date().toISOString().split("T")[0]; // Format 'YYYY-MM-DD'

//   useEffect(() => {
//     const fetchPhases = async () => {
//       const data = await getAllPhases();
//       console.log("phase projet", data);
//       setPhases(data);
//     };
//     fetchPhases();
//   }, []);

//   // Transform modules data for RNPickerSelect
//   const moduleItems =
//     data?.modules?.map((module) => ({
//       label: module.code,
//       value: module.id,
//     })) || [];

//   const phaseItems = phases.map((phase) => ({
//     label: phase.nom_phase,
//     value: phase.id,
//     description: phase.description,
//   }));

//   // Location options
//   const locationItems = [
//     { label: "Site client", value: "Site client" },
//     { label: "À domicile", value: "A domicile" },
//     { label: "BI2S", value: "BI2S" },
//   ];

//   const handleSave = async () => {
//     if (
//       !selectedModule ||
//       !selectedLocation ||
//       !selectedPhase ||
//       !hours ||
//       !description
//     ) {
//       alert("Veuillez remplir tous les champs.");
//       return;
//     }

//     try {
//       const storedUser = JSON.parse(await AsyncStorage.getItem("user"));
//       if (storedUser && storedUser.token) {
//         const response = await axios.post(
//           "https://mahrez.alwaysdata.net/hour",
//           {
//             utilisateur_id: storedUser.utilisateur.id,
//             id_phase: selectedPhase,
//             id_module: selectedModule,
//             heures: hours,
//             description: description,
//             id_projet: data.id, // Add project ID from the data props
//             lieu: selectedLocation,
//             date: today,
//           },
//           {
//             headers: { Authorization: `Bearer ${storedUser.token}` },
//           }
//         );
//       }
//       alert("Tâche ajoutée avec succès.");
//       setSelectedModule(null);
//       setSelectedPhase(null);
//       setHours("");
//       setDescription("");
//       loadTask();
//     } catch (error) {
//       console.error(error);
//       alert("Erreur serveur.");
//     } finally {
//       onClose();
//     }
//   };

//   return (
//     <Modal
//       animationType="fade"
//       transparent={true}
//       visible={visible}
//       onRequestClose={onClose}
//     >
//       <View style={styles.modalOverlay}>
//         <View style={styles.modalContent}>
//           <ScrollView>
//             <Text style={styles.modalTitle}>Créer une Tâche</Text>

//             {/* Project Info
//             <Text style={styles.projectInfo}>
//               Projet: {data.nom_projet}
//               {"\n"}Client: {data.Client.nom} {data.Client.prenom}
//             </Text> */}

//             {/* Module Selector */}
//             <Text style={styles.label}>Module :</Text>
//             <RNPickerSelect
//               items={moduleItems}
//               onValueChange={(value) => {
//                 setSelectedModule(value);
//               }}
//               placeholder={{ label: "Choisissez un module", value: null }}
//               value={selectedModule}
//               style={pickerStyles}
//             />

//             {/* Phase Selector */}
//             <Text style={styles.label}>Phase :</Text>
//             <RNPickerSelect
//               onValueChange={(value) => setSelectedPhase(value)}
//               items={phaseItems}
//               placeholder={{ label: "Sélectionnez une phase", value: null }}
//               value={selectedPhase}
//               style={pickerStyles}
//             />

//             {/* Location Selector */}
//             <Text style={styles.label}>Lieu :</Text>
//             <RNPickerSelect
//               onValueChange={(value) => setSelectedLocation(value)}
//               items={locationItems}
//               placeholder={{ label: "Sélectionnez un lieu", value: null }}
//               value={selectedLocation}
//               style={pickerStyles}
//             />

//             {/* Hours Input */}
//             <Text style={styles.label}>Nombre d'heures :</Text>
//             <TextInput
//               style={styles.input}
//               keyboardType="numeric"
//               placeholder="Saisissez le nombre d'heures"
//               value={hours}
//               onChangeText={setHours}
//             />

//             {/* Description Input */}
//             <Text style={styles.label}>Description :</Text>
//             <TextInput
//               style={[styles.input, styles.textArea]}
//               placeholder="Saisissez une description"
//               value={description}
//               onChangeText={setDescription}
//               multiline={true}
//               numberOfLines={4}
//             />

//             {/* Buttons */}
//             <View style={styles.buttonContainer}>
//               <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
//                 <Text style={styles.cancelButtonText}>Annuler</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[styles.button, styles.saveButton]}
//                 onPress={handleSave}
//               >
//                 <Text style={styles.saveButtonText}>Enregistrer</Text>
//               </TouchableOpacity>
//             </View>
//           </ScrollView>
//         </View>
//       </View>
//     </Modal>
//   );
// };

// const styles = StyleSheet.create({
//   modalOverlay: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "rgba(0, 0, 0, 0.5)",
//   },
//   modalContent: {
//     width: "90%",
//     backgroundColor: "white",
//     borderRadius: 10,
//     padding: 20,
//     elevation: 5,
//     maxHeight: "80%",
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: "bold",
//     textAlign: "center",
//     marginBottom: 20,
//   },
//   projectInfo: {
//     fontSize: 14,
//     marginBottom: 15,
//     color: "#666",
//     backgroundColor: "#f5f5f5",
//     padding: 10,
//     borderRadius: 5,
//   },
//   label: {
//     fontSize: 16,
//     marginBottom: 8,
//   },
//   input: {
//     height: 40,
//     borderColor: "#ccc",
//     borderWidth: 1,
//     borderRadius: 5,
//     paddingHorizontal: 10,
//     marginBottom: 15,
//   },
//   textArea: {
//     height: 100,
//     textAlignVertical: "top",
//   },
//   buttonContainer: {
//     flexDirection: "column-reverse",
//     justifyContent: "center",
//     gap: 5,
//     marginTop: 20,
//   },
//   button: {
//     flex: 1,
//     alignItems: "center",
//     padding: 10,
//     borderRadius: 5,
//     marginHorizontal: 5,
//   },
//   cancelButton: {
//     backgroundColor: "transparent",
//     flex: 1,
//     alignItems: "center",
//     padding: 10,
//     borderRadius: 5,
//     marginHorizontal: 5,
//   },
//   saveButton: {
//     backgroundColor: "#5883C9",
//   },
//   saveButtonText: {
//     color: "white",
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   cancelButtonText: {
//     color: "#5883C9",
//     fontSize: 16,
//     fontWeight: "bold",
//   },
// });

// const pickerStyles = {
//   inputIOS: {
//     height: 60,
//     borderColor: "#ccc",
//     borderWidth: 1,
//     borderRadius: 5,
//     paddingHorizontal: 10,
//     marginBottom: 15,
//   },
//   inputAndroid: {
//     height: 60,
//     borderColor: "#ccc",
//     borderWidth: 1,
//     borderRadius: 5,
//     paddingHorizontal: 10,
//     marginBottom: 15,
//   },
// };

// export default CreateTaskModal;

// import AsyncStorage from "@react-native-async-storage/async-storage";
// import axios from "axios";
// import React, { useEffect, useState, useMemo } from "react";
// import {
//   Modal,
//   View,
//   Text,
//   TextInput,
//   StyleSheet,
//   TouchableOpacity,
//   ScrollView,
//   Platform,
//   KeyboardAvoidingView,
// } from "react-native";
// import RNPickerSelect from "react-native-picker-select";
// import { useTaskContext } from "../context/taskContext";
// import { getAllPhases } from "../services/projet.service";

// const CreateTaskModal = ({ visible, onClose, data = {} }) => {
//   // États initiaux sécurisés
//   const [selectedModule, setSelectedModule] = useState(null);
//   const [selectedPhase, setSelectedPhase] = useState(null);
//   const [phases, setPhases] = useState([]);
//   const [hours, setHours] = useState("");
//   const [description, setDescription] = useState("");
//   const [selectedLocation, setSelectedLocation] = useState(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const { loadTask } = useTaskContext();

//   const today = new Date().toISOString().split("T")[0];

//   // Récupération des phases avec gestion d'erreurs
//   useEffect(() => {
//     const fetchPhases = async () => {
//       try {
//         const fetchedData = await getAllPhases();
//         if (fetchedData) {
//           setPhases(fetchedData);
//         }
//       } catch (error) {
//         console.error("Error fetching phases:", error);
//         setPhases([]);
//       }
//     };
//     fetchPhases();
//   }, []);

//   // Mémoisation des items pour éviter les re-renders inutiles
//   const moduleItems = useMemo(() => {
//     if (!data?.modules?.length) return [];
//     return data.modules.map((module) => ({
//       label: module.code || "",
//       value: module.id,
//     }));
//   }, [data?.modules]);

//   const phaseItems = useMemo(() => {
//     if (!phases?.length) return [];
//     return phases.map((phase) => ({
//       label: phase.nom_phase || "",
//       value: phase.id,
//       description: phase.description || "",
//     }));
//   }, [phases]);

//   const locationItems = [
//     { label: "Site client", value: "Site client" },
//     { label: "À domicile", value: "A domicile" },
//     { label: "BI2S", value: "BI2S" },
//   ];

//   const resetForm = () => {
//     setSelectedModule(null);
//     setSelectedPhase(null);
//     setHours("");
//     setDescription("");
//     setSelectedLocation(null);
//   };

//   const handleSave = async () => {
//     try {
//       if (isLoading) return;
//       setIsLoading(true);

//       // Validation des champs
//       if (
//         !selectedModule ||
//         !selectedLocation ||
//         !selectedPhase ||
//         !hours ||
//         !description
//       ) {
//         alert("Veuillez remplir tous les champs.");
//         return;
//       }

//       // Récupération et validation des données utilisateur
//       const storedUser = await AsyncStorage.getItem("user");
//       if (!storedUser) {
//         alert("Utilisateur non connecté");
//         return;
//       }

//       const userData = JSON.parse(storedUser);
//       if (!userData?.token || !userData?.utilisateur?.id) {
//         alert("Données utilisateur invalides");
//         return;
//       }

//       // Appel API
//       const response = await axios.post(
//         "https://mahrez.alwaysdata.net/hour",
//         {
//           utilisateur_id: userData.utilisateur.id,
//           id_phase: selectedPhase,
//           id_module: selectedModule,
//           heures: hours,
//           description: description,
//           id_projet: data?.id,
//           lieu: selectedLocation,
//           date: today,
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${userData.token}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       if (response?.data) {
//         alert("Tâche ajoutée avec succès.");
//         resetForm();
//         loadTask();
//         onClose();
//       }
//     } catch (error) {
//       console.error("Save error:", error);
//       alert(
//         error?.response?.data?.message || "Erreur lors de l'enregistrement."
//       );
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <Modal
//       animationType="fade"
//       transparent={true}
//       visible={visible}
//       onRequestClose={onClose}
//       statusBarTranslucent={true}
//     >
//       <KeyboardAvoidingView
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//         style={styles.modalOverlay}
//       >
//         <View style={styles.modalContent}>
//           <ScrollView
//             showsVerticalScrollIndicator={false}
//             keyboardShouldPersistTaps="handled"
//           >
//             <Text style={styles.modalTitle}>Créer une Tâche</Text>

//             <Text style={styles.label}>Module :</Text>
//             <RNPickerSelect
//               items={moduleItems}
//               onValueChange={setSelectedModule}
//               placeholder={{ label: "Choisissez un module", value: null }}
//               value={selectedModule}
//               style={pickerStyles}
//               useNativeAndroidPickerStyle={false}
//             />

//             <Text style={styles.label}>Phase :</Text>
//             <RNPickerSelect
//               items={phaseItems}
//               onValueChange={setSelectedPhase}
//               placeholder={{ label: "Sélectionnez une phase", value: null }}
//               value={selectedPhase}
//               style={pickerStyles}
//               useNativeAndroidPickerStyle={false}
//             />

//             <Text style={styles.label}>Lieu :</Text>
//             <RNPickerSelect
//               items={locationItems}
//               onValueChange={setSelectedLocation}
//               placeholder={{ label: "Sélectionnez un lieu", value: null }}
//               value={selectedLocation}
//               style={pickerStyles}
//               useNativeAndroidPickerStyle={false}
//             />

//             <Text style={styles.label}>Nombre d'heures :</Text>
//             <TextInput
//               style={styles.input}
//               keyboardType="numeric"
//               placeholder="Saisissez le nombre d'heures"
//               value={hours}
//               onChangeText={setHours}
//               maxLength={4}
//             />

//             <Text style={styles.label}>Description :</Text>
//             <TextInput
//               style={[styles.input, styles.textArea]}
//               placeholder="Saisissez une description"
//               value={description}
//               onChangeText={setDescription}
//               multiline={true}
//               numberOfLines={4}
//               textAlignVertical="top"
//             />

//             <View style={styles.buttonContainer}>
//               <TouchableOpacity
//                 style={styles.cancelButton}
//                 onPress={onClose}
//                 disabled={isLoading}
//               >
//                 <Text style={styles.cancelButtonText}>Annuler</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[
//                   styles.button,
//                   styles.saveButton,
//                   isLoading && styles.disabledButton,
//                 ]}
//                 onPress={handleSave}
//                 disabled={isLoading}
//               >
//                 <Text style={styles.saveButtonText}>
//                   {isLoading ? "Enregistrement..." : "Enregistrer"}
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           </ScrollView>
//         </View>
//       </KeyboardAvoidingView>
//     </Modal>
//   );
// };

// const styles = StyleSheet.create({
//   modalOverlay: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "rgba(0, 0, 0, 0.5)",
//     paddingHorizontal: 15,
//   },
//   modalContent: {
//     width: "100%",
//     backgroundColor: "white",
//     borderRadius: 10,
//     padding: 20,
//     maxHeight: "90%",
//     elevation: 5,
//     shadowColor: "#000",
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: "bold",
//     textAlign: "center",
//     marginBottom: 20,
//     color: "#333",
//   },
//   label: {
//     fontSize: 16,
//     marginBottom: 8,
//     color: "#333",
//     fontWeight: "500",
//   },
//   input: {
//     height: 40,
//     borderColor: "#ccc",
//     borderWidth: 1,
//     borderRadius: 5,
//     paddingHorizontal: 10,
//     marginBottom: 15,
//     backgroundColor: "#fff",
//   },
//   textArea: {
//     height: 100,
//     textAlignVertical: "top",
//     paddingTop: 10,
//   },
//   buttonContainer: {
//     flexDirection: "column-reverse",
//     justifyContent: "center",
//     gap: 10,
//     marginTop: 20,
//   },
//   button: {
//     alignItems: "center",
//     padding: 15,
//     borderRadius: 5,
//   },
//   cancelButton: {
//     backgroundColor: "transparent",
//     alignItems: "center",
//     padding: 15,
//     borderRadius: 5,
//   },
//   saveButton: {
//     backgroundColor: "#5883C9",
//   },
//   disabledButton: {
//     backgroundColor: "#94abd8",
//   },
//   saveButtonText: {
//     color: "white",
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   cancelButtonText: {
//     color: "#5883C9",
//     fontSize: 16,
//     fontWeight: "bold",
//   },
// });

// const pickerStyles = {
//   inputIOS: {
//     height: 40,
//     borderColor: "#ccc",
//     borderWidth: 1,
//     borderRadius: 5,
//     paddingHorizontal: 10,
//     marginBottom: 15,
//     backgroundColor: "#fff",
//   },
//   inputAndroid: {
//     height: 40,
//     borderColor: "#ccc",
//     borderWidth: 1,
//     borderRadius: 5,
//     paddingHorizontal: 10,
//     marginBottom: 15,
//     backgroundColor: "#fff",
//     color: "#333",
//   },
//   placeholder: {
//     color: "#999",
//   },
// };

// export default CreateTaskModal;

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  SafeAreaView,
  StatusBar,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import { useTaskContext } from "../context/taskContext";
import { getAllPhases } from "../services/projet.service";
import { Ionicons } from "@expo/vector-icons";

const CreateTaskScreen = ({ navigation, route }) => {
  const data = route.params?.data || {};

  // États initiaux
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [phases, setPhases] = useState([]);
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { loadTask } = useTaskContext();

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const fetchPhases = async () => {
      try {
        const fetchedData = await getAllPhases();
        if (fetchedData) {
          setPhases(fetchedData);
        }
      } catch (error) {
        console.error("Error fetching phases:", error);
        setPhases([]);
      }
    };
    fetchPhases();
  }, []);

  const moduleItems = useMemo(() => {
    if (!data?.modules?.length) return [];
    return data.modules.map((module) => ({
      label: module.code || "",
      value: module.id,
    }));
  }, [data?.modules]);

  const phaseItems = useMemo(() => {
    if (!phases?.length) return [];
    return phases.map((phase) => ({
      label: phase.nom_phase || "",
      value: phase.id,
      description: phase.description || "",
    }));
  }, [phases]);

  const locationItems = [
    { label: "Site client", value: "Site client" },
    { label: "À domicile", value: "A domicile" },
    { label: "BI2S", value: "BI2S" },
  ];

  const resetForm = () => {
    setSelectedModule(null);
    setSelectedPhase(null);
    setHours("");
    setDescription("");
    setSelectedLocation(null);
  };

  const handleSave = async () => {
    try {
      if (isLoading) return;
      setIsLoading(true);

      if (
        !selectedModule ||
        !selectedLocation ||
        !selectedPhase ||
        !hours ||
        !description
      ) {
        alert("Veuillez remplir tous les champs.");
        return;
      }

      const storedUser = await AsyncStorage.getItem("user");
      if (!storedUser) {
        alert("Utilisateur non connecté");
        return;
      }

      const userData = JSON.parse(storedUser);
      if (!userData?.token || !userData?.utilisateur?.id) {
        alert("Données utilisateur invalides");
        return;
      }

      const response = await axios.post(
        "https://mahrez.alwaysdata.net/hour",
        {
          utilisateur_id: userData.utilisateur.id,
          id_phase: selectedPhase,
          id_module: selectedModule,
          heures: hours,
          description: description,
          id_projet: data?.id,
          lieu: selectedLocation,
          date: today,
        },
        {
          headers: {
            Authorization: `Bearer ${userData.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response?.data) {
        alert("Tâche ajoutée avec succès.");
        resetForm();
        loadTask();
        navigation.goBack();
      }
    } catch (error) {
      console.error("Save error:", error);
      alert(
        error?.response?.data?.message || "Erreur lors de l'enregistrement."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Créer une Tâche</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Module :</Text>
        <RNPickerSelect
          items={moduleItems}
          onValueChange={setSelectedModule}
          placeholder={{ label: "Choisissez un module", value: null }}
          value={selectedModule}
          style={pickerStyles}
          useNativeAndroidPickerStyle={false}
        />

        <Text style={styles.label}>Phase :</Text>
        <RNPickerSelect
          items={phaseItems}
          onValueChange={setSelectedPhase}
          placeholder={{ label: "Sélectionnez une phase", value: null }}
          value={selectedPhase}
          style={pickerStyles}
          useNativeAndroidPickerStyle={false}
        />

        <Text style={styles.label}>Lieu :</Text>
        <RNPickerSelect
          items={locationItems}
          onValueChange={setSelectedLocation}
          placeholder={{ label: "Sélectionnez un lieu", value: null }}
          value={selectedLocation}
          style={pickerStyles}
          useNativeAndroidPickerStyle={false}
        />

        <Text style={styles.label}>Nombre d'heures :</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Saisissez le nombre d'heures"
          value={hours}
          onChangeText={setHours}
          maxLength={4}
        />

        <Text style={styles.label}>Description :</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Saisissez une description"
          value={description}
          onChangeText={setDescription}
          multiline={true}
          numberOfLines={4}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.disabledButton]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? "Enregistrement..." : "Enregistrer"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 60,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#333",
    fontWeight: "500",
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 10,
  },
  saveButton: {
    backgroundColor: "#5883C9",
    alignItems: "center",
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
    marginBottom: 30,
  },
  disabledButton: {
    backgroundColor: "#94abd8",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

const pickerStyles = {
  inputIOS: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  inputAndroid: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: "#fff",
    color: "#333",
  },
  placeholder: {
    color: "#999",
  },
};

export default CreateTaskScreen;
