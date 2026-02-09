"use client";

import { memo, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { AlertTriangle, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { Button } from "@/components/ui/button";

export interface CheckoutGateProps {
  hasBlockingIssues: boolean;
  staleCount: number;
  minimumShortfallCents: number;
  onScrollToAttention: () => void;
  onCheckout: () => void;
  className?: string;
}

export const CheckoutGate = memo(function CheckoutGate({
  hasBlockingIssues,
  staleCount,
  minimumShortfallCents,
  onScrollToAttention,
  onCheckout,
  className,
}: CheckoutGateProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const isDisabled = hasBlockingIssues || minimumShortfallCents > 0;

  // Track previous disabled state for pulse animation
  const prevDisabledRef = useRef(isDisabled);
  const [justEnabled, setJustEnabled] = useState(false);

  useEffect(() => {
    if (prevDisabledRef.current && !isDisabled) {
      setJustEnabled(true);
      const timer = setTimeout(() => setJustEnabled(false), 600);
      return () => clearTimeout(timer);
    }
    prevDisabledRef.current = isDisabled;
  }, [isDisabled]);

  // Build warning message parts
  const warningParts: string[] = [];
  if (staleCount > 0) {
    warningParts.push(
      `${staleCount} ${staleCount === 1 ? "item needs" : "items need"} attention`
    );
  }
  if (minimumShortfallCents > 0) {
    warningParts.push(
      `$${(minimumShortfallCents / 100).toFixed(2)} below minimum`
    );
  }
  const warningMessage = warningParts.join(" \u00B7 ");

  return (
    <div className={cn("space-y-3 mt-4", className)}>
      {/* Warning banner */}
      {warningMessage && (
        <m.button
          type="button"
          onClick={onScrollToAttention}
          initial={shouldAnimate ? { opacity: 0, y: 8 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={getSpring(spring.gentle)}
          className={cn(
            "w-full flex items-center gap-2.5 px-4 py-3 rounded-xl",
            "bg-gradient-to-r from-amber-500 to-red-500",
            "text-text-inverse text-sm font-medium text-left",
            "cursor-pointer",
            "hover:from-amber-600 hover:to-red-600",
            "transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
          )}
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{warningMessage}</span>
        </m.button>
      )}

      {/* Checkout button */}
      <m.div
        animate={
          shouldAnimate && justEnabled
            ? {
                scale: [1, 1.05, 1],
                transition: {
                  type: "spring" as const,
                  stiffness: 400,
                  damping: 15,
                  mass: 1,
                },
              }
            : { scale: 1 }
        }
      >
        <Button
          variant={isDisabled ? "outline" : "success"}
          size="lg"
          onClick={onCheckout}
          disabled={isDisabled}
          className={cn(
            "w-full text-base",
            isDisabled
              ? "bg-surface-tertiary text-text-muted border-border cursor-not-allowed hover:bg-surface-tertiary hover:shadow-none"
              : "shadow-elevated"
          )}
        >
          Proceed to Checkout
        </Button>
      </m.div>

      {/* Add more items link */}
      <Link
        href="/menu"
        className={cn(
          "flex items-center justify-center gap-1.5",
          "text-sm font-medium text-text-secondary",
          "hover:text-primary transition-colors",
          "py-1"
        )}
      >
        <ShoppingBag className="w-4 h-4" />
        + Add more items
      </Link>
    </div>
  );
});

export default CheckoutGate;
