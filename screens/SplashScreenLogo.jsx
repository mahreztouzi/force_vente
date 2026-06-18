// import React, { useEffect, useRef, useState } from "react";
// import {
//   Image,
//   StyleSheet,
//   View,
//   ImageBackground,
//   Animated,
// } from "react-native";
// import logo from "../assets/images/logo.png";
// import LottieView from "lottie-react-native"; // Importez <LottieView></LottieView>
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useNavigation } from "@react-navigation/native";

// const SplashScreenLogo = () => {
//   const navigation = useNavigation();
//   const logoAnimation = useRef(new Animated.Value(-200)).current;
//   const [lottieVisible, setLottieVisible] = useState(false);

//   useEffect(() => {
//     const animateSplashScreen = async () => {
//       // Attendez 3 secondes puis passez à l'écran principal
//       setTimeout(() => {
//         // handelGetToken();
//         navigation.navigate("Login");
//       }, 3500);

//       // Animation du logo
//       //   Animated.timing(logoAnimation, {
//       //     toValue: 0,
//       //     duration: 1500,
//       //     useNativeDriver: true,
//       //   }).start();

//       // Affichage du Lottie
//       setTimeout(() => {
//         setLottieVisible(true);
//       }, 2000); // Ajoutez un délai supplémentaire ici si nécessaire
//     };

//     animateSplashScreen();
//   }, []);

//   const handelGetToken = async () => {
//     const dataToken = await AsyncStorage.getItem("user");
//     if (!dataToken) {
//       navigation.navigate("Splash");
//     } else {
//       navigation.navigate("Tabs");
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <View style={styles.imageContainer}>
//         {/* <Image source={edu} style={styles.logo} /> */}
//         <Animated.Image source={logo} style={[styles.logo]} />
//         <View style={{ width: "100%", height: "10%" }}>
//           {lottieVisible && (
//             <LottieView
//               source={require("../assets/loading.json")}
//               autoPlay
//               loop
//               style={styles.animation}
//             />
//           )}
//         </View>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "space-between",
//     alignItems: "center",
//     height: "100%",
//     // backgroundColor: "rgba(229,227,227,0.34)",
//   },

//   imageContainer: {
//     flex: 1,
//     justifyContent: "space-between",
//     alignItems: "center",
//     height: "100%",
//   },
//   logo: {
//     margin: "auto",
//     width: 140,
//     height: 100,
//     resizeMode: "contain",
//     // borderRadius: 50,
//     // marginLeft: 12,
//     // borderWidth: 5,
//     // borderColor: "black",
//   },
//   animation: {
//     width: 200,
//     height: 150,
//   },
// });

// export default SplashScreenLogo;

// import React, { useEffect, useRef, useState } from "react";
// import { Image, StyleSheet, View, Animated } from "react-native";
// import logo from "../assets/images/logo.png";
// import LottieView from "lottie-react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useNavigation } from "@react-navigation/native";
// import {
//   horizontalScale,
//   verticalScale,
//   moderateScale,
// } from "../constants/Scale";

// const SplashScreenLogo = () => {
//   const navigation = useNavigation();
//   const logoAnimation = useRef(new Animated.Value(-200)).current;
//   const [lottieVisible, setLottieVisible] = useState(false);

//   useEffect(() => {
//     const animateSplashScreen = async () => {
//       // Navigation après 3,5 secondes
//       setTimeout(() => {
//         navigation.navigate("Login");
//       }, 3500);

//       // Affichage du Lottie après 2 secondes
//       setTimeout(() => {
//         setLottieVisible(true);
//       }, 2000);
//     };

//     animateSplashScreen();
//   }, []);

//   const handelGetToken = async () => {
//     const dataToken = await AsyncStorage.getItem("user");
//     if (!dataToken) {
//       navigation.navigate("Splash");
//     } else {
//       navigation.navigate("Tabs");
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <View style={styles.imageContainer}>
//         <Animated.Image source={logo} style={[styles.logo]} />
//         <View style={{ width: "100%", height: verticalScale(50) }}>
//           {lottieVisible && (
//             <LottieView
//               source={require("../assets/loading.json")}
//               autoPlay
//               loop
//               style={styles.animation}
//             />
//           )}
//         </View>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "space-between",
//     alignItems: "center",
//     height: "100%",
//     backgroundColor: "white",
//   },
//   imageContainer: {
//     flex: 1,
//     justifyContent: "space-between",
//     alignItems: "center",
//     height: "100%",
//   },
//   logo: {
//     margin: "auto",
//     width: horizontalScale(140),
//     height: verticalScale(100),
//     resizeMode: "contain",
//   },
//   animation: {
//     width: horizontalScale(150),
//     height: verticalScale(80),
//   },
// });

// export default SplashScreenLogo;

