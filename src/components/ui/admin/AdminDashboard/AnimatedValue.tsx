"use client";

import { useEffect } from "react";
import { m, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

interface AnimatedValueProps {
  value: number;
  format: "number" | "currency" | "percentage" | "duration";
  className?: string;
}

export function AnimatedValue({ value, format, className }: AnimatedValueProps) {
  const { shouldAnimate } = useAnimationPreference();

  const springValue = useSpring(0, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.01,
  });

  const displayValue = useTransform(springValue, (v) => {
    switch (format) {
      case "currency":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(v / 100);
      case "percentage":
        return `${Math.round(v)}%`;
      case "duration":
        return `${Math.round(v)} min`;
      default:
        return new Intl.NumberFormat("en-US").format(Math.round(v));
    }
  });

  useEffect(() => {
    if (shouldAnimate) {
      springValue.set(value);
    } else {
      springValue.jump(value);
    }
  }, [value, springValue, shouldAnimate]);

  return (
    <m.span className={cn("tabular-nums", className)}>
      {displayValue}
    </m.span>
  );
}
