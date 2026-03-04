import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/utils/logger";

interface ProfileRow {
  role: string;
}

interface DriverRow {
  id: string;
  is_active: boolean;
}

export type RoleRedirectResult = {
  path: string;
  role: string;
  driverStatus?: "active" | "inactive" | "no_record";
};

/**
 * Ensure a profile row exists for the given user.
 * Uses upsert (ON CONFLICT DO NOTHING) so it's safe to call multiple times.
 * THROWS on failure so callers can handle the error (e.g., return 500 to client).
 *
 * @param supabase - Service client (bypasses RLS — profiles has no INSERT policy)
 * @param userId - The authenticated user's UUID
 * @param email - The user's email (pass from session data when available)
 */
export async function ensureProfile(
  supabase: SupabaseClient,
  userId: string,
  email?: string | null
): Promise<void> {
  // Resolve email: prefer caller-provided, fall back to admin lookup
  let resolvedEmail = email ?? null;
  if (!resolvedEmail) {
    try {
      const { data } = await supabase.auth.admin.getUserById(userId);
      resolvedEmail = data?.user?.email ?? null;
    } catch (adminErr) {
      logger.warn("ensureProfile: admin.getUserById failed, proceeding with null email", {
        api: "role-redirect",
        userId,
        error: adminErr instanceof Error ? adminErr.message : String(adminErr),
      });
    }
  }

  // Attempt 1: upsert with ignoreDuplicates
  const { error } = await supabase
    .from("profiles")
    .upsert(
      { id: userId, email: resolvedEmail, role: "customer" },
      { onConflict: "id", ignoreDuplicates: true }
    );

  if (error) {
    logger.error("ensureProfile upsert failed, trying plain insert", {
      api: "role-redirect",
      userId,
      error: error.message,
      code: error.code,
    });

    // Attempt 2: plain insert (in case upsert has PostgREST issues)
    const { error: insertErr } = await supabase
      .from("profiles")
      .insert({ id: userId, email: resolvedEmail, role: "customer" });

    // 23505 = unique_violation (profile already exists) — that's fine
    if (insertErr && insertErr.code !== "23505") {
      logger.error("ensureProfile insert also failed", {
        api: "role-redirect",
        userId,
        error: insertErr.message,
        code: insertErr.code,
      });
      throw new Error(`Failed to create profile: ${insertErr.message}`);
    }
  }

  // Verify the profile actually exists now
  const { data: check } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (!check) {
    logger.error("ensureProfile: profile still missing after upsert+insert", {
      api: "role-redirect",
      userId,
    });
    throw new Error("Profile creation could not be verified");
  }
}

/**
 * Centralized role-to-dashboard mapping.
 * Single source of truth for determining where a user should land.
 *
 * Used by: auth callback, auth confirm, admin layout guard, driver layout guard.
 *
 * @param supabase - Supabase client (service client recommended for bypassing RLS)
 * @param userId - The authenticated user's ID
 * @param email - Optional email to use when auto-creating a missing profile
 */
export async function getRoleDashboard(
  supabase: SupabaseClient,
  userId: string,
  email?: string | null
): Promise<RoleRedirectResult> {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single<ProfileRow>();

    // Self-healing: auto-create profile with role='customer' if missing
    if (!profile) {
      await ensureProfile(supabase, userId, email);
      return { path: "/menu", role: "customer" };
    }

    const role = profile.role;

    if (role === "admin") {
      return { path: "/admin", role: "admin" };
    }

    if (role === "driver") {
      const { data: driver } = await supabase
        .from("drivers")
        .select("id, is_active")
        .eq("user_id", userId)
        .single<DriverRow>();

      if (!driver) {
        return { path: "/driver/onboard", role: "driver", driverStatus: "no_record" };
      }
      if (!driver.is_active) {
        return { path: "/driver/deactivated", role: "driver", driverStatus: "inactive" };
      }
      return { path: "/driver", role: "driver", driverStatus: "active" };
    }

    // Default: customer or any other role
    return { path: "/menu", role: "customer" };
  } catch (err) {
    logger.error("DB error in getRoleDashboard, falling back to /", {
      api: "role-redirect",
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
    return { path: "/", role: "unknown" };
  }
}
