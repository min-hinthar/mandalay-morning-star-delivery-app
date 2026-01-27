"use client";

/**
 * Clear Cart Confirmation Modal
 *
 * Confirmation dialog for clearing the cart to prevent accidental data loss.
 *
 * Features:
 * - Warning icon and clear messaging
 * - Cancel and destructive confirm actions
 * - Animated entrance/exit via Modal
 * - useClearCartConfirmation hook for integration
 * - Accessible with proper focus management
 */

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui";
import { useCart } from "@/lib/hooks/useCart";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { cn } from "@/lib/utils/cn";
import { spring, triggerHaptic } from "@/lib/motion-tokens";

// ============================================
// TYPES
// ============================================

export interface ClearCartConfirmationProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Callback when user confirms clearing */
  onConfirm: () => void;
  /** Number of items in cart (for message) */
  itemCount?: number;
}

// ============================================
// ANIMATION VARIANTS
// ============================================

const iconVariants = {
  initial: { scale: 0, rotate: -45 },
  animate: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 15,
      delay: 0.1,
    },
  },
};

const contentVariants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 },
  },
};

// ============================================
// MAIN COMPONENT
// ============================================

export function ClearCartConfirmation({
  isOpen,
  onClose,
  onConfirm,
  itemCount = 0,
}: ClearCartConfirmationProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  const handleConfirm = useCallback(() => {
    triggerHaptic("heavy");
    onConfirm();
    onClose();
  }, [onConfirm, onClose]);

  const handleCancel = useCallback(() => {
    triggerHaptic("light");
    onClose();
  }, [onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Clear cart confirmation"
      size="sm"
      showCloseButton={false}
    >
      <div className="flex flex-col items-center text-center pb-2">
        {/* Warning Icon */}
        <motion.div
          variants={shouldAnimate ? iconVariants : undefined}
          initial={shouldAnimate ? "initial" : false}
          animate={shouldAnimate ? "animate" : undefined}
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-full",
            "bg-red-100 dark:bg-red-900/30",
            "mb-4"
          )}
        >
          <AlertTriangle className="h-8 w-8 text-red-500 dark:text-red-400" />
        </motion.div>

        {/* Title */}
        <motion.h3
          variants={shouldAnimate ? contentVariants : undefined}
          initial={shouldAnimate ? "initial" : false}
          animate={shouldAnimate ? "animate" : undefined}
          className="text-xl font-display font-bold text-text-primary mb-2"
        >
          Clear your cart?
        </motion.h3>

        {/* Message */}
        <motion.p
          variants={shouldAnimate ? contentVariants : undefined}
          initial={shouldAnimate ? "initial" : false}
          animate={shouldAnimate ? "animate" : undefined}
          className="text-sm font-body text-text-secondary max-w-[260px] mb-6"
        >
          {itemCount > 0
            ? `This will remove ${itemCount === 1 ? "1 item" : `all ${itemCount} items`} from your cart. This action cannot be undone.`
            : "This will remove all items from your cart. This action cannot be undone."}
        </motion.p>

        {/* Actions */}
        <div className="flex w-full gap-3">
          {/* Cancel Button */}
          <motion.button
            type="button"
            onClick={handleCancel}
            whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
            whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
            transition={getSpring(spring.snappy)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2",
              "h-12 px-4 rounded-xl",
              "bg-zinc-100 dark:bg-zinc-800",
              "text-text-primary font-semibold",
              "transition-colors duration-150",
              "hover:bg-zinc-200 dark:hover:bg-zinc-700",
              "focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
            )}
          >
            Cancel
          </motion.button>

          {/* Confirm Button */}
          <motion.button
            type="button"
            onClick={handleConfirm}
            whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
            whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
            transition={getSpring(spring.snappy)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2",
              "h-12 px-4 rounded-xl",
              "bg-red-500 text-white font-semibold",
              "transition-colors duration-150",
              "hover:bg-red-600",
              "focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-red-500 focus-visible:ring-offset-2"
            )}
          >
            <Trash2 className="h-4 w-4" />
            Clear Cart
          </motion.button>
        </div>
      </div>
    </Modal>
  );
}

// ============================================
// HOOK FOR INTEGRATION
// ============================================

/**
 * Hook for managing clear cart confirmation flow
 *
 * @example
 * const { isOpen, openConfirmation, handleConfirm, close } = useClearCartConfirmation();
 *
 * // In component:
 * <button onClick={openConfirmation}>Clear Cart</button>
 * <ClearCartConfirmation
 *   isOpen={isOpen}
 *   onClose={close}
 *   onConfirm={handleConfirm}
 *   itemCount={itemCount}
 * />
 */
export function useClearCartConfirmation() {
  const [isOpen, setIsOpen] = useState(false);
  const { clearCart, itemCount } = useCart();

  const openConfirmation = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleConfirm = useCallback(() => {
    clearCart();
    setIsOpen(false);
  }, [clearCart]);

  return {
    isOpen,
    itemCount,
    openConfirmation,
    handleConfirm,
    close,
  };
}

export default ClearCartConfirmation;
