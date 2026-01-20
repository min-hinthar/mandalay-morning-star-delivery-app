"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { ShoppingBag, X, GripHorizontal } from "lucide-react";
import { useCart } from "@/lib/hooks/useCart";
import { useCartDrawer } from "@/lib/hooks/useCartDrawer";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { Button } from "@/components/ui/button";
import { CartItem } from "./cart-item";
import { CartSummary } from "./CartSummary";
import { cn } from "@/lib/utils/cn";
import { v6Spring } from "@/lib/motion";

/**
 * V6 Cart Drawer / Bottom Sheet - Pepper Aesthetic
 *
 * Mobile-first responsive cart:
 * - Mobile: Bottom sheet with drag handle, swipe-to-dismiss, V6 rounded top corners
 * - Desktop: Right-side drawer with V6 styling
 *
 * V6 Features:
 * - 24px rounded top corners on mobile
 * - V6 primary color accents
 * - Spring-based animations
 */
export function CartDrawer() {
  const router = useRouter();
  const { isOpen, close } = useCartDrawer();
  const { items, isEmpty, itemCount } = useCart();
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);
  const isMobile = useMediaQuery("(max-width: 640px)");

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isMobile && info.offset.y > 100) {
      close();
    }
  };

  useEffect(() => {
    if (isOpen) {
      lastActiveElementRef.current = document.activeElement as HTMLElement | null;
      closeButtonRef.current?.focus();
      return;
    }

    if (lastActiveElementRef.current) {
      lastActiveElementRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

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

  const handleCheckout = () => {
    close();
    router.push("/checkout");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* V6 Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[var(--z-modal-backdrop)] bg-black/50 backdrop-blur-sm"
            onClick={close}
            aria-hidden="true"
          />

          {/* V6 Drawer */}
          <motion.div
            ref={drawerRef}
            initial={isMobile ? { y: "100%" } : { x: "100%" }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: "100%" } : { x: "100%" }}
            transition={v6Spring}
            drag={isMobile ? "y" : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            className={cn(
              "fixed z-[var(--z-modal)] flex flex-col",
              "bg-v6-surface-primary shadow-v6-elevated",
              isMobile
                ? "inset-x-0 bottom-0 h-[90vh] rounded-t-v6-card"
                : "right-0 top-0 h-full w-full max-w-md"
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-drawer-title"
          >
            {/* V6 Mobile drag handle */}
            {isMobile && (
              <div className="flex justify-center py-2 cursor-grab active:cursor-grabbing">
                <GripHorizontal className="h-5 w-5 text-v6-text-muted/50" />
              </div>
            )}

            {/* V6 Header */}
            <div className={cn(
              "flex items-center justify-between",
              "border-b border-v6-border",
              "bg-v6-surface-secondary px-4",
              isMobile ? "py-3" : "py-4"
            )}>
              <h2
                id="cart-drawer-title"
                className="flex items-center gap-3 text-lg font-v6-display font-bold text-v6-text-primary"
              >
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  "bg-v6-primary-light"
                )}>
                  <ShoppingBag className="h-5 w-5 text-v6-primary" />
                </div>
                Your Cart
                {itemCount > 0 && (
                  <span className={cn(
                    "rounded-v6-pill px-2.5 py-1 text-xs font-semibold text-v6-text-inverse",
                    "bg-v6-primary shadow-v6-sm"
                  )}>
                    {itemCount}
                  </span>
                )}
              </h2>
              <motion.button
                ref={closeButtonRef}
                onClick={close}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
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
              <CartEmptyState onClose={close} />
            ) : (
              <>
                {/* V6 Items List */}
                <div className="flex-1 overflow-y-auto px-4 py-4">
                  <ul className="space-y-4">
                    <AnimatePresence mode="popLayout">
                      {items.map((item) => (
                        <CartItem key={item.cartItemId} item={item} />
                      ))}
                    </AnimatePresence>
                  </ul>
                </div>

                {/* V6 Footer */}
                <div className={cn(
                  "border-t border-v6-border",
                  "bg-v6-surface-secondary",
                  "px-4 py-4"
                )}>
                  <CartSummary />
                  <div className="mt-4 flex flex-col gap-3">
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full shadow-v6-elevated"
                      onClick={handleCheckout}
                    >
                      Proceed to Checkout
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full"
                      onClick={close}
                    >
                      Continue Shopping
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * V6 Cart Empty State - Pepper Aesthetic
 */
function CartEmptyState({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={v6Spring}
      className="flex flex-1 flex-col items-center justify-center px-6 text-center"
    >
      <div className={cn(
        "flex h-24 w-24 items-center justify-center rounded-full",
        "bg-v6-primary-light"
      )}>
        <ShoppingBag className="h-12 w-12 text-v6-primary/60" />
      </div>
      <h3 className="mt-6 text-xl font-v6-display font-bold text-v6-text-primary">
        Your cart is empty
      </h3>
      <p className="mt-2 text-sm font-v6-body text-v6-text-secondary max-w-[240px]">
        Browse our authentic Burmese dishes and add something delicious!
      </p>
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
  );
}
