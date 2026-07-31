import { createSupabaseBrowserClient } from "./supabase";
import { Transaction } from "./types";

export interface CategoryBreakdown {
  category: string;
  total: number;
  color: string;
}

export interface CashFlowTrend {
  date: string;
  income: number;
  expense: number;
}

export interface AnalyticsSummary {
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number;
  savingsRate: number;
  categoryBreakdown: CategoryBreakdown[];
  cashFlowTrends: CashFlowTrend[];
  rawTransactions: Transaction[];
}

async function ensureAuth(supabase: any) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.warn("⚠️ No Supabase session found. RLS policies may fail.");
  }
}

export async function fetchAnalyticsData(
  from?: string,
  to?: string
): Promise<AnalyticsSummary> {
  const supabase = createSupabaseBrowserClient();
  await ensureAuth(supabase);

  let query = supabase
    .from("transactions")
    .select("*, categories(*)")
    .order("transaction_date", { ascending: true });

  if (from) query = query.gte("transaction_date", from);
  if (to) query = query.lte("transaction_date", to);

  const { data, error } = await query;
  if (error) throw error;

  const rawTransactions: Transaction[] = (data || []).map((row: any) => ({
    ...row,
    category_ref: row.categories ? row.categories : undefined,
  }));

  let totalIncome = 0;
  let totalExpense = 0;

  const categoryMap: Record<string, { name: string; total: number; color: string }> = {};
  const trendsMap: Record<string, { income: number; expense: number }> = {};

  rawTransactions.forEach((tx) => {
    const amt = tx.amount || 0;
    const dateStr = tx.transaction_date || "Unknown";

    if (!trendsMap[dateStr]) {
      trendsMap[dateStr] = { income: 0, expense: 0 };
    }

    if (tx.type === "income") {
      totalIncome += amt;
      trendsMap[dateStr].income += amt;
    } else if (tx.type === "expense") {
      totalExpense += amt;
      trendsMap[dateStr].expense += amt;

      const catRef = tx.category_ref;
      const catKey = catRef?.id || tx.category || "Uncategorized";
      const catName = catRef?.name || tx.category || "Uncategorized";
      const catColor = catRef?.color || "#94a3b8";

      if (!categoryMap[catKey]) {
        categoryMap[catKey] = { name: catName, total: 0, color: catColor };
      }
      categoryMap[catKey].total += amt;
    }
  });

  const netCashFlow = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, ((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  const categoryBreakdown: CategoryBreakdown[] = Object.values(categoryMap)
    .map((item) => ({
      category: item.name,
      total: parseFloat(item.total.toFixed(2)),
      color: item.color,
    }))
    .sort((a, b) => b.total - a.total);

  const cashFlowTrends: CashFlowTrend[] = Object.keys(trendsMap)
    .sort((a, b) => a.localeCompare(b))
    .map((dateStr) => {
      const formattedDate = new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      return {
        date: isNaN(new Date(dateStr).getTime()) ? dateStr : formattedDate,
        income: parseFloat(trendsMap[dateStr].income.toFixed(2)),
        expense: parseFloat(trendsMap[dateStr].expense.toFixed(2)),
      };
    });

  return {
    totalIncome: parseFloat(totalIncome.toFixed(2)),
    totalExpense: parseFloat(totalExpense.toFixed(2)),
    netCashFlow: parseFloat(netCashFlow.toFixed(2)),
    savingsRate: parseFloat(savingsRate.toFixed(1)),
    categoryBreakdown,
    cashFlowTrends,
    rawTransactions,
  };
}
