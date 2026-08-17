"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Wallet, Clock, ArrowUpRight, TrendingUp, Sparkles, Filter } from "lucide-react";
import { Transaction, Category, IncomeSummary, DateRangePreset } from "@/lib/types";
import {
  fetchIncomeTransactions,
  fetchIncomeCategories,
  fetchDefaultHourlyRate,
} from "@/lib/income";
import { AddIncomeModal } from "@/components/income/AddIncomeModal";
import { IncomeList } from "@/components/income/IncomeList";
import { useToast } from "@/components/ui/Toast";

export default function IncomePage() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<IncomeSummary>({
    totalIncome: 0,
    shiftIncome: 0,
    totalShiftHours: 0,
    fixedIncome: 0,
    averageHourlyRate: 0,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [defaultHourlyRate, setDefaultHourlyRate] = useState(0.0);
  const [isLoading, setIsLoading] = useState(true);

  // Date range filter state
  const [datePreset, setDatePreset] = useState<DateRangePreset>("this_month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<Transaction | undefined>(undefined);

  // Initial lookup of categories and user settings
  useEffect(() => {
    fetchIncomeCategories().then(setCategories).catch(console.error);
    fetchDefaultHourlyRate().then(setDefaultHourlyRate).catch(console.error);
  }, []);

  const loadIncomeData = useCallback(async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      let from = "";
      let to = "";

      if (datePreset === "this_week") {
        const day = today.getDay() || 7; // Monday = 1, Sunday = 7
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

      const res = await fetchIncomeTransactions(from, to);
      setTransactions(res.transactions);
      setSummary(res.summary);
    } catch (err: any) {
      console.error("Supabase Error:", err.message || err);
      toast("Failed to load income data", "error");
    } finally {
      setIsLoading(false);
    }
  }, [datePreset, customStart, customEnd, toast]);

  useEffect(() => {
    if (datePreset === "custom" && (!customStart || !customEnd)) return;
    loadIncomeData();
  }, [datePreset, customStart, customEnd, loadIncomeData]);

  const handleEdit = (tx: Transaction) => {
    setItemToEdit(tx);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setItemToEdit(undefined);
    setIsModalOpen(true);
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-28">
      {/* ─── Header ─── */}
      <header className="mb-6 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Income Hub</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Track fixed earnings & hourly shift work
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/10 text-accent border border-accent/20">
            <TrendingUp size={20} />
          </div>
        </div>
      </header>

      {/* ─── Date Range Selector ─── */}
      <div
        className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide animate-fade-in-up"
        style={{ animationDelay: "50ms" }}
      >
        {[
          { id: "this_week", label: "This Week" },
          { id: "this_month", label: "This Month" },
          { id: "last_month", label: "Last Month" },
          { id: "custom", label: "Custom Range" },
        ].map((preset) => (
          <button
            key={preset.id}
            onClick={() => setDatePreset(preset.id as DateRangePreset)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all ${
              datePreset === preset.id
                ? "bg-foreground text-background shadow-sm"
                : "bg-muted text-muted-foreground hover:text-foreground hover:bg-border"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {datePreset === "custom" && (
        <div className="grid grid-cols-2 gap-3 mb-6 p-3 bg-muted/50 rounded-2xl border border-border animate-fade-in-up">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">From</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="w-full min-h-[40px] rounded-xl border border-border bg-card px-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">To</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="w-full min-h-[40px] rounded-xl border border-border bg-card px-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
      )}

      {/* ─── Top KPI Cards ─── */}
      <section aria-label="Income KPI summary" className="grid grid-cols-2 gap-3 mb-8">
        {/* Total Income Banner Card */}
        <div
          className="col-span-2 rounded-3xl bg-gradient-to-br from-accent/20 via-card to-card border border-accent/30 p-5 shadow-sm relative overflow-hidden animate-fade-in-up"
          style={{ animationDelay: "100ms" }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-accent">
              <Sparkles size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Total Income</span>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-accent/20 text-accent">
              {transactions.length} {transactions.length === 1 ? "entry" : "entries"}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
              €{summary.totalIncome.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Aggregated from both fixed and hourly revenue streams
          </p>
        </div>

        {/* Hourly Work Card */}
        <div
          className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between animate-fade-in-up"
          style={{ animationDelay: "150ms" }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={15} /> Hourly Work
            </span>
          </div>
          <div>
            <span className="text-2xl font-bold text-foreground">
              €{summary.shiftIncome.toFixed(2)}
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">
              {summary.totalShiftHours.toFixed(1)}h worked
              {summary.totalShiftHours > 0 && ` (@ €${summary.averageHourlyRate.toFixed(1)}/h)`}
            </p>
          </div>
        </div>

        {/* Other Income Card */}
        <div
          className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between animate-fade-in-up"
          style={{ animationDelay: "200ms" }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet size={15} /> Other Income
            </span>
          </div>
          <div>
            <span className="text-2xl font-bold text-foreground">
              €{summary.fixedIncome.toFixed(2)}
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">Direct & fixed sources</p>
          </div>
        </div>
      </section>

      {/* ─── Income Feed ─── */}
      <section aria-label="Income History" className="animate-fade-in-up" style={{ animationDelay: "250ms" }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Income Feed</h2>
          <span className="text-xs text-muted-foreground font-medium">
            {transactions.length} record{transactions.length !== 1 ? "s" : ""}
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-muted animate-pulse rounded-2xl border border-border"
              />
            ))}
          </div>
        ) : (
          <IncomeList
            transactions={transactions}
            onEdit={handleEdit}
            onRefresh={loadIncomeData}
          />
        )}
      </section>

      {/* ─── Floating Action Button (+) ─── */}
      <button
        onClick={handleAdd}
        className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-accent/25 hover:shadow-2xl"
        aria-label="Log Income"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {/* ─── Modal ─── */}
      <AddIncomeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={loadIncomeData}
        itemToEdit={itemToEdit}
        categories={categories}
        defaultHourlyRate={defaultHourlyRate}
      />
    </div>
  );
}
