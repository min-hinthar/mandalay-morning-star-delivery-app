"use client";

/**
 * V7 Status Timeline - Motion-First Design
 *
 * Sprint 7: Tracking & Driver
 * Features: Animated progress line, bouncy step transitions, live pulse indicator
 */

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  CheckCircle,
  Package,
  Truck,
  Home,
  XCircle,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { v7Spring } from "@/lib/motion-tokens-v7";
import { useAnimationPreferenceV7 } from "@/lib/hooks/useAnimationPreferenceV7";
import type { OrderStatus } from "@/types/database";
import { format, parseISO } from "date-fns";

// ============================================
// TYPES
// ============================================

export interface StatusTimelineV7Props {
  /** Current order status */
  currentStatus: OrderStatus;
  /** When order was placed */
  placedAt: string;
  /** When payment was confirmed */
  confirmedAt: string | null;
  /** When order was delivered */
  deliveredAt: string | null;
  /** Is tracking live? */
  isLive?: boolean;
  /** Additional className */
  className?: string;
}

// ============================================
// CONSTANTS
// ============================================

const STATUS_ORDER: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
];

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; icon: React.FC<{ className?: string }>; color: string }
> = {
  pending: {
    label: "Order Placed",
    icon: Clock,
    color: "v6-secondary",
  },
  confirmed: {
    label: "Payment Confirmed",
    icon: CheckCircle,
    color: "v6-primary",
  },
  preparing: {
    label: "Preparing Your Food",
    icon: Package,
    color: "v6-primary",
  },
  out_for_delivery: {
    label: "Out for Delivery",
    icon: Truck,
    color: "v6-secondary",
  },
  delivered: {
    label: "Delivered",
    icon: Home,
    color: "v6-green",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    color: "v6-status-error",
  },
};

// ============================================
// TIMELINE STEP COMPONENT
// ============================================

interface TimelineStepV7Props {
  status: OrderStatus;
  label: string;
  icon: React.FC<{ className?: string }>;
  timestamp: string | null;
  isCompleted: boolean;
  isCurrent: boolean;
  isPending: boolean;
  isLast: boolean;
  isLive: boolean;
  index: number;
}

