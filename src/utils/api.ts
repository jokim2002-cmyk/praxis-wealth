import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "@/src/database/schema";

const STORE_KEY = "praxis_local_store_v2";
const MIGRATED_KEY = "praxis_migrated_v1";

// ---------- Helpers ----------
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

function formatINR(n: number, opts: { compact?: boolean; withSign?: boolean } = {}) {
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

// ---------- Database Helpers ----------
async function getProfile() {
  const result = await db.getFirstAsync<any>("SELECT * FROM profile WHERE deleted = 0 LIMIT 1");
  if (!result) return null;
  return {
    id: result.id,
    name: result.name,
    monthly_income: result.monthly_income,
    income_type: result.income_type,
    cash_on_hand: result.cash_on_hand,
    bank_balance: result.bank_balance,
    emergency_fund: result.emergency_fund,
    onboarded: result.onboarded === 1,
  };
}

async function getTransactions(month?: string) {
  let query = "SELECT * FROM transactions WHERE deleted = 0";
  const params: any[] = [];
  if (month) {
    const start = new Date(month + "-01T00:00:00Z").getTime();
    const end = new Date(month + "-01T00:00:00Z").getTime() + 31 * 24 * 60 * 60 * 1000;
    query += " AND date >= ? AND date < ?";
    params.push(start, end);
  }
  query += " ORDER BY date DESC";
  const rows = await db.getAllAsync<any>(query, ...params);
  return rows.map((r: any) => ({
    id: r.id,
    amount: r.amount,
    description: r.description,
    category: r.category,
    type: r.type,
    date: new Date(r.date).toISOString(),
    notes: r.notes,
    ai_categorized: r.ai_categorized === 1,
  }));
}

async function getBudgets() {
  const rows = await db.getAllAsync<any>("SELECT * FROM budgets WHERE deleted = 0");
  const budgets: Record<string, number> = {};
  rows.forEach((r: any) => { budgets[r.category_key] = r.amount; });
  return budgets;
}

async function getGoals() {
  const rows = await db.getAllAsync<any>("SELECT * FROM savings_goals WHERE deleted = 0");
  return rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    target: r.target,
    saved: r.saved,
    kind: r.kind,
    target_date: r.target_date ? new Date(r.target_date).toISOString() : null,
    icon: r.icon,
    created_at: new Date(r.created_at).toISOString(),
  }));
}

async function getBills() {
  const rows = await db.getAllAsync<any>("SELECT * FROM bills WHERE deleted = 0");
  const mkey = currentMonthKey();
  return rows.map((r: any) => {
    const paidMonths = r.paid_months ? JSON.parse(r.paid_months) : [];
    const day = Math.max(1, Math.min(28, r.day_of_month || 1));
    const today = new Date();
    let daysUntil = day - today.getDate();
    if (daysUntil < 0) daysUntil += 28;
    return {
      id: r.id,
      name: r.name,
      amount: r.amount,
      kind: r.kind,
      day_of_month: day,
      paid_months: paidMonths,
      active: r.active === 1,
      days_until_due: daysUntil,
      paid_this_month: paidMonths.includes(mkey),
    };
  });
}

// ---------- Tax Helpers ----------
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

