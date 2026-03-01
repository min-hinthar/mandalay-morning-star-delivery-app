import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  updateSettingsSchema,
  type SettingRow,
  type SettingsResponse,
} from "@/lib/validations/settings";
import { logger } from "@/lib/utils/logger";
import type { ProfileRole } from "@/types/database";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";

interface ProfileCheck {
  role: ProfileRole;
}

/**
 * GET /api/admin/settings
 * Get all settings grouped by category
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

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

    const rl = await checkRateLimit({
      limiter: adminLimiter,
      identifier: user.id,
      role: "admin",
      route: "admin/settings",
    });
    if (rl.limited) return rl.response;

    // Fetch all settings
    const { data: settings, error: settingsError } = await supabase
      .from("app_settings")
      .select("*")
      .returns<SettingRow[]>();

    if (settingsError) {
      logger.exception(settingsError, { api: "admin/settings", flowId: "get-settings" });
      return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }

    // Group settings by category
    const response: SettingsResponse = {
      delivery: {},
      operations: {},
      notifications: {},
    };

    // Track latest delivery update for attribution
    let latestDeliveryUpdate: string | null = null;
    let latestDeliveryUpdatedBy: string | null = null;

    for (const setting of settings || []) {
      const category = setting.category as keyof SettingsResponse;
      if (category in response) {
        // Convert snake_case key to camelCase for API response
        const camelKey = setting.key.replace(/_([a-z])/g, (_, letter: string) =>
          letter.toUpperCase()
        );
        // Type assertion needed: setting.value is unknown from JSONB, but matches category schemas
        const categorySettings = response[category];
        categorySettings[camelKey] = setting.value;

        // Track most recent delivery update
        if (
          category === "delivery" &&
          setting.updated_at &&
          (!latestDeliveryUpdate || setting.updated_at > latestDeliveryUpdate)
        ) {
          latestDeliveryUpdate = setting.updated_at;
          latestDeliveryUpdatedBy = setting.updated_by;
        }
      }
    }

    // Resolve updated_by user name for attribution
    let deliveryUpdatedByName: string | null = null;
    if (latestDeliveryUpdatedBy) {
      const { data: updater } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", latestDeliveryUpdatedBy)
        .single();
      deliveryUpdatedByName = updater?.full_name || "Unknown admin";
    }

    return NextResponse.json({
      ...response,
      _meta: {
        deliveryUpdatedAt: latestDeliveryUpdate,
        deliveryUpdatedBy: deliveryUpdatedByName,
      },
    });
  } catch (error) {
    logger.exception(error, { api: "admin/settings" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/settings
 * Update settings by category
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

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

    const rl = await checkRateLimit({
      limiter: adminLimiter,
      identifier: user.id,
      role: "admin",
      route: "admin/settings",
    });
    if (rl.limited) return rl.response;

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateSettingsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { category, settings } = validationResult.data;

    // Update each setting using upsert pattern
    const updates: { key: string; value: unknown; category: string; updated_by: string }[] = [];

    for (const [key, value] of Object.entries(settings)) {
      // Convert camelCase to snake_case for database
      const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      updates.push({
        key: snakeKey,
        value: JSON.parse(JSON.stringify(value)), // Ensure JSONB-compatible
        category,
        updated_by: user.id,
      });
    }

    // Perform upserts
    for (const update of updates) {
      const { error: updateError } = await supabase.from("app_settings").upsert(
        {
          key: update.key,
          value: update.value,
          category: update.category,
          updated_by: update.updated_by,
        },
        { onConflict: "key" }
      );

      if (updateError) {
        logger.exception(updateError, {
          api: "admin/settings",
          flowId: "update-setting",
          key: update.key,
        });
        return NextResponse.json(
          { error: `Failed to update setting: ${update.key}` },
          { status: 500 }
        );
      }
    }

    // Bust server-side cache for delivery business rules
    if (category === "delivery") {
      revalidateTag("business-rules", { expire: 0 });
    }

    // Resolve updater name for attribution
    const { data: updaterProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      message: "Settings updated successfully",
      category,
      updatedKeys: updates.map((u) => u.key),
      updatedAt: new Date().toISOString(),
      updatedBy: updaterProfile?.full_name || "Unknown admin",
    });
  } catch (error) {
    logger.exception(error, { api: "admin/settings" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
