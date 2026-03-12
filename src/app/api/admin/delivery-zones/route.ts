import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";
import { apiError } from "@/lib/utils/api-error";
import type { DeliveryZoneConfig } from "@/types/delivery";

// ============================================
// VALIDATION
// ============================================

const zoneSchema = z.object({
  id: z.string().uuid(),
  direction: z.enum(["east", "west", "south"]),
  bearingStart: z.number().min(0).max(360),
  bearingEnd: z.number().min(0).max(360),
  referenceCities: z.array(z.string()).default([]),
});

const updateSchema = z.object({
  zones: z.array(zoneSchema).min(1).max(10),
});

// ============================================
// HELPERS
// ============================================

function rowToConfig(row: Record<string, unknown>): DeliveryZoneConfig {
  return {
    id: row.id as string,
    direction: row.direction as DeliveryZoneConfig["direction"],
    bearingStart: row.bearing_start as number,
    bearingEnd: row.bearing_end as number,
    referenceCities: (row.reference_cities as string[]) ?? [],
  };
}

// ============================================
// GET /api/admin/delivery-zones
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
    route: "admin/delivery-zones",
  });
  if (rl.limited) return rl.response;

  const { data, error } = await auth.supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from("delivery_zones" as any)
    .select("*")
    .order("direction", { ascending: true });

  if (error) {
    return apiError("INTERNAL_ERROR", `Failed to fetch delivery zones: ${error.message}`, 500);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const zones: DeliveryZoneConfig[] = ((data as any[]) || []).map(rowToConfig);

  return NextResponse.json({ data: { zones } });
}

// ============================================
// PATCH /api/admin/delivery-zones
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
    route: "admin/delivery-zones",
  });
  if (rl.limited) return rl.response;

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues.map((e) => e.message).join(", "), 400);
  }

  const { zones } = parsed.data;

  for (const zone of zones) {
    const { error } = await auth.supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from("delivery_zones" as any)
      .update({
        bearing_start: zone.bearingStart,
        bearing_end: zone.bearingEnd,
        reference_cities: zone.referenceCities,
      })
      .eq("id", zone.id);

    if (error) {
      return apiError("INTERNAL_ERROR", `Failed to update zone ${zone.id}: ${error.message}`, 500);
    }
  }

  revalidateTag("business-rules", { expire: 0 });

  return NextResponse.json({ data: { updated: zones.length } });
}
