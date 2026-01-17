import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateRouteSchema, reorderStopsSchema } from "@/lib/validations/route";
import { logger } from "@/lib/utils/logger";
import type { ProfileRole, ProfilesRow, AddressesRow, OrdersRow } from "@/types/database";
import type { RoutesRow, DriversRow, RouteStopsRow, RouteStatus } from "@/types/driver";

interface ProfileCheck {
  role: ProfileRole;
}

interface RouteDetailRow extends RoutesRow {
  drivers: (DriversRow & {
    profiles: Pick<ProfilesRow, "email" | "full_name" | "phone"> | null;
  }) | null;
  route_stops: (RouteStopsRow & {
    orders: (Pick<OrdersRow, "id" | "status" | "total_cents" | "delivery_window_start" | "delivery_window_end" | "special_instructions"> & {
      addresses: Pick<AddressesRow, "id" | "label" | "line_1" | "line_2" | "city" | "state" | "postal_code" | "lat" | "lng"> | null;
      profiles: Pick<ProfilesRow, "id" | "full_name" | "phone" | "email"> | null;
      order_items: Array<{ quantity: number }>;
    }) | null;
    delivery_exceptions: Array<{
      id: string;
      exception_type: string;
      description: string | null;
      photo_url: string | null;
      resolved_at: string | null;
    }>;
  })[];
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/routes/[id]
 * Get route details with all stops and order info
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

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

    // Fetch route with all details
    const { data: route, error: routeError } = await supabase
      .from("routes")
      .select(`
        id,
        delivery_date,
        driver_id,
        status,
        optimized_polyline,
        stats_json,
        started_at,
        completed_at,
        created_at,
        updated_at,
        drivers (
          id,
          user_id,
          vehicle_type,
          license_plate,
          phone,
          profile_image_url,
          is_active,
          rating_avg,
          deliveries_count,
          created_at,
          profiles (
            email,
            full_name,
            phone
          )
        ),
        route_stops (
          id,
          order_id,
          stop_index,
          eta,
          status,
          arrived_at,
          delivered_at,
          delivery_photo_url,
          delivery_notes,
          created_at,
          orders (
            id,
            status,
            total_cents,
            delivery_window_start,
            delivery_window_end,
            special_instructions,
            addresses (
              id,
              label,
              line_1,
              line_2,
              city,
              state,
              postal_code,
              lat,
              lng
            ),
            profiles (
              id,
              full_name,
              phone,
              email
            ),
            order_items (
              quantity
            )
          ),
          delivery_exceptions (
            id,
            exception_type,
            description,
            photo_url,
            resolved_at
          )
        )
      `)
      .eq("id", id)
      .order("stop_index", { referencedTable: "route_stops", ascending: true })
      .returns<RouteDetailRow[]>()
      .single();

