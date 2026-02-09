"use client";

import { memo, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { CartItem } from "@/components/ui/cart/CartItem";
import { ValidationOverlay } from "@/components/ui/cart/CartItem/ValidationOverlay";
import { PriceChangeBadge } from "@/components/ui/cart/CartItem/PriceChangeBadge";
import { SuggestionRow } from "./SuggestionRow";
import type { CartItem as CartItemType, CartItemValidation } from "@/types/cart";
import type { MenuItem } from "@/types/menu";

export interface CartItemGroupProps {
  categoryName: string;
  items: CartItemType[];
  validations: Map<string, CartItemValidation>;
  suggestions: Map<string, MenuItem[]>;
  onRemoveItem: (cartItemId: string) => void;
  onReplaceItem: (
    cartItemId: string,
    suggestion: MenuItem,
    originalQuantity: number
  ) => void;
  onEditItem: (item: CartItemType) => void;
  onDismissPriceChange: (cartItemId: string, newPriceCents: number) => void;
  className?: string;
}

export const CartItemGroup = memo(function CartItemGroup({
  categoryName,
  items,
  validations,
  suggestions,
  onRemoveItem,
  onReplaceItem,
  onEditItem,
  onDismissPriceChange,
  className,
}: CartItemGroupProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  const handleReplace = useCallback(
    (cartItemId: string, suggestion: MenuItem, originalQuantity: number) => {
      onReplaceItem(cartItemId, suggestion, originalQuantity);
    },
    [onReplaceItem]
  );

  if (items.length === 0) return null;

  return (
    <div className={cn("mb-6", className)}>
      {/* Category header */}
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          {categoryName}
        </h2>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Items */}
      <ul className="space-y-3">
        <AnimatePresence mode="sync">
          {items.map((item) => {
            const validation = validations.get(item.cartItemId);
            const itemSuggestions = suggestions.get(item.cartItemId) ?? [];
            const isSoldOutOrUnavailable =
              validation?.status === "sold-out" ||
              validation?.status === "unavailable";
            const isPriceChanged = validation?.status === "price-changed";

            return (
              <m.li
                key={item.cartItemId}
                layout={shouldAnimate ? true : undefined}
                exit={
                  shouldAnimate
                    ? { opacity: 0, x: -200, transition: { duration: 0.2 } }
                    : undefined
                }
                transition={getSpring(spring.gentle)}
              >
                {/* Cart item with optional validation overlay */}
                <div className="relative">
                  <CartItem
                    item={item}
                    onEdit={onEditItem}
                  />
                  {isSoldOutOrUnavailable && validation && (
                    <ValidationOverlay
                      status={validation.status as "sold-out" | "unavailable"}
                      onRemove={() => onRemoveItem(item.cartItemId)}
                    />
                  )}
                </div>

                {/* Price change badge below item */}
                {isPriceChanged && validation?.priceDirection && (
                  <div className="mt-1.5 pl-2">
                    <PriceChangeBadge
                      direction={validation.priceDirection}
                      onDismiss={() =>
                        onDismissPriceChange(
                          item.cartItemId,
                          validation.newPriceCents!
                        )
                      }
                    />
                  </div>
                )}

                {/* Suggestion row for sold-out/unavailable items */}
                {isSoldOutOrUnavailable && itemSuggestions.length > 0 && (
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
              </m.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
});

export default CartItemGroup;
