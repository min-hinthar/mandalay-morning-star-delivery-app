import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

interface DriverQueryResult {
  id: string;
}

export type DriverAuthSuccess = {
  success: true;
  supabase: SupabaseClient<Database>;
  userId: string;
  driverId: string;
};

export type DriverAuthFailure = {
  success: false;
  error: string;
  status: 401 | 403;
};

export type DriverAuthResult = DriverAuthSuccess | DriverAuthFailure;

/**
 * Check if the current user is authenticated and is an active driver
 * Use in API routes to protect driver-only endpoints
 *
 * @example
 * export async function GET() {
 *   const auth = await requireDriver();
 *   if (!auth.success) {
 *     return NextResponse.json({ error: auth.error }, { status: auth.status });
 *   }
 *   const { supabase, userId, driverId } = auth;
 *   // ... rest of handler
 * }
 */
export async function requireDriver(): Promise<DriverAuthResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized", status: 401 };
  }

  // Check if user is an active driver
  const { data: driver, error: driverError } = await supabase
    .from("drivers")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .returns<DriverQueryResult[]>()
    .single();

  if (driverError || !driver) {
    return { success: false, error: "Not a driver", status: 403 };
  }

  return { success: true, supabase, userId: user.id, driverId: driver.id };
}
