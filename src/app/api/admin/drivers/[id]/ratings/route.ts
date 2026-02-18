import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import type { ProfileRole } from "@/types/database";

interface ProfileCheck {
  role: ProfileRole;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface RatingWithContext {
  id: string;
  rating: number;
  feedback_text: string | null;
  submitted_at: string;
  order_id: string;
  orders: {
    profiles: {
      full_name: string | null;
    } | null;
  } | null;
}

interface DriverRatingResponse {
  id: string;
  rating: number;
  feedbackText: string | null;
  submittedAt: string;
  orderId: string;
  customerName: string | null;
}

interface DriverRecord {
  rating_avg: number;
}

/**
 * GET /api/admin/drivers/[id]/ratings
 * Get recent ratings for a driver with customer context
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .returns<ProfileCheck[]>()
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // Get driver's average rating from drivers table (already computed)
    const { data: driver } = await supabase
      .from("drivers")
      .select("rating_avg")
      .eq("id", id)
      .returns<DriverRecord[]>()
      .single();

    // Fetch ratings with order and customer info
    const { data: ratings, error: ratingsError } = await supabase
      .from("driver_ratings")
      .select(
        `
        id,
        rating,
        feedback_text,
        submitted_at,
        order_id,
        orders (
          profiles (
            full_name
          )
        )
      `
      )
      .eq("driver_id", id)
      .order("submitted_at", { ascending: false })
      .limit(limit)
      .returns<RatingWithContext[]>();

    if (ratingsError) {
      logger.exception(ratingsError, { api: "admin/drivers/[id]/ratings" });
      return NextResponse.json({ error: "Failed to fetch ratings" }, { status: 500 });
    }

    // Count total ratings
    const { count: totalRatings } = await supabase
      .from("driver_ratings")
      .select("id", { count: "exact", head: true })
      .eq("driver_id", id);

    // Transform to API response format
    const response: {
      averageRating: number | null;
      totalRatings: number;
      ratings: DriverRatingResponse[];
    } = {
      averageRating: driver?.rating_avg ?? null,
      totalRatings: totalRatings ?? 0,
      ratings: (ratings || []).map((rating) => ({
        id: rating.id,
        rating: rating.rating,
        feedbackText: rating.feedback_text,
        submittedAt: rating.submitted_at,
        orderId: rating.order_id,
        customerName: rating.orders?.profiles?.full_name ?? null,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.exception(error, { api: "admin/drivers/[id]/ratings" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
