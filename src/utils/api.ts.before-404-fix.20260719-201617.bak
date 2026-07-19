const DEFAULT_BACKEND_URL = "https://ai-wealth-manager-4.preview.emergentagent.com";
const BASE = (process.env.EXPO_PUBLIC_BACKEND_URL || DEFAULT_BACKEND_URL).replace(/\/$/, "");

export const API = `${BASE}/api`;

// --- Currency: Indian numbering system ---
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
  // Indian formatting: ₹1,50,000
  const parts = Math.round(abs).toString().split("");
  const rev = parts.reverse();
  const out: string[] = [];
  for (let i = 0; i < rev.length; i++) {
    if (i === 3 || (i > 3 && (i - 3) % 2 === 0)) out.push(",");
    out.push(rev[i]);
  }
  return `${sign}₹${out.reverse().join("")}`;
}

async function j<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`${res.status}: ${txt}`);
  }
  return res.json();
}

export const api = {
  categories: () => fetch(`${API}/categories`).then((r) => j<{ categories: Category[] }>(r)),
  getProfile: () => fetch(`${API}/profile`).then((r) => j<Profile>(r)),
  updateProfile: (p: Partial<Profile>) =>
    fetch(`${API}/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    }).then((r) => j<Profile>(r)),
  getBudgets: () => fetch(`${API}/budgets`).then((r) => j<{ budgets: Record<string, number> }>(r)),
  updateBudgets: (budgets: Record<string, number>) =>
    fetch(`${API}/budgets`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ budgets }),
    }).then((r) => j<{ budgets: Record<string, number> }>(r)),
  listTransactions: (month?: string) =>
    fetch(`${API}/transactions${month ? `?month=${month}` : ""}`).then((r) =>
      j<{ transactions: Transaction[] }>(r)
    ),
  createTransaction: (payload: {
    amount: number;
    description: string;
    category?: string;
    type?: "expense" | "income";
    notes?: string;
    auto_categorize?: boolean;
  }) =>
    fetch(`${API}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((r) => j<Transaction>(r)),
  deleteTransaction: (id: string) =>
    fetch(`${API}/transactions/${id}`, { method: "DELETE" }).then((r) => j<{ deleted: boolean }>(r)),
  dashboard: () => fetch(`${API}/dashboard`).then((r) => j<DashboardData>(r)),
  aiInsights: () =>
    fetch(`${API}/ai/insights`, { method: "POST" }).then((r) =>
      j<{ headline?: string; insight: string; tips: string[]; snapshot?: any }>(r)
    ),
  aiChat: (message: string, session_id = "default") =>
    fetch(`${API}/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, session_id }),
    }).then((r) => j<{ reply: string; timestamp: string }>(r)),
  chatHistory: (session_id = "default") =>
    fetch(`${API}/ai/chat/history?session_id=${session_id}`).then((r) =>
      j<{ messages: { role: string; content: string; timestamp: string }[] }>(r)
    ),
  taxSummary: () => fetch(`${API}/tax/summary`).then((r) => j<TaxSummary>(r)),
  taxCompare: () => fetch(`${API}/tax/compare`).then((r) => j<TaxCompare>(r)),

  listGoals: () => fetch(`${API}/goals`).then((r) => j<{ goals: Goal[] }>(r)),
  createGoal: (payload: {
    name: string;
    target: number;
    saved?: number;
    kind?: string;
    target_date?: string | null;
    icon?: string;
  }) =>
    fetch(`${API}/goals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((r) => j<Goal>(r)),
  contributeGoal: (id: string, amount: number) =>
    fetch(`${API}/goals/${id}/contribute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    }).then((r) => j<Goal>(r)),
  deleteGoal: (id: string) =>
    fetch(`${API}/goals/${id}`, { method: "DELETE" }).then((r) => j<{ deleted: boolean }>(r)),

  listBills: () =>
    fetch(`${API}/bills`).then((r) =>
      j<{ bills: Bill[]; total_month: number; unpaid_month: number }>(r)
    ),
  createBill: (payload: { name: string; amount: number; kind?: string; day_of_month?: number }) =>
    fetch(`${API}/bills`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((r) => j<Bill>(r)),
  toggleBillPaid: (id: string) =>
    fetch(`${API}/bills/${id}/toggle-paid`, { method: "POST" }).then((r) => j<Bill>(r)),
  deleteBill: (id: string) =>
    fetch(`${API}/bills/${id}`, { method: "DELETE" }).then((r) => j<{ deleted: boolean }>(r)),

  emergencyPlan: (monthsTarget = 6, horizonMonths = 12) =>
    fetch(
      `${API}/emergency-fund/plan?months_target=${monthsTarget}&contribution_horizon_months=${horizonMonths}`
    ).then((r) => j<EmergencyPlan>(r)),
};

// --- Types ---
export type Category = { key: string; label: string; icon: string };
export type Profile = {
  id: string;
  name: string;
  monthly_income: number;
  income_type: string;
  cash_on_hand: number;
  bank_balance: number;
  emergency_fund: number;
  onboarded: boolean;
};
export type Transaction = {
  id: string;
  amount: number;
  description: string;
  category: string;
  type: "expense" | "income";
  date: string;
  ai_categorized?: boolean;
  notes?: string;
};
export type DashboardData = {
  month: string;
  profile: Profile;
  net_worth: number;
  monthly_income: number;
  total_spent: number;
  total_budget: number;
  safe_to_spend: number;
  savings_rate: number;
  by_category: Record<string, number>;
  budgets: Record<string, number>;
  health_score: number;
  emergency_fund_target: number;
  emergency_fund_progress: number;
  suggested_cash_on_hand: number;
  recent_transactions: Transaction[];
};
export type TaxSummary = {
  annual_income: number;
  projected_tax: number;
  effective_rate: number;
  section_80c: { limit: number; used: number; remaining: number };
  advance_tax: {
    next_due_date: string | null;
    next_due_pct_of_annual: number | null;
    next_due_amount: number;
  };
};

export type TaxCompare = {
  gross: number;
  old_regime: { tax: number; taxable: number; deductions: number; cess: number; total: number };
  new_regime: { tax: number; taxable: number; deductions: number; cess: number; total: number };
  recommended: "old" | "new";
  delta: number;
};

export type Goal = {
  id: string;
  name: string;
  target: number;
  saved: number;
  kind: string;
  target_date?: string | null;
  icon?: string;
  created_at: string;
};

export type Bill = {
  id: string;
  name: string;
  amount: number;
  kind: string;
  day_of_month: number;
  paid_months: string[];
  active: boolean;
  days_until_due?: number;
  paid_this_month?: boolean;
};

export type EmergencyPlan = {
  avg_monthly_spend: number;
  months_target: number;
  target: number;
  saved: number;
  remaining: number;
  progress_pct: number;
  monthly_contribution: number;
  contribution_horizon_months: number;
  contribution_of_income_pct: number;
};
