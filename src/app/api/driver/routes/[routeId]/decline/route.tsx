import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { requireDriver } from "@/lib/auth";
import { checkRateLimit, driverActionLimiter } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { getAdminEmails } from "@/lib/email/admin-recipients";
import { RouteDeclineAlert } from "@/emails/RouteDeclineAlert";
import { logger } from "@/lib/utils/logger";

interface RouteParams {
  params: Promise<{ routeId: string }>;
}

interface RouteQueryResult {
  id: string;
  status: string;
  driver_id: string;
  delivery_date: string;
  stops: { count: number }[];
}

interface DriverProfileResult {
  profiles: { full_name: string | null } | null;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { routeId } = await params;

    const auth = await requireDriver();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase, driverId } = auth;

    const rl = await checkRateLimit({
      limiter: driverActionLimiter,
      identifier: driverId,
      role: "driver",
      route: "driver/routes/[routeId]/decline",
    });
    if (rl.limited) return rl.response;

    // Get route with stop count using driver's supabase client for ownership check
    const { data: route, error: routeError } = await supabase
      .from("routes")
      .select("id, status, driver_id, delivery_date, stops:route_stops(count)")
      .eq("id", routeId)
      .returns<RouteQueryResult[]>()
      .single();

    if (routeError || !route) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    // Verify driver owns this route
    if (route.driver_id !== driverId) {
      return NextResponse.json({ error: "Not authorized to decline this route" }, { status: 403 });
    }

    // Status guard: only assigned or accepted routes can be declined
    if (route.status !== "assigned" && route.status !== "accepted") {
      return NextResponse.json(
        { error: `Cannot decline route with status: ${route.status}` },
        { status: 400 },
      );
    }

    // Parse optional decline reason
    const body = await request.json().catch(() => ({}));
    const reason = typeof body.reason === "string" ? body.reason.trim() || null : null;

    // Get driver name via service client (needed for email)
    const serviceClient = createServiceClient();
    const { data: driverData } = await serviceClient
      .from("drivers")
      .select("profiles(full_name)")
      .eq("id", driverId)
      .returns<DriverProfileResult[]>()
      .single();

    const driverName = driverData?.profiles?.full_name ?? "Unknown Driver";

    // Decline mutation via SERVICE CLIENT to bypass RLS
    // (RLS prevents access after driver_id is nulled)
    const { error: updateError } = await serviceClient
      .from("routes")
      .update({
        driver_id: null,
        status: "planned",
        accepted_at: null,
        declined_at: new Date().toISOString(),
        declined_reason: reason,
        declined_by: driverId,
      })
      .eq("id", routeId)
      .select("id");

    if (updateError) {
      logger.exception(updateError, {
        api: "driver/routes/[routeId]/decline",
        routeId,
        driverId,
      });
      return NextResponse.json({ error: "Failed to decline route" }, { status: 500 });
    }

    // Fire-and-forget email via after()
    const stopCount = route.stops?.[0]?.count ?? 0;
    const deliveryDate = route.delivery_date;

    after(async () => {
      try {
        const admins = await getAdminEmails();
        const adminEmail = admins[0]?.email || process.env.ADMIN_EMAIL || "";
        if (adminEmail) {
          await sendEmail({
            to: adminEmail,
            subject: `Route Declined by ${driverName}`,
            react: (
              <RouteDeclineAlert
                driverName={driverName}
                routeDate={deliveryDate}
                stopCount={stopCount}
                reason={reason}
                routeId={routeId}
              />
            ),
            type: "admin_route_decline",
            orderId: routeId,
            userId: auth.userId,
            mandatory: true,
          });
        }
      } catch (emailError) {
        logger.exception(emailError, {
          api: "driver/routes/[routeId]/decline",
          context: "after-email",
          routeId,
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.exception(error, { api: "driver/routes/[routeId]/decline" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
