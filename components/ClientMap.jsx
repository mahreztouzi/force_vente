// import React, { useState, useEffect } from "react";
// import {
//   View,
//   StyleSheet,
//   Alert,
//   Linking,
//   TouchableOpacity,
//   Text,
//   Dimensions,
//   Modal,
// } from "react-native";
// import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { MaterialIcons } from "@expo/vector-icons";

// const { width, height } = Dimensions.get("window");

// const ClientMap = ({ client }) => {
//   const [clientPosition, setClientPosition] = useState(null);
//   const [isFullScreen, setIsFullScreen] = useState(false);
//   const [selectedPosition, setSelectedPosition] = useState(null);

//   // Position par défaut (Alger, Algérie)
//   const defaultPosition = {
//     latitude: 36.7538,
//     longitude: 3.0588,
//     latitudeDelta: 0.0922,
//     longitudeDelta: 0.0421,
//   };

//   useEffect(() => {
//     loadClientPosition();
//   }, [client]);

//   const loadClientPosition = async () => {
//     try {
//       const key = `client_position_${client.kunnr}`;
//       const storedPosition = await AsyncStorage.getItem(key);
//       if (storedPosition) {
//         const position = JSON.parse(storedPosition);
//         setClientPosition(position);
//       }
//     } catch (error) {
//       console.error("Erreur lors du chargement de la position:", error);
//     }
//   };

//   const saveClientPosition = async (position) => {
//     try {
//       const key = `client_position_${client.kunnr}`;
//       await AsyncStorage.setItem(key, JSON.stringify(position));
//       setClientPosition(position);
//     } catch (error) {
//       console.error("Erreur lors de la sauvegarde:", error);
//       Alert.alert("Erreur", "Impossible de sauvegarder la position");
//     }
//   };

//   const handleMapLongPress = (event) => {
//     if (!isFullScreen) return;

//     const { coordinate } = event.nativeEvent;
//     setSelectedPosition(coordinate);
//     showConfirmationAlert(coordinate);
//   };

//   const showConfirmationAlert = (coordinate) => {
//     Alert.alert(
//       "Confirmer la position",
//       `Voulez-vous définir cette position comme emplacement du client ${client.name1} ?`,
//       [
//         {
//           text: "Annuler",
//           style: "cancel",
//           onPress: () => {
//             setSelectedPosition(null);
//           },
//         },
//         {
//           text: "Confirmer",
//           onPress: () => {
//             const newPosition = {
//               latitude: coordinate.latitude,
//               longitude: coordinate.longitude,
//               latitudeDelta: 0.0922,
//               longitudeDelta: 0.0421,
//             };
//             saveClientPosition(newPosition);
//             setSelectedPosition(null);
//             setIsFullScreen(false);
//           },
//         },
//       ]
//     );
//   };

//   const handleMarkerPress = () => {
//     if (!clientPosition) return;

//     const { latitude, longitude } = clientPosition;

//     Alert.alert(
//       "Ouvrir Google Maps",
//       `Choisissez une option pour ${client.name1}`,
//       [
//         {
//           text: "Annuler",
//           style: "cancel",
//         },
//         {
//           text: "Voir l'emplacement",
//           onPress: () => {
//             const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
//             Linking.openURL(googleMapsUrl).catch((err) => {
//               Alert.alert("Erreur", "Impossible d'ouvrir Google Maps");
//             });
//           },
//         },
//         {
//           text: "Itinéraire",
//           onPress: () => {
//             const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
//             Linking.openURL(directionsUrl).catch((err) => {
//               Alert.alert("Erreur", "Impossible d'ouvrir Google Maps");
//             });
//           },
//         },
//       ]
//     );
//   };

//   const handleDefinePosition = () => {
//     setIsFullScreen(true);
//   };

//   const handleCloseFullScreen = () => {
//     setIsFullScreen(false);
//     setSelectedPosition(null);
//   };

