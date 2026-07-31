"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, PiggyBank, Target } from "lucide-react";
import { SavingsGoal } from "@/lib/types";
import { fetchGoals } from "@/lib/savings";
import { GoalCard } from "@/components/goals/GoalCard";
import { AddGoalModal } from "@/components/goals/AddGoalModal";
import { DepositModal } from "@/components/goals/DepositModal";
import { useToast } from "@/components/ui/Toast";

export default function GoalsPage() {
  const { toast } = useToast();

  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [depositGoal, setDepositGoal] = useState<SavingsGoal | null>(null);

  const loadGoals = async () => {
    setIsLoading(true);
    try {
      const data = await fetchGoals();
      setGoals(data);
    } catch (err: any) {
      console.error("Supabase Error:", err.message || err);
      toast("Failed to load savings goals", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Summary Metrics
  const { totalSaved, activeGoalsCount } = useMemo(() => {
    let saved = 0;
    goals.forEach((g) => {
      saved += g.current_amount || 0;
    });
    return {
      totalSaved: saved,
      activeGoalsCount: goals.length,
    };
  }, [goals]);

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-24">
      {/* Header */}
      <header className="mb-6 animate-fade-in-up">
        <h1 className="text-2xl font-bold tracking-tight">Savings Goals</h1>
        <p className="text-sm text-muted-foreground mt-1">Build your financial safety net</p>
      </header>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-accent/10 border border-accent/20 rounded-2xl p-4 flex flex-col animate-fade-in-up" style={{ animationDelay: '50ms' }}>
          <div className="flex items-center gap-2 mb-2 text-accent">
            <PiggyBank size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Total Saved</span>
          </div>
          <span className="text-2xl font-bold text-foreground">€{totalSaved.toFixed(2)}</span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 flex flex-col animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
            <Target size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Active Goals</span>
          </div>
          <span className="text-2xl font-bold text-foreground">{activeGoalsCount}</span>
        </div>
      </div>

      {/* Goals List */}
      <div className="animate-fade-in-up" style={{ animationDelay: '150ms' }}>
        <h2 className="text-lg font-bold mb-4">Your Goals</h2>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-44 bg-muted animate-pulse rounded-2xl border border-border" />
            ))}
          </div>
        ) : goals.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-card rounded-2xl border border-border mt-2">
            <div className="w-16 h-16 rounded-full bg-accent/10 text-accent flex items-center justify-center mb-4">
              <PiggyBank size={32} />
            </div>
            <h3 className="text-lg font-semibold">No goals set yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Set a target for your dream car, vacation, or emergency fund.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 px-5 py-2.5 rounded-xl bg-accent text-accent-foreground font-bold text-sm shadow-sm transition-transform hover:scale-105 active:scale-95"
            >
              Create Goal
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onDeposit={(g) => setDepositGoal(g)}
                onRefresh={loadGoals}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label="Add Goal"
      >
        <Plus size={24} />
      </button>

      {/* Add Goal Modal */}
      <AddGoalModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSaved={loadGoals}
      />

      {/* Deposit Modal */}
      <DepositModal
        goal={depositGoal}
        isOpen={!!depositGoal}
        onClose={() => setDepositGoal(null)}
        onSaved={loadGoals}
      />
    </div>
  );
}
