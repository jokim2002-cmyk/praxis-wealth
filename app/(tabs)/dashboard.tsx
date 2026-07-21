import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";

import { theme } from "@/src/utils/theme";
import { api, formatINR, DashboardData } from "@/src/utils/api";
import { serif, serifBold } from "@/src/utils/fonts";
import { SyncIndicator } from "@/src/components/SyncIndicator";

export default function DashboardScreen() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [insight, setInsight] = useState<{ headline?: string; insight: string; tips: string[] } | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await api.dashboard();
      setData(d);
    } catch (e) {
      console.warn(e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const runInsight = async () => {
    setLoadingInsight(true);
    try {
      const r = await api.aiInsights();
      setInsight(r);
    } finally {
      setLoadingInsight(false);
    }
  };

  if (!data) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <ActivityIndicator color={theme.color.brand} />
          <Text style={styles.loadingText}>Crunching numbers…</Text>
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        testID="dashboard-scroll"
      >
        {/* Header with Sync Indicator */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>
              PRAXIS ·{" "}
              {new Date(`${data.month}-01T00:00:00Z`)
                .toLocaleDateString("en-IN", { month: "short", year: "numeric" })
                .toUpperCase()}
            </Text>
            <Text style={[styles.hello, serif]}>Good day, {data.profile.name || "you"}.</Text>
          </View>
          <SyncIndicator />
        </View>

        {/* Net Worth Card - UPDATED with Smart Fields */}
        <View style={styles.netCard}>
          <Text style={styles.miniLabel}>NET WORTH</Text>
          <Text style={[styles.netValue, serifBold]} testID="net-worth-value">
            {formatINR(data.net_worth)}
          </Text>
          <View style={styles.hairline} />
          
          {/* Smart Spending Row */}
          <View style={styles.splitRow}>
            <View style={styles.split}>
              <Text style={styles.miniLabel}>SAFE TO SPEND</Text>
              <Text style={[styles.splitValue, serif]} testID="safe-to-spend">
                {formatINR(data.safe_to_spend)}
              </Text>
            </View>
            <View style={styles.vertRule} />
            <View style={styles.split}>
              <Text style={styles.miniLabel}>DAILY SAFE SPEND</Text>
              <Text style={[styles.splitValue, serif, { color: theme.color.brand }]}>
                {formatINR(data.daily_safe_spend)}
              </Text>
            </View>
          </View>
          
          <View style={styles.hairline} />
          
          {/* Budget Breakdown Row */}
          <View style={styles.splitRow}>
            <View style={styles.split}>
              <Text style={styles.miniLabel}>FIXED BILLS</Text>
              <Text style={[styles.splitValue, serif, { color: theme.color.warning }]}>
                {formatINR(data.fixed_bills)}
              </Text>
            </View>
            <View style={styles.vertRule} />
            <View style={styles.split}>
              <Text style={styles.miniLabel}>SAVINGS TARGET</Text>
              <Text style={[styles.splitValue, serif, { color: theme.color.success }]}>
                {formatINR(data.savings_target)}
              </Text>
            </View>
          </View>
        </View>

        {/* Health Score */}
        <View style={styles.section}>
          <Text style={styles.sectionH}>Financial Health</Text>
          <View style={styles.healthRow}>
            <View>
              <Text style={[styles.healthScore, serifBold, { color: scoreColor }]}>
                {data.health_score}
                <Text style={styles.healthOf}> / 100</Text>
              </Text>
              <Text style={styles.helper}>
                Savings rate {data.savings_rate}% · EF {data.emergency_fund_progress}%
              </Text>
            </View>
            <Pressable
              testID="ai-insight-btn"
              onPress={runInsight}
              style={styles.pillBtn}
              disabled={loadingInsight}
            >
              <Feather name="cpu" size={14} color={theme.color.onSurface} />
              <Text style={styles.pillBtnText}>
                {loadingInsight ? "Reading…" : "Ask CA"}
              </Text>
            </Pressable>
          </View>
          <View style={styles.bar}>
            <View style={[styles.barFill, { width: `${data.health_score}%`, backgroundColor: scoreColor }]} />
          </View>

          {insight && (
            <View style={styles.insightBox} testID="ai-insight-box">
              {!!insight.headline && (
                <Text style={[styles.insightHeadline, serif]}>{insight.headline}</Text>
              )}
              <Text style={styles.insightBody}>{insight.insight}</Text>
              {insight.tips?.map((t, i) => (
                <View key={i} style={styles.tipRow}>
                  <View style={styles.tipDot} />
                  <Text style={styles.tipText}>{t}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Liquidity */}
        <View style={styles.section}>
          <Text style={styles.sectionH}>Cash & Liquidity</Text>
          <View style={styles.liqRow}>
            <Cell k="Bank" v={formatINR(data.profile.bank_balance)} />
            <Cell k="Cash" v={formatINR(data.profile.cash_on_hand)} />
            <Cell k="Emergency" v={formatINR(data.profile.emergency_fund)} />
          </View>
          <View style={styles.tipStrip}>
            <Feather name="info" size={12} color={theme.color.brand} />
            <Text style={styles.tipStripText}>
              Keep about {formatINR(data.suggested_cash_on_hand)} as physical cash based on your
              recent spend.
            </Text>
          </View>
        </View>

        {/* Category spend */}
        <View style={styles.section}>
          <Text style={styles.sectionH}>Category ledger</Text>
          {Object.keys(data.by_category).length === 0 ? (
            <Text style={styles.empty}>No entries this month yet.</Text>
          ) : (
            Object.entries(data.by_category)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 6)
              .map(([cat, spent]) => {
                const budget = data.budgets[cat] || 0;
                const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
                const over = budget > 0 && spent > budget;
                return (
                  <View key={cat} style={styles.catRow}>
                    <View style={styles.catHead}>
                      <Text style={styles.catName}>{cat}</Text>
                      <Text style={[styles.catAmt, over && { color: theme.color.error }]}>
                        {formatINR(spent)}{" "}
                        <Text style={styles.catBudget}>/ {formatINR(budget)}</Text>
                      </Text>
                    </View>
                    <View style={styles.bar}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: `${pct}%`,
                            backgroundColor: over ? theme.color.error : theme.color.brand,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })
          )}
        </View>

        {/* Quick add */}
        <Pressable
          testID="dashboard-add-expense"
          style={styles.addBtn}
          onPress={() => router.push("/(tabs)/expenses")}
        >
          <Feather name="plus" size={16} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Log an entry</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Cell({ k, v }: { k: string; v: string }) {
  return (
    <View style={styles.cell}>
      <Text style={styles.miniLabel}>{k.toUpperCase()}</Text>
      <Text style={[styles.cellV, serif]}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface },
  content: { padding: theme.spacing.xl, paddingBottom: 40 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 12, color: theme.color.muted, letterSpacing: 1 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  eyebrow: {
    color: theme.color.brand,
    letterSpacing: 3,
    fontSize: 11,
    fontWeight: "700",
  },
  hello: { fontSize: 28, color: theme.color.onSurface, marginTop: 4 },
  netCard: {
    backgroundColor: theme.color.surfaceSecondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.borderStrong,
    padding: theme.spacing.xl,
  },
  miniLabel: {
    fontSize: 10,
    letterSpacing: 2,
    color: theme.color.muted,
    fontWeight: "700",
  },
  netValue: {
    fontSize: 44,
    color: theme.color.onSurface,
    marginTop: 6,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.color.divider,
    marginVertical: theme.spacing.lg,
  },
  splitRow: { flexDirection: "row", alignItems: "stretch" },
  split: { flex: 1 },
  vertRule: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: theme.color.divider,
    marginHorizontal: theme.spacing.lg,
  },
  splitValue: { fontSize: 20, color: theme.color.onSurface, marginTop: 4 },
  section: {
    marginTop: theme.spacing.xl,
    backgroundColor: theme.color.surfaceSecondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.borderStrong,
    padding: theme.spacing.xl,
  },
  sectionH: {
    fontSize: 11,
    letterSpacing: 2.5,
    fontWeight: "700",
    color: theme.color.brand,
    marginBottom: theme.spacing.lg,
  },
  healthRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  healthScore: { fontSize: 42, color: theme.color.onSurface },
  healthOf: { fontSize: 16, color: theme.color.muted, fontWeight: "400" },
  helper: { color: theme.color.muted, fontSize: 12, marginTop: 4 },
  pillBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: theme.color.borderStrong,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pillBtnText: { fontSize: 12, fontWeight: "600", color: theme.color.onSurface },
  bar: {
    height: 4,
    backgroundColor: theme.color.brandTertiary,
    marginTop: theme.spacing.md,
    overflow: "hidden",
  },
  barFill: { height: "100%", backgroundColor: theme.color.brand },
  insightBox: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.color.brandTertiary,
    padding: theme.spacing.lg,
  },
  insightHeadline: { fontSize: 16, color: theme.color.onBrandTertiary, marginBottom: 6 },
  insightBody: { fontSize: 13, color: theme.color.onBrandTertiary, lineHeight: 20 },
  tipRow: { flexDirection: "row", marginTop: 10, gap: 8 },
  tipDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.color.brand,
    marginTop: 8,
  },
  tipText: { flex: 1, fontSize: 12, color: theme.color.onBrandTertiary, lineHeight: 18 },
  liqRow: { flexDirection: "row", justifyContent: "space-between" },
  cell: { flex: 1 },
  cellV: { fontSize: 18, color: theme.color.onSurface, marginTop: 4 },
  tipStrip: {
    marginTop: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: theme.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.color.divider,
  },
  tipStripText: { flex: 1, fontSize: 12, color: theme.color.onSurfaceTertiary, lineHeight: 18 },
  catRow: { marginBottom: theme.spacing.lg },
  catHead: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  catName: {
    fontSize: 13,
    color: theme.color.onSurface,
    textTransform: "capitalize",
    fontWeight: "500",
  },
  catAmt: { fontSize: 13, color: theme.color.onSurface, fontWeight: "600" },
  catBudget: { color: theme.color.muted, fontWeight: "400" },
  empty: { color: theme.color.muted, fontSize: 13, fontStyle: "italic" },
  addBtn: {
    marginTop: theme.spacing.xl,
    backgroundColor: theme.color.brand,
    paddingVertical: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
  },
  addBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600", letterSpacing: 1 },
});
