"use client";

/**
 * CartDrawer Component
 * Responsive cart drawer using overlay primitives
 *
 * Features:
 * - BottomSheet on mobile (< 640px) with swipe-to-dismiss
 * - Drawer on desktop (>= 640px) sliding from right
 * - Animated cart items list with AnimatePresence
 * - CartSummary with animated free delivery progress
 * - CartEmptyState for zero-item cart
 * - Focus trap, escape to close, route change close
 */

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import { ShoppingBag, X, Trash2, AlertTriangle, Expand } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring, staggerContainer, staggerItem } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useCart } from "@/lib/hooks/useCart";
import { useCartDrawer } from "@/lib/hooks/useCartDrawer";
import { useCartValidation } from "@/lib/hooks/useCartValidation";
import { useCartStore } from "@/lib/stores/cart-store";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/button";
import { CartItem } from "./CartItem";
import { CartSummary } from "./CartSummary";
import { CartEmptyState } from "./CartEmptyState";
import { SuggestionRow } from "./CartPage/SuggestionRow";
import { ClearCartConfirmation, useClearCartConfirmation } from "./ClearCartConfirmation";
import type { CartValidationResult } from "@/types/cart";
import type { MenuItem } from "@/types/menu";

// ============================================
// TYPES
// ============================================

export interface CartDrawerProps {
  /** Additional className */
  className?: string;
}

// ============================================
// CART HEADER
// ============================================

interface CartHeaderProps {
  itemCount: number;
  onClose: () => void;
  onClearClick: () => void;
  showClear: boolean;
}

function CartHeader({ itemCount, onClose, onClearClick, showClear }: CartHeaderProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <div
      className={cn(
        "flex items-center justify-between",
        "border-b border-border",
        "bg-surface-secondary px-4 py-4"
      )}
    >
      <h2
        id="cart-drawer-title"
        className="flex items-center gap-3 text-lg font-display font-bold text-text-primary"
      >
        {/* Bag icon - no infinite animation to prevent mobile crashes */}
        <m.div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full",
            "bg-amber-100 dark:bg-amber-900/30"
          )}
        >
          <ShoppingBag className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </m.div>
        Your Cart
        {/* Item count badge - rubbery bounce on change */}
        {itemCount > 0 && (
          <m.span
            key={itemCount}
            initial={shouldAnimate ? { scale: 0, rotate: -10 } : undefined}
            animate={shouldAnimate ? { scale: 1, rotate: 0 } : undefined}
            transition={getSpring(spring.rubbery)}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-semibold",
              "bg-amber-500 text-text-inverse shadow-sm"
            )}
          >
            {itemCount}
          </m.span>
        )}
      </h2>

      <div className="flex items-center gap-2">
        {/* Clear cart button */}
        {showClear && (
          <m.button
            type="button"
            onClick={onClearClick}
            whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
            whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
            transition={getSpring(spring.snappy)}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              "bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400",
              "hover:bg-red-200 dark:hover:bg-red-900/50",
              "transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            )}
            aria-label="Clear cart"
          >
            <Trash2 className="h-5 w-5" />
          </m.button>
        )}

        {/* Close button */}
        <m.button
          type="button"
          onClick={onClose}
          whileHover={shouldAnimate ? { scale: 1.05, rotate: 90 } : undefined}
          whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
          transition={getSpring(spring.snappy)}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full",
            "bg-surface-tertiary text-text-muted",
            "hover:bg-surface-secondary hover:text-text-primary",
            "transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          )}
          aria-label="Close cart"
        >
          <X className="h-5 w-5" />
        </m.button>
      </div>
    </div>
  );
}

// ============================================
// CART ITEMS LIST
// ============================================

interface CartItemsListProps {
  onClose: () => void;
  validation: CartValidationResult;
  onDismissPriceChange: (cartItemId: string, newPriceCents: number) => void;
  onRemoveStale: (cartItemId: string) => void;
  onReplaceItem: (cartItemId: string, suggestion: MenuItem, originalQuantity: number) => void;
}

