import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

// ─── Environment Variables ───
function getSupabaseUrl(): string {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!rawUrl || rawUrl.includes("your-supabase-url") || rawUrl.trim() === "") {
    throw new Error("Missing or invalid env: NEXT_PUBLIC_SUPABASE_URL. Please update .env.local with a valid Supabase project URL.");
  }
  // Sanitize URL by trimming trailing slashes and whitespace
  return rawUrl.replace(/\/+$|\s+/g, "");
}

function getSupabaseAnonKey(): string {
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!rawKey || rawKey.includes("your-supabase-anon-key") || rawKey.trim() === "") {
    throw new Error("Missing or invalid env: NEXT_PUBLIC_SUPABASE_ANON_KEY. Please update .env.local with a valid Supabase anon key.");
  }
  return rawKey.trim();
}

// ─── Browser Client (for Client Components) ───
export function createSupabaseBrowserClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
}

// ─── Generic Client (for Server Components / API Routes / Scripts) ───
export function createSupabaseClient() {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey());
}
