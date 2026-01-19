/**
 * V6 Status Timeline - Pepper Aesthetic
 *
 * Shows order progress with live status updates.
 * Features V6 colors, spring animations, and pulsing current indicator.
 */

"use client";

import { motion } from "framer-motion";
import { CheckCircle, Circle, Clock, Package, Truck, Home } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { OrderStatus } from "@/types/database";
import { format, parseISO } from "date-fns";
import { v6Spring } from "@/lib/motion";

interface TimelineStep {
  status: OrderStatus;
  label: string;
  icon: React.ReactNode;
  timestamp?: string | null;
}

interface StatusTimelineProps {
  currentStatus: OrderStatus;
  placedAt: string;
  confirmedAt: string | null;
  deliveredAt: string | null;
  isLive?: boolean;
}

const STATUS_ORDER: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
];

export function StatusTimeline({
  currentStatus,
  placedAt,
  confirmedAt,
  deliveredAt,
  isLive = false,
}: StatusTimelineProps) {
  // Handle cancelled status separately - V6 styling
  if (currentStatus === "cancelled") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={v6Spring}
        className="rounded-v6-card-sm border border-v6-status-error/30 bg-v6-status-error-bg p-4"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-v6-status-error/10 p-2">
            <Circle className="h-5 w-5 text-v6-status-error" />
          </div>
          <div>
            <p className="font-v6-display font-semibold text-v6-status-error">Order Cancelled</p>
            <p className="text-sm font-v6-body text-v6-status-error/80">
              This order has been cancelled.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  const currentIndex = STATUS_ORDER.indexOf(currentStatus);

  const steps: TimelineStep[] = [
    {
      status: "pending",
      label: "Order Placed",
      icon: <Clock className="h-5 w-5" />,
      timestamp: placedAt,
    },
    {
      status: "confirmed",
      label: "Payment Confirmed",
      icon: <CheckCircle className="h-5 w-5" />,
      timestamp: confirmedAt,
    },
    {
      status: "preparing",
      label: "Preparing",
      icon: <Package className="h-5 w-5" />,
      timestamp: null,
    },
    {
      status: "out_for_delivery",
      label: "Out for Delivery",
      icon: <Truck className="h-5 w-5" />,
      timestamp: null,
    },
    {
      status: "delivered",
      label: "Delivered",
      icon: <Home className="h-5 w-5" />,
      timestamp: deliveredAt,
    },
  ];

  return (
    <div className="rounded-v6-card bg-v6-surface-primary p-5 shadow-v6-card">
      <div className="space-y-0">
        {steps.map((step, index) => {
          const stepIndex = STATUS_ORDER.indexOf(step.status);
          const isCompleted = stepIndex < currentIndex;
          const isCurrent = stepIndex === currentIndex;
          const isPending = stepIndex > currentIndex;
          const isLast = index === steps.length - 1;

          return (
            <motion.div
              key={step.status}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, ...v6Spring }}
              className="flex gap-4"
            >
              {/* V6 Timeline line and dot */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "relative flex h-10 w-10 items-center justify-center rounded-full border-2",
                    "transition-all duration-v6-normal",
                    isCompleted && "border-v6-green bg-v6-green text-v6-text-inverse",
                    isCurrent && "border-v6-primary bg-v6-primary text-v6-text-inverse shadow-v6-sm",
                    isPending && "border-v6-border bg-v6-surface-primary text-v6-text-muted"
                  )}
                >
                  {step.icon}
                  {/* V6 Live pulse indicator */}
                  {isCurrent && isLive && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-v6-primary opacity-75" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-v6-primary" />
                    </span>
                  )}
                </div>
                {!isLast && (
                  <div
                    className={cn(
                      "w-0.5 flex-1 min-h-8 transition-colors duration-v6-normal",
                      isCompleted ? "bg-v6-green" : "bg-v6-border"
                    )}
                  />
                )}
              </div>

              {/* V6 Step content */}
              <div className="flex-1 pb-6">
                <p
                  className={cn(
                    "font-v6-body font-semibold",
                    isCompleted && "text-v6-green",
                    isCurrent && "text-v6-primary",
                    isPending && "text-v6-text-muted"
                  )}
                >
                  {step.label}
                </p>
                {step.timestamp && (isCompleted || isCurrent) && (
                  <p className="text-sm font-v6-body text-v6-text-secondary">
                    {format(parseISO(step.timestamp), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                )}
                {isCurrent && !step.timestamp && isLive && (
                  <p className="text-sm font-v6-body text-v6-primary">In progress...</p>
                )}
                {isCurrent && !step.timestamp && !isLive && (
                  <p className="text-sm font-v6-body text-v6-text-muted">Current step</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
