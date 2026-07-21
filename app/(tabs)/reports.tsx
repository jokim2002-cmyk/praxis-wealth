import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Share,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";

import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import { theme } from "@/src/utils/theme";
import { api, formatINR, DashboardData } from "@/src/utils/api";
import { serif, serifBold } from "@/src/utils/fonts";

export default function ReportsScreen() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.dashboard();
      setData(d);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const generateReportText = (includeCA: boolean = false) => {
    if (!data) return '';
    
    let text = `
═══════════════════════════════════════
      PRAXIS WEALTH - MONTHLY REPORT
═══════════════════════════════════════
${data.month}

📊 INCOME: ${formatINR(data.monthly_income)}
📊 EXPENSES: ${formatINR(data.total_spent)}
📊 SAFE TO SPEND: ${formatINR(data.safe_to_spend)}
📊 NET WORTH: ${formatINR(data.net_worth)}
📊 SAVINGS RATE: ${data.savings_rate}%
📊 HEALTH SCORE: ${data.health_score}/100

───────────────────────────────────────
📁 CATEGORY BREAKDOWN:
${Object.entries(data.by_category)
  .sort((a, b) => b[1] - a[1])
  .map(([cat, amt]) => `  ${cat.padEnd(15)} ${formatINR(amt)}`)
  .join('\n')}

───────────────────────────────────────
💰 EMERGENCY FUND:
  Saved: ${formatINR(data.profile.emergency_fund)}
  Target: ${formatINR(data.emergency_fund_target)}
  Progress: ${data.emergency_fund_progress}%

───────────────────────────────────────
💳 CASH & LIQUIDITY:
  Bank: ${formatINR(data.profile.bank_balance)}
  Cash: ${formatINR(data.profile.cash_on_hand)}
  Emergency: ${formatINR(data.profile.emergency_fund)}

───────────────────────────────────────
📌 SUGGESTED CASH ON HAND: ${formatINR(data.suggested_cash_on_hand)}

${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
═══════════════════════════════════════
    `;

    if (includeCA) {
      text += `

🔹 FOR YOUR CHARTERED ACCOUNTANT 🔹
This is an auto-generated summary from Praxis Wealth.
Please verify with actual bank statements.

Key highlights:
- Annual Income: ${formatINR(data.monthly_income * 12)}
- Monthly Expenses: ${formatINR(data.total_spent)}
- Top 3 Categories:
${Object.entries(data.by_category)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 3)
  .map(([cat, amt]) => `  • ${cat}: ${formatINR(amt)}`)
  .join('\n')}
    `;
    }
    return text;
  };

  const generateCSV = () => {
    if (!data) return '';
    let csv = `Month,Category,Amount,Type\n`;
    csv += `${data.month},Total Income,${data.monthly_income},Income\n`;
    csv += `${data.month},Total Expenses,${data.total_spent},Expense\n`;
    csv += `${data.month},Net Worth,${data.net_worth},Summary\n`;
    csv += `${data.month},Savings Rate,${data.savings_rate},Summary\n`;
    csv += `${data.month},Health Score,${data.health_score},Summary\n`;
    csv += `${data.month},Safe to Spend,${data.safe_to_spend},Summary\n`;
    Object.entries(data.by_category).forEach(([cat, amt]) => {
      csv += `${data.month},${cat},${amt},Expense\n`;
    });
    return csv;
  };

  const shareText = async () => {
    if (!data) return;
    try {
      await Share.share({
        message: generateReportText(false),
        title: `Praxis Report - ${data.month}`,
      });
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not share.");
    }
  };

  const shareAsFile = async (type: 'pdf' | 'csv') => {
    if (!data) return;
    try {
      const isPDF = type === 'pdf';
      const content = isPDF ? generateReportText(false) : generateCSV();
      const extension = isPDF ? 'txt' : 'csv';
      const mimeType = isPDF ? 'text/plain' : 'text/csv';
      const fileName = `Praxis_Report_${data.month}.${extension}`;
      
      const filePath = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(filePath, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      await Sharing.shareAsync(filePath, {
        mimeType: mimeType,
        dialogTitle: `Share ${isPDF ? 'Report' : 'CSV'}`,
      });
    } catch (e: any) {
      console.error('Share error:', e);
      Alert.alert("Error", e?.message || `Could not share ${type.toUpperCase()}.`);
    }
  };

  const shareWithCA = async () => {
    if (!data) return;
    try {
      await Share.share({
        message: generateReportText(true),
        title: `Praxis CA Package - ${data.month}`,
      });
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not share.");
    }
  };

  if (loading || !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <ActivityIndicator color={theme.color.brand} />
          <Text style={styles.loadingText}>Generating report…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const scoreColor =
    data.health_score >= 70
      ? theme.color.success
      : data.health_score >= 40
      ? theme.color.warning
      : theme.color.error;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView 
        contentContainerStyle={styles.content} 
        testID="reports-scroll"
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.eyebrow}>PRAXIS · REPORTS</Text>
        <Text style={[styles.h1, serif]}>Monthly summary.</Text>

        {/* Month */}
        <View style={styles.card}>
          <Text style={styles.miniLabel}>MONTH</Text>
          <Text style={[styles.month, serifBold]}>
            {new Date(`${data.month}-01T00:00:00Z`).toLocaleDateString("en-IN", {
              month: "long",
              year: "numeric",
            })}
          </Text>
        </View>

        {/* Income, Expenses, Safe */}
        <View style={styles.card}>
          <Text style={styles.miniLabel}>INCOME</Text>
          <Text style={[styles.big, serifBold, { color: theme.color.success }]}>
            {formatINR(data.monthly_income)}
          </Text>
          <View style={styles.hairline} />
          <Text style={styles.miniLabel}>EXPENSES</Text>
          <Text style={[styles.big, serifBold, { color: theme.color.error }]}>
            {formatINR(data.total_spent)}
          </Text>
          <View style={styles.hairline} />
          <Text style={styles.miniLabel}>SAFE TO SPEND</Text>
          <Text style={[styles.big, serifBold, { color: theme.color.brand }]}>
            {formatINR(data.safe_to_spend)}
          </Text>
        </View>

        {/* Net Worth, Savings Rate, Health Score */}
        <View style={styles.card}>
          <Text style={styles.miniLabel}>NET WORTH</Text>
          <Text style={[styles.big, serifBold]}>{formatINR(data.net_worth)}</Text>
          <View style={styles.hairline} />
          <Text style={styles.miniLabel}>SAVINGS RATE</Text>
          <Text style={[styles.big, serifBold, { color: data.savings_rate > 20 ? theme.color.success : theme.color.warning }]}>
            {data.savings_rate}%
          </Text>
          <View style={styles.hairline} />
          <Text style={styles.miniLabel}>HEALTH SCORE</Text>
          <Text style={[styles.big, serifBold, { color: scoreColor }]}>
            {data.health_score}/100
          </Text>
        </View>

        {/* Emergency Fund */}
        <View style={styles.card}>
          <Text style={styles.miniLabel}>EMERGENCY FUND</Text>
          <Text style={[styles.mid, serif]}>{formatINR(data.profile.emergency_fund)}</Text>
          <Text style={styles.footnote}>Target: {formatINR(data.emergency_fund_target)}</Text>
          <View style={styles.bar}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${Math.min(100, data.emergency_fund_progress)}%`,
                  backgroundColor: data.emergency_fund_progress >= 100 ? theme.color.success : theme.color.brand,
                },
              ]}
            />
          </View>
          <Text style={styles.footnote}>{data.emergency_fund_progress}% funded</Text>
        </View>

        {/* Category Breakdown */}
        <View style={styles.card}>
          <Text style={styles.miniLabel}>CATEGORY BREAKDOWN</Text>
          {Object.keys(data.by_category).length === 0 ? (
            <Text style={styles.empty}>No entries this month.</Text>
          ) : (
            Object.entries(data.by_category)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amt]) => (
                <View key={cat} style={styles.catRow}>
                  <Text style={styles.catName}>{cat}</Text>
                  <Text style={styles.catAmt}>{formatINR(amt)}</Text>
                </View>
              ))
          )}
        </View>

        {/* Export Section */}
        <View style={styles.exportSection}>
          <Text style={styles.sectionH}>📤 Share report</Text>
          <View style={styles.exportRow}>
            <Pressable style={styles.exportBtn} onPress={shareText}>
              <Feather name="message-square" size={16} color="#FFFFFF" />
              <Text style={styles.exportBtnText}>Text</Text>
            </Pressable>
            <Pressable style={[styles.exportBtn, styles.exportBtnSecondary]} onPress={() => shareAsFile('pdf')}>
              <Feather name="file-text" size={16} color="#FFFFFF" />
              <Text style={styles.exportBtnText}>PDF</Text>
            </Pressable>
            <Pressable style={[styles.exportBtn, styles.exportBtnGreen]} onPress={() => shareAsFile('csv')}>
              <Feather name="file" size={16} color="#FFFFFF" />
              <Text style={styles.exportBtnText}>CSV</Text>
            </Pressable>
          </View>
        </View>

        {/* CA Package */}
        <View style={styles.caPackage}>
          <Text style={styles.sectionH}>📋 Human-CA Package</Text>
          <Text style={styles.caPackageDesc}>
            Share a complete summary with your Chartered Accountant for tax filing and financial review.
          </Text>
          <Pressable style={styles.caBtn} onPress={shareWithCA}>
            <Feather name="users" size={20} color="#FFFFFF" />
            <Text style={styles.caBtnText}>Share with CA</Text>
          </Pressable>
        </View>

        {/* Bottom padding - prevents cut */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface },
  content: { 
    paddingHorizontal: theme.spacing.md, // Reduced from xl
    paddingTop: theme.spacing.md,
    paddingBottom: 100,
  },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 12, color: theme.color.muted, letterSpacing: 1 },
  eyebrow: {
    color: theme.color.brand,
    letterSpacing: 3,
    fontSize: 11,
    fontWeight: "700",
  },
  h1: { fontSize: 28, color: theme.color.onSurface, marginTop: 4, marginBottom: 16 },
  card: {
    backgroundColor: theme.color.surfaceSecondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.borderStrong,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: 4,
  },
  miniLabel: {
    fontSize: 10,
    letterSpacing: 2,
    color: theme.color.muted,
    fontWeight: "700",
  },
  month: { fontSize: 22, color: theme.color.onSurface, marginTop: 4 },
  big: { fontSize: 26, color: theme.color.onSurface, marginTop: 4 },
  mid: { fontSize: 20, color: theme.color.onSurface, marginTop: 4 },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.color.divider,
    marginVertical: theme.spacing.sm,
  },
  bar: {
    height: 4,
    backgroundColor: theme.color.brandTertiary,
    marginTop: theme.spacing.sm,
    overflow: "hidden",
    borderRadius: 2,
  },
  barFill: { height: "100%", borderRadius: 2 },
  footnote: { fontSize: 11, color: theme.color.muted, marginTop: 4 },
  catRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.color.divider,
  },
  catName: { fontSize: 13, color: theme.color.onSurface, textTransform: "capitalize" },
  catAmt: { fontSize: 13, color: theme.color.onSurface, fontWeight: "600" },
  empty: { color: theme.color.muted, fontSize: 13, fontStyle: "italic", marginTop: theme.spacing.sm },
  exportSection: {
    backgroundColor: theme.color.surfaceSecondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.borderStrong,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
    borderRadius: 4,
  },
  sectionH: {
    fontSize: 11,
    letterSpacing: 2.5,
    fontWeight: "700",
    color: theme.color.brand,
    marginBottom: theme.spacing.sm,
  },
  exportRow: { flexDirection: "row", gap: theme.spacing.sm },
  exportBtn: {
    flex: 1,
    backgroundColor: theme.color.brand,
    paddingVertical: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 4,
  },
  exportBtnSecondary: {
    backgroundColor: theme.color.brandSecondary,
  },
  exportBtnGreen: {
    backgroundColor: theme.color.success,
  },
  exportBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "600", letterSpacing: 0.5 },
  caPackage: {
    backgroundColor: theme.color.surfaceSecondary,
    borderWidth: 2,
    borderColor: theme.color.brand,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
    borderRadius: 4,
  },
  caPackageDesc: {
    fontSize: 13,
    color: theme.color.onSurfaceTertiary,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  caBtn: {
    backgroundColor: theme.color.brand,
    paddingVertical: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    borderRadius: 4,
  },
  caBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600", letterSpacing: 0.5 },
});
