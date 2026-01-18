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

/**
 * V4 Cart Drawer
 *
 * Unified styling with cart bar using design tokens:
 * - Background: var(--color-surface)
 * - Border: var(--color-border)
 * - Shadow: var(--shadow-lg)
 * - Spacing: var(--space-*) tokens
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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[var(--z-modal-backdrop)] bg-black/50 backdrop-blur-sm"
            onClick={close}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            ref={drawerRef}
            initial={isMobile ? { y: "100%" } : { x: "100%" }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: "100%" } : { x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            drag={isMobile ? "y" : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            className={cn(
              "fixed z-[var(--z-modal)] flex flex-col",
              "bg-[var(--color-surface)] shadow-[var(--shadow-xl)]",
              isMobile
                ? "inset-x-0 bottom-0 h-[90vh] rounded-t-[var(--radius-2xl)]"
                : "right-0 top-0 h-full w-full max-w-md"
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-drawer-title"
          >
            {/* Mobile drag handle */}
            {isMobile && (
              <div className="flex justify-center py-[var(--space-2)] cursor-grab active:cursor-grabbing">
                <GripHorizontal className="h-5 w-5 text-[var(--color-charcoal-muted)]/50" />
              </div>
            )}

            {/* Header */}
            <div className={cn(
              "flex items-center justify-between",
              "border-b border-[var(--color-border)]",
              "bg-[var(--color-surface-muted)] px-[var(--space-4)]",
              isMobile ? "py-[var(--space-3)]" : "py-[var(--space-4)]"
            )}>
              <h2
                id="cart-drawer-title"
                className="flex items-center gap-[var(--space-3)] text-lg font-bold text-[var(--color-charcoal)]"
              >
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  "bg-[var(--color-primary-bg)]"
                )}>
                  <ShoppingBag className="h-5 w-5 text-[var(--color-primary)]" />
                </div>
                Your Cart
                {itemCount > 0 && (
                  <span className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-semibold text-white",
                    "bg-[var(--color-primary)] shadow-[var(--shadow-sm)]"
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
                  "bg-[var(--color-surface-muted)] text-[var(--color-charcoal-muted)]",
                  "hover:bg-[var(--color-cream-darker)] hover:text-[var(--color-charcoal)]",
                  "transition-colors duration-[var(--duration-fast)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
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
                {/* Items List */}
                <div className="flex-1 overflow-y-auto px-[var(--space-4)] py-[var(--space-4)]">
                  <ul className="space-y-[var(--space-4)]">
                    <AnimatePresence mode="popLayout">
                      {items.map((item) => (
                        <CartItem key={item.cartItemId} item={item} />
                      ))}
                    </AnimatePresence>
                  </ul>
                </div>

                {/* Footer */}
                <div className={cn(
                  "border-t border-[var(--color-border)]",
                  "bg-[var(--color-surface-muted)]",
                  "px-[var(--space-4)] py-[var(--space-4)]"
                )}>
                  <CartSummary />
                  <div className="mt-[var(--space-4)] flex flex-col gap-[var(--space-3)]">
                    <Button
                      size="lg"
                      className={cn(
                        "w-full",
                        "bg-[var(--color-primary)] text-white",
                        "shadow-[var(--shadow-lg)]",
                        "hover:brightness-110 transition-all duration-[var(--duration-fast)]"
                      )}
                      onClick={handleCheckout}
                    >
                      Proceed to Checkout
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className={cn(
                        "w-full",
                        "border-2 border-[var(--color-border)]",
                        "hover:bg-[var(--color-surface-muted)]"
                      )}
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

function CartEmptyState({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-1 flex-col items-center justify-center px-[var(--space-6)] text-center"
    >
      <div className={cn(
        "flex h-24 w-24 items-center justify-center rounded-full",
        "bg-[var(--color-primary-bg)]"
      )}>
        <ShoppingBag className="h-12 w-12 text-[var(--color-primary)]/60" />
      </div>
      <h3 className="mt-[var(--space-6)] text-xl font-bold text-[var(--color-charcoal)]">
        Your cart is empty
      </h3>
      <p className="mt-[var(--space-2)] text-sm text-[var(--color-charcoal-muted)] max-w-[240px]">
        Browse our authentic Burmese dishes and add something delicious!
      </p>
      <Button
        size="lg"
        className={cn(
          "mt-[var(--space-8)]",
          "bg-[var(--color-primary)] text-white",
          "shadow-[var(--shadow-lg)]",
          "hover:brightness-110 transition-all duration-[var(--duration-fast)]"
        )}
        onClick={onClose}
        asChild
      >
        <Link href="/menu">Browse Menu</Link>
      </Button>
    </motion.div>
  );
}
