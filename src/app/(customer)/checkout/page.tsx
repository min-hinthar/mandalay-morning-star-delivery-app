"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/hooks/useAuth";
import { useCart } from "@/lib/hooks/useCart";
import { useCheckoutStore } from "@/lib/stores/checkout-store";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { spring } from "@/lib/motion-tokens";
import { CheckoutStepperV8 } from "@/components/checkout/CheckoutStepperV8";
import { AddressStep } from "@/components/checkout/AddressStep";
import { TimeStep } from "@/components/checkout/TimeStep";
import { PaymentStep } from "@/components/checkout/PaymentStep";
import { CheckoutSummary } from "@/components/checkout/CheckoutSummary";
import type { CheckoutStep } from "@/types/checkout";

/**
 * Direction-aware step transition variants
 * - Forward (1): current slides left, new slides from right
 * - Backward (-1): current slides right, new slides from left
 */
const stepVariants = {
  initial: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 100 : -100,
  }),
  animate: {
    opacity: 1,
    x: 0,
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -100 : 100,
  }),
};

const STEPS: CheckoutStep[] = ["address", "time", "payment"];

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { isEmpty } = useCart();
  const { step, setStep, reset } = useCheckoutStore();
  const { shouldAnimate, getSpring } = useAnimationPreference();

  // Track direction for step transitions
  const [direction, setDirection] = useState(1);
  const prevStepRef = useRef(step);

  // Update direction when step changes
  useEffect(() => {
    const prevIndex = STEPS.indexOf(prevStepRef.current);
    const currentIndex = STEPS.indexOf(step);
    setDirection(currentIndex >= prevIndex ? 1 : -1);
    prevStepRef.current = step;
  }, [step]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/checkout");
    }
  }, [user, authLoading, router]);

  // Redirect if cart is empty
  useEffect(() => {
    if (!authLoading && user && isEmpty) {
      router.push("/menu");
    }
  }, [isEmpty, authLoading, user, router]);

  // Reset checkout state on unmount
  useEffect(() => {
    return () => reset();
  }, [reset]);

  if (authLoading || !user || isEmpty) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-brand-red" />
      </div>
    );
  }

  const handleStepClick = (clickedStep: CheckoutStep) => {
    const currentIndex = STEPS.indexOf(step);
    const clickedIndex = STEPS.indexOf(clickedStep);

    // Only allow going back
    if (clickedIndex < currentIndex) {
      setDirection(-1);
      setStep(clickedStep);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
        <h1 className="mb-6 text-xl sm:text-2xl font-display font-bold text-foreground">
          Checkout
        </h1>

        <CheckoutStepperV8
          currentStep={step}
          onStepClick={handleStepClick}
          className="mb-6 sm:mb-8"
        />

        <div className="grid gap-6 lg:gap-8 lg:grid-cols-3">
          {/* Main content - order form with animated transitions */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border border-border bg-card p-4 sm:p-6 shadow-sm overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                {step === "address" && (
                  <motion.div
                    key="address"
                    custom={direction}
                    variants={stepVariants}
                    initial={shouldAnimate ? "initial" : false}
                    animate="animate"
                    exit={shouldAnimate ? "exit" : undefined}
                    transition={getSpring(spring.default)}
                  >
                    <AddressStep />
                  </motion.div>
                )}
                {step === "time" && (
                  <motion.div
                    key="time"
                    custom={direction}
                    variants={stepVariants}
                    initial={shouldAnimate ? "initial" : false}
                    animate="animate"
                    exit={shouldAnimate ? "exit" : undefined}
                    transition={getSpring(spring.default)}
                  >
                    <TimeStep />
                  </motion.div>
                )}
                {step === "payment" && (
                  <motion.div
                    key="payment"
                    custom={direction}
                    variants={stepVariants}
                    initial={shouldAnimate ? "initial" : false}
                    animate="animate"
                    exit={shouldAnimate ? "exit" : undefined}
                    transition={getSpring(spring.default)}
                  >
                    <PaymentStep />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Order summary - sticky on desktop */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <CheckoutSummary />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
