import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { theme } from "@/src/utils/theme";
import { serif } from "@/src/utils/fonts";
import { storage } from "@/src/utils/storage";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter email and password.");
      return;
    }

    setLoading(true);
    try {
      // Check if user exists
      const users = (await storage.getItem("praxis_users", [])) as any[];
      const user = users.find(
        (u: any) => u.email === email.trim() && u.password === password.trim()
      );

      if (user) {
        await storage.setItem("praxis_current_user", { email: user.email, name: user.name });
        router.replace("/(tabs)/dashboard");
      } else {
        Alert.alert("Error", "Invalid email or password.");
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const goToSignup = () => {
    router.push("/auth/signup");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.eyebrow}>PRAXIS</Text>
            <Text style={[styles.h1, serif]}>Welcome back.</Text>
            <Text style={styles.sub}>Sign in to sync your ledger.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={theme.color.muted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              testID="login-email"
            />

            <Text style={[styles.label, { marginTop: theme.spacing.lg }]}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor={theme.color.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                testID="login-password"
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={20} color={theme.color.muted} />
              </Pressable>
            </View>

            <Pressable
              style={[styles.loginBtn, loading && styles.disabled]}
              onPress={handleLogin}
              disabled={loading}
              testID="login-btn"
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginBtnText}>Sign In</Text>
              )}
            </Pressable>

            <Pressable onPress={goToSignup} style={styles.signupLink} testID="go-to-signup">
              <Text style={styles.signupText}>
                Don't have an account? <Text style={styles.signupHighlight}>Create one</Text>
              </Text>
            </Pressable>

            <View style={styles.offlineNote}>
              <Feather name="wifi-off" size={14} color={theme.color.muted} />
              <Text style={styles.offlineText}>Works offline · Syncs when online</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface },
  content: { padding: theme.spacing.xl, paddingBottom: 40, flexGrow: 1 },
  header: { marginBottom: theme.spacing.xl },
  eyebrow: {
    color: theme.color.brand,
    letterSpacing: 3,
    fontSize: 11,
    fontWeight: "700",
  },
  h1: { fontSize: 32, color: theme.color.onSurface, marginTop: 4 },
  sub: { fontSize: 14, color: theme.color.muted, marginTop: 6 },
  card: {
    backgroundColor: theme.color.surfaceSecondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.borderStrong,
    padding: theme.spacing.xl,
  },
  label: {
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: "700",
    color: theme.color.muted,
    marginBottom: 6,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: theme.color.borderStrong,
    paddingVertical: 10,
    fontSize: 16,
    color: theme.color.onSurface,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  eyeBtn: {
    padding: 8,
    marginLeft: 8,
  },
  loginBtn: {
    marginTop: theme.spacing.xl,
    backgroundColor: theme.color.brand,
    paddingVertical: theme.spacing.lg,
    alignItems: "center",
  },
  loginBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600", letterSpacing: 1 },
  disabled: { opacity: 0.6 },
  signupLink: { marginTop: theme.spacing.lg, alignItems: "center" },
  signupText: { color: theme.color.muted, fontSize: 13 },
  signupHighlight: { color: theme.color.brand, fontWeight: "600" },
  offlineNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.color.divider,
  },
  offlineText: { color: theme.color.muted, fontSize: 11 },
});
