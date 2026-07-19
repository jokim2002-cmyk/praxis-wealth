import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL || "";
export const API = `${BASE}/api`;

const LOCAL_ONLY =
  !BASE ||
  BASE.includes("preview.emergentagent.com") ||
  BASE.includes("localhost") ||
  BASE.includes("127.0.0.1");

const STORE_KEY = "praxis_local_store_v2";

type ChatEntry = { role: "user" | "assistant"; content: string; timestamp: string };
type LocalStore = {
  profile: Profile;
  budgets: Record<string, number>;
  transactions: Transaction[];
  goals: Goal[];
  bills: Bill[];
  chats: Record<string, ChatEntry[]>;
};

const DEFAULT_CATEGORIES: Category[] = [
  { key: "food", label: "Food & Dining", icon: "coffee" },
  { key: "groceries", label: "Groceries", icon: "shopping-bag" },
  { key: "transport", label: "Transport", icon: "truck" },
  { key: "utilities", label: "Utilities & Bills", icon: "zap" },
  { key: "rent", label: "Rent & Housing", icon: "home" },
  { key: "entertainment", label: "Entertainment", icon: "film" },
  { key: "shopping", label: "Shopping", icon: "shopping-cart" },
  { key: "health", label: "Health & Medical", icon: "heart" },
  { key: "education", label: "Education", icon: "book" },
  { key: "subscriptions", label: "Subscriptions", icon: "repeat" },
  { key: "travel", label: "Travel", icon: "map" },
  { key: "investment", label: "Investment", icon: "trending-up" },
  { key: "insurance", label: "Insurance", icon: "shield" },
  { key: "tax", label: "Tax Payment", icon: "file-text" },
  { key: "other", label: "Other", icon: "more-horizontal" },
];

const DEFAULT_BUDGETS: Record<string, number> = {
  food: 8000,
  groceries: 10000,
  transport: 5000,
  utilities: 4000,
  rent: 20000,
  entertainment: 3000,
  shopping: 5000,
  health: 2000,
  education: 2000,
  subscriptions: 1500,
  travel: 3000,
  investment: 15000,
  insurance: 2000,
  tax: 0,
  other: 2000,
};

function id() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthKey(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return currentMonthKey();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function initialStore(): LocalStore {
  return {
    profile: {
      id: id(),
      name: "You",
      monthly_income: 0,
      income_type: "fixed",
      cash_on_hand: 0,
      bank_balance: 0,
      emergency_fund: 0,
      onboarded: false,
    },
    budgets: { ...DEFAULT_BUDGETS },
    transactions: [],
    goals: [],
    bills: [],
    chats: {},
  };
}

async function readStore(): Promise<LocalStore> {
  const raw = await AsyncStorage.getItem(STORE_KEY);
  if (!raw) {
    const seed = initialStore();
    await AsyncStorage.setItem(STORE_KEY, JSON.stringify(seed));
    return seed;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<LocalStore>;
    return {
      ...initialStore(),
      ...parsed,
      profile: { ...initialStore().profile, ...(parsed.profile || {}) },
      budgets: { ...DEFAULT_BUDGETS, ...(parsed.budgets || {}) },
      transactions: parsed.transactions || [],
      goals: parsed.goals || [],
      bills: parsed.bills || [],
      chats: parsed.chats || {},
    };
  } catch {
    const seed = initialStore();
    await AsyncStorage.setItem(STORE_KEY, JSON.stringify(seed));
    return seed;
  }
}

async function writeStore(store: LocalStore) {
  await AsyncStorage.setItem(STORE_KEY, JSON.stringify(store));
}

async function remote<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, init);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`${res.status}: ${txt}`);
  }
  return res.json();
}

async function withFallback<T>(remoteCall: () => Promise<T>, localCall: () => Promise<T>): Promise<T> {
  if (LOCAL_ONLY) return localCall();
  try {
    return await remoteCall();
  } catch (error) {
    console.warn("Praxis remote API unavailable; using private on-device storage.", error);
    return localCall();
  }
}

