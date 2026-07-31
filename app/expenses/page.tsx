"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Wallet, Search, Filter } from "lucide-react";
import { Transaction, Category, DateRangePreset } from "@/lib/types";
import { fetchExpenses, fetchCategories } from "@/lib/expenses";
import { AddExpenseModal } from "@/components/expenses/AddExpenseModal";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { useToast } from "@/components/ui/Toast";
import { IconRenderer } from "@/components/ui/IconRenderer";

export default function ExpensesPage() {
  const { toast } = useToast();
  
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [datePreset, setDatePreset] = useState<DateRangePreset>("this_month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Transaction | undefined>(undefined);

  // Initial load
  useEffect(() => {
    fetchCategories("expense").then(data => {
      setCategories(data);
    }).catch(err => {
      console.error("Supabase Error:", err.message || err);
    });
  }, []);

  const loadExpenses = async () => {
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

      const data = await fetchExpenses(
        from || undefined, 
        to || undefined, 
        selectedCategoryId || undefined, 
        searchQuery || undefined
      );
      setExpenses(data);
    } catch (err: any) {
      console.error("Supabase Error:", err.message || err);
      toast("Failed to load expenses", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (datePreset === "custom" && (!customStart || !customEnd)) return;
    
    // Add a slight debounce to search to avoid spamming requests
    const timeoutId = setTimeout(() => {
      loadExpenses();
    }, 300);
    
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datePreset, customStart, customEnd, selectedCategoryId, searchQuery]);

  // Derived Metrics
  const { totalSpent, topCategory } = useMemo(() => {
    let spent = 0;
    const catTotals: Record<string, { amount: number, ref?: Category }> = {};
    
    expenses.forEach(e => {
      spent += e.amount;
      const catId = e.category_id || "uncategorized";
      if (!catTotals[catId]) {
        catTotals[catId] = { amount: 0, ref: e.category_ref };
      }
      catTotals[catId].amount += e.amount;
    });

    let topCat = null;
    let maxSpent = 0;
    
    for (const id in catTotals) {
      if (catTotals[id].amount > maxSpent) {
        maxSpent = catTotals[id].amount;
        topCat = catTotals[id].ref;
      }
    }

    return { totalSpent: spent, topCategory: topCat };
  }, [expenses]);

  const handleEdit = (expense: Transaction) => {
    setExpenseToEdit(expense);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setExpenseToEdit(undefined);
    setIsModalOpen(true);
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-24">
      <header className="mb-6 animate-fade-in-up">
        <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
        <p className="text-sm text-muted-foreground mt-1">Track where your money goes</p>
      </header>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex flex-col animate-fade-in-up" style={{ animationDelay: '50ms' }}>
          <div className="flex items-center gap-2 mb-2 text-destructive">
            <Wallet size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Total Spent</span>
          </div>
          <span className="text-2xl font-bold text-foreground">€{totalSpent.toFixed(2)}</span>
        </div>
        
        <div className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
            <Filter size={16} />
            <span className="text-xs font-bold uppercase tracking-wider truncate">Top Category</span>
          </div>
          {topCategory ? (
            <div className="flex items-center gap-2 truncate">
               <div 
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${topCategory.color}20`, color: topCategory.color }}
                >
                  <IconRenderer name={topCategory.icon} size={14} />
                </div>
              <span className="text-sm font-bold truncate">{topCategory.name}</span>
            </div>
          ) : (
            <span className="text-sm font-medium text-muted-foreground">N/A</span>
          )}
        </div>
      </div>

      {/* Date Presets */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide animate-fade-in-up" style={{ animationDelay: '150ms' }}>
        {[
          { id: "this_week", label: "This Week" },
          { id: "this_month", label: "This Month" },
          { id: "last_month", label: "Last Month" },
          { id: "custom", label: "Custom" }
        ].map(preset => (
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
        <div className="grid grid-cols-2 gap-4 mb-4 animate-fade-in-up">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">From</label>
            <input 
              type="date" 
              value={customStart} 
              onChange={e => setCustomStart(e.target.value)}
              className="w-full min-h-[40px] rounded-lg border border-border bg-card px-3 text-sm focus:ring-2 focus:ring-ring outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">To</label>
            <input 
              type="date" 
              value={customEnd} 
              onChange={e => setCustomEnd(e.target.value)}
              className="w-full min-h-[40px] rounded-lg border border-border bg-card px-3 text-sm focus:ring-2 focus:ring-ring outline-none"
            />
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative mb-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input 
          type="text" 
          placeholder="Search expenses..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full min-h-[48px] rounded-xl border border-border bg-card pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring transition-shadow"
        />
      </div>

      {/* Category Filter Chips */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide animate-fade-in-up" style={{ animationDelay: '250ms' }}>
          <button
            onClick={() => setSelectedCategoryId("")}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
              selectedCategoryId === "" 
                ? "bg-foreground text-background border-foreground" 
                : "bg-card text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            All Categories
          </button>
          {categories.map(cat => {
            const isSelected = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                  isSelected 
                    ? "border-accent bg-accent/10 text-accent" 
                    : "bg-card text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                <IconRenderer name={cat.icon} size={12} />
                {cat.name}
              </button>
            )
          })}
        </div>
      )}

      {/* Expense List */}
      <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold">Transaction History</h2>
        </div>
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-xl border border-border" />
            ))}
          </div>
        ) : (
          <ExpenseList expenses={expenses} onEdit={handleEdit} onRefresh={loadExpenses} />
        )}
      </div>

      {/* FAB */}
      <button
        onClick={handleAdd}
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label="Add Expense"
      >
        <Plus size={24} />
      </button>

      <AddExpenseModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={loadExpenses}
        expenseToEdit={expenseToEdit}
        categories={categories}
      />
    </div>
  );
}
