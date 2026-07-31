import { createSupabaseBrowserClient } from "./supabase";
import { Transaction, Category } from "./types";

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

export async function fetchCategories(type?: 'income' | 'expense'): Promise<Category[]> {
  const supabase = createSupabaseBrowserClient();
  await ensureAuth(supabase);
  let query = supabase.from("categories").select("*").order("name");
  
  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Category[];
}

export async function fetchExpenses(
  from?: string, 
  to?: string, 
  categoryId?: string, 
  searchQuery?: string
): Promise<Transaction[]> {
  const supabase = createSupabaseBrowserClient();
  await ensureAuth(supabase);
  
  let query = supabase
    .from("transactions")
    .select("*, categories(*)")
    .eq("type", "expense")
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (from) query = query.gte("transaction_date", from);
  if (to) query = query.lte("transaction_date", to);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (searchQuery) query = query.ilike("description", `%${searchQuery}%`);

  const { data, error } = await query;
  
  if (error) throw error;

  return (data || []).map((row: any) => ({
    ...row,
    category_ref: row.categories ? row.categories : undefined,
  })) as Transaction[];
}

export async function createExpense(
  expenseData: Omit<Transaction, "id" | "created_at" | "category_ref" | "type">
): Promise<Transaction> {
  const supabase = createSupabaseBrowserClient();
  const user = await ensureAuth(supabase);
  
  const payload = {
    amount: expenseData.amount,
    category_id: expenseData.category_id,
    description: expenseData.description || null,
    transaction_date: expenseData.transaction_date,
    type: 'expense',
    ...(user ? { user_id: user.id } : {}),
  };

  const { data, error } = await supabase
    .from("transactions")
    .insert(payload)
    .select("*, categories(*)")
    .single();

  if (error) throw error;
  
  return {
    ...data,
    category_ref: data.categories
  } as Transaction;
}

export async function updateExpense(
  id: string,
  expenseData: Partial<Omit<Transaction, "id" | "created_at" | "category_ref" | "type">>
): Promise<Transaction> {
  const supabase = createSupabaseBrowserClient();
  await ensureAuth(supabase);
  
  const { data, error } = await supabase
    .from("transactions")
    .update(expenseData)
    .eq("id", id)
    .select("*, categories(*)")
    .single();

  if (error) throw error;
  
  return {
    ...data,
    category_ref: data.categories
  } as Transaction;
}

export async function deleteExpense(id: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  await ensureAuth(supabase);
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw error;
}
