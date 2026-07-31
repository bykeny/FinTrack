"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Clock, Euro, Calculator } from "lucide-react";
import { Shift, DateRangePreset } from "@/lib/types";
import { fetchShifts, fetchDefaultHourlyRate } from "@/lib/shifts";
import { AddShiftModal } from "@/components/shifts/AddShiftModal";
import { ShiftList } from "@/components/shifts/ShiftList";
import { useToast } from "@/components/ui/Toast";

export default function ShiftsPage() {
  const { toast } = useToast();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [datePreset, setDatePreset] = useState<DateRangePreset>("this_week");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shiftToEdit, setShiftToEdit] = useState<Shift | undefined>(undefined);
  const [defaultHourlyRate, setDefaultHourlyRate] = useState(0.00);

  useEffect(() => {
    // Fetch default hourly rate once on mount
    fetchDefaultHourlyRate().then(setDefaultHourlyRate).catch(console.error);
  }, []);

  const loadShifts = async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      let from = "";
      let to = "";

      if (datePreset === "this_week") {
        // Monday to Sunday logic
        const day = today.getDay() || 7; // Sunday is 0, make it 7
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

      const data = await fetchShifts(from, to);
      setShifts(data);
    } catch (err: any) {
      console.error(err);
      toast("Failed to load shifts", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (datePreset === "custom" && (!customStart || !customEnd)) return;
    loadShifts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datePreset, customStart, customEnd]);

  // Derived Summary
  const { totalHours, totalEarned, avgRate } = useMemo(() => {
    let hours = 0;
    let earned = 0;
    shifts.forEach(s => {
      hours += s.total_hours;
      earned += s.gross_earnings;
    });
    const rate = hours > 0 ? (earned / hours) : 0;
    return { totalHours: hours, totalEarned: earned, avgRate: rate };
  }, [shifts]);

  const handleEdit = (shift: Shift) => {
    setShiftToEdit(shift);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setShiftToEdit(undefined);
    setIsModalOpen(true);
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-24">
      {/* Header */}
      <header className="mb-6 animate-fade-in-up">
        <h1 className="text-2xl font-bold tracking-tight">Shifts & Income</h1>
        <p className="text-sm text-muted-foreground mt-1">Track your variable earnings</p>
      </header>

      {/* Date Range Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide animate-fade-in-up" style={{ animationDelay: '50ms' }}>
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
        <div className="grid grid-cols-2 gap-4 mb-6 animate-fade-in-up">
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-accent/10 border border-accent/20 rounded-2xl p-4 flex flex-col animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-2 mb-2 text-accent">
            <Clock size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Total Hours</span>
          </div>
          <span className="text-2xl font-bold text-foreground">{totalHours.toFixed(1)}h</span>
        </div>
        <div className="bg-accent/10 border border-accent/20 rounded-2xl p-4 flex flex-col animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center gap-2 mb-2 text-accent">
            <Euro size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Total Earned</span>
          </div>
          <span className="text-2xl font-bold text-foreground">€{totalEarned.toFixed(2)}</span>
        </div>
        <div className="col-span-2 bg-card border border-border rounded-2xl p-4 flex justify-between items-center animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calculator size={16} />
            <span className="text-xs font-medium uppercase tracking-wider">Avg Hourly Rate</span>
          </div>
          <span className="text-lg font-bold">€{avgRate.toFixed(2)}/h</span>
        </div>
      </div>

      {/* Shift List */}
      <div className="animate-fade-in-up" style={{ animationDelay: '250ms' }}>
        <h2 className="text-lg font-bold mb-4">Logged Shifts</h2>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 bg-muted animate-pulse rounded-xl border border-border" />
            ))}
          </div>
        ) : (
          <ShiftList shifts={shifts} onEdit={handleEdit} onRefresh={loadShifts} />
        )}
      </div>

      {/* FAB */}
      <button
        onClick={handleAdd}
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label="Add Shift"
      >
        <Plus size={24} />
      </button>

      <AddShiftModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={loadShifts}
        shiftToEdit={shiftToEdit}
        defaultHourlyRate={defaultHourlyRate}
      />
    </div>
  );
}
