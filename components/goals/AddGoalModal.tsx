"use client";

import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { createGoal } from "@/lib/savings";
import { useToast } from "@/components/ui/Toast";
import { IconRenderer } from "@/components/ui/IconRenderer";

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const ICON_PRESETS = [
  { id: "target", name: "Target" },
  { id: "piggy-bank", name: "Piggy Bank" },
  { id: "car", name: "Car" },
  { id: "home", name: "House" },
  { id: "plane", name: "Travel" },
  { id: "gift", name: "Gift" },
  { id: "laptop", name: "Gadgets" },
  { id: "shield", name: "Emergency" },
];

export function AddGoalModal({ isOpen, onClose, onSaved }: AddGoalModalProps) {
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [icon, setIcon] = useState("target");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setTargetAmount("");
      // Default target date 3 months out
      const defaultDate = new Date();
      defaultDate.setMonth(defaultDate.getMonth() + 3);
      setTargetDate(defaultDate.toISOString().split("T")[0]);
      setIcon("target");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(targetAmount);
    if (!name.trim()) {
      toast("Please enter a goal name", "error");
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      toast("Please enter a valid target amount", "error");
      return;
    }
    if (!targetDate) {
      toast("Please select a target date", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await createGoal({
        name: name.trim(),
        target_amount: amount,
        target_date: targetDate,
        icon,
      });

      toast("Savings Goal created!", "success");
      onSaved();
      onClose();
    } catch (err: any) {
      console.error("Supabase Error:", err.message || err);
      toast(err.message || "Failed to create goal", "error");
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
          <h2 className="text-lg font-bold">New Savings Goal</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 pb-safe space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Goal Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. New Car, Summer Trip"
              className="w-full min-h-[48px] rounded-xl border border-border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Target Amount (€)</label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="1000.00"
                className="w-full min-h-[48px] rounded-xl border border-border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Target Date</label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full min-h-[48px] rounded-xl border border-border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* Icon Selector Grid */}
          <div className="space-y-2 pt-2">
            <label className="text-sm font-medium">Choose Icon</label>
            <div className="grid grid-cols-4 gap-2.5">
              {ICON_PRESETS.map((item) => {
                const isSelected = icon === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIcon(item.id)}
                    className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border transition-all ${
                      isSelected 
                        ? "border-accent bg-accent/10 text-accent font-bold shadow-sm" 
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <IconRenderer name={item.id} size={20} />
                    <span className="text-[11px] truncate w-full text-center">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !name || !targetAmount}
            className="w-full min-h-[48px] rounded-xl bg-accent text-accent-foreground font-bold shadow-sm transition-all hover:bg-accent/90 disabled:opacity-50 mt-4"
          >
            {isSubmitting ? "Creating..." : "Create Goal"}
          </button>
        </form>
      </div>
    </>
  );
}