//   const renderNormalMap = () => {
//     if (clientPosition) {
//       return (
//         <View style={styles.container}>
//           <MapView
//             style={styles.map}
//             provider={PROVIDER_DEFAULT}
//             initialRegion={clientPosition}
//             showsUserLocation={false}
//             showsMyLocationButton={false}
//             scrollEnabled={false}
//             zoomEnabled={false}
//             pitchEnabled={false}
//             rotateEnabled={false}
//           >
//             <Marker
//               coordinate={{
//                 latitude: clientPosition.latitude,
//                 longitude: clientPosition.longitude,
//               }}
//               title={client.name1}
//               description="Cliquez pour les options Google Maps"
//               onPress={handleMarkerPress}
//             />
//           </MapView>
//           <TouchableOpacity
//             style={styles.editButton}
//             onPress={handleDefinePosition}
//           >
//             <MaterialIcons name="edit-location" size={20} color="#03A9F4" />
//           </TouchableOpacity>
//         </View>
//       );
//     }

//     return (
//       <View style={styles.emptyContainer}>
//         <View style={styles.emptyMapPlaceholder}>
//           <MaterialIcons name="location-off" size={48} color="#ccc" />
//           <Text style={styles.emptyText}>Position non définie</Text>
//           <TouchableOpacity
//             style={styles.defineButton}
//             onPress={handleDefinePosition}
//           >
//             <MaterialIcons name="add-location" size={20} color="white" />
//             <Text style={styles.defineButtonText}>Définir la position</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     );
//   };

//   const renderFullScreenMap = () => {
//     return (
//       <Modal
//         visible={isFullScreen}
//         animationType="slide"
//         statusBarTranslucent={true}
//       >
//         <View style={styles.fullScreenContainer}>
//           <View style={styles.fullScreenHeader}>
//             <TouchableOpacity
//               style={styles.closeButton}
//               onPress={handleCloseFullScreen}
//             >
//               <MaterialIcons name="close" size={24} color="white" />
//             </TouchableOpacity>
//             <Text style={styles.headerTitle}>
//               Définir la position de {client.name1}
//             </Text>
//           </View>

//           <MapView
//             provider={PROVIDER_DEFAULT}
//             style={styles.fullScreenMap}
//             initialRegion={clientPosition || defaultPosition}
//             showsUserLocation={true}
//             showsMyLocationButton={true}
//             onLongPress={handleMapLongPress}
//           >
//             {clientPosition && (
//               <Marker
//                 coordinate={{
//                   latitude: clientPosition.latitude,
//                   longitude: clientPosition.longitude,
//                 }}
//                 title={client.name1}
//                 pinColor="blue"
//               />
//             )}
//             {selectedPosition && (
//               <Marker
//                 coordinate={selectedPosition}
//                 title="Nouvelle position"
//                 pinColor="red"
//               />
//             )}
//           </MapView>

//           <View style={styles.instructionsContainer}>
//             <Text style={styles.instructionsText}>
//               Maintenez appuyé sur la carte pour définir la position du client
//             </Text>
//           </View>
//         </View>
//       </Modal>
//     );
//   };

