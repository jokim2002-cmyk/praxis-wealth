import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";

import { theme } from "@/src/utils/theme";
import { api, formatINR, TaxSummary, TaxCompare } from "@/src/utils/api";
import { serif, serifBold } from "@/src/utils/fonts";

export default function TaxScreen() {
  const [data, setData] = useState<TaxSummary | null>(null);
  const [compare, setCompare] = useState<TaxCompare | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([api.taxSummary(), api.taxCompare()]);
      setData(s);
      setCompare(c);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading || !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <ActivityIndicator color={theme.color.brand} />
          <Text style={styles.loadingText}>Calculating projected liability…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const c80 = data.section_80c;
  const c80Pct = Math.min(100, (c80.used / c80.limit) * 100);
  const advDate = data.advance_tax.next_due_date
    ? new Date(data.advance_tax.next_due_date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} testID="tax-scroll">
        <Text style={styles.eyebrow}>THE TAX LEDGER</Text>
        <Text style={[styles.h1, serif]}>Projected FY liability.</Text>

        <View style={styles.card}>
          <Text style={styles.miniLabel}>ANNUAL INCOME</Text>
          <Text style={[styles.big, serifBold]}>{formatINR(data.annual_income)}</Text>
          <View style={styles.hairline} />
          <View style={styles.splitRow}>
            <View style={styles.split}>
              <Text style={styles.miniLabel}>PROJECTED TAX</Text>
              <Text style={[styles.mid, serif, { color: theme.color.error }]} testID="projected-tax">
                {formatINR(data.projected_tax)}
              </Text>
            </View>
            <View style={styles.vertRule} />
            <View style={styles.split}>
              <Text style={styles.miniLabel}>EFFECTIVE RATE</Text>
              <Text style={[styles.mid, serif]}>{data.effective_rate}%</Text>
            </View>
          </View>
          <Text style={styles.footnote}>
            Estimated under the New Regime, FY 2024-25 slabs. Not a substitute for a full return.
          </Text>
        </View>

        {/* Section 80C */}
        <View style={styles.card}>
          <Text style={styles.sectionH}>Section 80C</Text>
          <View style={styles.row}>
            <Text style={styles.body}>
              {formatINR(c80.used)} of {formatINR(c80.limit)} used
            </Text>
            <Text style={styles.body}>{c80Pct.toFixed(0)}%</Text>
          </View>
          <View style={styles.bar}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${c80Pct}%`,
                  backgroundColor: c80Pct >= 100 ? theme.color.success : theme.color.brand,
                },
              ]}
            />
          </View>
          <Text style={styles.footnote}>
            You can still invest {formatINR(c80.remaining)} in ELSS, PPF, EPF, life insurance, or
            NSC to claim under 80C (Old Regime).
          </Text>
        </View>

        {/* Old vs New Regime */}
        {compare && compare.gross > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionH}>Old vs New Regime</Text>
            <View style={styles.regimeRow}>
              <View
                style={[
                  styles.regimeCol,
                  compare.recommended === "old" && styles.regimeColActive,
                ]}
                testID="regime-old"
              >
                <Text style={styles.regimeName}>OLD</Text>
                <Text style={[styles.regimeAmt, serifBold]}>
                  {formatINR(compare.old_regime.total)}
                </Text>
                <Text style={styles.regimeMeta}>
                  Deductions {formatINR(compare.old_regime.deductions)}
                </Text>
                <Text style={styles.regimeMeta}>
                  Taxable {formatINR(compare.old_regime.taxable)}
                </Text>
              </View>
              <View style={styles.vertRule} />
              <View
                style={[
                  styles.regimeCol,
                  compare.recommended === "new" && styles.regimeColActive,
                ]}
                testID="regime-new"
              >
                <Text style={styles.regimeName}>NEW</Text>
                <Text style={[styles.regimeAmt, serifBold]}>
                  {formatINR(compare.new_regime.total)}
                </Text>
                <Text style={styles.regimeMeta}>
                  Std deduction {formatINR(compare.new_regime.deductions)}
                </Text>
                <Text style={styles.regimeMeta}>
                  Taxable {formatINR(compare.new_regime.taxable)}
                </Text>
              </View>
            </View>
            <View style={styles.recommendStrip} testID="regime-recommendation">
              <Feather name="check-circle" size={12} color={theme.color.success} />
              <Text style={styles.recommendText}>
                {compare.recommended === "new" ? "New" : "Old"} regime saves you{" "}
                <Text style={{ fontWeight: "700" }}>{formatINR(compare.delta)}</Text> this FY.
              </Text>
            </View>
            <Text style={styles.footnote}>
              Old regime auto-includes ₹50k standard deduction + 80C. New regime uses ₹75k standard
              deduction and 87A rebate up to ₹7L taxable.
            </Text>
          </View>
        )}

        {/* Advance Tax */}
        <View style={styles.card}>
          <Text style={styles.sectionH}>Advance Tax</Text>
          <View style={styles.row}>
            <View>
              <Text style={styles.miniLabel}>NEXT INSTALLMENT</Text>
              <Text style={[styles.mid, serif]} testID="advance-tax-date">{advDate}</Text>
            </View>
            <View>
              <Text style={styles.miniLabel}>DUE AMOUNT</Text>
              <Text style={[styles.mid, serif]}>
                {formatINR(data.advance_tax.next_due_amount)}
              </Text>
            </View>
          </View>
          <View style={styles.reminderStrip}>
            <Feather name="bell" size={12} color={theme.color.brand} />
            <Text style={styles.reminderText}>
              CBDT installments: 15% by 15 Jun · 45% by 15 Sep · 75% by 15 Dec · 100% by 15 Mar.
            </Text>
          </View>
        </View>

        {/* Placeholder for LTCG/STCG/F&O */}
        <View style={styles.card}>
          <Text style={styles.sectionH}>Capital Gains & F&amp;O</Text>
          <View style={styles.cgRow}>
            <CgItem k="STCG (15%)" v="—" />
            <CgItem k="LTCG (12.5%)" v="—" />
            <CgItem k="F&O P&L" v="—" />
          </View>
          <Text style={styles.footnote}>
            Log broker P&amp;L via the Entries tab with the &quot;Investment&quot; category.
            Detailed capital-gains tracking is coming in the next phase.
          </Text>
          <Pressable style={styles.linkBtn} testID="cg-comingsoon">
            <Feather name="external-link" size={12} color={theme.color.brand} />
            <Text style={styles.linkBtnText}>Learn how STCG / LTCG is computed</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CgItem({ k, v }: { k: string; v: string }) {
  return (
    <View style={styles.cg}>
      <Text style={styles.miniLabel}>{k.toUpperCase()}</Text>
      <Text style={[styles.mid, serif]}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 12, color: theme.color.muted, letterSpacing: 1 },
  content: { padding: theme.spacing.xl, paddingBottom: 40 },
  eyebrow: { color: theme.color.brand, letterSpacing: 3, fontSize: 10, fontWeight: "700" },
  h1: { fontSize: 28, color: theme.color.onSurface, marginTop: 4, marginBottom: theme.spacing.xl },
  card: {
    backgroundColor: theme.color.surfaceSecondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.borderStrong,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  miniLabel: {
    fontSize: 10,
    letterSpacing: 2,
    color: theme.color.muted,
    fontWeight: "700",
  },
  big: { fontSize: 40, color: theme.color.onSurface, marginTop: 4 },
  mid: { fontSize: 20, color: theme.color.onSurface, marginTop: 4 },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.color.divider,
    marginVertical: theme.spacing.lg,
  },
  splitRow: { flexDirection: "row" },
  split: { flex: 1 },
  vertRule: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: theme.color.divider,
    marginHorizontal: theme.spacing.lg,
  },
  footnote: {
    marginTop: theme.spacing.md,
    fontSize: 11,
    color: theme.color.muted,
    lineHeight: 16,
  },
  sectionH: {
    fontSize: 11,
    letterSpacing: 2.5,
    fontWeight: "700",
    color: theme.color.brand,
    marginBottom: theme.spacing.md,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  body: { fontSize: 13, color: theme.color.onSurface, fontWeight: "500" },
  bar: {
    height: 4,
    backgroundColor: theme.color.brandTertiary,
    marginTop: theme.spacing.md,
    overflow: "hidden",
  },
  barFill: { height: "100%" },
  reminderStrip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.color.divider,
  },
  reminderText: { flex: 1, fontSize: 11, color: theme.color.onSurfaceTertiary, lineHeight: 16 },
  cgRow: { flexDirection: "row", gap: theme.spacing.md, marginTop: theme.spacing.sm },
  cg: { flex: 1 },
  linkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: theme.spacing.md,
  },
  linkBtnText: { fontSize: 12, color: theme.color.brand, fontWeight: "600" },
  regimeRow: { flexDirection: "row", marginTop: theme.spacing.sm },
  regimeCol: {
    flex: 1,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.color.borderStrong,
  },
  regimeColActive: {
    borderColor: theme.color.brand,
    backgroundColor: theme.color.brandTertiary,
  },
  regimeName: {
    fontSize: 10,
    letterSpacing: 3,
    color: theme.color.brand,
    fontWeight: "700",
  },
  regimeAmt: { fontSize: 22, color: theme.color.onSurface, marginTop: 6 },
  regimeMeta: { fontSize: 11, color: theme.color.muted, marginTop: 4 },
  recommendStrip: {
    marginTop: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: theme.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.color.divider,
  },
  recommendText: {
    flex: 1,
    fontSize: 13,
    color: theme.color.onSurface,
    lineHeight: 18,
  },
});
