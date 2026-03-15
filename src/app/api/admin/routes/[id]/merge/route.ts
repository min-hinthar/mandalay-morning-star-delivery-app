import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { mergeRouteSchema } from "@/lib/validations/route";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";
import type { RouteParams } from "../types";

/**
 * POST /api/admin/routes/[id]/merge
 * Merge a source route into this destination route
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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
      route: "admin/routes/:id/merge",
    });
    if (rl.limited) return rl.response;

    const body = await request.json();
    const parsed = mergeRouteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { data, error } = await supabase.rpc("merge_routes", {
      p_destination_route_id: id,
      p_source_route_id: parsed.data.sourceRouteId,
    });

    if (error) {
      logger.exception(error, {
        api: "admin/routes/[id]/merge",
        flowId: "merge",
        routeId: id,
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ totalStops: data });
  } catch (error) {
    logger.exception(error, { api: "admin/routes/[id]/merge" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
