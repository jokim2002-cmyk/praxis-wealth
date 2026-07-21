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

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill all fields.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const users = (await storage.getItem("praxis_users", [])) as any[];
      if (users.find((u: any) => u.email === email.trim())) {
        Alert.alert("Error", "Email already registered.");
        return;
      }

      const newUser = {
        id: Date.now().toString(),
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        created_at: new Date().toISOString(),
      };

      users.push(newUser);
      await storage.setItem("praxis_users", users);
      await storage.setItem("praxis_current_user", { email: newUser.email, name: newUser.name });

      Alert.alert("Success", "Account created! Welcome to Praxis.");
      router.replace("/(tabs)/dashboard");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    router.push("/auth/login");
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
            <Text style={[styles.h1, serif]}>Create account.</Text>
            <Text style={styles.sub}>Start your financial journey.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor={theme.color.muted}
              value={name}
              onChangeText={setName}
              testID="signup-name"
            />

            <Text style={[styles.label, { marginTop: theme.spacing.lg }]}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={theme.color.muted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              testID="signup-email"
            />

            <Text style={[styles.label, { marginTop: theme.spacing.lg }]}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="•••••••• (min 6 chars)"
                placeholderTextColor={theme.color.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                testID="signup-password"
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={20} color={theme.color.muted} />
              </Pressable>
            </View>

            <Text style={[styles.label, { marginTop: theme.spacing.lg }]}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={theme.color.muted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              testID="signup-confirm"
            />

            <Pressable
              style={[styles.signupBtn, loading && styles.disabled]}
              onPress={handleSignup}
              disabled={loading}
              testID="signup-btn"
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.signupBtnText}>Create Account</Text>
              )}
            </Pressable>

            <Pressable onPress={goToLogin} style={styles.loginLink} testID="go-to-login">
              <Text style={styles.loginText}>
                Already have an account? <Text style={styles.loginHighlight}>Sign in</Text>
              </Text>
            </Pressable>
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
  signupBtn: {
    marginTop: theme.spacing.xl,
    backgroundColor: theme.color.brand,
    paddingVertical: theme.spacing.lg,
    alignItems: "center",
  },
  signupBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600", letterSpacing: 1 },
  disabled: { opacity: 0.6 },
  loginLink: { marginTop: theme.spacing.lg, alignItems: "center" },
  loginText: { color: theme.color.muted, fontSize: 13 },
  loginHighlight: { color: theme.color.brand, fontWeight: "600" },
});
