"use client";

import { m, AnimatePresence } from "framer-motion";
import { Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import type { CountdownState } from "@/lib/hooks/useCountdown";

// ============================================
// TYPES
// ============================================

export interface OpsCountdownBarProps {
  cutoff: CountdownState;
  deliveryStart: CountdownState;
}

// ============================================
// HELPERS
// ============================================

function padTwo(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatCountdown(state: CountdownState): string {
  return `${padTwo(state.hours)}:${padTwo(state.minutes)}:${padTwo(state.seconds)}`;
}

function getAlertLabel(label: string): string {
  if (label.toLowerCase().includes("cutoff")) return "PAST CUTOFF";
  return "DELIVERY STARTED";
}

// ============================================
// SINGLE COUNTDOWN DISPLAY
// ============================================

interface CountdownDisplayProps {
  state: CountdownState;
  shouldAnimate: boolean;
}

function CountdownDisplay({ state, shouldAnimate }: CountdownDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
        {state.label}
      </span>
      <AnimatePresence mode="wait">
        {state.isPast ? (
          <m.div
            key="alert"
            initial={shouldAnimate ? { opacity: 0, scale: 0.9 } : undefined}
            animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
            exit={shouldAnimate ? { opacity: 0, scale: 0.9 } : undefined}
            transition={shouldAnimate ? spring.snappy : undefined}
            className="flex items-center gap-1.5"
          >
            <AlertTriangle className="h-4 w-4 text-text-inverse" />
            <span className="text-sm font-bold text-text-inverse">{getAlertLabel(state.label)}</span>
          </m.div>
        ) : (
          <m.div
            key="countdown"
            initial={shouldAnimate ? { opacity: 0, scale: 0.9 } : undefined}
            animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
            exit={shouldAnimate ? { opacity: 0, scale: 0.9 } : undefined}
            transition={shouldAnimate ? spring.snappy : undefined}
            className="flex items-center gap-1.5"
          >
            <Clock className="h-4 w-4 text-text-secondary" />
            <span className="font-mono text-lg font-bold tabular-nums text-text-primary">
              {formatCountdown(state)}
            </span>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// COMPONENT
// ============================================

export function OpsCountdownBar({ cutoff, deliveryStart }: OpsCountdownBarProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const hasAlert = cutoff.isPast || deliveryStart.isPast;

  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, y: -12 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={getSpring(spring.default)}
      className={cn(
        "sticky top-0 z-30 flex items-center justify-center gap-8 border-b px-4 py-3 sm:gap-16",
        hasAlert
          ? "border-destructive/30 bg-destructive text-text-inverse"
          : "border-border bg-card"
      )}
    >
      <CountdownDisplay state={cutoff} shouldAnimate={shouldAnimate} />
      <div
        className={cn(
          "hidden h-8 w-px sm:block",
          hasAlert ? "bg-text-inverse/20" : "bg-border"
        )}
      />
      <CountdownDisplay state={deliveryStart} shouldAnimate={shouldAnimate} />
    </m.div>
  );
}
