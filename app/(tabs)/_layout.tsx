import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { View, StyleSheet } from "react-native";

import { theme } from "@/src/utils/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.color.brand,
        tabBarInactiveTintColor: theme.color.muted,
        tabBarStyle: {
          backgroundColor: theme.color.surfaceSecondary,
          borderTopColor: theme.color.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 60,
          paddingTop: 4,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 8,
          letterSpacing: 0.3,
          fontWeight: "600",
          textTransform: "uppercase",
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Ledger",
          tabBarIcon: ({ color }) => <Feather name="book-open" size={18} color={color} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: "Entries",
          tabBarIcon: ({ color }) => <Feather name="list" size={18} color={color} />,
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: "Plan",
          tabBarIcon: ({ color }) => <Feather name="target" size={18} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tax"
        options={{
          title: "Tax",
          tabBarIcon: ({ color }) => <Feather name="file-text" size={18} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ca"
        options={{
          title: "CA",
          tabBarIcon: ({ color }) => (
            <View>
              <Feather name="message-circle" size={18} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Rpt",
          tabBarIcon: ({ color }) => <Feather name="pie-chart" size={18} color={color} />,
        }}
      />
    </Tabs>
  );
}
