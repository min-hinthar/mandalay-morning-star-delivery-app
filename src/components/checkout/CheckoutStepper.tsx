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
  payment: { label: "Pay", icon: CreditCard },
};

export function CheckoutStepper({
  currentStep,
  onStepClick,
  className,
}: CheckoutStepperProps) {
  const currentIndex = CHECKOUT_STEPS.indexOf(currentStep);

  return (
    <nav className={cn("w-full py-4", className)} aria-label="Checkout progress">
      <ol className="flex items-start justify-between max-w-md mx-auto">
        {CHECKOUT_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isClickable = isCompleted && onStepClick;
          const config = STEP_CONFIG[step];
          const Icon = config.icon;

          return (
            <li
              key={step}
              className="flex flex-1 flex-col items-center"
            >
              <div className="flex items-center w-full">
                {/* Connector line - left side */}
                {index > 0 && (
                  <div className="flex-1 h-0.5 bg-[var(--color-border)]">
                    <motion.div
                      className="h-full bg-[var(--color-accent-secondary)]"
                      initial={{ width: 0 }}
                      animate={{ width: isCompleted || isCurrent ? "100%" : "0%" }}
                      transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
                    />
                  </div>
                )}

                {/* Step circle */}
                <motion.button
                  type="button"
                  onClick={() => isClickable && onStepClick(step)}
                  disabled={!isClickable}
                  whileHover={isClickable ? { scale: 1.1 } : undefined}
                  whileTap={isClickable ? { scale: 0.95 } : undefined}
                  className={cn(
                    "relative flex items-center justify-center rounded-full",
                    "h-8 w-8",
                    "text-sm font-semibold transition-all duration-200",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-interactive-primary)] focus-visible:ring-offset-2",
                    isCompleted && "cursor-pointer bg-[var(--color-accent-secondary)] text-white shadow-sm",
                    isCurrent && "bg-[var(--color-interactive-primary)] text-white shadow-[var(--shadow-glow-gold)]",
                    !isCompleted && !isCurrent && "border-2 border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]"
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </motion.div>
                  ) : (
                    <span className="text-xs font-bold">{index + 1}</span>
                  )}
                </motion.button>

                {/* Connector line - right side */}
                {index < CHECKOUT_STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 bg-[var(--color-border)]">
                    <motion.div
                      className="h-full bg-[var(--color-accent-secondary)]"
                      initial={{ width: 0 }}
                      animate={{ width: isCompleted ? "100%" : "0%" }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  </div>
                )}
              </div>

              {/* Label below circle */}
              <motion.span
                className={cn(
                  "mt-2 text-[10px] font-bold uppercase tracking-wider transition-colors duration-200",
                  isCompleted && "text-[var(--color-accent-secondary)]",
                  isCurrent && "text-[var(--color-text-primary)]",
                  !isCompleted && !isCurrent && "text-[var(--color-text-secondary)]"
                )}
              >
                {config.label}
              </motion.span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
