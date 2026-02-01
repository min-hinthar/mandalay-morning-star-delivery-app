import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import type { ProfileRole } from "@/types/database";

interface ProfileCheck {
  role: ProfileRole;
}

// Default settings to restore
const DEFAULT_SETTINGS = [
  // Delivery settings
  { key: "delivery_radius_miles", value: 40, category: "delivery" },
  { key: "minimum_order_cents", value: 2500, category: "delivery" },
  { key: "free_delivery_threshold_cents", value: 5000, category: "delivery" },
  { key: "base_delivery_fee_cents", value: 599, category: "delivery" },
  { key: "delivery_cutoff_time", value: "18:00", category: "delivery" },
  { key: "delivery_time_windows", value: [], category: "delivery" },
  // Operations settings
  { key: "max_stops_per_route", value: 15, category: "operations" },
  { key: "auto_assign_enabled", value: false, category: "operations" },
  { key: "route_optimization_enabled", value: true, category: "operations" },
  { key: "default_vehicle_type", value: "car", category: "operations" },
  // Notification settings
  { key: "email_notifications_enabled", value: true, category: "notifications" },
  { key: "sms_notifications_enabled", value: false, category: "notifications" },
  { key: "push_notifications_enabled", value: false, category: "notifications" },
  { key: "notify_on_order_placed", value: true, category: "notifications" },
  { key: "notify_on_order_status_change", value: true, category: "notifications" },
] as const;

/**
 * POST /api/admin/settings/restore
 * Restore all settings to default values
 */
export async function POST() {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .returns<ProfileCheck[]>()
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete all existing settings and re-insert defaults
    // This requires using service role or bypassing RLS temporarily
    // Since we're admin-only, we'll use upsert to restore values

    for (const setting of DEFAULT_SETTINGS) {
      const { error: upsertError } = await supabase
        .from("app_settings")
        .upsert(
          {
            key: setting.key,
            value: JSON.parse(JSON.stringify(setting.value)),
            category: setting.category,
            updated_by: user.id,
          },
          { onConflict: "key" }
        );

      if (upsertError) {
        logger.exception(upsertError, {
          api: "admin/settings/restore",
          flowId: "restore-setting",
          key: setting.key,
        });
        return NextResponse.json(
          { error: `Failed to restore setting: ${setting.key}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      message: "Settings restored to defaults",
      restoredCount: DEFAULT_SETTINGS.length,
    });
  } catch (error) {
    logger.exception(error, { api: "admin/settings/restore" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