function taxCompareFrom(profile: any, transactions: any[]) {
  const gross = Number(profile?.monthly_income || 0) * 12;
  const year = new Date().getFullYear().toString();
  const section80c = Math.min(
    150000,
    transactions
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

// ---------- SMART DASHBOARD (Phase 2) ----------
async function getDashboard() {
  const profile = await getProfile();
  const mkey = currentMonthKey();
  const txns = await getTransactions(mkey);
  const budgets = await getBudgets();
  const bills = await getBills();

  const totalSpent = txns.filter((t: any) => t.type === "expense").reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
  const extraIncome = txns.filter((t: any) => t.type === "income").reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
  const monthlyIncome = Number(profile?.monthly_income || 0) + extraIncome;

  // Fixed bills total
  const fixedBills = bills.filter((b: any) => b.active).reduce((sum: number, b: any) => sum + Number(b.amount || 0), 0);

  // Emergency reserve (minimum 3 months of essential expenses)
  const essentialKeys = ["food", "groceries", "rent", "utilities", "transport", "health", "insurance"];
  const essentialAvg = essentialKeys.reduce((sum, key) => sum + Number(budgets[key] || 0), 0);
  const emergencyReserve = essentialAvg * 3;

  // Savings target (default 20% of income)
  const savingsTarget = monthlyIncome * 0.2;

  // Monthly spendable amount = income - fixed bills - savings target - emergency reserve
  const spendableAmount = Math.max(0, monthlyIncome - fixedBills - savingsTarget - emergencyReserve);

  // Remaining spending capacity = spendableAmount - totalSpent
  const remainingCapacity = Math.max(0, spendableAmount - totalSpent);

  // Safe daily spending = remainingCapacity / remaining days
  const today = new Date();
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const remainingDays = Math.max(1, lastDay - today.getDate() + 1);
  const dailySafeSpend = Math.round((remainingCapacity / remainingDays) * 100) / 100;

  const byCategory: Record<string, number> = {};
  txns.filter((t: any) => t.type === "expense").forEach((t: any) => {
    byCategory[t.category] = (byCategory[t.category] || 0) + Number(t.amount || 0);
  });

  const totalBudget = Object.values(budgets).reduce((a: number, b: number) => a + Number(b || 0), 0);
  const netWorth = Number(profile?.cash_on_hand || 0) + Number(profile?.bank_balance || 0) + Number(profile?.emergency_fund || 0);
  const savingsRate = monthlyIncome > 0 ? Math.max(0, (monthlyIncome - totalSpent) / monthlyIncome) : 0;
  const efTarget = totalSpent > 0 ? totalSpent * 6 : Number(profile?.monthly_income || 0) * 6;
  const efRatio = efTarget > 0 ? Math.min(1, Number(profile?.emergency_fund || 0) / efTarget) : 0;
  const budgetHealth = totalBudget > 0 ? Math.max(0, 1 - totalSpent / totalBudget) : 1;
  const healthScore = Math.max(0, Math.min(100, Math.round(savingsRate * 40 + efRatio * 30 + budgetHealth * 30)));
  const suggestedCash = Math.round(Math.max(2000, Math.min(20000, totalSpent * 0.15 || 2000)));

  return {
    month: mkey,
    profile: profile || { name: "You", monthly_income: 0, income_type: "fixed", cash_on_hand: 0, bank_balance: 0, emergency_fund: 0, onboarded: false },
    net_worth: netWorth,
    monthly_income: monthlyIncome,
    total_spent: totalSpent,
    total_budget: totalBudget,
    safe_to_spend: Math.round(spendableAmount),
    remaining_capacity: Math.round(remainingCapacity),
    daily_safe_spend: dailySafeSpend,
    fixed_bills: Math.round(fixedBills),
    savings_target: Math.round(savingsTarget),
    emergency_reserve: Math.round(emergencyReserve),
    savings_rate: Math.round(savingsRate * 1000) / 10,
    by_category: byCategory,
    budgets: budgets,
    health_score: healthScore,
    emergency_fund_target: Math.round(efTarget),
    emergency_fund_progress: Math.round(efRatio * 1000) / 10,
    suggested_cash_on_hand: suggestedCash,
    recent_transactions: txns.slice(0, 10),
  };
}

// ---------- API Export ----------
export const api = {
  categories: async () => ({
    categories: [
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
    ]
  }),

  getProfile: getProfile,

  updateProfile: async (p: any) => {
    const current = await getProfile();
    if (!current) {
      await db.runAsync(
        `INSERT INTO profile (id, name, monthly_income, income_type, cash_on_hand, bank_balance, emergency_fund, onboarded, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id(),
        p.name || "You",
        p.monthly_income || 0,
        p.income_type || "fixed",
        p.cash_on_hand || 0,
        p.bank_balance || 0,
        p.emergency_fund || 0,
        p.onboarded ? 1 : 0,
        Date.now(),
        Date.now()
      );
    } else {
      await db.runAsync(
        `UPDATE profile SET name = ?, monthly_income = ?, income_type = ?, cash_on_hand = ?, bank_balance = ?, emergency_fund = ?, onboarded = ?, updated_at = ? WHERE id = ?`,
        p.name || current.name,
        p.monthly_income !== undefined ? p.monthly_income : current.monthly_income,
        p.income_type || current.income_type,
        p.cash_on_hand !== undefined ? p.cash_on_hand : current.cash_on_hand,
        p.bank_balance !== undefined ? p.bank_balance : current.bank_balance,
        p.emergency_fund !== undefined ? p.emergency_fund : current.emergency_fund,
        p.onboarded !== undefined ? (p.onboarded ? 1 : 0) : (current.onboarded ? 1 : 0),
        Date.now(),
        current.id
      );
    }
    return await getProfile();
  },

  getBudgets: async () => ({ budgets: await getBudgets() }),

  updateBudgets: async (budgets: Record<string, number>) => {
    await db.runAsync(`DELETE FROM budgets WHERE deleted = 0`);
    for (const [key, amount] of Object.entries(budgets)) {
      await db.runAsync(
        `INSERT INTO budgets (id, category_key, amount, period, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
        id(),
        key,
        amount,
        currentMonthKey(),
        Date.now(),
        Date.now()
      );
    }
    return { budgets };
  },

  listTransactions: async (month?: string) => {
    const txns = await getTransactions(month);
    return { transactions: txns };
  },

  createTransaction: async (payload: any) => {
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

    const tx: any = {
      id: id(),
      amount: Number(payload.amount || 0),
      description: payload.description,
      category: payload.category || (payload.auto_categorize === false ? "other" : categorise(payload.description)),
      type: payload.type || "expense",
      date: Date.now(),
      ai_categorized: !payload.category && payload.auto_categorize !== false ? 1 : 0,
      notes: payload.notes || "",
    };
    await db.runAsync(
      `INSERT INTO transactions (id, amount, description, category, type, date, notes, ai_categorized, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      tx.id,
      tx.amount,
      tx.description,
      tx.category,
      tx.type,
      tx.date,
      tx.notes,
      tx.ai_categorized,
      Date.now(),
      Date.now()
    );
    return {
      id: tx.id,
      amount: tx.amount,
      description: tx.description,
      category: tx.category,
      type: tx.type,
      date: new Date(tx.date).toISOString(),
      notes: tx.notes,
      ai_categorized: tx.ai_categorized === 1,
    };
  },

  deleteTransaction: async (txId: string) => {
    await db.runAsync(`UPDATE transactions SET deleted = 1, updated_at = ? WHERE id = ?`, Date.now(), txId);
    return { deleted: true };
  },

  dashboard: getDashboard,

  aiInsights: async () => {
    const d = await getDashboard();
    const over = d.total_spent > d.monthly_income && d.monthly_income > 0;
    return {
      headline: over ? "Spending is above this month's income." : "Your ledger is ready for a practical review.",
      insight: `You have spent ${formatINR(d.total_spent)} against income of ${formatINR(d.monthly_income)}. Your safe-to-spend amount is ${formatINR(d.safe_to_spend)}. Daily safe spend: ${formatINR(d.daily_safe_spend)}.`,
      tips: [
        d.savings_rate < 20 ? "Aim to move a small fixed amount to savings immediately after income arrives." : "Your savings rate is healthy; keep it consistent.",
        d.emergency_fund_progress < 50 ? "Build the emergency fund gradually before increasing discretionary spending." : "Your emergency-fund progress is improving.",
        `Your daily safe spending is ${formatINR(d.daily_safe_spend)}. Try to stay within this.`,
      ],
      snapshot: d,
    };
  },

  aiChat: async (message: string, session_id = "default") => {
    const d = await getDashboard();
    const lower = message.toLowerCase();
    let reply = `Your safe-to-spend amount is ${formatINR(d.safe_to_spend)}. Daily safe spend: ${formatINR(d.daily_safe_spend)}.`;
    if (lower.includes("tax")) {
      const profile = await getProfile();
      const txns = await getTransactions();
      reply = `Your estimated new-regime tax is ${formatINR(taxCompareFrom(profile, txns).new_regime.total)}. This is a simplified estimate.`;
    } else if (lower.includes("save") || lower.includes("saving")) {
      reply = `A practical starting point is to protect ${Math.max(5, Math.min(20, Math.round(d.savings_rate || 10)))}% of monthly income.`;
    } else if (lower.includes("spend") || lower.includes("budget")) {
      reply = `You have spent ${formatINR(d.total_spent)} this month. Daily safe spend: ${formatINR(d.daily_safe_spend)}.`;
    } else if (lower.includes("daily")) {
      reply = `Your daily safe spending is ${formatINR(d.daily_safe_spend)}. This is based on your remaining budget and days left in the month.`;
    }
    const history = JSON.parse((await AsyncStorage.getItem(`chat_${session_id}`)) || "[]");
    history.push({ role: "user", content: message, timestamp: nowIso() });
    history.push({ role: "assistant", content: reply, timestamp: nowIso() });
    await AsyncStorage.setItem(`chat_${session_id}`, JSON.stringify(history));
    return { reply, timestamp: nowIso() };
  },

  chatHistory: async (session_id = "default") => {
    const history = JSON.parse((await AsyncStorage.getItem(`chat_${session_id}`)) || "[]");
    return { messages: history };
  },

  taxSummary: async () => {
    const profile = await getProfile();
    const txns = await getTransactions();
    const compare = taxCompareFrom(profile, txns);
    const annualIncome = compare.gross;
    const projectedTax = compare.new_regime.total;
    const year = new Date().getFullYear().toString();
    const used = Math.min(150000, txns.filter((t: any) => t.type === "expense" && t.category === "investment" && t.date.startsWith(year)).reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0));
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
  },

  taxCompare: async () => {
    const profile = await getProfile();
    const txns = await getTransactions();
    return taxCompareFrom(profile, txns);
  },

  listGoals: async () => {
    const goals = await getGoals();
    return { goals };
  },

  createGoal: async (payload: any) => {
    const g: any = {
      id: id(),
      name: payload.name,
      target: Number(payload.target || 0),
      saved: Number(payload.saved || 0),
      kind: payload.kind || "personal",
      target_date: payload.target_date ? new Date(payload.target_date).getTime() : null,
      icon: payload.icon || "target",
      created_at: Date.now(),
    };
    await db.runAsync(
      `INSERT INTO savings_goals (id, name, target, saved, kind, target_date, icon, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      g.id,
      g.name,
      g.target,
      g.saved,
      g.kind,
      g.target_date,
      g.icon,
      g.created_at,
      Date.now()
    );
    return {
      id: g.id,
      name: g.name,
      target: g.target,
      saved: g.saved,
      kind: g.kind,
      target_date: g.target_date ? new Date(g.target_date).toISOString() : null,
      icon: g.icon,
      created_at: new Date(g.created_at).toISOString(),
    };
  },

  contributeGoal: async (goalId: string, amount: number) => {
    const goal = (await getGoals()).find((g: any) => g.id === goalId);
    if (!goal) throw new Error("Goal not found");
    const newSaved = Math.max(0, Number(goal.saved || 0) + Number(amount || 0));
    await db.runAsync(`UPDATE savings_goals SET saved = ?, updated_at = ? WHERE id = ?`, newSaved, Date.now(), goalId);
    return { ...goal, saved: newSaved };
  },

  deleteGoal: async (goalId: string) => {
    await db.runAsync(`UPDATE savings_goals SET deleted = 1, updated_at = ? WHERE id = ?`, Date.now(), goalId);
    return { deleted: true };
  },

  listBills: async () => {
    const bills = await getBills();
    const totalMonth = bills.filter((b: any) => b.active).reduce((sum: number, b: any) => sum + b.amount, 0);
    const unpaidMonth = bills.filter((b: any) => b.active && !b.paid_this_month).reduce((sum: number, b: any) => sum + b.amount, 0);
    return { bills, total_month: totalMonth, unpaid_month: unpaidMonth };
  },

  createBill: async (payload: any) => {
    const b: any = {
      id: id(),
      name: payload.name,
      amount: Number(payload.amount || 0),
      kind: payload.kind || "utility",
      day_of_month: Math.max(1, Math.min(28, Number(payload.day_of_month || 1))),
      paid_months: "[]",
      active: 1,
    };
    await db.runAsync(
      `INSERT INTO bills (id, name, amount, kind, day_of_month, paid_months, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      b.id,
      b.name,
      b.amount,
      b.kind,
      b.day_of_month,
      b.paid_months,
      b.active,
      Date.now(),
      Date.now()
    );
    return {
      id: b.id,
      name: b.name,
      amount: b.amount,
      kind: b.kind,
      day_of_month: b.day_of_month,
      paid_months: [],
      active: true,
    };
  },

  toggleBillPaid: async (billId: string) => {
    const bills = await getBills();
    const bill = bills.find((b: any) => b.id === billId);
    if (!bill) throw new Error("Bill not found");
    let paidMonths = bill.paid_months || [];
    const mkey = currentMonthKey();
    if (paidMonths.includes(mkey)) {
      paidMonths = paidMonths.filter((m: string) => m !== mkey);
    } else {
      paidMonths.push(mkey);
    }
    await db.runAsync(`UPDATE bills SET paid_months = ?, updated_at = ? WHERE id = ?`, JSON.stringify(paidMonths), Date.now(), billId);
    return { ...bill, paid_months: paidMonths };
  },

  deleteBill: async (billId: string) => {
    await db.runAsync(`UPDATE bills SET deleted = 1, updated_at = ? WHERE id = ?`, Date.now(), billId);
    return { deleted: true };
  },

  emergencyPlan: async (monthsTarget = 6, horizonMonths = 12) => {
    const profile = await getProfile();
    const budgets = await getBudgets();
    const essentialKeys = ["food", "groceries", "rent", "utilities", "transport", "health", "insurance"];
    const avg = essentialKeys.reduce((sum, key) => sum + Number(budgets[key] || 0), 0);
    const target = avg * monthsTarget;
    const saved = Number(profile?.emergency_fund || 0);
    const remaining = Math.max(0, target - saved);
    const monthly = remaining > 0 ? Math.round(remaining / Math.max(1, horizonMonths)) : 0;
    return {
      avg_monthly_spend: Math.round(avg),
      months_target: monthsTarget,
      target: Math.round(target),
      saved: Math.round(saved),
      remaining: Math.round(remaining),
      progress_pct: target > 0 ? Math.round(Math.min(100, saved / target * 1000)) / 10 : 100,
      monthly_contribution: monthly,
      contribution_horizon_months: horizonMonths,
      contribution_of_income_pct: profile?.monthly_income > 0 ? Math.round(monthly / profile.monthly_income * 1000) / 10 : 0,
    };
  },
};

// Re-export types
export type Category = { key: string; label: string; icon: string };
export type Profile = { id: string; name: string; monthly_income: number; income_type: string; cash_on_hand: number; bank_balance: number; emergency_fund: number; onboarded: boolean };
export type Transaction = { id: string; amount: number; description: string; category: string; type: "expense" | "income"; date: string; ai_categorized?: boolean; notes?: string };
export type DashboardData = { month: string; profile: Profile; net_worth: number; monthly_income: number; total_spent: number; total_budget: number; safe_to_spend: number; remaining_capacity: number; daily_safe_spend: number; fixed_bills: number; savings_target: number; emergency_reserve: number; savings_rate: number; by_category: Record<string, number>; budgets: Record<string, number>; health_score: number; emergency_fund_target: number; emergency_fund_progress: number; suggested_cash_on_hand: number; recent_transactions: Transaction[] };
export type TaxSummary = { annual_income: number; projected_tax: number; effective_rate: number; section_80c: { limit: number; used: number; remaining: number }; advance_tax: { next_due_date: string | null; next_due_pct_of_annual: number | null; next_due_amount: number } };
export type TaxCompare = { gross: number; old_regime: { tax: number; taxable: number; deductions: number; cess: number; total: number }; new_regime: { tax: number; taxable: number; deductions: number; cess: number; total: number }; recommended: "old" | "new"; delta: number };
export type Goal = { id: string; name: string; target: number; saved: number; kind: string; target_date?: string | null; icon?: string; created_at: string };
export type Bill = { id: string; name: string; amount: number; kind: string; day_of_month: number; paid_months: string[]; active: boolean; days_until_due?: number; paid_this_month?: boolean };
export type EmergencyPlan = { avg_monthly_spend: number; months_target: number; target: number; saved: number; remaining: number; progress_pct: number; monthly_contribution: number; contribution_horizon_months: number; contribution_of_income_pct: number };

export { formatINR };
// AI Service wrapper
import { askAI, getAIInsights } from "@/src/services/ai";

// Replace aiChat function in api.ts with this
// Add this to the api object
// aiChat: async (message: string, session_id = "default") => {
//   const result = await askAI(message);
//   // Store chat in AsyncStorage
//   const history = JSON.parse((await AsyncStorage.getItem(`chat_${session_id}`)) || "[]");
//   history.push({ role: "user", content: message, timestamp: nowIso() });
//   history.push({ role: "assistant", content: result.reply, timestamp: nowIso() });
//   await AsyncStorage.setItem(`chat_${session_id}`, JSON.stringify(history));
//   return { reply: result.reply, timestamp: result.timestamp };
// },
// aiInsights: async () => {
//   return await getAIInsights();
// },
