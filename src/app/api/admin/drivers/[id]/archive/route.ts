import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { archiveDriverSchema } from "@/lib/validations/driver";
import { logger } from "@/lib/utils/logger";
import type { ProfileRole } from "@/types/database";

interface ProfileCheck {
  role: ProfileRole;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface ActiveRouteCheck {
  id: string;
}

/**
 * POST /api/admin/drivers/[id]/archive
 * Archive a driver with a required reason
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = archiveDriverSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { reason } = validationResult.data;

    // Check if driver exists
    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .select("id, is_active")
      .eq("id", id)
      .single();

    if (driverError || !driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    // Check if already archived
    if (!driver.is_active) {
      return NextResponse.json({ error: "Driver is already archived" }, { status: 400 });
    }

    // Check if driver has active routes (planned or in_progress)
    const { data: activeRoutes } = await supabase
      .from("routes")
      .select("id")
      .eq("driver_id", id)
      .in("status", ["planned", "in_progress"])
      .limit(1)
      .returns<ActiveRouteCheck[]>();

    if (activeRoutes && activeRoutes.length > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot archive driver with active routes. Please reassign or complete routes first.",
        },
        { status: 400 }
      );
    }

    // Archive the driver (soft delete by setting is_active = false)
    const archivedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("drivers")
      .update({ is_active: false })
      .eq("id", id);

    if (updateError) {
      logger.exception(updateError, { api: "admin/drivers/[id]/archive", flowId: "archive" });
      return NextResponse.json({ error: "Failed to archive driver" }, { status: 500 });
    }

    // Log the archive action with reason for audit purposes
    logger.info("Driver archived", {
      driverId: id,
      archivedBy: user.id,
      reason,
      archivedAt,
    });

    return NextResponse.json({
      id,
      archivedAt,
      reason,
      message: "Driver archived successfully",
    });
  } catch (error) {
    logger.exception(error, { api: "admin/drivers/[id]/archive" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
