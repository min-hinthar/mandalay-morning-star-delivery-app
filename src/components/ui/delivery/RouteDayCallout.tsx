"use client";

/**
 * RouteDayCallout — "we're driving your way" awareness.
 *
 * Shows the NEXT delivery run that actually serves this customer's address,
 * with the ordering deadline. The signal is the SCHEDULE, not other people's
 * orders: it's true at any order volume and leaks nothing about anyone else.
 *
 * Guardrails: real values only (renders nothing when there's no open run);
 * dismissal is scoped to the delivery DATE so a new run re-surfaces once but a
 * dismissed run stays gone; opaque warm-paper surface (no backdrop-filter /
 * blur on mobile — iOS GPU budget); reduced-motion honored; bilingual EN/MY.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import { ArrowRight, Clock, Truck, X } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { HeroCardLayers } from "@/components/ui/homepage/Hero/HeroCardLayers";
import {
  resolveRouteDayAwareness,
  routeDayHeadline,
  type RouteDayAwareness,
} from "@/lib/delivery/route-awareness";
import type { DeliveryDayConfig, DeliveryZoneConfig } from "@/types/delivery";

const DISMISS_PREFIX = "route-day-callout-dismissed:";

/**
 * How often to re-check the deadline on an open tab.
 *
 * visibilitychange alone isn't enough: a homepage left OPEN and visible across
 * the cutoff never fires it, so the card would keep advertising a deadline that
 * has already passed. This re-runs the pure resolver against cached coords —
 * no network, no auth call — so it's cheap enough to sit on a timer.
 */
const RECHECK_INTERVAL_MS = 60_000;

export interface RouteDayCalloutProps {
  deliveryDays: DeliveryDayConfig[];
  deliveryZones?: DeliveryZoneConfig[];
  className?: string;
}

export function RouteDayCallout({ deliveryDays, deliveryZones, className }: RouteDayCalloutProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const [awareness, setAwareness] = useState<RouteDayAwareness | null>(null);
  const [dismissed, setDismissed] = useState(true); // hidden until resolved (hydration-safe)

  // Cached so the periodic re-check re-runs only the pure resolver, never the
  // auth + addresses round-trip.
  const coordsRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    let cancelled = false;

    function applyResolved(coords: { lat: number; lng: number } | null) {
      const next = resolveRouteDayAwareness({ coords, deliveryDays, deliveryZones });
      // The resolver builds a fresh object every call, so setting it
      // unconditionally would re-render the banner on every timer tick. Every
      // field is derived from the delivery date, so that's the only one worth
      // comparing — equal date means an identical result.
      setAwareness((prev) => (prev?.deliveryDateString === next?.deliveryDateString ? prev : next));
      setDismissed(
        next ? localStorage.getItem(`${DISMISS_PREFIX}${next.deliveryDateString}`) === "true" : true
      );
    }

    async function resolve() {
      // Personalize when we know where they are; otherwise show the plain
      // schedule fact, which is still useful to a logged-out visitor.
      let coords: { lat: number; lng: number } | null = null;
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("addresses")
            .select("lat, lng, is_default")
            .eq("user_id", user.id)
            .order("is_default", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (data?.lat != null && data?.lng != null) coords = { lat: data.lat, lng: data.lng };
        }
      } catch {
        // Anonymous or offline — fall through to the generic signal.
      }
      if (cancelled) return;

      coordsRef.current = coords;
      applyResolved(coords);
    }

    void resolve();

    // Re-resolve when the tab regains focus, AND on a timer. Focus alone misses
    // the case that matters most: a homepage left open and VISIBLE straight
    // through the cutoff never fires visibilitychange, so it would keep
    // advertising a deadline that has already passed. The timer re-runs only the
    // pure resolver (which returns null once the run closes), so it costs
    // nothing per tick; the focus listener still covers a tab waking from
    // background, where timers are throttled or paused.
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
  }, [deliveryDays, deliveryZones]);

  const handleDismiss = useCallback(() => {
    if (awareness) {
      localStorage.setItem(`${DISMISS_PREFIX}${awareness.deliveryDateString}`, "true");
    }
    setDismissed(true);
  }, [awareness]);

  const visible = !!awareness && !dismissed;

  return (
    <AnimatePresence>
      {visible && awareness && (
        <m.aside
          initial={shouldAnimate ? { opacity: 0, y: 12 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          exit={shouldAnimate ? { opacity: 0, y: -8 } : undefined}
          transition={getSpring(spring.gentle)}
          aria-label="Upcoming delivery run"
          className={cn("relative", className)}
        >
          <div className="hero-surface-vellum relative overflow-hidden rounded-2xl">
            <HeroCardLayers accent="clay" radius="rounded-2xl" />

            <div className="relative flex items-start gap-3 p-4 pr-11 sm:items-center sm:p-5 sm:pr-12">
              {/* Route mark */}
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-hero-clay/30 bg-hero-clay/12"
              >
                <Truck className="h-5 w-5 text-hero-accent" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="font-display text-base font-semibold leading-tight text-hero-ink sm:text-lg">
                  {routeDayHeadline(awareness)}
                </p>
                <p className="font-burmese text-2xs text-hero-ink-muted sm:text-xs" lang="my">
                  သင့်ဒေသသို့ ပို့ဆောင်မည်
                </p>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-hero-ink-muted sm:text-sm">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-hero-accent" aria-hidden="true" />
                  <span>{awareness.cutoffText}</span>
                </p>
              </div>

              {/* CTA — ≥44px tap target on mobile */}
              <Link
                href="/menu"
                className={cn(
                  "hidden shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 sm:inline-flex",
                  "bg-hero-ink text-sm font-semibold text-hero-card-strong",
                  "transition-transform hover:scale-[1.03] focus-visible:outline-none",
                  "focus-visible:ring-2 focus-visible:ring-hero-accent focus-visible:ring-offset-2"
                )}
              >
                Order now
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            {/* Mobile CTA — full width under the copy */}
            <Link
              href="/menu"
              className={cn(
                "relative mx-4 mb-4 flex min-h-11 items-center justify-center gap-1.5 rounded-full sm:hidden",
                "bg-hero-ink text-sm font-semibold text-hero-card-strong",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hero-accent"
              )}
            >
              Order now
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>

            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss delivery run notice"
              className={cn(
                "absolute right-1.5 top-1.5 z-10 flex h-11 w-11 items-center justify-center rounded-full",
                "text-hero-ink-muted transition-colors hover:bg-hero-ink/8 hover:text-hero-ink",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hero-accent"
              )}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </m.aside>
      )}
    </AnimatePresence>
  );
}

export default RouteDayCallout;
