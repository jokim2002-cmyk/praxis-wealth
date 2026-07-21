import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";

import { theme } from "@/src/utils/theme";
import { serif } from "@/src/utils/fonts";
import { db } from "@/src/database/schema";

export default function PrivacyScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dataSize, setDataSize] = useState("0 KB");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    loadDataInfo();
    loadUserInfo();
  }, []);

  const loadDataInfo = async () => {
    try {
      const tables = ["profile", "transactions", "budgets", "savings_goals", "bills", "monthly_snapshots"];
      let total = 0;
      for (const table of tables) {
        const result = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM ${table} WHERE deleted = 0`);
        total += result?.count || 0;
      }
      setDataSize(`${total} records`);
    } catch (e) {
      console.warn(e);
    }
  };

  const loadUserInfo = async () => {
    try {
      const user = await AsyncStorage.getItem("praxis_current_user");
      if (user) {
        const parsed = JSON.parse(user);
        setUserEmail(parsed.email || "Not logged in");
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const exportData = async () => {
    setLoading(true);
    try {
      const tables = ["profile", "transactions", "budgets", "savings_goals", "bills", "monthly_snapshots"];
      const data: Record<string, any> = {};
      for (const table of tables) {
        const rows = await db.getAllAsync<any>(`SELECT * FROM ${table} WHERE deleted = 0`);
        data[table] = rows;
      }
      
      const json = JSON.stringify(data, null, 2);
      const timestamp = new Date().toISOString().split("T")[0];
      const fileName = `Praxis_Export_${timestamp}.json`;
      const filePath = `${FileSystem.cacheDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, json, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: `Export ${fileName}`,
      });
      
      Alert.alert("Success", "Data exported as JSON file.");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not export data.");
    } finally {
      setLoading(false);
    }
  };

  const restoreFromBackup = async () => {
    try {
      // Pick a JSON file
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      const filePath = file.uri;
      
      // Read file content
      const content = await FileSystem.readAsStringAsync(filePath, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      // Parse JSON
      let data;
      try {
        data = JSON.parse(content);
      } catch (e) {
        Alert.alert("Error", "Invalid JSON file. Please select a valid Praxis export.");
        return;
      }

      // Validate structure
      const expectedTables = ["profile", "transactions", "budgets", "savings_goals", "bills", "monthly_snapshots"];
      const missing = expectedTables.filter(table => !data[table]);
      if (missing.length > 0) {
        Alert.alert("Error", `Missing tables: ${missing.join(', ')}. Please select a valid Praxis export.`);
        return;
      }

      // Confirm restore
      Alert.alert(
        "Restore Data",
        "This will replace ALL current data with the backup data. This cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Restore",
            style: "destructive",
            onPress: () => performRestore(data),
          },
        ]
      );
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not read file.");
    }
  };

  const performRestore = async (data: any) => {
    setLoading(true);
    try {
      // Clear existing data
      const tables = ["profile", "transactions", "budgets", "savings_goals", "bills", "monthly_snapshots"];
      for (const table of tables) {
        await db.runAsync(`DELETE FROM ${table}`);
      }

      // Insert new data
      // Profile
      if (data.profile && data.profile.length > 0) {
        for (const row of data.profile) {
          await db.runAsync(
            `INSERT INTO profile (id, name, monthly_income, income_type, cash_on_hand, bank_balance, emergency_fund, onboarded, created_at, updated_at, deleted)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            row.id || 'default',
            row.name || 'You',
            row.monthly_income || 0,
            row.income_type || 'fixed',
            row.cash_on_hand || 0,
            row.bank_balance || 0,
            row.emergency_fund || 0,
            row.onboarded || 0,
            row.created_at || Date.now(),
            row.updated_at || Date.now(),
            row.deleted || 0
          );
        }
      }

      // Transactions
      if (data.transactions) {
        for (const row of data.transactions) {
          await db.runAsync(
            `INSERT INTO transactions (id, amount, description, category, type, date, notes, ai_categorized, created_at, updated_at, deleted)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            row.id || 'tx-' + Date.now() + Math.random().toString(36).slice(2, 8),
            row.amount || 0,
            row.description || '',
            row.category || 'other',
            row.type || 'expense',
            row.date || Date.now(),
            row.notes || '',
            row.ai_categorized || 0,
            row.created_at || Date.now(),
            row.updated_at || Date.now(),
            row.deleted || 0
          );
        }
      }

      // Budgets
      if (data.budgets) {
        for (const row of data.budgets) {
          await db.runAsync(
            `INSERT INTO budgets (id, category_key, amount, period, created_at, updated_at, deleted)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            row.id || 'bud-' + Date.now() + Math.random().toString(36).slice(2, 8),
            row.category_key || 'other',
            row.amount || 0,
            row.period || '1970-01',
            row.created_at || Date.now(),
            row.updated_at || Date.now(),
            row.deleted || 0
          );
        }
      }

      // Savings Goals
      if (data.savings_goals) {
        for (const row of data.savings_goals) {
          await db.runAsync(
            `INSERT INTO savings_goals (id, name, target, saved, kind, target_date, icon, created_at, updated_at, deleted)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            row.id || 'goal-' + Date.now() + Math.random().toString(36).slice(2, 8),
            row.name || 'Goal',
            row.target || 0,
            row.saved || 0,
            row.kind || 'personal',
            row.target_date || null,
            row.icon || 'target',
            row.created_at || Date.now(),
            row.updated_at || Date.now(),
            row.deleted || 0
          );
        }
      }

      // Bills
      if (data.bills) {
        for (const row of data.bills) {
          await db.runAsync(
            `INSERT INTO bills (id, name, amount, kind, day_of_month, paid_months, active, created_at, updated_at, deleted)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            row.id || 'bill-' + Date.now() + Math.random().toString(36).slice(2, 8),
            row.name || 'Bill',
            row.amount || 0,
            row.kind || 'utility',
            row.day_of_month || 1,
            row.paid_months || '[]',
            row.active || 1,
            row.created_at || Date.now(),
            row.updated_at || Date.now(),
            row.deleted || 0
          );
        }
      }

      // Monthly Snapshots
      if (data.monthly_snapshots) {
        for (const row of data.monthly_snapshots) {
          await db.runAsync(
            `INSERT INTO monthly_snapshots (id, period, total_income, total_expense, net_savings, by_category, opening_balance, closing_balance, created_at, updated_at, deleted)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            row.id || 'snap-' + Date.now() + Math.random().toString(36).slice(2, 8),
            row.period || '1970-01',
            row.total_income || 0,
            row.total_expense || 0,
            row.net_savings || 0,
            row.by_category || '{}',
            row.opening_balance || 0,
            row.closing_balance || 0,
            row.created_at || Date.now(),
            row.updated_at || Date.now(),
            row.deleted || 0
          );
        }
      }

      Alert.alert("Success", "Data restored successfully from backup!");
      // Reload data info
      loadDataInfo();
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not restore data.");
    } finally {
      setLoading(false);
    }
  };

  const deleteAllData = () => {
    Alert.alert(
      "Delete All Data",
      "This will permanently delete ALL your financial data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      const tables = ["profile", "transactions", "budgets", "savings_goals", "bills", "monthly_snapshots"];
      for (const table of tables) {
        await db.runAsync(`DELETE FROM ${table}`);
      }
      
      const keys = await AsyncStorage.getAllKeys();
      await AsyncStorage.multiRemove(keys);
      
      Alert.alert("Data Deleted", "All your data has been permanently deleted.");
      router.replace("/auth/login");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not delete data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={theme.color.onSurface} />
        </Pressable>

        <Text style={styles.eyebrow}>PRAXIS · PRIVACY</Text>
        <Text style={[styles.h1, serif]}>Your data, your control.</Text>
        <Text style={styles.sub}>
          All your financial data is stored locally on your device.
          No data is shared without your explicit consent.
        </Text>

        <View style={styles.card}>
          <Text style={styles.sectionH}>📊 Data Summary</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Records stored:</Text>
            <Text style={styles.value}>{dataSize}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Logged in as:</Text>
            <Text style={styles.value}>{userEmail}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Storage:</Text>
            <Text style={styles.value}>Local (device only)</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionH}>📤 Export Data</Text>
          <Text style={styles.desc}>
            Export all your financial data as a JSON file. You can use this to backup or transfer your data.
          </Text>
          <Pressable
            style={[styles.btn, styles.btnBrand]}
            onPress={exportData}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Feather name="download" size={20} color="#FFFFFF" />
                <Text style={styles.btnText}>Export JSON File</Text>
              </>
            )}
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionH}>📥 Restore from Backup</Text>
          <Text style={styles.desc}>
            Select a previously exported JSON file to restore all your data. This will replace all current data.
          </Text>
          <Pressable
            style={[styles.btn, styles.btnBrandSecondary]}
            onPress={restoreFromBackup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Feather name="upload" size={20} color="#FFFFFF" />
                <Text style={styles.btnText}>Restore from File</Text>
              </>
            )}
          </Pressable>
        </View>

        <View style={[styles.card, styles.dangerCard]}>
          <Text style={[styles.sectionH, { color: theme.color.error }]}>🗑️ Delete All Data</Text>
          <Text style={styles.desc}>
            This will permanently delete ALL your financial data including transactions, budgets, goals, and bills.
            This action cannot be undone.
          </Text>
          <Pressable
            style={[styles.btn, styles.btnDanger]}
            onPress={deleteAllData}
            disabled={loading}
          >
            <Feather name="trash-2" size={20} color="#FFFFFF" />
            <Text style={styles.btnText}>Delete All Data</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionH}>🔒 Privacy Policy</Text>
          <Text style={styles.desc}>
            • All data is stored locally on your device only.
            • No data is sent to any server unless you explicitly choose to sync.
            • Your financial data is never shared with third parties.
            • You can export or delete your data at any time.
            • Microphone permission is only used for voice input when you tap the mic button.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface },
  content: { padding: theme.spacing.xl, paddingBottom: 40 },
  backBtn: { marginBottom: theme.spacing.md },
  eyebrow: {
    color: theme.color.brand,
    letterSpacing: 3,
    fontSize: 11,
    fontWeight: "700",
  },
  h1: { fontSize: 28, color: theme.color.onSurface, marginTop: 4 },
  sub: { fontSize: 14, color: theme.color.muted, marginTop: 6, marginBottom: 20, lineHeight: 20 },
  card: {
    backgroundColor: theme.color.surfaceSecondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.borderStrong,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderRadius: 4,
  },
  dangerCard: {
    borderColor: theme.color.error,
    borderWidth: 1,
  },
  sectionH: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.color.brand,
    marginBottom: theme.spacing.sm,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.color.divider,
  },
  label: { fontSize: 13, color: theme.color.muted },
  value: { fontSize: 13, color: theme.color.onSurface, fontWeight: "500" },
  desc: { fontSize: 13, color: theme.color.onSurfaceTertiary, lineHeight: 20, marginBottom: theme.spacing.md },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: theme.spacing.md,
    borderRadius: 4,
  },
  btnBrand: {
    backgroundColor: theme.color.brand,
  },
  btnBrandSecondary: {
    backgroundColor: theme.color.brandSecondary,
  },
  btnDanger: {
    backgroundColor: theme.color.error,
  },
  btnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
});
