import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";
import { logger } from "@/lib/utils/logger";
import { apiError } from "@/lib/utils/api-error";
import type { Json, OrderStatus } from "@/types/database";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";

// Statuses where driver can be assigned
const ASSIGNABLE_STATUSES: OrderStatus[] = ["confirmed", "preparing", "out_for_delivery"];

const assignDriverSchema = z.object({
  driverId: z.string().uuid().nullable(), // null to unassign
});

interface OrderRow {
  id: string;
  status: OrderStatus;
  assigned_driver_id: string | null;
  user_id: string;
}

interface DriverRow {
  id: string;
  is_active: boolean;
  profiles: {
    full_name: string | null;
    email: string;
  } | null;
}

interface DriverProfileRow {
  profiles: {
    full_name: string | null;
    email: string;
  } | null;
}

/**
 * PATCH /api/admin/orders/[id]/driver
 *
 * Assign or unassign a driver to an order.
 * Validates driver exists and is active.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await params;

  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return apiError(auth.status === 403 ? "FORBIDDEN" : "UNAUTHORIZED", auth.error, auth.status);
    }

    const rl = await checkRateLimit({
      limiter: adminLimiter,
      identifier: auth.userId,
      role: "admin",
      route: "admin/orders/:id/driver",
    });
    if (rl.limited) return rl.response;
    const { supabase, userId } = auth;

    // Parse and validate request body
    const body = await request.json();
    const parsed = assignDriverSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid request", 400, parsed.error.flatten());
    }

    const { driverId } = parsed.data;

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status, assigned_driver_id, user_id")
      .eq("id", orderId)
      .returns<OrderRow[]>()
      .single();

    if (orderError || !order) {
      return apiError("NOT_FOUND", "Order not found", 404);
    }

    // Check if order is in a status where driver can be assigned
    if (!ASSIGNABLE_STATUSES.includes(order.status) && driverId !== null) {
      return apiError(
        "CONFLICT",
        `Cannot assign driver to order with status "${order.status}"`,
        409,
        { allowedStatuses: ASSIGNABLE_STATUSES }
      );
    }

    // If assigning a driver, validate driver exists and is active
    let driverName: string | null = null;
    if (driverId !== null) {
      const { data: driver, error: driverError } = await supabase
        .from("drivers")
        .select(
          `
          id,
          is_active,
          profiles (
            full_name,
            email
          )
        `
        )
        .eq("id", driverId)
        .returns<DriverRow[]>()
        .single();

      if (driverError || !driver) {
        return apiError("NOT_FOUND", "Driver not found", 404);
      }

      if (!driver.is_active) {
        return apiError("BAD_REQUEST", "Cannot assign inactive driver", 400);
      }

      driverName = driver.profiles?.full_name ?? driver.profiles?.email ?? null;
    }

    // Get previous driver name for audit
    let previousDriverName: string | null = null;
    if (order.assigned_driver_id) {
      const { data: prevDriver } = await supabase
        .from("drivers")
        .select(
          `
          profiles (
            full_name,
            email
          )
        `
        )
        .eq("id", order.assigned_driver_id)
        .returns<DriverProfileRow[]>()
        .single();

      if (prevDriver?.profiles) {
        previousDriverName = prevDriver.profiles.full_name ?? prevDriver.profiles.email ?? null;
      }
    }

    // Update order
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        assigned_driver_id: driverId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      logger.exception(updateError, { api: "admin/orders/[id]/driver" });
      return apiError("INTERNAL_ERROR", "Failed to update order", 500);
    }

    // Create audit log entry
    const action = driverId === null ? "unassign_driver" : "assign_driver";
    const { error: auditError } = await supabase.from("order_audit_log").insert({
      order_id: orderId,
      action,
      actor_id: userId,
      actor_role: "admin",
      old_value: {
        driver_id: order.assigned_driver_id,
        driver_name: previousDriverName,
      } as Json,
      new_value: {
        driver_id: driverId,
        driver_name: driverName,
      } as Json,
      reason: driverId
        ? `Assigned driver: ${driverName}`
        : `Unassigned driver: ${previousDriverName}`,
    });

    if (auditError) {
      // Log but don't fail
      logger.exception(auditError, {
        api: "admin/orders/[id]/driver",
        message: "Failed to create audit log",
      });
    }

    // Notification would be triggered here
    logger.info("Order driver assignment updated", {
      orderId,
      previousDriverId: order.assigned_driver_id,
      newDriverId: driverId,
      customerId: order.user_id,
    });

    return NextResponse.json({
      success: true,
      orderId,
      previousDriverId: order.assigned_driver_id,
      previousDriverName,
      driverId,
      driverName,
    });
  } catch (error) {
    logger.exception(error, { api: "admin/orders/[id]/driver" });
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}
