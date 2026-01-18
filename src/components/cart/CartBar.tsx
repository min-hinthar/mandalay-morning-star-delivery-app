"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ChevronUp, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/hooks/useCart";
import { useCartDrawer } from "@/lib/hooks/useCartDrawer";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { FREE_DELIVERY_THRESHOLD_CENTS } from "@/types/cart";

interface CartBarProps {
  className?: string;
  showCheckoutButton?: boolean;
}

export function CartBar({ className, showCheckoutButton = true }: CartBarProps) {
  const router = useRouter();
  const { isEmpty, itemCount, estimatedTotal, amountToFreeDelivery } = useCart();
  const { open } = useCartDrawer();

  const progressPercent = Math.min(
    100,
    ((FREE_DELIVERY_THRESHOLD_CENTS - amountToFreeDelivery) /
      FREE_DELIVERY_THRESHOLD_CENTS) *
      100
  );
  const hasFreeDelivery = amountToFreeDelivery === 0;
  const showProgress = !hasFreeDelivery && !isEmpty;

  const handleViewCart = () => {
    open();
  };

  const handleCheckout = () => {
    router.push("/checkout");
  };

  return (
    <AnimatePresence>
      {!isEmpty && (
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={cn(
            "fixed bottom-0 left-0 right-0 z-[var(--z-modal-backdrop)]",
            "bg-[var(--color-surface)] border-t border-[var(--color-border)]",
            "shadow-[0_-10px_30px_-5px_rgba(139,69,19,0.1)]",
            "rounded-t-[var(--radius-xl)]",
            "pb-[env(safe-area-inset-bottom)]",
            className
          )}
          role="region"
          aria-label="Shopping cart summary"
        >
          {/* Free delivery progress */}
          {showProgress && (
            <div className="px-4 pt-3">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-[var(--text-xs)] text-[var(--color-text-muted)]">
                  <Truck className="h-3.5 w-3.5" />
                  <span>
                    {formatPrice(amountToFreeDelivery)} more for free delivery
                  </span>
                </div>
                <span className="text-[var(--text-xs)] font-medium text-[var(--color-interactive-primary)]">
                  {Math.round(progressPercent)}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-[var(--color-interactive-primary)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          )}

          {/* Free delivery achieved */}
          {hasFreeDelivery && (
            <div className="px-4 pt-3">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center justify-center gap-2 py-1.5 rounded-full bg-[var(--color-status-success-bg)] text-[var(--color-accent-secondary)]"
              >
                <Truck className="h-4 w-4" />
                <span className="text-[var(--text-sm)] font-semibold">
                  Free Delivery!
                </span>
              </motion.div>
            </div>
          )}

          {/* Main bar content */}
          <div className="flex items-center justify-between gap-4 px-4 py-3 h-[var(--cart-bar-height)]">
            {/* Left: Cart icon + count */}
            <button
              onClick={handleViewCart}
              className={cn(
                "flex items-center gap-3 min-w-0",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-interactive-primary)] rounded-lg p-1 -m-1"
              )}
              aria-label={`View cart with ${itemCount} items`}
            >
              <div className="relative flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-status-error-bg)]">
                  <ShoppingBag className="h-5 w-5 text-[var(--color-accent-tertiary)]" />
                </div>
                <motion.span
                  key={itemCount}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={cn(
                    "absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center",
                    "rounded-full bg-[var(--color-interactive-primary)] text-[var(--color-charcoal)]",
                    "text-[10px] font-bold shadow-sm"
                  )}
                >
                  {itemCount > 99 ? "99+" : itemCount}
                </motion.span>
              </div>

              {/* Center: Total price */}
              <div className="min-w-0">
                <p className="text-[var(--text-xs)] text-[var(--color-text-muted)] truncate">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </p>
                <p
                  className="font-display text-[var(--text-xl)] font-bold text-[var(--color-text-primary)] truncate"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {formatPrice(estimatedTotal)}
                </p>
              </div>
            </button>

            {/* Right: Action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleViewCart}
                className="gap-1 text-[var(--color-text-secondary)]"
              >
                <ChevronUp className="h-4 w-4" />
                <span className="hidden sm:inline">View</span>
              </Button>

              {showCheckoutButton && (
                <Button
                  size="sm"
                  onClick={handleCheckout}
                  className="bg-[var(--color-interactive-primary)] text-[var(--color-charcoal)] hover:bg-[var(--color-interactive-hover)] shadow-sm"
                >
                  Checkout
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
