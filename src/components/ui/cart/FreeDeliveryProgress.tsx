"use client";

/**
 * FreeDeliveryProgress — the "Morning Star delivery journey".
 *
 * After Dark: a warm-paper callout (mirrors the checkout receipt's
 * free-delivery row) with a clay→amber→sage progress fill, a small Morning
 * Star marker that rides the fill toward a goal star, and — on unlock — a
 * tasteful sparkle burst + a bilingual sage "free delivery" stamp.
 *
 * Guardrails: animates REAL values only (no fabricated progress); opaque
 * surface + radial-gradient glows (no blur / backdrop-filter — iOS GPU
 * budget); every loop gates on `shouldAnimate`; bilingual EN/MY.
 */

import { useRef } from "react";
import { m, useInView } from "framer-motion";
import { Star, Sparkles, Truck } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useCartStore } from "@/lib/stores/cart-store";
import { freeDeliveryQualifier, localRangeLabel } from "@/lib/utils/delivery-promo";

// ============================================
// TYPES
// ============================================

export interface FreeDeliveryProgressProps {
  /** Remaining cents until free delivery (0 = free delivery unlocked) */
  amountToFreeDelivery: number;
  /** Additional className */
  className?: string;
  /** Whether address is in extended delivery range (>25mi) */
  isExtendedRange?: boolean;
}

// Sparkle burst offsets (deg) — fired once when free delivery unlocks.
const BURST = [-60, -20, 20, 60, 110, 160];

// ============================================
// MAIN COMPONENT
// ============================================

