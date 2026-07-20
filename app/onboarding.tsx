import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { theme } from "@/src/utils/theme";
import { api } from "@/src/utils/api";
import { markOnboarded } from "@/src/utils/onboarding";
import { serif } from "@/src/utils/fonts";

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [income, setIncome] = useState("");
  const [incomeType, setIncomeType] = useState<"fixed" | "fluctuating">("fixed");
  const [bank, setBank] = useState("");
  const [cash, setCash] = useState("");
  const [saving, setSaving] = useState(false);

  const finish = async () => {
    setSaving(true);
    try {
      await api.updateProfile({
        name: name.trim() || "You",
        monthly_income: Number(income) || 0,
        income_type: incomeType,
        bank_balance: Number(bank) || 0,
        cash_on_hand: Number(cash) || 0,
        onboarded: true,
      });
      await markOnboarded();
      router.replace("/(tabs)/dashboard");
    } catch (e: any) {
      Alert.alert("Setup failed", e?.message ?? "Try again");
    } finally {
      setSaving(false);
    }
  };

  const next = () => setStep((s) => Math.min(s + 1, 3));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.eyebrow}>PRAXIS - OFFLINE BUILD 1.0.3</Text>
          <Text style={[styles.h1, serif]}>Your ledger,{"\n"}with a mind of its own.</Text>
          <Text style={styles.sub}>
            A quiet, precise companion for budgeting, savings, and Indian tax planning.
          </Text>

          <View style={styles.card}>
            <Text style={styles.stepLabel}>Step {step + 1} of 4</Text>

            {step === 0 && (
              <View>
                <Text style={styles.label}>What should I call you?</Text>
                <TextInput
                  testID="onboard-name-input"
                  style={styles.input}
                  placeholder="e.g. Aarav"
                  placeholderTextColor={theme.color.muted}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            )}

            {step === 1 && (
              <View>
                <Text style={styles.label}>Monthly income (₹)</Text>
                <TextInput
                  testID="onboard-income-input"
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="e.g. 85000"
                  placeholderTextColor={theme.color.muted}
                  value={income}
                  onChangeText={setIncome}
                />
                <Text style={[styles.label, { marginTop: theme.spacing.lg }]}>
                  Income type
                </Text>
                <View style={styles.row}>
                  {(["fixed", "fluctuating"] as const).map((t) => (
                    <Pressable
                      key={t}
                      testID={`onboard-income-${t}`}
                      onPress={() => setIncomeType(t)}
                      style={[
                        styles.choice,
                        incomeType === t && styles.choiceActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.choiceText,
                          incomeType === t && styles.choiceTextActive,
                        ]}
                      >
                        {t === "fixed" ? "Salaried" : "Fluctuating"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {step === 2 && (
              <View>
                <Text style={styles.label}>Bank balance (₹)</Text>
                <TextInput
                  testID="onboard-bank-input"
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="e.g. 120000"
                  placeholderTextColor={theme.color.muted}
                  value={bank}
                  onChangeText={setBank}
                />
                <Text style={[styles.label, { marginTop: theme.spacing.lg }]}>
                  Cash on hand (₹)
                </Text>
                <TextInput
                  testID="onboard-cash-input"
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="e.g. 3500"
                  placeholderTextColor={theme.color.muted}
                  value={cash}
                  onChangeText={setCash}
                />
              </View>
            )}

            {step === 3 && (
              <View>
                <Text style={styles.label}>Ready to open your ledger?</Text>
                <Text style={styles.body}>
                  I&apos;ll categorise expenses, warn you before overspending, project your
                  tax under the new regime, and remind you of Advance Tax dates.
                </Text>
                <View style={styles.summary}>
                  <Row k="Name" v={name || "You"} />
                  <Row k="Monthly income" v={`₹${income || 0}`} />
                  <Row k="Income type" v={incomeType} />
                  <Row k="Bank" v={`₹${bank || 0}`} />
                  <Row k="Cash" v={`₹${cash || 0}`} />
                </View>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            {step > 0 && (
              <Pressable
                testID="onboard-back"
                onPress={back}
                style={styles.secondaryBtn}
              >
                <Feather name="arrow-left" size={16} color={theme.color.onSurface} />
                <Text style={styles.secondaryBtnText}>Back</Text>
              </Pressable>
            )}
            {step < 3 ? (
              <Pressable
                testID="onboard-next"
                onPress={next}
                style={styles.primaryBtn}
              >
                <Text style={styles.primaryBtnText}>Continue</Text>
                <Feather name="arrow-right" size={16} color="#FFFFFF" />
              </Pressable>
            ) : (
              <Pressable
                testID="onboard-finish"
                onPress={finish}
                disabled={saving}
                style={[styles.primaryBtn, saving && { opacity: 0.6 }]}
              >
                <Text style={styles.primaryBtnText}>
                  {saving ? "Opening…" : "Open my ledger"}
                </Text>
                <Feather name="check" size={16} color="#FFFFFF" />
              </Pressable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryK}>{k}</Text>
      <Text style={styles.summaryV}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface },
  content: {
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
  },
  eyebrow: {
    color: theme.color.brand,
    letterSpacing: 3,
    fontSize: 11,
    fontWeight: "600",
    marginBottom: theme.spacing.md,
  },
  h1: {
    fontSize: 34,
    color: theme.color.onSurface,
    lineHeight: 40,
    marginBottom: theme.spacing.md,
  },
  sub: {
    fontSize: 14,
    color: theme.color.muted,
    marginBottom: theme.spacing.xl,
    lineHeight: 20,
  },
  card: {
    backgroundColor: theme.color.surfaceSecondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.borderStrong,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  stepLabel: {
    fontSize: 11,
    letterSpacing: 2,
    color: theme.color.muted,
    marginBottom: theme.spacing.lg,
    fontWeight: "600",
  },
  label: {
    fontSize: 13,
    color: theme.color.onSurface,
    marginBottom: theme.spacing.sm,
    fontWeight: "500",
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: theme.color.borderStrong,
    paddingVertical: theme.spacing.md,
    fontSize: 18,
    color: theme.color.onSurface,
  },
  row: { flexDirection: "row", gap: theme.spacing.sm },
  choice: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.color.borderStrong,
    flex: 1,
    alignItems: "center",
  },
  choiceActive: {
    backgroundColor: theme.color.brand,
    borderColor: theme.color.brand,
  },
  choiceText: { color: theme.color.onSurface, fontSize: 14 },
  choiceTextActive: { color: "#FFFFFF", fontWeight: "600" },
  body: { fontSize: 14, color: theme.color.onSurfaceTertiary, lineHeight: 22, marginBottom: theme.spacing.lg },
  summary: { marginTop: theme.spacing.md },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.color.divider,
  },
  summaryK: { color: theme.color.muted, fontSize: 13 },
  summaryV: { color: theme.color.onSurface, fontSize: 14, fontWeight: "600" },
  actions: { flexDirection: "row", gap: theme.spacing.sm, marginTop: theme.spacing.sm },
  primaryBtn: {
    flex: 1,
    backgroundColor: theme.color.brand,
    paddingVertical: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
  },
  primaryBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  secondaryBtn: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.color.borderStrong,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  secondaryBtnText: { color: theme.color.onSurface, fontSize: 14, fontWeight: "500" },
});


