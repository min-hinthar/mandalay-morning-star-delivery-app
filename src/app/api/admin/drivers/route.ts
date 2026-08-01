import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import { createDriverSchema } from "@/lib/validations/driver";
import type { ProfilesRow } from "@/types/database";
import type { DriversRow, VehicleType } from "@/types/driver";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";

interface DriverWithProfile extends DriversRow {
  profiles: Pick<ProfilesRow, "email" | "full_name" | "phone"> | null;
}

/**
 * GET /api/admin/drivers
 * List all drivers with their profile info (paginated)
 */
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const rl = await checkRateLimit({
      limiter: adminLimiter,
      identifier: auth.userId,
      role: "admin",
      route: "admin/drivers",
    });
    if (rl.limited) return rl.response;
    const { supabase } = auth;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
    const rangeStart = (page - 1) * limit;
    const rangeEnd = rangeStart + limit - 1;

    const {
      data: drivers,
      error: driversError,
      count,
    } = await supabase
      .from("drivers")
      .select(
        `
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
        availability_json,
        created_at,
        updated_at,
        profiles (
          email,
          full_name,
          phone
        )
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(rangeStart, rangeEnd)
      .returns<DriverWithProfile[]>();

    if (driversError) {
      logger.exception(driversError, { api: "admin/drivers", flowId: "fetch" });
      return NextResponse.json({ error: "Failed to fetch drivers" }, { status: 500 });
    }

    // Transform to API response format
    const data = (drivers ?? []).map((driver) => ({
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
      availability: driver.availability_json ?? null,
      createdAt: driver.created_at,
    }));

    const total = count ?? 0;

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.exception(error, { api: "admin/drivers", flowId: "fetch" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/drivers
 * Create a new driver (creates profile + driver record)
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const rl = await checkRateLimit({
      limiter: adminLimiter,
      identifier: auth.userId,
      role: "admin",
      route: "admin/drivers",
    });
    if (rl.limited) return rl.response;
    const { supabase } = auth;

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

    // `phone` is OPTIONAL in createDriverSchema, so `phone ?? null` would WIPE a
    // stored number whenever the admin re-submits the form without one — silent
    // data loss on a request that reports success. Omit the column instead when
    // nothing was submitted, so an absent field means "leave it alone".
    const optionalPhone = phone ? { phone } : {};

    // One elevated client for the whole handler, matching PATCH
    // /api/admin/drivers/[id]. Instantiated only AFTER requireAdmin() above —
    // authz is always proven before elevation.
    const db = createServiceClient();

    // Check if email already exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("email", email)
      .single();

    if (existingProfile) {
      // `profiles.role` is a single enum, so promoting someone to `driver`
      // NECESSARILY strips whatever they were. That was harmless while the
      // promotion silently matched zero rows under profiles_update; now that
      // it writes with the service client, adding an admin's email here would
      // really demote them out of the admin app — from a form that gives no
      // hint that's about to happen. Refuse and say so instead.
      if (existingProfile.role === "admin") {
        return NextResponse.json(
          {
            error:
              "That email belongs to an admin account. Promoting it to driver would remove their admin access — change the role directly if that's intended.",
          },
          { status: 409 }
        );
      }

      // `is_active` comes along so the heal path can report a reactivation
      // instead of silently un-archiving.
      const { data: existingDriver } = await supabase
        .from("drivers")
        .select("id, is_active")
        .eq("user_id", existingProfile.id)
        .single();

      if (existingDriver) {
        // A driver row WITHOUT the matching profile role is the wreckage of the
        // RLS bug this PR fixes: the insert succeeded (drivers_insert grants
        // is_admin()) while the promotion silently matched zero rows. Those
        // accounts show up in the driver picker but can't sign in to the driver
        // app, and re-adding them was the natural fix an admin would reach for
        // — which 409'd, leaving no way out. Heal it instead of rejecting.
        if (existingProfile.role !== "driver") {
          const { data: healed, error: healError } = await db
            .from("profiles")
            .update({ role: "driver", full_name: fullName, ...optionalPhone })
            .eq("id", existingProfile.id)
            .select("id");

          if (healError || !healed || healed.length === 0) {
            logger.exception(healError ?? new Error("Profile role repair affected no rows"), {
              api: "admin/drivers",
              flowId: "create-heal-role",
              userId: existingProfile.id,
            });
            return NextResponse.json(
              { error: "Could not promote the existing account to a driver role" },
              { status: 500 }
            );
          }

          // Honour the vehicle details the admin just typed. Without this the
          // response says "repaired" while the pre-existing drivers row keeps
          // its stale vehicle_type/license_plate — and correcting those is a
          // plausible reason the admin re-submitted the form in the first
          // place. Non-fatal: the role promotion above is the repair that
          // matters, so a failure here is logged, not surfaced as a 500.
          const { error: detailsError } = await db
            .from("drivers")
            .update({
              vehicle_type: vehicleType as VehicleType | null,
              license_plate: licensePlate ?? null,
              ...optionalPhone,
              // Re-adding someone through the add-driver form IS a request to
              // have them driving, so reactivating is the right value — but it
              // must be said out loud rather than silently undoing a
              // deliberate archive, hence the message below.
              is_active: true,
            })
            .eq("id", existingDriver.id);

          if (detailsError) {
            logger.exception(detailsError, {
              api: "admin/drivers",
              flowId: "create-heal-details",
              driverId: existingDriver.id,
            });
          }

          // Report what LANDED, not what was attempted. `reactivated` and the
          // message key off this write's outcome, not off the pre-write
          // is_active: the details write is deliberately non-fatal, so without
          // this an admin re-adding an archived driver could get a 200 saying
          // "REACTIVATED" while the row stayed is_active=false and unassignable
          // — the same silent partial-truth this PR fixes for the profile half
          // of PATCH /[id].
          const detailsSaved = !detailsError;
          const wasArchived = !existingDriver.is_active;

          let message: string;
          if (!detailsSaved) {
            message = wasArchived
              ? "Account promoted to driver, but the driver record could not be updated — it is STILL ARCHIVED and cannot be assigned"
              : "Account promoted to driver, but the vehicle details could not be saved";
          } else if (wasArchived) {
            message =
              "Existing driver record repaired, promoted to driver, and REACTIVATED (it had been archived)";
          } else {
            message = "Existing driver record repaired — account promoted to driver";
          }

          return NextResponse.json({
            id: existingDriver.id,
            userId: existingProfile.id,
            email,
            fullName,
            detailsSaved,
            reactivated: detailsSaved && wasArchived,
            message,
          });
        }

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
        logger.exception(driverError, { api: "admin/drivers", flowId: "create" });
        return NextResponse.json({ error: "Failed to create driver" }, { status: 500 });
      }

      // Promote the profile to `driver`. This MUST use the service client and
      // MUST be checked: profiles_update grants UPDATE only to the row's owner
      // (id = auth.uid()), so an admin promoting someone else matched zero rows
      // — and the result was neither destructured nor awaited for errors. The
      // drivers row was created (drivers_insert does grant is_admin()) so the
      // person appeared in the driver picker, but their role stayed "customer"
      // and they could never sign in to the driver app.
      const { data: promotedRows, error: promoteError } = await db
        .from("profiles")
        .update({ role: "driver", full_name: fullName, ...optionalPhone })
        .eq("id", existingProfile.id)
        .select("id");

      if (promoteError || !promotedRows || promotedRows.length === 0) {
        logger.exception(promoteError ?? new Error("Profile role update affected no rows"), {
          api: "admin/drivers",
          flowId: "create-promote-profile",
          userId: existingProfile.id,
        });
        // Roll back the orphan so the state stays clean and a retry is
        // actually possible — without this the drivers row survives, the
        // profile stays a customer, and every retry 409s on the guard above.
        // (Same rollback shape POST /api/admin/routes uses when stop creation
        // fails after the route insert.) A compensating action that fails
        // silently is worse than one that fails loudly — log it so a surviving
        // orphan leaves a breadcrumb rather than only showing up later as a
        // mysterious heal-path hit.
        const { error: rollbackError } = await db.from("drivers").delete().eq("id", newDriver.id);

        if (rollbackError) {
          logger.exception(rollbackError, {
            api: "admin/drivers",
            flowId: "create-rollback-orphan",
            driverId: newDriver.id,
          });
        }

        return NextResponse.json(
          { error: "Could not promote the account to a driver role — no changes were saved" },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          id: newDriver.id,
          userId: existingProfile.id,
          email,
          fullName,
          message: "Driver created from existing user",
        },
        { status: 201 }
      );
    }

    // For new users, we need to use Supabase Admin API to create the auth user
    // This would require service role key - for now, return instructions
    // In production, you'd use supabase.auth.admin.createUser()

    return NextResponse.json(
      {
        error: "New user creation requires admin invitation flow",
        message: "Please use the invite system to add new drivers",
        email,
      },
      { status: 400 }
    );
  } catch (error) {
    logger.exception(error, { api: "admin/drivers", flowId: "create" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