export function FreeDeliveryProgress({
  amountToFreeDelivery,
  className,
  isExtendedRange = false,
}: FreeDeliveryProgressProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  // Gate the continuous marker/goal loops to in-view (cart also renders on the
  // scrollable /cart page) — framer JS loops keep ticking offscreen otherwise.
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { margin: "0px 0px -10% 0px" });
  const freeDeliveryThresholdCents = useCartStore((state) => state.freeDeliveryThresholdCents);
  const longDistanceFeeCents = useCartStore((state) => state.longDistanceFeeCents);
  const longDistanceThresholdMiles = useCartStore((state) => state.longDistanceThresholdMiles);
  const promoOpts = {
    freeDeliveryThresholdCents,
    longDistanceFeeCents,
    longDistanceThresholdMiles,
  };

  const progressPercent = Math.min(
    100,
    Math.max(
      0,
      ((freeDeliveryThresholdCents - amountToFreeDelivery) / freeDeliveryThresholdCents) * 100
    )
  );

  const hasFreeDelivery = amountToFreeDelivery <= 0;
  const nearGoal = progressPercent >= 88;
  const loop = shouldAnimate && inView;

  // Extended range: show flat-fee notice instead of the journey (mirrors receipt)
  if (isExtendedRange) {
    return (
      <div className={className}>
        <m.div
          initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={getSpring(spring.gentle)}
          className="rounded-xl border border-hero-blue/25 bg-hero-card p-3"
        >
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-hero-blue" aria-hidden="true" />
            <span className="text-sm font-semibold text-hero-ink">
              Extended delivery: ${(longDistanceFeeCents / 100).toFixed(2)} flat fee
            </span>
          </div>
          <p className="mt-1 pl-6 font-burmese text-xs text-hero-ink-muted" lang="my">
            ဝေးကွာသောပို့ဆောင်မှု
          </p>
        </m.div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className={className}>
      {/* Journey (in progress) */}
      {!hasFreeDelivery && (
        <m.div
          initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={getSpring(spring.gentle)}
          className="rounded-xl border border-hero-clay/25 bg-hero-card p-3"
        >
          <div className="mb-2.5 flex items-center gap-2">
            <m.span
              animate={
                shouldAnimate ? { rotate: [0, 14, -14, 0], scale: [1, 1.14, 1.14, 1] } : undefined
              }
              transition={{ duration: 0.7, repeat: 4, repeatDelay: 2.6 }}
              className="shrink-0"
            >
              <Star className="h-4 w-4 fill-amber-400 text-amber-500" aria-hidden="true" />
            </m.span>
            <span className="text-sm font-semibold text-hero-ink">
              <span className="text-hero-accent">${(amountToFreeDelivery / 100).toFixed(2)}</span>{" "}
              more for free delivery
            </span>
          </div>

          {/* The journey track — fill + a Morning Star convoy riding the frontier */}
          <div className="relative px-1.5">
            <div className="relative h-2.5 overflow-hidden rounded-full bg-hero-ink/10">
              <m.div
                className="checkout-progress-fill h-full rounded-full"
                initial={shouldAnimate ? { width: 0 } : undefined}
                animate={{ width: `${progressPercent}%` }}
                transition={getSpring(spring.rubbery)}
              />
              {/* Comet trail — a warm gradient streak chasing the fill frontier
                  (clipped by the track; pure gradient, no blur) */}
              {shouldAnimate && progressPercent > 8 && (
                <m.div
                  aria-hidden="true"
                  className="absolute top-0 h-full"
                  initial={{ left: "0%", width: "0%" }}
                  animate={{
                    left: `${Math.max(0, progressPercent - 18)}%`,
                    width: `${Math.min(18, progressPercent)}%`,
                  }}
                  transition={getSpring(spring.rubbery)}
                  style={{
                    background: "linear-gradient(to right, transparent, rgba(251,191,36,0.55))",
                  }}
                />
              )}
            </div>

            {/* Goal star at the finish — lights up as you approach */}
            <m.div
              aria-hidden="true"
              className="absolute right-0 top-1/2 flex h-6 w-6 -translate-y-1/2 translate-x-2 items-center justify-center rounded-full border border-hero-sage/50 bg-hero-card"
              animate={
                loop && nearGoal
                  ? {
                      scale: [1, 1.16, 1],
                      boxShadow: [
                        "0 0 0 0 rgba(120,140,93,0)",
                        "0 0 10px 2px rgba(120,140,93,0.45)",
                        "0 0 0 0 rgba(120,140,93,0)",
                      ],
                    }
                  : undefined
              }
              transition={{ duration: 1.4, repeat: Infinity }}
            >
              <Star
                className={cn(
                  "h-3.5 w-3.5",
                  nearGoal ? "fill-hero-sage text-hero-sage" : "text-hero-sage/60"
                )}
              />
            </m.div>

            {/* Convoy — two smaller stars trailing the lead marker, phase-shifted
                bobs (renders only once there's road behind the convoy) */}
            {shouldAnimate &&
              progressPercent >= 14 &&
              [
                { back: 8, size: "h-4 w-4", star: "h-2 w-2", opacity: 0.85, delay: 0.25 },
                { back: 15, size: "h-3 w-3", star: "h-1.5 w-1.5", opacity: 0.6, delay: 0.5 },
              ].map((c) => (
                <m.div
                  key={c.back}
                  aria-hidden="true"
                  className="absolute top-1/2"
                  initial={{ left: "0%" }}
                  animate={{ left: `${Math.max(2, progressPercent - c.back)}%` }}
                  transition={getSpring(spring.rubbery)}
                  style={{ translateX: "-50%", translateY: "-50%", opacity: c.opacity }}
                >
                  <m.div
                    className={cn(
                      "flex items-center justify-center rounded-full border border-amber-400/70 bg-hero-clay/80",
                      c.size
                    )}
                    animate={loop ? { y: [0, -2, 0] } : undefined}
                    transition={{
                      duration: 1.6,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: c.delay,
                    }}
                  >
                    <Star className={cn("fill-amber-300 text-amber-200", c.star)} />
                  </m.div>
                </m.div>
              ))}

            {/* Morning Star marker — leads the convoy with a gentle bob */}
            <m.div
              aria-hidden="true"
              className="absolute top-1/2"
              initial={shouldAnimate ? { left: "0%" } : { left: `${progressPercent}%` }}
              animate={{ left: `${progressPercent}%` }}
              transition={getSpring(spring.rubbery)}
              style={{ translateX: "-50%", translateY: "-50%" }}
            >
              <m.div
                className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-amber-400 bg-hero-clay shadow-md"
                animate={loop ? { y: [0, -2.5, 0] } : undefined}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              >
                <Star className="h-3 w-3 fill-amber-300 text-amber-200" />
              </m.div>
            </m.div>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-xs">
            <span className="font-medium text-hero-accent">
              {Math.round(progressPercent)}% there
            </span>
            <span className="font-medium text-hero-ink-muted">
              Free at ${(freeDeliveryThresholdCents / 100).toFixed(0)}
            </span>
          </div>

          {/* Honest qualifier — free delivery applies to local orders only */}
          <p className="mt-1.5 text-2xs leading-snug text-hero-ink-muted/80">
            Free {freeDeliveryQualifier(promoOpts)}
          </p>
        </m.div>
      )}

      {/* Unlocked — sparkle burst + bilingual sage stamp */}
      {hasFreeDelivery && (
        <m.div
          initial={shouldAnimate ? { opacity: 0, scale: 0.92 } : undefined}
          animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
          transition={getSpring(spring.ultraBouncy)}
          className="relative overflow-hidden rounded-xl border border-hero-sage/30 bg-hero-card p-3"
        >
          <div className="flex items-center gap-3">
            {/* Wax-seal-style stamp that settles in with a slight rotate */}
            <m.div
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-hero-sage/40 bg-hero-sage/15"
              initial={shouldAnimate ? { rotate: -16, scale: 0.7 } : undefined}
              animate={shouldAnimate ? { rotate: 0, scale: 1 } : undefined}
              transition={getSpring(spring.ultraBouncy)}
            >
              <Star className="h-5 w-5 fill-hero-sage text-hero-sage" aria-hidden="true" />
              {/* One-shot sparkle burst on unlock */}
              {shouldAnimate &&
                BURST.map((deg, i) => (
                  <m.span
                    key={deg}
                    aria-hidden="true"
                    className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-amber-400"
                    initial={{ opacity: 1, x: "-50%", y: "-50%", scale: 1 }}
                    animate={{
                      opacity: 0,
                      x: `calc(-50% + ${Math.cos((deg * Math.PI) / 180) * 22}px)`,
                      y: `calc(-50% + ${Math.sin((deg * Math.PI) / 180) * 22}px)`,
                      scale: 0.4,
                    }}
                    transition={{ duration: 0.7, delay: 0.1 + i * 0.02, ease: "easeOut" }}
                  />
                ))}
            </m.div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-hero-ink">Free delivery unlocked</span>
                <Sparkles className="h-4 w-4 text-hero-sage" aria-hidden="true" />
              </div>
              <span className="font-burmese text-xs text-hero-ink-muted" lang="my">
                အခမဲ့ပို့ဆောင်ပြီ · {localRangeLabel(promoOpts)}
              </span>
            </div>
          </div>
        </m.div>
      )}
    </div>
  );
}

export default FreeDeliveryProgress;
