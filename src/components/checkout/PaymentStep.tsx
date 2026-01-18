"use client";

import { useState } from "react";
import { ArrowLeft, CreditCard, Loader2, ShieldCheck } from "lucide-react";
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
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Review & Pay</h2>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Review your order and proceed to payment
        </p>
      </div>

      <div className="space-y-4 rounded-lg bg-[var(--color-surface-secondary)] p-4">
        <div>
          <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">
            Delivery Address
          </h3>
          <p className="mt-1 text-[var(--color-text-primary)] text-center text-xl">{address?.formattedAddress}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">
            Delivery Time
          </h3>
          {delivery && <TimeSlotDisplay selection={delivery} className="mt-1 bg-[var(--color-interactive-primary)] rounded-xl p-2 justify-center" />}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="customerNotes">Order Notes (optional)</Label>
        <Textarea
          id="customerNotes"
          placeholder="Any special instructions for your order..."
          value={customerNotes}
          onChange={(e) => setCustomerNotes(e.target.value)}
          maxLength={500}
          rows={3}
        />
        <p className="text-xs text-[var(--color-text-secondary)]">
          {customerNotes.length}/500 characters
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-[var(--color-status-error)]/10 p-3 text-sm text-[var(--color-status-error)]">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
        <ShieldCheck className="h-4 w-4" />
        <span>Secure payment powered by Stripe</span>
      </div>

      <div className="flex justify-between pt-4 border-t border-[var(--color-border)]">
        <Button variant="ghost" onClick={prevStep} disabled={isLoading}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={handleCheckout}
          disabled={isLoading}
          className="bg-[var(--color-accent-tertiary)] text-[var(--color-text-inverse)] hover:bg-[var(--color-accent-tertiary)]/90"
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
