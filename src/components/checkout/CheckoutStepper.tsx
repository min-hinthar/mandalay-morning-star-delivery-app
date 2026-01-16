"use client";

import { Check, MapPin, Clock, CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import { CHECKOUT_STEPS, type CheckoutStep } from "@/types/checkout";
import { cn } from "@/lib/utils/cn";

interface CheckoutStepperProps {
  currentStep: CheckoutStep;
  onStepClick?: (step: CheckoutStep) => void;
  className?: string;
}

const STEP_CONFIG: Record<CheckoutStep, { label: string; icon: typeof MapPin }> = {
  address: { label: "Address", icon: MapPin },
  time: { label: "Time", icon: Clock },
  payment: { label: "Payment", icon: CreditCard },
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
          const config = STEP_CONFIG[step];
          const Icon = config.icon;

          return (
            <li key={step} className="flex flex-1 items-center">
              <motion.button
                type="button"
                onClick={() => isClickable && onStepClick(step)}
                disabled={!isClickable}
                whileHover={isClickable ? { scale: 1.05 } : undefined}
                whileTap={isClickable ? { scale: 0.95 } : undefined}
                className={cn(
                  "relative flex items-center justify-center rounded-full",
                  // Responsive sizing
                  "h-10 w-10 sm:h-12 sm:w-12",
                  "text-sm font-semibold transition-all duration-200",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  isCompleted && "cursor-pointer bg-primary text-white shadow-md hover:shadow-lg",
                  isCurrent &&
                    "border-2 border-primary bg-primary/10 text-primary shadow-sm",
                  !isCompleted &&
                    !isCurrent &&
                    "border-2 border-border bg-background text-muted-foreground"
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <Check className="h-5 w-5" strokeWidth={3} />
                  </motion.div>
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </motion.button>

              <span
                className={cn(
                  "ml-3 hidden text-sm font-semibold sm:block transition-colors duration-200",
                  isCompleted && "text-primary",
                  isCurrent && "text-foreground",
                  !isCompleted && !isCurrent && "text-muted-foreground"
                )}
              >
                {config.label}
              </span>

              {index < CHECKOUT_STEPS.length - 1 && (
                <div className="mx-2 sm:mx-4 h-0.5 sm:h-1 flex-1 overflow-hidden rounded-full bg-border">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: isCompleted ? "100%" : "0%" }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
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
