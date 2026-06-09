"use client";

/**
 * ETA Countdown — the After Dark "arriving in" hero.
 *
 * - ≤ 30 min: big rolling-digit countdown + a triad progress ring
 * - > 30 min: arrival time window
 * - ≤ 5 min: pulsing "Almost here" badge
 * Warm-paper card, bilingual, rolling digits keep an sr-only real value,
 * loops gate on shouldAnimate + in-view. Live tick via useSafeInterval.
 */

import { useRef, useState, useEffect } from "react";
import { m, useInView } from "framer-motion";
import { Navigation, Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { RollingNumber } from "@/components/ui/homepage/Hero/RollingDigits";
import { HeroCardLayers } from "@/components/ui/homepage/Hero/HeroCardLayers";
import { formatArrivalTime } from "@/lib/utils/eta";
import { useSafeInterval } from "@/lib/hooks/useSafeEffects/useSafeInterval";

export interface ETACountdownProps {
  minMinutes: number;
  maxMinutes: number;
  estimatedArrival: string;
  isCalculating?: boolean;
  isNearby?: boolean;
  className?: string;
}

// ============================================
// PROGRESS RING — triad gradient (token-pure: CSS-var stops, no raw hex)
// ============================================

function ProgressRing({
  progress,
  size = 116,
  strokeWidth = 8,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
}) {
  const { shouldAnimate } = useAnimationPreference();
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.max(0, Math.min(100, progress)) / 100) * circumference;

  return (
    <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--hero-line)"
        strokeWidth={strokeWidth}
      />
      <m.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#etaTriad)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={shouldAnimate ? { strokeDashoffset: circumference } : { strokeDashoffset: offset }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
      <defs>
        <linearGradient id="etaTriad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--hero-clay)" />
          <stop offset="55%" stopColor="var(--hero-gold)" />
          <stop offset="100%" stopColor="var(--hero-sage)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ============================================
// ALMOST HERE BADGE
// ============================================

function AlmostHereBadge({ loop, shouldAnimate }: { loop: boolean; shouldAnimate: boolean }) {
  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, scale: 0.9 } : undefined}
      animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
      className="flex items-center gap-3 rounded-xl border border-hero-sage/30 bg-hero-sage/10 px-4 py-3"
    >
      <m.div
        animate={loop ? { scale: [1, 1.2, 1] } : undefined}
        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-hero-sage/20"
      >
        <Zap className="h-4 w-4 text-hero-sage" aria-hidden="true" />
      </m.div>
      <div>
        <p className="text-sm font-semibold text-hero-ink">Almost here!</p>
        <p className="font-burmese text-xs text-hero-ink-muted" lang="my">
          မကြာမီရောက်ပါမည်
        </p>
      </div>
    </m.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ETACountdown({
  minMinutes,
  maxMinutes,
  estimatedArrival,
  isCalculating = false,
  isNearby = false,
  className,
}: ETACountdownProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const interval = useSafeInterval();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { margin: "0px 0px -10% 0px" });
  const loop = shouldAnimate && inView;

  const avgMinutes = Math.round((minMinutes + maxMinutes) / 2);
  const [liveMinutes, setLiveMinutes] = useState(avgMinutes);

  useEffect(() => {
    setLiveMinutes(avgMinutes);
  }, [avgMinutes]);

  useEffect(() => {
    if (isCalculating || minMinutes > 30) return;
    interval.set(() => setLiveMinutes((prev) => Math.max(0, prev - 0.5)), 30000);
    return () => interval.clear();
  }, [interval, isCalculating, minMinutes]);

  const isCountdownMode = minMinutes <= 30;
  const displayMinutes = isCountdownMode ? liveMinutes : avgMinutes;
  const progress = Math.max(0, Math.min(100, 100 - (displayMinutes / 60) * 100));
  const roundedMin = Math.max(0, Math.round(liveMinutes));

  if (isCalculating) {
    return (
      <div className={cn("hero-surface-paper relative overflow-hidden rounded-2xl p-6", className)}>
        <HeroCardLayers accent="clay" radius="rounded-2xl" />
        <div className="relative flex items-center gap-4">
          <div className="h-16 w-16 animate-pulse rounded-full bg-hero-ink/10" />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-32 animate-pulse rounded bg-hero-ink/10" />
            <div className="h-4 w-24 animate-pulse rounded bg-hero-ink/10" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <m.div
      ref={rootRef}
      initial={shouldAnimate ? { opacity: 0, y: 16 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={getSpring(spring.default)}
      className={cn("hero-surface-paper relative overflow-hidden rounded-2xl", className)}
    >
      <HeroCardLayers accent="clay" radius="rounded-2xl" />

      <div className="relative p-5">
        <div className="flex items-center gap-5">
          {/* Progress ring with a clay nav glyph */}
          <div className="relative shrink-0">
            <ProgressRing progress={progress} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <m.div
                initial={shouldAnimate ? { scale: 0 } : undefined}
                animate={shouldAnimate ? { scale: 1 } : undefined}
                transition={getSpring(spring.ultraBouncy)}
                className="mb-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-hero-clay/12"
              >
                <Navigation className="h-4 w-4 text-hero-accent" aria-hidden="true" />
              </m.div>
              <p className="text-2xs font-semibold uppercase tracking-wide text-hero-ink-muted">
                ETA
              </p>
            </div>
          </div>

          {/* Countdown (≤30) or time window (>30) */}
          {isCountdownMode ? (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-hero-ink-muted">
                Arriving in
                <span className="ml-1.5 font-burmese text-xs" lang="my">
                  ရောက်ရှိရန်
                </span>
              </p>
              <p className="flex items-baseline gap-1.5 font-display font-bold text-hero-ink">
                <span aria-hidden="true" className="text-5xl tabular-nums">
                  <RollingNumber value={roundedMin} animate={shouldAnimate} />
                </span>
                <span className="sr-only">{roundedMin} minutes</span>
                <span className="text-lg text-hero-ink-muted">min</span>
              </p>
              <p className="mt-0.5 text-xs text-hero-ink-muted" aria-hidden="true">
                ~{Math.max(1, roundedMin)} min away
              </p>
            </div>
          ) : (
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-sm font-medium text-hero-ink-muted">
                Estimated arrival
                <span className="ml-1.5 font-burmese text-xs" lang="my">
                  ခန့်မှန်းချိန်
                </span>
              </p>
              <p className="font-display text-2xl font-bold text-hero-ink">
                {formatArrivalTime(new Date(estimatedArrival))}
              </p>
            </div>
          )}

          {/* Arrival time chip */}
          <div className="shrink-0 text-right">
            <p className="mb-0.5 text-2xs text-hero-ink-muted">Arriving by</p>
            <p className="font-display text-xl font-bold text-hero-accent">
              {formatArrivalTime(new Date(estimatedArrival))}
            </p>
          </div>
        </div>

        {/* Auto-updates note */}
        <div className="mt-4 flex items-center gap-2 border-t border-hero-line/70 pt-3">
          <Clock className="h-4 w-4 text-hero-ink-muted" aria-hidden="true" />
          <span className="text-xs text-hero-ink-muted">
            Updates automatically as your driver moves
          </span>
        </div>
      </div>

      {/* Almost-here badge (≤5 min) */}
      {isNearby && (
        <div className="relative px-5 pb-5">
          <AlmostHereBadge loop={loop} shouldAnimate={shouldAnimate} />
        </div>
      )}
    </m.div>
  );
}

/** Compact pill variant for tight spaces. */
export function ETACountdownCompact({
  minMinutes,
  maxMinutes,
  className,
}: Pick<ETACountdownProps, "minMinutes" | "maxMinutes" | "className">) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  const label =
    minMinutes <= 30
      ? `~${Math.round((minMinutes + maxMinutes) / 2)} min`
      : `${formatArrivalTime(new Date(Date.now() + minMinutes * 60000))} - ${formatArrivalTime(
          new Date(Date.now() + maxMinutes * 60000)
        )}`;

  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, scale: 0.9 } : undefined}
      animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
      transition={getSpring(spring.snappy)}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-hero-clay/25 bg-hero-card px-4 py-2.5",
        className
      )}
    >
      <m.div
        animate={shouldAnimate ? { rotate: [0, 15, -15, 0] } : undefined}
        transition={{ duration: 2, repeat: 5, repeatDelay: 2 }}
      >
        <Navigation className="h-4 w-4 text-hero-accent" aria-hidden="true" />
      </m.div>
      <span className="text-sm font-semibold text-hero-ink">{label}</span>
    </m.div>
  );
}

export default ETACountdown;
