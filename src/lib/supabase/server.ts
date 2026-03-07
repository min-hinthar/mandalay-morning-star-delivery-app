import { createServerClient } from "@supabase/ssr";
import { createClient as createPublicSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured. Add it to your .env.local file.");
  }
  if (!supabaseAnonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured. Add it to your .env.local file."
    );
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Component - ignore
        }
      },
    },
    global: {
      fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(5000) }),
    },
  });
}

export function createPublicClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured. Add it to your .env.local file.");
  }
  if (!supabaseAnonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured. Add it to your .env.local file."
    );
  }

  return createPublicSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(5000) }),
    },
  });
}

/**
 * Service role client for server-side operations that need to bypass RLS.
 * Use only in trusted server contexts (webhooks, cron jobs, admin APIs).
 *
 * Auth is configured for server-side use: no session persistence, no token
 * refresh, no URL detection. This prevents the service client from
 * interfering with browser-only auth mechanisms in a Node environment.
 */
export function createServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured. Add it to your .env.local file.");
  }

  return createPublicSupabaseClient<Database>(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(8000) }),
    },
  });
}
