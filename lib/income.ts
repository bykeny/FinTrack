import { createSupabaseBrowserClient } from "./supabase";
import { Transaction, Shift, Category, IncomeSummary } from "./types";

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

export const FALLBACK_INCOME_CATEGORIES: Category[] = [
  { id: "fallback-inc-1", name: "Salary", icon: "briefcase", color: "#10b981", type: "income" },
  { id: "fallback-inc-2", name: "Hourly Shift", icon: "clock", color: "#f59e0b", type: "income" },
  { id: "fallback-inc-3", name: "Freelance", icon: "laptop", color: "#3b82f6", type: "income" },
  { id: "fallback-inc-4", name: "Investments", icon: "trending-up", color: "#8b5cf6", type: "income" },
  { id: "fallback-inc-5", name: "Gift", icon: "gift", color: "#ec4899", type: "income" },
  { id: "fallback-inc-6", name: "Other", icon: "wallet", color: "#64748b", type: "income" },
];

export async function fetchIncomeCategories(): Promise<Category[]> {
  const supabase = createSupabaseBrowserClient();
  await ensureAuth(supabase);
  
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("type", "income")
    .order("name");
  
  if (error) {
    console.warn("Error fetching income categories:", error.message || error);
    return FALLBACK_INCOME_CATEGORIES;
  }
  
  if (!data || data.length === 0) {
    return FALLBACK_INCOME_CATEGORIES;
  }
  
  return data as Category[];
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

export async function fetchIncomeTransactions(
  from?: string,
  to?: string
): Promise<{ transactions: Transaction[]; summary: IncomeSummary }> {
  const supabase = createSupabaseBrowserClient();
  await ensureAuth(supabase);

  // 1. Query income transactions
  let txQuery = supabase
    .from("transactions")
    .select("*, categories(*)")
    .eq("type", "income")
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (from) txQuery = txQuery.gte("transaction_date", from);
  if (to) txQuery = txQuery.lte("transaction_date", to);

  const { data: txData, error: txError } = await txQuery;
  if (txError) throw txError;

  const rawTxList = txData || [];
  
  // 2. Fetch linked shifts if any transactions have shift_id or if shifts exist in date range
  const shiftIds = rawTxList
    .map((t: any) => t.shift_id)
    .filter((id: any): id is string => Boolean(id));

  const shiftsMap = new Map<string, Shift>();

  if (shiftIds.length > 0) {
    const { data: shiftData, error: shiftError } = await supabase
      .from("shifts")
      .select("*")
      .in("id", shiftIds);

    if (!shiftError && shiftData) {
      shiftData.forEach((s: any) => {
        shiftsMap.set(s.id, s as Shift);
        if (s.linked_transaction_id) {
          shiftsMap.set(s.linked_transaction_id, s as Shift);
        }
      });
    }
  }

  // Also query shifts by date range to catch any shifts that might not have a direct shift_id in transactions
  let shiftRangeQuery = supabase
    .from("shifts")
    .select("*")
    .order("date", { ascending: false });

  if (from) shiftRangeQuery = shiftRangeQuery.gte("date", from);
  if (to) shiftRangeQuery = shiftRangeQuery.lte("date", to);

  const { data: allShiftsInRange } = await shiftRangeQuery;
  if (allShiftsInRange) {
    allShiftsInRange.forEach((s: any) => {
      shiftsMap.set(s.id, s as Shift);
      if (s.linked_transaction_id) {
        shiftsMap.set(s.linked_transaction_id, s as Shift);
      }
    });
  }

  // 3. Assemble and decorate Transactions
  const transactions: Transaction[] = rawTxList.map((row: any) => {
    const linkedShift = row.shift_id 
      ? shiftsMap.get(row.shift_id) 
      : (shiftsMap.get(row.id) || undefined);

    return {
      ...row,
      category_ref: row.categories || undefined,
      shift_ref: linkedShift || undefined,
    } as Transaction;
  });

  // 4. Calculate KPI metrics
  let totalIncome = 0;
  let shiftIncome = 0;
  let totalShiftHours = 0;
  let fixedIncome = 0;

  transactions.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    totalIncome += amt;

    if (tx.shift_id || tx.shift_ref) {
      shiftIncome += amt;
      if (tx.shift_ref) {
        totalShiftHours += Number(tx.shift_ref.total_hours) || 0;
      }
    } else {
      fixedIncome += amt;
    }
  });

  // Check if there are any orphaned shifts in the range not yet represented in transactions
  if (allShiftsInRange) {
    allShiftsInRange.forEach((s: any) => {
      const isAlreadyIncluded = transactions.some(
        (t) => t.shift_id === s.id || t.id === s.linked_transaction_id
      );
      if (!isAlreadyIncluded) {
        const earnings = Number(s.gross_earnings) || 0;
        shiftIncome += earnings;
        totalIncome += earnings;
        totalShiftHours += Number(s.total_hours) || 0;
      }
    });
  }

  const averageHourlyRate = totalShiftHours > 0 ? (shiftIncome / totalShiftHours) : 0;

  const summary: IncomeSummary = {
    totalIncome: parseFloat(totalIncome.toFixed(2)),
    shiftIncome: parseFloat(shiftIncome.toFixed(2)),
    totalShiftHours: parseFloat(totalShiftHours.toFixed(1)),
    fixedIncome: parseFloat(fixedIncome.toFixed(2)),
    averageHourlyRate: parseFloat(averageHourlyRate.toFixed(2)),
  };

  return { transactions, summary };
}

