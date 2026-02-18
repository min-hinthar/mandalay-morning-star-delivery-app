"use client";

import React from "react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

interface TimelineStepProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  isActive: boolean;
  index: number;
}

export function TimelineStep({ icon, title, description, isActive, index }: TimelineStepProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, x: -20 } : undefined}
      animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
      transition={{ ...getSpring(spring.default), delay: 0.8 + index * 0.15 }}
      className="flex items-start gap-3"
    >
      <m.div
        animate={
          isActive && shouldAnimate
            ? {
                scale: [1, 1.2, 1],
              }
            : undefined
        }
        transition={{
          duration: 2,
          repeat: 5,
          repeatDelay: 1,
        }}
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
          isActive ? "bg-primary text-text-inverse" : "bg-surface-tertiary text-text-muted"
        )}
      >
        {icon}
      </m.div>
      <div>
        <p className="font-semibold text-text-primary">{title}</p>
        <p className="text-sm text-text-secondary">{description}</p>
      </div>
    </m.div>
  );
}
