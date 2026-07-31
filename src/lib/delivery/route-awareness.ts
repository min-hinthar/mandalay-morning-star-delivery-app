import type { DeliveryDayConfig, DeliveryDirection, DeliveryZoneConfig } from "@/types/delivery";
import {
  DEFAULT_ZONES,
  filterDaysByDirection,
  getDirectionLabel,
  getDirectionsForCoords,
  isNearbyAddress,
} from "@/lib/utils/delivery-zones";
import {
  getCutoffForDeliveryDay,
  getNextDeliveryDate,
  getZonedDateString,
  getZonedDayOfWeek,
} from "@/lib/utils/delivery-dates";
import { DAY_NAMES_FULL, getNextCutoffText } from "@/lib/utils/delivery-schedule";

/**
 * "We're driving your way" — route-day awareness.
 *
 * The signal is the SCHEDULE, not other people's orders: a route day exists
 * because it's configured, so this is true and useful at any order volume and
 * reveals nothing about any other customer. (A neighbour-count nudge was
 * considered and rejected: at current density it would read 0 nearly always,
 * and a count of 1 in a named area effectively identifies a household.)
 *
 * Pure + synchronous — the caller supplies business rules and `now`, so this is
 * fully unit-testable and safe on both server and client.
 */

export interface RouteDayAwareness {
  /** Zone directions the address falls in. Empty ⇒ local/nearby (all days serve it). */
  directions: Exclude<DeliveryDirection, "all">[];
  /** e.g. "West Route" — null when the run serves all directions (or address is local). */
  routeLabel: string | null;
  /** Next delivery date still open for ordering. */
  deliveryDate: Date;
  /** LA-zoned `YYYY-MM-DD` for the delivery date. */
  deliveryDateString: string;
  /** e.g. "Wednesday" */
  dayName: string;
  /** e.g. "Order by Tuesday 3 PM for Wednesday delivery" */
  cutoffText: string;
  /** Exact moment ordering closes for this run — lets senders time a nudge. */
  cutoffAt: Date;
  /** True when the address is close enough that every delivery day serves it. */
  isLocal: boolean;
}

export interface RouteDayAwarenessInput {
  /** Customer's saved address coords. Omit for the generic (logged-out) signal. */
  coords?: { lat: number; lng: number } | null;
  deliveryDays: DeliveryDayConfig[];
  deliveryZones?: DeliveryZoneConfig[];
  now?: Date;
  /**
   * Persisted drive distance for the address, when known. Pass together with
   * `maxRadiusMiles` so an address that no longer falls inside coverage is
   * suppressed — a bearing exists for ANY coordinate, so without this a
   * previously-verified far address keeps matching a route long after the
   * operator lowers the radius, and checkout answers OUT_OF_COVERAGE.
   * Null/undefined means unknown, which is treated as in-range rather than
   * silencing customers whose distance was never backfilled.
   */
  distanceMiles?: number | null;
  maxRadiusMiles?: number | null;
}

/**
 * Resolve the next delivery run that actually serves this address.
 *
 * Returns null when there's nothing honest to say — no active days, no upcoming
 * open window, or the address's direction matches no configured run. Callers
 * render nothing in that case rather than inventing a date.
 */
