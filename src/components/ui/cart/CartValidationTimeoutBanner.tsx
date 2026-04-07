"use client";

/**
 * Phase 110 CFIX-05 — Cart validation timeout banner.
 *
 * Rendered when `useCartValidation().timedOut === true`. Reassures the
 * customer that validation has stalled and offers a "Proceed Anyway" action
 * (D-19 customer agency). Server-side cart validation in
 * /api/checkout/session still runs fetchAndValidateCart, so sold-out items
 * are still blocked at checkout — this banner only bypasses the client-side
 * blocking gate.
 *
 * Wired into CartPageContent (PRIMARY) and CartDrawer (SECONDARY).
 */

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export interface CartValidationTimeoutBannerProps {
  /** Called when the customer clicks "Proceed Anyway" — resets timedOut on the hook. */
  onProceedAnyway: () => void;
  /** Optional wrapper class for layout overrides in different consumers. */
  className?: string;
}

export function CartValidationTimeoutBanner({
  onProceedAnyway,
  className,
}: CartValidationTimeoutBannerProps) {
  return (
    <div
      role="alert"
      className={cn(
        "animate-slide-in-up rounded-xl border border-status-warning/30 bg-status-warning-bg p-4",
        "min-h-[44px]",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-status-warning/10 text-status-warning shrink-0">
          <AlertTriangle className="w-4 h-4" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-status-warning">
            Validation taking longer than usual
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            We can&apos;t confirm item availability right now. You can wait, or proceed at your own
            risk.
          </p>
        </div>
      </div>
      <div className="flex justify-end mt-3">
        <Button
          variant="outline"
          size="md"
          onClick={onProceedAnyway}
          aria-label="Proceed to checkout without re-validating the cart"
        >
          Proceed Anyway
        </Button>
      </div>
    </div>
  );
}

export default CartValidationTimeoutBanner;