function categorise(description: string): string {
  const s = description.toLowerCase();
  const rules: Array<[string, string[]]> = [
    ["groceries", ["grocery", "milk", "vegetable", "fruit", "supermarket", "kirana"]],
    ["food", ["food", "restaurant", "dinner", "lunch", "breakfast", "zomato", "swiggy", "cafe"]],
    ["transport", ["fuel", "petrol", "diesel", "uber", "ola", "taxi", "bus", "train", "metro"]],
    ["rent", ["rent", "house", "lease"]],
    ["utilities", ["electric", "water", "gas", "broadband", "recharge", "mobile bill"]],
    ["subscriptions", ["netflix", "prime", "subscription", "spotify"]],
    ["health", ["doctor", "medicine", "hospital", "pharmacy", "health"]],
    ["education", ["course", "book", "school", "college", "tuition"]],
    ["investment", ["sip", "mutual fund", "stock", "investment", "ppf", "elss"]],
    ["insurance", ["insurance", "premium"]],
    ["travel", ["hotel", "flight", "travel", "trip"]],
    ["shopping", ["amazon", "flipkart", "shopping", "clothes"]],
    ["entertainment", ["movie", "cinema", "game"]],
    ["tax", ["tax", "gst", "advance tax"]],
  ];
  return rules.find(([, words]) => words.some((word) => s.includes(word)))?.[0] || "other";
}

function dashboardFrom(store: LocalStore): DashboardData {
  const mkey = currentMonthKey();
  const monthTx = store.transactions
    .filter((t) => monthKey(t.date) === mkey)
    .sort((a, b) => b.date.localeCompare(a.date));
  const totalSpent = monthTx.filter((t) => t.type === "expense").reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const extraIncome = monthTx.filter((t) => t.type === "income").reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const monthlyIncome = Number(store.profile.monthly_income || 0) + extraIncome;
  const byCategory: Record<string, number> = {};
  monthTx.filter((t) => t.type === "expense").forEach((t) => {
    byCategory[t.category] = (byCategory[t.category] || 0) + Number(t.amount || 0);
  });
  const totalBudget = Object.values(store.budgets).reduce((a, b) => a + Number(b || 0), 0);
  const safeToSpend = Math.max(0, monthlyIncome - totalSpent);
  const netWorth = Number(store.profile.cash_on_hand || 0) + Number(store.profile.bank_balance || 0) + Number(store.profile.emergency_fund || 0);
  const savingsRate = monthlyIncome > 0 ? Math.max(0, (monthlyIncome - totalSpent) / monthlyIncome) : 0;
  const efTarget = totalSpent > 0 ? totalSpent * 6 : Number(store.profile.monthly_income || 0) * 6;
  const efRatio = efTarget > 0 ? Math.min(1, Number(store.profile.emergency_fund || 0) / efTarget) : 0;
  const budgetHealth = totalBudget > 0 ? Math.max(0, 1 - totalSpent / totalBudget) : 1;
  const healthScore = Math.max(0, Math.min(100, Math.round(savingsRate * 40 + efRatio * 30 + budgetHealth * 30)));
  const suggestedCash = Math.round(Math.max(2000, Math.min(20000, totalSpent * 0.15 || 2000)));
  return {
    month: mkey,
    profile: store.profile,
    net_worth: netWorth,
    monthly_income: monthlyIncome,
    total_spent: totalSpent,
    total_budget: totalBudget,
    safe_to_spend: safeToSpend,
    savings_rate: Math.round(savingsRate * 1000) / 10,
    by_category: byCategory,
    budgets: store.budgets,
    health_score: healthScore,
    emergency_fund_target: Math.round(efTarget),
    emergency_fund_progress: Math.round(efRatio * 1000) / 10,
    suggested_cash_on_hand: suggestedCash,
    recent_transactions: monthTx.slice(0, 10),
  };
}

function slabTax(income: number, slabs: Array<[number, number]>) {
  let tax = 0;
  let remaining = Math.max(0, income);
  let prev = 0;
  for (const [cap, rate] of slabs) {
    const band = Math.max(0, Math.min(remaining, cap - prev));
    tax += band * rate;
    remaining -= band;
    prev = cap;
    if (remaining <= 0) break;
  }
  return tax;
}

