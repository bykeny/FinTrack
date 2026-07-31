import { createSupabaseBrowserClient } from "./supabase";
import { Shift, Transaction } from "./types";

async function ensureAuth(supabase: any) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.warn("⚠️ No Supabase session found. RLS policies may fail.");
    if (process.env.NODE_ENV === "development") {
      console.warn("Local dev mode: Attempting to sign in with a default test user to pass RLS...");
      const email = process.env.NEXT_PUBLIC_TEST_USER_EMAIL || "test@example.com";
      const password = process.env.NEXT_PUBLIC_TEST_USER_PASSWORD || "password123";
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.warn("Dev mode fallback auth failed:", error.message);
      } else {
        console.warn("Dev mode fallback auth succeeded.");
      }
    }
  }
}

export async function fetchShifts(from?: string, to?: string): Promise<Shift[]> {
  const supabase = createSupabaseBrowserClient();
  await ensureAuth(supabase);
  let query = supabase.from("shifts").select("*").order("shift_date", { ascending: false }).order("start_time", { ascending: false });

  if (from) query = query.gte("shift_date", from);
  if (to) query = query.lte("shift_date", to);

  const { data, error } = await query;
  if (error) throw error;
  return data as Shift[];
}

export async function fetchDefaultHourlyRate(): Promise<number> {
  const supabase = createSupabaseBrowserClient();
  await ensureAuth(supabase);
  // Usually we'd get the current user ID, assuming RLS takes care of it or we query a single profile row
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) return 0.00;

  const { data, error } = await supabase
    .from("profiles")
    .select("hourly_rate_default")
    .eq("id", userData.user.id)
    .single();

  if (error) {
    console.error("Error fetching default hourly rate:", error);
    return 0.00;
  }
  return data?.hourly_rate_default ?? 0.00;
}

export async function createShift(
  shiftData: Omit<Shift, "id" | "created_at" | "linked_transaction_id">
): Promise<Shift> {
  const supabase = createSupabaseBrowserClient();
  await ensureAuth(supabase);

  // 1. Insert the shift
  const { data: newShift, error: shiftError } = await supabase
    .from("shifts")
    .insert(shiftData)
    .select()
    .single();

  if (shiftError) throw shiftError;

  // 2. Create the linked transaction
  const transactionData = {
    amount: shiftData.gross_earnings,
    type: "income",
    category: "Shift Pay",
    description: `Shift on ${shiftData.shift_date}`,
    date: shiftData.shift_date,
    linked_shift_id: newShift.id,
  };

  const { data: newTransaction, error: txError } = await supabase
    .from("transactions")
    .insert(transactionData)
    .select()
    .single();

  if (txError) {
    // Attempt rollback of shift if transaction fails
    await supabase.from("shifts").delete().eq("id", newShift.id);
    throw txError;
  }

  // 3. Update the shift with the linked transaction ID
  const { data: updatedShift, error: updateError } = await supabase
    .from("shifts")
    .update({ linked_transaction_id: newTransaction.id })
    .eq("id", newShift.id)
    .select()
    .single();

  if (updateError) throw updateError;

  return updatedShift as Shift;
}

export async function updateShift(
  id: string,
  shiftData: Partial<Omit<Shift, "id" | "created_at" | "linked_transaction_id">>
): Promise<Shift> {
  const supabase = createSupabaseBrowserClient();
  await ensureAuth(supabase);

  // 1. Update the shift
  const { data: updatedShift, error: shiftError } = await supabase
    .from("shifts")
    .update(shiftData)
    .eq("id", id)
    .select()
    .single();

  if (shiftError) throw shiftError;

  // 2. Update the linked transaction if necessary (if amount or date changed)
  if (updatedShift.linked_transaction_id && (shiftData.gross_earnings !== undefined || shiftData.shift_date !== undefined)) {
    const txUpdate: any = {};
    if (shiftData.gross_earnings !== undefined) txUpdate.amount = shiftData.gross_earnings;
    if (shiftData.shift_date !== undefined) {
      txUpdate.date = shiftData.shift_date;
      txUpdate.description = `Shift on ${shiftData.shift_date}`;
    }

    const { error: txError } = await supabase
      .from("transactions")
      .update(txUpdate)
      .eq("id", updatedShift.linked_transaction_id);

    if (txError) throw txError;
  }

  return updatedShift as Shift;
}

export async function deleteShift(id: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  await ensureAuth(supabase);
  
  // RLS typically handles cascade deletes if set up at the DB level, but we should explicitly delete the shift.
  // We can fetch it first to get the transaction ID, or if DB is set to ON DELETE CASCADE on linked_shift_id in transactions, 
  // deleting the shift is enough. Assuming we manually delete transaction to be safe:

  const { data: shift, error: fetchError } = await supabase
    .from("shifts")
    .select("linked_transaction_id")
    .eq("id", id)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

  if (shift?.linked_transaction_id) {
    await supabase.from("transactions").delete().eq("id", shift.linked_transaction_id);
  }

  const { error: deleteError } = await supabase.from("shifts").delete().eq("id", id);
  if (deleteError) throw deleteError;
}
