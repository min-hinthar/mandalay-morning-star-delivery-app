import { NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";

/**
 * Should route creation auto-optimize the stop order?
 *
 * The `route_optimization_enabled` operations setting has existed — and been
 * editable in Settings → Operations, labelled "Automatically optimize stop
 * order for efficiency" — while NOTHING read it. Route creation optimized
 * unconditionally, so an admin who switched it OFF still got optimized routes.
 * A control that doesn't control anything is worse than no control.
 *
 * Fails OPEN (true) on a missing row or a read error: optimization is the
 * long-standing default (`settings-defaults.ts` ships it `true`), so an
 * unreadable setting must not silently change how routes are built. Only an
 * explicit `false` disables it.
 *
 * Deliberately does NOT gate POST /api/admin/routes/optimize — the setting
 * says "AUTOMATICALLY optimize", and an admin clicking Optimize is asking for
 * it directly.
 */
export async function isAutoOptimizeEnabled(
  // Thunk for the same reason as below: a structural SupabaseClient subset
  // trips TS2589 against the generated Database generics.
  lookup: () => PromiseLike<{ data: { value: unknown } | null; error: unknown }>
): Promise<boolean> {
  try {
    const { data, error } = await lookup();
    if (error) {
      logger.warn("Could not read route_optimization_enabled — defaulting to enabled", {
        api: "admin/routes",
        flowId: "create-read-optimize-setting",
      });
      return true;
    }
    if (!data) return true;
    // app_settings.value is jsonb, so it can arrive as a boolean or a string
    // depending on how it was written.
    return !(data.value === false || data.value === "false");
  } catch {
    return true;
  }
}

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
