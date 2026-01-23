import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import { submitRatingSchema } from "@/lib/validations/analytics";
import type { SubmitRatingResponse } from "@/types/analytics";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface OrderCheck {
  id: string;
  user_id: string;
  status: string;
}

interface RouteStopCheck {
  id: string;
  status: string;
  routes: {
    driver_id: string;
  };
}

interface ExistingRating {
  id: string;
}

interface NewRatingResult {
  id: string;
}

/**
 * POST /api/orders/[id]/rating
 * Submit a rating for a delivered order
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const resolvedParams = await params;
    const orderId = resolvedParams.id;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(orderId)) {
      return NextResponse.json(
        { error: "Invalid order ID format" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const validationResult = submitRatingSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid rating data",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { rating, feedbackText } = validationResult.data;

    // Verify order exists and belongs to user
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, user_id, status")
      .eq("id", orderId)
      .returns<OrderCheck[]>()
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Verify user owns the order
    if (order.user_id !== user.id) {
      return NextResponse.json(
        { error: "You can only rate your own orders" },
        { status: 403 }
      );
    }

    // Verify order is delivered
    if (order.status !== "delivered") {
      return NextResponse.json(
        { error: "Order must be delivered before rating" },
        { status: 400 }
      );
    }

    // Check if rating already exists
    const { data: existingRating } = await supabase
      .from("driver_ratings")
      .select("id")
      .eq("order_id", orderId)
      .returns<ExistingRating[]>()
      .single();

    if (existingRating) {
      return NextResponse.json(
        { error: "You have already rated this order" },
        { status: 409 }
      );
    }

    // Get the route stop to find the driver
    const { data: routeStop, error: routeStopError } = await supabase
      .from("route_stops")
      .select(
        `
        id,
        status,
        routes!inner (
          driver_id
        )
      `
      )
      .eq("order_id", orderId)
      .returns<RouteStopCheck[]>()
      .single();

    if (routeStopError || !routeStop || !routeStop.routes.driver_id) {
      return NextResponse.json(
        { error: "Unable to find delivery information for this order" },
        { status: 400 }
      );
    }

    // Insert the rating
    const { data: newRating, error: insertError } = await supabase
      .from("driver_ratings")
      .insert({
        driver_id: routeStop.routes.driver_id,
        order_id: orderId,
        route_stop_id: routeStop.id,
        rating,
        feedback_text: feedbackText || null,
      })
      .select("id")
      .returns<NewRatingResult[]>()
      .single();

    if (insertError) {
      logger.exception(insertError, { api: "orders/[id]/rating", flowId: "submit" });
      return NextResponse.json(
        { error: "Failed to submit rating" },
        { status: 500 }
      );
    }

    const response: SubmitRatingResponse = {
      id: newRating.id,
      message: "Thank you for your feedback!",
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    logger.exception(error, { api: "orders/[id]/rating" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/orders/[id]/rating
 * Get the rating for an order (if exists)
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const resolvedParams = await params;
    const orderId = resolvedParams.id;

    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify order exists and belongs to user
    const { data: order } = await supabase
      .from("orders")
      .select("id, user_id")
      .eq("id", orderId)
      .returns<OrderCheck[]>()
      .single();

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Get the rating
    const { data: rating } = await supabase
      .from("driver_ratings")
      .select("id, rating, feedback_text, submitted_at")
      .eq("order_id", orderId)
      .single();

    if (!rating) {
      return NextResponse.json(
        { hasRating: false },
        { status: 200 }
      );
    }

    return NextResponse.json({
      hasRating: true,
      rating: {
        id: rating.id,
        rating: rating.rating,
        feedbackText: rating.feedback_text,
        submittedAt: rating.submitted_at,
      },
    });
  } catch (error) {
    logger.exception(error, { api: "orders/[id]/rating" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
