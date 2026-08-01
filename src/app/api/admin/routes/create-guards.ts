import { NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";

/**
 * Reject an unknown or deactivated driver before a route is created.
 *
 * Mirrors PATCH /api/admin/orders/[id]/driver, which already refuses with
 * "Cannot assign inactive driver". POST /api/admin/routes previously accepted
 * whatever driver id it was handed: the builder only DIMS inactive drivers, so
 * a stale page could pin a route to someone who no longer works here, and the
 * FK alone can't catch a deactivated (but still present) driver.
 *
 * Returns a NextResponse to short-circuit with, or null when the driver is fine.
 */
export async function verifyAssignableDriver(
  // Takes the lookup as a thunk rather than the client itself: typing a
  // structural subset of SupabaseClient trips TS2589 ("type instantiation is
  // excessively deep") against the generated Database generics, and widening to
  // `any` would throw away the result typing we actually care about.
  lookup: () => PromiseLike<{ data: unknown; error: unknown }>,
  driverId: string
): Promise<NextResponse | null> {
  const { data, error } = await lookup();

  if (error) {
    logger.exception(error, {
      api: "admin/routes",
      flowId: "create-verify-driver",
      driverId,
    });
    return NextResponse.json({ error: "Failed to verify driver" }, { status: 500 });
  }

  // Status codes and wording match PATCH /api/admin/orders/[id]/driver exactly
  // (404 unknown / 400 inactive) so the two admin driver-assignment paths can't
  // report the same condition differently.
  const driver = data as { id: string; is_active: boolean } | null;
  if (!driver) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }
  if (!driver.is_active) {
    return NextResponse.json({ error: "Cannot assign inactive driver" }, { status: 400 });
  }

  return null;
}
