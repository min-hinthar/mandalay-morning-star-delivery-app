import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { RouteStats, RouteStatus, RouteStopStatus } from "@/types/driver";

interface RouteParams {
  params: Promise<{ routeId: string }>;
}

interface DriverQueryResult {
  id: string;
}

interface AddressData {
  id: string;
  line_1: string;
  line_2: string | null;
  city: string;
  state: string;
  postal_code: string;
  lat: number | null;
  lng: number | null;
}

interface CustomerData {
  id: string;
  full_name: string | null;
  phone: string | null;
}

interface OrderData {
  id: string;
  total_cents: number;
  delivery_window_start: string | null;
  delivery_window_end: string | null;
  special_instructions: string | null;
  addresses: AddressData | null;
  profiles: CustomerData | null;
}

interface StopData {
  id: string;
  stop_index: number;
  status: string;
  eta: string | null;
  arrived_at: string | null;
  delivered_at: string | null;
  delivery_photo_url: string | null;
  delivery_notes: string | null;
  order_id: string;
  orders: OrderData | null;
}

interface RouteQueryResult {
  id: string;
  delivery_date: string;
  status: string;
  stats_json: RouteStats | null;
  started_at: string | null;
  completed_at: string | null;
  optimized_polyline: string | null;
  driver_id: string;
  route_stops: StopData[];
}

interface StopDetailResponse {
  id: string;
  stopIndex: number;
  status: RouteStopStatus;
  eta: string | null;
  arrivedAt: string | null;
  deliveredAt: string | null;
  deliveryPhotoUrl: string | null;
  deliveryNotes: string | null;
  order: {
    id: string;
    totalCents: number;
    deliveryWindowStart: string | null;
    deliveryWindowEnd: string | null;
    specialInstructions: string | null;
    customer: {
      id: string;
      fullName: string | null;
      phone: string | null;
    };
    address: {
      line1: string;
      line2: string | null;
      city: string;
      state: string;
      postalCode: string;
      lat: number | null;
      lng: number | null;
    };
  };
}

interface RouteDetailResponse {
  id: string;
  deliveryDate: string;
  status: RouteStatus;
  stats: RouteStats | null;
  startedAt: string | null;
  completedAt: string | null;
  optimizedPolyline: string | null;
  stops: StopDetailResponse[];
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<RouteDetailResponse | { error: string }>> {
  try {
    const { routeId } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get driver
    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .select("id")
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

    // Get route with stops
    const { data: route, error: routeError } = await supabase
      .from("routes")
      .select(`
        id,
        delivery_date,
        status,
        stats_json,
        started_at,
        completed_at,
        optimized_polyline,
        driver_id,
        route_stops (
          id,
          stop_index,
          status,
          eta,
          arrived_at,
          delivered_at,
          delivery_photo_url,
          delivery_notes,
          order_id,
          orders (
            id,
            total_cents,
            delivery_window_start,
            delivery_window_end,
            special_instructions,
            addresses (
              id,
              line_1,
              line_2,
              city,
              state,
              postal_code,
              lat,
              lng
            ),
            profiles!orders_user_id_fkey (
              id,
              full_name,
              phone
            )
          )
        )
      `)
      .eq("id", routeId)
      .order("stop_index", { referencedTable: "route_stops", ascending: true })
      .returns<RouteQueryResult[]>()
      .single();

    if (routeError || !route) {
      return NextResponse.json(
        { error: "Route not found" },
        { status: 404 }
      );
    }

    // Verify driver owns this route
    if (route.driver_id !== driver.id) {
      return NextResponse.json(
        { error: "Not authorized to view this route" },
        { status: 403 }
      );
    }

    // Transform stops
    const stops: StopDetailResponse[] = route.route_stops
      .filter((stop) => stop.orders)
      .map((stop) => ({
        id: stop.id,
        stopIndex: stop.stop_index,
        status: stop.status as RouteStopStatus,
        eta: stop.eta,
        arrivedAt: stop.arrived_at,
        deliveredAt: stop.delivered_at,
        deliveryPhotoUrl: stop.delivery_photo_url,
        deliveryNotes: stop.delivery_notes,
        order: {
          id: stop.orders!.id,
          totalCents: stop.orders!.total_cents,
          deliveryWindowStart: stop.orders!.delivery_window_start,
          deliveryWindowEnd: stop.orders!.delivery_window_end,
          specialInstructions: stop.orders!.special_instructions,
          customer: {
            id: stop.orders!.profiles?.id ?? "",
            fullName: stop.orders!.profiles?.full_name ?? null,
            phone: stop.orders!.profiles?.phone ?? null,
          },
          address: {
            line1: stop.orders!.addresses?.line_1 ?? "",
            line2: stop.orders!.addresses?.line_2 ?? null,
            city: stop.orders!.addresses?.city ?? "",
            state: stop.orders!.addresses?.state ?? "",
            postalCode: stop.orders!.addresses?.postal_code ?? "",
            lat: stop.orders!.addresses?.lat ?? null,
            lng: stop.orders!.addresses?.lng ?? null,
          },
        },
      }));

    return NextResponse.json({
      id: route.id,
      deliveryDate: route.delivery_date,
      status: route.status as RouteStatus,
      stats: route.stats_json,
      startedAt: route.started_at,
      completedAt: route.completed_at,
      optimizedPolyline: route.optimized_polyline,
      stops,
    });
  } catch (error) {
    console.error("Error fetching route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
