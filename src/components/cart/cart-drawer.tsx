"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, X } from "lucide-react";
import { useCart } from "@/lib/hooks/useCart";
import { useCartDrawer } from "@/lib/hooks/useCartDrawer";
import { Button } from "@/components/ui/button";
import { CartItem } from "./cart-item";
import { CartSummary } from "./CartSummary";
import { cn } from "@/lib/utils/cn";

export function CartDrawer() {
  const router = useRouter();
  const { isOpen, close } = useCartDrawer();
  const { items, isEmpty, itemCount } = useCart();
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);

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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={close}
            aria-hidden="true"
          />

          <motion.div
            ref={drawerRef}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "fixed right-0 top-0 z-50 h-full w-full max-w-md",
              "bg-background shadow-xl",
              "flex flex-col"
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-drawer-title"
          >
            <div className="flex items-center justify-between border-b border-border bg-card/50 px-5 py-4">
              <h2
                id="cart-drawer-title"
                className="flex items-center gap-3 text-lg font-bold text-foreground"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                </div>
                Your Cart
                {itemCount > 0 && (
                  <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
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
                  "bg-muted/20 text-muted-foreground",
                  "hover:bg-muted hover:text-foreground",
                  "transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
                <div className="flex-1 overflow-y-auto px-4 py-4">
                  <ul className="space-y-4">
                    <AnimatePresence mode="popLayout">
                      {items.map((item) => (
                        <CartItem key={item.cartItemId} item={item} />
                      ))}
                    </AnimatePresence>
                  </ul>
                </div>

                <div className="border-t border-border bg-gradient-to-t from-muted/20 to-transparent px-5 py-5">
                  <CartSummary />
                  <div className="mt-5 flex flex-col gap-3">
                    <Button
                      size="lg"
                      className="w-full bg-primary text-white shadow-lg hover:bg-primary/90 hover:shadow-xl transition-all duration-200"
                      onClick={handleCheckout}
                    >
                      Proceed to Checkout
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full border-2 hover:bg-secondary/50"
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
      className="flex flex-1 flex-col items-center justify-center px-6 text-center"
    >
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
        <ShoppingBag className="h-12 w-12 text-primary/60" />
      </div>
      <h3 className="mt-6 text-xl font-bold text-foreground">Your cart is empty</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-[240px]">
        Browse our authentic Burmese dishes and add something delicious!
      </p>
      <Button
        size="lg"
        className="mt-8 bg-primary text-white shadow-lg hover:bg-primary/90 hover:shadow-xl transition-all duration-200"
        onClick={onClose}
        asChild
      >
        <Link href="/menu">Browse Menu</Link>
      </Button>
    </motion.div>
  );
}
