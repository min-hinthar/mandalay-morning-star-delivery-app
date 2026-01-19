/**
 * V6 Payment Step - Pepper Aesthetic
 *
 * Checkout step for reviewing order and completing payment.
 * V6 colors, typography, and micro-interactions.
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, Loader2, ShieldCheck, MapPin, Clock } from "lucide-react";
import { useCart } from "@/lib/hooks/useCart";
import { useCheckoutStore } from "@/lib/stores/checkout-store";
import { TimeSlotDisplay } from "./TimeSlotDisplay";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function PaymentStep() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { items } = useCart();
  const {
    address,
    delivery,
    customerNotes,
    setCustomerNotes,
    prevStep,
  } = useCheckoutStore();

  const handleCheckout = async () => {
    if (!address || !delivery) return;

    setIsLoading(true);
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

      window.location.href = data.data.sessionUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* V6 Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="h-5 w-5 text-v6-primary" />
          <h2 className="font-v6-display text-lg font-semibold text-v6-text-primary">
            Review & Pay
          </h2>
        </div>
        <p className="font-v6-body text-sm text-v6-text-secondary">
          Review your order and proceed to payment
        </p>
      </div>

      {/* V6 Order Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 rounded-v6-card bg-v6-surface-secondary p-5 border border-v6-border"
      >
        {/* Address */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-v6-primary" />
            <h3 className="font-v6-body text-sm font-medium text-v6-text-secondary">
              Delivery Address
            </h3>
          </div>
          <p className="font-v6-body text-v6-text-primary text-center">
            {address?.formattedAddress}
          </p>
        </div>

        {/* Time */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-v6-primary" />
            <h3 className="font-v6-body text-sm font-medium text-v6-text-secondary">
              Delivery Time
            </h3>
          </div>
          {delivery && (
            <TimeSlotDisplay
              selection={delivery}
              className="mt-1 bg-v6-primary/10 rounded-v6-card-sm p-3 justify-center"
            />
          )}
        </div>
      </motion.div>

      {/* V6 Notes Input */}
      <div className="space-y-2">
        <Label htmlFor="customerNotes" className="font-v6-body text-sm font-medium text-v6-text-primary">
          Order Notes (optional)
        </Label>
        <Textarea
          id="customerNotes"
          placeholder="Any special instructions for your order..."
          value={customerNotes}
          onChange={(e) => setCustomerNotes(e.target.value)}
          maxLength={500}
          rows={3}
          className="font-v6-body"
        />
        <p className="font-v6-body text-xs text-v6-text-muted">
          {customerNotes.length}/500 characters
        </p>
      </div>

      {/* V6 Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-v6-card-sm bg-v6-status-error/10 border border-v6-status-error/30 p-4"
        >
          <p className="font-v6-body text-sm text-v6-status-error">{error}</p>
        </motion.div>
      )}

      {/* V6 Security Badge */}
      <div className="flex items-center gap-2 font-v6-body text-sm text-v6-text-muted">
        <ShieldCheck className="h-4 w-4 text-v6-green" />
        <span>Secure payment powered by Stripe</span>
      </div>

      {/* V6 Navigation */}
      <div className="flex justify-between pt-4 border-t border-v6-border">
        <Button variant="ghost" onClick={prevStep} disabled={isLoading}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          variant="success"
          onClick={handleCheckout}
          disabled={isLoading}
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay Now
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
