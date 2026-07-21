import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";

import { theme } from "@/src/utils/theme";
import { serif } from "@/src/utils/fonts";

const languages = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
  { code: "gu", label: "ગુજરાતી", flag: "🇮🇳" },
];

const STORAGE_KEY = "praxis_language";

export default function LanguageScreen() {
  const [selected, setSelected] = useState("en");

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved === "hi" || saved === "gu") {
        setSelected(saved);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const selectLanguage = async (code: string) => {
    setSelected(code);
    await AsyncStorage.setItem(STORAGE_KEY, code);
    // Show confirmation
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>PRAXIS · SETTINGS</Text>
        <Text style={[styles.h1, serif]}>Choose your language.</Text>
        <Text style={styles.sub}>App language will change.</Text>

        <View style={styles.card}>
          {languages.map((lang) => (
            <Pressable
              key={lang.code}
              onPress={() => selectLanguage(lang.code)}
              style={[
                styles.langBtn,
                selected === lang.code && styles.langBtnActive,
              ]}
            >
              <View style={styles.langLeft}>
                <Text style={styles.flag}>{lang.flag}</Text>
                <Text style={[
                  styles.langLabel,
                  selected === lang.code && styles.langLabelActive,
                ]}>
                  {lang.label}
                </Text>
              </View>
              {selected === lang.code && (
                <Feather name="check" size={20} color={theme.color.brand} />
              )}
            </Pressable>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Feather name="info" size={16} color={theme.color.brand} />
          <Text style={styles.infoText}>
            Language will be saved. App restart not needed.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface },
  content: { padding: theme.spacing.xl, paddingBottom: 40 },
  eyebrow: {
    color: theme.color.brand,
    letterSpacing: 3,
    fontSize: 11,
    fontWeight: "700",
  },
  h1: { fontSize: 28, color: theme.color.onSurface, marginTop: 4 },
  sub: { fontSize: 14, color: theme.color.muted, marginTop: 6, marginBottom: 20 },
  card: {
    backgroundColor: theme.color.surfaceSecondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.borderStrong,
    padding: theme.spacing.xl,
  },
  langBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.color.divider,
  },
  langBtnActive: {
    backgroundColor: theme.color.brandTertiary,
    paddingHorizontal: theme.spacing.sm,
    marginHorizontal: -theme.spacing.sm,
    borderRadius: 4,
  },
  langLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  flag: { fontSize: 24 },
  langLabel: {
    fontSize: 16,
    color: theme.color.onSurface,
  },
  langLabelActive: {
    fontWeight: "600",
    color: theme.color.brand,
  },
  infoBox: {
    marginTop: theme.spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: theme.spacing.lg,
    backgroundColor: theme.color.brandTertiary,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: theme.color.onBrandTertiary,
  },
});
