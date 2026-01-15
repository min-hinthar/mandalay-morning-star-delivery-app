/**
 * V2 Sprint 4: Animated Counter Component
 *
 * Spring-animated number display with smooth interpolation.
 * Supports currency, percentage, and plain number formatting.
 * iOS-like haptic feedback visuals with spring physics.
 */

"use client";

import { useEffect, useRef } from "react";
import { motion, useSpring, useTransform, useInView } from "framer-motion";
import type { AnimatedCounterProps } from "@/types/analytics";

const springConfig = {
  stiffness: 100,
  damping: 30,
  restDelta: 0.001,
};

export function AnimatedCounter({
  value,
  duration = 1000,
  format = "number",
  decimals = 0,
  prefix = "",
  suffix = "",
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const motionValue = useSpring(0, {
    ...springConfig,
    duration: duration,
  });

  const displayValue = useTransform(motionValue, (latest) => {
    const num = latest;

    switch (format) {
      case "currency":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(num / 100);

      case "percent":
        return `${num.toFixed(decimals)}%`;

      default:
        if (decimals > 0) {
          return num.toFixed(decimals);
        }
        return new Intl.NumberFormat("en-US").format(Math.round(num));
    }
  });

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [motionValue, value, isInView]);

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="inline-block tabular-nums"
    >
      {prefix}
      <motion.span>{displayValue}</motion.span>
      {suffix}
    </motion.span>
  );
}

/**
 * Compact animated counter for smaller displays
 */
export function AnimatedCounterCompact({
  value,
  format = "number",
  className = "",
}: {
  value: number;
  format?: "number" | "currency" | "percent";
  className?: string;
}) {
  return (
    <span className={className}>
      <AnimatedCounter
        value={value}
        format={format}
        duration={800}
        decimals={format === "percent" ? 1 : 0}
      />
    </span>
  );
}