export async function createFixedIncome(data: {
  amount: number;
  category_id?: string;
  transaction_date: string;
  description?: string;
}): Promise<Transaction> {
  const supabase = createSupabaseBrowserClient();
  const user = await ensureAuth(supabase);

  const payload = {
    amount: data.amount,
    category_id: data.category_id || null,
    description: data.description?.trim() || null,
    transaction_date: data.transaction_date,
    type: "income",
    ...(user ? { user_id: user.id } : {}),
  };

  const { data: newTx, error } = await supabase
    .from("transactions")
    .insert(payload)
    .select("*, categories(*)")
    .single();

  if (error) throw error;

  return {
    ...newTx,
    category_ref: newTx.categories || undefined,
  } as Transaction;
}

export async function updateFixedIncome(
  id: string,
  data: {
    amount?: number;
    category_id?: string;
    transaction_date?: string;
    description?: string;
  }
): Promise<Transaction> {
  const supabase = createSupabaseBrowserClient();
  await ensureAuth(supabase);

  const updatePayload: any = {};
  if (data.amount !== undefined) updatePayload.amount = data.amount;
  if (data.category_id !== undefined) updatePayload.category_id = data.category_id;
  if (data.transaction_date !== undefined) updatePayload.transaction_date = data.transaction_date;
  if (data.description !== undefined) updatePayload.description = data.description?.trim() || null;

  const { data: updatedTx, error } = await supabase
    .from("transactions")
    .update(updatePayload)
    .eq("id", id)
    .select("*, categories(*)")
    .single();

  if (error) throw error;

  return {
    ...updatedTx,
    category_ref: updatedTx.categories || undefined,
  } as Transaction;
}

export function calculateShiftGross(
  startTime: string,
  endTime: string,
  breakMinutes: number,
  hourlyRate: number
): { activeHours: number; grossEarnings: number } {
  try {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const diffMs = end - start;
    const totalMinutes = Math.max(0, (diffMs / (1000 * 60)) - (breakMinutes || 0));
    const activeHours = totalMinutes / 60;
    const grossEarnings = activeHours * (hourlyRate || 0);
    return {
      activeHours: parseFloat(activeHours.toFixed(2)),
      grossEarnings: parseFloat(grossEarnings.toFixed(2)),
    };
  } catch {
    return { activeHours: 0, grossEarnings: 0 };
  }
}

export async function createShiftIncome(
  shiftData: Omit<Shift, "id" | "created_at" | "total_hours" | "gross_earnings" | "linked_transaction_id">
): Promise<{ shift: Shift; transaction: Transaction }> {
  const supabase = createSupabaseBrowserClient();
  const user = await ensureAuth(supabase);

  // 1. Insert into shifts table
  const shiftPayload = {
    date: shiftData.date,
    start_time: shiftData.start_time,
    end_time: shiftData.end_time,
    break_duration_minutes: shiftData.break_duration_minutes,
    hourly_rate: shiftData.hourly_rate,
    notes: shiftData.notes?.trim() || null,
    ...(user ? { user_id: user.id } : {}),
  };

  const { data: newShift, error: shiftError } = await supabase
    .from("shifts")
    .insert(shiftPayload)
    .select()
    .single();

  if (shiftError) throw shiftError;

  // Compute earnings fallback if database generated columns aren't evaluated immediately
  let earnings = Number(newShift.gross_earnings);
  if (!earnings || isNaN(earnings)) {
    const math = calculateShiftGross(
      shiftData.start_time,
      shiftData.end_time,
      shiftData.break_duration_minutes,
      shiftData.hourly_rate
    );
    earnings = math.grossEarnings;
  }

  // Find or use default 'Hourly Shift' / 'Income' category if exists
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
    // Ignore category lookup fallback
  }

  // 2. Create the linked income transaction
  const transactionPayload = {
    amount: parseFloat(Number(earnings).toFixed(2)),
    type: "income",
    description: shiftData.notes?.trim() || `Shift on ${shiftData.date}`,
    transaction_date: shiftData.date,
    shift_id: newShift.id,
    ...(categoryId ? { category_id: categoryId } : {}),
    ...(user ? { user_id: user.id } : {}),
  };

  const { data: newTx, error: txError } = await supabase
    .from("transactions")
    .insert(transactionPayload)
    .select("*, categories(*)")
    .single();

  if (txError) {
    // Rollback shift if transaction creation fails
    await supabase.from("shifts").delete().eq("id", newShift.id);
    throw txError;
  }

  // 3. Link transaction ID back to shift
  let finalizedShift = newShift as Shift;
  try {
    const { data: updatedShift } = await supabase
      .from("shifts")
      .update({ linked_transaction_id: newTx.id })
      .eq("id", newShift.id)
      .select()
      .single();

    if (updatedShift) {
      finalizedShift = updatedShift as Shift;
    }
  } catch {
    // Ignore if column doesn't support update
  }

  const transaction: Transaction = {
    ...newTx,
    category_ref: newTx.categories || undefined,
    shift_ref: finalizedShift,
  };

  return { shift: finalizedShift, transaction };
}

