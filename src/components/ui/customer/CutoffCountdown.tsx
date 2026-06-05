"use client";

/**
 * CutoffCountdown — the "Morning Star" delivery-day ritual.
 *
 * Scheduled delivery is the brand's signature, not a limitation: orders close
 * at a per-day cutoff and arrive on a named day. This component turns that
 * cutoff into a living anticipation moment with three calm→urgent→locked
 * phases, instead of a flat "Saturday only" disclaimer.
 *
 * Presentational + deterministic: pass `cutoffAt` (+ optional frozen `now` for
 * stories/SSR). Phase math lives in `@/lib/utils/countdown` and is unit-tested.
 */

import { useEffect, useMemo, useState } from "react";
import { m } from "framer-motion";
import { MoonStar, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { getCountdownState, formatTimeLeft, type CountdownPhase } from "@/lib/utils/countdown";

export interface CutoffCountdownProps {
  /** Instant the ordering window closes for the upcoming delivery day. */
  cutoffAt: Date | string | number;
  /** Named delivery day this cutoff feeds, e.g. "Saturday". */
  deliveryDayLabel: string;
  /**
   * Human cutoff label, e.g. "Thu 6:00 PM". Derived from `cutoffAt` in LA time
   * when omitted.
   */
  cutoffLabel?: string;
  /** Below this many ms remaining the pill enters the urgent phase. */
  urgentThresholdMs?: number;
  /** Frozen reference time — stops the live tick (stories/tests/SSR). */
  now?: Date | number;
  className?: string;
}

const LA_TZ = "America/Los_Angeles";

function deriveCutoffLabel(cutoffAt: Date | string | number): string {
  const date = cutoffAt instanceof Date ? cutoffAt : new Date(cutoffAt);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: LA_TZ,
  }).format(date);
}

const phaseStyles: Record<
  CountdownPhase,
  { container: string; chip: string; iconWrap: string; icon: string }
> = {
  calm: {
    container: "border-primary/30 bg-primary/5",
    chip: "bg-primary/10 text-primary",
    iconWrap: "bg-primary/10",
    icon: "text-primary",
  },
  urgent: {
    container: "border-orange/40 bg-orange/5",
    chip: "bg-orange/15 text-orange",
    iconWrap: "bg-orange/15",
    icon: "text-orange",
  },
  locked: {
    container: "border-green/30 bg-green/5",
    chip: "bg-green/10 text-green",
    iconWrap: "bg-green/10",
    icon: "text-green",
  },
};

export function CutoffCountdown({
  cutoffAt,
  deliveryDayLabel,
  cutoffLabel,
  urgentThresholdMs,
  now,
  className,
}: CutoffCountdownProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  // Live tick: re-render each second unless time is frozen via `now`.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (now != null) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [now]);

  const state = useMemo(
    () => getCountdownState(cutoffAt, { now, urgentThresholdMs }),
    // `tick` is an intentional re-compute trigger for the live clock.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cutoffAt, now, urgentThresholdMs, tick]
  );

  const resolvedCutoffLabel = cutoffLabel ?? deriveCutoffLabel(cutoffAt);
  const styles = phaseStyles[state.phase];
  const isLocked = state.phase === "locked";
  const isUrgent = state.phase === "urgent";

  const Icon = isLocked ? Sparkles : isUrgent ? Clock : MoonStar;

  const headline = isLocked
    ? `Locked in for ${deliveryDayLabel}`
    : `Order by ${resolvedCutoffLabel} for ${deliveryDayLabel}`;

  const subline = isLocked
    ? "Your feast is on the way — see you on delivery day."
    : isUrgent
      ? "Window closing soon — finish your order to make this round."
      : "Order now and we'll bring it fresh on delivery day.";

  return (
    <m.div
      role="status"
      aria-live="polite"
      initial={shouldAnimate ? { opacity: 0, y: 8 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={getSpring(spring.gentle)}
      className={cn(
        "flex items-center gap-3 rounded-2xl border p-4 shadow-card backdrop-blur-sm",
        "transition-colors duration-fast",
        styles.container,
        className
      )}
    >
      {/* Icon medallion — pulses only in the urgent phase, motion permitting. */}
      <div className="relative shrink-0">
        {isUrgent && shouldAnimate && (
          <m.span
            aria-hidden
            className="absolute inset-0 rounded-full bg-orange/30"
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <div
          className={cn(
            "relative flex h-11 w-11 items-center justify-center rounded-full",
            styles.iconWrap
          )}
        >
          <Icon className={cn("h-5 w-5", styles.icon)} aria-hidden />
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-body text-sm font-semibold text-text-primary">{headline}</p>
        <p className="mt-0.5 font-body text-xs text-text-secondary">{subline}</p>
      </div>

      {/* Countdown chip — the live, glanceable time-left. */}
      {!isLocked && (
        <m.div
          key={state.phase}
          initial={shouldAnimate ? { scale: 0.9, opacity: 0 } : undefined}
          animate={shouldAnimate ? { scale: 1, opacity: 1 } : undefined}
          transition={getSpring(spring.snappy)}
          className={cn(
            "shrink-0 rounded-full px-3 py-1.5 font-body text-sm font-bold tabular-nums",
            styles.chip
          )}
        >
          {formatTimeLeft(state)}
        </m.div>
      )}

      {isLocked && (
        <span
          className={cn(
            "shrink-0 rounded-full px-3 py-1.5 font-body text-xs font-semibold",
            styles.chip
          )}
        >
          ✨ Set
        </span>
      )}
    </m.div>
  );
}

export default CutoffCountdown;
