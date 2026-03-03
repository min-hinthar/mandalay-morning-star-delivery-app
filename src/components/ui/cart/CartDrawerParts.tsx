"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  X,
  Trash2,
  AlertTriangle,
  Expand,
  CalendarClock,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring, staggerContainer, staggerItem } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useCart } from "@/lib/hooks/useCart";
import { useDeliveryGate } from "@/lib/hooks/useDeliveryGate";
import { Button } from "@/components/ui/button";
import { DeliveryCountdown } from "@/components/ui/delivery";
import { CartItem } from "./CartItem";
import { CartSummary } from "./CartSummary";
import { CartEmptyState } from "./CartEmptyState";
import { SuggestionRow } from "./CartPage/SuggestionRow";
import type { CartValidationResult } from "@/types/cart";
import type { MenuItem } from "@/types/menu";

// Day name helper
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatCutoffTime(cutoffDay: number, cutoffHour: number): string {
  const dayName = DAY_NAMES[cutoffDay] ?? "Friday";
  const period = cutoffHour >= 12 ? "PM" : "AM";
  const hour12 = cutoffHour % 12 === 0 ? 12 : cutoffHour % 12;
  return `${dayName} at ${hour12}:00 ${period}`;
}

// ============================================
// SYNC STATUS TYPES
// ============================================

type SyncStatus = "idle" | "saving" | "saved";

// ============================================
// CART HEADER
// ============================================

interface CartHeaderProps {
  itemCount: number;
  onClose: () => void;
  onClearClick: () => void;
  showClear: boolean;
}

export function CartHeader({ itemCount, onClose, onClearClick, showClear }: CartHeaderProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const { items } = useCart();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const isFirstRender = useRef(true);
  const savingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track cart item changes for sync indicator
  useEffect(() => {
    // Skip first render to avoid showing "Saved" on mount
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Clear existing timers
    if (savingTimerRef.current) clearTimeout(savingTimerRef.current);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);

    // Show "Saving..." briefly
    setSyncStatus("saving");

    // After 500ms, switch to "Saved"
    savingTimerRef.current = setTimeout(() => {
      setSyncStatus("saved");

      // After 2s, hide indicator
      savedTimerRef.current = setTimeout(() => {
        setSyncStatus("idle");
      }, 2000);
    }, 500);

    return () => {
      if (savingTimerRef.current) clearTimeout(savingTimerRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, [items]);

  return (
    <div
      className={cn(
        "flex items-center justify-between",
        "border-b border-border",
        "bg-surface-secondary px-4 py-4"
      )}
    >
      <div className="flex items-center gap-3">
        <h2
          id="cart-drawer-title"
          className="flex items-center gap-3 text-lg font-display font-bold text-text-primary"
        >
          <m.div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              "bg-amber-100 dark:bg-amber-900/30"
            )}
          >
            <ShoppingBag className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </m.div>
          Your Cart
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

        {/* Sync status indicator */}
        <AnimatePresence>
          {syncStatus !== "idle" && (
            <m.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="flex items-center gap-1 text-xs text-text-muted"
            >
              {syncStatus === "saving" ? (
                "Saving..."
              ) : (
                <>
                  <Check className="h-3 w-3" />
                  Saved
                </>
              )}
            </m.span>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2">
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

export function CartItemsList({
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

// ============================================
// CART FOOTER
// ============================================

interface CartFooterProps {
  onClose: () => void;
  onCheckout: () => void;
  hasBlockingIssues?: boolean;
  showFullCartLink?: boolean;
  /** Cutoff day of week (0=Sun..6=Sat). Defaults to Friday (5). */
  cutoffDay?: number;
  /** Cutoff hour (0-23). Defaults to 15 (3 PM). */
  cutoffHour?: number;
}

export function CartFooter({
  onClose,
  onCheckout,
  hasBlockingIssues = false,
  showFullCartLink,
  cutoffDay = 5,
  cutoffHour = 15,
}: CartFooterProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const gate = useDeliveryGate(cutoffDay, cutoffHour);

  const isDisabled = hasBlockingIssues || !gate.isOpen;
  const closedText = `Checkout opens ${formatCutoffTime(cutoffDay, cutoffHour)}`;

  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={{ delay: 0.2 }}
      className={cn("border-t border-border", "bg-surface-secondary", "px-4 py-4")}
    >
      {/* Delivery info row */}
      <div className="mb-3 flex items-center justify-between rounded-lg bg-surface-tertiary px-3 py-2">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-3.5 w-3.5 text-primary/70 flex-shrink-0" />
          <span className="text-xs text-text-secondary">
            {gate.isOpen ? (
              <>
                Delivery{" "}
                <span className="font-medium text-text-primary">
                  {gate.deliveryDate.displayDate}
                </span>
              </>
            ) : (
              <span className="text-amber-600 dark:text-amber-400">{closedText}</span>
            )}
          </span>
        </div>
        {gate.isOpen && (
          <DeliveryCountdown
            cutoffDate={gate.cutoffDate}
            urgency={gate.urgency}
            className="text-xs"
          />
        )}
      </div>

      <CartSummary />

      <div className="mt-4 flex flex-col gap-3">
        <m.div
          whileHover={shouldAnimate && !isDisabled ? { scale: 1.01 } : undefined}
          whileTap={shouldAnimate && !isDisabled ? { scale: 0.99 } : undefined}
          transition={getSpring(spring.snappyButton)}
          className="relative"
        >
          {shouldAnimate && !isDisabled && (
            <div className="absolute inset-0 rounded-xl bg-primary/30 blur-lg opacity-50" />
          )}
          <Button
            variant="primary"
            size="lg"
            className={cn(
              "relative w-full shadow-elevated",
              isDisabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={isDisabled ? undefined : onCheckout}
            disabled={isDisabled}
          >
            {gate.isOpen ? "Proceed to Checkout" : closedText}
          </Button>
        </m.div>

        {hasBlockingIssues && gate.isOpen && (
          <p className="flex items-center justify-center gap-1.5 text-xs text-text-muted">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            Remove unavailable items to checkout
          </p>
        )}

        <Button variant="outline" size="lg" className="w-full" onClick={onClose}>
          Continue Shopping
        </Button>

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
