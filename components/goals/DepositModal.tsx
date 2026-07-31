"use client";

import { useState, useEffect } from "react";
import { X, PiggyBank } from "lucide-react";
import { SavingsGoal } from "@/lib/types";
import { addContribution } from "@/lib/savings";
import { useToast } from "@/components/ui/Toast";

interface DepositModalProps {
  goal: SavingsGoal | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function DepositModal({ goal, isOpen, onClose, onSaved }: DepositModalProps) {
  const { toast } = useToast();

  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setNotes("");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast("Please enter a valid deposit amount", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await addContribution(goal.id, numAmount, notes.trim());
      toast(`Successfully added €${numAmount.toFixed(2)} to ${goal.name}!`, "success");
      onSaved();
      onClose();
    } catch (err: any) {
      console.error("Supabase Error:", err.message || err);
      toast(err.message || "Failed to log deposit", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !goal) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-x-0 bottom-0 z-[101] max-w-lg mx-auto bg-card rounded-t-3xl border-t border-border shadow-2xl animate-fade-in-up flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <PiggyBank className="text-accent" size={22} />
            <h2 className="text-lg font-bold">Add Deposit</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 pb-safe space-y-4">
          <div className="rounded-xl bg-muted/60 p-3 text-center border border-border">
            <p className="text-xs text-muted-foreground uppercase font-semibold">Goal</p>
            <p className="text-base font-bold text-foreground mt-0.5">{goal.name}</p>
            <p className="text-xs text-accent font-semibold mt-1">
              Current Progress: €{goal.current_amount.toFixed(2)} / €{goal.target_amount.toFixed(2)}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Deposit Amount (€)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="50.00"
              className="w-full min-h-[48px] rounded-xl border border-border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Monthly allocation, bonus"
              className="w-full min-h-[48px] rounded-xl border border-border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !amount}
            className="w-full min-h-[48px] rounded-xl bg-accent text-accent-foreground font-bold shadow-sm transition-all hover:bg-accent/90 disabled:opacity-50 mt-2"
          >
            {isSubmitting ? "Adding..." : "Confirm Deposit"}
          </button>
        </form>
      </div>
    </>
  );
}
