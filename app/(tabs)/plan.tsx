import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";

import { theme } from "@/src/utils/theme";
import { api, formatINR, Goal, Bill, EmergencyPlan } from "@/src/utils/api";
import { serif, serifBold } from "@/src/utils/fonts";

type Section = "goals" | "bills" | "emergency";

export default function PlanScreen() {
  const [section, setSection] = useState<Section>("goals");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [plan, setPlan] = useState<EmergencyPlan | null>(null);
  const [loading, setLoading] = useState(true);

  // Add sheets
  const [goalModal, setGoalModal] = useState(false);
  const [gName, setGName] = useState("");
  const [gTarget, setGTarget] = useState("");
  const [gSaved, setGSaved] = useState("");
  const [gKind, setGKind] = useState<"personal" | "investment" | "working_capital">("personal");
  const [saving, setSaving] = useState(false);

  const [billModal, setBillModal] = useState(false);
  const [bName, setBName] = useState("");
  const [bAmt, setBAmt] = useState("");
  const [bKind, setBKind] = useState<"utility" | "subscription">("utility");
  const [bDay, setBDay] = useState("1");

  const [efContribAmt, setEfContribAmt] = useState("");

  // Goal contribution modal
  const [contribModal, setContribModal] = useState<Goal | null>(null);
  const [contribAmt, setContribAmt] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [g, b, p] = await Promise.all([
        api.listGoals(),
        api.listBills(),
        api.emergencyPlan(),
      ]);
      setGoals(g.goals);
      setBills(b.bills);
      setPlan(p);
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

  const saveGoal = async () => {
    const t = parseFloat(gTarget);
    if (!gName.trim() || !t || t <= 0) {
      Alert.alert("Missing details", "Enter a goal name and target amount.");
      return;
    }
    setSaving(true);
    try {
      await api.createGoal({
        name: gName.trim(),
        target: t,
        saved: parseFloat(gSaved) || 0,
        kind: gKind,
      });
      setGName("");
      setGTarget("");
      setGSaved("");
      setGKind("personal");
      setGoalModal(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const saveBill = async () => {
    const a = parseFloat(bAmt);
    const d = parseInt(bDay, 10);
    if (!bName.trim() || !a || a <= 0 || !d) {
      Alert.alert("Missing details", "Fill name, amount, and due day.");
      return;
    }
    setSaving(true);
    try {
      await api.createBill({
        name: bName.trim(),
        amount: a,
        kind: bKind,
        day_of_month: Math.max(1, Math.min(28, d)),
      });
      setBName("");
      setBAmt("");
      setBDay("1");
      setBKind("utility");
      setBillModal(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const contribute = (g: Goal) => {
    setContribAmt("");
    setContribModal(g);
  };

  const submitContribution = async () => {
    if (!contribModal) return;
    const n = parseFloat(contribAmt);
    if (!n || n <= 0) return;
    await api.contributeGoal(contribModal.id, n);
    setContribModal(null);
    setContribAmt("");
    load();
  };

  const toggleBill = async (id: string) => {
    await api.toggleBillPaid(id);
    load();
  };

  const contributeEF = async () => {
    const n = parseFloat(efContribAmt);
    if (!n || n <= 0) {
      Alert.alert("Enter amount", "How much do you want to add to your emergency fund?");
      return;
    }
    const prof = await api.getProfile();
    await api.updateProfile({ emergency_fund: (prof.emergency_fund || 0) + n });
    setEfContribAmt("");
    load();
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>THE PLAN</Text>
          <Text style={[styles.h1, serif]}>Look ahead.</Text>
        </View>
        {section !== "emergency" && (
          <Pressable
            testID={section === "goals" ? "add-goal-fab" : "add-bill-fab"}
            style={styles.fab}
            onPress={() => (section === "goals" ? setGoalModal(true) : setBillModal(true))}
          >
            <Feather name="plus" size={18} color="#FFFFFF" />
          </Pressable>
        )}
      </View>

      {/* Segmented control */}
      <View style={styles.segmentedWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.segmentedRow}
        >
          {(["goals", "bills", "emergency"] as const).map((s) => (
            <Pressable
              key={s}
              testID={`plan-tab-${s}`}
              onPress={() => setSection(s)}
              style={[styles.segChip, section === s && styles.segChipActive]}
            >
              <Text
                style={[
                  styles.segChipText,
                  section === s && styles.segChipTextActive,
                ]}
              >
                {s === "emergency" ? "Emergency Fund" : s === "bills" ? "Bills & Subs" : "Goals"}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.color.brand} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} testID={`plan-content-${section}`}>
          {section === "goals" && (
            <GoalsView goals={goals} onContribute={contribute} onLoad={load} />
          )}
          {section === "bills" && <BillsView bills={bills} onToggle={toggleBill} onLoad={load} />}
          {section === "emergency" && plan && (
            <EmergencyView
              plan={plan}
              contribAmt={efContribAmt}
              setContribAmt={setEfContribAmt}
              onContribute={contributeEF}
            />
          )}
        </ScrollView>
      )}

      {/* Goal Modal */}
      <Modal visible={goalModal} animationType="slide" transparent onRequestClose={() => setGoalModal(false)}>
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable style={styles.backdropFill} onPress={() => setGoalModal(false)} />
          <ScrollView
            style={styles.sheet}
            contentContainerStyle={{ paddingBottom: theme.spacing.xxl }}
            keyboardShouldPersistTaps="handled"
            testID="add-goal-sheet"
          >
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, serif]}>New goal</Text>

            <Text style={styles.label}>Name</Text>
            <TextInput
              testID="goal-name-input"
              style={styles.input}
              value={gName}
              onChangeText={setGName}
              placeholder="e.g. Kerala trip"
              placeholderTextColor={theme.color.muted}
            />

            <Text style={styles.label}>Target amount (₹)</Text>
            <TextInput
              testID="goal-target-input"
              style={styles.input}
              value={gTarget}
              onChangeText={setGTarget}
              keyboardType="numeric"
              placeholder="e.g. 120000"
              placeholderTextColor={theme.color.muted}
            />

            <Text style={styles.label}>Already saved (₹, optional)</Text>
            <TextInput
              testID="goal-saved-input"
              style={styles.input}
              value={gSaved}
              onChangeText={setGSaved}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={theme.color.muted}
            />

            <Text style={styles.label}>Bucket</Text>
            <View style={styles.typeRow}>
              {(["personal", "investment", "working_capital"] as const).map((k) => (
                <Pressable
                  key={k}
                  onPress={() => setGKind(k)}
                  style={[styles.typeBtn, gKind === k && styles.typeBtnActive]}
                >
                  <Text
                    style={[
                      styles.typeBtnText,
                      gKind === k && styles.typeBtnTextActive,
                    ]}
                  >
                    {k === "working_capital" ? "Working capital" : k}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              testID="save-goal-btn"
              onPress={saveGoal}
              disabled={saving}
              style={[styles.saveBtn, saving && { opacity: 0.5 }]}
            >
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveBtnText}>Save goal</Text>}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Bill Modal */}
      <Modal visible={billModal} animationType="slide" transparent onRequestClose={() => setBillModal(false)}>
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable style={styles.backdropFill} onPress={() => setBillModal(false)} />
          <ScrollView
            style={styles.sheet}
            contentContainerStyle={{ paddingBottom: theme.spacing.xxl }}
            keyboardShouldPersistTaps="handled"
            testID="add-bill-sheet"
          >
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, serif]}>New bill or subscription</Text>

            <Text style={styles.label}>Name</Text>
            <TextInput
              testID="bill-name-input"
              style={styles.input}
              value={bName}
              onChangeText={setBName}
              placeholder="e.g. Airtel broadband"
              placeholderTextColor={theme.color.muted}
            />

            <Text style={styles.label}>Amount (₹)</Text>
            <TextInput
              testID="bill-amount-input"
              style={styles.input}
              value={bAmt}
              onChangeText={setBAmt}
              keyboardType="numeric"
              placeholder="e.g. 999"
              placeholderTextColor={theme.color.muted}
            />

            <Text style={styles.label}>Kind</Text>
            <View style={styles.typeRow}>
              {(["utility", "subscription"] as const).map((k) => (
                <Pressable
                  key={k}
                  onPress={() => setBKind(k)}
                  style={[styles.typeBtn, bKind === k && styles.typeBtnActive]}
                >
                  <Text
                    style={[
                      styles.typeBtnText,
                      bKind === k && styles.typeBtnTextActive,
                    ]}
                  >
                    {k}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Due day of month (1–28)</Text>
            <TextInput
              testID="bill-day-input"
              style={styles.input}
              value={bDay}
              onChangeText={setBDay}
              keyboardType="numeric"
              placeholder="e.g. 5"
              placeholderTextColor={theme.color.muted}
            />

            <Pressable
              testID="save-bill-btn"
              onPress={saveBill}
              disabled={saving}
              style={[styles.saveBtn, saving && { opacity: 0.5 }]}
            >
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveBtnText}>Save bill</Text>}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
      {/* Goal Contribution Modal */}
      <Modal
        visible={!!contribModal}
        animationType="fade"
        transparent
        onRequestClose={() => setContribModal(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalCenter}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable style={styles.backdropFill} onPress={() => setContribModal(null)} />
          <View style={styles.centerSheet} testID="goal-contribute-sheet">
            <Text style={[styles.sheetTitle, serif]}>Add to {contribModal?.name}</Text>
            <TextInput
              testID="goal-contribute-input"
              style={[styles.input, { fontSize: 24 }]}
              value={contribAmt}
              onChangeText={setContribAmt}
              keyboardType="numeric"
              placeholder="₹0"
              placeholderTextColor={theme.color.muted}
              autoFocus
            />
            <View style={{ flexDirection: "row", gap: 8, marginTop: theme.spacing.lg }}>
              <Pressable
                style={[styles.secondaryBtn, { flex: 1 }]}
                onPress={() => setContribModal(null)}
              >
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                testID="goal-contribute-save"
                style={[styles.saveBtn, { flex: 1, marginTop: 0 }]}
                onPress={submitContribution}
              >
                <Text style={styles.saveBtnText}>Add</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function GoalsView({
  goals,
  onContribute,
  onLoad,
}: {
  goals: Goal[];
  onContribute: (g: Goal) => void;
  onLoad: () => void;
}) {
  if (goals.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Feather name="target" size={28} color={theme.color.muted} />
        <Text style={[styles.emptyTitle, serif]}>No goals yet.</Text>
        <Text style={styles.emptyText}>
          Create a savings bucket for a trip, a car, an investment, or working capital.
        </Text>
      </View>
    );
  }
  return (
    <View>
      {goals.map((g) => {
        const pct = g.target > 0 ? Math.min(100, (g.saved / g.target) * 100) : 0;
        const remaining = Math.max(0, g.target - g.saved);
        return (
          <View key={g.id} style={styles.goalCard} testID={`goal-${g.id}`}>
            <View style={styles.goalHead}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.goalName, serif]}>{g.name}</Text>
                <Text style={styles.goalKind}>{g.kind.replace("_", " ")}</Text>
              </View>
              <View style={styles.goalActions}>
                <Pressable
                  onPress={() => onContribute(g)}
                  style={styles.smallBtn}
                  testID={`goal-add-${g.id}`}
                >
                  <Feather name="plus" size={12} color={theme.color.brand} />
                  <Text style={styles.smallBtnText}>Add</Text>
                </Pressable>
                <Pressable
                  onPress={async () => {
                    await api.deleteGoal(g.id);
                    onLoad();
                  }}
                  style={[styles.smallBtn, { marginLeft: 6 }]}
                  testID={`goal-del-${g.id}`}
                >
                  <Feather name="trash-2" size={12} color={theme.color.error} />
                </Pressable>
              </View>
            </View>
            <View style={styles.goalAmts}>
              <Text style={[styles.goalSaved, serif]}>{formatINR(g.saved)}</Text>
              <Text style={styles.goalTarget}> / {formatINR(g.target)}</Text>
            </View>
            <View style={styles.bar}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${pct}%`,
                    backgroundColor: pct >= 100 ? theme.color.success : theme.color.brand,
                  },
                ]}
              />
            </View>
            <Text style={styles.goalFoot}>
              {pct >= 100 ? "Goal reached." : `${formatINR(remaining)} remaining · ${pct.toFixed(0)}%`}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function BillsView({
  bills,
  onToggle,
  onLoad,
}: {
  bills: Bill[];
  onToggle: (id: string) => void;
  onLoad: () => void;
}) {
  if (bills.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Feather name="calendar" size={28} color={theme.color.muted} />
        <Text style={[styles.emptyTitle, serif]}>No bills tracked.</Text>
        <Text style={styles.emptyText}>
          Add recurring utility bills and digital subscriptions to get monthly reminders.
        </Text>
      </View>
    );
  }
  const totalMonth = bills.reduce((s, b) => s + (b.active ? b.amount : 0), 0);
  const unpaid = bills.reduce((s, b) => s + (b.active && !b.paid_this_month ? b.amount : 0), 0);
  return (
    <View>
      <View style={styles.summaryCard}>
        <View style={styles.splitRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.miniLabel}>MONTHLY OUTGO</Text>
            <Text style={[styles.midVal, serif]}>{formatINR(totalMonth)}</Text>
          </View>
          <View style={styles.vertRule} />
          <View style={{ flex: 1 }}>
            <Text style={styles.miniLabel}>UNPAID THIS MONTH</Text>
            <Text
              style={[
                styles.midVal,
                serif,
                { color: unpaid > 0 ? theme.color.error : theme.color.success },
              ]}
            >
              {formatINR(unpaid)}
            </Text>
          </View>
        </View>
      </View>

      {bills.map((b) => (
        <View key={b.id} style={styles.billRow} testID={`bill-${b.id}`}>
          <View style={{ flex: 1 }}>
            <Text style={styles.billName}>{b.name}</Text>
            <Text style={styles.billMeta}>
              {b.kind} · due {b.day_of_month} of month ·{" "}
              {b.paid_this_month
                ? "paid"
                : (b.days_until_due ?? 0) === 0
                ? "due today"
                : `in ${b.days_until_due} day${(b.days_until_due ?? 0) === 1 ? "" : "s"}`}
            </Text>
          </View>
          <Text style={styles.billAmt}>{formatINR(b.amount)}</Text>
          <Pressable
            onPress={() => onToggle(b.id)}
            style={[styles.payBtn, b.paid_this_month && styles.payBtnActive]}
            testID={`bill-toggle-${b.id}`}
          >
            <Feather
              name={b.paid_this_month ? "check" : "circle"}
              size={14}
              color={b.paid_this_month ? "#FFFFFF" : theme.color.onSurface}
            />
          </Pressable>
          <Pressable
            onPress={async () => {
              await api.deleteBill(b.id);
              onLoad();
            }}
            style={styles.trashBtn}
            testID={`bill-del-${b.id}`}
          >
            <Feather name="trash-2" size={12} color={theme.color.muted} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

function EmergencyView({
  plan,
  contribAmt,
  setContribAmt,
  onContribute,
}: {
  plan: EmergencyPlan;
  contribAmt: string;
  setContribAmt: (v: string) => void;
  onContribute: () => void;
}) {
  const pct = plan.progress_pct;
  return (
    <View>
      <View style={styles.efCard}>
        <Text style={styles.miniLabel}>6-MONTH SAFETY NET</Text>
        <Text style={[styles.efTarget, serifBold]}>{formatINR(plan.target)}</Text>
        <Text style={styles.efFoot}>
          Based on average monthly spend of {formatINR(plan.avg_monthly_spend)}.
        </Text>

        <View style={styles.hairline} />

        <View style={styles.splitRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.miniLabel}>SAVED</Text>
            <Text style={[styles.midVal, serif, { color: theme.color.success }]}>
              {formatINR(plan.saved)}
            </Text>
          </View>
          <View style={styles.vertRule} />
          <View style={{ flex: 1 }}>
            <Text style={styles.miniLabel}>REMAINING</Text>
            <Text style={[styles.midVal, serif]}>{formatINR(plan.remaining)}</Text>
          </View>
        </View>

        <View style={[styles.bar, { marginTop: theme.spacing.lg }]}>
          <View
            style={[
              styles.barFill,
              {
                width: `${pct}%`,
                backgroundColor: pct >= 100 ? theme.color.success : theme.color.brand,
              },
            ]}
          />
        </View>
        <Text style={styles.efFoot}>{pct.toFixed(0)}% funded</Text>
      </View>

      <View style={styles.efCard}>
        <Text style={styles.sectionH}>Contribution plan</Text>
        <Text style={styles.body}>
          To reach the target in{" "}
          <Text style={{ fontWeight: "700" }}>{plan.contribution_horizon_months} months</Text>,
          set aside{" "}
          <Text style={{ fontWeight: "700", color: theme.color.brand }}>
            {formatINR(plan.monthly_contribution)}
          </Text>{" "}
          each month ({plan.contribution_of_income_pct}% of your monthly income).
        </Text>

        <View style={styles.efInputRow}>
          <TextInput
            testID="ef-contribute-input"
            style={[styles.input, { flex: 1 }]}
            value={contribAmt}
            onChangeText={setContribAmt}
            keyboardType="numeric"
            placeholder="Add to emergency fund (₹)"
            placeholderTextColor={theme.color.muted}
          />
          <Pressable
            testID="ef-contribute-btn"
            onPress={onContribute}
            style={styles.efAddBtn}
          >
            <Feather name="arrow-right" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface },
  header: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  eyebrow: {
    color: theme.color.brand,
    letterSpacing: 3,
    fontSize: 10,
    fontWeight: "700",
  },
  h1: { fontSize: 28, color: theme.color.onSurface, marginTop: 2 },
  fab: {
    width: 44,
    height: 44,
    backgroundColor: theme.color.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentedWrap: {
    height: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.color.divider,
    justifyContent: "center",
  },
  segmentedRow: {
    gap: 8,
    paddingHorizontal: theme.spacing.xl,
    alignItems: "center",
  },
  segChip: {
    height: 36,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.color.borderStrong,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  segChipActive: { backgroundColor: theme.color.brand, borderColor: theme.color.brand },
  segChipText: { fontSize: 12, color: theme.color.onSurface, fontWeight: "500" },
  segChipTextActive: { color: "#FFFFFF", fontWeight: "700" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 40 },
  content: { padding: theme.spacing.xl, paddingBottom: 40 },
  emptyBox: { alignItems: "center", justifyContent: "center", padding: theme.spacing.xl, paddingTop: 60 },
  emptyTitle: { fontSize: 22, color: theme.color.onSurface, marginTop: 12 },
  emptyText: {
    color: theme.color.muted,
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
    maxWidth: 260,
  },

  // Goals
  goalCard: {
    backgroundColor: theme.color.surfaceSecondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.borderStrong,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  goalHead: { flexDirection: "row", alignItems: "flex-start" },
  goalName: { fontSize: 20, color: theme.color.onSurface },
  goalKind: {
    fontSize: 10,
    letterSpacing: 2,
    color: theme.color.muted,
    marginTop: 4,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  goalActions: { flexDirection: "row" },
  smallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: theme.color.borderStrong,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  smallBtnText: { fontSize: 11, color: theme.color.brand, fontWeight: "600" },
  goalAmts: { flexDirection: "row", alignItems: "baseline", marginTop: theme.spacing.md },
  goalSaved: { fontSize: 26, color: theme.color.onSurface },
  goalTarget: { fontSize: 14, color: theme.color.muted },
  goalFoot: { fontSize: 11, color: theme.color.muted, marginTop: 8 },

  // Bills
  summaryCard: {
    backgroundColor: theme.color.surfaceSecondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.borderStrong,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  billRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.color.surfaceSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.color.divider,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  billName: { fontSize: 14, color: theme.color.onSurface, fontWeight: "500" },
  billMeta: { fontSize: 11, color: theme.color.muted, marginTop: 3 },
  billAmt: { fontSize: 14, fontWeight: "600", color: theme.color.onSurface, marginRight: 4 },
  payBtn: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: theme.color.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  payBtnActive: { backgroundColor: theme.color.success, borderColor: theme.color.success },
  trashBtn: { padding: 4 },

  // Emergency
  efCard: {
    backgroundColor: theme.color.surfaceSecondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.borderStrong,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  efTarget: { fontSize: 36, color: theme.color.onSurface, marginTop: 6 },
  efFoot: { fontSize: 11, color: theme.color.muted, marginTop: 6 },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.color.divider,
    marginVertical: theme.spacing.lg,
  },
  splitRow: { flexDirection: "row" },
  vertRule: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: theme.color.divider,
    marginHorizontal: theme.spacing.lg,
  },
  midVal: { fontSize: 20, color: theme.color.onSurface, marginTop: 4 },
  miniLabel: {
    fontSize: 10,
    letterSpacing: 2,
    color: theme.color.muted,
    fontWeight: "700",
  },
  sectionH: {
    fontSize: 11,
    letterSpacing: 2.5,
    fontWeight: "700",
    color: theme.color.brand,
    marginBottom: theme.spacing.md,
  },
  body: { fontSize: 13, color: theme.color.onSurface, lineHeight: 20 },
  bar: {
    height: 4,
    backgroundColor: theme.color.brandTertiary,
    marginTop: theme.spacing.md,
    overflow: "hidden",
  },
  barFill: { height: "100%", backgroundColor: theme.color.brand },
  efInputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginTop: theme.spacing.md },
  efAddBtn: {
    width: 44,
    height: 44,
    backgroundColor: theme.color.brand,
    alignItems: "center",
    justifyContent: "center",
  },

  // Modal
  modalBackdrop: { flex: 1, justifyContent: "flex-end" },
  modalCenter: { flex: 1, justifyContent: "center", padding: theme.spacing.xl },
  centerSheet: {
    backgroundColor: theme.color.surfaceSecondary,
    padding: theme.spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.borderStrong,
  },
  secondaryBtn: {
    paddingVertical: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.color.borderStrong,
    alignItems: "center",
  },
  secondaryBtnText: { color: theme.color.onSurface, fontSize: 14, fontWeight: "500" },
  backdropFill: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(26,26,24,0.35)" },
  sheet: {
    backgroundColor: theme.color.surfaceSecondary,
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.color.borderStrong,
  },
  sheetHandle: {
    width: 40,
    height: 3,
    backgroundColor: theme.color.borderStrong,
    alignSelf: "center",
    marginBottom: theme.spacing.lg,
  },
  sheetTitle: { fontSize: 22, color: theme.color.onSurface, marginBottom: theme.spacing.md },
  label: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "700",
    color: theme.color.muted,
    marginTop: theme.spacing.md,
    marginBottom: 6,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: theme.color.borderStrong,
    paddingVertical: 10,
    fontSize: 16,
    color: theme.color.onSurface,
  },
  typeRow: { flexDirection: "row", gap: 8 },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.color.borderStrong,
    alignItems: "center",
  },
  typeBtnActive: { backgroundColor: theme.color.brand, borderColor: theme.color.brand },
  typeBtnText: { color: theme.color.onSurface, fontSize: 12, textTransform: "capitalize" },
  typeBtnTextActive: { color: "#FFFFFF", fontWeight: "600" },
  saveBtn: {
    marginTop: theme.spacing.xl,
    backgroundColor: theme.color.brand,
    paddingVertical: theme.spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600", letterSpacing: 1 },
});
