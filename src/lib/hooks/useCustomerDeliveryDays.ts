"use client";

/**
 * useCustomerDeliveryDays — the delivery-day list personalized to the
 * signed-in customer's verified default address.
 *
 * Every pre-checkout countdown (menu banner, rail chip, cart drawer) used to
 * run on ALL active days, so a direction-scoped customer saw urgency for runs
 * that never drive their way — worst on the route-day-invite email's landing
 * path, where "we're driving your way Wednesday" could land on a banner
 * counting down to Monday's East-only run. This hook resolves the same
 * address the invite cron targets (verified default, `created_at` tiebreak)
 * and filters days with the same `addressServesDay` rule checkout enforces,
 * so every surface tells one story.
 *
 * Fail-open by design: anonymous visitors, unverified/coordless addresses,
 * out-of-coverage distances, and a filter that leaves nothing all fall back to
 * the UNFILTERED list with `personalized: false` — a generic-but-true
 * countdown beats a wrong or missing one while browsing. (Checkout itself is
 * the honest gate for the no-serve case.)
 */

import { useEffect, useRef, useState } from "react";
import { isAuthRetryableFetchError } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { filterDaysByDirection, getDirectionsForCoords } from "@/lib/utils/delivery-zones";
import { resolveRouteDayAwareness, type RouteDayAwareness } from "@/lib/delivery/route-awareness";
import type { DeliveryDayConfig, DeliveryZoneConfig } from "@/types/delivery";

/** Awareness (headline copy) can outlive its run — re-derive on a timer. */
const RECHECK_INTERVAL_MS = 60_000;

/** Every field the gate/countdown consumers read — id alone misses admin edits. */
function dayContentKey(d: DeliveryDayConfig): string {
  return `${d.id}:${d.dayOfWeek}:${d.isActive}:${d.cutoffDay}:${d.cutoffHour}:${d.direction ?? ""}`;
}

/**
 * Last successful DB resolution, module-scoped (stale-while-revalidate). The
 * cart drawer mounts its content per OPEN, so without this every open starts
 * from the generic all-days state for the fetch round-trip — a brief wrong
 * countdown + enabled CTA flash for direction-scoped customers. Keyed by
 * USER: seeding checks the (local, no-network) session first, so a sign-out
 * or account switch can never paint the previous user's route while the
 * fresh resolve is in flight. The fresh resolve then overwrites.
 */
let cachedResolution: {
  userId: string | null;
  coords: { lat: number; lng: number } | null;
  distance: number | null;
} | null = null;

export interface CustomerDeliveryDays {
  /** Direction-filtered days when personalized; the input list otherwise. */
  days: DeliveryDayConfig[];
  /** Route-day awareness for the same address — null when nothing honest to say. */
  awareness: RouteDayAwareness | null;
  /** True only when a verified, in-coverage address produced the filter. */
  personalized: boolean;
}

export interface CustomerAddressOverride {
  lat: number;
  lng: number;
  distanceMiles?: number | null;
}

