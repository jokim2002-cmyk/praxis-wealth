import * as Speech from "expo-speech";
import { Alert, Platform, PermissionsAndroid } from "react-native";

let permissionAsked = false;

export async function requestMicrophonePermission(): Promise<boolean> {
  if (Platform.OS === "web") {
    Alert.alert("Voice input is not supported on web yet.");
    return false;
  }

  if (permissionAsked) {
    return true;
  }

  try {
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: "Microphone Permission",
          message: "Praxis needs access to your microphone for voice input.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        }
      );
      permissionAsked = true;
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    permissionAsked = true;
    return true;
  } catch (error) {
    console.error("Permission error:", error);
    permissionAsked = true;
    return false;
  }
}

export function resetPermissionState() {
  permissionAsked = false;
}

// Speak the AI reply
export async function speakText(text: string, language: string = "en"): Promise<void> {
  try {
    // Stop any ongoing speech
    const isSpeaking = await Speech.isSpeakingAsync();
    if (isSpeaking) {
      await Speech.stop();
    }
    // Speak the text
    await Speech.speak(text, {
      language: language,
      pitch: 1.0,
      rate: 0.9,
      // Android TTS engine
    });
    console.log("[Voice] Speaking:", text.substring(0, 50) + "...");
  } catch (error) {
    console.error("[Voice] Speech error:", error);
  }
}

export async function stopSpeaking(): Promise<void> {
  try {
    await Speech.stop();
    console.log("[Voice] Stopped speaking.");
  } catch (error) {
    console.error("[Voice] Stop speech error:", error);
  }
}
