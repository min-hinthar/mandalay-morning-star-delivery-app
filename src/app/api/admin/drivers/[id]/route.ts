import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateDriverSchema, toggleDriverActiveSchema } from "@/lib/validations/driver";
import { logger } from "@/lib/utils/logger";
import type { ProfileRole, ProfilesRow } from "@/types/database";
import type { DriversRow, VehicleType } from "@/types/driver";

interface ProfileCheck {
  role: ProfileRole;
}

interface DriverWithProfile extends DriversRow {
  profiles: Pick<ProfilesRow, "email" | "full_name" | "phone"> | null;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/drivers/[id]
 * Get driver details by ID
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

    // Fetch driver with profile
    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .select(`
        id,
        user_id,
        vehicle_type,
        license_plate,
        phone,
        profile_image_url,
        is_active,
        onboarding_completed_at,
        rating_avg,
        deliveries_count,
        created_at,
        updated_at,
        profiles (
          email,
          full_name,
          phone
        )
      `)
      .eq("id", id)
      .returns<DriverWithProfile[]>()
      .single();

    if (driverError || !driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    // Transform to API response format
    const response = {
      id: driver.id,
      userId: driver.user_id,
      email: driver.profiles?.email ?? "",
      fullName: driver.profiles?.full_name ?? null,
      phone: driver.phone ?? driver.profiles?.phone ?? null,
      vehicleType: driver.vehicle_type,
      licensePlate: driver.license_plate,
      profileImageUrl: driver.profile_image_url,
      isActive: driver.is_active,
      onboardingCompletedAt: driver.onboarding_completed_at,
      ratingAvg: driver.rating_avg,
      deliveriesCount: driver.deliveries_count,
      createdAt: driver.created_at,
      updatedAt: driver.updated_at,
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.exception(error, { api: "admin/drivers/[id]" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/drivers/[id]
 * Update driver details
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

    // Parse and validate request body
    const body = await request.json();

    // Check if this is an activation toggle
    const toggleResult = toggleDriverActiveSchema.safeParse(body);
    if (toggleResult.success) {
      const { data: updatedDriver, error: updateError } = await supabase
        .from("drivers")
        .update({ is_active: toggleResult.data.isActive })
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        logger.exception(updateError, { api: "admin/drivers/[id]", flowId: "toggle-active" });
        return NextResponse.json(
          { error: "Failed to update driver" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        id: updatedDriver.id,
        isActive: updatedDriver.is_active,
        message: toggleResult.data.isActive ? "Driver activated" : "Driver deactivated",
      });
    }

    // Otherwise, validate as regular update
    const updateResult = updateDriverSchema.safeParse(body);

    if (!updateResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: updateResult.error.flatten() },
        { status: 400 }
      );
    }

    const { fullName, phone, vehicleType, licensePlate, profileImageUrl } = updateResult.data;

    // Get existing driver to find user_id
    const { data: existingDriver } = await supabase
      .from("drivers")
      .select("user_id")
      .eq("id", id)
      .returns<{ user_id: string }[]>()
      .single();

    if (!existingDriver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    // Build driver update object
    const driverUpdate: Record<string, unknown> = {};
    if (vehicleType !== undefined) driverUpdate.vehicle_type = vehicleType as VehicleType | null;
    if (licensePlate !== undefined) driverUpdate.license_plate = licensePlate;
    if (phone !== undefined) driverUpdate.phone = phone;
    if (profileImageUrl !== undefined) driverUpdate.profile_image_url = profileImageUrl;

    // Update driver record if there are changes
    if (Object.keys(driverUpdate).length > 0) {
      const { error: driverUpdateError } = await supabase
        .from("drivers")
        .update(driverUpdate)
        .eq("id", id);

      if (driverUpdateError) {
        logger.exception(driverUpdateError, { api: "admin/drivers/[id]", flowId: "update-driver" });
        return NextResponse.json(
          { error: "Failed to update driver" },
          { status: 500 }
        );
      }
    }

    // Update profile if fullName or phone changed
    const profileUpdate: Record<string, unknown> = {};
    if (fullName !== undefined) profileUpdate.full_name = fullName;
    if (phone !== undefined) profileUpdate.phone = phone;

    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update(profileUpdate)
        .eq("id", existingDriver.user_id);

      if (profileUpdateError) {
        logger.exception(profileUpdateError, { api: "admin/drivers/[id]", flowId: "update-profile" });
        // Don't fail the whole request, driver update already succeeded
      }
    }

    return NextResponse.json({
      id,
      message: "Driver updated successfully",
    });
  } catch (error) {
    logger.exception(error, { api: "admin/drivers/[id]" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/drivers/[id]
 * Soft delete driver (deactivate instead of hard delete)
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

    // Check if driver has active routes
    const { data: activeRoutes } = await supabase
      .from("routes")
      .select("id")
      .eq("driver_id", id)
      .in("status", ["planned", "in_progress"])
      .limit(1);

    if (activeRoutes && activeRoutes.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete driver with active routes" },
        { status: 400 }
      );
    }

    // Soft delete by deactivating
    const { error: deleteError } = await supabase
      .from("drivers")
      .update({ is_active: false })
      .eq("id", id);

    if (deleteError) {
      logger.exception(deleteError, { api: "admin/drivers/[id]", flowId: "delete" });
      return NextResponse.json(
        { error: "Failed to delete driver" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id,
      message: "Driver deactivated successfully",
    });
  } catch (error) {
    logger.exception(error, { api: "admin/drivers/[id]" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
