import { createSupabaseBrowserClient } from "./supabase";
import { Transaction } from "./types";

export interface DashboardSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  incomeChangePercent: number;
  expenseChangePercent: number;
  recentTransactions: Transaction[];
  monthName: string;
}

async function ensureAuth(supabase: any) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.warn("⚠️ No Supabase session found. RLS policies may fail.");
  }
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const supabase = createSupabaseBrowserClient();
  await ensureAuth(supabase);

  const now = new Date();
  const currentMonthName = now.toLocaleString("en-US", { month: "short" });

  // 1. Fetch all transactions for Total Balance computation
  const { data: allTx, error: allError } = await supabase
    .from("transactions")
    .select("amount, type, transaction_date");

  if (allError) throw allError;

  let totalHistoricalIncome = 0;
  let totalHistoricalExpenses = 0;

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Previous month dates
  const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const prevYear = prevMonthDate.getFullYear();
  const prevMonth = prevMonthDate.getMonth();

  let monthlyIncome = 0;
  let monthlyExpenses = 0;
  let lastMonthIncome = 0;
  let lastMonthExpenses = 0;

  (allTx || []).forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    if (tx.type === "income") {
      totalHistoricalIncome += amt;
    } else if (tx.type === "expense") {
      totalHistoricalExpenses += amt;
    }

    if (tx.transaction_date) {
      const txDate = new Date(tx.transaction_date);
      const txYear = txDate.getFullYear();
      const txMonth = txDate.getMonth();

      if (txYear === currentYear && txMonth === currentMonth) {
        if (tx.type === "income") monthlyIncome += amt;
        if (tx.type === "expense") monthlyExpenses += amt;
      } else if (txYear === prevYear && txMonth === prevMonth) {
        if (tx.type === "income") lastMonthIncome += amt;
        if (tx.type === "expense") lastMonthExpenses += amt;
      }
    }
  });

  const totalBalance = totalHistoricalIncome - totalHistoricalExpenses;

  // Calculate MoM percentage changes
  const incomeChangePercent = lastMonthIncome > 0
    ? ((monthlyIncome - lastMonthIncome) / lastMonthIncome) * 100
    : monthlyIncome > 0 ? 100 : 0;

  const expenseChangePercent = lastMonthExpenses > 0
    ? ((monthlyExpenses - lastMonthExpenses) / lastMonthExpenses) * 100
    : monthlyExpenses > 0 ? 100 : 0;

  // 2. Fetch 5 most recent transactions joined with categories
  const { data: recentTxData, error: recentError } = await supabase
    .from("transactions")
    .select("*, categories(*)")
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(5);

  if (recentError) throw recentError;

  const recentTransactions: Transaction[] = (recentTxData || []).map((row: any) => ({
    ...row,
    category_ref: row.categories ? row.categories : undefined,
  }));

  return {
    totalBalance: parseFloat(totalBalance.toFixed(2)),
    monthlyIncome: parseFloat(monthlyIncome.toFixed(2)),
    monthlyExpenses: parseFloat(monthlyExpenses.toFixed(2)),
    incomeChangePercent: parseFloat(incomeChangePercent.toFixed(1)),
    expenseChangePercent: parseFloat(expenseChangePercent.toFixed(1)),
    recentTransactions,
    monthName: currentMonthName,
  };
}
