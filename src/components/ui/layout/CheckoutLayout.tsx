"use client";

import { type ReactNode, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, X, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";

import type { CheckoutStep } from "@/types/checkout";

const STEPS: { id: CheckoutStep; label: string }[] = [
  { id: "address", label: "Address" },
  { id: "time", label: "Time" },
  { id: "payment", label: "Payment" },
];

const BUTTON_TEXT: Record<CheckoutStep, string> = {
  address: "Continue to Time",
  time: "Continue to Payment",
  payment: "Pay Now",
};

interface CheckoutLayoutProps {
  children: ReactNode;
  /** Current checkout step */
  currentStep: CheckoutStep;
  /** Callback when step changes */
  onStepChange?: (step: CheckoutStep) => void;
  /** Callback for the main action button */
  onContinue: () => void;
  /** Whether the current step is complete and can proceed */
  canContinue?: boolean;
  /** Loading state for the action button */
  isLoading?: boolean;
  /** Order total for Pay step */
  total?: number;
  /** Custom back behavior */
  onBack?: () => void;
  /** Callback when user wants to close/cancel checkout */
  onClose?: () => void;
}

/**
 * Checkout Flow Shell
 * 3-step checkout layout: Address -> Time -> Payment
 *
 * Structure:
 * - Header with back/close navigation
 * - Horizontal step indicator
 * - Scrollable step content
 * - Fixed bottom action button
 */
export function CheckoutLayout({
  children,
  currentStep,
  onStepChange,
  onContinue,
  canContinue = true,
  isLoading = false,
  total = 0,
  onBack,
  onClose,
}: CheckoutLayoutProps) {
  const router = useRouter();

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
      return;
    }

    if (currentStepIndex > 0) {
      onStepChange?.(STEPS[currentStepIndex - 1].id);
    } else {
      router.back();
    }
  }, [currentStepIndex, onBack, onStepChange, router]);

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      // Default: confirm before leaving
      if (window.confirm("Are you sure you want to leave checkout?")) {
        router.push("/menu");
      }
    }
  }, [onClose, router]);

  const getButtonText = () => {
    if (currentStep === "payment" && total > 0) {
      return `Pay $${total.toFixed(2)}`;
    }
    return BUTTON_TEXT[currentStep];
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      {/* Header */}
      <header className="sticky top-0 z-20 h-14 border-b border-[var(--color-border)] bg-[var(--color-cream)]">
        <div className="mx-auto flex h-full max-w-[var(--max-content-width)] items-center justify-between px-4">
          {/* Back Button */}
          <motion.button
            onClick={handleBack}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              "text-[var(--color-charcoal)]",
              "transition-colors hover:bg-[var(--color-cream-darker)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            )}
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </motion.button>

          {/* Title */}
          <h1 className="font-display text-lg font-semibold text-[var(--color-charcoal)]">
            Checkout
          </h1>

          {/* Close Button */}
          <motion.button
            onClick={handleClose}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              "text-[var(--color-charcoal-muted)]",
              "transition-colors hover:bg-[var(--color-cream-darker)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            )}
            aria-label="Close checkout"
          >
            <X className="h-5 w-5" />
          </motion.button>
        </div>
      </header>

      {/* Step Indicator */}
      <div className="border-b border-[var(--color-border)] bg-[var(--color-cream)] px-4 py-4">
        <div className="mx-auto max-w-[var(--max-content-width)]">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <div key={step.id} className="flex flex-1 items-center">
                  {/* Step Circle */}
                  <div className="flex flex-col items-center gap-1.5">
                    <motion.div
                      initial={false}
                      animate={{
                        scale: isCurrent ? 1.1 : 1,
                        backgroundColor: isCompleted
                          ? "var(--color-jade)"
                          : isCurrent
                            ? "var(--color-primary)"
                            : "transparent",
                        borderColor: isCompleted
                          ? "var(--color-jade)"
                          : isCurrent
                            ? "var(--color-primary)"
                            : "var(--color-border)",
                      }}
                      transition={spring.snappy}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full border-2",
                        isCompleted || isCurrent ? "text-text-inverse" : "text-[var(--color-charcoal-muted)]"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <span className="text-xs font-semibold">{index + 1}</span>
                      )}
                    </motion.div>
                    <span
                      className={cn(
                        "text-2xs font-medium uppercase tracking-wide",
                        isCurrent
                          ? "text-[var(--color-primary)]"
                          : isCompleted
                            ? "text-[var(--color-jade)]"
                            : "text-[var(--color-charcoal-muted)]"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>

                  {/* Connecting Line */}
                  {index < STEPS.length - 1 && (
                    <div className="relative mx-2 h-0.5 flex-1">
                      <div className="absolute inset-0 bg-[var(--color-border)]" />
                      <motion.div
                        initial={false}
                        animate={{
                          scaleX: isCompleted ? 1 : 0,
                        }}
                        transition={spring.smooth}
                        className="absolute inset-0 origin-left bg-[var(--color-jade)]"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <main
        className="flex-1 overflow-y-auto"
        style={{
          paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div className="mx-auto max-w-[var(--max-content-width)] px-4 py-6">
          {children}
        </div>
      </main>

      {/* Action Button */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-30",
          "border-t border-[var(--color-border)] bg-[var(--color-cream)]"
        )}
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div className="mx-auto max-w-[var(--max-content-width)] px-4 py-4">
          <motion.button
            onClick={onContinue}
            disabled={!canContinue || isLoading}
            whileHover={canContinue && !isLoading ? { scale: 1.01 } : undefined}
            whileTap={canContinue && !isLoading ? { scale: 0.99 } : undefined}
            className={cn(
              "flex h-12 w-full items-center justify-center rounded-lg",
              "font-semibold text-base",
              "transition-all duration-[var(--duration-fast)]",
              canContinue && !isLoading
                ? "bg-[var(--color-primary)] text-text-inverse shadow-[var(--shadow-glow-primary)] hover:brightness-110"
                : "cursor-not-allowed bg-[var(--color-border)] text-[var(--color-charcoal-muted)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-cta)]"
            )}
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-5 w-5 rounded-full border-2 border-white border-t-transparent"
              />
            ) : (
              <>
                {getButtonText()}
                {currentStep !== "payment" && (
                  <span className="ml-2">→</span>
                )}
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

export default CheckoutLayout;
