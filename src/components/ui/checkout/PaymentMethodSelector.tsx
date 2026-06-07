"use client";

import { CreditCard, Banknote } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { PaymentMethod } from "@/types/database";

interface PaymentMethodSelectorProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  codEnabled: boolean;
}

export function PaymentMethodSelector({ value, onChange, codEnabled }: PaymentMethodSelectorProps) {
  if (!codEnabled) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-body text-sm font-semibold text-hero-ink">Payment Method</h3>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChange("stripe")}
          className={cn(
            "flex items-center gap-3 rounded-xl border-2 p-4 transition-colors text-left",
            value === "stripe"
              ? "border-hero-clay bg-hero-clay/12 ck-glow-clay"
              : "border-hero-line bg-hero-card hover:border-hero-clay/50"
          )}
        >
          <CreditCard
            className={cn(
              "h-5 w-5 shrink-0",
              value === "stripe" ? "text-hero-accent" : "text-hero-ink-muted"
            )}
          />
          <div>
            <p className="font-body text-sm font-medium text-hero-ink">Card Payment</p>
            <p className="font-body text-xs text-hero-ink-muted">Pay securely online</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => onChange("cod")}
          className={cn(
            "flex items-center gap-3 rounded-xl border-2 p-4 transition-colors text-left",
            value === "cod"
              ? "border-hero-clay bg-hero-clay/12 ck-glow-clay"
              : "border-hero-line bg-hero-card hover:border-hero-clay/50"
          )}
        >
          <Banknote
            className={cn(
              "h-5 w-5 shrink-0",
              value === "cod" ? "text-hero-accent" : "text-hero-ink-muted"
            )}
          />
          <div>
            <p className="font-body text-sm font-medium text-hero-ink">Cash on Delivery</p>
            <p className="font-body text-xs text-hero-ink-muted">Pay when delivered</p>
          </div>
        </button>
      </div>
      {value === "cod" && (
        <p className="font-body text-xs text-hero-ink-muted bg-hero-clay/10 border border-hero-clay/25 rounded-lg p-3">
          Your order will require confirmation from our team before being scheduled for delivery.
        </p>
      )}
    </div>
  );
}
