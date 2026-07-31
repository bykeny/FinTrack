import { Transaction } from "./types";

export function exportTransactionsToCSV(transactions: Transaction[], filename = "finance_transactions_export.csv") {
  if (!transactions || transactions.length === 0) {
    return false;
  }

  const headers = ["Date", "Type", "Category", "Description", "Amount EUR"];

  const rows = transactions.map((tx) => {
    const date = tx.transaction_date || "";
    const type = tx.type === "income" ? "Income" : "Expense";
    const category = tx.category_ref?.name || tx.category || "Uncategorized";
    const description = tx.description ? `"${tx.description.replace(/"/g, '""')}"` : "";
    const amount = (tx.type === "expense" ? -tx.amount : tx.amount).toFixed(2);

    return [date, type, category, description, amount].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return true;
}
