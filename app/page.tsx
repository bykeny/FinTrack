"use client";

import { useTheme } from "@/components/ThemeProvider";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  Sun,
  Moon,
} from "lucide-react";

/* ─── Mock data for demonstration ─── */
const SUMMARY_CARDS = [
  {
    label: "Total Balance",
    value: "$12,450.00",
    change: "+4.3%",
    trend: "up" as const,
    icon: Wallet,
  },
  {
    label: "Income (Jul)",
    value: "$5,280.00",
    change: "+12.1%",
    trend: "up" as const,
    icon: TrendingUp,
  },
  {
    label: "Expenses (Jul)",
    value: "$2,840.00",
    change: "-3.2%",
    trend: "down" as const,
    icon: TrendingDown,
  },
];

const RECENT_TRANSACTIONS = [
  { id: 1, name: "Freelance Payment", amount: "+$1,200.00", date: "Today", type: "income" },
  { id: 2, name: "Grocery Store", amount: "-$85.40", date: "Today", type: "expense" },
  { id: 3, name: "Electric Bill", amount: "-$142.00", date: "Yesterday", type: "expense" },
  { id: 4, name: "Side Project", amount: "+$450.00", date: "Jul 28", type: "income" },
];

export default function DashboardPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      {/* ─── Header ─── */}
      <header className="mb-6 flex items-center justify-between animate-fade-in-up">
        <div>
          <p className="text-sm text-muted-foreground">Good evening 👋</p>
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
        {SUMMARY_CARDS.map((card, i) => {
          const Icon = card.icon;
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
                  <p className="mt-1 text-2xl font-bold tracking-tight">
                    {card.value}
                  </p>
                </div>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    card.trend === "up"
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
                    card.trend === "up" ? "text-accent" : "text-destructive"
                  }`}
                >
                  <ArrowUpRight
                    size={12}
                    className={card.trend === "down" ? "rotate-90" : ""}
                  />
                  {card.change}
                </span>
                <span className="text-xs text-muted-foreground">
                  vs last month
                </span>
              </div>
            </div>
          );
        })}
      </section>

      {/* ─── Recent Transactions ─── */}
      <section aria-label="Recent transactions">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Recent Transactions</h2>
          <button className="text-xs font-medium text-accent hover:underline">
            See all
          </button>
        </div>
        <ul className="space-y-2">
          {RECENT_TRANSACTIONS.map((tx, i) => (
            <li
              key={tx.id}
              className="animate-fade-in-up flex items-center justify-between rounded-xl border border-border bg-card p-3.5 transition-all duration-200 hover:bg-muted"
              style={{ animationDelay: `${300 + i * 60}ms` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold ${
                    tx.type === "income"
                      ? "bg-accent/10 text-accent"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {tx.type === "income" ? "+" : "−"}
                </div>
                <div>
                  <p className="text-sm font-medium">{tx.name}</p>
                  <p className="text-xs text-muted-foreground">{tx.date}</p>
                </div>
              </div>
              <span
                className={`text-sm font-semibold ${
                  tx.type === "income" ? "text-accent" : "text-foreground"
                }`}
              >
                {tx.amount}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
