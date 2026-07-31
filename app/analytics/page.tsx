"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, DollarSign, Percent, BarChart2 } from "lucide-react";
import { DateRangePreset } from "@/lib/types";
import { fetchAnalyticsData, AnalyticsSummary } from "@/lib/analytics";
import { CashFlowBarChart } from "@/components/analytics/CashFlowBarChart";
import { CategoryDonutChart } from "@/components/analytics/CategoryDonutChart";
import { ExportCSVButton } from "@/components/analytics/ExportCSVButton";
import { useToast } from "@/components/ui/Toast";

export default function AnalyticsPage() {
  const { toast } = useToast();

  const [datePreset, setDatePreset] = useState<DateRangePreset>("this_month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      let from = "";
      let to = "";

      if (datePreset === "this_week") {
        const day = today.getDay() || 7;
        const start = new Date(today);
        start.setDate(today.getDate() - day + 1);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        from = start.toISOString().split("T")[0];
        to = end.toISOString().split("T")[0];
      } else if (datePreset === "this_month") {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        from = start.toISOString().split("T")[0];
        to = end.toISOString().split("T")[0];
      } else if (datePreset === "last_month") {
        const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const end = new Date(today.getFullYear(), today.getMonth(), 0);
        from = start.toISOString().split("T")[0];
        to = end.toISOString().split("T")[0];
      } else if (datePreset === "custom") {
        from = customStart;
        to = customEnd;
      }

      const data = await fetchAnalyticsData(from || undefined, to || undefined);
      setAnalytics(data);
    } catch (err: any) {
      console.error("Supabase Error:", err.message || err);
      toast("Failed to load analytics data", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (datePreset === "custom" && (!customStart || !customEnd)) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datePreset, customStart, customEnd]);

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-24 space-y-6">
      {/* Header */}
      <header className="animate-fade-in-up">
        <h1 className="text-2xl font-bold tracking-tight">Analytics & Trends</h1>
        <p className="text-sm text-muted-foreground mt-1">Visualize your cash flow & category spending</p>
      </header>

      {/* Date Presets Selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide animate-fade-in-up" style={{ animationDelay: '50ms' }}>
        {[
          { id: "this_week", label: "This Week" },
          { id: "this_month", label: "This Month" },
          { id: "last_month", label: "Last Month" },
          { id: "custom", label: "Custom" },
        ].map((preset) => (
          <button
            key={preset.id}
            onClick={() => setDatePreset(preset.id as DateRangePreset)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              datePreset === preset.id
                ? "bg-foreground text-background"
                : "bg-muted text-foreground hover:bg-border"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {datePreset === "custom" && (
        <div className="grid grid-cols-2 gap-4 animate-fade-in-up">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">From</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="w-full min-h-[40px] rounded-lg border border-border bg-card px-3 text-sm focus:ring-2 focus:ring-ring outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">To</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="w-full min-h-[40px] rounded-lg border border-border bg-card px-3 text-sm focus:ring-2 focus:ring-ring outline-none"
            />
          </div>
        </div>
      )}

      {/* Top KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-3 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        {/* Net Cash Flow */}
        <div className="col-span-2 bg-card border border-border rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Net Cash Flow</p>
              <p className={`text-2xl font-bold ${
                (analytics?.netCashFlow ?? 0) >= 0 ? "text-accent" : "text-destructive"
              }`}>
                €{isLoading ? "..." : (analytics?.netCashFlow ?? 0).toFixed(2)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-medium text-muted-foreground">Inflow - Outflow</span>
          </div>
        </div>

        {/* Total Inflow */}
        <div className="bg-accent/10 border border-accent/20 rounded-2xl p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-1.5 text-accent">
            <TrendingUp size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Total Inflow</span>
          </div>
          <span className="text-xl font-bold text-foreground">
            €{isLoading ? "..." : (analytics?.totalIncome ?? 0).toFixed(2)}
          </span>
        </div>

        {/* Total Outflow */}
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-1.5 text-destructive">
            <TrendingDown size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Total Outflow</span>
          </div>
          <span className="text-xl font-bold text-foreground">
            €{isLoading ? "..." : (analytics?.totalExpense ?? 0).toFixed(2)}
          </span>
        </div>

        {/* Savings Rate */}
        <div className="col-span-2 bg-card border border-border rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Percent size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Savings Rate</span>
          </div>
          <span className="text-lg font-bold text-accent">
            {isLoading ? "..." : `${(analytics?.savingsRate ?? 0).toFixed(1)}%`}
          </span>
        </div>
      </div>

      {/* Visualizations */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-64 bg-muted animate-pulse rounded-2xl border border-border" />
          <div className="h-64 bg-muted animate-pulse rounded-2xl border border-border" />
        </div>
      ) : (
        <>
          {/* Section 1: Dual Bar Chart */}
          <div className="animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <CashFlowBarChart data={analytics?.cashFlowTrends ?? []} />
          </div>

          {/* Section 2: Donut Chart */}
          <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <CategoryDonutChart data={analytics?.categoryBreakdown ?? []} />
          </div>

          {/* Section 3: Data Export Button */}
          <div className="animate-fade-in-up pt-2" style={{ animationDelay: '250ms' }}>
            <ExportCSVButton transactions={analytics?.rawTransactions ?? []} />
          </div>
        </>
      )}
    </div>
  );
}
