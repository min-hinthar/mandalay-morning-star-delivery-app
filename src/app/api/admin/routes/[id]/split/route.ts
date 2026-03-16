import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { splitRouteSchema } from "@/lib/validations/route";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";
import type { RouteParams } from "../types";

/**
 * POST /api/admin/routes/[id]/split
 * Split selected stops into a new route
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
      route: "admin/routes/:id/split",
    });
    if (rl.limited) return rl.response;

    const body = await request.json();
    const parsed = splitRouteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const rpcArgs: {
      p_source_route_id: string;
      p_stop_ids: string[];
      p_new_driver_id?: string;
    } = {
      p_source_route_id: id,
      p_stop_ids: parsed.data.stopIds,
    };
    if (parsed.data.driverId) {
      rpcArgs.p_new_driver_id = parsed.data.driverId;
    }

    const { data, error } = await supabase.rpc("split_route", rpcArgs);

    if (error) {
      logger.exception(error, {
        api: "admin/routes/[id]/split",
        flowId: "split",
        routeId: id,
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ newRouteId: data });
  } catch (error) {
    logger.exception(error, { api: "admin/routes/[id]/split" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
