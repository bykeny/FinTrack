import { createSupabaseBrowserClient } from "./supabase";
import { Shift } from "./types";

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
  return session?.user ?? null;
}

export async function fetchShifts(from?: string, to?: string): Promise<Shift[]> {
  const supabase = createSupabaseBrowserClient();
  await ensureAuth(supabase);
  let query = supabase
    .from("shifts")
    .select("*")
    .order("date", { ascending: false })
    .order("start_time", { ascending: false });

  if (from) query = query.gte("date", from);
  if (to) query = query.lte("date", to);

  const { data, error } = await query;
  if (error) throw error;
  return data as Shift[];
}

export async function fetchDefaultHourlyRate(): Promise<number> {
  const supabase = createSupabaseBrowserClient();
  const user = await ensureAuth(supabase);
  if (!user) return 0.00;

  const { data, error } = await supabase
    .from("profiles")
    .select("hourly_rate_default")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error fetching default hourly rate:", error.message || error);
    return 0.00;
  }
  return data?.hourly_rate_default ?? 0.00;
}

export async function createShift(
  shiftData: Omit<Shift, "id" | "created_at" | "total_hours" | "gross_earnings" | "linked_transaction_id">
): Promise<Shift> {
  const supabase = createSupabaseBrowserClient();
  const user = await ensureAuth(supabase);

  // Strictly include ONLY column inputs for PostgreSQL generated columns
  const shiftPayload = {
    date: shiftData.date,
    start_time: shiftData.start_time,
    end_time: shiftData.end_time,
    break_duration_minutes: shiftData.break_duration_minutes,
    hourly_rate: shiftData.hourly_rate,
    notes: shiftData.notes || null,
    ...(user ? { user_id: user.id } : {}),
  };

  // 1. Insert the shift (Database computes total_hours and gross_earnings automatically)
  const { data: newShift, error: shiftError } = await supabase
    .from("shifts")
    .insert(shiftPayload)
    .select()
    .single();

  if (shiftError) throw shiftError;

  // Calculate gross earnings if database returned it or compute fallback
  let earnings = newShift.gross_earnings;
  if (earnings === undefined || earnings === null || Number(earnings) === 0) {
    try {
      const start = new Date(shiftData.start_time).getTime();
      const end = new Date(shiftData.end_time).getTime();
      const diffMs = end - start;
      const activeMins = Math.max(0, (diffMs / 60000) - (shiftData.break_duration_minutes || 0));
      earnings = (activeMins / 60) * shiftData.hourly_rate;
    } catch {
      earnings = 0;
    }
  }

  // Look up an income category ID if one exists in the database
  let categoryId: string | null = null;
  try {
    const { data: catData } = await supabase
      .from("categories")
      .select("id")
      .eq("type", "income")
      .limit(1)
      .maybeSingle();
    if (catData?.id) {
      categoryId = catData.id;
    }
  } catch {
    // Ignore category lookup errors if unpopulated
  }

  // 2. Create the linked transaction (omitting nonexistent 'category' text column)
  const transactionPayload = {
    amount: parseFloat(Number(earnings).toFixed(2)),
    type: "income",
    description: `Shift on ${shiftData.date}`,
    transaction_date: shiftData.date,
    shift_id: newShift.id,
    ...(categoryId ? { category_id: categoryId } : {}),
    ...(user ? { user_id: user.id } : {}),
  };

  const { data: newTransaction, error: txError } = await supabase
    .from("transactions")
    .insert(transactionPayload)
    .select()
    .single();

  if (txError) {
    // Rollback shift if transaction fails
    await supabase.from("shifts").delete().eq("id", newShift.id);
    throw txError;
  }

  // 3. Update shift with linked_transaction_id if column exists
  const { data: updatedShift, error: updateError } = await supabase
    .from("shifts")
    .update({ linked_transaction_id: newTransaction.id })
    .eq("id", newShift.id)
    .select()
    .single();

  if (updateError) {
    return newShift as Shift;
  }

  return updatedShift as Shift;
}

export async function updateShift(
  id: string,
  shiftData: Partial<Omit<Shift, "id" | "created_at" | "total_hours" | "gross_earnings" | "linked_transaction_id">>
): Promise<Shift> {
  const supabase = createSupabaseBrowserClient();
  await ensureAuth(supabase);

  // Exclude total_hours and gross_earnings from update payload
  const updatePayload: any = {};
  if (shiftData.date !== undefined) updatePayload.date = shiftData.date;
  if (shiftData.start_time !== undefined) updatePayload.start_time = shiftData.start_time;
  if (shiftData.end_time !== undefined) updatePayload.end_time = shiftData.end_time;
  if (shiftData.break_duration_minutes !== undefined) updatePayload.break_duration_minutes = shiftData.break_duration_minutes;
  if (shiftData.hourly_rate !== undefined) updatePayload.hourly_rate = shiftData.hourly_rate;
  if (shiftData.notes !== undefined) updatePayload.notes = shiftData.notes;

  // 1. Update the shift
  const { data: updatedShift, error: shiftError } = await supabase
    .from("shifts")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (shiftError) throw shiftError;

  // 2. Update linked transaction if needed
  if (updatedShift.linked_transaction_id) {
    const txUpdate: any = {};
    if (updatedShift.gross_earnings !== undefined) {
      txUpdate.amount = updatedShift.gross_earnings;
    }
    if (shiftData.date !== undefined) {
      txUpdate.transaction_date = shiftData.date;
      txUpdate.description = `Shift on ${shiftData.date}`;
    }

    await supabase
      .from("transactions")
      .update(txUpdate)
      .eq("id", updatedShift.linked_transaction_id);
  }

  return updatedShift as Shift;
}

export async function deleteShift(id: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  await ensureAuth(supabase);

  const { data: shift } = await supabase
    .from("shifts")
    .select("linked_transaction_id")
    .eq("id", id)
    .single();

  if (shift?.linked_transaction_id) {
    await supabase.from("transactions").delete().eq("id", shift.linked_transaction_id);
  } else {
    await supabase.from("transactions").delete().eq("shift_id", id);
  }

  const { error: deleteError } = await supabase.from("shifts").delete().eq("id", id);
  if (deleteError) throw deleteError;
}
