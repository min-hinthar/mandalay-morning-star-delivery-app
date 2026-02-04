import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

const onboardSchema = z.object({
  inviteId: z.string().uuid("Invalid invite ID"),
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  vehicleType: z.enum(["car", "motorcycle", "bicycle", "van", "truck"]),
  licensePlate: z.string().min(2, "Please enter a valid license plate"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

interface DriverInviteRow {
  id: string;
  email: string;
  accepted_at: string | null;
}

interface DriverRow {
  id: string;
}

/**
 * POST /api/driver/onboard
 * Complete driver registration for an invited user
 * User must be authenticated via Supabase invite link
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const result = onboardSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { inviteId, fullName, phone, vehicleType, licensePlate, password } = result.data;

    // Get authenticated user from session
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn("Driver onboard: No authenticated user");
      return NextResponse.json(
        { error: "Please click the link in your invitation email to continue" },
        { status: 401 }
      );
    }

    // Verify user metadata matches invite
    const userInviteId = user.user_metadata?.invite_id as string | undefined;
    const userRole = user.user_metadata?.role as string | undefined;

    if (userRole !== "driver" || userInviteId !== inviteId) {
      logger.warn("Driver onboard: Invalid invite metadata", {
        userInviteId,
        inviteId,
        userRole,
      });
      return NextResponse.json(
        { error: "Invalid invitation. Please use the link from your email." },
        { status: 403 }
      );
    }

    const email = user.email;
    if (!email) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }

    // Verify invite exists and is not already accepted
    const serviceSupabase = createServiceClient();

    const { data: invite, error: inviteError } = await serviceSupabase
      .from("driver_invites")
      .select("id, email, accepted_at")
      .eq("id", inviteId)
      .returns<DriverInviteRow[]>()
      .single();

    if (inviteError || !invite) {
      logger.warn("Driver onboard: Invite not found", { inviteId });
      return NextResponse.json(
        { error: "Invitation not found. Please contact your administrator." },
        { status: 404 }
      );
    }

    if (invite.accepted_at) {
      // Check if they have a driver record (may have completed already)
      const { data: existingDriver } = await serviceSupabase
        .from("drivers")
        .select("id")
        .eq("user_id", user.id)
        .returns<DriverRow[]>()
        .single();

      if (existingDriver) {
        return NextResponse.json(
          {
            message: "Registration already complete",
            redirectUrl: "/driver",
          },
          { status: 200 }
        );
      }
    }

    // Check if user already has a driver record
    const { data: existingDriver } = await serviceSupabase
      .from("drivers")
      .select("id")
      .eq("user_id", user.id)
      .returns<DriverRow[]>()
      .single();

    if (existingDriver) {
      return NextResponse.json(
        { error: "You are already registered as a driver" },
        { status: 409 }
      );
    }

    // Step 1: Update user password
    const { error: passwordError } = await supabase.auth.updateUser({
      password,
    });

    if (passwordError) {
      logger.exception(passwordError, { api: "driver/onboard", flowId: "updatePassword" });
      return NextResponse.json(
        { error: "Failed to set password. Please try again." },
        { status: 500 }
      );
    }

    // Step 2: Create or update profile record (existing users may have a customer profile)
    const { error: profileError } = await serviceSupabase
      .from("profiles")
      .upsert({
        id: user.id,
        email: email,
        full_name: fullName,
        phone: phone,
        role: "driver" as const,
      }, {
        onConflict: "id",
      });

    if (profileError) {
      logger.exception(profileError, { api: "driver/onboard", flowId: "profile" });
      return NextResponse.json(
        { error: "Failed to create profile. Please try again." },
        { status: 500 }
      );
    }

    // Step 3: Create driver record
    const { error: driverError } = await serviceSupabase.from("drivers").insert({
      user_id: user.id,
      vehicle_type: vehicleType,
      license_plate: licensePlate.toUpperCase(),
      phone: phone,
      is_active: true,
      onboarding_completed_at: new Date().toISOString(),
    });

    if (driverError) {
      logger.exception(driverError, { api: "driver/onboard", flowId: "driver" });
      // Attempt cleanup - delete profile
      await serviceSupabase.from("profiles").delete().eq("id", user.id);
      return NextResponse.json(
        { error: "Failed to create driver record. Please try again." },
        { status: 500 }
      );
    }

    // Step 4: Mark invite as accepted
    const { error: updateError } = await serviceSupabase
      .from("driver_invites")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", inviteId);

    if (updateError) {
      logger.exception(updateError, { api: "driver/onboard", flowId: "updateInvite" });
      // Non-critical - continue
    }

    return NextResponse.json(
      {
        message: "Registration complete",
        redirectUrl: "/driver",
      },
      { status: 201 }
    );
  } catch (error) {
    logger.exception(error, { api: "driver/onboard" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
