import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

import { isOnboarded } from "@/src/utils/onboarding";
import { theme } from "@/src/utils/theme";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const done = await isOnboarded();
      if (done) {
        router.replace("/(tabs)/dashboard");
      } else {
        router.replace("/onboarding");
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
