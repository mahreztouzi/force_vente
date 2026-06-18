import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Gradients } from "../../constants/Theme";

/**
 * Fond d'écran avec halos beige/bleu sur fond blanc.
 * À utiliser en premier enfant d'un écran, en position absolue.
 *
 * Usage:
 *   <SafeAreaView style={{flex:1}}>
 *     <ScreenBackground />
 *     ...reste de l'écran...
 *   </SafeAreaView>
 */
const ScreenBackground = () => {
  return (
    <View style={StyleSheet.absoluteFillObject}>
      <View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: Colors.background },
        ]}
      />

      <LinearGradient
        colors={Gradients.background.beige}
        locations={[0.1, 1]}
        start={{ x: 0, y: -0.1 }}
        end={{ x: 0.9, y: 0.2 }}
        style={StyleSheet.absoluteFillObject}
      />

      <LinearGradient
        colors={Gradients.background.blue}
        locations={[0.8, 1]}
        start={{ x: -0.2, y: 0 }}
        end={{ x: 1, y: 0.6 }}
        style={StyleSheet.absoluteFillObject}
      />
    </View>
  );
};

export default ScreenBackground;
