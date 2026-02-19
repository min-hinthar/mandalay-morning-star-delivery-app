import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireDriver } from "@/lib/auth";
import { driverSelfUpdateSchema } from "@/lib/validations/driver";
import { checkRateLimit, driverActionLimiter } from "@/lib/rate-limit";
import { logger } from "@/lib/utils/logger";
import type { VehicleType } from "@/types/driver";

/**
 * PATCH /api/driver/profile
 * Update driver profile fields (name, phone, vehicle type, license plate)
 * Writes to both `drivers` and `profiles` tables
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireDriver();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase, driverId, userId } = auth;

    const rl = await checkRateLimit({
      limiter: driverActionLimiter,
      identifier: driverId,
      role: "driver",
      route: "driver/profile",
    });
    if (rl.limited) return rl.response;

    const body = await request.json();
    const result = driverSelfUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { fullName, phone, vehicleType, licensePlate } = result.data;

    // Update drivers table first (more likely to fail on enum validation)
    const driverUpdate: Record<string, unknown> = {};
    if (vehicleType !== undefined) driverUpdate.vehicle_type = vehicleType as VehicleType | null;
    if (licensePlate !== undefined) driverUpdate.license_plate = licensePlate;
    if (phone !== undefined) driverUpdate.phone = phone;

    if (Object.keys(driverUpdate).length > 0) {
      const { error: driverError } = await supabase
        .from("drivers")
        .update(driverUpdate)
        .eq("id", driverId);

      if (driverError) {
        logger.exception(driverError, { api: "driver/profile", flowId: "update-driver" });
        return NextResponse.json({ error: "Failed to update driver profile" }, { status: 500 });
      }
    }

    // Update profiles table (full_name)
    const profileUpdate: Record<string, unknown> = {};
    if (fullName !== undefined) profileUpdate.full_name = fullName;
    if (phone !== undefined) profileUpdate.phone = phone;

    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileUpdate)
        .eq("id", userId);

      if (profileError) {
        logger.exception(profileError, { api: "driver/profile", flowId: "update-profile" });
        // Non-critical — driver update already succeeded
      }
    }

    // Bust RSC cache for layout (avatar context + nav) and all child pages
    revalidatePath("/driver", "layout");

    return NextResponse.json({
      fullName: fullName ?? null,
      phone: phone ?? null,
      vehicleType: vehicleType ?? null,
      licensePlate: licensePlate ?? null,
      message: "Profile updated",
    });
  } catch (error) {
    logger.exception(error, { api: "driver/profile" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