export function resolveRouteDayAwareness({
  coords,
  deliveryDays,
  deliveryZones,
  now = new Date(),
  distanceMiles,
  maxRadiusMiles,
}: RouteDayAwarenessInput): RouteDayAwareness | null {
  const activeDays = deliveryDays.filter((d) => d.isActive);
  if (activeDays.length === 0) return null;

  // Out of coverage ⇒ say nothing. A compass bearing exists for every
  // coordinate, so direction matching alone would keep advertising a run to an
  // address the operator has since put out of range — and checkout would answer
  // OUT_OF_COVERAGE. `== null` on purpose: 0 is a real distance.
  if (distanceMiles != null && maxRadiusMiles != null && distanceMiles > maxRadiusMiles) {
    return null;
  }

  const zones = deliveryZones && deliveryZones.length > 0 ? deliveryZones : DEFAULT_ZONES;

  let directions: Exclude<DeliveryDirection, "all">[] = [];
  let eligibleDays = activeDays;
  let isLocal = true;

  if (coords && Number.isFinite(coords.lat) && Number.isFinite(coords.lng)) {
    directions = getDirectionsForCoords(coords.lat, coords.lng, zones);
    isLocal = isNearbyAddress(directions);
    // Always filter, including the nearby (`[]`) case — filterDaysByDirection
    // now routes through addressServesDay, which reads `[]` as "every
    // direction" rather than "no direction". So a nearby address keeps every
    // active day here AND clears checkout's gate, which is the invariant this
    // banner lives or dies by: it must promise only what checkout accepts.
    // (Before, `[]` matched only the `all` run in both places, which is why
    // this branch used to be deliberately conservative.)
    eligibleDays = filterDaysByDirection(directions, activeDays);
    // Direction matches no configured run — say nothing rather than quote a
    // day this address can't actually be served on.
    if (eligibleDays.length === 0) return null;
  } else {
    // No coords (logged-out visitor, or no saved address) means we do NOT know
    // this person is local — only that we can't place them. Falling through to
    // every active day would quote the nearest run outright, e.g. "we're
    // delivering this Monday" to a West-side visitor on an East-only Monday:
    // the same overstatement the directional branch above returns null to
    // avoid. So advertise only runs that serve EVERY direction ("all"), which
    // is true for whoever is reading. If none is configured, say nothing.
    //
    // Strictly `=== "all"`, matching filterDaysByDirection on the known-address
    // branch. `direction` is OPTIONAL on DeliveryDayConfig, and that filter
    // drops an undefined-direction day — so treating undefined as all-serving
    // here would advertise to a logged-out visitor a run the directional path
    // refuses to serve.
    isLocal = false;
    eligibleDays = activeDays.filter((d) => d.direction === "all");
    if (eligibleDays.length === 0) return null;
  }

  const deliveryDate = getNextDeliveryDate(now, eligibleDays);
  if (!deliveryDate) return null;

  const dayOfWeek = getZonedDayOfWeek(deliveryDate);
  const dayConfig = eligibleDays.find((d) => d.isActive && d.dayOfWeek === dayOfWeek);
  // A miss means the schedule changed mid-resolve — say nothing. This single
  // check also covers the cutoff text: getNextCutoffText resolves its config
  // from the same array with the same predicate, so it can only return its
  // "no windows" sentinel when dayConfig is already undefined. Don't re-test
  // for that sentinel by string — it's unreachable, and comparing the literal
  // silently decouples if delivery-schedule.ts ever rewords it.
  if (!dayConfig) return null;
  const cutoffText = getNextCutoffText(dayOfWeek, eligibleDays);

  return {
    directions,
    // Name the run ONLY when this address is genuinely direction-scoped. A local
    // address is served by every day, so labelling it with whichever direction
    // that day happens to carry ("the East Route") would be misleading.
    routeLabel:
      !isLocal && dayConfig.direction && dayConfig.direction !== "all"
        ? getDirectionLabel(dayConfig.direction)
        : null,
    deliveryDate,
    deliveryDateString: getZonedDateString(deliveryDate),
    dayName: DAY_NAMES_FULL[dayOfWeek],
    cutoffText,
    cutoffAt: getCutoffForDeliveryDay(deliveryDate, dayConfig),
    isLocal,
  };
}

/**
 * Headline for the awareness surfaces. Names the run when the address sits on a
 * direction-specific route ("We're driving the West Route this Wednesday"), and
 * falls back to the plain schedule fact otherwise.
 */
export function routeDayHeadline(awareness: RouteDayAwareness): string {
  return awareness.routeLabel
    ? `We're driving the ${awareness.routeLabel} this ${awareness.dayName}`
    : `We're delivering this ${awareness.dayName}`;
}
