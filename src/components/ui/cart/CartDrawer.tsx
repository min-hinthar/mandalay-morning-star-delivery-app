"use client";

/**
 * CartDrawer Component
 * Responsive cart drawer using overlay primitives
 *
 * Features:
 * - BottomSheet on mobile (< 640px) with swipe-to-dismiss
 * - Drawer on desktop (>= 640px) sliding from right
 * - Animated cart items list with AnimatePresence
 * - CartSummary with animated free delivery progress
 * - CartEmptyState for zero-item cart
 * - Focus trap, escape to close, route change close
 */

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring, staggerContainer, staggerItem } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useCart } from "@/lib/hooks/useCart";
import { useCartDrawer } from "@/lib/hooks/useCartDrawer";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { Drawer } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { CartItem } from "./CartItem";
import { CartSummary } from "./CartSummary";
import { CartEmptyState } from "./CartEmptyState";
import { ClearCartConfirmation, useClearCartConfirmation } from "./ClearCartConfirmation";

// ============================================
// TYPES
// ============================================

export interface CartDrawerProps {
  /** Additional className */
  className?: string;
}

// ============================================
// CART HEADER
// ============================================

interface CartHeaderProps {
  itemCount: number;
  onClose: () => void;
  onClearClick: () => void;
  showClear: boolean;
}

function CartHeader({ itemCount, onClose, onClearClick, showClear }: CartHeaderProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <div
      className={cn(
        "flex items-center justify-between",
        "border-b border-border",
        "bg-surface-secondary px-4 py-4"
      )}
    >
      <h2
        id="cart-drawer-title"
        className="flex items-center gap-3 text-lg font-display font-bold text-text-primary"
      >
        {/* Animated bag icon */}
        <motion.div
          animate={
            shouldAnimate
              ? {
                  rotate: [0, -5, 5, 0],
                }
              : undefined
          }
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
          }}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full",
            "bg-amber-100 dark:bg-amber-900/30"
          )}
        >
          <ShoppingBag className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </motion.div>
        Your Cart
        {/* Item count badge - rubbery bounce on change */}
        {itemCount > 0 && (
          <motion.span
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
          </motion.span>
        )}
      </h2>

      <div className="flex items-center gap-2">
        {/* Clear cart button */}
        {showClear && (
          <motion.button
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
          </motion.button>
        )}

        {/* Close button */}
        <motion.button
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
        </motion.button>
      </div>
    </div>
  );
}

// ============================================
// CART ITEMS LIST
// ============================================

interface CartItemsListProps {
  onClose: () => void;
}

function CartItemsList({ onClose }: CartItemsListProps) {
  const { shouldAnimate } = useAnimationPreference();
  const { items, isEmpty } = useCart();

  if (isEmpty) {
    return <CartEmptyState onClose={onClose} />;
  }

  return (
    <motion.div
      variants={shouldAnimate ? staggerContainer(0.08, 0.1) : undefined}
      initial={shouldAnimate ? "hidden" : undefined}
      animate={shouldAnimate ? "visible" : undefined}
      className="flex-1 overflow-y-auto px-4 py-4"
    >
      <ul className="space-y-3">
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <motion.li
              key={item.cartItemId}
              variants={shouldAnimate ? staggerItem : undefined}
              layout={shouldAnimate}
              exit={
                shouldAnimate
                  ? {
                      opacity: 0,
                      x: -100,
                      scale: 0.8,
                      rotate: -3,
                      transition: { duration: 0.2 },
                    }
                  : undefined
              }
            >
              <CartItem item={item} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </motion.div>
  );
}

// ============================================
// CART FOOTER
// ============================================

interface CartFooterProps {
  onClose: () => void;
  onCheckout: () => void;
}

function CartFooter({ onClose, onCheckout }: CartFooterProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={{ delay: 0.2 }}
      className={cn("border-t border-border", "bg-surface-secondary", "px-4 py-4")}
    >
      <CartSummary />

      <div className="mt-4 flex flex-col gap-3">
        {/* Primary CTA - Checkout with pulsing glow */}
        <motion.div
          whileHover={shouldAnimate ? { scale: 1.01 } : undefined}
          whileTap={shouldAnimate ? { scale: 0.99 } : undefined}
          transition={getSpring(spring.snappyButton)}
          className="relative"
        >
          {/* Pulsing glow behind button */}
          {shouldAnimate && (
            <motion.div
              className="absolute inset-0 rounded-xl bg-primary/30 blur-lg"
              animate={{
                opacity: [0.4, 0.7, 0.4],
                scale: [1, 1.02, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
          <Button
            variant="primary"
            size="lg"
            className="relative w-full shadow-elevated"
            onClick={onCheckout}
          >
            Proceed to Checkout
          </Button>
        </motion.div>

        {/* Secondary CTA - Continue Shopping */}
        <Button variant="outline" size="lg" className="w-full" onClick={onClose}>
          Continue Shopping
        </Button>
      </div>
    </motion.div>
  );
}

// ============================================
// CART CONTENT (shared between mobile/desktop)
// ============================================

interface CartContentProps {
  onClose: () => void;
}

function CartContent({ onClose }: CartContentProps) {
  const router = useRouter();
  const { isEmpty, itemCount } = useCart();
  const {
    isOpen: isClearOpen,
    openConfirmation,
    handleConfirm: handleClearConfirm,
    close: closeClear,
  } = useClearCartConfirmation();

  const handleCheckout = useCallback(() => {
    onClose();
    router.push("/checkout");
  }, [onClose, router]);

  return (
    <div className="flex flex-col h-full">
      <CartHeader
        itemCount={itemCount}
        onClose={onClose}
        onClearClick={openConfirmation}
        showClear={!isEmpty}
      />

      {isEmpty ? (
        <CartEmptyState onClose={onClose} />
      ) : (
        <>
          <CartItemsList onClose={onClose} />
          <CartFooter onClose={onClose} onCheckout={handleCheckout} />
        </>
      )}

      {/* Clear cart confirmation modal */}
      <ClearCartConfirmation
        isOpen={isClearOpen}
        onClose={closeClear}
        onConfirm={handleClearConfirm}
        itemCount={itemCount}
      />
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CartDrawer({ className }: CartDrawerProps) {
  const isMobile = useMediaQuery("(max-width: 640px)");
  const { isOpen, close } = useCartDrawer();

  // Render mobile bottom sheet
  if (isMobile) {
    return (
      <Drawer
        isOpen={isOpen}
        onClose={close}
        position="bottom"
        height="full"
        showDragHandle={true}
        className={cn("flex flex-col", className)}
      >
        <CartContent onClose={close} />
      </Drawer>
    );
  }

  // Render desktop Drawer
  return (
    <Drawer
      isOpen={isOpen}
      onClose={close}
      position="right"
      width="lg"
      title="Your Cart"
      className={cn("flex flex-col", className)}
    >
      <CartContent onClose={close} />
    </Drawer>
  );
}

export default CartDrawer;
