"use client";

import { cn } from "@/lib/utils/cn";
import { useCountdown } from "@/lib/hooks/useCountdown";
import type { Urgency } from "@/lib/hooks/useDeliveryGate";

// ============================================
// TYPES
// ============================================

export interface DeliveryCountdownProps {
  cutoffDate: Date;
  urgency: Urgency;
  className?: string;
}

// ============================================
// COMPONENT
// ============================================

/**
 * Compact countdown display for customer delivery gate.
 * Renders "Xh Ym" format — readable for customers vs. HH:MM:SS admin style.
 * Returns null when countdown is past (parent handles closed state).
 */
export function DeliveryCountdown({ cutoffDate, urgency, className }: DeliveryCountdownProps) {
  const countdown = useCountdown(cutoffDate, "cutoff");

  if (countdown.isPast) return null;

  return (
    <span
      className={cn(
        "font-mono tabular-nums text-sm font-semibold",
        urgency === "normal" && "text-text-secondary",
        urgency === "warning" && "text-amber-600 dark:text-amber-400",
        urgency === "critical" && "text-destructive",
        className
      )}
      aria-live="polite"
      aria-label={`${countdown.hours} hours ${countdown.minutes} minutes remaining`}
    >
      {countdown.hours > 0 ? `${countdown.hours}h ` : ""}
      {countdown.minutes}m
    </span>
  );
}
