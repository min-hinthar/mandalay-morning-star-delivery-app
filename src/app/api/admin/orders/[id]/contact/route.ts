import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";
import { logger } from "@/lib/utils/logger";

/**
 * POST /api/admin/orders/[id]/contact
 *
 * Mark a flagged order as contacted. Clears needs_contact flag,
 * sets contacted_at/contacted_by, and logs an audit entry.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await params;

  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const rl = await checkRateLimit({
      limiter: adminLimiter,
      identifier: auth.userId,
      role: "admin",
      route: "admin/orders/:id/contact",
    });
    if (rl.limited) return rl.response;
    const { supabase } = auth;

    // Verify order exists and needs contact
    // needs_contact added in migration 030 — not in generated types
    const { data: order, error: orderError } = (await supabase
      .from("orders")
      .select("id, needs_contact")
      .eq("id", orderId)
      .single()) as unknown as {
      data: { id: string; needs_contact: boolean } | null;
      error: { message: string } | null;
    };

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.needs_contact) {
      return NextResponse.json({ error: "Order is not flagged for contact" }, { status: 400 });
    }

    // Clear the flag and record resolution
    // needs_contact/contacted_at/contacted_by added in migration 030 — not in generated types
    const contactedAt = new Date().toISOString();

    const { error: updateError } = await (supabase
      .from("orders")
      .update({
        needs_contact: false,
        contacted_at: contactedAt,
        contacted_by: auth.userId,
      } as Record<string, unknown>)
      .eq("id", orderId) as unknown as Promise<{ error: { message: string } | null }>);

    if (updateError) {
      logger.exception(updateError, { api: "admin/orders/[id]/contact" });
      return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
    }

    // Log audit entry
    await supabase.from("audit_logs").insert({
      order_id: orderId,
      actor_id: auth.userId,
      actor_role: "admin",
      action: "marked_contacted",
      reason: "Manual customer contact after email delivery failure",
    });

    logger.info("Order marked as contacted", {
      api: "admin/orders/[id]/contact",
      orderId,
      contactedBy: auth.userId,
    });

    return NextResponse.json({
      success: true,
      contactedAt,
    });
  } catch (error) {
    logger.exception(error, { api: "admin/orders/[id]/contact" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
