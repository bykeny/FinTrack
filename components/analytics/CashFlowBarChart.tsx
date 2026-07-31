"use client";

import { CashFlowTrend } from "@/lib/analytics";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";
import { BarChart3 } from "lucide-react";

interface CashFlowBarChartProps {
  data: CashFlowTrend[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border bg-card p-3 shadow-lg text-xs space-y-1">
        <p className="font-bold text-foreground">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`tooltip-${index}`} className="flex items-center justify-between gap-4">
            <span style={{ color: entry.color }} className="font-semibold">
              {entry.name}:
            </span>
            <span className="font-bold text-foreground">€{Number(entry.value).toFixed(2)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function CashFlowBarChart({ data }: CashFlowBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-card rounded-2xl border border-border min-h-[260px]">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <BarChart3 className="text-muted-foreground" size={24} />
        </div>
        <h3 className="text-sm font-semibold text-foreground">No Trend Data</h3>
        <p className="text-xs text-muted-foreground mt-1">
          No cash flow activity in this date range.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-2">
      <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-2">Cash Flow Trends</h3>
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} 
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} 
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `€${val}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              formatter={(value) => <span className="text-xs text-foreground font-medium">{value}</span>}
            />
            <Bar dataKey="income" name="Income" fill="#34d399" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name="Expenses" fill="#f87171" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
