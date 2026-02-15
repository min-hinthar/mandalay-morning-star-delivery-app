import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface OrderCheck {
  id: string;
  user_id: string;
  status: string;
}

const MAX_NOTES_LENGTH = 500;

// Statuses that prevent editing notes
const LOCKED_STATUSES = ["delivered", "cancelled"];

/**
 * PATCH /api/orders/[id]/notes
 * Update delivery instructions for an order.
 * Only order owner (or admin) can update, and only before delivery/cancellation.
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: orderId } = await params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(orderId)) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Invalid order ID format" } },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "You must be logged in" } },
        { status: 401 }
      );
    }

    // Parse and validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Invalid JSON body" } },
        { status: 400 }
      );
    }

    const { notes } = body as { notes?: unknown };
    if (typeof notes !== "string") {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "notes must be a string" } },
        { status: 400 }
      );
    }

    if (notes.length > MAX_NOTES_LENGTH) {
      return NextResponse.json(
        {
          error: {
            code: "BAD_REQUEST",
            message: `notes must be at most ${MAX_NOTES_LENGTH} characters`,
          },
        },
        { status: 400 }
      );
    }

    // Fetch order
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, user_id, status")
      .eq("id", orderId)
      .returns<OrderCheck[]>()
      .single();

    if (fetchError || !order) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Order not found" } },
        { status: 404 }
      );
    }

    // Check ownership (allow admin override via JWT role)
    const isAdmin = user.app_metadata?.role === "admin";
    if (order.user_id !== user.id && !isAdmin) {
      return NextResponse.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "This order does not belong to you",
          },
        },
        { status: 403 }
      );
    }

    // Check order status
    if (LOCKED_STATUSES.includes(order.status)) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_STATUS",
            message:
              "Delivery instructions cannot be changed after delivery or cancellation",
          },
        },
        { status: 400 }
      );
    }

    // Update special_instructions in orders table
    const trimmed = notes.trim();
    const { error: updateError } = await supabase
      .from("orders")
      .update({ special_instructions: trimmed || null })
      .eq("id", orderId);

    if (updateError) {
      logger.exception(updateError, {
        api: "orders/[id]/notes",
        orderId,
        userId: user.id,
        flowId: "update-notes",
      });
      return NextResponse.json(
        {
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to update delivery instructions",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      notes: trimmed || null,
    });
  } catch (error) {
    logger.exception(error, { api: "orders/[id]/notes" });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
