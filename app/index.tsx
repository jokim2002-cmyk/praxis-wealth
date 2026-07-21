import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

import { isOnboarded } from "@/src/utils/onboarding";
import { storage } from "@/src/utils/storage";
import { theme } from "@/src/utils/theme";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      // Check if user is logged in
      const currentUser = await storage.getItem("praxis_current_user", null);
      const done = await isOnboarded();

      if (!currentUser) {
        router.replace("/auth/login");
      } else if (!done) {
        router.replace("/onboarding");
      } else {
        router.replace("/(tabs)/dashboard");
      }
    })();
  }, [router]);

  return (
    <View style={styles.container} testID="app-splash">
      <ActivityIndicator color={theme.color.brand} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.color.surface,
    alignItems: "center",
    justifyContent: "center",
  },
});
