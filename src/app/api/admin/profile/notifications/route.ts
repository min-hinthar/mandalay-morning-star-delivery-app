import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/utils/logger";
import type { Json } from "@/types/database";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";

const adminNotificationPrefsSchema = z.object({
  orderConfirmation: z.boolean(),
  orderCancellation: z.boolean(),
  orderDelivered: z.boolean(),
  newOrderAlert: z.boolean(),
});

type AdminNotificationPrefs = z.infer<typeof adminNotificationPrefsSchema>;

const DEFAULT_PREFS: AdminNotificationPrefs = {
  orderConfirmation: true,
  orderCancellation: true,
  orderDelivered: true,
  newOrderAlert: true,
};

interface SettingsRow {
  notification_prefs: Json;
}

function parseNotificationPrefs(raw: Json): AdminNotificationPrefs {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const parsed = adminNotificationPrefsSchema.safeParse(raw);
    if (parsed.success) return parsed.data;
  }
  return DEFAULT_PREFS;
}

/**
 * GET /api/admin/profile/notifications
 * Returns admin notification preferences (with defaults if none saved)
 */
export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json(
        {
          error: { code: auth.status === 401 ? "UNAUTHORIZED" : "FORBIDDEN", message: auth.error },
        },
        { status: auth.status }
      );
    }
    const { supabase, userId } = auth;

    const rl = await checkRateLimit({
      limiter: adminLimiter,
      identifier: auth.userId,
      role: "admin",
      route: "admin/profile/notifications",
    });
    if (rl.limited) return rl.response;

    const { data: settings, error } = await supabase
      .from("customer_settings")
      .select("notification_prefs")
      .eq("user_id", userId)
      .returns<SettingsRow[]>()
      .maybeSingle();

    if (error) {
      logger.exception(error, {
        api: "admin/profile/notifications",
        flowId: "get-prefs",
      });
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Failed to fetch preferences" } },
        { status: 500 }
      );
    }

    const prefs = settings ? parseNotificationPrefs(settings.notification_prefs) : DEFAULT_PREFS;

    return NextResponse.json({ data: prefs });
  } catch (error) {
    logger.exception(error, { api: "admin/profile/notifications" });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch preferences" } },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/profile/notifications
 * Save admin notification preferences (upsert)
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json(
        {
          error: { code: auth.status === 401 ? "UNAUTHORIZED" : "FORBIDDEN", message: auth.error },
        },
        { status: auth.status }
      );
    }
    const { supabase, userId } = auth;

    const rl2 = await checkRateLimit({
      limiter: adminLimiter,
      identifier: auth.userId,
      role: "admin",
      route: "admin/profile/notifications",
    });
    if (rl2.limited) return rl2.response;

    const body = await request.json();
    const result = adminNotificationPrefsSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", details: result.error.issues } },
        { status: 400 }
      );
    }

    // Upsert into customer_settings with sensible defaults for required columns
    const { error: upsertError } = await supabase.from("customer_settings").upsert(
      {
        user_id: userId,
        notification_prefs: result.data as unknown as Json,
        dietary_restrictions: [],
        delivery_instructions: "",
        theme: "system",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (upsertError) {
      logger.exception(upsertError, {
        api: "admin/profile/notifications",
        flowId: "save-prefs",
      });
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Failed to save preferences" } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    logger.exception(error, { api: "admin/profile/notifications" });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to save preferences" } },
      { status: 500 }
    );
  }
}
