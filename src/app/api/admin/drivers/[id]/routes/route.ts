import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import type { ProfileRole } from "@/types/database";
import type { RouteStatus, RouteStopStatus } from "@/types/driver";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";

interface ProfileCheck {
  role: ProfileRole;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface RouteStopRow {
  status: RouteStopStatus;
}

interface RouteWithStops {
  id: string;
  delivery_date: string;
  status: RouteStatus;
  started_at: string | null;
  completed_at: string | null;
  route_stops: RouteStopRow[];
}

interface DriverRouteResponse {
  id: string;
  deliveryDate: string;
  status: RouteStatus;
  totalStops: number;
  completedStops: number;
  startedAt: string | null;
  completedAt: string | null;
}

/**
 * GET /api/admin/drivers/[id]/routes
 * Get recent routes for a driver
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

    const rl = await checkRateLimit({
      limiter: adminLimiter,
      identifier: user.id,
      role: "admin",
      route: "admin/drivers/:id/routes",
    });
    if (rl.limited) return rl.response;

    // Parse query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "7", 10);

    // Calculate date range (last N days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - limit);

    // Fetch routes with stops count
    const { data: routes, error: routesError } = await supabase
      .from("routes")
      .select(
        `
        id,
        delivery_date,
        status,
        started_at,
        completed_at,
        route_stops (
          status
        )
      `
      )
      .eq("driver_id", id)
      .gte("delivery_date", startDate.toISOString().split("T")[0])
      .lte("delivery_date", endDate.toISOString().split("T")[0])
      .order("delivery_date", { ascending: false })
      .returns<RouteWithStops[]>();

    if (routesError) {
      logger.exception(routesError, { api: "admin/drivers/[id]/routes" });
      return NextResponse.json({ error: "Failed to fetch routes" }, { status: 500 });
    }

    // Transform to API response format
    const response: { routes: DriverRouteResponse[] } = {
      routes: (routes || []).map((route) => {
        const totalStops = route.route_stops?.length || 0;
        const completedStops =
          route.route_stops?.filter((stop) => stop.status === "delivered").length || 0;

        return {
          id: route.id,
          deliveryDate: route.delivery_date,
          status: route.status,
          totalStops,
          completedStops,
          startedAt: route.started_at,
          completedAt: route.completed_at,
        };
      }),
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.exception(error, { api: "admin/drivers/[id]/routes" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
