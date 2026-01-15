import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { RoutesRow, RouteStats, VehicleType } from "@/types/driver";

const TIMEZONE = "America/Los_Angeles";

function getTodayInTimezone(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

interface DriverMeResponse {
  driver: {
    id: string;
    fullName: string | null;
    phone: string | null;
    vehicleType: VehicleType | null;
    profileImageUrl: string | null;
    deliveriesCount: number;
    ratingAvg: number;
  };
  todayRoute: {
    id: string;
    status: RoutesRow["status"];
    stopCount: number;
    deliveredCount: number;
    startedAt: string | null;
  } | null;
}

export async function GET(): Promise<NextResponse<DriverMeResponse | { error: string }>> {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get driver profile with user data
    interface DriverQueryResult {
      id: string;
      vehicle_type: string | null;
      phone: string | null;
      profile_image_url: string | null;
      deliveries_count: number;
      rating_avg: number;
      user_id: string;
    }

    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .select(`
        id,
        vehicle_type,
        phone,
        profile_image_url,
        deliveries_count,
        rating_avg,
        user_id
      `)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .returns<DriverQueryResult[]>()
      .single();

    if (driverError || !driver) {
      return NextResponse.json(
        { error: "Not a driver" },
        { status: 403 }
      );
    }

    // Get profile for full name
    interface ProfileQueryResult {
      full_name: string | null;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .returns<ProfileQueryResult[]>()
      .single();

    // Get today's date in LA timezone (for Saturday-only delivery)
    const todayStr = getTodayInTimezone();

    // Get today's route for this driver
    interface RouteQueryResult {
      id: string;
      status: string;
      stats_json: RouteStats | null;
      started_at: string | null;
    }

    const { data: route } = await supabase
      .from("routes")
      .select("id, status, stats_json, started_at")
      .eq("driver_id", driver.id)
      .eq("delivery_date", todayStr)
      .in("status", ["planned", "in_progress"])
      .returns<RouteQueryResult[]>()
      .single();

    // Build today's route info
    let todayRoute: DriverMeResponse["todayRoute"] = null;
    if (route) {
      const stats = route.stats_json;
      todayRoute = {
        id: route.id,
        status: route.status as RoutesRow["status"],
        stopCount: stats?.total_stops ?? 0,
        deliveredCount: stats?.delivered_stops ?? 0,
        startedAt: route.started_at,
      };
    }

    return NextResponse.json({
      driver: {
        id: driver.id,
        fullName: profile?.full_name ?? null,
        phone: driver.phone,
        vehicleType: driver.vehicle_type as VehicleType | null,
        profileImageUrl: driver.profile_image_url,
        deliveriesCount: driver.deliveries_count,
        ratingAvg: driver.rating_avg,
      },
      todayRoute,
    });
  } catch (error) {
    console.error("Error fetching driver profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
