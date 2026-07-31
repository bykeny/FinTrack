"use client";

import { Download } from "lucide-react";
import { Transaction } from "@/lib/types";
import { exportTransactionsToCSV } from "@/lib/exportCsv";
import { useToast } from "@/components/ui/Toast";

interface ExportCSVButtonProps {
  transactions: Transaction[];
}

export function ExportCSVButton({ transactions }: ExportCSVButtonProps) {
  const { toast } = useToast();

  const handleExport = () => {
    const success = exportTransactionsToCSV(transactions);
    if (success) {
      toast("CSV file downloaded successfully!", "success");
    } else {
      toast("No transactions to export for the selected range.", "info");
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={transactions.length === 0}
      className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-card border border-border px-4 py-3 font-semibold text-foreground shadow-sm transition-all hover:bg-muted active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Download size={18} className="text-accent" />
      Export Data (CSV)
    </button>
  );
}
