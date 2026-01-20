"use client";

import React, { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, CreditCard, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { v7Spring } from "@/lib/motion-tokens-v7";
import { useAnimationPreferenceV7 } from "@/lib/hooks/useAnimationPreferenceV7";
import { Button } from "@/components/ui/button";
import type { CheckoutStep } from "@/types/checkout";
import type { Address } from "@/types/address";
import type { DeliverySelection } from "@/types/delivery";

// ============================================
// TYPES
// ============================================

export interface CheckoutWizardV7Props {
  /** Current step */
  currentStep: CheckoutStep;
  /** Callback when step changes */
  onStepChange: (step: CheckoutStep) => void;
  /** Selected address */
  selectedAddress: Address | null;
  /** Selected delivery time */
  selectedDelivery: DeliverySelection | null;
  /** Whether payment is processing */
  isProcessing?: boolean;
  /** Content to render for each step */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

interface StepConfig {
  id: CheckoutStep;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
}

// ============================================
// STEP INDICATOR
// ============================================

interface StepIndicatorV7Props {
  steps: StepConfig[];
  currentStep: CheckoutStep;
  completedSteps: CheckoutStep[];
  onStepClick: (step: CheckoutStep) => void;
}

function StepIndicatorV7({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
}: StepIndicatorV7Props) {
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="relative">
      {/* Progress line */}
      <div className="absolute top-6 left-0 right-0 h-0.5 bg-v6-border mx-8" />
      <motion.div
        className="absolute top-6 left-0 h-0.5 bg-v6-primary mx-8 origin-left"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: currentIndex / (steps.length - 1) }}
        transition={getSpring(v7Spring.rubbery)}
      />

      {/* Steps */}
      <div className="relative flex justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          const isClickable = index < currentIndex || isCompleted;

          return (
            <motion.button
              key={step.id}
              type="button"
              onClick={() => isClickable && onStepClick(step.id)}
              disabled={!isClickable}
              className={cn(
                "flex flex-col items-center gap-2 group",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v6-primary focus-visible:ring-offset-2 rounded-lg p-2 -m-2",
                isClickable ? "cursor-pointer" : "cursor-default"
              )}
              whileHover={shouldAnimate && isClickable ? { scale: 1.05 } : undefined}
              whileTap={shouldAnimate && isClickable ? { scale: 0.95 } : undefined}
            >
              {/* Circle */}
              <motion.div
                className={cn(
                  "relative w-12 h-12 rounded-full flex items-center justify-center",
                  "border-2 transition-colors duration-200",
                  isCompleted
                    ? "bg-v6-primary border-v6-primary text-white"
                    : isCurrent
                    ? "bg-v6-primary-light border-v6-primary text-v6-primary"
                    : "bg-v6-surface-secondary border-v6-border text-v6-text-muted"
                )}
                animate={
                  isCurrent && shouldAnimate
                    ? {
                        scale: [1, 1.05, 1],
                        boxShadow: [
                          "0 0 0 0 rgba(164, 16, 52, 0)",
                          "0 0 0 8px rgba(164, 16, 52, 0.1)",
                          "0 0 0 0 rgba(164, 16, 52, 0)",
                        ],
                      }
                    : undefined
                }
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
              >
                <AnimatePresence mode="wait">
                  {isCompleted ? (
                    <motion.div
                      key="check"
                      initial={shouldAnimate ? { scale: 0, rotate: -90 } : undefined}
                      animate={shouldAnimate ? { scale: 1, rotate: 0 } : undefined}
                      exit={shouldAnimate ? { scale: 0, rotate: 90 } : undefined}
                      transition={getSpring(v7Spring.ultraBouncy)}
                    >
                      <Check className="w-6 h-6" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="icon"
                      initial={shouldAnimate ? { scale: 0 } : undefined}
                      animate={shouldAnimate ? { scale: 1 } : undefined}
                      exit={shouldAnimate ? { scale: 0 } : undefined}
                    >
                      {step.icon}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Label */}
              <span
                className={cn(
                  "text-xs font-medium transition-colors",
                  isCurrent || isCompleted
                    ? "text-v6-text-primary"
                    : "text-v6-text-muted"
                )}
              >
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden">{step.shortLabel}</span>
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// STEP CONTENT WRAPPER
// ============================================

interface StepContentV7Props {
  step: CheckoutStep;
  currentStep: CheckoutStep;
  direction: number;
  children: React.ReactNode;
}

function StepContentV7({
  step,
  currentStep,
  direction,
  children,
}: StepContentV7Props) {
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -100 : 100,
      opacity: 0,
      scale: 0.95,
    }),
  };

  if (step !== currentStep) return null;

  return (
    <motion.div
      key={step}
      custom={direction}
      variants={shouldAnimate ? variants : undefined}
      initial="enter"
      animate="center"
      exit="exit"
      transition={getSpring(v7Spring.default)}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

// ============================================
// STEP CARD WRAPPER
// ============================================

export interface CheckoutStepCardV7Props {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function CheckoutStepCardV7({
  title,
  description,
  icon,
  children,
  className,
}: CheckoutStepCardV7Props) {
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={getSpring(v7Spring.default)}
      className={cn(
        "bg-v6-surface-primary rounded-2xl",
        "border border-v6-border",
        "shadow-v6-card",
        "overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-v6-border bg-v6-surface-secondary">
        <div className="flex items-center gap-3">
          {icon && (
            <motion.div
              animate={shouldAnimate ? {
                rotate: [0, -5, 5, 0],
              } : undefined}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
              }}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                "bg-v6-primary-light text-v6-primary"
              )}
            >
              {icon}
            </motion.div>
          )}
          <div>
            <h2 className="text-lg font-v6-display font-bold text-v6-text-primary">
              {title}
            </h2>
            {description && (
              <p className="text-sm text-v6-text-secondary">{description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">{children}</div>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

const STEPS: StepConfig[] = [
  {
    id: "address",
    label: "Delivery Address",
    shortLabel: "Address",
    icon: <MapPin className="w-5 h-5" />,
  },
  {
    id: "time",
    label: "Delivery Time",
    shortLabel: "Time",
    icon: <Clock className="w-5 h-5" />,
  },
  {
    id: "payment",
    label: "Payment",
    shortLabel: "Pay",
    icon: <CreditCard className="w-5 h-5" />,
  },
];

export function CheckoutWizardV7({
  currentStep,
  onStepChange,
  selectedAddress,
  selectedDelivery,
  isProcessing = false,
  children,
  className,
}: CheckoutWizardV7Props) {
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();
  const [direction, setDirection] = useState(0);

  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  // Determine completed steps
  const completedSteps = useMemo(() => {
    const completed: CheckoutStep[] = [];
    if (selectedAddress) completed.push("address");
    if (selectedDelivery) completed.push("time");
    return completed;
  }, [selectedAddress, selectedDelivery]);

  // Navigation
  const canGoBack = currentIndex > 0;
  const canGoNext = currentIndex < STEPS.length - 1;

  const goToStep = useCallback(
    (step: CheckoutStep) => {
      const newIndex = STEPS.findIndex((s) => s.id === step);
      setDirection(newIndex > currentIndex ? 1 : -1);
      onStepChange(step);
    },
    [currentIndex, onStepChange]
  );

  const goBack = useCallback(() => {
    if (canGoBack) {
      goToStep(STEPS[currentIndex - 1].id);
    }
  }, [canGoBack, currentIndex, goToStep]);

  const goNext = useCallback(() => {
    if (canGoNext) {
      goToStep(STEPS[currentIndex + 1].id);
    }
  }, [canGoNext, currentIndex, goToStep]);

  // Validate current step completion
  const isStepComplete = useMemo(() => {
    switch (currentStep) {
      case "address":
        return !!selectedAddress;
      case "time":
        return !!selectedDelivery;
      case "payment":
        return false; // Payment handled separately
      default:
        return false;
    }
  }, [currentStep, selectedAddress, selectedDelivery]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Step Indicator */}
      <motion.div
        initial={shouldAnimate ? { opacity: 0, y: -20 } : undefined}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
        transition={getSpring(v7Spring.default)}
        className="bg-v6-surface-primary rounded-2xl p-6 border border-v6-border shadow-v6-card"
      >
        <StepIndicatorV7
          steps={STEPS}
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={goToStep}
        />
      </motion.div>

      {/* Step Content */}
      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait" custom={direction}>
          <StepContentV7
            key={currentStep}
            step={currentStep}
            currentStep={currentStep}
            direction={direction}
          >
            {children}
          </StepContentV7>
        </AnimatePresence>
      </div>

      {/* Navigation Footer */}
      <motion.div
        initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
        transition={{ delay: 0.2 }}
        className={cn(
          "flex items-center justify-between gap-4",
          "p-4 bg-v6-surface-secondary rounded-2xl",
          "border border-v6-border"
        )}
      >
        {/* Back button */}
        <motion.div
          whileHover={shouldAnimate && canGoBack ? { x: -4 } : undefined}
        >
          <Button
            variant="outline"
            size="lg"
            onClick={goBack}
            disabled={!canGoBack || isProcessing}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
        </motion.div>

        {/* Step counter */}
        <span className="text-sm text-v6-text-muted">
          Step {currentIndex + 1} of {STEPS.length}
        </span>

        {/* Next/Submit button */}
        {currentStep !== "payment" ? (
          <motion.div
            whileHover={shouldAnimate && isStepComplete ? { x: 4 } : undefined}
          >
            <Button
              variant="primary"
              size="lg"
              onClick={goNext}
              disabled={!isStepComplete || isProcessing}
              className="gap-2"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </Button>
          </motion.div>
        ) : (
          <motion.div
            whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
            whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
          >
            <Button
              variant="primary"
              size="lg"
              disabled={isProcessing}
              className="gap-2 min-w-[160px]"
            >
              {isProcessing ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Pay Now
                </>
              )}
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

// ============================================
// CHECKOUT SUMMARY SIDEBAR
// ============================================

export interface CheckoutSummaryV7Props {
  className?: string;
  children: React.ReactNode;
}

export function CheckoutSummaryV7({
  className,
  children,
}: CheckoutSummaryV7Props) {
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();

  return (
    <motion.aside
      initial={shouldAnimate ? { opacity: 0, x: 20 } : undefined}
      animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
      transition={getSpring(v7Spring.default)}
      className={cn(
        "bg-v6-surface-primary rounded-2xl",
        "border border-v6-border",
        "shadow-v6-card",
        "sticky top-4",
        className
      )}
    >
      {children}
    </motion.aside>
  );
}

export default CheckoutWizardV7;