function CartItemsList({
  onClose,
  validation,
  onDismissPriceChange,
  onRemoveStale,
  onReplaceItem,
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
      className="flex-1 overflow-y-auto px-4 py-4"
    >
      {/* Subtle loading indicator during validation */}
      <AnimatePresence>
        {isValidating && (
          <m.div
            key="validation-loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-0.5 w-full rounded-full bg-primary/30 mb-3 overflow-hidden"
          >
            <m.div
              className="h-full w-1/3 rounded-full bg-primary"
              animate={{ x: ["0%", "200%", "0%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </m.div>
        )}
      </AnimatePresence>

      <ul className="space-y-3">
        {/* CHANGED from mode="popLayout" to mode="sync" - popLayout causes layout thrashing that crashes mobile */}
        <AnimatePresence mode="sync">
          {items.map((item) => {
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
                  validationStatus={itemValidation?.status}
                  priceDirection={itemValidation?.priceDirection}
                  newPriceCents={itemValidation?.newPriceCents}
                  onDismissPriceChange={
                    itemValidation?.status === "price-changed" && itemValidation.newPriceCents
                      ? () => onDismissPriceChange(item.cartItemId, itemValidation.newPriceCents!)
                      : undefined
                  }
                  onRemoveStale={
                    itemValidation?.status === "sold-out" || itemValidation?.status === "unavailable"
                      ? () => onRemoveStale(item.cartItemId)
                      : undefined
                  }
                />
                {/* Suggestion row for stale items */}
                {itemSuggestions && itemSuggestions.length > 0 && (
                  <SuggestionRow
                    suggestions={itemSuggestions}
                    onReplace={(suggestion) => onReplaceItem(item.cartItemId, suggestion, item.quantity)}
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

// ============================================
// CART FOOTER
// ============================================

interface CartFooterProps {
  onClose: () => void;
  onCheckout: () => void;
  hasBlockingIssues?: boolean;
  showFullCartLink?: boolean;
}

function CartFooter({ onClose, onCheckout, hasBlockingIssues = false, showFullCartLink }: CartFooterProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={{ delay: 0.2 }}
      className={cn("border-t border-border", "bg-surface-secondary", "px-4 py-4")}
    >
      <CartSummary />

      <div className="mt-4 flex flex-col gap-3">
        {/* Primary CTA - Checkout with pulsing glow */}
        <m.div
          whileHover={shouldAnimate && !hasBlockingIssues ? { scale: 1.01 } : undefined}
          whileTap={shouldAnimate && !hasBlockingIssues ? { scale: 0.99 } : undefined}
          transition={getSpring(spring.snappyButton)}
          className="relative"
        >
          {/* Static glow behind button - removed infinite animation to prevent mobile crashes */}
          {shouldAnimate && !hasBlockingIssues && (
            <div className="absolute inset-0 rounded-xl bg-primary/30 blur-lg opacity-50" />
          )}
          <Button
            variant="primary"
            size="lg"
            className={cn(
              "relative w-full shadow-elevated",
              hasBlockingIssues && "opacity-50 cursor-not-allowed"
            )}
            onClick={hasBlockingIssues ? undefined : onCheckout}
            disabled={hasBlockingIssues}
          >
            Proceed to Checkout
          </Button>
        </m.div>

        {/* Blocking issues warning */}
        {hasBlockingIssues && (
          <p className="flex items-center justify-center gap-1.5 text-xs text-text-muted">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            Remove unavailable items to checkout
          </p>
        )}

        {/* Secondary CTA - Continue Shopping */}
        <Button variant="outline" size="lg" className="w-full" onClick={onClose}>
          Continue Shopping
        </Button>

        {/* View full cart link (desktop only) */}
        {showFullCartLink && (
          <Link
            href="/cart"
            onClick={onClose}
            className={cn(
              "flex items-center justify-center gap-1.5",
              "text-xs font-medium text-text-muted",
              "hover:text-primary transition-colors"
            )}
          >
            <Expand className="w-3.5 h-3.5" />
            View full cart
          </Link>
        )}
      </div>
    </m.div>
  );
}

// ============================================
// CART CONTENT (shared between mobile/desktop)
// ============================================

interface CartContentProps {
  onClose: () => void;
  showFullCartLink?: boolean;
}

function CartContent({ onClose, showFullCartLink }: CartContentProps) {
  const router = useRouter();
  const { isEmpty, itemCount, removeItem, addItem } = useCart();
  const updateItemPrice = useCartStore((state) => state.updateItemPrice);
  const validation = useCartValidation();
  const {
    isOpen: isClearOpen,
    openConfirmation,
    handleConfirm: handleClearConfirm,
    close: closeClear,
  } = useClearCartConfirmation();

  const handleCheckout = useCallback(() => {
    onClose();
    router.push("/checkout");
  }, [onClose, router]);

  const handleDismissPriceChange = useCallback(
    (cartItemId: string, newPriceCents: number) => {
      updateItemPrice(cartItemId, newPriceCents);
    },
    [updateItemPrice]
  );

  const handleRemoveStale = useCallback(
    (cartItemId: string) => {
      removeItem(cartItemId);
    },
    [removeItem]
  );

  const handleReplaceItem = useCallback(
    (cartItemId: string, suggestion: MenuItem, originalQuantity: number) => {
      removeItem(cartItemId);
      addItem({
        menuItemId: suggestion.id,
        menuItemSlug: suggestion.slug,
        nameEn: suggestion.nameEn,
        nameMy: suggestion.nameMy ?? null,
        imageUrl: suggestion.imageUrl ?? null,
        basePriceCents: suggestion.basePriceCents,
        quantity: originalQuantity,
        modifiers: [],
        notes: "",
      });
    },
    [removeItem, addItem]
  );

  return (
    <div className="flex flex-col h-full">
      <CartHeader
        itemCount={itemCount}
        onClose={onClose}
        onClearClick={openConfirmation}
        showClear={!isEmpty}
      />

      {isEmpty ? (
        <CartEmptyState onClose={onClose} />
      ) : (
        <>
          <CartItemsList
            onClose={onClose}
            validation={validation}
            onDismissPriceChange={handleDismissPriceChange}
            onRemoveStale={handleRemoveStale}
            onReplaceItem={handleReplaceItem}
          />
          <CartFooter
            onClose={onClose}
            onCheckout={handleCheckout}
            hasBlockingIssues={validation.hasBlockingIssues}
            showFullCartLink={showFullCartLink}
          />
        </>
      )}

      {/* Clear cart confirmation modal */}
      <ClearCartConfirmation
        isOpen={isClearOpen}
        onClose={closeClear}
        onConfirm={handleClearConfirm}
        itemCount={itemCount}
      />
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CartDrawer({ className }: CartDrawerProps) {
  const isMobile = useMediaQuery("(max-width: 640px)");
  const { isOpen, close } = useCartDrawer();

  // Render mobile bottom sheet
  if (isMobile) {
    return (
      <Drawer
        isOpen={isOpen}
        onClose={close}
        position="bottom"
        height="full"
        showDragHandle={true}
        className={cn("flex flex-col", className)}
      >
        <CartContent onClose={close} />
      </Drawer>
    );
  }

  // Render desktop Drawer
  return (
    <Drawer
      isOpen={isOpen}
      onClose={close}
      position="right"
      width="lg"
      title="Your Cart"
      className={cn("flex flex-col", className)}
    >
      <CartContent onClose={close} showFullCartLink />
    </Drawer>
  );
}

export default CartDrawer;
