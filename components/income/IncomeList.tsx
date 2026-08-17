"use client";

import { useState } from "react";
import { Transaction } from "@/lib/types";
import { Edit2, Trash2, Wallet, Clock, Calendar, Briefcase, Tag } from "lucide-react";
import { deleteIncomeTransaction } from "@/lib/income";
import { useToast } from "@/components/ui/Toast";
import { IconRenderer } from "@/components/ui/IconRenderer";

interface IncomeListProps {
  transactions: Transaction[];
  onEdit: (item: Transaction) => void;
  onRefresh: () => void;
}

const formatDisplayTime = (timeStr?: string): string => {
  if (!timeStr) return "";
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

export function IncomeList({ transactions, onEdit, onRefresh }: IncomeListProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (tx: Transaction) => {
    const isShift = Boolean(tx.shift_id || tx.shift_ref);
    const confirmMessage = isShift
      ? "Are you sure you want to delete this shift and its linked income record?"
      : "Are you sure you want to delete this income entry?";

    if (!window.confirm(confirmMessage)) return;

    setIsDeleting(tx.id);
    try {
      await deleteIncomeTransaction(tx.id, tx.shift_id || tx.shift_ref?.id);
      toast("Income entry deleted successfully", "success");
      onRefresh();
    } catch (err: any) {
      console.error("Delete error:", err.message || err);
      toast(err.message || "Failed to delete income entry", "error");
    } finally {
      setIsDeleting(null);
    }
  };

  if (!transactions.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-card rounded-2xl border border-border mt-4">
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4 text-accent">
          <Wallet size={32} />
        </div>
        <h3 className="text-lg font-semibold">No Income Logged Yet</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          Log a direct payment or an hourly shift to see your income stream here.
        </p>
      </div>
    );
  }

  // Group by date (transaction_date)
  const grouped = transactions.reduce((acc, tx) => {
    const d = tx.transaction_date || "Unknown Date";
    if (!acc[d]) {
      acc[d] = [];
    }
    acc[d].push(tx);
    return acc;
  }, {} as Record<string, Transaction[]>);

  // Sort dates descending
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const formatRelativeDate = (dateStr: string) => {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    if (dateStr === today) return "Today";
    if (dateStr === yesterday) return "Yesterday";

    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) return dateStr;

    return parsed.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6 mt-4">
      {sortedDates.map((date) => (
        <div key={date} className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 bg-background/90 backdrop-blur-sm py-1 z-10 flex items-center gap-1.5">
            <Calendar size={14} />
            {formatRelativeDate(date)}
          </h3>

          <div className="space-y-2.5">
            {grouped[date].map((tx) => {
              const isShift = Boolean(tx.shift_id || tx.shift_ref);
              const shift = tx.shift_ref;
              const cat = tx.category_ref;

              const shiftHours = shift?.total_hours ?? (
                shift?.start_time && shift?.end_time
                  ? Math.max(0, (new Date(shift.end_time).getTime() - new Date(shift.start_time).getTime()) / 3600000 - (shift.break_duration_minutes || 0) / 60)
                  : 0
              );
              const shiftRate = shift?.hourly_rate;

              return (
                <div
                  key={tx.id}
                  className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3 transition-all hover:shadow-md animate-fade-in-up"
                >
                  <div className="flex justify-between items-start gap-3">
                    {/* Icon + Details */}
                    <div className="flex items-start gap-3 flex-1 overflow-hidden">
                      {isShift ? (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          <Clock size={22} />
                        </div>
                      ) : cat ? (
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
                          style={{
                            backgroundColor: `${cat.color}18`,
                            borderColor: `${cat.color}35`,
                            color: cat.color,
                          }}
                        >
                          <IconRenderer name={cat.icon} size={22} />
                        </div>
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent border border-accent/20">
                          <Wallet size={22} />
                        </div>
                      )}

                      <div className="flex flex-col overflow-hidden min-w-0">
                        {/* Title & Badge */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-base truncate text-foreground">
                            {isShift
                              ? "Shift Work"
                              : cat?.name || tx.category || "Direct Income"}
                          </span>

                          {/* Badge tag */}
                          {isShift ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">
                              <Clock size={11} />
                              {shiftHours > 0 ? `${shiftHours.toFixed(1)}h` : "Shift"}
                              {shiftRate ? ` @ €${shiftRate}/h` : ""}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                              <Tag size={11} />
                              {cat?.name || "Fixed"}
                            </span>
                          )}
                        </div>

                        {/* Shift Times or Description */}
                        {isShift && shift?.start_time && shift?.end_time ? (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {formatDisplayTime(shift.start_time)} - {formatDisplayTime(shift.end_time)}
                            {shift.break_duration_minutes ? ` • ${shift.break_duration_minutes}m break` : ""}
                            {shift.notes ? ` • ${shift.notes}` : ""}
                          </p>
                        ) : tx.description ? (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {tx.description}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-lg font-black text-accent tracking-tight">
                        +€{Number(tx.amount || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2 border-t border-border/70 pt-2.5 mt-0.5">
                    <button
                      onClick={() => onEdit(tx)}
                      className="text-xs font-semibold text-foreground bg-muted hover:bg-border px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5"
                      disabled={isDeleting === tx.id}
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(tx)}
                      className="text-xs font-semibold text-destructive bg-destructive/10 hover:bg-destructive/20 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5"
                      disabled={isDeleting === tx.id}
                    >
                      <Trash2 size={13} /> {isDeleting === tx.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
