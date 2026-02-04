import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createPublicClient, createServiceClient, createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

const onboardSchema = z.object({
  token: z.string().min(1, "Token is required"),
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
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
}

interface ProfileRow {
  id: string;
}

interface DriverRow {
  id: string;
}

/**
 * POST /api/driver/onboard
 * Complete driver registration using an invite token
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

    const { token, fullName, phone, vehicleType, licensePlate, password } = result.data;

    // Use public client to validate token (RLS allows public SELECT on valid tokens)
    const publicSupabase = createPublicClient();

    // Step 1: Validate token
    const { data: invite, error: inviteError } = await publicSupabase
      .from("driver_invites")
      .select("id, email, expires_at, accepted_at, revoked_at")
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .is("accepted_at", null)
      .is("revoked_at", null)
      .returns<DriverInviteRow[]>()
      .single();

    if (inviteError || !invite) {
      logger.warn("Driver onboard: Invalid or expired token", { token: token.substring(0, 8) + "..." });
      return NextResponse.json(
        { error: "This invitation link is invalid or has expired" },
        { status: 404 }
      );
    }

    const email = invite.email;

    // Step 2: Create auth user using service role client (bypasses RLS)
    const serviceSupabase = createServiceClient();

    // Check if user already exists
    const { data: existingProfile } = await serviceSupabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .returns<ProfileRow[]>()
      .single();

    if (existingProfile) {
      // Check if they're already a driver
      const { data: existingDriver } = await serviceSupabase
        .from("drivers")
        .select("id")
        .eq("user_id", existingProfile.id)
        .returns<DriverRow[]>()
        .single();

      if (existingDriver) {
        return NextResponse.json(
          { error: "This email is already registered as a driver" },
          { status: 409 }
        );
      }

      // User exists but not as driver - this shouldn't happen with invite flow
      return NextResponse.json(
        { error: "This email is already registered. Please contact support." },
        { status: 409 }
      );
    }

    // Create new auth user
    const { data: authData, error: signUpError } = await serviceSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since they used invite link
      user_metadata: {
        full_name: fullName,
        role: "driver",
      },
    });

    if (signUpError || !authData.user) {
      logger.exception(signUpError, { api: "driver/onboard", flowId: "signUp" });
      return NextResponse.json(
        { error: "Failed to create account. Please try again." },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    // Step 3: Create profile record
    const { error: profileError } = await serviceSupabase
      .from("profiles")
      .insert({
        id: userId,
        email: email,
        full_name: fullName,
        phone: phone,
        role: "driver" as const,
      });

    if (profileError) {
      logger.exception(profileError, { api: "driver/onboard", flowId: "profile" });
      // Attempt cleanup - delete auth user
      await serviceSupabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: "Failed to create profile. Please try again." },
        { status: 500 }
      );
    }

    // Step 4: Create driver record
    const { error: driverError } = await serviceSupabase.from("drivers").insert({
      user_id: userId,
      vehicle_type: vehicleType,
      license_plate: licensePlate.toUpperCase(),
      phone: phone,
      is_active: true,
      onboarding_completed_at: new Date().toISOString(),
    });

    if (driverError) {
      logger.exception(driverError, { api: "driver/onboard", flowId: "driver" });
      // Attempt cleanup - delete profile and auth user
      await serviceSupabase.from("profiles").delete().eq("id", userId);
      await serviceSupabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: "Failed to create driver record. Please try again." },
        { status: 500 }
      );
    }

    // Step 5: Mark invite as accepted
    const { error: updateError } = await serviceSupabase
      .from("driver_invites")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", invite.id);

    if (updateError) {
      logger.exception(updateError, { api: "driver/onboard", flowId: "updateInvite" });
      // Non-critical - continue
    }

    // Step 6: Sign in the user using regular client (to set session cookie)
    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      logger.exception(signInError, { api: "driver/onboard", flowId: "signIn" });
      // Account was created but sign-in failed - redirect to login
      return NextResponse.json(
        {
          message: "Account created successfully. Please sign in.",
          redirectUrl: "/login",
        },
        { status: 201 }
      );
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
