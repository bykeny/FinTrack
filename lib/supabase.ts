import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

// ─── Environment Variables ───
function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
  return url;
}

function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return key;
}

// ─── Browser Client (for Client Components) ───
// Safe to call multiple times — `createBrowserClient` deduplicates internally.
export function createSupabaseBrowserClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
}

// ─── Generic Client (for Server Components / API Routes / Scripts) ───
// Use this when you need a simple Supabase client without cookie handling.
export function createSupabaseClient() {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey());
}
