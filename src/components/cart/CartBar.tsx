"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ChevronUp, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/hooks/useCart";
import { useCartDrawer } from "@/lib/hooks/useCartDrawer";
import { Button } from "@/components/ui/button";
import { PriceTicker } from "@/components/ui/PriceTicker";
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
            "fixed bottom-0 left-0 right-0 z-30",
            "bg-surface-primary/95 backdrop-blur-lg border-t border-border",
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
              <div className="flex items-center justify-between mb-2">
                <span className="text-[var(--text-xs)] font-semibold text-amber-700 dark:text-amber-300">
                  {formatPrice(amountToFreeDelivery)} to free delivery!
                </span>
                <span className="text-[var(--text-xs)] font-medium text-amber-600 dark:text-amber-400">
                  {Math.round(progressPercent)}%
                </span>
              </div>
              {/* Enhanced progress bar with truck */}
              <div className="relative h-3">
                {/* Track */}
                <div className="absolute inset-0 rounded-full bg-amber-100 dark:bg-amber-900/40 overflow-hidden">
                  {/* Road dashes */}
                  <div className="absolute inset-y-0 inset-x-2 flex items-center justify-evenly">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1.5 h-0.5 bg-amber-200 dark:bg-amber-800 rounded-full"
                      />
                    ))}
                  </div>
                  {/* Filled portion - key ensures animation triggers on value change */}
                  <motion.div
                    key={`progress-${Math.round(progressPercent)}`}
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_2px_6px_rgba(245,158,11,0.3)]"
                    initial={{ width: `${Math.max(0, progressPercent - 10)}%` }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  />
                </div>
                {/* Animated truck - key ensures position updates on value change */}
                <motion.div
                  key={`truck-${Math.round(progressPercent)}`}
                  className="absolute top-1/2 -translate-y-1/2 z-10"
                  initial={{ left: `calc(${Math.max(0, progressPercent - 10)}% - 10px)` }}
                  animate={{ left: `calc(${progressPercent}% - 10px)` }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                >
                  <motion.div
                    animate={{
                      y: [0, -1, 0],
                      rotate: [0, -2, 2, 0],
                    }}
                    transition={{
                      duration: 0.3,
                      repeat: Infinity,
                      repeatDelay: 0.1,
                    }}
                    className="w-5 h-5 rounded-full bg-white dark:bg-zinc-800 border-2 border-amber-500 shadow-md flex items-center justify-center"
                  >
                    <Truck className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                  </motion.div>
                </motion.div>
                {/* Goal */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 text-xs">
                  🏁
                </div>
              </div>
            </div>
          )}

          {/* Free delivery achieved - key triggers animation when threshold crossed */}
          {hasFreeDelivery && (
            <div className="px-4 pt-3">
              <motion.div
                key="free-delivery-unlocked"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/30 border border-green-200 dark:border-green-800"
              >
                <motion.div
                  animate={{
                    rotate: [0, -5, 5, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    repeatDelay: 2,
                  }}
                >
                  <Truck className="h-4 w-4 text-green-600 dark:text-green-400" />
                </motion.div>
                <span className="text-[var(--text-sm)] font-bold text-green-700 dark:text-green-300">
                  Free Delivery Unlocked! 🎉
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
                    "rounded-full bg-[var(--color-interactive-primary)] text-[var(--color-text-primary)]",
                    "text-[10px] font-bold shadow-sm"
                  )}
                >
                  {itemCount > 99 ? "99+" : itemCount}
                </motion.span>
              </div>

              {/* Center: Total price */}
              <div className="min-w-0">
                <p className="text-[var(--text-xs)] text-[var(--color-text-secondary)] truncate">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </p>
                <div
                  className="font-display text-[var(--text-xl)] font-bold text-[var(--color-text-primary)] truncate"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  <PriceTicker value={estimatedTotal} inCents size="lg" />
                </div>
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
                  className="bg-[var(--color-interactive-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-interactive-hover)] shadow-sm"
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