//   return (
//     <>
//       {renderNormalMap()}
//       {renderFullScreenMap()}
//     </>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     marginHorizontal: 16,
//     marginVertical: 8,
//     borderRadius: 12,
//     overflow: "hidden",
//     position: "relative",
//   },
//   map: {
//     flex: 1,
//   },
//   editButton: {
//     position: "absolute",
//     top: 10,
//     right: 10,
//     backgroundColor: "white",
//     borderRadius: 20,
//     padding: 8,
//     shadowColor: "#000",
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   emptyContainer: {
//     flex: 1,
//     marginHorizontal: 16,
//     marginVertical: 8,
//     borderRadius: 12,
//     overflow: "hidden",
//   },
//   emptyMapPlaceholder: {
//     flex: 1,
//     backgroundColor: "#f5f5f5",
//     justifyContent: "center",
//     alignItems: "center",
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: "#e0e0e0",
//   },
//   emptyText: {
//     color: "#666",
//     fontSize: 16,
//     marginTop: 8,
//     marginBottom: 16,
//   },
//   defineButton: {
//     backgroundColor: "#03A9F4",
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 8,
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//   },
//   defineButtonText: {
//     color: "white",
//     fontSize: 14,
//     fontWeight: "500",
//   },
//   fullScreenContainer: {
//     flex: 1,
//     backgroundColor: "white",
//   },
//   fullScreenHeader: {
//     backgroundColor: "#03A9F4",
//     paddingTop: 40,
//     paddingHorizontal: 16,
//     paddingBottom: 16,
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 16,
//   },
//   closeButton: {
//     padding: 4,
//   },
//   headerTitle: {
//     color: "white",
//     fontSize: 18,
//     fontWeight: "500",
//     flex: 1,
//   },
//   fullScreenMap: {
//     flex: 1,
//   },
//   instructionsContainer: {
//     backgroundColor: "white",
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderTopWidth: 1,
//     borderTopColor: "#e0e0e0",
//   },
//   instructionsText: {
//     textAlign: "center",
//     color: "#666",
//     fontSize: 14,
//   },
// });

// export default ClientMap;

//  open street map
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Alert,
  Linking,
  TouchableOpacity,
  Text,
  Dimensions,
  Modal,
  Platform,
} from "react-native";
import { WebView } from "react-native-webview";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";

const { width, height } = Dimensions.get("window");

