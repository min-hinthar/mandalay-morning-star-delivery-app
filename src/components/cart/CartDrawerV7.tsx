"use client";

import React, { useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { ShoppingBag, X, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { v7Spring, v7StaggerContainer, v7StaggerItem } from "@/lib/motion-tokens-v7";
import { useAnimationPreferenceV7 } from "@/lib/hooks/useAnimationPreferenceV7";
import { useCart } from "@/lib/hooks/useCart";
import { useCartDrawer } from "@/lib/hooks/useCartDrawer";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { Button } from "@/components/ui/button";
import { CartItemV7 } from "./CartItemV7";
import { PriceTicker } from "@/components/ui/PriceTicker";
import { FREE_DELIVERY_THRESHOLD_CENTS } from "@/types/cart";

// ============================================
// TYPES
// ============================================

export interface CartDrawerV7Props {
  /** Additional className */
  className?: string;
}

// ============================================
// CART SUMMARY V7
// ============================================

function CartSummaryV7() {
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();
  const {
    itemsSubtotal,
    estimatedDeliveryFee,
    estimatedTotal,
    amountToFreeDelivery,
  } = useCart();

  const progressPercent = Math.min(
    100,
    ((FREE_DELIVERY_THRESHOLD_CENTS - amountToFreeDelivery) / FREE_DELIVERY_THRESHOLD_CENTS) * 100
  );

  return (
    <motion.div
      variants={shouldAnimate ? v7StaggerItem : undefined}
      className="space-y-3"
    >
      {/* Free delivery progress */}
      {amountToFreeDelivery > 0 && (
        <motion.div
          initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          className="p-3 rounded-lg bg-v6-secondary/10 border border-v6-secondary/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-v6-secondary" />
            <span className="text-sm font-medium text-v6-text-primary">
              ${(amountToFreeDelivery / 100).toFixed(2)} away from free delivery!
            </span>
          </div>
          <div className="h-2 bg-v6-surface-tertiary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-v6-secondary to-v6-secondary-hover rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={getSpring(v7Spring.rubbery)}
            />
          </div>
        </motion.div>
      )}

      {/* Summary rows */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-v6-text-secondary">
          <span>Subtotal</span>
          <PriceTicker value={itemsSubtotal} inCents={true} />
        </div>
        <div className="flex justify-between text-v6-text-secondary">
          <span>Delivery Fee</span>
          {amountToFreeDelivery <= 0 ? (
            <motion.span
              initial={shouldAnimate ? { scale: 0.8 } : undefined}
              animate={shouldAnimate ? { scale: 1 } : undefined}
              className="text-v6-green font-semibold"
            >
              FREE
            </motion.span>
          ) : (
            <PriceTicker value={estimatedDeliveryFee} inCents={true} />
          )}
        </div>
        <div className="h-px bg-v6-border my-2" />
        <div className="flex justify-between font-semibold text-base text-v6-text-primary">
          <span>Estimated Total</span>
          <PriceTicker value={estimatedTotal} inCents={true} className="text-v6-primary" />
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// EMPTY STATE V7
// ============================================

function CartEmptyStateV7({ onClose }: { onClose: () => void }) {
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: 30 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={getSpring(v7Spring.rubbery)}
      className="flex flex-1 flex-col items-center justify-center px-6 text-center"
    >
      {/* Animated bag icon */}
      <motion.div
        animate={shouldAnimate ? {
          y: [0, -8, 0],
          rotate: [0, 3, -3, 0],
        } : undefined}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={cn(
          "flex h-28 w-28 items-center justify-center rounded-full",
          "bg-gradient-to-br from-v6-primary-light to-v6-secondary/10"
        )}
      >
        <ShoppingBag className="h-14 w-14 text-v6-primary/60" />
      </motion.div>

      <motion.h3
        initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
        transition={{ delay: 0.1 }}
        className="mt-6 text-xl font-v6-display font-bold text-v6-text-primary"
      >
        Your cart is empty
      </motion.h3>

      <motion.p
        initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
        transition={{ delay: 0.15 }}
        className="mt-2 text-sm font-v6-body text-v6-text-secondary max-w-[240px]"
      >
        Browse our authentic Burmese dishes and add something delicious!
      </motion.p>

      <motion.div
        initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
        transition={{ delay: 0.2 }}
      >
        <Button
          variant="primary"
          size="lg"
          className="mt-8 shadow-v6-elevated"
          onClick={onClose}
          asChild
        >
          <Link href="/menu">Browse Menu</Link>
        </Button>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// PERSISTENT PREVIEW BAR
// ============================================

export function CartPreviewBar() {
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();
  const { isOpen, open } = useCartDrawer();
  const { isEmpty, itemCount, estimatedTotal } = useCart();

  if (isOpen || isEmpty) return null;

  return (
    <motion.div
      initial={shouldAnimate ? { y: 100, opacity: 0 } : undefined}
      animate={shouldAnimate ? { y: 0, opacity: 1 } : undefined}
      exit={shouldAnimate ? { y: 100, opacity: 0 } : undefined}
      transition={getSpring(v7Spring.rubbery)}
      className={cn(
        "fixed bottom-0 inset-x-0 z-40",
        "p-4 pb-[max(1rem,env(safe-area-inset-bottom))]",
        "bg-v6-surface-primary/95 backdrop-blur-xl",
        "border-t border-v6-border",
        "shadow-v6-elevated"
      )}
    >
      <motion.button
        onClick={open}
        className={cn(
          "w-full flex items-center justify-between gap-4",
          "p-4 rounded-2xl",
          "bg-v6-primary text-white",
          "shadow-lg shadow-v6-primary/30"
        )}
        whileHover={shouldAnimate ? { scale: 1.01 } : undefined}
        whileTap={shouldAnimate ? { scale: 0.99 } : undefined}
        transition={getSpring(v7Spring.snappy)}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShoppingBag className="w-6 h-6" />
            <motion.span
              key={itemCount}
              initial={shouldAnimate ? { scale: 0 } : undefined}
              animate={shouldAnimate ? { scale: 1 } : undefined}
              className={cn(
                "absolute -top-2 -right-2 w-5 h-5",
                "flex items-center justify-center",
                "bg-white text-v6-primary text-xs font-bold",
                "rounded-full"
              )}
            >
              {itemCount}
            </motion.span>
          </div>
          <span className="font-semibold">View Cart</span>
        </div>

        <div className="flex items-center gap-2">
          <PriceTicker value={estimatedTotal} className="font-bold" />
          <ChevronRight className="w-5 h-5" />
        </div>
      </motion.button>
    </motion.div>
  );
}

// ============================================
// MAIN DRAWER COMPONENT
// ============================================

export function CartDrawerV7({ className }: CartDrawerV7Props) {
  const router = useRouter();
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();
  const { isOpen, close } = useCartDrawer();
  const { items, isEmpty, itemCount } = useCart();
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);
  const isMobile = useMediaQuery("(max-width: 640px)");

  // Drag handling
  const dragY = useMotionValue(0);
  const dragProgress = useTransform(dragY, [0, 300], [0, 1]);
  const backdropOpacity = useTransform(dragProgress, [0, 1], [1, 0]);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (isMobile && (info.offset.y > 100 || info.velocity.y > 500)) {
        close();
      }
    },
    [isMobile, close]
  );

  // Focus management
  useEffect(() => {
    if (isOpen) {
      lastActiveElementRef.current = document.activeElement as HTMLElement | null;
      setTimeout(() => closeButtonRef.current?.focus(), 100);
      return;
    }

    if (lastActiveElementRef.current) {
      lastActiveElementRef.current.focus();
    }
  }, [isOpen]);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Keyboard handling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex='-1'])"
      );

      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close]);

  const handleCheckout = useCallback(() => {
    close();
    router.push("/checkout");
  }, [close, router]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ opacity: shouldAnimate ? backdropOpacity : 1 }}
            className={cn(
              "fixed inset-0 z-[var(--z-modal-backdrop)]",
              "bg-black/80"
            )}
            onClick={close}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            ref={drawerRef}
            initial={isMobile ? { y: "100%" } : { x: "100%" }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: "100%" } : { x: "100%" }}
            transition={getSpring(v7Spring.default)}
            drag={isMobile ? "y" : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDragEnd={handleDragEnd}
            style={isMobile ? { y: dragY } : undefined}
            className={cn(
              "fixed z-[var(--z-modal)] flex flex-col",
              "bg-v6-surface-primary",
              "shadow-v6-elevated",
              isMobile
                ? "inset-x-0 bottom-0 h-[90vh] rounded-t-3xl"
                : "right-0 top-0 h-full w-full max-w-md",
              className
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-drawer-title"
          >
            {/* Mobile drag handle */}
            {isMobile && (
              <motion.div
                className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
                whileHover={shouldAnimate ? { scale: 1.1 } : undefined}
              >
                <div className="w-10 h-1 bg-v6-text-muted/30 rounded-full" />
              </motion.div>
            )}

            {/* Header */}
            <div
              className={cn(
                "flex items-center justify-between",
                "border-b border-v6-border",
                "bg-v6-surface-secondary px-4",
                isMobile ? "py-3" : "py-4"
              )}
            >
              <h2
                id="cart-drawer-title"
                className="flex items-center gap-3 text-lg font-v6-display font-bold text-v6-text-primary"
              >
                <motion.div
                  animate={shouldAnimate ? {
                    rotate: [0, -5, 5, 0],
                  } : undefined}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                  }}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    "bg-v6-primary-light"
                  )}
                >
                  <ShoppingBag className="h-5 w-5 text-v6-primary" />
                </motion.div>
                Your Cart
                {itemCount > 0 && (
                  <motion.span
                    key={itemCount}
                    initial={shouldAnimate ? { scale: 0 } : undefined}
                    animate={shouldAnimate ? { scale: 1 } : undefined}
                    transition={getSpring(v7Spring.ultraBouncy)}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-semibold",
                      "bg-v6-primary text-white shadow-v6-sm"
                    )}
                  >
                    {itemCount}
                  </motion.span>
                )}
              </h2>

              <motion.button
                ref={closeButtonRef}
                onClick={close}
                whileHover={shouldAnimate ? { scale: 1.05, rotate: 90 } : undefined}
                whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
                transition={getSpring(v7Spring.snappy)}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  "bg-v6-surface-tertiary text-v6-text-muted",
                  "hover:bg-v6-surface-secondary hover:text-v6-text-primary",
                  "transition-colors duration-v6-fast",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v6-primary focus-visible:ring-offset-2"
                )}
                aria-label="Close cart"
              >
                <X className="h-5 w-5" />
              </motion.button>
            </div>

            {isEmpty ? (
              <CartEmptyStateV7 onClose={close} />
            ) : (
              <>
                {/* Items List */}
                <motion.div
                  variants={shouldAnimate ? v7StaggerContainer(0.08, 0.1) : undefined}
                  initial="hidden"
                  animate="visible"
                  className="flex-1 overflow-y-auto px-4 py-4"
                >
                  <ul className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {items.map((item) => (
                        <motion.li
                          key={item.cartItemId}
                          variants={shouldAnimate ? v7StaggerItem : undefined}
                          layout
                          exit={shouldAnimate ? {
                            opacity: 0,
                            x: -100,
                            scale: 0.8,
                            transition: { duration: 0.2 }
                          } : undefined}
                        >
                          <CartItemV7 item={item} />
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                </motion.div>

                {/* Footer */}
                <motion.div
                  initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
                  animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
                  transition={{ delay: 0.2 }}
                  className={cn(
                    "border-t border-v6-border",
                    "bg-v6-surface-secondary",
                    "px-4 py-4"
                  )}
                >
                  <CartSummaryV7 />

                  <div className="mt-4 flex flex-col gap-3">
                    <motion.div
                      whileHover={shouldAnimate ? { scale: 1.01 } : undefined}
                      whileTap={shouldAnimate ? { scale: 0.99 } : undefined}
                    >
                      <Button
                        variant="primary"
                        size="lg"
                        className="w-full shadow-v6-elevated"
                        onClick={handleCheckout}
                      >
                        Proceed to Checkout
                      </Button>
                    </motion.div>

                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full"
                      onClick={close}
                    >
                      Continue Shopping
                    </Button>
                  </div>
                </motion.div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default CartDrawerV7;