function taxCompareFrom(store: LocalStore): TaxCompare {
  const gross = Number(store.profile.monthly_income || 0) * 12;
  const year = new Date().getFullYear().toString();
  const section80c = Math.min(
    150000,
    store.transactions
      .filter((t) => t.type === "expense" && t.category === "investment" && t.date.startsWith(year))
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)
  );
  const oldDeductions = 50000 + section80c;
  const taxableOld = Math.max(0, gross - oldDeductions);
  let oldTax = slabTax(taxableOld, [[250000, 0], [500000, 0.05], [1000000, 0.2], [Infinity, 0.3]]);
  if (taxableOld <= 500000) oldTax = Math.max(0, oldTax - 12500);
  const oldCess = oldTax * 0.04;
  const taxableNew = Math.max(0, gross - 75000);
  let newTax = slabTax(taxableNew, [[300000, 0], [700000, 0.05], [1000000, 0.1], [1200000, 0.15], [1500000, 0.2], [Infinity, 0.3]]);
  if (taxableNew <= 700000) newTax = 0;
  const newCess = newTax * 0.04;
  const oldTotal = oldTax + oldCess;
  const newTotal = newTax + newCess;
  return {
    gross,
    old_regime: { tax: Math.round(oldTax), taxable: Math.round(taxableOld), deductions: Math.round(oldDeductions), cess: Math.round(oldCess), total: Math.round(oldTotal) },
    new_regime: { tax: Math.round(newTax), taxable: Math.round(taxableNew), deductions: 75000, cess: Math.round(newCess), total: Math.round(newTotal) },
    recommended: newTotal <= oldTotal ? "new" : "old",
    delta: Math.round(Math.abs(oldTotal - newTotal)),
  };
}

function taxSummaryFrom(store: LocalStore): TaxSummary {
  const compare = taxCompareFrom(store);
  const annualIncome = compare.gross;
  const projectedTax = compare.new_regime.total;
  const year = new Date().getFullYear().toString();
  const used = Math.min(150000, store.transactions.filter((t) => t.type === "expense" && t.category === "investment" && t.date.startsWith(year)).reduce((sum, t) => sum + Number(t.amount || 0), 0));
  const now = new Date();
  const milestones: Array<[number, number, number]> = [[5, 15, 0.15], [8, 15, 0.45], [11, 15, 0.75], [2, 15, 1]];
  const candidates = milestones.map(([month, day, pct]) => {
    let yearValue = now.getFullYear();
    let date = new Date(yearValue, month, day);
    if (date < now) date = new Date(yearValue + 1, month, day);
    return { date, pct };
  }).sort((a, b) => a.date.getTime() - b.date.getTime());
  const next = candidates[0];
  return {
    annual_income: annualIncome,
    projected_tax: projectedTax,
    effective_rate: annualIncome > 0 ? Math.round((projectedTax / annualIncome) * 10000) / 100 : 0,
    section_80c: { limit: 150000, used: Math.round(used), remaining: Math.round(150000 - used) },
    advance_tax: { next_due_date: next?.date.toISOString() || null, next_due_pct_of_annual: next?.pct || null, next_due_amount: Math.round(projectedTax * (next?.pct || 0)) },
  };
}

function daysUntil(dayOfMonth: number) {
  const today = new Date();
  const day = Math.max(1, Math.min(28, dayOfMonth));
  let target = new Date(today.getFullYear(), today.getMonth(), day);
  if (target.getTime() < new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) {
    target = new Date(today.getFullYear(), today.getMonth() + 1, day);
  }
  return Math.max(0, Math.ceil((target.getTime() - today.getTime()) / 86400000));
}