function TimelineStepV7({
  status: _status,
  label,
  icon: Icon,
  timestamp,
  isCompleted,
  isCurrent,
  isPending,
  isLast,
  isLive,
  index,
}: TimelineStepV7Props) {
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, x: -20 } : undefined}
      animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
      transition={{ ...getSpring(v7Spring.rubbery), delay: index * 0.1 }}
      className="flex gap-4"
    >
      {/* Timeline line and dot */}
      <div className="flex flex-col items-center">
        {/* Step indicator */}
        <motion.div
          initial={shouldAnimate ? { scale: 0 } : undefined}
          animate={shouldAnimate ? { scale: 1 } : undefined}
          transition={{ ...getSpring(v7Spring.ultraBouncy), delay: index * 0.1 + 0.1 }}
          className={cn(
            "relative flex h-12 w-12 items-center justify-center rounded-full border-3",
            "transition-all duration-300",
            isCompleted && "border-v6-green bg-v6-green text-white",
            isCurrent && "border-v6-primary bg-v6-primary text-white shadow-lg shadow-v6-primary/30",
            isPending && "border-v6-border bg-v6-surface-secondary text-v6-text-muted"
          )}
        >
          {/* Icon with animation */}
          <motion.div
            animate={
              isCurrent && isLive && shouldAnimate
                ? {
                    scale: [1, 1.2, 1],
                    rotate: [0, 5, -5, 0],
                  }
                : undefined
            }
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1,
            }}
          >
            <Icon className="h-6 w-6" />
          </motion.div>

          {/* Live pulse indicator */}
          {isCurrent && isLive && (
            <>
              <motion.span
                className="absolute inset-0 rounded-full bg-v6-primary"
                animate={shouldAnimate ? { scale: [1, 1.5, 2], opacity: [0.4, 0.1, 0] } : undefined}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-v6-green opacity-75" />
                <span className="relative inline-flex h-4 w-4 rounded-full bg-v6-green border-2 border-white" />
              </span>
            </>
          )}

          {/* Completed checkmark overlay */}
          {isCompleted && (
            <motion.div
              initial={shouldAnimate ? { scale: 0, rotate: -180 } : undefined}
              animate={shouldAnimate ? { scale: 1, rotate: 0 } : undefined}
              transition={getSpring(v7Spring.ultraBouncy)}
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-sm"
            >
              <CheckCircle className="w-4 h-4 text-v6-green" />
            </motion.div>
          )}
        </motion.div>

        {/* Connecting line */}
        {!isLast && (
          <div className="relative w-1 flex-1 min-h-8 my-1">
            {/* Background line */}
            <div className="absolute inset-0 rounded-full bg-v6-border" />

            {/* Progress line */}
            <motion.div
              initial={shouldAnimate ? { scaleY: 0 } : undefined}
              animate={
                shouldAnimate
                  ? { scaleY: isCompleted ? 1 : isCurrent ? 0.5 : 0 }
                  : undefined
              }
              transition={{ ...getSpring(v7Spring.gentle), delay: index * 0.1 + 0.2 }}
              className="absolute inset-0 rounded-full bg-v6-green origin-top"
            />

            {/* Animated progress for current step */}
            {isCurrent && isLive && (
              <motion.div
                animate={shouldAnimate ? { y: [0, 20, 0] } : undefined}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-v6-primary"
              />
            )}
          </div>
        )}
      </div>

      {/* Step content */}
      <div className="flex-1 pb-8">
        <motion.p
          initial={shouldAnimate ? { opacity: 0, y: 5 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={{ delay: index * 0.1 + 0.15 }}
          className={cn(
            "font-semibold text-base",
            isCompleted && "text-v6-green",
            isCurrent && "text-v6-primary",
            isPending && "text-v6-text-muted"
          )}
        >
          {label}
        </motion.p>

        {/* Timestamp */}
        {timestamp && (isCompleted || isCurrent) && (
          <motion.p
            initial={shouldAnimate ? { opacity: 0 } : undefined}
            animate={shouldAnimate ? { opacity: 1 } : undefined}
            transition={{ delay: index * 0.1 + 0.2 }}
            className="text-sm text-v6-text-secondary mt-0.5"
          >
            {format(parseISO(timestamp), "MMM d, yyyy 'at' h:mm a")}
          </motion.p>
        )}

        {/* In progress message */}
        {isCurrent && !timestamp && (
          <motion.div
            initial={shouldAnimate ? { opacity: 0 } : undefined}
            animate={shouldAnimate ? { opacity: 1 } : undefined}
            transition={{ delay: index * 0.1 + 0.2 }}
            className="flex items-center gap-1.5 mt-0.5"
          >
            {isLive ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-v6-primary" />
                <span className="text-sm text-v6-primary font-medium">In progress...</span>
              </>
            ) : (
              <span className="text-sm text-v6-text-muted">Current step</span>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// CANCELLED STATE
// ============================================

function CancelledStateV7() {
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={getSpring(v7Spring.default)}
      className="rounded-2xl border border-v6-status-error/30 bg-v6-status-error/5 p-5"
    >
      <div className="flex items-center gap-4">
        <motion.div
          initial={shouldAnimate ? { scale: 0 } : undefined}
          animate={shouldAnimate ? { scale: 1 } : undefined}
          transition={getSpring(v7Spring.ultraBouncy)}
          className="w-14 h-14 rounded-full bg-v6-status-error/10 flex items-center justify-center"
        >
          <XCircle className="h-7 w-7 text-v6-status-error" />
        </motion.div>
        <div>
          <p className="font-semibold text-lg text-v6-status-error">Order Cancelled</p>
          <p className="text-sm text-v6-status-error/80 mt-0.5">
            This order has been cancelled. Contact support for help.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function StatusTimelineV7({
  currentStatus,
  placedAt,
  confirmedAt,
  deliveredAt,
  isLive = false,
  className,
}: StatusTimelineV7Props) {
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);

  // Build timeline steps - always call hooks before any early returns
  const steps = useMemo(() => {
    // Return empty for cancelled status (handled in render)
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

  // Handle cancelled status after hooks
  if (currentStatus === "cancelled") {
    return (
      <div className={className}>
        <CancelledStateV7 />
      </div>
    );
  }

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={getSpring(v7Spring.default)}
      className={cn(
        "rounded-2xl bg-v6-surface-primary p-6",
        "shadow-v6-card border border-v6-border",
        className
      )}
    >
      {/* Header */}
      <motion.div
        initial={shouldAnimate ? { opacity: 0, x: -10 } : undefined}
        animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
        className="flex items-center justify-between mb-6"
      >
        <h3 className="font-semibold text-lg text-v6-text-primary">Order Status</h3>
        {isLive && (
          <motion.div
            initial={shouldAnimate ? { opacity: 0, scale: 0.8 } : undefined}
            animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-v6-green/10"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-v6-green opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-v6-green" />
            </span>
            <span className="text-xs font-medium text-v6-green">Live</span>
          </motion.div>
        )}
      </motion.div>

      {/* Timeline steps */}
      <div>
        {steps.map((step, index) => (
          <TimelineStepV7
            key={step.status}
            {...step}
            isLive={isLive}
            index={index}
          />
        ))}
      </div>
    </motion.div>
  );
}

export default StatusTimelineV7;
