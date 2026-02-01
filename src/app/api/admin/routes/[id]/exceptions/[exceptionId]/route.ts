import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveExceptionSchema } from "@/lib/validations/route";
import { logger } from "@/lib/utils/logger";
import type { ProfileRole } from "@/types/database";

interface ProfileCheck {
  role: ProfileRole;
}

interface RouteParams {
  params: Promise<{ id: string; exceptionId: string }>;
}

interface ExceptionWithRoute {
  id: string;
  resolved_at: string | null;
  route_stops: {
    route_id: string;
  } | null;
}

/**
 * PATCH /api/admin/routes/[id]/exceptions/[exceptionId]
 * Resolve a delivery exception
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: routeId, exceptionId } = await params;
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

    // Parse and validate request body
    const body = await request.json();
    const result = resolveExceptionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { resolutionNotes, newDeliveryDate } = result.data;

    // Verify exception exists and belongs to a stop in this route
    const { data: exception, error: exceptionError } = await supabase
      .from("delivery_exceptions")
      .select(`
        id,
        resolved_at,
        route_stops!inner (
          route_id
        )
      `)
      .eq("id", exceptionId)
      .returns<ExceptionWithRoute[]>()
      .single();

    if (exceptionError || !exception) {
      return NextResponse.json({ error: "Exception not found" }, { status: 404 });
    }

    // Verify exception belongs to the specified route
    if (exception.route_stops?.route_id !== routeId) {
      return NextResponse.json(
        { error: "Exception does not belong to this route" },
        { status: 400 }
      );
    }

    // Check if already resolved
    if (exception.resolved_at) {
      return NextResponse.json(
        { error: "Exception already resolved" },
        { status: 400 }
      );
    }

    // Update exception
    const resolvedAt = new Date().toISOString();
    const { data: updatedException, error: updateError } = await supabase
      .from("delivery_exceptions")
      .update({
        resolved_at: resolvedAt,
        resolved_by: user.id,
        resolution_notes: resolutionNotes,
      })
      .eq("id", exceptionId)
      .select("id, resolved_at, resolved_by, resolution_notes")
      .returns<{ id: string; resolved_at: string; resolved_by: string; resolution_notes: string }[]>()
      .single();

    if (updateError) {
      logger.exception(updateError, { api: "admin/routes/[id]/exceptions/[exceptionId]", flowId: "resolve-exception" });
      return NextResponse.json(
        { error: "Failed to resolve exception" },
        { status: 500 }
      );
    }

    // Log new delivery date if provided (future enhancement: create new route stop)
    if (newDeliveryDate) {
      logger.info("New delivery date requested for exception", {
        exceptionId,
        newDeliveryDate,
        routeId,
      });
    }

    return NextResponse.json({
      id: updatedException.id,
      resolvedAt: updatedException.resolved_at,
      resolvedBy: updatedException.resolved_by,
      resolutionNotes: updatedException.resolution_notes,
      message: "Exception resolved",
    });
  } catch (error) {
    logger.exception(error, { api: "admin/routes/[id]/exceptions/[exceptionId]" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
