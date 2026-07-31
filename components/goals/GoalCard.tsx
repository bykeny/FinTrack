"use client";

import { useState } from "react";
import { SavingsGoal } from "@/lib/types";
import { PlusCircle, Trash2, Calendar, Target } from "lucide-react";
import { IconRenderer } from "@/components/ui/IconRenderer";
import { deleteGoal } from "@/lib/savings";
import { useToast } from "@/components/ui/Toast";

interface GoalCardProps {
  goal: SavingsGoal;
  onDeposit: (goal: SavingsGoal) => void;
  onRefresh: () => void;
}

export function GoalCard({ goal, onDeposit, onRefresh }: GoalCardProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const percentage = Math.min(100, Math.max(0, (goal.current_amount / goal.target_amount) * 100));
  
  // Calculate remaining days
  const today = new Date();
  const targetDate = new Date(goal.target_date);
  const diffTime = targetDate.getTime() - today.getTime();
  const remainingDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${goal.name}"?`)) return;
    setIsDeleting(true);
    try {
      await deleteGoal(goal.id);
      toast("Goal deleted successfully", "success");
      onRefresh();
    } catch (err: any) {
      toast(err.message || "Failed to delete goal", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4 transition-all hover:shadow-md animate-fade-in-up">
      {/* Goal Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div 
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent"
            style={goal.color ? { backgroundColor: `${goal.color}20`, color: goal.color } : {}}
          >
            <IconRenderer name={goal.icon || "target"} size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground leading-snug">{goal.name}</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Calendar size={12} />
              {remainingDays > 0 ? `${remainingDays} days left` : "Target date reached"}
            </p>
          </div>
        </div>

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-muted-foreground hover:text-destructive p-2 rounded-lg transition-colors"
          aria-label="Delete Goal"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Progress Amount */}
      <div className="flex items-baseline justify-between pt-1">
        <div>
          <span className="text-2xl font-bold text-foreground">€{goal.current_amount.toFixed(2)}</span>
          <span className="text-xs text-muted-foreground ml-1.5">of €{goal.target_amount.toFixed(2)}</span>
        </div>
        <span className="text-sm font-bold text-accent">{percentage.toFixed(0)}%</span>
      </div>

      {/* Progress Bar */}
      <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-accent rounded-full transition-all duration-500"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: goal.color ? goal.color : undefined 
          }}
        />
      </div>

      {/* Deposit Button */}
      <div className="pt-1">
        <button
          onClick={() => onDeposit(goal)}
          className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-accent/10 text-accent font-bold text-sm hover:bg-accent/20 transition-all active:scale-98"
        >
          <PlusCircle size={16} />
          Add Deposit
        </button>
      </div>
    </div>
  );
}
