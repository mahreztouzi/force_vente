import React, { useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  Animated,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Avatar } from "react-native-elements";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { Colors, Spacing, Radius } from "../../constants/Theme";
import { scale, fs } from "../../utils/responsive";

const AVATAR_COLORS = [
  "#00adee",
  "#f7a21b",
  "#006838",
  "#00a551",
  "#ec1c24",
  "#131313",
];

const getAvatarColor = (index) => AVATAR_COLORS[index % AVATAR_COLORS.length];

let currentOpenSwipeable = null;

const ClientListItem = ({
  client,
  index = 0,
  onPress,
  onDetailsPress,
  isFavorite = false,
}) => {
  const swipeableRef = useRef(null);
  const hasPhone = !!client?.num_tel;

  const handleCall = useCallback(() => {
    swipeableRef.current?.close();
    if (hasPhone) {
      Linking.openURL(`tel:${client.num_tel}`);
    } else {
      Alert.alert(
        "Aucun numéro disponible",
        "Ce client n'a pas de numéro de téléphone enregistré.",
        [{ text: "OK" }],
      );
    }
  }, [client?.num_tel, hasPhone]);

  const handleSMS = useCallback(() => {
    swipeableRef.current?.close();
    if (hasPhone) {
      Linking.openURL(`sms:${client.num_tel}`);
    } else {
      Alert.alert(
        "Aucun numéro disponible",
        "Ce client n'a pas de numéro de téléphone enregistré.",
        [{ text: "OK" }],
      );
    }
  }, [client?.num_tel, hasPhone]);

  const handleSwipeOpen = useCallback(() => {
    if (currentOpenSwipeable && currentOpenSwipeable !== swipeableRef.current) {
      currentOpenSwipeable.close();
    }
    currentOpenSwipeable = swipeableRef.current;
  }, []);

  const handleSwipeClose = useCallback(() => {
    if (currentOpenSwipeable === swipeableRef.current) {
      currentOpenSwipeable = null;
    }
  }, []);

  // progress : Animated.Value de 0 → 1 au fur et à mesure que le swipe s'ouvre
  const renderRightActions = (progress) => {
    // Chaque bouton glisse depuis la droite avec un léger décalage
    const smsTranslate = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [30, 0],
      extrapolate: "clamp",
    });
    const callTranslate = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [60, 0],
      extrapolate: "clamp",
    });
    // Opacité : apparaît progressivement
    const opacity = progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.6, 1],
      extrapolate: "clamp",
    });

    return (
      <View style={styles.actionsRow}>
        {/* Bouton Message */}
        <Animated.View
          style={[
            styles.actionBtn,
            styles.smsBtn,
            !hasPhone && styles.actionDisabled,
            { opacity, transform: [{ translateX: smsTranslate }] },
          ]}
        >
          <TouchableOpacity
            style={styles.actionBtnInner}
            onPress={handleSMS}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={hasPhone ? "message-text" : "message-off"}
              size={scale(20)}
              color="#fff"
            />
            <Text style={styles.actionBtnText}>Message</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Bouton Appeler */}
        <Animated.View
          style={[
            styles.actionBtn,
            styles.callBtn,
            !hasPhone && styles.actionDisabled,
            { opacity, transform: [{ translateX: callTranslate }] },
          ]}
        >
          <TouchableOpacity
            style={styles.actionBtnInner}
            onPress={handleCall}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={hasPhone ? "phone" : "phone-off"}
              size={scale(20)}
              color="#fff"
            />
            <Text style={styles.actionBtnText}>Appeler</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
      rightThreshold={40}
      onSwipeableOpen={handleSwipeOpen}
      onSwipeableClose={handleSwipeClose}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        activeOpacity={0.75}
      >
        {/* Bande couleur gauche */}
        <View
          style={[
            styles.colorStrip,
            { backgroundColor: getAvatarColor(index) },
          ]}
        />

        <View style={styles.left}>
          <View style={styles.avatarWrap}>
            <Avatar
              rounded
              size={scale(46)}
              title={client.name1?.charAt(0)}
              containerStyle={[
                styles.avatar,
                { backgroundColor: getAvatarColor(index) },
              ]}
              titleStyle={styles.avatarTitle}
            />
            {isFavorite && (
              <View style={styles.favoriteBadge}>
                <MaterialCommunityIcons
                  name="star"
                  size={scale(10)}
                  color="#FE9900"
                />
              </View>
            )}
          </View>

          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {client.name1}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.code}>{client.kunnr}</Text>
              {hasPhone ? (
                <View style={styles.phonePill}>
                  <MaterialCommunityIcons
                    name="phone"
                    size={scale(10)}
                    color="#1D9E75"
                  />
                  <Text style={styles.phonePillText}>{client.num_tel}</Text>
                </View>
              ) : (
                <View style={[styles.phonePill, styles.phonePillNone]}>
                  <MaterialCommunityIcons
                    name="phone-off"
                    size={scale(10)}
                    color="#9CA3AF"
                  />
                  <Text style={[styles.phonePillText, { color: "#9CA3AF" }]}>
                    Aucun n°
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={onDetailsPress || onPress}
          style={styles.chevronBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons
            name="chevron-right"
            size={scale(22)}
            color={Colors.textMuted}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Swipeable>
  );
};

export default ClientListItem;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 1.5,
    overflow: "hidden",
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingVertical: Spacing.md,
    paddingLeft: Spacing.md,
  },

  avatarWrap: {
    position: "relative",
    marginRight: Spacing.md,
  },
  avatar: {
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  avatarTitle: {
    fontSize: fs(18),
    fontWeight: "700",
  },
  favoriteBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    backgroundColor: "#FFFFFF",
    borderRadius: scale(8),
    width: scale(16),
    height: scale(16),
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },

  info: { flex: 1 },
  name: {
    fontSize: fs(15),
    fontWeight: "700",
    color: "#1A1F36",
    marginBottom: scale(4),
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  code: {
    fontSize: fs(12),
    color: "#8A93A6",
    fontWeight: "500",
  },
  phonePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(3),
    backgroundColor: "rgba(29, 158, 117, 0.08)",
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(10),
  },
  phonePillNone: {
    backgroundColor: "rgba(156, 163, 175, 0.1)",
  },
  phonePillText: {
    fontSize: fs(10),
    fontWeight: "600",
    color: "#1D9E75",
  },

  chevronBtn: {
    padding: Spacing.md,
  },

  // Actions swipe
  actionsRow: {
    flexDirection: "row",
    alignItems: "stretch",
    marginBottom: 3,
    marginTop: 3,
    gap: scale(6),
    paddingRight: scale(4),
  },
  actionBtn: {
    width: scale(60),
    borderRadius: Radius.md,
    overflow: "hidden",
  },
  // TouchableOpacity interne qui prend toute la place du Animated.View
  actionBtnInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    // gap: scale(4),
    paddingVertical: Spacing.sm,
  },
  callBtn: { backgroundColor: "#1D9E75" },
  smsBtn: { backgroundColor: "#03A9F4" },
  actionDisabled: { backgroundColor: "#9CA3AF" },
  actionBtnText: {
    color: "#fff",
    fontSize: fs(10),
    fontWeight: "700",
  },
});
