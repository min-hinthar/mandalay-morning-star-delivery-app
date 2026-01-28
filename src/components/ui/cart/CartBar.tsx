"use client";

/**
 * CartBar Component
 * Fixed bottom bar showing cart summary with slide-up animation
 *
 * Features:
 * - Appears when cart has items, slides away when empty
 * - Free delivery progress indicator with animated truck
 * - Item count badge with bounce animation
 * - Price ticker for total
 * - Opens CartDrawer on click
 * - Sound effects on interactions (click, pop, swoosh)
 * - Haptic feedback on button presses
 * - whileTap/whileHover micro-animations
 * - Respects animation preferences
 * - iOS safe area support
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ChevronUp, Truck, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/hooks/useCart";
import { useCartDrawer } from "@/lib/hooks/useCartDrawer";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { usePlaySound } from "@/lib/hooks/useSoundEffect";
import { PriceTicker } from "@/components/ui/PriceTicker";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { zIndex } from "@/lib/design-system/tokens/z-index";
import {
  spring,
  cartBarSlideUp,
  cartBarBounce,
  badgeVariants,
  triggerHaptic,
} from "@/lib/motion-tokens";
import { FREE_DELIVERY_THRESHOLD_CENTS } from "@/types/cart";

// ============================================
// TYPES
// ============================================

export interface CartBarProps {
  /** Additional className */
  className?: string;
  /** Show checkout button (default: true) */
  showCheckoutButton?: boolean;
}

// ============================================
// COMPACT DELIVERY PROGRESS
// ============================================

interface DeliveryProgressProps {
  progressPercent: number;
  amountToFreeDelivery: number;
  shouldAnimate: boolean;
  getSpring: (preset: typeof spring.rubbery) => object;
}

function DeliveryProgress({
  progressPercent,
  amountToFreeDelivery,
  shouldAnimate,
  getSpring,
}: DeliveryProgressProps) {
  return (
    <div className="px-4 pt-3 pb-1">
      <div className="flex items-center gap-2 mb-2">
        <motion.div
          animate={
            shouldAnimate
              ? { rotate: [0, 5, -5, 0], y: [0, -1, 0] }
              : undefined
          }
          transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 2 }}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        </motion.div>
        <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
          ${(amountToFreeDelivery / 100).toFixed(2)} to free delivery
        </span>
      </div>

      {/* Compact progress bar */}
      <div className="relative h-2">
        {/* Track background */}
        <div className="absolute inset-0 rounded-full bg-amber-100 dark:bg-amber-900/40 overflow-hidden">
          {/* Road dashes */}
          <div className="absolute inset-y-0 inset-x-1 flex items-center justify-evenly">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="w-1 h-0.5 bg-amber-200/60 dark:bg-amber-800/50 rounded-full"
              />
            ))}
          </div>

          {/* Filled progress */}
          <motion.div
            className="h-full rounded-full bg-gradient-progress shadow-sm"
            animate={{ width: `${progressPercent}%` }}
            transition={getSpring(spring.rubbery)}
          />
        </div>

        {/* Animated truck */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2"
          animate={{ left: `calc(${progressPercent}% - 8px)` }}
          transition={getSpring(spring.rubbery)}
        >
          <motion.div
            animate={
              shouldAnimate ? { y: [0, -1, 0], rotate: [0, -2, 2, 0] } : undefined
            }
            transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 0.5 }}
            className="w-4 h-4 rounded-full bg-surface-primary dark:bg-surface-tertiary border border-amber-400 shadow-sm flex items-center justify-center"
          >
            <Truck className="w-2.5 h-2.5 text-amber-600" />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

// ============================================
// FREE DELIVERY ACHIEVED BANNER
// ============================================

interface FreeDeliveryBannerProps {
  shouldAnimate: boolean;
}

