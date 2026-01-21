"use client";

import { Check, MapPin, Clock, CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import { CHECKOUT_STEPS, type CheckoutStep } from "@/types/checkout";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

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

/**
 * V6 Checkout Stepper - Pepper Aesthetic
 *
 * Features:
 * - V6 primary color for current step
 * - V6 green for completed steps
 * - Spring-based checkmark animation
 * - Pill-shaped step numbers
 */
export function CheckoutStepper({
  currentStep,
  onStepClick,
  className,
}: CheckoutStepperProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const currentIndex = CHECKOUT_STEPS.indexOf(currentStep);

  return (
    <nav className={cn("w-full py-4", className)} aria-label="Checkout progress">
      <ol className="flex items-start justify-between max-w-md mx-auto">
        {CHECKOUT_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isClickable = isCompleted && onStepClick;
          const config = STEP_CONFIG[step];
          const _Icon = config.icon;

          return (
            <li
              key={step}
              className="flex flex-1 flex-col items-center"
            >
              <div className="flex items-center w-full">
                {/* V6 Connector line - left side */}
                {index > 0 && (
                  <div className="flex-1 h-0.5 bg-border">
                    <motion.div
                      className="h-full bg-green"
                      initial={{ width: 0 }}
                      animate={{ width: isCompleted || isCurrent ? "100%" : "0%" }}
                      transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
                    />
                  </div>
                )}

                {/* V6 Step circle */}
                <motion.button
                  type="button"
                  onClick={() => isClickable && onStepClick(step)}
                  disabled={!isClickable}
                  whileHover={shouldAnimate && isClickable ? { scale: 1.1 } : undefined}
                  whileTap={shouldAnimate && isClickable ? { scale: 0.95 } : undefined}
                  transition={getSpring(spring.snappy)}
                  className={cn(
                    "relative flex items-center justify-center rounded-full",
                    "h-9 w-9",
                    "font-body text-sm font-bold",
                    "transition-all duration-fast",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    isCompleted && "cursor-pointer bg-green text-text-inverse shadow-sm",
                    isCurrent && "bg-primary text-text-inverse shadow-md ring-4 ring-primary/20",
                    !isCompleted && !isCurrent && "border-2 border-border bg-surface-primary text-text-muted"
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isCompleted ? (
                    <motion.div
                      initial={shouldAnimate ? { scale: 0, rotate: -180 } : undefined}
                      animate={shouldAnimate ? { scale: 1, rotate: 0 } : undefined}
                      transition={getSpring(spring.snappy)}
                    >
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </motion.div>
                  ) : (
                    <span className="text-xs font-bold">{index + 1}</span>
                  )}
                </motion.button>

                {/* V6 Connector line - right side */}
                {index < CHECKOUT_STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 bg-border">
                    <motion.div
                      className="h-full bg-green"
                      initial={{ width: 0 }}
                      animate={{ width: isCompleted ? "100%" : "0%" }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  </div>
                )}
              </div>

              {/* V6 Label below circle */}
              <motion.span
                className={cn(
                  "mt-2 font-body text-[10px] font-bold uppercase tracking-wider",
                  "transition-colors duration-fast",
                  isCompleted && "text-green",
                  isCurrent && "text-text-primary",
                  !isCompleted && !isCurrent && "text-text-muted"
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
