import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";
import { apiError } from "@/lib/utils/api-error";
import type { DeliveryDayConfig } from "@/types/delivery";

// ============================================
// VALIDATION
// ============================================

const daySchema = z.object({
  id: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6),
  isActive: z.boolean(),
  cutoffDay: z.number().int().min(0).max(6),
  cutoffHour: z.number().int().min(0).max(23),
  deliveryFeeCents: z.number().int().min(0),
  displayOrder: z.number().int().min(0),
});

const updateSchema = z.object({
  days: z.array(daySchema).min(1).max(7),
});

// ============================================
// HELPERS
// ============================================

function rowToConfig(row: Record<string, unknown>): DeliveryDayConfig {
  return {
    id: row.id as string,
    dayOfWeek: row.day_of_week as number,
    isActive: row.is_active as boolean,
    cutoffDay: row.cutoff_day as number,
    cutoffHour: row.cutoff_hour as number,
    deliveryFeeCents: row.delivery_fee_cents as number,
    displayOrder: row.display_order as number,
  };
}

// ============================================
// GET /api/admin/delivery-days
// ============================================

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.success) {
    return apiError("UNAUTHORIZED", auth.error, auth.status);
  }

  const rl = await checkRateLimit({
    limiter: adminLimiter,
    identifier: auth.userId,
    role: "admin",
    route: "admin/delivery-days",
  });
  if (rl.limited) return rl.response;

  const { data, error } = await auth.supabase
    .from("delivery_days")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) {
    return apiError("INTERNAL_ERROR", `Failed to fetch delivery days: ${error.message}`, 500);
  }

  const days: DeliveryDayConfig[] = (data || []).map(rowToConfig);

  return NextResponse.json({ data: { days } });
}

// ============================================
// PATCH /api/admin/delivery-days
// ============================================

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return apiError("UNAUTHORIZED", auth.error, auth.status);
  }

  const rl = await checkRateLimit({
    limiter: adminLimiter,
    identifier: auth.userId,
    role: "admin",
    route: "admin/delivery-days",
  });
  if (rl.limited) return rl.response;

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues.map((e) => e.message).join(", "), 400);
  }

  const { days } = parsed.data;

  for (const day of days) {
    const { error } = await auth.supabase
      .from("delivery_days")
      .update({
        is_active: day.isActive,
        cutoff_day: day.cutoffDay,
        cutoff_hour: day.cutoffHour,
        delivery_fee_cents: day.deliveryFeeCents,
        display_order: day.displayOrder,
      })
      .eq("id", day.id);

    if (error) {
      return apiError("INTERNAL_ERROR", `Failed to update day ${day.id}: ${error.message}`, 500);
    }
  }

  revalidateTag("business-rules", { expire: 0 });

  return NextResponse.json({ data: { updated: days.length } });
}
