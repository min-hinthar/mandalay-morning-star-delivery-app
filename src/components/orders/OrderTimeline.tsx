"use client";

import { CheckCircle, Circle, Clock, Package, Truck, Home } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { OrderStatus } from "@/types/order";
import { format, parseISO } from "date-fns";

interface TimelineStep {
  status: OrderStatus;
  label: string;
  icon: React.ReactNode;
  timestamp?: string | null;
}

interface OrderTimelineProps {
  currentStatus: OrderStatus;
  placedAt: string;
  confirmedAt: string | null;
  deliveredAt: string | null;
}

const STATUS_ORDER: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
];

export function OrderTimeline({
  currentStatus,
  placedAt,
  confirmedAt,
  deliveredAt,
}: OrderTimelineProps) {
  // Handle cancelled status separately
  if (currentStatus === "cancelled") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
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
      </div>
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
      timestamp: null, // We don't track this timestamp yet
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
    <div className="space-y-0">
      {steps.map((step, index) => {
        const stepIndex = STATUS_ORDER.indexOf(step.status);
        const isCompleted = stepIndex < currentIndex;
        const isCurrent = stepIndex === currentIndex;
        const isPending = stepIndex > currentIndex;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.status} className="flex gap-4">
            {/* Timeline line and dot */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                  isCompleted && "border-jade bg-jade text-white",
                  isCurrent && "border-saffron bg-saffron text-white",
                  isPending && "border-gray-300 bg-white text-gray-400"
                )}
              >
                {step.icon}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "w-0.5 flex-1 min-h-8",
                    isCompleted ? "bg-jade" : "bg-gray-200"
                  )}
                />
              )}
            </div>

            {/* Step content */}
            <div className="flex-1 pb-8">
              <p
                className={cn(
                  "font-medium",
                  isCompleted && "text-jade",
                  isCurrent && "text-saffron",
                  isPending && "text-gray-400"
                )}
              >
                {step.label}
              </p>
              {step.timestamp && (isCompleted || isCurrent) && (
                <p className="text-sm text-muted-foreground">
                  {format(parseISO(step.timestamp), "MMM d, yyyy 'at' h:mm a")}
                </p>
              )}
              {isCurrent && !step.timestamp && (
                <p className="text-sm text-saffron">In progress...</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
