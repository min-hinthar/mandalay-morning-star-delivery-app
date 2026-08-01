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

import { createClient } from "@/lib/supabase/client";
import { filterDaysByDirection, getDirectionsForCoords } from "@/lib/utils/delivery-zones";
import { resolveRouteDayAwareness, type RouteDayAwareness } from "@/lib/delivery/route-awareness";
import type { DeliveryDayConfig, DeliveryZoneConfig } from "@/types/delivery";

/** Awareness (headline copy) can outlive its run — re-derive on a timer. */
const RECHECK_INTERVAL_MS = 60_000;

export interface CustomerDeliveryDays {
  /** Direction-filtered days when personalized; the input list otherwise. */
  days: DeliveryDayConfig[];
  /** Route-day awareness for the same address — null when nothing honest to say. */
  awareness: RouteDayAwareness | null;
  /** True only when a verified, in-coverage address produced the filter. */
  personalized: boolean;
}

export function useCustomerDeliveryDays(
  deliveryDays: DeliveryDayConfig[],
  deliveryZones: DeliveryZoneConfig[] | undefined,
  maxRadiusMiles?: number | null
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

  useEffect(() => {
    let cancelled = false;

    function applyResolved(coords: { lat: number; lng: number } | null) {
      const zones = deliveryZones ?? [];
      const distance = distanceRef.current;
      const outOfCoverage = distance != null && maxRadiusMiles != null && distance > maxRadiusMiles;

      let days = deliveryDays;
      let personalized = false;
      if (coords && zones.length > 0 && !outOfCoverage) {
        const directions = getDirectionsForCoords(coords.lat, coords.lng, zones);
        const filtered = filterDaysByDirection(directions, deliveryDays);
        // Empty filter = no run serves this address. The menu/cart surfaces
        // aren't the place to announce that (checkout's empty state is) — fall
        // back to the generic list rather than a dead countdown.
        if (filtered.length > 0) {
          days = filtered;
          personalized = true;
        }
      }

      const awareness = resolveRouteDayAwareness({
        coords,
        deliveryDays,
        deliveryZones,
        distanceMiles: distance,
        maxRadiusMiles,
      });

      // filterDaysByDirection builds a fresh array per call, so an identity
      // check would re-render every timer tick — compare displayed content.
      setResult((prev) =>
        prev.personalized === personalized &&
        prev.days.length === days.length &&
        prev.days.every((d, i) => d.id === days[i].id) &&
        prev.awareness?.deliveryDateString === awareness?.deliveryDateString &&
        prev.awareness?.cutoffText === awareness?.cutoffText &&
        prev.awareness?.routeLabel === awareness?.routeLabel
          ? prev
          : { days, awareness, personalized }
      );
    }

    async function resolve() {
      let coords: { lat: number; lng: number } | null = null;
      distanceRef.current = null;
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          // Same audience rule as the route-day-invite cron + RouteDayCallout:
          // verified default address, created_at tiebreak. Unverified is an
          // unconditional checkout reject — never personalize on one.
          const { data } = await supabase
            .from("addresses")
            .select("lat, lng, is_default, distance_miles, is_verified")
            .eq("user_id", user.id)
            .order("is_default", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          const row = data as {
            lat: number | null;
            lng: number | null;
            distance_miles?: number | null;
            is_verified?: boolean;
          } | null;
          if (row?.lat != null && row?.lng != null && row.is_verified) {
            coords = { lat: row.lat, lng: row.lng };
            distanceRef.current = row.distance_miles ?? null;
          }
        }
      } catch {
        // Anonymous or offline — generic list.
      }
      if (cancelled) return;
      coordsRef.current = coords;
      applyResolved(coords);
    }

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
  }, [deliveryDays, deliveryZones, maxRadiusMiles]);

  return result;
}

export default useCustomerDeliveryDays;
