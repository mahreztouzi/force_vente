import React, { useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  Text,
} from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import BottomTabs from "./BottomTabs";
import DrawerContent from "../components/drawer/DrawerContent";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Proportions validées : sidebar ~85% de la largeur, contenu repoussé pour laisser ~30% visible à gauche
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.85;
const CONTENT_PUSH = SCREEN_WIDTH * 0.7; // distance dont le contenu recule vers la gauche
const OPEN_THRESHOLD = SCREEN_WIDTH * 0.25; // distance de drag minimale pour basculer l'état au relâchement

/**
 * Panneau latéral qui glisse depuis la DROITE par-dessus le contenu.
 * Le contenu (BottomTabs entier) recule vers la GAUCHE en restant partiellement visible
 * (overflow) plutôt que de disparaître complètement.
 *
 * Ouverture : bouton hamburger (exposé via DrawerContext, utilisé dans UserProfile) OU swipe.
 * Fermeture : bouton dans la sidebar OU swipe inverse.
 */
const AppDrawerWrapper = () => {
  // translateX piloté à la fois par le geste et par les boutons (Animated.timing)
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpenRef = useRef(false);
  const lastOffsetRef = useRef(0);

  const animateTo = useCallback(
    (toValue, isOpen) => {
      isOpenRef.current = isOpen;
      lastOffsetRef.current = toValue;
      Animated.spring(translateX, {
        toValue,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
    },
    [translateX],
  );

  const openDrawer = useCallback(() => animateTo(-1, true), [animateTo]);
  const closeDrawer = useCallback(() => animateTo(0, false), [animateTo]);

  // -1 représente "ouvert" en valeur normalisée ; on interpole ensuite vers les vraies distances en px
  const onGestureEvent = useCallback(
    (event) => {
      const { translationX } = event.nativeEvent;
      // translationX négatif = doigt qui glisse vers la gauche → ouverture
      // On normalise entre 0 (fermé) et -1 (ouvert), en partant de l'état actuel
      const base = isOpenRef.current ? -1 : 0;
      const dragNormalized = translationX / CONTENT_PUSH;
      let next = base + dragNormalized;
      next = Math.max(-1, Math.min(0, next)); // clamp entre fermé (0) et ouvert (-1)
      translateX.setValue(next);
    },
    [translateX],
  );

  const onHandlerStateChange = useCallback(
    (event) => {
      if (event.nativeEvent.oldState === State.ACTIVE) {
        const { translationX, velocityX } = event.nativeEvent;
        const base = isOpenRef.current ? -1 : 0;
        const dragNormalized = translationX / CONTENT_PUSH;
        let projected = base + dragNormalized;
        projected = Math.max(-1, Math.min(0, projected));

        // Décision d'ouvrir/fermer : seuil de distance OU vitesse de swipe rapide
        const shouldOpen =
          projected < -0.5 ||
          (velocityX < -500 && !isOpenRef.current) ||
          (velocityX < -500 && isOpenRef.current);
        const shouldClose = projected > -0.5 && !(velocityX < -500);

        if (velocityX < -500) {
          openDrawer();
        } else if (velocityX > 500) {
          closeDrawer();
        } else if (Math.abs(translationX) > OPEN_THRESHOLD) {
          isOpenRef.current
            ? projected < -0.5
              ? openDrawer()
              : closeDrawer()
            : projected < -0.5
              ? openDrawer()
              : closeDrawer();
        } else {
          // Pas assez de mouvement → revient à l'état d'origine
          isOpenRef.current ? openDrawer() : closeDrawer();
        }
      }
    },
    [openDrawer, closeDrawer],
  );

  // Interpolations dérivées de translateX (0 = fermé, -1 = ouvert)
  const contentTranslate = translateX.interpolate({
    inputRange: [-1, 0],
    outputRange: [-CONTENT_PUSH, 0],
    extrapolate: "clamp",
  });

  const sidebarTranslate = translateX.interpolate({
    inputRange: [-1, 0],
    outputRange: [SCREEN_WIDTH - SIDEBAR_WIDTH, SCREEN_WIDTH],
    extrapolate: "clamp",
  });

  const overlayOpacity = translateX.interpolate({
    inputRange: [-1, 0],
    outputRange: [0.18, 0],
    extrapolate: "clamp",
  });

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
      activeOffsetX={[-15, 15]} // évite de capter des gestes verticaux/scroll involontairement
    >
      <View style={styles.root}>
        {/* Contenu principal — recule vers la gauche, reste partiellement visible (overflow) */}
        <Animated.View
          style={[
            styles.contentWrap,
            { transform: [{ translateX: contentTranslate }] },
          ]}
        >
          <BottomTabs openDrawer={openDrawer} />

          {/* Voile sombre léger sur le contenu quand la sidebar est ouverte, capte aussi le tap pour fermer */}
          <Animated.View
            pointerEvents={isOpenRef.current ? "auto" : "none"}
            style={[styles.dimOverlay, { opacity: overlayOpacity }]}
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              onPress={closeDrawer}
              activeOpacity={1}
            />
          </Animated.View>
        </Animated.View>

        {/* Sidebar — glisse depuis la droite, par-dessus */}
        <Animated.View
          style={[
            styles.sidebar,
            { transform: [{ translateX: sidebarTranslate }] },
          ]}
        >
          <DrawerContent onClose={closeDrawer} />
        </Animated.View>
      </View>
    </PanGestureHandler>
  );
};

export default AppDrawerWrapper;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0F1F36", // visible dans l'espace vide entre sidebar et bord gauche quand ouvert
    overflow: "hidden",
  },
  contentWrap: {
    flex: 1,
  },
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  sidebar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  sidebarHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F6",
  },
  closeBtn: {
    padding: 4,
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1F36",
  },
});
