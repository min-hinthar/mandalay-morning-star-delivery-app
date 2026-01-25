"use client";

/**
 * V8 BottomSheet Component
 * Mobile-optimized sheet with swipe-to-dismiss gesture
 *
 * Features:
 * - Slides up from bottom with spring physics
 * - Swipe down to dismiss with haptic feedback
 * - Drag handle indicator shows drag state
 * - Route-aware close (closes on navigation)
 * - AnimatePresence removes from DOM when closed
 */

import type { ReactNode } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Portal } from "./overlay";
import { useRouteChangeClose, useBodyScrollLock } from "@/lib/hooks";
import { useSwipeToClose, triggerHaptic } from "@/lib/swipe-gestures";
import { zIndex } from "@/design-system/tokens/z-index";
import { overlayMotion } from "@/design-system/tokens/motion";
import { cn } from "@/lib/utils/cn";

// ============================================
// TYPES
// ============================================

export interface BottomSheetProps {
  /** Whether the sheet is open */
  isOpen: boolean;
  /** Callback when sheet should close */
  onClose: () => void;
  /** Sheet content */
  children: ReactNode;
  /** Height mode: "auto" for content-based, "full" for 90vh (default: "auto") */
  height?: "auto" | "full";
  /** Whether to show drag handle indicator (default: true) */
  showDragHandle?: boolean;
  /** Additional class names */
  className?: string;
}

// ============================================
// ANIMATION VARIANTS
// ============================================

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const sheetVariants = {
  hidden: {
    y: "100%",
    opacity: 0.8,
  },
  visible: {
    y: 0,
    opacity: 1,
  },
  exit: {
    y: "100%",
    opacity: 0.8,
  },
};

const reducedMotionVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

// ============================================
// BOTTOMSHEET COMPONENT
// ============================================

export function BottomSheet({
  isOpen,
  onClose,
  children,
  height = "auto",
  showDragHandle = true,
  className,
}: BottomSheetProps) {
  const prefersReducedMotion = useReducedMotion();

  // Route-aware close
  useRouteChangeClose(isOpen, onClose);

  // Body scroll lock
  useBodyScrollLock(isOpen);

  // Swipe to close with higher threshold for sheets
  const {
    motionProps: swipeProps,
    isDragging,
    dragOffset,
    backdropOpacity,
  } = useSwipeToClose({
    onClose: () => {
      triggerHaptic("light");
      onClose();
    },
    direction: "down",
    threshold: 150, // Higher threshold for sheets
    disabled: prefersReducedMotion === true,
  });

  // ============================================
  // RENDER
  // ============================================

  const variants = prefersReducedMotion ? reducedMotionVariants : sheetVariants;

  // Calculate backdrop opacity based on swipe
  const computedBackdropOpacity = isDragging ? backdropOpacity : 1;

  return (
    <Portal>
      <AnimatePresence>
        {/* Backdrop - rendered separately to avoid Fragment inside AnimatePresence */}
        {isOpen && (
          <motion.div
            key="sheet-backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={overlayMotion.backdrop}
            style={{
              zIndex: zIndex.modalBackdrop,
              opacity: computedBackdropOpacity,
            }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            aria-hidden="true"
            data-testid="bottom-sheet-backdrop"
          />
        )}

        {/* Sheet - rendered separately to avoid Fragment inside AnimatePresence */}
        {isOpen && (
          <motion.div
            key="sheet-content"
            role="dialog"
            aria-modal="true"
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={
              prefersReducedMotion ? { duration: 0 } : overlayMotion.sheetOpen
            }
            onClick={(e) => e.stopPropagation()}
            {...(!prefersReducedMotion ? swipeProps : {})}
            style={{
              zIndex: zIndex.modal,
              y: isDragging ? dragOffset : 0,
              height: height === "full" ? "90vh" : "auto",
            }}
            className={cn(
              "fixed inset-x-0 bottom-0",
              "bg-white dark:bg-zinc-900",
              "rounded-t-3xl shadow-xl",
              "focus:outline-none",
              className
            )}
            data-testid="bottom-sheet-content"
          >
            {/* Drag Handle */}
            {showDragHandle && (
              <div
                className={cn(
                  "flex justify-center pt-3 pb-2",
                  "cursor-grab active:cursor-grabbing",
                  "select-none touch-none"
                )}
              >
                <div
                  className={cn(
                    "w-12 h-1.5 rounded-full",
                    "bg-zinc-300 dark:bg-zinc-600",
                    "transition-all duration-150",
                    isDragging && [
                      "bg-zinc-400 dark:bg-zinc-500",
                      "scale-x-110",
                    ]
                  )}
                />
              </div>
            )}

            {/* Content */}
            <div
              className={cn(
                "overflow-y-auto overscroll-contain",
                "max-h-[calc(90vh-3rem)]",
                "pb-safe"
              )}
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
