import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  Colors,
  Spacing,
  Radius,
  Typography,
  Sizes,
} from "../../constants/Theme";

/**
 * Champ de saisie réutilisable avec label flottant.
 *
 * Usage simple:
 *   <Input label="Email" icon="mail-outline" value={v} onChangeText={setV} />
 *
 * Mot de passe:
 *   <Input label="Mot de passe" icon="lock-closed-outline" secureTextEntry value={v} onChangeText={setV} />
 *
 * Avec un champ secondaire collé (ex: mandant):
 *   <Input label="..." secondaryValue={mandant} onSecondaryChangeText={setMandant} secondaryPlaceholder="000" />
 */
const Input = ({
  label,
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  autoCapitalize = "none",
  autoCorrect = true,
  keyboardType = "default",
  maxLength,
  // Champ secondaire optionnel (ex: mandant collé au nom d'utilisateur)
  secondaryValue,
  onSecondaryChangeText,
  secondaryPlaceholder,
  secondaryMaxLength = 3,
  style,
}) => {
  const [secure, setSecure] = useState(secureTextEntry);
  const [focused, setFocused] = useState(false);

  const hasSecondary = secondaryValue !== undefined;

  return (
    <View style={[styles.wrap, focused && styles.wrapFocused, style]}>
      {label && (
        <Text style={[styles.label, focused && styles.labelFocused]}>
          {label}
        </Text>
      )}
      <View style={styles.row}>
        {icon && (
          <Ionicons
            name={icon}
            size={Sizes.iconSm}
            color={focused ? Colors.primary : Colors.textMuted}
            style={styles.icon}
          />
        )}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.textPlaceholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          keyboardType={keyboardType}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />

        {hasSecondary && (
          <>
            <View style={styles.separator} />
            <TextInput
              style={styles.secondaryInput}
              placeholder={secondaryPlaceholder}
              placeholderTextColor={Colors.textPlaceholder}
              value={secondaryValue}
              onChangeText={onSecondaryChangeText}
              keyboardType="numeric"
              maxLength={secondaryMaxLength}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
          </>
        )}

        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setSecure(!secure)}
            style={styles.eyeBtn}
          >
            <Ionicons
              name={secure ? "eye-off-outline" : "eye-outline"}
              size={Sizes.iconMd}
              color={Colors.textPlaceholder}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default Input;

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.background,
    position: "relative",
  },
  wrapFocused: {
    borderColor: Colors.borderFocused,
  },
  label: {
    position: "absolute",
    top: -9,
    left: Spacing.xxxl + 6,
    backgroundColor: Colors.background,
    paddingHorizontal: 3,
    zIndex: 1,
    ...Typography.floatLabel,
  },
  labelFocused: {
    color: Colors.primary,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: Sizes.inputHeight,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.sm,
    ...Typography.body,
  },
  separator: {
    width: 1,
    height: 22,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.sm,
  },
  secondaryInput: {
    width: 44,
    textAlign: "center",
    paddingVertical: Spacing.sm,
    ...Typography.body,
  },
  eyeBtn: {
    padding: Spacing.xs,
  },
});
