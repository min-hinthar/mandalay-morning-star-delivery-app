"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import { ArrowLeft, CreditCard, ShieldCheck, Lock, Banknote } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { handleRateLimitResponse } from "@/lib/hooks/useRateLimitToast";
import { spring, staggerContainer, staggerItem } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useCart } from "@/lib/hooks/useCart";
import { useCheckoutStore, useCanProceed } from "@/lib/stores/checkout-store";
import type { TimeWindow } from "@/types/delivery";
import { TipSelector } from "./TipSelector";
import { PromoCodeInput } from "./PromoCodeInput";
import { ContactInfoSection } from "./ContactInfoSection";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { OrderSummaryCard } from "./OrderSummaryCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BrandedSpinner } from "@/components/ui/branded-spinner";
import { DietarySummaryCard } from "./DietarySummaryCard";
import { CheckoutErrorBanner, type CheckoutErrorData } from "./CheckoutErrorBanner";

const buttonEntry = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 500, damping: 30, mass: 0.8 },
  },
};

export interface PaymentStepV8Props {
  className?: string;
  onBack?: () => void;
  disableGuard?: () => void;
  timeWindows?: TimeWindow[];
  onCutoffPassed?: () => void;
  codEnabled?: boolean;
}

export function PaymentStepV8({
  className,
  onBack,
  disableGuard,
  timeWindows = [],
  onCutoffPassed,
  codEnabled = false,
}: PaymentStepV8Props) {
  const router = useRouter();
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [error, setError] = useState<CheckoutErrorData | null>(null);
  const saveToProfileRef = useRef(false);

  const { shouldAnimate, getSpring } = useAnimationPreference();
  const { items, itemsSubtotal } = useCart();
  const canProceed = useCanProceed();
  const {
    address,
    delivery,
    setDelivery,
    customerNotes,
    setCustomerNotes,
    tipPercent,
    customTipCents,
    promoCode,
    promoApplied,
    deliveryInstructions,
    setDeliveryInstructions,
    paymentMethod,
    setPaymentMethod,
    customerPhone,
    customerName,
    prevStep: storePrevStep,
    setStep,
  } = useCheckoutStore();

  const tipCents =
    tipPercent !== null ? Math.round((itemsSubtotal * tipPercent) / 100) : customTipCents;

  const handleBack = onBack || storePrevStep;
  const isCOD = paymentMethod === "cod";

  const handleCheckout = async () => {
    if (!address || !delivery || !canProceed) return;

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
            modifiers: item.modifiers.map((mod) => ({
              optionId: mod.optionId,
            })),
            notes: item.notes || undefined,
          })),
          customerNotes: customerNotes || undefined,
          tipCents,
          promoCode: promoApplied ? promoCode : undefined,
          deliveryInstructions: deliveryInstructions || undefined,
          paymentMethod,
          customerPhone,
          customerName,
        }),
      });

      if (handleRateLimitResponse(response, { isOrderPlacement: true })) {
        setIsCreatingSession(false);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.code === "CUTOFF_PASSED" && onCutoffPassed) {
          setIsCreatingSession(false);
          onCutoffPassed();
          return;
        }
        setError({
          code: data.error?.code ?? "INTERNAL_ERROR",
          message: data.error?.message ?? "Checkout failed",
          details: data.error?.details,
        });
        setIsCreatingSession(false);
        return;
      }

      if (saveToProfileRef.current) {
        fetch("/api/account/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: customerName,
            phone: customerPhone,
          }),
        }).catch(() => {});
      }

      disableGuard?.();
      if (isCOD) {
        router.push(`/orders/${data.data.orderId}/confirmation?cod=true`);
      } else {
        window.location.href = data.data.sessionUrl;
      }
    } catch (err) {
      setError({
        code: "INTERNAL_ERROR",
        message: err instanceof Error ? err.message : "An error occurred",
      });
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
      <m.div variants={shouldAnimate ? staggerItem : undefined}>
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-semibold text-text-primary">Review & Pay</h2>
        </div>
        <p className="font-body text-sm text-text-muted">
          Review your order and proceed to payment
        </p>
      </m.div>

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
            <BrandedSpinner size="lg" label={isCOD ? "Placing order" : "Preparing checkout"} />
            <m.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm text-text-muted"
            >
              {isCOD ? "Placing your order..." : "Preparing secure checkout..."}
            </m.p>
            {!isCOD && (
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-2 text-xs text-text-muted"
              >
                <Lock className="w-3 h-3" />
                <span>Secured by Stripe</span>
              </m.div>
            )}
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
            <m.div variants={shouldAnimate ? staggerItem : undefined}>
              <ContactInfoSection saveToProfileRef={saveToProfileRef} />
            </m.div>

            <m.div variants={shouldAnimate ? staggerItem : undefined}>
              <OrderSummaryCard
                formattedAddress={address?.formattedAddress}
                delivery={delivery}
                timeWindows={timeWindows}
              />
            </m.div>

            <m.div variants={shouldAnimate ? staggerItem : undefined}>
              <PaymentMethodSelector
                value={paymentMethod}
                onChange={setPaymentMethod}
                codEnabled={codEnabled}
              />
            </m.div>

            <m.div variants={shouldAnimate ? staggerItem : undefined}>
              <DietarySummaryCard />
            </m.div>

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

            <m.div variants={shouldAnimate ? staggerItem : undefined} className="space-y-2">
              <Label
                htmlFor="deliveryInstructions"
                className="font-body text-sm font-medium text-text-primary"
              >
                Delivery Instructions (optional)
              </Label>
              <Textarea
                id="deliveryInstructions"
                placeholder="Leave at door, ring doorbell, etc."
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                maxLength={500}
                rows={2}
                className="font-body"
              />
            </m.div>

            <m.div variants={shouldAnimate ? staggerItem : undefined}>
              <TipSelector subtotalCents={itemsSubtotal} />
            </m.div>

            <m.div variants={shouldAnimate ? staggerItem : undefined}>
              <PromoCodeInput />
            </m.div>

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
                  <p className="text-sm font-medium text-status-success">
                    {isCOD ? "Order Confirmation" : "Secure Payment"}
                  </p>
                  <p className="text-xs text-status-success">
                    {isCOD
                      ? "Your order will be confirmed by our team and you\u2019ll pay cash upon delivery."
                      : "You\u2019ll be redirected to Stripe\u2019s secure checkout page to complete your payment."}
                  </p>
                </div>
              </div>
            </m.div>

            <AnimatePresence>
              {error && (
                <CheckoutErrorBanner
                  error={error}
                  onChangeAddress={() => setStep("address")}
                  onChangeDate={(date) => {
                    if (date) {
                      const tw = timeWindows[0];
                      setDelivery({
                        date,
                        windowStart: tw?.start ?? "10:00",
                        windowEnd: tw?.end ?? "12:00",
                      });
                    }
                    setStep("time");
                  }}
                  onUpdateCart={() => router.push("/cart")}
                  onRetry={handleCheckout}
                />
              )}
            </AnimatePresence>
          </m.div>
        )}
      </AnimatePresence>

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
            disabled={isCreatingSession || !canProceed}
            isLoading={isCreatingSession}
            loadingText="Processing..."
            leftIcon={
              !isCreatingSession ? (
                isCOD ? (
                  <Banknote className="w-5 h-5" />
                ) : (
                  <CreditCard className="w-5 h-5" />
                )
              ) : undefined
            }
          >
            Place Order
          </Button>
        </m.div>
      )}
    </m.div>
  );
}

export default PaymentStepV8;
