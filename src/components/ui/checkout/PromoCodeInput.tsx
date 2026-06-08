"use client";

/**
 * PromoCodeInput Component
 * Collapsible promo code input with validation against /api/checkout/validate-promo.
 * Shows applied discount badge or error state.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Tag, X, Loader2 } from "lucide-react";
import { useBurst, Bursts } from "@/components/ui/homepage/Hero/HeroBurst";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useCheckoutStore } from "@/lib/stores/checkout-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HeroSunburst } from "@/components/ui/homepage/Hero/HeroSunburst";

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

  // Wax-seal particle flick — fires once when a code transitions to applied.
  const { bursts, fire } = useBurst(11);
  const prevApplied = useRef(promoApplied);
  useEffect(() => {
    if (promoApplied && !prevApplied.current && shouldAnimate) fire(34, 30);
    prevApplied.current = promoApplied;
  }, [promoApplied, shouldAnimate, fire]);

  // Validate + apply a code. `silent` suppresses error UI for the auto-apply
  // path (e.g. arriving from a wallet "Use" link before the cart hits $50).
  const applyCode = useCallback(
    async (raw: string, silent = false) => {
      const code = raw.trim();
      if (!code) return;

      setIsValidating(true);
      if (!silent) setError(null);

      try {
        const response = await fetch("/api/checkout/validate-promo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        const data = await response.json();

        if (!response.ok || !data.valid) {
          if (!silent) setError(data.error ?? "Invalid promo code");
          return;
        }

        applyPromo(data.discountCents ?? 0, data.label ?? "Discount applied");
      } catch {
        if (!silent) setError("Failed to validate promo code");
      } finally {
        setIsValidating(false);
      }
    },
    [applyPromo]
  );

  const handleApply = () => applyCode(promoCode);

  // Deep-link from the Rewards wallet: /checkout?promo=CODE pre-fills, expands,
  // and tries to apply the reward automatically. Reads the param off the URL
  // (no Suspense needed) and strips it so a refresh won't re-fire.
  useEffect(() => {
    if (promoApplied) return;
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("promo");
    if (!fromUrl) return;

    setIsExpanded(true);
    setPromoCode(fromUrl.toUpperCase());
    void applyCode(fromUrl, true);

    params.delete("promo");
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRemove = () => {
    clearPromo();
    setError(null);
    setIsExpanded(false);
  };

  if (promoApplied) {
    return (
      <div className={cn("space-y-2", className)}>
        <m.div
          initial={shouldAnimate ? { y: 6, opacity: 0 } : undefined}
          animate={shouldAnimate ? { y: 0, opacity: 1 } : undefined}
          transition={getSpring(spring.default)}
          className="relative flex items-center justify-between rounded-xl border border-hero-clay/30 bg-hero-clay/[0.07] px-4 py-3"
        >
          <Bursts bursts={bursts} />
          <div className="flex items-center gap-3">
            {/* Wax seal — presses down like a stamp on apply */}
            <m.span
              aria-hidden="true"
              initial={shouldAnimate ? { scale: 1.5, rotate: -14, opacity: 0 } : undefined}
              animate={shouldAnimate ? { scale: 1, rotate: 0, opacity: 1 } : undefined}
              transition={{ type: "spring", stiffness: 520, damping: 17, delay: 0.05 }}
              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full shadow-sm"
              style={{
                background:
                  "radial-gradient(circle at 35% 28%, var(--hero-clay), var(--hero-accent-strong))",
              }}
            >
              <HeroSunburst className="h-4 w-4 text-hero-card/90" rays={8} />
            </m.span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-hero-ink">Applied: {discountLabel}</p>
              <p className="font-burmese text-2xs text-hero-ink-muted" lang="my">
                ကုဒ် အသုံးပြုပြီး
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="rounded-full p-1 text-hero-ink-muted hover:bg-hero-clay/10 hover:text-hero-ink transition-colors"
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
            initial={shouldAnimate ? { height: 0, opacity: 0 } : undefined}
            animate={shouldAnimate ? { height: "auto", opacity: 1 } : undefined}
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
                {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
              </Button>
            </div>

            <AnimatePresence>
              {error && (
                <m.p
                  initial={shouldAnimate ? { opacity: 0, y: -5 } : undefined}
                  animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
                  exit={shouldAnimate ? { opacity: 0, y: -5 } : undefined}
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
