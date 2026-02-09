"use client";

import { useRef, useMemo, useCallback, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { useCart } from "@/lib/hooks/useCart";
import {
  useCartValidation,
  useCartHydrated,
} from "@/lib/hooks/useCartValidation";
import { useMenu } from "@/lib/hooks/useMenu";
import { useCartStore } from "@/lib/stores/cart-store";
import { CartEmptyState } from "@/components/ui/cart/CartEmptyState";
import {
  ClearCartConfirmation,
  useClearCartConfirmation,
} from "@/components/ui/cart/ClearCartConfirmation";
import { CartPageHeader } from "./CartPageHeader";
import { CartItemGroup } from "./CartItemGroup";
import { CartPageSummary } from "./CartPageSummary";
import { CheckoutGate } from "./CheckoutGate";
import { AttentionSection } from "./AttentionSection";
import { MINIMUM_ORDER_CENTS } from "@/types/cart";
import type { CartItem } from "@/types/cart";
import type { MenuItem } from "@/types/menu";

// ============================================
// SKELETON LOADER
// ============================================

function CartSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn(
            "rounded-2xl p-4",
            "bg-surface-secondary/50",
            "border border-surface-border/20",
            "h-24"
          )}
        />
      ))}
    </div>
  );
}

// ============================================
// TYPES
// ============================================

