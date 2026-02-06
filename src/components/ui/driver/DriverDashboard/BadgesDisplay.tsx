"use client";

import { m } from "framer-motion";
import { Award } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import type { DriverDashboardProps } from "./types";

interface BadgesDisplayProps {
  badges: NonNullable<DriverDashboardProps["badges"]>;
}

export function BadgesDisplay({ badges }: BadgesDisplayProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  if (badges.length === 0) return null;

  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={getSpring(spring.default)}
      className={cn(
        "rounded-2xl bg-surface-primary p-4",
        "shadow-card border border-border"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-text-primary">Recent Badges</h3>
        <Award className="w-5 h-5 text-secondary" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {badges.slice(0, 5).map((badge, index) => (
          <m.div
            key={badge.id}
            initial={shouldAnimate ? { opacity: 0, scale: 0 } : undefined}
            animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
            transition={{ ...getSpring(spring.ultraBouncy), delay: index * 0.1 }}
            whileHover={shouldAnimate ? { scale: 1.1, y: -2 } : undefined}
            className="flex-shrink-0 flex flex-col items-center gap-1 p-2"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-secondary/20 to-primary/20 flex items-center justify-center text-2xl">
              {badge.icon}
            </div>
            <span className="text-xs text-text-muted whitespace-nowrap">
              {badge.name}
            </span>
          </m.div>
        ))}
      </div>
    </m.div>
  );
}