const ClientMap = ({ client }) => {
  const [clientPosition, setClientPosition] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const webViewRef = useRef(null); // Utiliser useRef au lieu de useState
  const [isLocating, setIsLocating] = useState(false);

  // Position par défaut (Alger, Algérie)
  const defaultPosition = {
    latitude: 36.7538,
    longitude: 3.0588,
  };

  useEffect(() => {
    loadClientPosition();
  }, [client]);

  const loadClientPosition = async () => {
    try {
      const key = `client_position_${client.kunnr}`;
      const storedPosition = await AsyncStorage.getItem(key);
      if (storedPosition) {
        const position = JSON.parse(storedPosition);
        setClientPosition(position);
      }
    } catch (error) {
      console.error("Erreur lors du chargement de la position:", error);
    }
  };

  const saveClientPosition = async (position) => {
    try {
      const key = `client_position_${client.kunnr}`;
      await AsyncStorage.setItem(key, JSON.stringify(position));
      setClientPosition(position);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      Alert.alert("Erreur", "Impossible de sauvegarder la position");
    }
  };

  const requestLocationPermission = async () => {
    try {
      // Vérifier d'abord le statut actuel
      let { status } = await Location.getForegroundPermissionsAsync();

      if (status !== "granted") {
        // Demander la permission
        const permission = await Location.requestForegroundPermissionsAsync();
        status = permission.status;
      }

      return status === "granted";
    } catch (err) {
      console.warn("Erreur lors de la demande de permission:", err);
      return false;
    }
  };

  const checkLocationEnabled = async () => {
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      return enabled;
    } catch (error) {
      console.error(
        "Erreur lors de la vérification des services de localisation:",
        error
      );
      return false;
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 15000,
        maximumAge: 10000,
      });
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error("Erreur lors de l'obtention de la position:", error);
      throw error;
    }
  };

  const handleMyLocation = async () => {
    setIsLocating(true);

    try {
      // Vérifier la permission
      const hasPermission = await requestLocationPermission();

      if (!hasPermission) {
        Alert.alert(
          "Permission refusée",
          "Veuillez activer la permission de localisation dans les paramètres de l'application pour utiliser cette fonctionnalité.",
          [
            {
              text: "Annuler",
              style: "cancel",
            },
            {
              text: "Paramètres",
              onPress: () => {
                if (Platform.OS === "ios") {
                  Linking.openURL("app-settings:");
                } else {
                  Linking.openSettings();
                }
              },
            },
          ]
        );
        setIsLocating(false);
        return;
      }

      // Vérifier si la localisation est activée
      const isLocationEnabled = await checkLocationEnabled();

      if (!isLocationEnabled) {
        Alert.alert(
          "Localisation désactivée",
          "Veuillez activer la localisation dans les paramètres de votre appareil.",
          [
            {
              text: "OK",
            },
          ]
        );
        setIsLocating(false);
        return;
      }

      // Obtenir la position actuelle
      const currentPosition = await getCurrentLocation();

      if (currentPosition && webViewRef.current) {
        // Zoomer sur la position de l'utilisateur
        const message = {
          type: "zoomToLocation",
          latitude: currentPosition.latitude,
          longitude: currentPosition.longitude,
        };

        console.log("Position utilisateur:", message);

        // Envoyer le message à la WebView
        webViewRef.current.postMessage(JSON.stringify(message));
      }
    } catch (error) {
      console.error("Erreur lors de la localisation:", error);

      let errorMessage = "Une erreur s'est produite lors de la localisation.";

      if (error.message.includes("Not authorized")) {
        errorMessage =
          "Permission de localisation refusée. Veuillez l'activer dans les paramètres.";
      } else if (error.message.includes("Location services")) {
        errorMessage =
          "Les services de localisation sont désactivés. Veuillez les activer.";
      } else if (error.message.includes("timeout")) {
        errorMessage = "Délai d'attente dépassé. Veuillez réessayer.";
      }

      Alert.alert("Erreur", errorMessage);
    } finally {
      setIsLocating(false);
    }
  };

  const handleMapClick = (lat, lng) => {
    if (!isFullScreen) return;

    Alert.alert(
      "Confirmer la position",
      `Voulez-vous définir cette position comme emplacement du client ${client.name1} ?`,
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Confirmer",
          onPress: () => {
            const newPosition = {
              latitude: lat,
              longitude: lng,
            };
            saveClientPosition(newPosition);
            setIsFullScreen(false);
          },
        },
      ]
    );
  };

  const handleMarkerPress = () => {
    if (!clientPosition) return;

    const { latitude, longitude } = clientPosition;

    Alert.alert(
      "Options de navigation",
      `Choisissez une option pour ${client.name1}`,
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Voir l'emplacement",
          onPress: () => {
            const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
            Linking.openURL(googleMapsUrl).catch((err) => {
              Alert.alert("Erreur", "Impossible d'ouvrir Google Maps");
            });
          },
        },
        {
          text: "Itinéraire",
          onPress: () => {
            const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
            Linking.openURL(directionsUrl).catch((err) => {
              Alert.alert("Erreur", "Impossible d'ouvrir la navigation");
            });
          },
        },
      ]
    );
  };

  const generateMapHTML = (position, isInteractive = false) => {
    const lat = position ? position.latitude : defaultPosition.latitude;
    const lng = position ? position.longitude : defaultPosition.longitude;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
        <style>
          body { margin: 0; padding: 0; }
          #map { height: 100vh; width: 100%; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
        <script>
          const map = L.map('map').setView([${lat}, ${lng}], 15);
          let userMarker = null; // Variable pour stocker le marqueur utilisateur
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);
          
          ${
            position
              ? `
            const marker = L.marker([${lat}, ${lng}]).addTo(map);
            marker.bindPopup('${client.name1}');
            ${
              !isInteractive
                ? `
              marker.on('click', function() {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'markerClick',
                  lat: ${lat},
                  lng: ${lng}
                }));
              });
            `
                : ""
            }
          `
              : ""
          }
          
          ${
            isInteractive
              ? `
            map.on('click', function(e) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'mapClick',
                lat: e.latlng.lat,
                lng: e.latlng.lng
              }));
            });
          `
              : `
            map.dragging.disable();
            map.touchZoom.disable();
            map.doubleClickZoom.disable();
            map.scrollWheelZoom.disable();
            map.boxZoom.disable();
            map.keyboard.disable();
          `
          }

          // Fonction pour gérer les messages de React Native
          function handleMessage(event) {
            try {
              console.log('Message reçu:', event.data);
              const data = JSON.parse(event.data);
              
              if (data.type === 'zoomToLocation') {
                console.log('Zoom vers position:', data.latitude, data.longitude);
                
                // Zoomer sur la position
                map.setView([data.latitude, data.longitude], 17);
                
                // Supprimer l'ancien marqueur utilisateur s'il existe
                if (userMarker) {
                  map.removeLayer(userMarker);
                }
                
                // Ajouter un nouveau marqueur pour la position de l'utilisateur
                userMarker = L.marker([data.latitude, data.longitude], {
                  icon: L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                  })
                }).addTo(map);
                
                userMarker.bindPopup('Votre position actuelle').openPopup();
              }
            } catch (error) {
              console.error('Erreur parsing message:', error);
            }
          }

          // Écouter les messages de React Native (nouvelle méthode)
          if (window.ReactNativeWebView) {
            document.addEventListener('message', handleMessage);
            window.addEventListener('message', handleMessage);
          }
        </script>
      </body>
      </html>
    `;
  };

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === "mapClick") {
        handleMapClick(data.lat, data.lng);
      } else if (data.type === "markerClick") {
        handleMarkerPress();
      }
    } catch (error) {
      console.error("Erreur parsing message WebView:", error);
    }
  };

  const handleDefinePosition = () => {
    setIsFullScreen(true);
  };

  const handleCloseFullScreen = () => {
    setIsFullScreen(false);
  };

  const renderNormalMap = () => {
    if (clientPosition) {
      return (
        <View style={styles.container}>
          <WebView
            style={styles.map}
            source={{ html: generateMapHTML(clientPosition, false) }}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
          />
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleDefinePosition}
          >
            <MaterialIcons name="edit-location" size={20} color="#03A9F4" />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyMapPlaceholder}>
          <MaterialIcons name="location-off" size={48} color="#ccc" />
          <Text style={styles.emptyText}>Position non définie</Text>
          <TouchableOpacity
            style={styles.defineButton}
            onPress={handleDefinePosition}
          >
            <MaterialIcons name="add-location" size={20} color="white" />
            <Text style={styles.defineButtonText}>Définir la position</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderFullScreenMap = () => {
    return (
      <Modal
        visible={isFullScreen}
        animationType="slide"
        statusBarTranslucent={true}
      >
        <View style={styles.fullScreenContainer}>
          <View style={styles.fullScreenHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCloseFullScreen}
            >
              <MaterialIcons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              Définir la position de {client.name1}
            </Text>
          </View>

          <View style={styles.mapContainer}>
            <WebView
              ref={webViewRef} // Utiliser la référence correcte
              style={styles.fullScreenMap}
              source={{
                html: generateMapHTML(clientPosition || defaultPosition, true),
              }}
              onMessage={handleWebViewMessage}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              scalesPageToFit={true}
            />

            <TouchableOpacity
              style={[
                styles.myLocationButton,
                isLocating && styles.myLocationButtonDisabled,
              ]}
              onPress={handleMyLocation}
              disabled={isLocating}
            >
              <MaterialIcons
                name={isLocating ? "hourglass-empty" : "my-location"}
                size={24}
                color={isLocating ? "#999" : "#03A9F4"}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsText}>
              Cliquez sur la carte pour définir la position du client
            </Text>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <>
      {renderNormalMap()}
      {renderFullScreenMap()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // marginHorizontal: 16,
    // marginVertical: 8,
    // borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  map: {
    flex: 1,
  },
  editButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emptyContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  emptyMapPlaceholder: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  emptyText: {
    color: "#666",
    fontSize: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  defineButton: {
    backgroundColor: "#03A9F4",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  defineButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  fullScreenHeader: {
    backgroundColor: "#03A9F4",
    paddingTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "500",
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  fullScreenMap: {
    flex: 1,
  },
  myLocationButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "white",
    borderRadius: 25,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  myLocationButtonDisabled: {
    backgroundColor: "#f0f0f0",
  },
  instructionsContainer: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  instructionsText: {
    textAlign: "center",
    color: "#666",
    fontSize: 14,
  },
});

export default ClientMap;
