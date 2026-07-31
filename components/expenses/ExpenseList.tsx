"use client";

import { useState } from "react";
import { Transaction } from "@/lib/types";
import { Edit2, Trash2, ReceiptText, Calendar } from "lucide-react";
import { deleteExpense } from "@/lib/expenses";
import { useToast } from "@/components/ui/Toast";
import { IconRenderer } from "@/components/ui/IconRenderer";

interface ExpenseListProps {
  expenses: Transaction[];
  onEdit: (expense: Transaction) => void;
  onRefresh: () => void;
}

export function ExpenseList({ expenses, onEdit, onRefresh }: ExpenseListProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    
    setIsDeleting(id);
    try {
      await deleteExpense(id);
      toast("Expense deleted successfully", "success");
      onRefresh();
    } catch (err: any) {
      toast(err.message || "Failed to delete expense", "error");
    } finally {
      setIsDeleting(null);
    }
  };

  if (!expenses.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-card rounded-2xl border border-border mt-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <ReceiptText className="text-muted-foreground" size={32} />
        </div>
        <h3 className="text-lg font-semibold">No expenses found</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Adjust your filters or add a new expense.
        </p>
      </div>
    );
  }

  // Group expenses by date (transaction_date)
  const groupedExpenses = expenses.reduce((acc, expense) => {
    const d = expense.transaction_date || "Unknown Date";
    if (!acc[d]) {
      acc[d] = [];
    }
    acc[d].push(expense);
    return acc;
  }, {} as Record<string, Transaction[]>);

  // Sort dates descending
  const sortedDates = Object.keys(groupedExpenses).sort((a, b) => b.localeCompare(a));

  const formatRelativeDate = (dateStr: string) => {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    
    if (dateStr === today) return "Today";
    if (dateStr === yesterday) return "Yesterday";
    
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) return dateStr;

    return parsed.toLocaleDateString("en-US", { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6 mt-4">
      {sortedDates.map((date) => {
        return (
          <div key={date} className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 bg-background/90 backdrop-blur-sm py-1 z-10 flex items-center gap-1.5">
              <Calendar size={14} />
              {formatRelativeDate(date)}
            </h3>
            <div className="space-y-2">
              {groupedExpenses[date].map((expense) => {
                const cat = expense.category_ref;
                return (
                  <div 
                    key={expense.id} 
                    className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 transition-all hover:shadow-md animate-fade-in-up"
                  >
                    <div className="flex justify-between items-center gap-3">
                      <div className="flex items-center gap-3 flex-1 overflow-hidden">
                        {cat ? (
                          <div 
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                            style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                          >
                            <IconRenderer name={cat.icon} size={20} />
                          </div>
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                            <ReceiptText size={20} />
                          </div>
                        )}
                        <div className="flex flex-col overflow-hidden">
                          <span className="font-semibold text-base truncate">
                            {cat ? cat.name : (expense.category || "Uncategorized")}
                          </span>
                          {expense.description && (
                            <span className="text-xs text-muted-foreground truncate">
                              {expense.description}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="font-bold text-lg text-foreground">
                          -€{expense.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-end gap-2 border-t border-border pt-3 mt-1">
                      <button
                        onClick={() => onEdit(expense)}
                        className="text-sm font-medium text-foreground bg-muted hover:bg-border px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                        disabled={isDeleting === expense.id}
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="text-sm font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                        disabled={isDeleting === expense.id}
                      >
                        <Trash2 size={14} /> {isDeleting === expense.id ? "..." : "Delete"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
