"use client";

/**
 * StatusTimeline Component
 *
 * Animated order status timeline with progress indicators.
 */

import { useMemo } from "react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import type { OrderStatus } from "@/types/database";
import { STATUS_ORDER, STATUS_CONFIG } from "./constants";
import { TimelineStep } from "./TimelineStep";
import { CancelledState } from "./CancelledState";

export interface StatusTimelineProps {
  currentStatus: OrderStatus;
  placedAt: string;
  confirmedAt: string | null;
  deliveredAt: string | null;
  isLive?: boolean;
  className?: string;
}

export function StatusTimeline({
  currentStatus,
  placedAt,
  confirmedAt,
  deliveredAt,
  isLive = false,
  className,
}: StatusTimelineProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);

  const steps = useMemo(() => {
    if (currentStatus === "cancelled") return [];

    return STATUS_ORDER.map((status, index) => {
      const config = STATUS_CONFIG[status];
      let timestamp: string | null = null;
      if (status === "pending") timestamp = placedAt;
      else if (status === "confirmed") timestamp = confirmedAt;
      else if (status === "delivered") timestamp = deliveredAt;

      return {
        status,
        label: config.label,
        icon: config.icon,
        timestamp,
        isCompleted: index < currentIndex,
        isCurrent: index === currentIndex,
        isPending: index > currentIndex,
        isLast: index === STATUS_ORDER.length - 1,
      };
    });
  }, [currentStatus, currentIndex, placedAt, confirmedAt, deliveredAt]);

  if (currentStatus === "cancelled") {
    return (
      <div className={className}>
        <CancelledState />
      </div>
    );
  }

  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={getSpring(spring.default)}
      className={cn(
        "rounded-2xl bg-surface-primary p-6 shadow-card border border-border",
        className
      )}
    >
      <m.div
        initial={shouldAnimate ? { opacity: 0, x: -10 } : undefined}
        animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
        className="flex items-center justify-between mb-6"
      >
        <h3 className="font-semibold text-lg text-text-primary">Order Status</h3>
        {isLive && (
          <m.div
            initial={shouldAnimate ? { opacity: 0, scale: 0.8 } : undefined}
            animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green/10"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green" />
            </span>
            <span className="text-xs font-medium text-green">Live</span>
          </m.div>
        )}
      </m.div>

      <div>
        {steps.map((step, index) => (
          <TimelineStep key={step.status} {...step} isLive={isLive} index={index} />
        ))}
      </div>
    </m.div>
  );
}

export default StatusTimeline;
