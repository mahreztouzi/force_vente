import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useAppLanguage } from "../hooks/useAppLanguage";

const LanguageSettings = () => {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useAppLanguage();

  const LANGUAGES = [
    { code: "fr", label: t("settings.french") },
    { code: "ar", label: t("settings.arabic") },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("settings.language")}</Text>
      {LANGUAGES.map((lang) => (
        <TouchableOpacity
          key={lang.code}
          style={[
            styles.option,
            currentLanguage === lang.code && styles.optionActive,
          ]}
          onPress={() => changeLanguage(lang.code)}
        >
          <Text style={styles.optionText}>{lang.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default LanguageSettings;

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 16, fontWeight: "700", marginBottom: 16 },
  option: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#F5F5F5",
    marginBottom: 8,
  },
  optionActive: { backgroundColor: "#E3F2FD" },
  optionText: { fontSize: 15 },
});