// import React, { useEffect, useRef, useState, useCallback } from "react";
// import { Image, StyleSheet, View, Animated } from "react-native";
// import logo from "../assets/images/logo_ddh.png";
// import LottieView from "lottie-react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useNavigation } from "@react-navigation/native";
// import {
//   horizontalScale,
//   verticalScale,
//   moderateScale,
// } from "../constants/Scale";
// import { useSelector, useDispatch } from "react-redux";
// import { checkUserLoggedIn } from "../redux/slices/authSlice";
// import { wp, hp, fs, fontWeight, scale } from "../utils/responsive";

// const SplashScreenLogo = () => {
//   const navigation = useNavigation();
//   const dispatch = useDispatch();
//   const logoAnimation = useRef(new Animated.Value(-200)).current;
//   const { isAuthenticated } = useSelector((state) => state.auth);
//   const [lottieVisible, setLottieVisible] = useState(false);
//   const lottieRef = useRef(null);

//   console.log("is auth", isAuthenticated);

//   useEffect(() => {
//     const initializeApp = async () => {
//       // Vérifier si l'utilisateur est déjà connecté
//       try {
//         await dispatch(checkUserLoggedIn()).unwrap();
//         // Si réussi, l'utilisateur est connecté
//         setTimeout(() => {
//           navigation.replace("Tabs");
//         }, 3500);
//       } catch (error) {
//         // Si échec, rediriger vers login
//         console.log("Aucun utilisateur connecté:", error);
//         setTimeout(() => {
//           navigation.replace("Login");
//         }, 3500);
//       }
//     };

//     initializeApp();
//   }, [dispatch, navigation]);

//   useEffect(() => {
//     // Démarrer l'animation du logo
//     Animated.timing(logoAnimation, {
//       toValue: 0,
//       duration: 1000,
//       useNativeDriver: true,
//     }).start();

//     // Démarrer l'animation Lottie après 2 secondes
//     const lottieTimeout = setTimeout(() => {
//       setLottieVisible(true);
//       lottieRef.current?.play();
//     }, 2000);

//     // Naviguer après 3,5 secondes
//     const navigationTimeout = setTimeout(() => {
//       lottieRef.current?.reset();
//       setLottieVisible(false);
//     }, 3500);

//     return () => {
//       clearTimeout(lottieTimeout);
//       clearTimeout(navigationTimeout);
//     };
//   }, [logoAnimation]);

//   return (
//     <View style={styles.container}>
//       <View style={styles.imageContainer}>
//         <Animated.Image
//           source={logo}
//           style={[
//             styles.logo,
//             {
//               transform: [{ translateY: logoAnimation }],
//             },
//           ]}
//         />
//         <View style={{ width: "100%", height: verticalScale(50) }}>
//           {lottieVisible && (
//             <LottieView
//               ref={lottieRef}
//               source={require("../assets/loading.json")}
//               autoPlay
//               loop
//               style={styles.animation}
//             />
//           )}
//         </View>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "white",
//   },
//   imageContainer: {
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   logo: {
//     width: scale(140),
//     height: scale(140),
//     resizeMode: "contain",
//   },
//   animation: {
//     width: scale(150),
//     height: scale(80),
//   },
// });

// export default SplashScreenLogo;

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Image, StyleSheet, View, Animated, Text } from "react-native";
import logo from "../assets/images/logo_ddh.png";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import {
  horizontalScale,
  verticalScale,
  moderateScale,
} from "../constants/Scale";
import { useSelector, useDispatch } from "react-redux";
import { checkUserLoggedIn } from "../redux/slices/authSlice";
import { wp, hp, fs, fontWeight, scale } from "../utils/responsive";
import * as SecureStore from "expo-secure-store";

// Composant personnalisé pour l'animation de tirets
const DashLoadingAnimation = ({ visible }) => {
  const numberOfDashes = 6;
  const dashColors = [
    "#00adee",
    "#f7a21b",
    "#006838",
    "#00a551",
    "#ec1c24",
    "#131313",
  ]; // Bleu, Orange, Vert, Vert, Rouge, Noir
  const dashAnimations = useRef(
    Array(numberOfDashes)
      .fill(0)
      .map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    if (visible) {
      // Animation séquentielle des tirets
      const animateDashes = () => {
        const animations = dashAnimations.map((animValue, index) => {
          return Animated.sequence([
            Animated.delay(index * 350),
            Animated.timing(animValue, {
              toValue: 1,
              duration: 400,
              useNativeDriver: false,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 400,
              useNativeDriver: false,
            }),
          ]);
        });

        Animated.parallel(animations).start(() => {
          // Redémarrer l'animation après un délai
          setTimeout(animateDashes, 200);
        });
      };

      animateDashes();
    }
  }, [visible]);

  const renderDashes = () => {
    return dashAnimations.map((animValue, index) => (
      <Animated.View
        key={index}
        style={[
          styles.dash,
          {
            backgroundColor: animValue.interpolate({
              inputRange: [0, 1],
              outputRange: ["#E5E5E5", dashColors[index]], // Gris clair vers couleur spécifique
            }),
          },
        ]}
      />
    ));
  };

  if (!visible) return null;

  return <View style={styles.dashContainer}>{renderDashes()}</View>;
};

