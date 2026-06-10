"use client";

import { m, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { staggerContainer, staggerItem } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useCart } from "@/lib/hooks/useCart";
import { CartItem } from "./CartItem";
import { CartEmptyState } from "./CartEmptyState";
import { SuggestionRow } from "./CartPage/SuggestionRow";
import type { CartValidationResult } from "@/types/cart";
import type { MenuItem } from "@/types/menu";

// ============================================
// CART ITEMS LIST
// ============================================

interface CartItemsListProps {
  onClose: () => void;
  validation: CartValidationResult;
  onDismissPriceChange: (cartItemId: string, newPriceCents: number) => void;
  onRemoveStale: (cartItemId: string) => void;
  onReplaceItem: (cartItemId: string, suggestion: MenuItem, originalQuantity: number) => void;
  /**
   * When true (desktop right-drawer with a definite full height), the list owns
   * its own scroll region and the footer pins below it. When false (mobile
   * bottom sheet), the list flows naturally and the sheet wrapper scrolls the
   * whole column — pinning a tall footer here would crush the items to a sliver.
   */
  scrollable?: boolean;
}

export function CartItemsList({
  onClose,
  validation,
  onDismissPriceChange,
  onRemoveStale,
  onReplaceItem,
  scrollable = true,
}: CartItemsListProps) {
  const { shouldAnimate } = useAnimationPreference();
  const { items, isEmpty } = useCart();
  const isValidating = validation.status === "validating";

  if (isEmpty) {
    return <CartEmptyState onClose={onClose} />;
  }

  return (
    <m.div
      variants={shouldAnimate ? staggerContainer(0.08, 0.1) : undefined}
      initial={shouldAnimate ? "hidden" : undefined}
      animate={shouldAnimate ? "visible" : undefined}
      className={cn("px-4 py-4", scrollable && "min-h-0 flex-1 overflow-y-auto")}
    >
      <AnimatePresence>
        {isValidating && (
          <m.div
            key="validation-loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-3 h-0.5 w-full overflow-hidden rounded-full bg-hero-clay/25"
          >
            <m.div
              className="h-full w-1/3 rounded-full bg-hero-clay"
              animate={{ x: ["0%", "200%", "0%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </m.div>
        )}
      </AnimatePresence>

      {/* Ticket ledger — dashed perforation rules between line items */}
      <ul className="[&>li+li]:mt-3 [&>li+li]:border-t [&>li+li]:border-dashed [&>li+li]:border-hero-ink/15 [&>li+li]:pt-3 dark:[&>li+li]:border-hero-card/20">
        <AnimatePresence mode="sync">
          {items.map((item, index) => {
            const itemValidation = validation.validations.get(item.cartItemId);
            const itemSuggestions = validation.suggestions.get(item.cartItemId);

            return (
              <m.li
                key={item.cartItemId}
                variants={shouldAnimate ? staggerItem : undefined}
                exit={
                  shouldAnimate
                    ? {
                        opacity: 0,
                        x: -50,
                        transition: { duration: 0.15 },
                      }
                    : undefined
                }
              >
                <CartItem
                  item={item}
                  isFirstItem={index === 0}
                  accentIndex={index}
                  validationStatus={itemValidation?.status}
                  priceDirection={itemValidation?.priceDirection}
                  newPriceCents={itemValidation?.newPriceCents}
                  onDismissPriceChange={
                    itemValidation?.status === "price-changed" && itemValidation.newPriceCents
                      ? () => onDismissPriceChange(item.cartItemId, itemValidation.newPriceCents!)
                      : undefined
                  }
                  onRemoveStale={
                    itemValidation?.status === "sold-out" ||
                    itemValidation?.status === "unavailable"
                      ? () => onRemoveStale(item.cartItemId)
                      : undefined
                  }
                />
                {itemSuggestions && itemSuggestions.length > 0 && (
                  <SuggestionRow
                    suggestions={itemSuggestions}
                    onReplace={(suggestion) =>
                      onReplaceItem(item.cartItemId, suggestion, item.quantity)
                    }
                  />
                )}
              </m.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </m.div>
  );
}

export default CartItemsList;