export function formatINR(n: number, opts: { compact?: boolean; withSign?: boolean } = {}) {
  const { compact = false, withSign = false } = opts;
  if (isNaN(n)) return "₹0";
  const sign = n < 0 ? "-" : withSign && n > 0 ? "+" : "";
  const abs = Math.abs(n);
  if (compact) {
    if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)}Cr`;
    if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(2)}L`;
    if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(1)}K`;
  }
  return `${sign}₹${Math.round(abs).toLocaleString("en-IN")}`;
}

export const api = {
  categories: () => withFallback(() => remote<{ categories: Category[] }>("/categories"), async () => ({ categories: DEFAULT_CATEGORIES })),
  getProfile: () => withFallback(() => remote<Profile>("/profile"), async () => (await readStore()).profile),
  updateProfile: (p: Partial<Profile>) => withFallback(
    () => remote<Profile>("/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) }),
    async () => { const s = await readStore(); s.profile = { ...s.profile, ...p }; await writeStore(s); return s.profile; }
  ),
  getBudgets: () => withFallback(() => remote<{ budgets: Record<string, number> }>("/budgets"), async () => ({ budgets: (await readStore()).budgets })),
  updateBudgets: (budgets: Record<string, number>) => withFallback(
    () => remote<{ budgets: Record<string, number> }>("/budgets", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ budgets }) }),
    async () => { const s = await readStore(); s.budgets = { ...s.budgets, ...budgets }; await writeStore(s); return { budgets: s.budgets }; }
  ),
  listTransactions: (month?: string) => withFallback(
    () => remote<{ transactions: Transaction[] }>(`/transactions${month ? `?month=${month}` : ""}`),
    async () => { const s = await readStore(); const list = month ? s.transactions.filter((t) => monthKey(t.date) === month) : s.transactions; return { transactions: [...list].sort((a, b) => b.date.localeCompare(a.date)) }; }
  ),
  createTransaction: (payload: { amount: number; description: string; category?: string; type?: "expense" | "income"; notes?: string; auto_categorize?: boolean }) => withFallback(
    () => remote<Transaction>("/transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }),
    async () => { const s = await readStore(); const tx: Transaction = { id: id(), amount: Number(payload.amount || 0), description: payload.description, category: payload.category || (payload.auto_categorize === false ? "other" : categorise(payload.description)), type: payload.type || "expense", date: nowIso(), ai_categorized: !payload.category && payload.auto_categorize !== false, notes: payload.notes }; s.transactions.unshift(tx); await writeStore(s); return tx; }
  ),
  deleteTransaction: (txId: string) => withFallback(
    () => remote<{ deleted: boolean }>(`/transactions/${txId}`, { method: "DELETE" }),
    async () => { const s = await readStore(); s.transactions = s.transactions.filter((t) => t.id !== txId); await writeStore(s); return { deleted: true }; }
  ),
  dashboard: () => withFallback(() => remote<DashboardData>("/dashboard"), async () => dashboardFrom(await readStore())),
  aiInsights: () => withFallback(
    () => remote<{ headline?: string; insight: string; tips: string[]; snapshot?: any }>("/ai/insights", { method: "POST" }),
    async () => { const d = dashboardFrom(await readStore()); const over = d.total_spent > d.monthly_income && d.monthly_income > 0; return { headline: over ? "Spending is above this month’s income." : "Your ledger is ready for a practical review.", insight: `You have spent ${formatINR(d.total_spent)} against income of ${formatINR(d.monthly_income)}. Your current safe-to-spend amount is ${formatINR(d.safe_to_spend)}.`, tips: [d.savings_rate < 20 ? "Aim to move a small fixed amount to savings immediately after income arrives." : "Your savings rate is healthy; keep it consistent.", d.emergency_fund_progress < 50 ? "Build the emergency fund gradually before increasing discretionary spending." : "Your emergency-fund progress is improving.", "Review the largest expense category before the next purchase."], snapshot: d }; }
  ),
  aiChat: (message: string, session_id = "default") => withFallback(
    () => remote<{ reply: string; timestamp: string }>("/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, session_id }) }),
    async () => { const s = await readStore(); const d = dashboardFrom(s); const lower = message.toLowerCase(); let reply = `Your current safe-to-spend amount is ${formatINR(d.safe_to_spend)}. Add more transactions for a more useful answer.`; if (lower.includes("tax")) reply = `Your estimated new-regime tax is ${formatINR(taxCompareFrom(s).new_regime.total)}. This is a simplified estimate, not a filed tax return.`; else if (lower.includes("save") || lower.includes("saving")) reply = `A practical starting point is to protect ${Math.max(5, Math.min(20, Math.round(d.savings_rate || 10)))}% of monthly income and build the emergency fund first.`; else if (lower.includes("spend") || lower.includes("budget")) reply = `You have spent ${formatINR(d.total_spent)} this month. Your current safe-to-spend amount is ${formatINR(d.safe_to_spend)}.`; const timestamp = nowIso(); const history = s.chats[session_id] || []; history.push({ role: "user", content: message, timestamp }, { role: "assistant", content: reply, timestamp: nowIso() }); s.chats[session_id] = history; await writeStore(s); return { reply, timestamp: nowIso() }; }
  ),
  chatHistory: (session_id = "default") => withFallback(() => remote<{ messages: ChatEntry[] }>(`/ai/chat/history?session_id=${session_id}`), async () => ({ messages: (await readStore()).chats[session_id] || [] })),
  taxSummary: () => withFallback(() => remote<TaxSummary>("/tax/summary"), async () => taxSummaryFrom(await readStore())),
  taxCompare: () => withFallback(() => remote<TaxCompare>("/tax/compare"), async () => taxCompareFrom(await readStore())),
  listGoals: () => withFallback(() => remote<{ goals: Goal[] }>("/goals"), async () => ({ goals: (await readStore()).goals })),
  createGoal: (payload: { name: string; target: number; saved?: number; kind?: string; target_date?: string | null; icon?: string }) => withFallback(
    () => remote<Goal>("/goals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }),
    async () => { const s = await readStore(); const g: Goal = { id: id(), name: payload.name, target: Number(payload.target || 0), saved: Number(payload.saved || 0), kind: payload.kind || "personal", target_date: payload.target_date || null, icon: payload.icon || "target", created_at: nowIso() }; s.goals.unshift(g); await writeStore(s); return g; }
  ),
  contributeGoal: (goalId: string, amount: number) => withFallback(
    () => remote<Goal>(`/goals/${goalId}/contribute`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount }) }),
    async () => { const s = await readStore(); const g = s.goals.find((item) => item.id === goalId); if (!g) throw new Error("Goal not found"); g.saved = Math.max(0, Number(g.saved || 0) + Number(amount || 0)); await writeStore(s); return g; }
  ),
  deleteGoal: (goalId: string) => withFallback(() => remote<{ deleted: boolean }>(`/goals/${goalId}`, { method: "DELETE" }), async () => { const s = await readStore(); s.goals = s.goals.filter((g) => g.id !== goalId); await writeStore(s); return { deleted: true }; }),
  listBills: () => withFallback(
    () => remote<{ bills: Bill[]; total_month: number; unpaid_month: number }>("/bills"),
    async () => { const s = await readStore(); const mkey = currentMonthKey(); const bills = s.bills.map((b) => ({ ...b, days_until_due: daysUntil(b.day_of_month), paid_this_month: b.paid_months.includes(mkey) })).sort((a, b) => a.day_of_month - b.day_of_month); return { bills, total_month: bills.filter((b) => b.active).reduce((sum, b) => sum + b.amount, 0), unpaid_month: bills.filter((b) => b.active && !b.paid_this_month).reduce((sum, b) => sum + b.amount, 0) }; }
  ),
  createBill: (payload: { name: string; amount: number; kind?: string; day_of_month?: number }) => withFallback(
    () => remote<Bill>("/bills", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }),
    async () => { const s = await readStore(); const b: Bill = { id: id(), name: payload.name, amount: Number(payload.amount || 0), kind: payload.kind || "utility", day_of_month: Math.max(1, Math.min(28, Number(payload.day_of_month || 1))), paid_months: [], active: true }; s.bills.push(b); await writeStore(s); return b; }
  ),
  toggleBillPaid: (billId: string) => withFallback(
    () => remote<Bill>(`/bills/${billId}/toggle-paid`, { method: "POST" }),
    async () => { const s = await readStore(); const b = s.bills.find((item) => item.id === billId); if (!b) throw new Error("Bill not found"); const mkey = currentMonthKey(); if (b.paid_months.includes(mkey)) b.paid_months = b.paid_months.filter((m) => m !== mkey); else { b.paid_months.push(mkey); s.transactions.unshift({ id: id(), amount: b.amount, description: `${b.name} (bill)`, category: b.kind === "subscription" ? "subscriptions" : "utilities", type: "expense", date: nowIso(), ai_categorized: false }); } await writeStore(s); return { ...b, days_until_due: daysUntil(b.day_of_month), paid_this_month: b.paid_months.includes(mkey) }; }
  ),
  deleteBill: (billId: string) => withFallback(() => remote<{ deleted: boolean }>(`/bills/${billId}`, { method: "DELETE" }), async () => { const s = await readStore(); s.bills = s.bills.filter((b) => b.id !== billId); await writeStore(s); return { deleted: true }; }),
  emergencyPlan: (monthsTarget = 6, horizonMonths = 12) => withFallback(
    () => remote<EmergencyPlan>(`/emergency-fund/plan?months_target=${monthsTarget}&contribution_horizon_months=${horizonMonths}`),
    async () => { const s = await readStore(); const essentialKeys = ["food", "groceries", "rent", "utilities", "transport", "health", "insurance"]; const avg = essentialKeys.reduce((sum, key) => sum + Number(s.budgets[key] || 0), 0); const target = avg * monthsTarget; const saved = Number(s.profile.emergency_fund || 0); const remaining = Math.max(0, target - saved); const monthly = remaining > 0 ? Math.round(remaining / Math.max(1, horizonMonths)) : 0; return { avg_monthly_spend: Math.round(avg), months_target: monthsTarget, target: Math.round(target), saved: Math.round(saved), remaining: Math.round(remaining), progress_pct: target > 0 ? Math.round(Math.min(100, saved / target * 1000)) / 10 : 100, monthly_contribution: monthly, contribution_horizon_months: horizonMonths, contribution_of_income_pct: s.profile.monthly_income > 0 ? Math.round(monthly / s.profile.monthly_income * 1000) / 10 : 0 }; }
  ),
};

export type Category = { key: string; label: string; icon: string };
export type Profile = { id: string; name: string; monthly_income: number; income_type: string; cash_on_hand: number; bank_balance: number; emergency_fund: number; onboarded: boolean };
export type Transaction = { id: string; amount: number; description: string; category: string; type: "expense" | "income"; date: string; ai_categorized?: boolean; notes?: string };
export type DashboardData = { month: string; profile: Profile; net_worth: number; monthly_income: number; total_spent: number; total_budget: number; safe_to_spend: number; savings_rate: number; by_category: Record<string, number>; budgets: Record<string, number>; health_score: number; emergency_fund_target: number; emergency_fund_progress: number; suggested_cash_on_hand: number; recent_transactions: Transaction[] };
export type TaxSummary = { annual_income: number; projected_tax: number; effective_rate: number; section_80c: { limit: number; used: number; remaining: number }; advance_tax: { next_due_date: string | null; next_due_pct_of_annual: number | null; next_due_amount: number } };
export type TaxCompare = { gross: number; old_regime: { tax: number; taxable: number; deductions: number; cess: number; total: number }; new_regime: { tax: number; taxable: number; deductions: number; cess: number; total: number }; recommended: "old" | "new"; delta: number };
export type Goal = { id: string; name: string; target: number; saved: number; kind: string; target_date?: string | null; icon?: string; created_at: string };
export type Bill = { id: string; name: string; amount: number; kind: string; day_of_month: number; paid_months: string[]; active: boolean; days_until_due?: number; paid_this_month?: boolean };
export type EmergencyPlan = { avg_monthly_spend: number; months_target: number; target: number; saved: number; remaining: number; progress_pct: number; monthly_contribution: number; contribution_horizon_months: number; contribution_of_income_pct: number };