function FreeDeliveryBanner({ shouldAnimate }: FreeDeliveryBannerProps) {
  return (
    <div className="px-4 pt-3 pb-1">
      <motion.div
        initial={shouldAnimate ? { scale: 0.9, opacity: 0 } : false}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center justify-center gap-2 py-1.5 px-3 rounded-full bg-gradient-delivery-success"
      >
        <motion.div
          animate={
            shouldAnimate
              ? { rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }
              : undefined
          }
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
        >
          <Truck className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
        </motion.div>
        <span className="text-xs font-semibold text-green-700 dark:text-green-400">
          Free Delivery!
        </span>
      </motion.div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CartBar({
  className,
  showCheckoutButton = true,
}: CartBarProps) {
  const router = useRouter();
  const { isEmpty, itemCount, estimatedTotal, amountToFreeDelivery } = useCart();
  const { open } = useCartDrawer();
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const playSound = usePlaySound();

  // Hydration safety
  const [mounted, setMounted] = useState(false);

  // Bounce effect tracking
  const [shouldBounce, setShouldBounce] = useState(false);
  const prevCountRef = useRef(itemCount);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Bounce animation and sound when items added
  useEffect(() => {
    if (mounted && itemCount > prevCountRef.current) {
      setShouldBounce(true);
      playSound("pop");
      triggerHaptic("medium");
      const timeout = setTimeout(() => setShouldBounce(false), 300);
      prevCountRef.current = itemCount;
      return () => clearTimeout(timeout);
    }
    prevCountRef.current = itemCount;
  }, [itemCount, mounted, playSound]);

  // Calculate delivery progress
  const progressPercent = Math.min(
    100,
    ((FREE_DELIVERY_THRESHOLD_CENTS - amountToFreeDelivery) /
      FREE_DELIVERY_THRESHOLD_CENTS) *
      100
  );
  const hasFreeDelivery = amountToFreeDelivery === 0;

  const handleViewCart = useCallback(() => {
    playSound("click");
    triggerHaptic("light");
    open();
  }, [open, playSound]);

  const handleCheckout = useCallback(() => {
    playSound("swoosh");
    triggerHaptic("medium");
    router.push("/checkout");
  }, [router, playSound]);

  // Don't render until mounted (hydration safety)
  if (!mounted) return null;

  return (
    <AnimatePresence>
      {!isEmpty && (
        <motion.div
          variants={shouldAnimate ? cartBarSlideUp : undefined}
          initial={shouldAnimate ? "hidden" : false}
          animate={shouldAnimate ? "visible" : { y: 0, opacity: 1 }}
          exit={shouldAnimate ? "exit" : undefined}
          style={{ zIndex: zIndex.fixed }}
          className={cn(
            "fixed bottom-0 left-0 right-0",
            "bg-surface-primary/80 dark:bg-gray-900/75 backdrop-blur-3xl border-t border-white/20 dark:border-white/10",
            "shadow-nav-top",
            "rounded-t-2xl",
            // iOS safe area
            "pb-[env(safe-area-inset-bottom)]",
            className
          )}
          role="region"
          aria-label="Shopping cart summary"
        >
          {/* Delivery progress or free delivery banner */}
          {!hasFreeDelivery ? (
            <DeliveryProgress
              progressPercent={progressPercent}
              amountToFreeDelivery={amountToFreeDelivery}
              shouldAnimate={shouldAnimate}
              getSpring={getSpring}
            />
          ) : (
            <FreeDeliveryBanner shouldAnimate={shouldAnimate} />
          )}

          {/* Main content row */}
          <motion.div
            animate={shouldBounce && shouldAnimate ? cartBarBounce : undefined}
            className="flex items-center justify-between gap-3 px-4 py-3"
          >
            {/* Left: Cart icon + count + price */}
            <motion.button
              onClick={handleViewCart}
              whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
              whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
              transition={getSpring(spring.snappy)}
              className={cn(
                "flex items-center gap-3 min-w-0",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2",
                "rounded-lg p-1 -m-1",
                "transition-colors hover:bg-amber-50/50 dark:hover:bg-amber-900/20"
              )}
              aria-label={`View cart with ${itemCount} items`}
            >
              {/* Cart icon with badge */}
              <div className="relative flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
                  <ShoppingBag className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>

                {/* Animated badge */}
                <motion.span
                  key={itemCount}
                  variants={shouldAnimate ? badgeVariants : undefined}
                  initial={shouldAnimate ? "initial" : false}
                  animate={shouldAnimate ? "animate" : { scale: 1, opacity: 1 }}
                  className={cn(
                    "absolute -top-1 -right-1",
                    "flex h-5 min-w-5 items-center justify-center px-1",
                    "rounded-full bg-amber-500 text-2xs font-bold text-text-inverse",
                    "shadow-sm"
                  )}
                >
                  {itemCount > 99 ? "99+" : itemCount}
                </motion.span>
              </div>

              {/* Item count and price */}
              <div className="min-w-0">
                <p className="text-xs text-text-secondary dark:text-gray-400 truncate">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </p>
                <PriceTicker
                  value={estimatedTotal}
                  inCents
                  size="lg"
                  className="text-text-primary dark:text-text-primary font-bold"
                />
              </div>
            </motion.button>

            {/* Right: Action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* View Cart button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleViewCart}
                className="gap-1 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30"
              >
                <ChevronUp className="h-4 w-4" />
                <span className="hidden sm:inline">View</span>
              </Button>

              {/* Checkout button */}
              {showCheckoutButton && (
                <Button
                  size="sm"
                  onClick={handleCheckout}
                  className="bg-amber-500 text-text-inverse hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 font-semibold shadow-sm"
                >
                  Checkout
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CartBar;
