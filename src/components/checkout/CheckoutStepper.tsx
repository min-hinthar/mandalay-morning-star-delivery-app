"use client";

import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { CHECKOUT_STEPS, type CheckoutStep } from "@/types/checkout";
import { cn } from "@/lib/utils/cn";

interface CheckoutStepperProps {
  currentStep: CheckoutStep;
  onStepClick?: (step: CheckoutStep) => void;
  className?: string;
}

const STEP_LABELS: Record<CheckoutStep, string> = {
  address: "Address",
  time: "Time",
  payment: "Payment",
};

export function CheckoutStepper({
  currentStep,
  onStepClick,
  className,
}: CheckoutStepperProps) {
  const currentIndex = CHECKOUT_STEPS.indexOf(currentStep);

  return (
    <nav className={cn("w-full", className)} aria-label="Checkout progress">
      <ol className="flex items-center justify-between">
        {CHECKOUT_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isClickable = isCompleted && onStepClick;

          return (
            <li key={step} className="flex flex-1 items-center">
              <button
                type="button"
                onClick={() => isClickable && onStepClick(step)}
                disabled={!isClickable}
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-full",
                  "text-sm font-medium transition-colors",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2",
                  isCompleted && "cursor-pointer bg-brand-red text-white",
                  isCurrent &&
                    "border-2 border-brand-red bg-background text-brand-red",
                  !isCompleted &&
                    !isCurrent &&
                    "border-2 border-border bg-background text-muted"
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <Check className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <span>{index + 1}</span>
                )}
              </button>

              <span
                className={cn(
                  "ml-2 hidden text-sm font-medium sm:block",
                  isCompleted || isCurrent
                    ? "text-foreground"
                    : "text-muted"
                )}
              >
                {STEP_LABELS[step]}
              </span>

              {index < CHECKOUT_STEPS.length - 1 && (
                <div className="mx-4 h-0.5 flex-1 bg-border">
                  <motion.div
                    className="h-full bg-brand-red"
                    initial={{ width: 0 }}
                    animate={{ width: isCompleted ? "100%" : "0%" }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