const SplashScreenLogo = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const logoAnimation = useRef(new Animated.Value(-200)).current;
  const textAnimation = useRef(new Animated.Value(200)).current; // Animation pour le texte depuis le bas
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [dashVisible, setDashVisible] = useState(false);

  console.log("is auth", isAuthenticated);

  // useEffect(() => {
  //   const initializeApp = async () => {
  //     // Vérifier si l'utilisateur est déjà connecté
  //     try {
  //       await dispatch(checkUserLoggedIn()).unwrap();
  //       // Si réussi, l'utilisateur est connecté
  //       setTimeout(() => {
  //         navigation.replace("Tabs");
  //       }, 3500);
  //     } catch (error) {
  //       // Si échec, rediriger vers login
  //       setTimeout(() => {
  //         // navigation.replace("Login");
  //         navigation.replace("ServerConfig");
  //       }, 3500);
  //     }
  //   };

  //   initializeApp();
  // }, [dispatch, navigation]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Étape 1: Vérifier la configuration du serveur
        const savedConfig = await SecureStore.getItemAsync("server_config");

        if (!savedConfig) {
          // Pas de configuration serveur -> rediriger vers ServerConfig
          console.log("Aucune configuration serveur trouvée");
          setTimeout(() => {
            navigation.replace("ServerConfig");
          }, 2000);
          return;
        }

        const config = JSON.parse(savedConfig);
        if (!config.domain || !config.serverUrl) {
          // Configuration incomplète -> rediriger vers ServerConfig
          console.log("Configuration serveur incomplète");
          setTimeout(() => {
            navigation.replace("ServerConfig");
          }, 2000);
          return;
        }

        // Étape 2: Configuration OK, vérifier si l'utilisateur est connecté
        console.log(
          "Configuration serveur OK, vérification de la session utilisateur..."
        );

        try {
          await dispatch(checkUserLoggedIn()).unwrap();
          // Utilisateur connecté -> aller aux onglets
          setTimeout(() => {
            navigation.replace("Tabs");
          }, 3500);
        } catch (error) {
          // Utilisateur non connecté -> aller au login
          setTimeout(() => {
            navigation.replace("Login");
          }, 3500);
        }
      } catch (error) {
        // Erreur lors de la lecture de la config -> aller à la configuration
        console.error("Erreur lors de l'initialisation:", error);
        setTimeout(() => {
          navigation.replace("ServerConfig");
        }, 2000);
      }
    };

    initializeApp();
  }, [dispatch, navigation]);

  useEffect(() => {
    // Démarrer l'animation du logo depuis le haut
    Animated.timing(logoAnimation, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Démarrer l'animation du texte depuis le bas en même temps
    Animated.timing(textAnimation, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Démarrer l'animation des tirets après 1 seconde (après les animations logo et texte)
    const dashTimeout = setTimeout(() => {
      setDashVisible(true);
    }, 1000);

    // Arrêter l'animation après 3,5 secondes
    // const navigationTimeout = setTimeout(() => {
    //   setDashVisible(false);
    // }, 4500);

    return () => {
      clearTimeout(dashTimeout);
      // clearTimeout(navigationTimeout);
    };
  }, [logoAnimation, textAnimation]);

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Animated.Image
          source={logo}
          style={[
            styles.logo,
            {
              transform: [{ translateY: logoAnimation }],
            },
          ]}
        />

        {/* Texte "SARL BPI/ENH DOUDAH" avec animation depuis le bas */}
        <Animated.View
          style={{
            transform: [{ translateY: textAnimation }],
          }}
        >
          <Text style={styles.companyText}>SARL BPI/ENH</Text>
          <Text style={styles.companyText2}>DOUDAH</Text>
        </Animated.View>

        <View style={{ width: "100%", height: verticalScale(50) }}>
          <DashLoadingAnimation visible={dashVisible} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  imageContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: scale(200),
    height: scale(200),
    resizeMode: "contain",
  },
  companyText: {
    fontSize: fs(24),
    fontWeight: "800",
    color: "#333", // Vert similaire au logo
    textAlign: "center",
    marginVertical: verticalScale(2),
    letterSpacing: 1,
  },
  companyText2: {
    fontSize: fs(40),
    fontWeight: "800",
    color: "#333", // Vert similaire au logo
    textAlign: "center",
    marginVertical: verticalScale(2),
    letterSpacing: 1,
  },
  dashContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: verticalScale(20),
  },
  dash: {
    width: scale(25),
    height: scale(4),
    marginHorizontal: horizontalScale(3),
    borderRadius: moderateScale(2),
  },
});

export default SplashScreenLogo;
