import { Platform, TextStyle } from "react-native";

export const serif: TextStyle = {
  fontFamily: Platform.select({ ios: "Georgia", android: "serif", default: "serif" }),
  fontWeight: "600",
};

export const serifBold: TextStyle = {
  fontFamily: Platform.select({ ios: "Georgia", android: "serif", default: "serif" }),
  fontWeight: "700",
};
