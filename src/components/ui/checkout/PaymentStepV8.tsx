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
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CreditCard,
  ShieldCheck,
  Lock,
  MapPin,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
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
}

// ============================================
// MAIN COMPONENT
// ============================================

export function PaymentStepV8({ className, onBack }: PaymentStepV8Props) {
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message ?? "Checkout failed");
      }

      // Redirect to Stripe hosted checkout page
      window.location.href = data.data.sessionUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsCreatingSession(false);
    }
  };

  return (
    <motion.div
      className={cn("space-y-6", className)}
      variants={shouldAnimate ? staggerContainer(0.08, 0.1) : undefined}
      initial={shouldAnimate ? "hidden" : undefined}
      animate={shouldAnimate ? "visible" : undefined}
    >
      {/* Header with stagger */}
      <motion.div variants={shouldAnimate ? staggerItem : undefined}>
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-semibold text-foreground">
            Review & Pay
          </h2>
        </div>
        <p className="font-body text-sm text-muted-foreground">
          Review your order and proceed to payment
        </p>
      </motion.div>

      {/* Creating Session Loading State - uses BrandedSpinner */}
      <AnimatePresence mode="wait">
        {isCreatingSession ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={getSpring(spring.default)}
            className="flex flex-col items-center justify-center py-12 space-y-4"
          >
            <BrandedSpinner size="lg" label="Preparing checkout" />
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm text-muted-foreground"
            >
              Preparing secure checkout...
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <Lock className="w-3 h-3" />
              <span>Secured by Stripe</span>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            variants={shouldAnimate ? staggerContainer(0.08, 0) : undefined}
            initial={shouldAnimate ? "hidden" : undefined}
            animate={shouldAnimate ? "visible" : undefined}
            exit={shouldAnimate ? { opacity: 0 } : undefined}
            className="space-y-6"
          >
            {/* Order Summary Card with stagger */}
            <motion.div
              variants={shouldAnimate ? staggerItem : undefined}
              className="space-y-4 rounded-lg bg-muted/50 p-5 border border-border"
            >
              {/* Address */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <h3 className="font-body text-sm font-medium text-muted-foreground">
                    Delivery Address
                  </h3>
                </div>
                <p className="font-body text-foreground text-center">
                  {address?.formattedAddress}
                </p>
              </div>

              {/* Time */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <h3 className="font-body text-sm font-medium text-muted-foreground">
                    Delivery Time
                  </h3>
                </div>
                {delivery && (
                  <TimeSlotDisplay
                    selection={delivery}
                    className="mt-1 bg-primary/10 rounded-lg p-3 justify-center"
                  />
                )}
              </div>
            </motion.div>

            {/* Notes Input with stagger */}
            <motion.div
              variants={shouldAnimate ? staggerItem : undefined}
              className="space-y-2"
            >
              <Label
                htmlFor="customerNotes"
                className="font-body text-sm font-medium text-foreground"
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
              <p className="font-body text-xs text-muted-foreground">
                {customerNotes.length}/500 characters
              </p>
            </motion.div>

            {/* Security Badge with stagger */}
            <motion.div
              variants={shouldAnimate ? staggerItem : undefined}
              className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200/50 dark:border-green-800/30"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  animate={
                    shouldAnimate
                      ? {
                          scale: [1, 1.1, 1],
                        }
                      : undefined
                  }
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                  }}
                >
                  <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                </motion.div>
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Secure Payment
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    You&apos;ll be redirected to Stripe&apos;s secure checkout
                    page to complete your payment.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Error State with ErrorShake */}
            <AnimatePresence>
              {error && (
                <ErrorShake shake={!!error}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={getSpring(spring.default)}
                    className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200/50 dark:border-red-800/30 p-4"
                  >
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {error}
                    </p>
                  </motion.div>
                </ErrorShake>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation with button entry animation */}
      {!isCreatingSession && (
        <motion.div
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
        </motion.div>
      )}
    </motion.div>
  );
}

export default PaymentStepV8;
