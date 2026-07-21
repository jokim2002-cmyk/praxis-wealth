import React, { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { theme } from "@/src/utils/theme";

const languages = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "gu", label: "ગુજરાતી" },
];

const STORAGE_KEY = "praxis_language";

export function LanguageSwitcher() {
  const [language, setLanguageState] = useState("en");
  const [currentLabel, setCurrentLabel] = useState("English");

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved === "hi" || saved === "gu") {
        setLanguageState(saved);
        const lang = languages.find(l => l.code === saved);
        setCurrentLabel(lang?.label || "English");
      }
    } catch (e) {
      console.warn("Failed to load language:", e);
    }
  };

  const setLanguage = async (code: string) => {
    setLanguageState(code);
    const lang = languages.find(l => l.code === code);
    setCurrentLabel(lang?.label || "English");
    try {
      await AsyncStorage.setItem(STORAGE_KEY, code);
      // Force re-render of parent by reloading
      // We'll just show a confirmation
    } catch (e) {
      console.warn("Failed to save language:", e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Language / भाषा / ભાષા</Text>
      <Text style={styles.currentLang}>Current: {currentLabel}</Text>
      <View style={styles.row}>
        {languages.map((lang) => (
          <Pressable
            key={lang.code}
            onPress={() => setLanguage(lang.code)}
            style={[
              styles.btn,
              language === lang.code && styles.btnActive,
            ]}
          >
            <Text
              style={[
                styles.btnText,
                language === lang.code && styles.btnTextActive,
              ]}
            >
              {lang.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    backgroundColor: theme.color.surfaceSecondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.borderStrong,
  },
  label: {
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: "700",
    color: theme.color.muted,
    marginBottom: theme.spacing.sm,
  },
  currentLang: {
    fontSize: 13,
    color: theme.color.brand,
    fontWeight: "600",
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.color.borderStrong,
    borderRadius: 4,
  },
  btnActive: {
    backgroundColor: theme.color.brand,
    borderColor: theme.color.brand,
  },
  btnText: {
    fontSize: 13,
    color: theme.color.onSurface,
  },
  btnTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
