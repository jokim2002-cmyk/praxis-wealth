import AsyncStorage from "@react-native-async-storage/async-storage";

const ONBOARD_KEY = "praxis_onboarded_v1";

export async function isOnboarded(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(ONBOARD_KEY);
    return v === "1";
  } catch {
    return false;
  }
}

export async function markOnboarded() {
  await AsyncStorage.setItem(ONBOARD_KEY, "1");
}
