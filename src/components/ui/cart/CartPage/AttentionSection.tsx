"use client";

import { memo, forwardRef, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { CartItem } from "@/components/ui/cart/CartItem";
import { ValidationOverlay } from "@/components/ui/cart/CartItem/ValidationOverlay";
import { SuggestionRow } from "./SuggestionRow";
import type { CartItem as CartItemType } from "@/types/cart";
import type { MenuItem } from "@/types/menu";

/** Validation status for a single cart item */
export interface CartItemValidation {
  status: "sold-out" | "unavailable";
}

export interface AttentionSectionProps {
  items: CartItemType[];
  validations: Map<string, CartItemValidation>;
  suggestions: Map<string, MenuItem[]>;
  onRemoveItem: (cartItemId: string) => void;
  onReplaceItem: (
    cartItemId: string,
    suggestion: MenuItem,
    originalQuantity: number
  ) => void;
  className?: string;
}

export const AttentionSection = memo(
  forwardRef<HTMLDivElement, AttentionSectionProps>(function AttentionSection(
    {
      items,
      validations,
      suggestions,
      onRemoveItem,
      onReplaceItem,
      className,
    },
    ref
  ) {
    const { shouldAnimate, getSpring } = useAnimationPreference();

    const handleReplace = useCallback(
      (cartItemId: string, suggestion: MenuItem, originalQuantity: number) => {
        onReplaceItem(cartItemId, suggestion, originalQuantity);
      },
      [onReplaceItem]
    );

    // Filter to only items that have validation issues
    const problemItems = items.filter((item) =>
      validations.has(item.cartItemId)
    );

    if (problemItems.length === 0) return null;

    return (
      <AnimatePresence>
        <m.div
          ref={ref}
          key="attention-section"
          initial={shouldAnimate ? { opacity: 0, height: 0 } : undefined}
          animate={
            shouldAnimate ? { opacity: 1, height: "auto" } : undefined
          }
          exit={
            shouldAnimate
              ? { opacity: 0, height: 0, marginBottom: 0 }
              : undefined
          }
          transition={getSpring(spring.gentle)}
          className={cn(
            "rounded-2xl p-4 mb-4 overflow-hidden",
            "bg-red-50/50 dark:bg-red-950/20",
            "border border-dashed border-red-300/50 dark:border-red-700/30",
            className
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <h3 className="text-sm font-semibold text-text-primary">
              {problemItems.length}{" "}
              {problemItems.length === 1 ? "item needs" : "items need"}{" "}
              attention
            </h3>
          </div>

          {/* Problem items */}
          <div className="space-y-3">
            {problemItems.map((item) => {
              const validation = validations.get(item.cartItemId);
              const itemSuggestions = suggestions.get(item.cartItemId) ?? [];

              return (
                <div key={item.cartItemId}>
                  {/* Cart item with validation overlay */}
                  <div className="relative">
                    <CartItem item={item} compact />
                    {validation && (
                      <ValidationOverlay
                        status={validation.status}
                        onRemove={() => onRemoveItem(item.cartItemId)}
                      />
                    )}
                  </div>

                  {/* Suggestion row below item */}
                  {itemSuggestions.length > 0 && (
                    <SuggestionRow
                      suggestions={itemSuggestions}
                      onReplace={(suggestion) =>
                        handleReplace(
                          item.cartItemId,
                          suggestion,
                          item.quantity
                        )
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>
        </m.div>
      </AnimatePresence>
    );
  })
);

AttentionSection.displayName = "AttentionSection";

export default AttentionSection;
