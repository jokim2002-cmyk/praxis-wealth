import { db } from "@/src/database/schema";
import { getTransactions, getProfile, getBudgets } from "@/src/utils/api";

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthKey(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return currentMonthKey();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function generateSnapshot(period?: string) {
  const p = period || currentMonthKey();
  const profile = await getProfile();
  const txns = await getTransactions(p);
  const budgets = await getBudgets();

  const totalIncome = txns.filter((t: any) => t.type === "income").reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
  const totalExpense = txns.filter((t: any) => t.type === "expense").reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
  const netSavings = totalIncome - totalExpense;

  const byCategory: Record<string, number> = {};
  txns.filter((t: any) => t.type === "expense").forEach((t: any) => {
    byCategory[t.category] = (byCategory[t.category] || 0) + Number(t.amount || 0);
  });

  const openingBalance = Number(profile?.cash_on_hand || 0) + Number(profile?.bank_balance || 0) - totalIncome + totalExpense;
  const closingBalance = openingBalance + netSavings;

  const id = `snapshot-${p}-${Date.now()}`;

  await db.runAsync(
    `INSERT OR REPLACE INTO monthly_snapshots (id, period, total_income, total_expense, net_savings, by_category, opening_balance, closing_balance, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    p,
    totalIncome,
    totalExpense,
    netSavings,
    JSON.stringify(byCategory),
    openingBalance,
    closingBalance,
    Date.now(),
    Date.now()
  );

  return {
    period: p,
    total_income: totalIncome,
    total_expense: totalExpense,
    net_savings: netSavings,
    by_category: byCategory,
    opening_balance: openingBalance,
    closing_balance: closingBalance,
  };
}

export async function getSnapshot(period: string) {
  const result = await db.getFirstAsync<any>(
    "SELECT * FROM monthly_snapshots WHERE period = ? AND deleted = 0",
    period
  );
  if (!result) return null;
  return {
    period: result.period,
    total_income: result.total_income,
    total_expense: result.total_expense,
    net_savings: result.net_savings,
    by_category: JSON.parse(result.by_category || "{}"),
    opening_balance: result.opening_balance,
    closing_balance: result.closing_balance,
  };
}
