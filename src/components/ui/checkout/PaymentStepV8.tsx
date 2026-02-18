"use client";

/**
 * PaymentStepV8 Component
 * Payment review step with enhanced loading states for Stripe checkout session
 *
 * Features:
 * - Animated loading spinner during checkout session creation
 * - Security badge animations
 * - Processing state on button
 * - Smooth transitions with motion tokens
 * - Respects animation preferences
 *
 * Note: Uses Stripe Checkout Sessions (hosted page redirect), NOT embedded elements.
 */

import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { ArrowLeft, CreditCard, ShieldCheck, Lock, MapPin, Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { handleRateLimitResponse } from "@/lib/hooks/useRateLimitToast";
import { spring, staggerContainer, staggerItem } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useCart } from "@/lib/hooks/useCart";
import { useCheckoutStore } from "@/lib/stores/checkout-store";
import { TimeSlotDisplay } from "./TimeSlotDisplay";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BrandedSpinner } from "@/components/ui/branded-spinner";
import { ErrorShake } from "@/components/ui/error-shake";
import { DietarySummaryCard } from "./DietarySummaryCard";

/** Button entry animation variant */
const buttonEntry = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 500, damping: 30, mass: 0.8 },
  },
};

// ============================================
// TYPES
// ============================================

export interface PaymentStepV8Props {
  /** Additional className */
  className?: string;
  /** Custom back step handler */
  onBack?: () => void;
  /** Disable navigation guard before external redirect */
  disableGuard?: () => void;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function PaymentStepV8({ className, onBack, disableGuard }: PaymentStepV8Props) {
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { shouldAnimate, getSpring } = useAnimationPreference();
  const { items } = useCart();
  const {
    address,
    delivery,
    customerNotes,
    setCustomerNotes,
    prevStep: storePrevStep,
  } = useCheckoutStore();

  const handleBack = onBack || storePrevStep;

  const handleCheckout = async () => {
    if (!address || !delivery) return;

    setIsCreatingSession(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId: address.id,
          scheduledDate: delivery.date,
          timeWindowStart: delivery.windowStart,
          timeWindowEnd: delivery.windowEnd,
          items: items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            modifiers: item.modifiers.map((m) => ({ optionId: m.optionId })),
            notes: item.notes || undefined,
          })),
          customerNotes: customerNotes || undefined,
        }),
      });

      // Handle 429 rate limit with reassuring checkout-specific message
      if (handleRateLimitResponse(response, { isOrderPlacement: true })) {
        setIsCreatingSession(false);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message ?? "Checkout failed");
      }

      // Disable navigation guard before Stripe redirect to prevent "Leave page?" dialog
      disableGuard?.();
      window.location.href = data.data.sessionUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsCreatingSession(false);
    }
  };

  return (
    <m.div
      className={cn("space-y-6", className)}
      variants={shouldAnimate ? staggerContainer(0.08, 0.1) : undefined}
      initial={shouldAnimate ? "hidden" : undefined}
      animate={shouldAnimate ? "visible" : undefined}
    >
      {/* Header with stagger */}
      <m.div variants={shouldAnimate ? staggerItem : undefined}>
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-semibold text-text-primary">Review & Pay</h2>
        </div>
        <p className="font-body text-sm text-text-muted">
          Review your order and proceed to payment
        </p>
      </m.div>

      {/* Creating Session Loading State - uses BrandedSpinner */}
      <AnimatePresence mode="wait">
        {isCreatingSession ? (
          <m.div
            key="loading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={getSpring(spring.default)}
            className="flex flex-col items-center justify-center py-12 space-y-4"
          >
            <BrandedSpinner size="lg" label="Preparing checkout" />
            <m.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm text-text-muted"
            >
              Preparing secure checkout...
            </m.p>
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-2 text-xs text-text-muted"
            >
              <Lock className="w-3 h-3" />
              <span>Secured by Stripe</span>
            </m.div>
          </m.div>
        ) : (
          <m.div
            key="content"
            variants={shouldAnimate ? staggerContainer(0.08, 0) : undefined}
            initial={shouldAnimate ? "hidden" : undefined}
            animate={shouldAnimate ? "visible" : undefined}
            exit={shouldAnimate ? { opacity: 0 } : undefined}
            className="space-y-6"
          >
            {/* Order Summary Card with stagger */}
            <m.div
              variants={shouldAnimate ? staggerItem : undefined}
              className="space-y-4 rounded-lg bg-surface-secondary p-5 border border-border"
            >
              {/* Address */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <h3 className="font-body text-sm font-medium text-text-muted">
                    Delivery Address
                  </h3>
                </div>
                <p className="font-body text-text-primary text-left">{address?.formattedAddress}</p>
              </div>

              {/* Time */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <h3 className="font-body text-sm font-medium text-text-muted">Delivery Time</h3>
                </div>
                {delivery && (
                  <TimeSlotDisplay
                    selection={delivery}
                    className="mt-1 bg-primary/10 rounded-lg p-3 justify-center"
                  />
                )}
              </div>
            </m.div>

            {/* Dietary Summary Card with stagger */}
            <m.div variants={shouldAnimate ? staggerItem : undefined}>
              <DietarySummaryCard />
            </m.div>

            {/* Notes Input with stagger */}
            <m.div variants={shouldAnimate ? staggerItem : undefined} className="space-y-2">
              <Label
                htmlFor="customerNotes"
                className="font-body text-sm font-medium text-text-primary"
              >
                Order Notes (optional)
              </Label>
              <Textarea
                id="customerNotes"
                placeholder="Any special instructions for your order..."
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                maxLength={500}
                rows={3}
                className="font-body"
              />
              <p className="font-body text-xs text-text-muted">
                {customerNotes.length}/500 characters
              </p>
            </m.div>

            {/* Security Badge with stagger */}
            <m.div
              variants={shouldAnimate ? staggerItem : undefined}
              className="p-4 rounded-lg bg-status-success-bg border border-status-success/20"
            >
              <div className="flex items-center gap-3">
                <m.div
                  animate={
                    shouldAnimate
                      ? {
                          scale: [1, 1.1, 1],
                        }
                      : undefined
                  }
                  transition={{
                    duration: 2,
                    repeat: 5,
                    repeatDelay: 3,
                  }}
                >
                  <ShieldCheck className="h-5 w-5 text-status-success" />
                </m.div>
                <div>
                  <p className="text-sm font-medium text-status-success">Secure Payment</p>
                  <p className="text-xs text-status-success">
                    You&apos;ll be redirected to Stripe&apos;s secure checkout page to complete your
                    payment.
                  </p>
                </div>
              </div>
            </m.div>

            {/* Error State with ErrorShake */}
            <AnimatePresence>
              {error && (
                <ErrorShake shake={!!error}>
                  <m.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={getSpring(spring.default)}
                    className="rounded-lg bg-status-error-bg border border-status-error/20 p-4"
                  >
                    <p className="text-sm text-status-error">{error}</p>
                  </m.div>
                </ErrorShake>
              )}
            </AnimatePresence>
          </m.div>
        )}
      </AnimatePresence>

      {/* Navigation with button entry animation */}
      {!isCreatingSession && (
        <m.div
          variants={shouldAnimate ? buttonEntry : undefined}
          className="flex justify-between pt-4 border-t border-border"
        >
          <Button variant="ghost" onClick={handleBack} disabled={isCreatingSession}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <Button
            variant="success"
            size="lg"
            onClick={handleCheckout}
            disabled={isCreatingSession}
            isLoading={isCreatingSession}
            loadingText="Processing..."
            leftIcon={!isCreatingSession ? <CreditCard className="w-5 h-5" /> : undefined}
          >
            Place Order
          </Button>
        </m.div>
      )}
    </m.div>
  );
}

export default PaymentStepV8;
