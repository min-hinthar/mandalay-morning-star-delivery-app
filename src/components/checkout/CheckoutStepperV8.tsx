"use client";

import { Check, MapPin, Clock, CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import { CHECKOUT_STEPS, type CheckoutStep } from "@/types/checkout";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

interface CheckoutStepperV8Props {
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
 * V8 Checkout Stepper - Enhanced Animations
 *
 * Features:
 * - Pulsing ring on current step using scale keyframes
 * - Line fill with spring.rubbery for satisfying progress
 * - Hover scale on clickable (completed) steps
 * - Check icon with spring.ultraBouncy
 * - useAnimationPreference for reduced motion support
 */
export function CheckoutStepperV8({
  currentStep,
  onStepClick,
  className,
}: CheckoutStepperV8Props) {
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

          return (
            <li
              key={step}
              className="flex flex-1 flex-col items-center"
            >
              <div className="flex items-center w-full">
                {/* V8 Connector line - left side */}
                {index > 0 && (
                  <div className="flex-1 h-0.5 bg-border overflow-hidden">
                    <motion.div
                      className="h-full bg-green"
                      initial={{ width: 0 }}
                      animate={{ width: isCompleted || isCurrent ? "100%" : "0%" }}
                      transition={getSpring(spring.rubbery)}
                    />
                  </div>
                )}

                {/* V8 Step circle with pulsing ring for current */}
                <div className="relative">
                  {/* Pulsing ring for current step */}
                  {isCurrent && shouldAnimate && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-primary/30"
                      initial={{ scale: 1, opacity: 0.6 }}
                      animate={{
                        scale: [1, 1.4, 1],
                        opacity: [0.6, 0, 0.6],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  )}

                  <motion.button
                    type="button"
                    onClick={() => isClickable && onStepClick(step)}
                    disabled={!isClickable}
                    whileHover={shouldAnimate && isClickable ? { scale: 1.15 } : undefined}
                    whileTap={shouldAnimate && isClickable ? { scale: 0.95 } : undefined}
                    transition={getSpring(spring.snappy)}
                    className={cn(
                      "relative flex items-center justify-center rounded-full",
                      "h-9 w-9",
                      "font-body text-sm font-bold",
                      "transition-all duration-fast",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                      isCompleted && "cursor-pointer bg-green text-text-inverse shadow-sm",
                      isCurrent && "bg-primary text-text-inverse shadow-md",
                      !isCompleted && !isCurrent && "border-2 border-border bg-surface-primary text-text-muted"
                    )}
                    aria-current={isCurrent ? "step" : undefined}
                  >
                    {isCompleted ? (
                      <motion.div
                        initial={shouldAnimate ? { scale: 0, rotate: -180 } : undefined}
                        animate={shouldAnimate ? { scale: 1, rotate: 0 } : undefined}
                        transition={getSpring(spring.ultraBouncy)}
                      >
                        <Check className="h-4 w-4" strokeWidth={3} />
                      </motion.div>
                    ) : (
                      <span className="text-xs font-bold">{index + 1}</span>
                    )}
                  </motion.button>
                </div>

                {/* V8 Connector line - right side */}
                {index < CHECKOUT_STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 bg-border overflow-hidden">
                    <motion.div
                      className="h-full bg-green"
                      initial={{ width: 0 }}
                      animate={{ width: isCompleted ? "100%" : "0%" }}
                      transition={getSpring(spring.rubbery)}
                    />
                  </div>
                )}
              </div>

              {/* V8 Label below circle with fade animation */}
              <motion.span
                initial={shouldAnimate ? { opacity: 0, y: 4 } : undefined}
                animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
                transition={{ delay: index * 0.1, ...getSpring(spring.gentle) }}
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
