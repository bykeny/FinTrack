"use client";

import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { Transaction, Category } from "@/lib/types";
import { createExpense, updateExpense } from "@/lib/expenses";
import { useToast } from "@/components/ui/Toast";
import { IconRenderer } from "@/components/ui/IconRenderer";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  expenseToEdit?: Transaction;
  categories: Category[];
}

export function AddExpenseModal({ isOpen, onClose, onSaved, expenseToEdit, categories }: AddExpenseModalProps) {
  const { toast } = useToast();
  
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fallbackCategories: Category[] = [
    { id: "fallback-1", name: "Groceries", icon: "shopping-cart", color: "#34d399", type: "expense" },
    { id: "fallback-2", name: "Transport", icon: "train", color: "#60a5fa", type: "expense" },
    { id: "fallback-3", name: "Rent", icon: "home", color: "#a78bfa", type: "expense" },
    { id: "fallback-4", name: "Utilities", icon: "zap", color: "#fbbf24", type: "expense" },
    { id: "fallback-5", name: "Entertainment", icon: "music", color: "#fb7185", type: "expense" },
    { id: "fallback-6", name: "Dining", icon: "coffee", color: "#f472b6", type: "expense" },
  ];

  const activeCategories = categories && categories.length > 0 ? categories : fallbackCategories;

  useEffect(() => {
    if (isOpen) {
      if (expenseToEdit) {
        setAmount(expenseToEdit.amount.toString());
        setCategoryId(expenseToEdit.category_id || (activeCategories[0]?.id ?? ""));
        setDate(expenseToEdit.transaction_date || "");
        setDescription(expenseToEdit.description || "");
      } else {
        setAmount("");
        setCategoryId(activeCategories[0]?.id ?? "");
        setDate(new Date().toISOString().split("T")[0]);
        setDescription("");
      }
    }
  }, [isOpen, expenseToEdit, activeCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast("Please enter a valid expense amount.", "error");
      return;
    }

    if (!categoryId) {
      toast("Please select a category.", "error");
      return;
    }

    if (!date) {
      toast("Please select a date.", "error");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const expenseData = {
        amount: numAmount,
        category_id: categoryId,
        transaction_date: date,
        description: description.trim() || undefined,
      };

      if (expenseToEdit) {
        await updateExpense(expenseToEdit.id, expenseData);
        toast("Expense updated successfully!", "success");
      } else {
        await createExpense(expenseData);
        toast("Expense logged successfully!", "success");
      }
      onSaved();
      onClose();
    } catch (err: any) {
      console.error("Supabase Error:", err.message || err);
      toast(err.message || "An error occurred while saving.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-x-0 bottom-0 z-[101] max-w-lg mx-auto bg-card rounded-t-3xl border-t border-border shadow-2xl animate-fade-in-up flex flex-col max-h-[95vh]">
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="text-lg font-bold">{expenseToEdit ? "Edit Expense" : "Log Expense"}</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 pb-safe space-y-6">
          {/* Amount Input */}
          <div className="flex flex-col items-center justify-center py-4">
            <label className="text-sm font-medium text-muted-foreground mb-2">Amount (€)</label>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-muted-foreground">€</span>
              <input 
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full max-w-[200px] bg-transparent text-5xl font-bold outline-none text-center text-foreground placeholder:text-muted-foreground/30 focus:ring-0"
                autoFocus
              />
            </div>
          </div>

          {/* Category Grid */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Category</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {activeCategories.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all duration-200 ${
                      isSelected 
                        ? "border-accent bg-accent/10 text-accent shadow-sm" 
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <div 
                      className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                        isSelected ? "bg-accent text-accent-foreground" : "bg-muted text-foreground"
                      }`}
                      style={!isSelected && cat.color ? { backgroundColor: `${cat.color}20`, color: cat.color } : {}}
                    >
                      <IconRenderer name={cat.icon} size={20} />
                    </div>
                    <span className="text-xs font-semibold text-center leading-tight truncate w-full">
                      {cat.name}
                    </span>
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-accent text-accent-foreground rounded-full p-0.5">
                        <Check size={10} strokeWidth={4} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Date</label>
            <input 
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full min-h-[48px] rounded-xl border border-border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Notes (Optional)</label>
            <input 
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Weekly groceries at Lidl"
              className="w-full min-h-[48px] rounded-xl border border-border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !categoryId || !amount}
            className="w-full min-h-[48px] rounded-xl bg-accent text-accent-foreground font-bold shadow-sm transition-all hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {isSubmitting ? "Saving..." : expenseToEdit ? "Update Expense" : "Save Expense"}
          </button>
        </form>
      </div>
    </>
  );
}
