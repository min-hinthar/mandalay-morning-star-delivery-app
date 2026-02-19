"use client";

import React from "react";
import { m } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { AnimatedValue } from "@/components/ui/admin/AdminDashboard/AnimatedValue";

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
  index: number;
  trend?: "up" | "down" | null;
  /** Format for AnimatedValue counting animation */
  animatedFormat?: "number" | "currency" | "percentage" | "duration";
}

export function StatCard({
  icon,
  value,
  label,
  color,
  index,
  trend,
  animatedFormat,
}: StatCardProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, y: 20, scale: 0.9 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0, scale: 1 } : undefined}
      transition={{ ...getSpring(spring.rubbery), delay: index * 0.1 }}
      whileHover={shouldAnimate ? { y: -4, scale: 1.03 } : undefined}
      whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-gradient-to-br from-accent-teal/5 to-accent-teal/10",
        "sm:backdrop-blur-sm",
        "p-4 shadow-card border-2 border-border"
      )}
    >
      {/* Background decoration */}
      <div className={cn("absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-10", color)} />

      <div className="relative flex items-center gap-3">
        {/* Icon */}
        <m.div
          initial={shouldAnimate ? { scale: 0, rotate: -180 } : undefined}
          animate={shouldAnimate ? { scale: 1, rotate: 0 } : undefined}
          transition={{ ...getSpring(spring.ultraBouncy), delay: index * 0.1 + 0.1 }}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl",
            color.replace("bg-", "bg-") + "/10"
          )}
        >
          {icon}
        </m.div>

        {/* Value and label */}
        <div>
          <m.p
            initial={shouldAnimate ? { opacity: 0, x: -10 } : undefined}
            animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
            transition={{ delay: index * 0.1 + 0.15 }}
            className="text-2xl font-bold text-text-primary flex items-center gap-1"
          >
            {animatedFormat && typeof value === "number" ? (
              <AnimatedValue value={value} format={animatedFormat} />
            ) : (
              value
            )}
            {trend && (
              <m.span
                animate={shouldAnimate ? { y: [0, -3, 0] } : undefined}
                transition={{ duration: 1, repeat: 5, repeatDelay: 1 }}
              >
                {trend === "up" ? <TrendingUp className="w-4 h-4 text-accent-teal" /> : null}
              </m.span>
            )}
          </m.p>
          <p className="text-sm text-text-muted">{label}</p>
        </div>
      </div>
    </m.div>
  );
}
