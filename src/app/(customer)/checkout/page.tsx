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
import {
  CheckoutStepperV8,
  AddressStep,
  TimeStep,
  PaymentStep,
  CheckoutSummary,
} from "@/components/ui/checkout";
import type { CheckoutStep } from "@/types/checkout";

/**
 * Direction-aware step transition variants with scale morph and glow
 * - Forward (1): current slides left, new slides from right
 * - Backward (-1): current slides right, new slides from left
 * - Scale morph gives premium feel to transitions
 * - Subtle glow enhances visual interest
 *
 * Note: boxShadow values are ~--shadow-glow-primary equivalent,
 * kept numeric for Framer Motion interpolation between states.
 */
const stepVariants = {
  initial: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 100 : -100,
    scale: 0.95,
  }),
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    boxShadow: "0 0 30px rgba(164, 16, 52, 0.08)", // ~--shadow-glow-primary light
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -100 : 100,
    scale: 0.95,
    boxShadow: "0 0 0px rgba(164, 16, 52, 0)",
  }),
};

const STEPS: CheckoutStep[] = ["address", "time", "payment"];

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { isEmpty } = useCart();
  const { step, setStep, reset } = useCheckoutStore();
  const { shouldAnimate, getSpring } = useAnimationPreference();

  // Track direction for step transitions using ref for synchronous access
  const directionRef = useRef(1);
  const [, forceUpdate] = useState({});

  // Get current direction value
  const direction = directionRef.current;

  // Navigation handlers that set direction synchronously before step change
  const goToNextStep = () => {
    directionRef.current = 1;
    forceUpdate({});
    const currentIndex = STEPS.indexOf(step);
    if (currentIndex < STEPS.length - 1) {
      setStep(STEPS[currentIndex + 1]);
    }
  };

  const goToPrevStep = () => {
    directionRef.current = -1;
    forceUpdate({});
    const currentIndex = STEPS.indexOf(step);
    if (currentIndex > 0) {
      setStep(STEPS[currentIndex - 1]);
    }
  };

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
      directionRef.current = -1;
      forceUpdate({});
      setStep(clickedStep);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-32">
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
            <div className="rounded-lg border border-border bg-card p-4 sm:p-6 shadow-colorful overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                {step === "address" && (
                  <motion.div
                    key="address"
                    custom={direction}
                    variants={stepVariants}
                    initial={shouldAnimate ? "initial" : false}
                    animate="animate"
                    exit={shouldAnimate ? "exit" : undefined}
                    transition={{
                      x: getSpring(spring.default),
                      scale: getSpring(spring.gentle),
                      opacity: { duration: 0.2 },
                      boxShadow: { duration: 0.3 },
                    }}
                  >
                    <AddressStep onNext={goToNextStep} />
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
                    transition={{
                      x: getSpring(spring.default),
                      scale: getSpring(spring.gentle),
                      opacity: { duration: 0.2 },
                      boxShadow: { duration: 0.3 },
                    }}
                  >
                    <TimeStep onNext={goToNextStep} onBack={goToPrevStep} />
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
                    transition={{
                      x: getSpring(spring.default),
                      scale: getSpring(spring.gentle),
                      opacity: { duration: 0.2 },
                      boxShadow: { duration: 0.3 },
                    }}
                  >
                    <PaymentStep onBack={goToPrevStep} />
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
