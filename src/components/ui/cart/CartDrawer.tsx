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
import { cn } from "@/lib/utils/cn";
import { useCart } from "@/lib/hooks/useCart";
import { useCartDrawer } from "@/lib/hooks/useCartDrawer";
import { useCartValidation } from "@/lib/hooks/useCartValidation";
import { useCartStore } from "@/lib/stores/cart-store";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { Drawer } from "@/components/ui/Drawer";
import { CartEmptyState } from "./CartEmptyState";
import { ClearCartConfirmation, useClearCartConfirmation } from "./ClearCartConfirmation";
import { CartHeader, CartItemsList, CartFooter } from "./CartDrawerParts";
import type { MenuItem } from "@/types/menu";

// ============================================
// TYPES
// ============================================

export interface CartDrawerProps {
  /** Additional className */
  className?: string;
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
  const cutoffDay = useCartStore((state) => state.cutoffDay);
  const cutoffHour = useCartStore((state) => state.cutoffHour);
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
            cutoffDay={cutoffDay}
            cutoffHour={cutoffHour}
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

  if (isMobile) {
    return (
      <Drawer
        isOpen={isOpen}
        onClose={close}
        position="bottom"
        height="full"
        showDragHandle={true}
        title="Your Cart"
        className={cn("flex flex-col", className)}
      >
        <CartContent onClose={close} />
      </Drawer>
    );
  }

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
