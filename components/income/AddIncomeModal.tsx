"use client";

import { useState, useEffect } from "react";
import { X, Clock, Wallet, DollarSign, Calendar, FileText } from "lucide-react";
import { Transaction, Shift, Category } from "@/lib/types";
import {
  createFixedIncome,
  updateFixedIncome,
  createShiftIncome,
  updateShiftIncome,
  calculateShiftGross,
  FALLBACK_INCOME_CATEGORIES,
} from "@/lib/income";
import { useToast } from "@/components/ui/Toast";
import { IconRenderer } from "@/components/ui/IconRenderer";

interface AddIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  itemToEdit?: Transaction;
  categories: Category[];
  defaultHourlyRate?: number;
}

const formatTimeToHHMM = (timeStr?: string): string => {
  if (!timeStr) return "09:00";
  if (timeStr.includes("T")) {
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) {
      const h = String(d.getHours()).padStart(2, "0");
      const m = String(d.getMinutes()).padStart(2, "0");
      return `${h}:${m}`;
    }
  }
  return timeStr.slice(0, 5);
};

export function AddIncomeModal({
  isOpen,
  onClose,
  onSaved,
  itemToEdit,
  categories,
  defaultHourlyRate = 0.0,
}: AddIncomeModalProps) {
  const { toast } = useToast();

  // Mode switcher: "fixed" (Direct / Fixed) vs "shift" (Hourly Shift)
  const [mode, setMode] = useState<"fixed" | "shift">("fixed");

  // Mode A: Fixed Income states
  const [fixedAmount, setFixedAmount] = useState("");
  const [fixedCategoryId, setFixedCategoryId] = useState("");
  const [fixedDate, setFixedDate] = useState("");
  const [fixedDescription, setFixedDescription] = useState("");

  // Mode B: Hourly Shift states
  const [shiftDate, setShiftDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [breakMinutes, setBreakMinutes] = useState(30);
  const [hourlyRate, setHourlyRate] = useState(defaultHourlyRate.toString());
  const [shiftNotes, setShiftNotes] = useState("");

  // Derived shift calculation preview
  const [activeHours, setActiveHours] = useState(0);
  const [grossEarnings, setGrossEarnings] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeCategories =
    categories && categories.length > 0 ? categories : FALLBACK_INCOME_CATEGORIES;

  useEffect(() => {
    if (isOpen) {
      if (itemToEdit) {
        if (itemToEdit.shift_id || itemToEdit.shift_ref) {
          // Editing a Shift entry
          setMode("shift");
          const shift = itemToEdit.shift_ref;
          setShiftDate(shift?.date || itemToEdit.transaction_date || new Date().toISOString().split("T")[0]);
          setStartTime(formatTimeToHHMM(shift?.start_time));
          setEndTime(formatTimeToHHMM(shift?.end_time));
          setBreakMinutes(shift?.break_duration_minutes ?? 0);
          setHourlyRate((shift?.hourly_rate ?? defaultHourlyRate).toString());
          setShiftNotes(shift?.notes || itemToEdit.description || "");
        } else {
          // Editing a Fixed Income entry
          setMode("fixed");
          setFixedAmount(itemToEdit.amount.toString());
          setFixedCategoryId(itemToEdit.category_id || activeCategories[0]?.id || "");
          setFixedDate(itemToEdit.transaction_date || new Date().toISOString().split("T")[0]);
          setFixedDescription(itemToEdit.description || "");
        }
      } else {
        // New entry reset
        setMode("fixed");
        const today = new Date().toISOString().split("T")[0];
        setFixedAmount("");
        setFixedCategoryId(activeCategories[0]?.id || "");
        setFixedDate(today);
        setFixedDescription("");

        setShiftDate(today);
        setStartTime("09:00");
        setEndTime("17:00");
        setBreakMinutes(30);
        setHourlyRate(defaultHourlyRate > 0 ? defaultHourlyRate.toString() : "12.00");
        setShiftNotes("");
      }
    }
  }, [isOpen, itemToEdit, activeCategories, defaultHourlyRate]);

  // Live Math preview for shift
  useEffect(() => {
    if (!startTime || !endTime) {
      setActiveHours(0);
      setGrossEarnings(0);
      return;
    }

    try {
      const start = new Date(`1970-01-01T${startTime}:00`);
      let end = new Date(`1970-01-01T${endTime}:00`);

      if (end < start) {
        // Crosses midnight
        end = new Date(`1970-01-02T${endTime}:00`);
      }

      const diffMs = end.getTime() - start.getTime();
      let totalMinutes = diffMs / (1000 * 60);
      totalMinutes = Math.max(0, totalMinutes - (breakMinutes || 0));

      const hours = totalMinutes / 60;
      setActiveHours(hours);

      const rate = parseFloat(hourlyRate) || 0;
      setGrossEarnings(hours * rate);
    } catch {
      setActiveHours(0);
      setGrossEarnings(0);
    }
  }, [startTime, endTime, breakMinutes, hourlyRate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (mode === "fixed") {
        // Mode A: Fixed Income
        const numAmount = parseFloat(fixedAmount);
        if (isNaN(numAmount) || numAmount <= 0) {
          toast("Please enter a valid income amount.", "error");
          setIsSubmitting(false);
          return;
        }

        if (!fixedDate) {
          toast("Please select a date.", "error");
          setIsSubmitting(false);
          return;
        }

        const fixedPayload = {
          amount: numAmount,
          category_id: fixedCategoryId || undefined,
          transaction_date: fixedDate,
          description: fixedDescription.trim() || undefined,
        };

        if (itemToEdit && !itemToEdit.shift_id) {
          await updateFixedIncome(itemToEdit.id, fixedPayload);
          toast("Income entry updated successfully!", "success");
        } else {
          await createFixedIncome(fixedPayload);
          toast("Income entry logged successfully!", "success");
        }
      } else {
        // Mode B: Hourly Shift
        if (!shiftDate || !startTime || !endTime || activeHours <= 0) {
          toast("Please enter valid shift hours.", "error");
          setIsSubmitting(false);
          return;
        }

        const rate = parseFloat(hourlyRate);
        if (isNaN(rate) || rate < 0) {
          toast("Please enter a valid hourly rate.", "error");
          setIsSubmitting(false);
          return;
        }

        const startTimestamp = new Date(`${shiftDate}T${startTime}:00`).toISOString();
        let endDate = shiftDate;
        if (endTime < startTime) {
          const nextDay = new Date(shiftDate);
          nextDay.setDate(nextDay.getDate() + 1);
          endDate = nextDay.toISOString().split("T")[0];
        }
        const endTimestamp = new Date(`${endDate}T${endTime}:00`).toISOString();

        const shiftPayload = {
          date: shiftDate,
          start_time: startTimestamp,
          end_time: endTimestamp,
          break_duration_minutes: breakMinutes,
          hourly_rate: rate,
          notes: shiftNotes.trim() || undefined,
        };

        if (itemToEdit && (itemToEdit.shift_id || itemToEdit.shift_ref)) {
          const shiftId = itemToEdit.shift_id || itemToEdit.shift_ref?.id;
          if (shiftId) {
            await updateShiftIncome(shiftId, shiftPayload, itemToEdit.id);
            toast("Shift updated successfully!", "success");
          }
        } else {
          await createShiftIncome(shiftPayload);
          toast("Shift and income logged successfully!", "success");
        }
      }

      onSaved();
      onClose();
    } catch (err: any) {
      console.error("Income save error:", err.message || err);
      toast(err.message || "An error occurred while saving.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-[101] max-w-lg mx-auto bg-card rounded-t-3xl border-t border-border shadow-2xl animate-fade-in-up flex flex-col max-h-[95vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-lg font-bold">
              {itemToEdit ? "Edit Income Entry" : "Log Income"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {mode === "fixed" ? "Record direct or fixed income" : "Calculate earnings from shift hours"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Top Segmented Mode Switcher */}
        {!itemToEdit && (
          <div className="px-4 pt-4 shrink-0">
            <div className="grid grid-cols-2 p-1 bg-muted rounded-2xl border border-border">
              <button
                type="button"
                onClick={() => setMode("fixed")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  mode === "fixed"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Wallet size={16} />
                Direct / Fixed
              </button>
              <button
                type="button"
                onClick={() => setMode("shift")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  mode === "shift"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Clock size={16} />
                Hourly Shift
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 pb-safe space-y-5">
          {mode === "fixed" ? (
            /* ──────────────── MODE A: FIXED INCOME ──────────────── */
            <>
              {/* Amount Input */}
              <div className="flex flex-col items-center justify-center py-2">
                <label className="text-xs font-medium text-muted-foreground mb-1">
                  Income Amount (€)
                </label>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold text-accent">€</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={fixedAmount}
                    onChange={(e) => setFixedAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full max-w-[220px] bg-transparent text-5xl font-bold outline-none text-center text-foreground placeholder:text-muted-foreground/30 focus:ring-0"
                    autoFocus
                  />
                </div>
              </div>

              {/* Income Category Pills */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Category
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-3 gap-2.5">
                  {activeCategories.map((cat) => {
                    const isSelected = fixedCategoryId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFixedCategoryId(cat.id)}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "border-accent bg-accent/10 text-accent font-semibold shadow-sm"
                            : "border-border bg-card text-foreground hover:bg-muted"
                        }`}
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            isSelected
                              ? "bg-accent text-accent-foreground"
                              : "bg-muted text-foreground"
                          }`}
                          style={
                            !isSelected && cat.color
                              ? { backgroundColor: `${cat.color}20`, color: cat.color }
                              : {}
                          }
                        >
                          <IconRenderer name={cat.icon} size={16} />
                        </div>
                        <span className="text-xs truncate">{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date Received
                </label>
                <div className="relative flex items-center">
                  <input
                    type="date"
                    required
                    value={fixedDate}
                    onChange={(e) => setFixedDate(e.target.value)}
                    className="w-full min-h-[48px] rounded-xl border border-border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              {/* Notes / Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Description / Note (Optional)
                </label>
                <input
                  type="text"
                  value={fixedDescription}
                  onChange={(e) => setFixedDescription(e.target.value)}
                  placeholder="e.g. Monthly Salary or Client Project"
                  className="w-full min-h-[48px] rounded-xl border border-border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </>
          ) : (
            /* ──────────────── MODE B: HOURLY SHIFT ──────────────── */
            <>
              {/* Shift Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Shift Date
                </label>
                <input
                  type="date"
                  required
                  value={shiftDate}
                  onChange={(e) => setShiftDate(e.target.value)}
                  className="w-full min-h-[48px] rounded-xl border border-border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              {/* Start & End Times */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full min-h-[48px] rounded-xl border border-border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full min-h-[48px] rounded-xl border border-border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              {/* Break & Hourly Rate */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Break (mins)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={breakMinutes}
                    onChange={(e) => setBreakMinutes(parseInt(e.target.value) || 0)}
                    className="w-full min-h-[48px] rounded-xl border border-border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Hourly Rate (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="w-full min-h-[48px] rounded-xl border border-border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              {/* Optional Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Shift Notes (Optional)
                </label>
                <input
                  type="text"
                  value={shiftNotes}
                  onChange={(e) => setShiftNotes(e.target.value)}
                  placeholder="e.g. Evening barista shift"
                  className="w-full min-h-[48px] rounded-xl border border-border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              {/* Live Earnings & Active Hours Preview */}
              <div className="rounded-2xl bg-accent/10 border border-accent/20 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-accent uppercase tracking-wider">
                    Active Hours
                  </p>
                  <p className="text-xl font-bold text-foreground">
                    {activeHours.toFixed(2)}h
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    After {breakMinutes}m break
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-accent uppercase tracking-wider">
                    Estimated Gross
                  </p>
                  <p className="text-2xl font-black text-accent">
                    €{grossEarnings.toFixed(2)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    @ €{parseFloat(hourlyRate || "0").toFixed(2)}/h
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              isSubmitting ||
              (mode === "fixed" && (!fixedAmount || parseFloat(fixedAmount) <= 0)) ||
              (mode === "shift" && activeHours <= 0)
            }
            className="w-full min-h-[48px] rounded-xl bg-accent text-accent-foreground font-bold shadow-sm transition-all hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {isSubmitting
              ? "Saving..."
              : itemToEdit
              ? "Update Income Entry"
              : mode === "fixed"
              ? "Save Fixed Income"
              : "Log Shift & Earnings"}
          </button>
        </form>
      </div>
    </>
  );
}
