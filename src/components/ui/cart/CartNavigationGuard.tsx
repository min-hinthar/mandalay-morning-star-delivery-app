"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface CartNavigationGuardProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** User wants to stay / go to checkout (variant-dependent) */
  onStay: () => void;
  /** User confirmed they want to leave */
  onLeave: () => void;
  /** Determines copy: "checkout" = continue checkout, "cart" = nudge to checkout */
  variant: "checkout" | "cart";
}

const COPY = {
  checkout: {
    title: "Almost there!",
    body: "Your delicious items are waiting! Ready to complete your order?",
    stay: "Continue Checkout",
    leave: "Leave Anyway",
  },
  cart: {
    title: "Don't forget your goodies!",
    body: "You have items in your cart. Ready to check them out?",
    stay: "Go to Checkout",
    leave: "Leave Anyway",
  },
} as const;

/**
 * Playful navigation guard modal for cart/checkout pages.
 * Warm tone matching app personality with variant-specific copy.
 */
export function CartNavigationGuard({
  isOpen,
  onStay,
  onLeave,
  variant,
}: CartNavigationGuardProps) {
  const copy = COPY[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-surface-inverse/50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onStay}
          role="dialog"
          aria-modal="true"
          aria-label={copy.title}
        >
          <motion.div
            className="w-full max-w-sm rounded-2xl bg-surface-primary p-6 text-center shadow-xl"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex justify-center">
              <ShoppingBag className="h-12 w-12 text-amber-500" />
            </div>

            <h2 className="mb-2 font-display text-xl font-bold text-foreground">
              {copy.title}
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              {copy.body}
            </p>

            <div className="flex flex-col gap-3">
              <Button
                variant="primary"
                className="w-full"
                onClick={onStay}
              >
                {copy.stay}
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={onLeave}
              >
                {copy.leave}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
