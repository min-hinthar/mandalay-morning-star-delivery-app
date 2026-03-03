"use client";

/**
 * TipSelector Component
 * DoorDash-style tip presets (15%/20%/25%/Custom) with dollar amount preview.
 * 15% pre-selected by default via checkout store initial state.
 */

import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useCheckoutStore } from "@/lib/stores/checkout-store";
import { formatPrice } from "@/lib/utils/format";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ============================================
// TYPES
// ============================================

export interface TipSelectorProps {
  /** Cart subtotal in cents for percentage calculation */
  subtotalCents: number;
  /** Additional className */
  className?: string;
}

// ============================================
// CONSTANTS
// ============================================

const TIP_PRESETS = [15, 20, 25] as const;

// ============================================
// MAIN COMPONENT
// ============================================

export function TipSelector({ subtotalCents, className }: TipSelectorProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const tipPercent = useCheckoutStore((s) => s.tipPercent);
  const customTipCents = useCheckoutStore((s) => s.customTipCents);
  const setTipPercent = useCheckoutStore((s) => s.setTipPercent);
  const setCustomTipCents = useCheckoutStore((s) => s.setCustomTipCents);

  const [customInput, setCustomInput] = useState(() =>
    customTipCents > 0 ? (customTipCents / 100).toFixed(2) : ""
  );

  const isCustom = tipPercent === null;

  const handlePresetClick = (percent: number) => {
    setTipPercent(percent);
  };

  const handleCustomClick = () => {
    setTipPercent(null);
    if (customTipCents > 0) {
      setCustomTipCents(customTipCents);
    }
  };

  const handleCustomInputChange = (value: string) => {
    const sanitized = value.replace(/[^0-9.]/g, "");
    const parts = sanitized.split(".");
    const formatted =
      parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : sanitized;

    setCustomInput(formatted);

    const dollars = parseFloat(formatted);
    if (!isNaN(dollars) && dollars >= 0 && dollars <= 1000) {
      setCustomTipCents(Math.round(dollars * 100));
    } else if (formatted === "" || formatted === ".") {
      setCustomTipCents(0);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <Label className="font-body text-sm font-medium text-text-primary">
        Add a tip
      </Label>

      <div className="grid grid-cols-4 gap-2">
        {TIP_PRESETS.map((percent) => {
          const tipCents = Math.round((subtotalCents * percent) / 100);
          const isSelected = tipPercent === percent;

          return (
            <button
              key={percent}
              type="button"
              onClick={() => handlePresetClick(percent)}
              className={cn(
                "flex flex-col items-center justify-center rounded-lg border px-2 py-2.5 transition-colors",
                isSelected
                  ? "border-primary bg-primary text-text-inverse"
                  : "border-border bg-surface-secondary text-text-primary hover:border-primary/50"
              )}
            >
              <span className="text-sm font-semibold">{percent}%</span>
              <span
                className={cn(
                  "text-xs",
                  isSelected ? "text-text-inverse/80" : "text-text-muted"
                )}
              >
                {formatPrice(tipCents)}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={handleCustomClick}
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border px-2 py-2.5 transition-colors",
            isCustom
              ? "border-primary bg-primary text-text-inverse"
              : "border-border bg-surface-secondary text-text-primary hover:border-primary/50"
          )}
        >
          <span className="text-sm font-semibold">Custom</span>
          {isCustom && customTipCents > 0 ? (
            <span className="text-xs text-text-inverse/80">
              {formatPrice(customTipCents)}
            </span>
          ) : (
            <span
              className={cn(
                "text-xs",
                isCustom ? "text-text-inverse/80" : "text-text-muted"
              )}
            >
              Amount
            </span>
          )}
        </button>
      </div>

      <AnimatePresence>
        {isCustom && (
          <m.div
            initial={shouldAnimate ? { height: 0, opacity: 0 } : undefined}
            animate={
              shouldAnimate ? { height: "auto", opacity: 1 } : undefined
            }
            exit={shouldAnimate ? { height: 0, opacity: 0 } : undefined}
            transition={getSpring(spring.default)}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 pt-1">
              <span className="text-sm font-medium text-text-muted">$</span>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={customInput}
                onChange={(e) => handleCustomInputChange(e.target.value)}
                className="font-body"
                aria-label="Custom tip amount in dollars"
              />
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TipSelector;
