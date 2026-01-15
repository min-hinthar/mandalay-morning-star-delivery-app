import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createDriverSchema } from "@/lib/validations/driver";
import type { ProfileRole, ProfilesRow } from "@/types/database";
import type { DriversRow, VehicleType } from "@/types/driver";

interface ProfileCheck {
  role: ProfileRole;
}

interface DriverWithProfile extends DriversRow {
  profiles: Pick<ProfilesRow, "email" | "full_name" | "phone"> | null;
}

/**
 * GET /api/admin/drivers
 * List all drivers with their profile info
 */
export async function GET() {
  try {
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

    // Fetch all drivers with profile info
    const { data: drivers, error: driversError } = await supabase
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
      .order("created_at", { ascending: false })
      .returns<DriverWithProfile[]>();

    if (driversError) {
      console.error("Failed to fetch drivers:", driversError);
      return NextResponse.json(
        { error: "Failed to fetch drivers" },
        { status: 500 }
      );
    }

    // Transform to API response format
    const response = drivers.map((driver) => ({
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
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/drivers
 * Create a new driver (creates profile + driver record)
 */
export async function POST(request: NextRequest) {
  try {
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
    const result = createDriverSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { email, fullName, phone, vehicleType, licensePlate } = result.data;

    // Check if email already exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (existingProfile) {
      // Check if already a driver
      const { data: existingDriver } = await supabase
        .from("drivers")
        .select("id")
        .eq("user_id", existingProfile.id)
        .single();

      if (existingDriver) {
        return NextResponse.json(
          { error: "A driver with this email already exists" },
          { status: 409 }
        );
      }

      // Create driver record for existing user
      const { data: newDriver, error: driverError } = await supabase
        .from("drivers")
        .insert({
          user_id: existingProfile.id,
          vehicle_type: vehicleType as VehicleType | null,
          license_plate: licensePlate ?? null,
          phone: phone ?? null,
          is_active: true,
        })
        .select()
        .single();

      if (driverError) {
        console.error("Failed to create driver:", driverError);
        return NextResponse.json(
          { error: "Failed to create driver" },
          { status: 500 }
        );
      }

      // Update profile role to driver
      await supabase
        .from("profiles")
        .update({ role: "driver", full_name: fullName, phone: phone ?? null })
        .eq("id", existingProfile.id);

      return NextResponse.json({
        id: newDriver.id,
        userId: existingProfile.id,
        email,
        fullName,
        message: "Driver created from existing user",
      }, { status: 201 });
    }

    // For new users, we need to use Supabase Admin API to create the auth user
    // This would require service role key - for now, return instructions
    // In production, you'd use supabase.auth.admin.createUser()

    return NextResponse.json({
      error: "New user creation requires admin invitation flow",
      message: "Please use the invite system to add new drivers",
      email,
    }, { status: 400 });

  } catch (error) {
    console.error("Error creating driver:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
