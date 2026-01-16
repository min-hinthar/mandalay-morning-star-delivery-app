import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ProfileRole } from "@/types/database";

interface ProfileRow {
  role: ProfileRole;
}

export type AdminAuthSuccess = {
  success: true;
  supabase: SupabaseClient<Database>;
  userId: string;
};

export type AdminAuthFailure = {
  success: false;
  error: string;
  status: 401 | 403;
};

export type AdminAuthResult = AdminAuthSuccess | AdminAuthFailure;

/**
 * Check if the current user is authenticated and has admin role
 * Use in API routes to protect admin-only endpoints
 *
 * @example
 * export async function GET() {
 *   const auth = await requireAdmin();
 *   if (!auth.success) {
 *     return NextResponse.json({ error: auth.error }, { status: auth.status });
 *   }
 *   const { supabase, userId } = auth;
 *   // ... rest of handler
 * }
 */
export async function requireAdmin(): Promise<AdminAuthResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized", status: 401 };
  }

  // Check JWT claims first for performance (if role is cached)
  const jwtRole = user.app_metadata?.role;
  if (jwtRole === "admin") {
    return { success: true, supabase, userId: user.id };
  }

  // Fallback to database query
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .returns<ProfileRow[]>()
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    return { success: false, error: "Forbidden", status: 403 };
  }

  return { success: true, supabase, userId: user.id };
}
