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
            <div className="flex items-center justify-between border-b border-border px-4 py-4">
              <h2
                id="cart-drawer-title"
                className="flex items-center gap-2 text-lg font-semibold"
              >
                <ShoppingBag className="h-5 w-5" />
                Your Cart
                {itemCount > 0 && (
                  <span className="rounded-full bg-brand-red px-2 py-0.5 text-xs text-white">
                    {itemCount}
                  </span>
                )}
              </h2>
              <button
                ref={closeButtonRef}
                onClick={close}
                className={cn(
                  "rounded-full p-2 hover:bg-muted/10",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2"
                )}
                aria-label="Close cart"
              >
                <X className="h-5 w-5" />
              </button>
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

                <div className="border-t border-border bg-muted/10 px-4 py-4">
                  <CartSummary />
                  <div className="mt-4 flex flex-col gap-2">
                    <Button
                      size="lg"
                      className="w-full bg-brand-red text-white hover:bg-brand-red-dark"
                      onClick={handleCheckout}
                    >
                      Checkout
                    </Button>
                    <Button
                      variant="ghost"
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

function CartEmptyState({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
      <ShoppingBag className="h-16 w-16 text-muted-foreground/50" />
      <h3 className="mt-4 text-lg font-medium">Your cart is empty</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Browse our Burmese dishes and add something delicious!
      </p>
      <Button
        className="mt-6 bg-brand-red text-white hover:bg-brand-red-dark"
        onClick={onClose}
        asChild
      >
        <Link href="/menu">Browse Menu</Link>
      </Button>
    </div>
  );
}