export function useCustomerDeliveryDays(
  deliveryDays: DeliveryDayConfig[],
  deliveryZones: DeliveryZoneConfig[] | undefined,
  maxRadiusMiles?: number | null,
  /**
   * A concretely-chosen address (e.g. the checkout store's selection) that
   * outranks the DB default lookup. While present, no auth/addresses fetch
   * runs at all — the surface that knows WHICH address applies must never be
   * contradicted by a background default-address resolve (the cart drawer on
   * /checkout showed the DEFAULT address's route while checkout used the
   * selected one).
   */
  overrideAddress?: CustomerAddressOverride | null
): CustomerDeliveryDays {
  const [result, setResult] = useState<CustomerDeliveryDays>({
    days: deliveryDays,
    awareness: null,
    personalized: false,
  });

  // Cached so the timer re-runs only the pure resolvers — never the auth +
  // addresses round-trip (mirrors RouteDayCallout's pattern).
  const coordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const distanceRef = useRef<number | null>(null);

  const overrideLat = overrideAddress?.lat;
  const overrideLng = overrideAddress?.lng;
  const overrideDistance = overrideAddress?.distanceMiles;

  useEffect(() => {
    let cancelled = false;
    // Guards overlapping resolves: a visibilitychange can start a second
    // resolve() while the first is in flight, and the SLOWER one would
    // otherwise publish last — pinning stale coords into the refs the minute
    // timer then replays indefinitely. Only the latest generation may publish.
    let generation = 0;
    // Set once the first resolve() publishes — the async cache seed must
    // never overwrite a fresher resolution that landed before it.
    let resolvePublished = false;

    function applyResolved(coords: { lat: number; lng: number } | null) {
      const zones = deliveryZones ?? [];
      const distance = distanceRef.current;
      const outOfCoverage = distance != null && maxRadiusMiles != null && distance > maxRadiusMiles;

      let days = deliveryDays;
      let personalized = false;
      if (coords && zones.length > 0 && !outOfCoverage) {
        const directions = getDirectionsForCoords(coords.lat, coords.lng, zones);
        // ACTIVE rows only — filterDaysByDirection doesn't know isActive, so
        // an admin-disabled direction row would "succeed" personalization
        // with a list the delivery gate then empties (drawer reporting no
        // delivery while other active runs exist).
        const filtered = filterDaysByDirection(
          directions,
          deliveryDays.filter((d) => d.isActive)
        );
        // Empty filter = no ACTIVE run serves this address. The menu/cart
        // surfaces aren't the place to announce that (checkout's empty state
        // is) — fall back to the generic list rather than a dead countdown.
        if (filtered.length > 0) {
          days = filtered;
          personalized = true;
        }
      }

      // Same zones gate as personalization above — resolveRouteDayAwareness
      // falls back to DEFAULT_ZONES for empty input, and letting the two read
      // the same prop differently is a latent trap for any future consumer of
      // `awareness` that skips the `personalized` guard.
      const awareness =
        zones.length > 0
          ? resolveRouteDayAwareness({
              coords,
              deliveryDays,
              deliveryZones: zones,
              distanceMiles: distance,
              maxRadiusMiles,
            })
          : null;

      // filterDaysByDirection builds a fresh array per call, so an identity
      // check would re-render every timer tick — compare displayed CONTENT.
      // The comparison must cover every gate-relevant field, not just ids: an
      // admin editing a day's cutoff hour (same ids) must propagate, or the
      // countdown keeps the old deadline until remount.
      setResult((prev) =>
        prev.personalized === personalized &&
        prev.days.length === days.length &&
        prev.days.every((d, i) => dayContentKey(d) === dayContentKey(days[i])) &&
        prev.awareness?.deliveryDateString === awareness?.deliveryDateString &&
        prev.awareness?.cutoffText === awareness?.cutoffText &&
        prev.awareness?.routeLabel === awareness?.routeLabel
          ? prev
          : { days, awareness, personalized }
      );
    }

    async function resolve() {
      const myGeneration = ++generation;
      let coords: { lat: number; lng: number } | null = null;
      let distance: number | null = null;
      let resolvedUserId: string | null = null;
      try {
        const supabase = createClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        // Session-missing / invalid-token results ARE the signed-out answer
        // and must publish (downgrading to the generic list is correct); only
        // a network-class failure means "we don't know" — treat it like the
        // thrown path below and keep the last known route.
        if (userError && isAuthRetryableFetchError(userError)) throw userError;
        resolvedUserId = user?.id ?? null;
        if (user) {
          // Same audience rule as the route-day-invite cron + RouteDayCallout:
          // verified default address, created_at tiebreak. Unverified is an
          // unconditional checkout reject — never personalize on one.
          const { data, error } = await supabase
            .from("addresses")
            .select("lat, lng, is_default, distance_miles, is_verified")
            .eq("user_id", user.id)
            .order("is_default", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          // PostgREST failures (RLS regression, 5xx) resolve {data:null,
          // error} WITHOUT throwing — surface them as the failure they are,
          // or a failed visibility refresh would publish "no address" over a
          // good resolution.
          if (error) throw error;
          const row = data as {
            lat: number | null;
            lng: number | null;
            distance_miles?: number | null;
            is_verified?: boolean;
          } | null;
          if (row?.lat != null && row?.lng != null && row.is_verified) {
            coords = { lat: row.lat, lng: row.lng };
            distance = row.distance_miles ?? null;
          }
        }
      } catch (err) {
        // A real persistent read failure (RLS regression, renamed column)
        // would otherwise silently degrade every signed-in customer with
        // zero telemetry — capture when we were actually online (offline is
        // the expected fail-open path).
        if (typeof navigator === "undefined" || navigator.onLine) {
          import("@sentry/nextjs").then((s) => s.captureException(err)).catch(() => {});
        }
        if (cancelled || myGeneration !== generation) return;
        // A failed READ says nothing about the route — replay the last
        // successful coords (refs + module cache untouched, resolvePublished
        // stays false so a pending seed may still land) instead of
        // downgrading a personalized surface to the generic gate. With
        // nothing resolved yet the refs are null, so first-mount failures
        // still render the fail-open generic list — but with the CURRENT
        // props (an admin day edit mid-outage must not pin the old list).
        applyResolved(coordsRef.current);
        return;
      }
      if (cancelled || myGeneration !== generation) return;
      resolvePublished = true;
      coordsRef.current = coords;
      distanceRef.current = distance;
      cachedResolution = { userId: resolvedUserId, coords, distance };
      applyResolved(coords);
    }

    // Seed from the cache ONLY after confirming (via the local, no-network
    // session read) that it belongs to the CURRENT user — a sign-out or
    // account switch must never paint the previous user's route while the
    // fresh resolve is in flight. resolvePublished guards ordering: a fresh
    // resolve that lands first must not be overwritten by the stale seed.
    async function seedFromCache() {
      if (!cachedResolution) return;
      try {
        const {
          data: { session },
        } = await createClient().auth.getSession();
        if (cancelled || resolvePublished || !cachedResolution) return;
        if ((session?.user?.id ?? null) !== cachedResolution.userId) return;
        coordsRef.current = cachedResolution.coords;
        distanceRef.current = cachedResolution.distance;
        applyResolved(cachedResolution.coords);
      } catch {
        // Seeding is best-effort — resolve() is already in flight.
      }
    }

    if (overrideLat != null && overrideLng != null) {
      // Concrete address supplied — no fetch, no focus re-fetch; the timer
      // below still re-runs the pure resolvers so a passed cutoff rolls over.
      coordsRef.current = { lat: overrideLat, lng: overrideLng };
      distanceRef.current = overrideDistance ?? null;
      applyResolved(coordsRef.current);
      const recheck = setInterval(() => {
        if (!cancelled) applyResolved(coordsRef.current);
      }, RECHECK_INTERVAL_MS);
      return () => {
        cancelled = true;
        clearInterval(recheck);
      };
    }

    // Stale-while-revalidate: paint the last known resolution (user-checked
    // inside seedFromCache) so a remount doesn't flash the generic gate while
    // the round-trip runs; resolve() refreshes it.
    void seedFromCache();
    void resolve();

    // Focus re-fetches (sign-in/out, address edits in another tab); the timer
    // re-runs only the pure resolvers so a passed cutoff rolls the awareness
    // forward without a network call.
    const onVisible = () => {
      if (document.visibilityState === "visible") void resolve();
    };
    const recheck = setInterval(() => {
      if (!cancelled) applyResolved(coordsRef.current);
    }, RECHECK_INTERVAL_MS);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearInterval(recheck);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [deliveryDays, deliveryZones, maxRadiusMiles, overrideLat, overrideLng, overrideDistance]);

  return result;
}

/** Test-only: clears the module-level stale-while-revalidate cache. */
export function __resetCustomerDeliveryDaysCache(): void {
  cachedResolution = null;
}

export default useCustomerDeliveryDays;
