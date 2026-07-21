import { db } from "@/src/database/schema";
import { getProfile, getTransactions, getBudgets, getBills, getDashboard } from "@/src/utils/api";

// ---------- AI Context Builder ----------
async function buildAIContext() {
  const profile = await getProfile();
  const dashboard = await getDashboard();
  const budgets = await getBudgets();
  const bills = await getBills();
  const txns = await getTransactions();

  const income = profile?.monthly_income || 0;
  const totalSpent = dashboard.total_spent || 0;
  const safeToSpend = dashboard.safe_to_spend || 0;
  const dailySafe = dashboard.daily_safe_spend || 0;
  const fixedBills = dashboard.fixed_bills || 0;
  const savingsTarget = dashboard.savings_target || 0;

  // Category breakdown
  const categoryStr = Object.entries(dashboard.by_category || {})
    .map(([cat, amt]) => `${cat}: ₹${Math.round(amt)}`)
    .join(', ');

  // Upcoming bills
  const upcomingBills = bills.filter((b: any) => b.active && !b.paid_this_month);
  const billStr = upcomingBills.map((b: any) => `${b.name}: ₹${b.amount} due in ${b.days_until_due} days`).join(', ');

  return {
    profile: {
      name: profile?.name || 'You',
      income: income,
      income_type: profile?.income_type || 'fixed',
      cash: profile?.cash_on_hand || 0,
      bank: profile?.bank_balance || 0,
      emergency: profile?.emergency_fund || 0,
    },
    current_month: {
      spent: totalSpent,
      income: income,
      safe_to_spend: safeToSpend,
      daily_safe_spend: dailySafe,
      fixed_bills: fixedBills,
      savings_target: savingsTarget,
      categories: dashboard.by_category || {},
    },
    upcoming_bills: billStr || 'No upcoming bills',
    budgets: budgets,
    recent_transactions: txns.slice(0, 5).map((t: any) => 
      `${t.type === 'income' ? '+' : '-'} ₹${t.amount} ${t.description} (${t.category})`
    ).join('\n'),
  };
}

// ---------- AI Query Handler ----------
export async function askAI(query: string) {
  const context = await buildAIContext();
  const lower = query.toLowerCase();

  // Rule-based responses (simulating AI)
  let response = '';

  // Safe spend queries
  if (lower.includes('safe') || lower.includes('spend') || lower.includes('kharch')) {
    response = `Based on your income of ₹${context.profile.income}, fixed bills of ₹${context.current_month.fixed_bills}, and savings target of ₹${context.current_month.savings_target}, your safe-to-spend amount for this month is ₹${context.current_month.safe_to_spend}. This means you can spend about ₹${context.current_month.daily_safe_spend} per day.`;
  }
  // Daily spend queries
  else if (lower.includes('daily') || lower.includes('roz')) {
    response = `Your daily safe spending limit is ₹${context.current_month.daily_safe_spend}. This is calculated based on your remaining budget and days left in the month.`;
  }
  // Tax queries
  else if (lower.includes('tax')) {
    const gross = context.profile.income * 12;
    const estimatedTax = Math.round(gross * 0.1); // Simplified
    response = `Based on your annual income of ₹${gross}, your estimated tax under the new regime is approximately ₹${estimatedTax}. This is a simplified estimate.`;
  }
  // Savings queries
  else if (lower.includes('save') || lower.includes('saving') || lower.includes('bachat')) {
    response = `Your current savings rate is ${Math.round((context.profile.income - context.current_month.spent) / context.profile.income * 100)}%. Your monthly savings target is ₹${context.current_month.savings_target}. Consider moving this amount to savings when you receive your income.`;
  }
  // Bill queries
  else if (lower.includes('bill') || lower.includes('emi')) {
    response = `Upcoming bills: ${context.upcoming_bills}`;
  }
  // Category queries
  else if (lower.includes('category') || lower.includes('kharid')) {
    const cats = Object.entries(context.current_month.categories)
      .map(([cat, amt]) => `${cat}: ₹${Math.round(amt)}`)
      .join(', ');
    response = `Your spending by category this month: ${cats}`;
  }
  // General query
  else {
    response = `I can see your ledger. You've spent ₹${context.current_month.spent} this month out of ₹${context.current_month.income} income. Your safe-to-spend is ₹${context.current_month.safe_to_spend}. What would you like to know more about? (Try: spending, savings, tax, bills, or categories)`;
  }

  return {
    reply: response,
    context: context,
    timestamp: new Date().toISOString(),
  };
}

// ---------- AI Insights (Dashboard) ----------
export async function getAIInsights() {
  const context = await buildAIContext();
  const tips = [];

  if (context.current_month.spent > context.current_month.safe_to_spend) {
    tips.push('You are spending above your safe limit. Try to reduce discretionary spending.');
  }
  if (context.profile.emergency < context.current_month.spent * 3) {
    tips.push(`Your emergency fund (₹${context.profile.emergency}) is less than 3 months of expenses (₹${context.current_month.spent * 3}). Consider building this first.`);
  }
  if (context.profile.income > 0 && context.current_month.savings_target > 0) {
    tips.push(`Your monthly savings target is ₹${context.current_month.savings_target}. Try to automate this transfer.`);
  }

  return {
    headline: 'Your Financial Health Check',
    insight: `You have spent ₹${context.current_month.spent} this month. Your safe-to-spend is ₹${context.current_month.safe_to_spend}.`,
    tips: tips.length > 0 ? tips : ['Keep tracking your expenses to stay on top of your finances.'],
    snapshot: context,
  };
}
