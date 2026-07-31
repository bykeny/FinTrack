"use client";

import { CategoryBreakdown } from "@/lib/analytics";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { PieChart as PieIcon } from "lucide-react";

interface CategoryDonutChartProps {
  data: CategoryBreakdown[];
}

const DEFAULT_COLORS = ["#34d399", "#60a5fa", "#a78bfa", "#fbbf24", "#fb7185", "#f472b6"];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="rounded-xl border border-border bg-card p-3 shadow-lg text-xs">
        <p className="font-bold text-foreground">{item.name}</p>
        <p className="text-accent font-semibold mt-1">€{Number(item.value).toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

export function CategoryDonutChart({ data }: CategoryDonutChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-card rounded-2xl border border-border min-h-[260px]">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <PieIcon className="text-muted-foreground" size={24} />
        </div>
        <h3 className="text-sm font-semibold text-foreground">No Expense Categories</h3>
        <p className="text-xs text-muted-foreground mt-1">
          No expenses recorded for this date range.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-2">
      <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-2">Expenses by Category</h3>
      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="total"
              nameKey="category"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color && entry.color !== "#94a3b8" ? entry.color : DEFAULT_COLORS[index % DEFAULT_COLORS.length]} 
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              formatter={(value) => <span className="text-xs text-foreground font-medium">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
