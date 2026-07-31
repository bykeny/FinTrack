"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Shift } from "@/lib/types";
import { createShift, updateShift } from "@/lib/shifts";
import { useToast } from "@/components/ui/Toast";

interface AddShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  shiftToEdit?: Shift;
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

export function AddShiftModal({ isOpen, onClose, onSaved, shiftToEdit, defaultHourlyRate = 0.00 }: AddShiftModalProps) {
  const { toast } = useToast();
  
  const [shiftDate, setShiftDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [breakMinutes, setBreakMinutes] = useState(0);
  const [hourlyRate, setHourlyRate] = useState(defaultHourlyRate.toString());
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derived calculations for UI live preview
  const [activeHours, setActiveHours] = useState(0);
  const [grossEarnings, setGrossEarnings] = useState(0);

  useEffect(() => {
    if (isOpen) {
      if (shiftToEdit) {
        setShiftDate(shiftToEdit.date);
        setStartTime(formatTimeToHHMM(shiftToEdit.start_time));
        setEndTime(formatTimeToHHMM(shiftToEdit.end_time));
        setBreakMinutes(shiftToEdit.break_duration_minutes || 0);
        setHourlyRate(shiftToEdit.hourly_rate.toString());
      } else {
        const today = new Date();
        setShiftDate(today.toISOString().split("T")[0]);
        setStartTime("09:00");
        setEndTime("17:00");
        setBreakMinutes(30);
        setHourlyRate(defaultHourlyRate.toString());
      }
    }
  }, [isOpen, shiftToEdit, defaultHourlyRate]);

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
        // Shift crosses midnight
        end = new Date(`1970-01-02T${endTime}:00`);
      }

      const diffMs = end.getTime() - start.getTime();
      let totalMinutes = diffMs / (1000 * 60);
      
      // Subtract break
      totalMinutes = Math.max(0, totalMinutes - breakMinutes);
      
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
    
    if (!shiftDate || !startTime || !endTime || activeHours <= 0) {
      toast("Please enter valid shift details.", "error");
      return;
    }
    
    const rate = parseFloat(hourlyRate);
    if (isNaN(rate) || rate < 0) {
      toast("Please enter a valid hourly rate.", "error");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Build full ISO 8601 timestamp strings for TIMESTAMPTZ database column compatibility
      const startTimestamp = new Date(`${shiftDate}T${startTime}:00`).toISOString();

      let endDate = shiftDate;
      if (endTime < startTime) {
        const nextDay = new Date(shiftDate);
        nextDay.setDate(nextDay.getDate() + 1);
        endDate = nextDay.toISOString().split("T")[0];
      }
      const endTimestamp = new Date(`${endDate}T${endTime}:00`).toISOString();

      const shiftData = {
        date: shiftDate,
        start_time: startTimestamp,
        end_time: endTimestamp,
        break_duration_minutes: breakMinutes,
        hourly_rate: rate,
      };

      if (shiftToEdit) {
        await updateShift(shiftToEdit.id, shiftData);
        toast("Shift updated successfully!", "success");
      } else {
        await createShift(shiftData);
        toast("Shift logged successfully!", "success");
      }
      onSaved();
      onClose();
    } catch (err: any) {
      console.error("Supabase Error:", err.message || err);
      toast(err.message || "An error occurred while saving the shift.", "error");
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
      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 z-[101] max-w-lg mx-auto bg-card rounded-t-3xl border-t border-border shadow-2xl animate-fade-in-up flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold">{shiftToEdit ? "Edit Shift" : "Log Shift"}</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 pb-safe space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Shift Date</label>
            <input 
              type="date"
              required
              value={shiftDate}
              onChange={(e) => setShiftDate(e.target.value)}
              className="w-full min-h-[48px] rounded-xl border border-border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Start Time</label>
              <input 
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full min-h-[48px] rounded-xl border border-border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">End Time</label>
              <input 
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full min-h-[48px] rounded-xl border border-border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Break (mins)</label>
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
              <label className="text-sm font-medium">Hourly Rate (€)</label>
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

          {/* Live Math Preview */}
          <div className="mt-6 rounded-xl bg-muted p-4 border border-border flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Active Hours</p>
              <p className="text-xl font-bold">{activeHours.toFixed(2)}h</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-muted-foreground uppercase">Gross Earnings</p>
              <p className="text-2xl font-bold text-accent">€{grossEarnings.toFixed(2)}</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || activeHours <= 0}
            className="w-full mt-4 min-h-[48px] rounded-xl bg-accent text-accent-foreground font-bold shadow-sm transition-all hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : shiftToEdit ? "Update Shift" : "Log Shift"}
          </button>
        </form>
      </div>
    </>
  );
}
