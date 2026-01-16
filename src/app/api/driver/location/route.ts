import { NextRequest, NextResponse } from "next/server";
import { requireDriver } from "@/lib/auth";
import { locationUpdateSchema } from "@/lib/validations/driver-api";

interface LastLocationResult {
  created_at: string;
}

interface LocationUpdateResponse {
  success: boolean;
  recordedAt: string;
}

// Rate limit: 1 update per minute
const MIN_UPDATE_INTERVAL_MS = 60 * 1000;

export async function POST(
  request: NextRequest
): Promise<NextResponse<LocationUpdateResponse | { error: string }>> {
  try {
    // Parse and validate request body first (before auth to fail fast on bad input)
    const body = await request.json();
    const parseResult = locationUpdateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { latitude, longitude, accuracy, heading, speed, routeId } = parseResult.data;

    const auth = await requireDriver();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase, driverId } = auth;

    // Check rate limit - get last location update
    const { data: lastUpdate } = await supabase
      .from("location_updates")
      .select("created_at")
      .eq("driver_id", driverId)
      .order("created_at", { ascending: false })
      .limit(1)
      .returns<LastLocationResult[]>()
      .single();

    if (lastUpdate) {
      const lastTime = new Date(lastUpdate.created_at).getTime();
      const now = Date.now();

      if (now - lastTime < MIN_UPDATE_INTERVAL_MS) {
        const waitSeconds = Math.ceil((MIN_UPDATE_INTERVAL_MS - (now - lastTime)) / 1000);
        return NextResponse.json(
          { error: `Rate limited. Please wait ${waitSeconds} seconds.` },
          { status: 429 }
        );
      }
    }

    // Verify route belongs to driver if routeId provided
    if (routeId) {
      const { data: route } = await supabase
        .from("routes")
        .select("driver_id")
        .eq("id", routeId)
        .single();

      if (route && route.driver_id !== driverId) {
        return NextResponse.json(
          { error: "Route does not belong to driver" },
          { status: 403 }
        );
      }
    }

    // Insert location update
    const recordedAt = new Date().toISOString();
    const { error: insertError } = await supabase
      .from("location_updates")
      .insert({
        driver_id: driverId,
        route_id: routeId || null,
        latitude,
        longitude,
        accuracy,
        heading: heading || null,
        speed: speed || null,
        recorded_at: recordedAt,
        source: "mobile",
      });

    if (insertError) {
      console.error("Error inserting location:", insertError);
      return NextResponse.json(
        { error: "Failed to save location" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      recordedAt,
    });
  } catch (error) {
    console.error("Error saving location:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