interface CategoryGroup {
  categoryName: string;
  categoryId: string;
  items: CartItem[];
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CartPageContent() {
  const hydrated = useCartHydrated();
  const {
    items,
    itemCount,
    itemsSubtotal,
    estimatedDeliveryFee,
    amountToFreeDelivery,
    isEmpty,
    addItem,
    removeItem,
  } = useCart();
  const validation = useCartValidation();
  const {
    isOpen: isClearOpen,
    itemCount: clearItemCount,
    openConfirmation: openClearCart,
    handleConfirm: handleClearConfirm,
    close: closeClearCart,
  } = useClearCartConfirmation();
  const { data: menuData } = useMenu();
  const attentionRef = useRef<HTMLDivElement>(null);

  // Edit modal state (basic implementation)
  const [, setEditingItem] = useState<CartItem | null>(null);

  // ============================================
  // HANDLERS
  // ============================================

  const scrollToAttention = useCallback(() => {
    attentionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const handleReplaceItem = useCallback(
    (cartItemId: string, suggestion: MenuItem, originalQuantity: number) => {
      removeItem(cartItemId);
      addItem({
        menuItemId: suggestion.id,
        menuItemSlug: suggestion.slug,
        nameEn: suggestion.nameEn,
        nameMy: suggestion.nameMy,
        imageUrl: suggestion.imageUrl,
        basePriceCents: suggestion.basePriceCents,
        quantity: originalQuantity,
        modifiers: [],
        notes: "",
      });
    },
    [removeItem, addItem]
  );

  const handleDismissPriceChange = useCallback(
    (cartItemId: string, newPriceCents: number) => {
      useCartStore.getState().updateItemPrice(cartItemId, newPriceCents);
    },
    []
  );

  const handleEditItem = useCallback((item: CartItem) => {
    // TODO: Wire to ItemDetailSheet or full modifier editor
    setEditingItem(item);
  }, []);

  const handleCheckout = useCallback(() => {
    // Navigate to checkout
    window.location.href = "/checkout";
  }, []);

  // ============================================
  // CATEGORY GROUPING
  // ============================================

  const { categoryGroups, problemItems } = useMemo(() => {
    if (!items.length) return { categoryGroups: [], problemItems: [] };

    const categories = menuData?.data?.categories ?? [];

    // Build menuItemId -> category lookup
    const categoryLookup = new Map<string, { name: string; id: string }>();
    for (const category of categories) {
      for (const menuItem of category.items) {
        categoryLookup.set(menuItem.id, {
          name: category.name,
          id: category.id,
        });
      }
    }

    // Separate problem items from valid items
    const problems: CartItem[] = [];
    const validItems: CartItem[] = [];

    for (const item of items) {
      const itemValidation = validation.validations.get(item.cartItemId);
      if (
        itemValidation?.status === "sold-out" ||
        itemValidation?.status === "unavailable"
      ) {
        problems.push(item);
      } else {
        validItems.push(item);
      }
    }

    // Group valid items by category
    const groupMap = new Map<string, CategoryGroup>();

    for (const item of validItems) {
      const category = categoryLookup.get(item.menuItemId);
      const categoryId = category?.id ?? item.categoryId ?? "other";
      const categoryName = category?.name ?? "Other";

      if (!groupMap.has(categoryId)) {
        groupMap.set(categoryId, {
          categoryId,
          categoryName,
          items: [],
        });
      }
      groupMap.get(categoryId)!.items.push(item);
    }

    return {
      categoryGroups: Array.from(groupMap.values()),
      problemItems: problems,
    };
  }, [items, menuData, validation.validations]);

  // Minimum order shortfall
  const minimumShortfallCents = Math.max(0, MINIMUM_ORDER_CENTS - itemsSubtotal);

  // Stale item count (sold-out + unavailable)
  const staleCount =
    validation.soldOutIds.length + validation.unavailableIds.length;

  // Problem item validations map (only sold-out/unavailable)
  const problemValidations = useMemo(() => {
    const map = new Map<string, { status: "sold-out" | "unavailable" }>();
    for (const item of problemItems) {
      const v = validation.validations.get(item.cartItemId);
      if (v && (v.status === "sold-out" || v.status === "unavailable")) {
        map.set(item.cartItemId, {
          status: v.status,
        });
      }
    }
    return map;
  }, [problemItems, validation.validations]);

  // ============================================
  // RENDER STATES
  // ============================================

  // Not hydrated yet: show skeleton
  if (!hydrated) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <CartSkeleton />
      </div>
    );
  }

  // Empty cart
  if (isEmpty) {
    return <CartEmptyState />;
  }

  // Validating state: show items with pulsing ring
  const isValidating = validation.status === "validating";

  return (
    <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-8">
      {/* Left column: Items */}
      <div>
        <CartPageHeader
          itemCount={itemCount}
          onClearCart={openClearCart}
          showClear={!isEmpty}
        />

        {/* Attention section for problem items (AnimatePresence enables exit animation) */}
        <AnimatePresence>
          {problemItems.length > 0 && (
            <AttentionSection
              ref={attentionRef}
              items={problemItems}
              validations={problemValidations}
              suggestions={validation.suggestions}
              onRemoveItem={removeItem}
              onReplaceItem={handleReplaceItem}
            />
          )}
        </AnimatePresence>

        {/* Animated validation progress bar */}
        <AnimatePresence>
          {isValidating && (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-0.5 w-full rounded-full bg-primary/20 mb-4 overflow-hidden"
            >
              <m.div
                className="h-full w-1/3 rounded-full bg-primary"
                animate={{ x: ["0%", "200%", "0%"] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </m.div>
          )}
        </AnimatePresence>

        {/* Category-grouped items */}
        <AnimatePresence mode="sync">
          {categoryGroups.map((group) => (
            <CartItemGroup
              key={group.categoryId}
              categoryName={group.categoryName}
              items={group.items}
              validations={validation.validations}
              suggestions={validation.suggestions}
              onRemoveItem={removeItem}
              onReplaceItem={handleReplaceItem}
              onEditItem={handleEditItem}
              onDismissPriceChange={handleDismissPriceChange}
            />
          ))}
        </AnimatePresence>

        {/* Add more items link (mobile only, desktop has it in CheckoutGate) */}
        <div className="lg:hidden mt-4 mb-6">
          <Link
            href="/menu"
            className={cn(
              "flex items-center justify-center gap-1.5",
              "text-sm font-medium text-text-secondary",
              "hover:text-primary transition-colors",
              "py-2"
            )}
          >
            <ShoppingBag className="w-4 h-4" />
            + Add more items
          </Link>
        </div>
      </div>

      {/* Right column: Summary + Checkout (sticky so checkout stays visible) */}
      <div className="lg:mt-0 mt-2 lg:sticky lg:top-24 lg:self-start">
        <CartPageSummary
          subtotalCents={itemsSubtotal}
          deliveryFeeCents={estimatedDeliveryFee}
          minimumShortfallCents={minimumShortfallCents}
          amountToFreeDelivery={amountToFreeDelivery}
        />
        <CheckoutGate
          hasBlockingIssues={validation.hasBlockingIssues}
          staleCount={staleCount}
          minimumShortfallCents={minimumShortfallCents}
          onScrollToAttention={scrollToAttention}
          onCheckout={handleCheckout}
        />
      </div>

      {/* Clear cart confirmation modal */}
      <ClearCartConfirmation
        isOpen={isClearOpen}
        onClose={closeClearCart}
        onConfirm={handleClearConfirm}
        itemCount={clearItemCount}
      />
    </div>
  );
}

export default CartPageContent;
