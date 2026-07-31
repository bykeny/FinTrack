import { createSupabaseBrowserClient } from "./supabase";
import { SavingsGoal, GoalContribution } from "./types";

async function ensureAuth(supabase: any) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.warn("⚠️ No Supabase session found. RLS policies may fail.");
  }
  return session?.user ?? null;
}

export async function fetchGoals(): Promise<SavingsGoal[]> {
  const supabase = createSupabaseBrowserClient();
  await ensureAuth(supabase);

  const { data, error } = await supabase
    .from("savings_goals")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as SavingsGoal[];
}

export async function createGoal(
  goalData: Omit<SavingsGoal, "id" | "current_amount" | "created_at">
): Promise<SavingsGoal> {
  const supabase = createSupabaseBrowserClient();
  const user = await ensureAuth(supabase);

  const payload = {
    ...goalData,
    current_amount: 0,
    ...(user ? { user_id: user.id } : {}),
  };

  const { data, error } = await supabase
    .from("savings_goals")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as SavingsGoal;
}

export async function addContribution(
  goalId: string,
  amount: number,
  notes?: string
): Promise<GoalContribution> {
  const supabase = createSupabaseBrowserClient();
  const user = await ensureAuth(supabase);

  const todayStr = new Date().toISOString().split("T")[0];

  // 1. Insert contribution record
  const { data: contribution, error: contribError } = await supabase
    .from("goal_contributions")
    .insert({
      goal_id: goalId,
      amount,
      notes: notes || undefined,
      contribution_date: todayStr,
      ...(user ? { user_id: user.id } : {}),
    })
    .select()
    .single();

  if (contribError) throw contribError;

  // 2. Fetch current goal amount
  const { data: goal, error: fetchError } = await supabase
    .from("savings_goals")
    .select("current_amount")
    .eq("id", goalId)
    .single();

  if (fetchError) throw fetchError;

  // 3. Update current_amount on savings_goals
  const newAmount = (goal?.current_amount || 0) + amount;

  const { error: updateError } = await supabase
    .from("savings_goals")
    .update({ current_amount: newAmount })
    .eq("id", goalId);

  if (updateError) throw updateError;

  return contribution as GoalContribution;
}

export async function deleteGoal(id: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  await ensureAuth(supabase);

  // 1. Delete linked contributions first
  await supabase.from("goal_contributions").delete().eq("goal_id", id);

  // 2. Delete savings goal
  const { error } = await supabase.from("savings_goals").delete().eq("id", id);
  if (error) throw error;
}
