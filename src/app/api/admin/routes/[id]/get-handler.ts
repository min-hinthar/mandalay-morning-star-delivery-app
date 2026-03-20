import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getDeliveryPhotoSignedUrl } from "@/lib/supabase/delivery-photos";
import { logger } from "@/lib/utils/logger";
import type { RouteDetailRow, RouteParams } from "./types";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";

/**
 * GET /api/admin/routes/[id]
 * Get route details with all stops and order info
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase, userId } = auth;

    const rl = await checkRateLimit({
      limiter: adminLimiter,
      identifier: userId,
      role: "admin",
      route: "admin/routes/:id",
    });
    if (rl.limited) return rl.response;

    // Fetch route with all details
    const { data: route, error: routeError } = await supabase
      .from("routes")
      .select(
        `
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
        drivers!routes_driver_id_fkey (
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
            profiles!orders_user_id_fkey (
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
      `
      )
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
      driver: route.drivers
        ? {
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
          }
        : null,
      stops: await Promise.all(
        route.route_stops.map(async (stop) => ({
          id: stop.id,
          stopIndex: stop.stop_index,
          eta: stop.eta,
          status: stop.status,
          arrivedAt: stop.arrived_at,
          deliveredAt: stop.delivered_at,
          deliveryPhotoUrl: await getDeliveryPhotoSignedUrl(stop.delivery_photo_url),
          deliveryNotes: stop.delivery_notes,
          order: stop.orders
            ? {
                id: stop.orders.id,
                totalCents: stop.orders.total_cents,
                deliveryWindowStart: stop.orders.delivery_window_start,
                deliveryWindowEnd: stop.orders.delivery_window_end,
                specialInstructions: stop.orders.special_instructions,
                itemCount:
                  stop.orders.order_items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
                customer: stop.orders.profiles
                  ? {
                      id: stop.orders.profiles.id,
                      fullName: stop.orders.profiles.full_name,
                      phone: stop.orders.profiles.phone,
                    }
                  : null,
                address: stop.orders.addresses
                  ? {
                      line1: stop.orders.addresses.line_1,
                      line2: stop.orders.addresses.line_2,
                      city: stop.orders.addresses.city,
                      state: stop.orders.addresses.state,
                      postalCode: stop.orders.addresses.postal_code,
                      lat: stop.orders.addresses.lat,
                      lng: stop.orders.addresses.lng,
                    }
                  : null,
              }
            : null,
          exception: stop.delivery_exceptions?.[0]
            ? {
                id: stop.delivery_exceptions[0].id,
                type: stop.delivery_exceptions[0].exception_type,
                description: stop.delivery_exceptions[0].description,
                photoUrl: stop.delivery_exceptions[0].photo_url,
                resolved: stop.delivery_exceptions[0].resolved_at !== null,
              }
            : null,
        }))
      ),
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.exception(error, { api: "admin/routes/[id]", flowId: "get" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
