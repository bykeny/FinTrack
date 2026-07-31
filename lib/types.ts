export interface Shift {
  id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  hourly_rate: number;
  total_hours: number;
  gross_earnings: number;
  linked_transaction_id?: string;
  created_at?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description?: string;
  date: string;
  linked_shift_id?: string;
  created_at?: string;
}

export interface Profile {
  id: string;
  hourly_rate_default?: number;
  created_at?: string;
}

export type DateRangePreset = "this_week" | "this_month" | "last_month" | "custom";
