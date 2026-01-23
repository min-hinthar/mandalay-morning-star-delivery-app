"use client";

/**
 *  ETA Countdown - Motion-First Design
 *
 * Sprint 7: Tracking & Driver
 * Features: Flip countdown animation, animated progress ring, gradient background
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navigation, Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { formatETARange, formatArrivalTime } from "@/lib/utils/eta";

// ============================================
// TYPES
// ============================================

export interface ETACountdownProps {
  /** Minimum minutes until arrival */
  minMinutes: number;
  /** Maximum minutes until arrival */
  maxMinutes: number;
  /** Estimated arrival time ISO string */
  estimatedArrival: string;
  /** Is actively calculating */
  isCalculating?: boolean;
  /** Driver is near (< 5 min) */
  isNearby?: boolean;
  /** Additional className */
  className?: string;
}

// ============================================
// FLIP DIGIT COMPONENT
// ============================================

interface FlipDigitProps {
  value: string;
  delay?: number;
}

function FlipDigit({ value, delay = 0 }: FlipDigitProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (value !== displayValue) {
      setDisplayValue(value);
    }
  }, [value, displayValue]);

  return (
    <div className="relative w-10 h-14 overflow-hidden">
      {/* Background card */}
      <div
        className={cn(
          "absolute inset-0 rounded-lg",
          "bg-gradient-to-b from-surface-secondary to-surface-tertiary",
          "border border-border shadow-inner"
        )}
      />

      {/* Digit with flip animation */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={displayValue}
          initial={shouldAnimate ? { rotateX: -90, opacity: 0 } : undefined}
          animate={shouldAnimate ? { rotateX: 0, opacity: 1 } : undefined}
          exit={shouldAnimate ? { rotateX: 90, opacity: 0 } : undefined}
          transition={{
            ...getSpring(spring.snappy),
            delay,
          }}
          className="absolute inset-0 flex items-center justify-center"
          style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
        >
          <span className="text-3xl font-bold text-text-primary tabular-nums">
            {displayValue}
          </span>
        </motion.div>
      </AnimatePresence>

      {/* Center divider line */}
      <div className="absolute left-0 right-0 top-1/2 h-px bg-border/50" />
    </div>
  );
}

// ============================================
// PROGRESS RING COMPONENT
// ============================================

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
}

