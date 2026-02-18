import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";
import { logger } from "@/lib/utils/logger";
import type { Json } from "@/types/database";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";

const prioritySchema = z.object({
  isPriority: z.boolean(),
});

/**
 * PATCH /api/admin/orders/[id]/priority
 *
 * Toggle the is_priority flag on an order.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await params;

  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const rl = await checkRateLimit({ limiter: adminLimiter, identifier: auth.userId, role: "admin", route: "admin/orders/:id/priority" });
    if (rl.limited) return rl.response;
    const { supabase, userId } = auth;

    // Parse and validate request body
    const body = await request.json();
    const parsed = prioritySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { isPriority } = parsed.data;

    // Verify order exists
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update is_priority
    const { error: updateError } = await supabase
      .from("orders")
      .update({ is_priority: isPriority })
      .eq("id", orderId);

    if (updateError) {
      logger.exception(updateError, { api: "admin/orders/[id]/priority" });
      return NextResponse.json({ error: "Failed to update priority" }, { status: 500 });
    }

    // Log to audit
    const { error: auditError } = await supabase.from("order_audit_log").insert({
      order_id: orderId,
      action: "priority_change",
      actor_id: userId,
      actor_role: "admin",
      old_value: null,
      new_value: { is_priority: isPriority } as Json,
      reason: null,
    });

    if (auditError) {
      // Non-fatal: log but don't fail
      logger.exception(auditError, {
        api: "admin/orders/[id]/priority",
        message: "Failed to create audit log",
      });
    }

    return NextResponse.json({
      success: true,
      orderId,
      isPriority,
    });
  } catch (error) {
    logger.exception(error, { api: "admin/orders/[id]/priority" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
