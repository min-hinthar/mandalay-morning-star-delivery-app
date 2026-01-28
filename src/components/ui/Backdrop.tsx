"use client";

/**
 * Backdrop Component
 * Animated overlay backdrop with proper DOM removal when closed
 *
 * CRITICAL: Uses AnimatePresence to fully remove from DOM when not visible.
 * This prevents click-blocking issues where invisible overlays capture events.
 *
 * @example
 * <Backdrop isVisible={isOpen} onClick={onClose} />
 */

import { motion, AnimatePresence } from "framer-motion";
import { zIndex } from "@/lib/design-system/tokens/z-index";
import { overlayMotion } from "@/lib/design-system/tokens/motion";
import { cn } from "@/lib/utils/cn";

export interface BackdropProps {
  /** Whether backdrop is visible (controls DOM presence) */
  isVisible: boolean;
  /** Click handler for dismissing overlay */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Custom z-index (default: zIndex.modalBackdrop) */
  zIndexValue?: number;
}

export function Backdrop({
  isVisible,
  onClick,
  className,
  zIndexValue,
}: BackdropProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="backdrop"
          className={cn(
            "fixed inset-0",
            "bg-black/50 backdrop-blur-sm",
            className
          )}
          style={{ zIndex: zIndexValue ?? zIndex.modalBackdrop }}
          onClick={onClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={overlayMotion.backdrop}
          aria-hidden="true"
          data-testid="overlay-backdrop"
        />
      )}
    </AnimatePresence>
  );
}
