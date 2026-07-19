import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";

import { theme } from "@/src/utils/theme";
import { api, formatINR, Transaction, Category } from "@/src/utils/api";
import { serif } from "@/src/utils/fonts";

export default function ExpensesScreen() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [modal, setModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [selectedCat, setSelectedCat] = useState<string>("auto");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const load = useCallback(async () => {
    const [t, c] = await Promise.all([api.listTransactions(), api.categories()]);
    setTxs(t.transactions);
    setCats(c.categories);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = useMemo(() => {
    if (filter === "all") return txs;
    return txs.filter((t) => t.category === filter);
  }, [txs, filter]);

  const grouped = useMemo(() => {
    const groups: { title: string; data: Transaction[] }[] = [];
    const map: Record<string, Transaction[]> = {};
    filtered.forEach((t) => {
      const d = new Date(t.date);
      const key = d.toDateString();
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    Object.entries(map)
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .forEach(([k, v]) => groups.push({ title: k, data: v }));
    return groups;
  }, [filtered]);

  const flatData = useMemo(() => {
    const out: (
      | { type: "header"; title: string }
      | { type: "tx"; tx: Transaction }
    )[] = [];
    grouped.forEach((g) => {
      out.push({ type: "header", title: g.title });
      g.data.forEach((tx) => out.push({ type: "tx", tx }));
    });
    return out;
  }, [grouped]);

  const submit = async () => {
    const num = parseFloat(amount);
    if (!num || num <= 0 || !desc.trim()) {
      Alert.alert("Missing details", "Please enter a valid amount and description.");
      return;
    }
    setSaving(true);
    try {
      await api.createTransaction({
        amount: num,
        description: desc.trim(),
        category: selectedCat === "auto" ? undefined : selectedCat,
        type,
        auto_categorize: selectedCat === "auto",
      });
      setAmount("");
      setDesc("");
      setSelectedCat("auto");
      setType("expense");
      setModal(false);
      await load();
    } catch (e: any) {
      Alert.alert("Failed to save", e?.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    await api.deleteTransaction(id);
    load();
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>THE LEDGER</Text>
          <Text style={[styles.h1, serif]}>Entries</Text>
        </View>
        <Pressable
          testID="add-expense-fab"
          onPress={() => setModal(true)}
          style={styles.fab}
        >
          <Feather name="plus" size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Filter chips */}
      <View style={styles.chipRowWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          <Chip label="All" active={filter === "all"} onPress={() => setFilter("all")} />
          {cats.map((c) => (
            <Chip
              key={c.key}
              label={c.label}
              active={filter === c.key}
              onPress={() => setFilter(c.key)}
            />
          ))}
        </ScrollView>
      </View>

      {flatData.length === 0 ? (
        <View style={styles.emptyBox}>
          <Feather name="book" size={28} color={theme.color.muted} />
          <Text style={[styles.emptyTitle, serif]}>An empty ledger.</Text>
          <Text style={styles.emptyText}>
            Tap the + button to log your first entry. I&apos;ll categorise it for you.
          </Text>
        </View>
      ) : (
        <FlatList
          data={flatData}
          keyExtractor={(item, i) =>
            item.type === "header" ? `h-${item.title}` : `t-${item.tx.id}-${i}`
          }
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => {
            if (item.type === "header") {
              return (
                <View style={styles.groupHeader}>
                  <Text style={styles.groupHeaderText}>
                    {new Date(item.title).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </Text>
                </View>
              );
            }
            const t = item.tx;
            return (
              <Pressable
                onLongPress={() =>
                  Alert.alert("Delete entry?", t.description, [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: () => remove(t.id) },
                  ])
                }
                style={styles.txRow}
                testID={`tx-row-${t.id}`}
              >
                <View style={styles.txLeft}>
                  <Text style={styles.txDesc}>{t.description}</Text>
                  <Text style={styles.txMeta}>
                    {t.category}
                    {t.ai_categorized ? "  ·  ai" : ""}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.txAmt,
                    { color: t.type === "income" ? theme.color.success : theme.color.onSurface },
                  ]}
                >
                  {t.type === "income" ? "+" : "−"}
                  {formatINR(t.amount)}
                </Text>
              </Pressable>
            );
          }}
        />
      )}

      {/* Add sheet */}
      <Modal visible={modal} animationType="slide" transparent onRequestClose={() => setModal(false)}>
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable style={styles.backdropFill} onPress={() => setModal(false)} />
          <View style={styles.sheet} testID="add-expense-sheet">
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, serif]}>New entry</Text>

            <View style={styles.typeRow}>
              {(["expense", "income"] as const).map((tp) => (
                <Pressable
                  key={tp}
                  testID={`type-${tp}`}
                  onPress={() => setType(tp)}
                  style={[styles.typeBtn, type === tp && styles.typeBtnActive]}
                >
                  <Text
                    style={[
                      styles.typeBtnText,
                      type === tp && styles.typeBtnTextActive,
                    ]}
                  >
                    {tp}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Amount (₹)</Text>
            <TextInput
              testID="amount-input"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={theme.color.muted}
              style={[styles.input, { fontSize: 28 }]}
            />

            <Text style={styles.label}>What was it?</Text>
            <TextInput
              testID="desc-input"
              value={desc}
              onChangeText={setDesc}
              placeholder="e.g. Zomato dinner"
              placeholderTextColor={theme.color.muted}
              style={styles.input}
            />

            {type === "expense" && (
              <>
                <Text style={styles.label}>Category</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingRight: 20 }}
                >
                  <Chip
                    label="AI auto"
                    active={selectedCat === "auto"}
                    onPress={() => setSelectedCat("auto")}
                    icon="cpu"
                  />
                  {cats.map((c) => (
                    <Chip
                      key={c.key}
                      label={c.label}
                      active={selectedCat === c.key}
                      onPress={() => setSelectedCat(c.key)}
                    />
                  ))}
                </ScrollView>
              </>
            )}

            <Pressable
              testID="save-tx-btn"
              onPress={submit}
              disabled={saving}
              style={[styles.saveBtn, saving && { opacity: 0.5 }]}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="check" size={16} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>Save entry</Text>
                </>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function Chip({
  label,
  active,
  onPress,
  icon,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      testID={`chip-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      {icon && (
        <Feather
          name={icon}
          size={12}
          color={active ? "#FFFFFF" : theme.color.onSurface}
          style={{ marginRight: 6 }}
        />
      )}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
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
  chipRowWrap: {
    height: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.color.divider,
    justifyContent: "center",
  },
  chipRow: {
    gap: 8,
    paddingHorizontal: theme.spacing.xl,
    alignItems: "center",
  },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: theme.color.borderStrong,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    flexShrink: 0,
  },
  chipActive: { backgroundColor: theme.color.brand, borderColor: theme.color.brand },
  chipText: { fontSize: 12, color: theme.color.onSurface, textTransform: "capitalize" },
  chipTextActive: { color: "#FFFFFF", fontWeight: "600" },
  emptyBox: { flex: 1, alignItems: "center", justifyContent: "center", padding: theme.spacing.xl },
  emptyTitle: { fontSize: 22, color: theme.color.onSurface, marginTop: 12 },
  emptyText: {
    color: theme.color.muted,
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
    maxWidth: 260,
  },
  groupHeader: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    backgroundColor: theme.color.surfaceTertiary,
  },
  groupHeaderText: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "700",
    color: theme.color.onSurfaceTertiary,
    textTransform: "uppercase",
  },
  txRow: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.color.divider,
    justifyContent: "space-between",
    backgroundColor: theme.color.surfaceSecondary,
  },
  txLeft: { flex: 1 },
  txDesc: { fontSize: 14, color: theme.color.onSurface, fontWeight: "500" },
  txMeta: {
    fontSize: 11,
    color: theme.color.muted,
    marginTop: 4,
    textTransform: "capitalize",
    letterSpacing: 0.5,
  },
  txAmt: { fontSize: 15, fontWeight: "600" },
  modalBackdrop: { flex: 1, justifyContent: "flex-end" },
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
  sheetTitle: { fontSize: 22, color: theme.color.onSurface, marginBottom: theme.spacing.lg },
  typeRow: { flexDirection: "row", gap: 8, marginBottom: theme.spacing.lg },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.color.borderStrong,
    alignItems: "center",
  },
  typeBtnActive: { backgroundColor: theme.color.brand, borderColor: theme.color.brand },
  typeBtnText: { color: theme.color.onSurface, fontSize: 13, textTransform: "capitalize" },
  typeBtnTextActive: { color: "#FFFFFF", fontWeight: "600" },
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
  saveBtn: {
    marginTop: theme.spacing.xl,
    backgroundColor: theme.color.brand,
    paddingVertical: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600", letterSpacing: 1 },
});