    if (routeError || !route) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    // Transform to API response format
    const response = {
      id: route.id,
      deliveryDate: route.delivery_date,
      status: route.status,
      optimizedPolyline: route.optimized_polyline,
      stats: route.stats_json,
      startedAt: route.started_at,
      completedAt: route.completed_at,
      driver: route.drivers ? {
        id: route.drivers.id,
        userId: route.drivers.user_id,
        email: route.drivers.profiles?.email ?? "",
        fullName: route.drivers.profiles?.full_name ?? null,
        phone: route.drivers.phone ?? route.drivers.profiles?.phone ?? null,
        vehicleType: route.drivers.vehicle_type,
        licensePlate: route.drivers.license_plate,
        profileImageUrl: route.drivers.profile_image_url,
        isActive: route.drivers.is_active,
        ratingAvg: route.drivers.rating_avg,
        deliveriesCount: route.drivers.deliveries_count,
        createdAt: route.drivers.created_at,
      } : null,
      stops: route.route_stops.map((stop) => ({
        id: stop.id,
        stopIndex: stop.stop_index,
        eta: stop.eta,
        status: stop.status,
        arrivedAt: stop.arrived_at,
        deliveredAt: stop.delivered_at,
        deliveryPhotoUrl: stop.delivery_photo_url,
        deliveryNotes: stop.delivery_notes,
        order: stop.orders ? {
          id: stop.orders.id,
          totalCents: stop.orders.total_cents,
          deliveryWindowStart: stop.orders.delivery_window_start,
          deliveryWindowEnd: stop.orders.delivery_window_end,
          specialInstructions: stop.orders.special_instructions,
          itemCount: stop.orders.order_items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
          customer: stop.orders.profiles ? {
            id: stop.orders.profiles.id,
            fullName: stop.orders.profiles.full_name,
            phone: stop.orders.profiles.phone,
          } : null,
          address: stop.orders.addresses ? {
            line1: stop.orders.addresses.line_1,
            line2: stop.orders.addresses.line_2,
            city: stop.orders.addresses.city,
            state: stop.orders.addresses.state,
            postalCode: stop.orders.addresses.postal_code,
            lat: stop.orders.addresses.lat,
            lng: stop.orders.addresses.lng,
          } : null,
        } : null,
        exception: stop.delivery_exceptions?.[0] ? {
          id: stop.delivery_exceptions[0].id,
          type: stop.delivery_exceptions[0].exception_type,
          description: stop.delivery_exceptions[0].description,
          photoUrl: stop.delivery_exceptions[0].photo_url,
          resolved: stop.delivery_exceptions[0].resolved_at !== null,
        } : null,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.exception(error, { api: "admin/routes/[id]" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/routes/[id]
 * Update route (assign driver, change status, reorder stops)
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

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

    const body = await request.json();

    // Check if this is a reorder request
    const reorderResult = reorderStopsSchema.safeParse(body);
    if (reorderResult.success) {
      // Reorder stops
      const { stopOrder } = reorderResult.data;

      for (const stop of stopOrder) {
        const { error: updateError } = await supabase
          .from("route_stops")
          .update({ stop_index: stop.stopIndex })
          .eq("id", stop.stopId)
          .eq("route_id", id);

        if (updateError) {
          logger.exception(updateError, { api: "admin/routes/[id]", flowId: "reorder-stops" });
          return NextResponse.json(
            { error: "Failed to reorder stops" },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({
        id,
        message: "Stops reordered successfully",
      });
    }

    // Otherwise, validate as regular update
    const updateResult = updateRouteSchema.safeParse(body);

    if (!updateResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: updateResult.error.flatten() },
        { status: 400 }
      );
    }

    const { driverId, status } = updateResult.data;
    const routeUpdate: Record<string, unknown> = {};

    if (driverId !== undefined) {
      routeUpdate.driver_id = driverId;
    }

    if (status !== undefined) {
      routeUpdate.status = status as RouteStatus;

      // Set timestamps based on status
      if (status === "in_progress") {
        routeUpdate.started_at = new Date().toISOString();
      } else if (status === "completed") {
        routeUpdate.completed_at = new Date().toISOString();
      }
    }

    if (Object.keys(routeUpdate).length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    const { data: updatedRoute, error: updateError } = await supabase
      .from("routes")
      .update(routeUpdate)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      logger.exception(updateError, { api: "admin/routes/[id]", flowId: "update" });
      return NextResponse.json(
        { error: "Failed to update route" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: updatedRoute.id,
      status: updatedRoute.status,
      driverId: updatedRoute.driver_id,
      message: "Route updated successfully",
    });
  } catch (error) {
    logger.exception(error, { api: "admin/routes/[id]" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/routes/[id]
 * Delete route (only if planned)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

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

    // Check route status
    const { data: route } = await supabase
      .from("routes")
      .select("status")
      .eq("id", id)
      .single();

    if (!route) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    if (route.status !== "planned") {
      return NextResponse.json(
        { error: "Can only delete planned routes" },
        { status: 400 }
      );
    }

    // Delete route (stops will cascade)
    const { error: deleteError } = await supabase
      .from("routes")
      .delete()
      .eq("id", id);

    if (deleteError) {
      logger.exception(deleteError, { api: "admin/routes/[id]", flowId: "delete" });
      return NextResponse.json(
        { error: "Failed to delete route" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id,
      message: "Route deleted successfully",
    });
  } catch (error) {
    logger.exception(error, { api: "admin/routes/[id]" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
