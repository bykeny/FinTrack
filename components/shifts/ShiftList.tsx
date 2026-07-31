"use client";

import { useState } from "react";
import { Shift } from "@/lib/types";
import { Edit2, Trash2, Clock, Euro } from "lucide-react";
import { deleteShift } from "@/lib/shifts";
import { useToast } from "@/components/ui/Toast";

interface ShiftListProps {
  shifts: Shift[];
  onEdit: (shift: Shift) => void;
  onRefresh: () => void;
}

export function ShiftList({ shifts, onEdit, onRefresh }: ShiftListProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this shift?")) return;
    
    setIsDeleting(id);
    try {
      await deleteShift(id);
      toast("Shift deleted successfully", "success");
      onRefresh();
    } catch (err: any) {
      toast(err.message || "Failed to delete shift", "error");
    } finally {
      setIsDeleting(null);
    }
  };

  if (!shifts.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-card rounded-2xl border border-border mt-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Clock className="text-muted-foreground" size={32} />
        </div>
        <h3 className="text-lg font-semibold">No shifts found</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Log a shift to see it here.
        </p>
      </div>
    );
  }

  // Group shifts by date
  const groupedShifts = shifts.reduce((acc, shift) => {
    if (!acc[shift.shift_date]) {
      acc[shift.shift_date] = [];
    }
    acc[shift.shift_date].push(shift);
    return acc;
  }, {} as Record<string, Shift[]>);

  // Sort dates descending
  const sortedDates = Object.keys(groupedShifts).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6 mt-4">
      {sortedDates.map((date) => {
        const dateObj = new Date(date);
        const dateStr = dateObj.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' });
        
        return (
          <div key={date} className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 bg-background/90 backdrop-blur-sm py-1 z-10">
              {dateStr}
            </h3>
            <div className="space-y-2">
              {groupedShifts[date].map((shift) => (
                <div 
                  key={shift.id} 
                  className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 transition-all hover:shadow-md animate-fade-in-up"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="font-bold text-lg">
                        {shift.start_time} - {shift.end_time}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><Clock size={14} /> {shift.total_hours}h active</span>
                        <span>•</span>
                        <span>{shift.break_minutes}m break</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-lg text-accent">
                        €{shift.gross_earnings.toFixed(2)}
                      </span>
                      <span className="text-xs font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full mt-1 flex items-center gap-1">
                        <Euro size={12}/> {shift.hourly_rate}/h
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end gap-2 border-t border-border pt-3 mt-1">
                    <button
                      onClick={() => onEdit(shift)}
                      className="text-sm font-medium text-foreground bg-muted hover:bg-border px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                      disabled={isDeleting === shift.id}
                    >
                      <Edit2 size={14} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(shift.id)}
                      className="text-sm font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                      disabled={isDeleting === shift.id}
                    >
                      <Trash2 size={14} /> {isDeleting === shift.id ? "..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
