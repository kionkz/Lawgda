/**
 * Supabase client configuration.
 * Environment variables NEXT_PUBLIC_SUPABASE_URL and
 * NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.local.
 */
import { createClient } from "@supabase/supabase-js";

/**
 * Browser/client-side Supabase instance.
 * Uses anon key and is safe to expose to the client.
 */
export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase env vars not set. Add NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local."
    );
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Server-side Supabase client using the service role key.
 * Only use in API routes (never expose to client).
 */
export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
    );
  }
  return createClient(supabaseUrl, serviceRoleKey);
}
