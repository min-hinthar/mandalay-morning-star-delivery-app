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
 * Centralized role-to-dashboard mapping.
 * Single source of truth for determining where a user should land.
 *
 * Used by: auth callback, auth confirm, admin layout guard, driver layout guard.
 *
 * @param supabase - Supabase client (service client recommended for bypassing RLS)
 * @param userId - The authenticated user's ID
 */
export async function getRoleDashboard(
  supabase: SupabaseClient,
  userId: string
): Promise<RoleRedirectResult> {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single<ProfileRow>();

    // Self-healing: auto-create profile with role='customer' if missing
    if (!profile) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await supabase.from("profiles").insert({
        id: userId,
        email: user?.email ?? null,
        role: "customer",
      });
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
  } catch {
    logger.error("DB error in getRoleDashboard, falling back to /", { api: "role-redirect" });
    return { path: "/", role: "unknown" };
  }
}
