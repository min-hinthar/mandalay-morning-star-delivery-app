import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateCustomerSettingsSchema } from "@/lib/validations/customer-settings";
import { checkRateLimit, customerLimiter } from "@/lib/rate-limit";
import { logger } from "@/lib/utils/logger";
import type { CustomerSettingsRow, Json } from "@/types/database";
import type { NotificationPrefs } from "@/components/ui/account/SettingsTab/settings-types";

function transformRow(row: CustomerSettingsRow) {
  return {
    dietaryRestrictions: (row.dietary_restrictions as unknown as string[]) ?? [],
    deliveryInstructions: row.delivery_instructions ?? "",
    notificationPrefs: (row.notification_prefs as unknown as NotificationPrefs) ?? {
      order_updates: true,
      marketing: true,
      reminders: true,
    },
    theme: row.theme ?? "system",
  };
}

// GET /api/account/settings - Get current user's customer settings
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const rl = await checkRateLimit({
      limiter: customerLimiter,
      identifier: user.id,
      role: "customer",
      route: "account/settings",
    });
    if (rl.limited) return rl.response;

    // Lazy row creation — DB ON CONFLICT DO NOTHING handles existing rows
    await supabase.from("customer_settings").insert({ user_id: user.id }).select().maybeSingle();

    const { data, error } = await supabase
      .from("customer_settings")
      .select(
        "user_id, dietary_restrictions, delivery_instructions, notification_prefs, theme, updated_at"
      )
      .eq("user_id", user.id)
      .returns<CustomerSettingsRow>()
      .single();

    if (error || !data) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Settings not found",
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: transformRow(data) });
  } catch (error) {
    logger.exception(error, { api: "account/settings" });
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch settings",
        },
      },
      { status: 500 }
    );
  }
}

// PATCH /api/account/settings - Update current user's customer settings
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const rlPatch = await checkRateLimit({
      limiter: customerLimiter,
      identifier: user.id,
      role: "customer",
      route: "account/settings",
    });
    if (rlPatch.limited) return rlPatch.response;

    const body = await request.json();
    const result = updateCustomerSettingsSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", details: result.error.issues } },
        { status: 400 }
      );
    }

    // Build snake_case update object from validated fields
    const updates: Record<string, string | Json> = {};
    if (result.data.dietary_restrictions !== undefined) {
      updates.dietary_restrictions = result.data.dietary_restrictions as unknown as Json;
    }
    if (result.data.delivery_instructions !== undefined) {
      updates.delivery_instructions = result.data.delivery_instructions;
    }
    if (result.data.notification_prefs !== undefined) {
      updates.notification_prefs = result.data.notification_prefs as unknown as Json;
    }
    if (result.data.theme !== undefined) {
      updates.theme = result.data.theme;
    }

    // Upsert with user_id conflict
    const { error: upsertError } = await supabase.from("customer_settings").upsert(
      {
        user_id: user.id,
        ...updates,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (upsertError) throw upsertError;

    // Fetch fresh row after upsert
    const { data, error: fetchError } = await supabase
      .from("customer_settings")
      .select(
        "user_id, dietary_restrictions, delivery_instructions, notification_prefs, theme, updated_at"
      )
      .eq("user_id", user.id)
      .returns<CustomerSettingsRow>()
      .single();

    if (fetchError || !data) throw fetchError;

    return NextResponse.json({ data: transformRow(data) });
  } catch (error) {
    logger.exception(error, { api: "account/settings" });
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to update settings",
        },
      },
      { status: 500 }
    );
  }
}
