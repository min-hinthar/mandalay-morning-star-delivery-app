import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/utils/logger";

/**
 * GET /api/admin/profile/stats
 * Returns admin activity stats: last login and orders processed
 */
export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json(
        { error: { code: auth.status === 401 ? "UNAUTHORIZED" : "FORBIDDEN", message: auth.error } },
        { status: auth.status }
      );
    }
    const { supabase, userId } = auth;

    // Get auth user for last_sign_in_at
    const { data: { user } } = await supabase.auth.getUser();
    const lastLoginAt = user?.last_sign_in_at ?? null;

    // Count orders processed by this admin via audit log
    // actor_id column exists — filter by this admin's user ID and admin role
    const { count, error: countError } = await supabase
      .from("order_audit_log")
      .select("order_id", { count: "exact", head: true })
      .eq("actor_id", userId)
      .eq("actor_role", "admin");

    if (countError) {
      logger.exception(countError, {
        api: "admin/profile/stats",
        flowId: "orders-processed",
      });
    }

    return NextResponse.json({
      data: {
        lastLoginAt,
        ordersProcessed: count ?? 0,
      },
    });
  } catch (error) {
    logger.exception(error, { api: "admin/profile/stats" });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch stats" } },
      { status: 500 }
    );
  }
}
