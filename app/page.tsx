"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  Sun,
  Moon,
  ReceiptText,
  Clock,
  Plus,
} from "lucide-react";
import { fetchDashboardSummary, DashboardSummary } from "@/lib/dashboard";
import { IconRenderer } from "@/components/ui/IconRenderer";
import { useToast } from "@/components/ui/Toast";

function getTimeGreeting(): string {
  const hours = new Date().getHours();
  if (hours < 12) return "Good morning 👋";
  if (hours < 18) return "Good afternoon 👋";
  return "Good evening 👋";
}

const formatRelativeDate = (dateStr: string) => {
  if (!dateStr) return "";
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";

  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return dateStr;

  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function DashboardPage() {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const [data, setData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [greeting, setGreeting] = useState("Welcome 👋");

  useEffect(() => {
    setGreeting(getTimeGreeting());

    async function loadDashboard() {
      setIsLoading(true);
      try {
        const summary = await fetchDashboardSummary();
        setData(summary);
      } catch (err: any) {
        console.error("Supabase Error:", err.message || err);
        toast("Failed to load dashboard data", "error");
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cards = [
    {
      label: "Total Balance",
      value: `€${(data?.totalBalance ?? 0).toFixed(2)}`,
      change: `${(data?.incomeChangePercent ?? 0) >= 0 ? "+" : ""}${(data?.incomeChangePercent ?? 0).toFixed(1)}%`,
      trend: (data?.incomeChangePercent ?? 0) >= 0 ? ("up" as const) : ("down" as const),
      icon: Wallet,
    },
    {
      label: `Income (${data?.monthName ?? "Month"})`,
      value: `€${(data?.monthlyIncome ?? 0).toFixed(2)}`,
      change: `${(data?.incomeChangePercent ?? 0) >= 0 ? "+" : ""}${(data?.incomeChangePercent ?? 0).toFixed(1)}%`,
      trend: (data?.incomeChangePercent ?? 0) >= 0 ? ("up" as const) : ("down" as const),
      icon: TrendingUp,
    },
    {
      label: `Expenses (${data?.monthName ?? "Month"})`,
      value: `€${(data?.monthlyExpenses ?? 0).toFixed(2)}`,
      change: `${(data?.expenseChangePercent ?? 0) >= 0 ? "+" : ""}${(data?.expenseChangePercent ?? 0).toFixed(1)}%`,
      trend: (data?.expenseChangePercent ?? 0) <= 0 ? ("up" as const) : ("down" as const), // Lower expenses is positive
      icon: TrendingDown,
    },
  ];

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-24">
      {/* ─── Header ─── */}
      <header className="mb-6 flex items-center justify-between animate-fade-in-up">
        <div>
          <p className="text-sm text-muted-foreground">{greeting}</p>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <button
          id="theme-toggle"
          onClick={toggleTheme}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground transition-all duration-200 hover:bg-border active:scale-95"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      {/* ─── Summary Cards ─── */}
      <section aria-label="Financial summary" className="mb-8 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-muted animate-pulse rounded-2xl border border-border" />
            ))}
          </div>
        ) : (
          cards.map((card, i) => {
            const Icon = card.icon;
            const isPositive = card.trend === "up";
            return (
              <div
                key={card.label}
                className="animate-fade-in-up rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:shadow-md"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {card.label}
                    </p>
                    <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                      {card.value}
                    </p>
                  </div>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      isPositive
                        ? "bg-accent/10 text-accent"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    <Icon size={20} />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5">
                  <span
                    className={`flex items-center gap-0.5 text-xs font-semibold ${
                      isPositive ? "text-accent" : "text-destructive"
                    }`}
                  >
                    <ArrowUpRight
                      size={12}
                      className={!isPositive ? "rotate-90" : ""}
                    />
                    {card.change}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    vs last month
                  </span>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* ─── Recent Transactions ─── */}
      <section aria-label="Recent transactions">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Recent Transactions</h2>
          <Link href="/expenses" className="text-xs font-medium text-accent hover:underline">
            See all
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-xl border border-border" />
            ))}
          </div>
        ) : !data?.recentTransactions || data.recentTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-card rounded-2xl border border-border">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <ReceiptText className="text-muted-foreground" size={24} />
            </div>
            <h3 className="text-sm font-semibold text-foreground">No Transactions Yet</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Log a shift or record an expense to start building your financial dashboard.
            </p>
            <div className="flex gap-2 mt-4">
              <Link
                href="/shifts"
                className="px-3.5 py-2 rounded-xl bg-accent text-accent-foreground font-semibold text-xs flex items-center gap-1 shadow-sm hover:bg-accent/90"
              >
                <Clock size={14} /> Log Shift
              </Link>
              <Link
                href="/expenses"
                className="px-3.5 py-2 rounded-xl bg-muted text-foreground font-semibold text-xs flex items-center gap-1 hover:bg-border"
              >
                <Plus size={14} /> Log Expense
              </Link>
            </div>
          </div>
        ) : (
          <ul className="space-y-2">
            {data.recentTransactions.map((tx, i) => {
              const isIncome = tx.type === "income";
              const cat = tx.category_ref;
              return (
                <li
                  key={tx.id}
                  className="animate-fade-in-up flex items-center justify-between rounded-xl border border-border bg-card p-3.5 transition-all duration-200 hover:bg-muted"
                  style={{ animationDelay: `${300 + i * 60}ms` }}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {cat ? (
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                      >
                        <IconRenderer name={cat.icon} size={20} />
                      </div>
                    ) : (
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold ${
                          isIncome
                            ? "bg-accent/10 text-accent"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {isIncome ? "+" : "−"}
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium text-foreground truncate">
                        {cat ? cat.name : (tx.description || (isIncome ? "Income" : "Expense"))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeDate(tx.transaction_date)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-semibold shrink-0 ${
                      isIncome ? "text-accent" : "text-foreground"
                    }`}
                  >
                    {isIncome ? "+" : "-"}€{tx.amount.toFixed(2)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
