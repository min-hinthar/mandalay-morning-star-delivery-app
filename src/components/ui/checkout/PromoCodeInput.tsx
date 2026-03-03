"use client";

/**
 * PromoCodeInput Component
 * Collapsible promo code input with validation against /api/checkout/validate-promo.
 * Shows applied discount badge or error state.
 */

import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Tag, X, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useCheckoutStore } from "@/lib/stores/checkout-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// ============================================
// TYPES
// ============================================

export interface PromoCodeInputProps {
  className?: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function PromoCodeInput({ className }: PromoCodeInputProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  const promoCode = useCheckoutStore((s) => s.promoCode);
  const promoApplied = useCheckoutStore((s) => s.promoApplied);
  const discountLabel = useCheckoutStore((s) => s.discountLabel);
  const setPromoCode = useCheckoutStore((s) => s.setPromoCode);
  const applyPromo = useCheckoutStore((s) => s.applyPromo);
  const clearPromo = useCheckoutStore((s) => s.clearPromo);

  const [isExpanded, setIsExpanded] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    if (!promoCode.trim()) return;

    setIsValidating(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout/validate-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        setError(data.error ?? "Invalid promo code");
        return;
      }

      applyPromo(data.discountCents ?? 0, data.label ?? "Discount applied");
    } catch {
      setError("Failed to validate promo code");
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemove = () => {
    clearPromo();
    setError(null);
    setIsExpanded(false);
  };

  if (promoApplied) {
    return (
      <div className={cn("space-y-2", className)}>
        <m.div
          initial={shouldAnimate ? { scale: 0.95, opacity: 0 } : undefined}
          animate={shouldAnimate ? { scale: 1, opacity: 1 } : undefined}
          transition={getSpring(spring.default)}
          className="flex items-center justify-between rounded-lg border border-status-success/30 bg-status-success-bg px-4 py-2.5"
        >
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-status-success" />
            <span className="text-sm font-medium text-status-success">
              Applied: {discountLabel}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="rounded-full p-1 text-text-muted hover:bg-surface-tertiary hover:text-text-primary transition-colors"
            aria-label="Remove promo code"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </m.div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {!isExpanded && (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          <Tag className="h-3.5 w-3.5" />
          Have a promo code?
        </button>
      )}

      <AnimatePresence>
        {isExpanded && (
          <m.div
            initial={
              shouldAnimate ? { height: 0, opacity: 0 } : undefined
            }
            animate={
              shouldAnimate ? { height: "auto", opacity: 1 } : undefined
            }
            exit={shouldAnimate ? { height: 0, opacity: 0 } : undefined}
            transition={getSpring(spring.default)}
            className="overflow-hidden"
          >
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter promo code"
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                disabled={isValidating}
                className="font-body uppercase"
                aria-label="Promo code"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleApply}
                disabled={isValidating || !promoCode.trim()}
                className="shrink-0"
              >
                {isValidating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Apply"
                )}
              </Button>
            </div>

            <AnimatePresence>
              {error && (
                <m.p
                  initial={
                    shouldAnimate ? { opacity: 0, y: -5 } : undefined
                  }
                  animate={
                    shouldAnimate ? { opacity: 1, y: 0 } : undefined
                  }
                  exit={
                    shouldAnimate ? { opacity: 0, y: -5 } : undefined
                  }
                  className="mt-1.5 text-xs text-status-error"
                >
                  {error}
                </m.p>
              )}
            </AnimatePresence>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PromoCodeInput;
