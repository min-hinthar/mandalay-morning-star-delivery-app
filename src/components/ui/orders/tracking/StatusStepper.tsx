"use client";

/**
 * StatusStepper - Horizontal status stepper for order tracking
 *
 * Shows: Confirmed -> Preparing -> Out for Delivery -> Delivered
 * Skips "pending" from display. Current step pulses, completed steps show check.
 * Cancelled orders show all steps greyed out with red badge.
 */

import { m } from "framer-motion";
import { Check, ChefHat, Truck, Package, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { OrderStatus } from "@/types/database";

interface StatusStepperProps {
  currentStatus: OrderStatus;
  cancelledAt?: string | null;
}

const STEPPER_STEPS: {
  status: OrderStatus;
  label: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { status: "confirmed", label: "Confirmed", icon: ShieldCheck },
  { status: "preparing", label: "Preparing", icon: ChefHat },
  { status: "out_for_delivery", label: "Out for Delivery", icon: Truck },
  { status: "delivered", label: "Delivered", icon: Package },
];

const STATUS_INDEX: Record<string, number> = {
  pending: -1,
  confirmed: 0,
  preparing: 1,
  out_for_delivery: 2,
  delivered: 3,
  cancelled: -1,
};

function getStepIndex(status: OrderStatus): number {
  return STATUS_INDEX[status] ?? -1;
}

export function StatusStepper({ currentStatus, cancelledAt }: StatusStepperProps) {
  const isCancelled = currentStatus === "cancelled" || !!cancelledAt;
  const activeIndex = getStepIndex(currentStatus);

  const ariaValue = isCancelled ? 0 : Math.max(0, activeIndex + 1);
  const ariaMax = STEPPER_STEPS.length;

  // Screen reader announcement
  const statusText = isCancelled
    ? "Order cancelled"
    : (STEPPER_STEPS[activeIndex]?.label ?? "Order placed");

  return (
    <div className="rounded-xl bg-surface-primary p-4 shadow-warm-sm">
      {/* Accessible progressbar */}
      <div
        role="progressbar"
        aria-valuenow={ariaValue}
        aria-valuemin={0}
        aria-valuemax={ariaMax}
        aria-label="Order progress"
      >
        <div className="flex items-center justify-between">
          {STEPPER_STEPS.map((step, index) => {
            const isCompleted = !isCancelled && activeIndex > index;
            const isCurrent = !isCancelled && activeIndex === index;
            const isFuture = isCancelled || activeIndex < index;

            return (
              <div key={step.status} className="flex flex-1 items-center">
                {/* Step dot + icon */}
                <div className="flex flex-col items-center gap-1.5">
                  {/* Circle */}
                  {isCurrent ? (
                    <m.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-jade-500 shadow-sm"
                    >
                      <step.icon className="h-4 w-4 text-text-inverse" />
                    </m.div>
                  ) : isCompleted ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-jade-500">
                      <Check className="h-4 w-4 text-text-inverse" />
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full",
                        isCancelled ? "bg-charcoal-200" : "bg-charcoal-200"
                      )}
                    >
                      <step.icon
                        className={cn(
                          "h-4 w-4",
                          isCancelled ? "text-charcoal-400" : "text-charcoal-400"
                        )}
                      />
                    </div>
                  )}
                  {/* Label */}
                  <span
                    className={cn(
                      "text-2xs font-medium text-center leading-tight max-w-[72px]",
                      isCurrent && "text-jade-700",
                      isCompleted && "text-jade-600",
                      isFuture && "text-charcoal-400"
                    )}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connecting line */}
                {index < STEPPER_STEPS.length - 1 && (
                  <div
                    className={cn(
                      "mx-1 h-0.5 flex-1 rounded-full",
                      !isCancelled && activeIndex > index ? "bg-jade-500" : "bg-charcoal-200"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Cancelled badge */}
      {isCancelled && (
        <div className="mt-3 flex justify-center">
          <span className="rounded-full bg-error/10 px-3 py-1 text-xs font-semibold text-error">
            Cancelled
          </span>
        </div>
      )}

      {/* Screen reader live region */}
      <div aria-live="polite" className="sr-only">
        Current status: {statusText}
      </div>
    </div>
  );
}

export type { StatusStepperProps };