function ProgressRing({ progress, size = 120, strokeWidth = 8 }: ProgressRingProps) {
  const { shouldAnimate } = useAnimationPreference();
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-border)"
        strokeWidth={strokeWidth}
      />

      {/* Progress ring */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#progressGradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={shouldAnimate ? { strokeDashoffset: circumference } : undefined}
        animate={shouldAnimate ? { strokeDashoffset: offset } : undefined}
        transition={{ duration: 1, ease: "easeOut" }}
      />

      {/* Gradient definition */}
      <defs>
        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#A41034" />
          <stop offset="50%" stopColor="#EBCD00" />
          <stop offset="100%" stopColor="#52A52E" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ============================================
// NEARBY ALERT COMPONENT
// ============================================

function NearbyAlert() {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, scale: 0.9, y: 10 } : undefined}
      animate={shouldAnimate ? { opacity: 1, scale: 1, y: 0 } : undefined}
      transition={getSpring(spring.ultraBouncy)}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl",
        "bg-gradient-to-r from-green/20 to-green/10",
        "border border-green/30"
      )}
    >
      <motion.div
        animate={shouldAnimate ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : undefined}
        transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
        className="w-10 h-10 rounded-full bg-green/20 flex items-center justify-center"
      >
        <Zap className="w-5 h-5 text-green" />
      </motion.div>
      <div>
        <p className="font-semibold text-green">Driver is nearby!</p>
        <p className="text-sm text-green/80">Get ready for your delivery</p>
      </div>
    </motion.div>
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

  // Format values
  const formattedRange = formatETARange(minMinutes, maxMinutes);
  const formattedTime = formatArrivalTime(new Date(estimatedArrival));

  // Calculate countdown display
  const avgMinutes = Math.round((minMinutes + maxMinutes) / 2);
  const minutesDisplay = String(Math.floor(avgMinutes)).padStart(2, "0");
  const secondsDisplay = "00"; // Simplified - just show minutes

  // Calculate progress (assuming 60 min max for normalization)
  const progress = Math.max(0, Math.min(100, 100 - (avgMinutes / 60) * 100));

  // Loading state
  if (isCalculating) {
    return (
      <div
        className={cn(
          "rounded-2xl bg-gradient-to-r from-primary-light to-green-light p-6",
          className
        )}
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-surface-primary/50 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-32 rounded bg-surface-primary/50 animate-pulse" />
            <div className="h-4 w-24 rounded bg-surface-primary/50 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={getSpring(spring.default)}
      className={cn(
        "rounded-2xl overflow-hidden",
        "bg-gradient-to-br from-primary-light via-surface-primary to-green-light",
        "shadow-card border border-border",
        className
      )}
    >
      {/* Main content */}
      <div className="p-6">
        <div className="flex items-center gap-6">
          {/* Progress ring with countdown */}
          <div className="relative flex-shrink-0">
            <ProgressRing progress={progress} />

            {/* Centered content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.div
                initial={shouldAnimate ? { scale: 0 } : undefined}
                animate={shouldAnimate ? { scale: 1 } : undefined}
                transition={getSpring(spring.ultraBouncy)}
                className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-1"
              >
                <Navigation className="w-5 h-5 text-primary" />
              </motion.div>
              <p className="text-xs text-text-muted">ETA</p>
            </div>
          </div>

          {/* ETA details */}
          <div className="flex-1">
            <p className="text-sm font-medium text-text-secondary mb-2">
              Estimated Arrival
            </p>

            {/* Flip countdown display */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex gap-1">
                <FlipDigit value={minutesDisplay[0]} delay={0} />
                <FlipDigit value={minutesDisplay[1]} delay={0.05} />
              </div>
              <span className="text-2xl font-bold text-text-muted">:</span>
              <div className="flex gap-1">
                <FlipDigit value={secondsDisplay[0]} delay={0.1} />
                <FlipDigit value={secondsDisplay[1]} delay={0.15} />
              </div>
              <span className="text-sm font-medium text-text-muted ml-2">min</span>
            </div>

            {/* Range display */}
            <AnimatePresence mode="wait">
              <motion.p
                key={formattedRange}
                initial={shouldAnimate ? { opacity: 0, y: -5 } : undefined}
                animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
                exit={shouldAnimate ? { opacity: 0, y: 5 } : undefined}
                className="text-xl font-bold text-text-primary"
              >
                {formattedRange}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Arrival time */}
          <div className="text-right">
            <p className="text-xs text-text-muted mb-1">Arriving by</p>
            <AnimatePresence mode="wait">
              <motion.p
                key={formattedTime}
                initial={shouldAnimate ? { opacity: 0, scale: 0.9 } : undefined}
                animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
                exit={shouldAnimate ? { opacity: 0, scale: 0.9 } : undefined}
                className="text-2xl font-bold text-green"
              >
                {formattedTime}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* Updates note */}
        <motion.div
          initial={shouldAnimate ? { opacity: 0 } : undefined}
          animate={shouldAnimate ? { opacity: 1 } : undefined}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50"
        >
          <Clock className="w-4 h-4 text-text-muted" />
          <span className="text-xs text-text-muted">
            Updates automatically as driver progresses
          </span>
        </motion.div>
      </div>

      {/* Nearby alert */}
      {isNearby && (
        <div className="px-6 pb-6">
          <NearbyAlert />
        </div>
      )}
    </motion.div>
  );
}

/**
 * Compact variant for smaller spaces
 */
export function ETACountdownCompact({
  minMinutes,
  maxMinutes,
  className,
}: Pick<ETACountdownProps, "minMinutes" | "maxMinutes" | "className">) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const formattedRange = formatETARange(minMinutes, maxMinutes);

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, scale: 0.9 } : undefined}
      animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
      transition={getSpring(spring.snappy)}
      className={cn(
        "inline-flex items-center gap-2",
        "px-4 py-2.5 rounded-full",
        "bg-gradient-to-r from-primary-light to-green-light",
        "border border-border shadow-sm",
        className
      )}
    >
      <motion.div
        animate={shouldAnimate ? { rotate: [0, 15, -15, 0] } : undefined}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
      >
        <Navigation className="w-4 h-4 text-primary" />
      </motion.div>
      <span className="font-semibold text-sm text-primary">{formattedRange}</span>
    </motion.div>
  );
}

export default ETACountdown;
