import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import "@/src/utils/logger";
import { runMigration } from "@/src/database/migration";
import { resetMigrationFlag } from "@/src/database/reset";
import { LanguageProvider } from "@/src/context/LanguageContext";

LogBox.ignoreAllLogs(true);
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useIconFonts();

  useEffect(() => {
    if (loaded || error) {
      (async () => {
        await resetMigrationFlag();
        const success = await runMigration();
        console.log('[App] Migration result:', success);
      })();
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <LanguageProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F7F6F2" } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="auth/login" />
            <Stack.Screen name="auth/signup" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </LanguageProvider>
  );
}




