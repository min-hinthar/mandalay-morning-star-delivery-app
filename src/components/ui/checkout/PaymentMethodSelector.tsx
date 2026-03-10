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
      <h3 className="font-body text-sm font-medium text-text-primary">Payment Method</h3>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChange("stripe")}
          className={cn(
            "flex items-center gap-3 rounded-lg border-2 p-4 transition-colors text-left",
            value === "stripe"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/40"
          )}
        >
          <CreditCard className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="font-body text-sm font-medium text-text-primary">Card Payment</p>
            <p className="font-body text-xs text-text-muted">Pay securely online</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => onChange("cod")}
          className={cn(
            "flex items-center gap-3 rounded-lg border-2 p-4 transition-colors text-left",
            value === "cod"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/40"
          )}
        >
          <Banknote className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="font-body text-sm font-medium text-text-primary">Cash on Delivery</p>
            <p className="font-body text-xs text-text-muted">Pay when delivered</p>
          </div>
        </button>
      </div>
      {value === "cod" && (
        <p className="font-body text-xs text-text-muted bg-status-warning-bg border border-status-warning/20 rounded-lg p-3">
          Your order will require confirmation from our team before being scheduled for delivery.
        </p>
      )}
    </div>
  );
}
