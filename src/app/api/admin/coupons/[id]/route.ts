import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

import { updateCouponSchema } from "../schemas";

// ============================================
// PATCH — Admin: revoke a coupon (idempotent)
// ============================================

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const rl = await checkRateLimit({
      limiter: adminLimiter,
      identifier: auth.userId,
      role: "admin",
      route: "admin/coupons/update",
    });
    if (rl.limited) return rl.response;

    const { id } = await params;
    const parsed = updateCouponSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success || !/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Revoking an already-redeemed coupon is harmless (the order keeps its
    // discount); it only stops a released coupon from being claimed again.
    const service = createServiceClient();
    const { data, error } = await service
      .from("coupons")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id)
      .is("revoked_at", null)
      .select("id");
    if (error) {
      logger.exception(error, { api: "admin/coupons/update", couponId: id });
      return NextResponse.json({ error: "Failed to revoke coupon" }, { status: 500 });
    }
    if (!data || data.length === 0) {
      const { data: existing } = await service
        .from("coupons")
        .select("id")
        .eq("id", id)
        .maybeSingle();
      if (!existing) return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.exception(err, { api: "admin/coupons/update" });
    return NextResponse.json({ error: "Failed to revoke coupon" }, { status: 500 });
  }
}
