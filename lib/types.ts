export interface Shift {
  id: string;
  user_id?: string;
  date: string; // Formerly shift_date
  start_time: string;
  end_time: string;
  break_duration_minutes: number; // Formerly break_minutes
  hourly_rate: number;
  total_hours: number;
  gross_earnings: number;
  notes?: string;
  linked_transaction_id?: string;
  created_at?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
  created_at?: string;
}

export interface Transaction {
  id: string;
  user_id?: string;
  amount: number;
  type: 'income' | 'expense';
  category?: string; // Fallback / display
  category_id?: string;
  category_ref?: Category;
  description?: string;
  transaction_date: string; // Formerly date
  shift_id?: string; // Formerly linked_shift_id
  created_at?: string;
}

export interface Profile {
  id: string;
  hourly_rate_default?: number;
  created_at?: string;
}

export interface SavingsGoal {
  id: string;
  user_id?: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  icon: string;
  color?: string;
  created_at?: string;
}

export interface GoalContribution {
  id: string;
  goal_id: string;
  user_id?: string;
  amount: number;
  contribution_date?: string;
  notes?: string;
  created_at?: string;
}

export type DateRangePreset = "this_week" | "this_month" | "last_month" | "custom";
