/**
 * V2 Sprint 3: Enhanced Status Timeline for Tracking
 *
 * Shows order progress with live status updates.
 * Based on OrderTimeline but with enhanced styling and live indicator.
 */

"use client";

import { motion } from "framer-motion";
import { CheckCircle, Circle, Clock, Package, Truck, Home } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { OrderStatus } from "@/types/database";
import { format, parseISO } from "date-fns";

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
  // Handle cancelled status separately
  if (currentStatus === "cancelled") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-red-200 bg-red-50 p-4"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-red-100 p-2">
            <Circle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="font-medium text-red-800">Order Cancelled</p>
            <p className="text-sm text-red-600">
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
    <div className="rounded-xl bg-white p-4 shadow-warm-sm">
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
              transition={{ delay: index * 0.1 }}
              className="flex gap-4"
            >
              {/* Timeline line and dot */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                    isCompleted && "border-jade bg-jade text-white",
                    isCurrent && "border-saffron bg-saffron text-white",
                    isPending && "border-charcoal-300 bg-white text-charcoal-400"
                  )}
                >
                  {step.icon}
                  {/* Live pulse indicator */}
                  {isCurrent && isLive && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-saffron opacity-75" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-saffron" />
                    </span>
                  )}
                </div>
                {!isLast && (
                  <div
                    className={cn(
                      "w-0.5 flex-1 min-h-8",
                      isCompleted ? "bg-jade" : "bg-charcoal-200"
                    )}
                  />
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 pb-6">
                <p
                  className={cn(
                    "font-medium",
                    isCompleted && "text-jade",
                    isCurrent && "text-saffron",
                    isPending && "text-charcoal-400"
                  )}
                >
                  {step.label}
                </p>
                {step.timestamp && (isCompleted || isCurrent) && (
                  <p className="text-sm text-charcoal-500">
                    {format(parseISO(step.timestamp), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                )}
                {isCurrent && !step.timestamp && isLive && (
                  <p className="text-sm text-saffron">In progress...</p>
                )}
                {isCurrent && !step.timestamp && !isLive && (
                  <p className="text-sm text-charcoal-500">Current step</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