export async function updateShiftIncome(
  shiftId: string,
  shiftData: Partial<Omit<Shift, "id" | "created_at" | "total_hours" | "gross_earnings" | "linked_transaction_id">>,
  transactionId?: string
): Promise<{ shift: Shift; transaction?: Transaction }> {
  const supabase = createSupabaseBrowserClient();
  await ensureAuth(supabase);

  const updatePayload: any = {};
  if (shiftData.date !== undefined) updatePayload.date = shiftData.date;
  if (shiftData.start_time !== undefined) updatePayload.start_time = shiftData.start_time;
  if (shiftData.end_time !== undefined) updatePayload.end_time = shiftData.end_time;
  if (shiftData.break_duration_minutes !== undefined) updatePayload.break_duration_minutes = shiftData.break_duration_minutes;
  if (shiftData.hourly_rate !== undefined) updatePayload.hourly_rate = shiftData.hourly_rate;
  if (shiftData.notes !== undefined) updatePayload.notes = shiftData.notes?.trim() || null;

  // 1. Update the shift
  const { data: updatedShift, error: shiftError } = await supabase
    .from("shifts")
    .update(updatePayload)
    .eq("id", shiftId)
    .select()
    .single();

  if (shiftError) throw shiftError;

  // 2. Compute updated earnings
  let earnings = Number(updatedShift.gross_earnings);
  if (!earnings || isNaN(earnings)) {
    const math = calculateShiftGross(
      updatedShift.start_time,
      updatedShift.end_time,
      updatedShift.break_duration_minutes || 0,
      updatedShift.hourly_rate || 0
    );
    earnings = math.grossEarnings;
  }

  // 3. Update the linked transaction
  const txId = transactionId || updatedShift.linked_transaction_id;
  let updatedTx: Transaction | undefined;

  const txUpdatePayload: any = {
    amount: parseFloat(Number(earnings).toFixed(2)),
  };
  if (shiftData.date !== undefined) {
    txUpdatePayload.transaction_date = shiftData.date;
  }
  if (shiftData.notes !== undefined) {
    txUpdatePayload.description = shiftData.notes?.trim() || `Shift on ${shiftData.date || updatedShift.date}`;
  }

  if (txId) {
    const { data: txData } = await supabase
      .from("transactions")
      .update(txUpdatePayload)
      .eq("id", txId)
      .select("*, categories(*)")
      .maybeSingle();

    if (txData) {
      updatedTx = {
        ...txData,
        category_ref: txData.categories || undefined,
        shift_ref: updatedShift as Shift,
      };
    }
  } else {
    // Attempt fallback by shift_id
    const { data: txData } = await supabase
      .from("transactions")
      .update(txUpdatePayload)
      .eq("shift_id", shiftId)
      .select("*, categories(*)")
      .maybeSingle();

    if (txData) {
      updatedTx = {
        ...txData,
        category_ref: txData.categories || undefined,
        shift_ref: updatedShift as Shift,
      };
    }
  }

  return { shift: updatedShift as Shift, transaction: updatedTx };
}

export async function deleteIncomeTransaction(
  transactionId: string,
  shiftId?: string
): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  await ensureAuth(supabase);

  // 1. Delete linked shift if present
  if (shiftId) {
    await supabase.from("shifts").delete().eq("id", shiftId);
  }

  // Also check if any shift has this transaction as linked_transaction_id
  await supabase.from("shifts").delete().eq("linked_transaction_id", transactionId);

  // 2. Delete transaction
  const { error } = await supabase.from("transactions").delete().eq("id", transactionId);
  if (error) throw error;
}

// Backwards compatibility helpers
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
