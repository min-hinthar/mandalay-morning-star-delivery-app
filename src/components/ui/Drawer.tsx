"use client";

/**
 * V8 Drawer Component (Unified)
 *
 * Combines side drawer and bottom sheet functionality into one component.
 * Position prop controls the slide direction and behavior.
 *
 * Features:
 * - position="left"|"right": Side drawer with horizontal slide
 * - position="bottom": Bottom sheet with swipe-to-dismiss gesture
 * - Spring animation with proper physics
 * - Focus trap keeping Tab within drawer
 * - Closes on Escape, backdrop click, route change
 * - Proper DOM removal when closed
 *
 * @example
 * // Side drawer
 * <Drawer isOpen={isOpen} onClose={onClose} position="right">
 *   <DrawerContent />
 * </Drawer>
 *
 * // Bottom sheet
 * <Drawer isOpen={isOpen} onClose={onClose} position="bottom">
 *   <SheetContent />
 * </Drawer>
 */

import { useEffect, useRef, useMemo, type ReactNode } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Portal } from "./Portal";
import { useRouteChangeClose, useBodyScrollLock } from "@/lib/hooks";
import { useSwipeToClose, triggerHaptic } from "@/lib/swipe-gestures";
import { overlayMotion } from "@/lib/design-system/tokens/motion";
import { cn } from "@/lib/utils/cn";

// ============================================
// TYPES
// ============================================

export interface DrawerProps {
  /** Whether drawer is open */
  isOpen: boolean;
  /** Callback to close drawer */
  onClose: () => void;
  /** Drawer content */
  children: ReactNode;
  /** Position: side drawer or bottom sheet */
  position?: "left" | "right" | "bottom";
  /** Width for side drawers (ignored for bottom) */
  width?: "sm" | "md" | "lg";
  /** Height mode for bottom sheet: "auto" or "full" (90vh) */
  height?: "auto" | "full";
  /** Whether to show drag handle for bottom sheet (default: true) */
  showDragHandle?: boolean;
  /** Accessible label for drawer */
  title?: string;
  /** Additional CSS classes */
  className?: string;
}

// ============================================
// CONSTANTS
// ============================================

const widthClasses = {
  sm: "w-64",
  md: "w-80",
  lg: "w-96",
} as const;

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

// ============================================
// ANIMATION VARIANTS
// ============================================

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const bottomVariants = {
  hidden: { y: "100%", opacity: 0.8 },
  visible: { y: 0, opacity: 1 },
  exit: { y: "100%", opacity: 0.8 },
};

const reducedMotionVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

// ============================================
// DRAWER COMPONENT
// ============================================

export function Drawer({
  isOpen,
  onClose,
  children,
  position = "right",
  width = "md",
  height = "auto",
  showDragHandle = true,
  title,
  className,
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const isBottom = position === "bottom";

  // Route change closes drawer
  useRouteChangeClose(isOpen, onClose);

  // Lock body scroll when open (deferred restore for animation safety)
  const { restoreScrollPosition } = useBodyScrollLock(isOpen, { deferRestore: true });

  // Swipe to close for bottom sheet
  const {
    motionProps: swipeProps,
    isDragging,
    backdropOpacity,
  } = useSwipeToClose({
    onClose: () => {
      triggerHaptic("light");
      onClose();
    },
    direction: "down",
    threshold: 150,
    disabled: !isBottom || prefersReducedMotion === true,
  });

  // Store last active element and focus first focusable on open
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    if (isOpen) {
      // Store currently focused element
      lastActiveElementRef.current = document.activeElement as HTMLElement;

      // Focus first focusable element after animation starts
      timeoutId = setTimeout(() => {
        timeoutId = null;
        if (drawerRef.current) {
          const focusables =
            drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
          if (focusables.length > 0) {
            focusables[0].focus();
          } else {
            // If no focusables, focus the drawer itself
            drawerRef.current.focus();
          }
        }
      }, 50);
    } else {
      // Restore focus on close
      if (lastActiveElementRef.current) {
        lastActiveElementRef.current.focus();
        lastActiveElementRef.current = null;
      }
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap handler
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "Tab" || !drawerRef.current) return;

    const focusables =
      drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    if (focusables.length === 0) return;

    const firstFocusable = focusables[0];
    const lastFocusable = focusables[focusables.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
      }
    }
  };

  // Calculate slide direction based on position
  const slideFrom = position === "left" ? "-100%" : position === "right" ? "100%" : "100%";

  // Calculate backdrop opacity for bottom sheet swipe
  const computedBackdropOpacity = isBottom && isDragging ? backdropOpacity : 1;

  // Use appropriate variants
  const variants = prefersReducedMotion ? reducedMotionVariants : bottomVariants;

  // Memoize style object to prevent unnecessary re-renders
  const bottomSheetStyle = useMemo(() => {
    if (!isBottom) return undefined;
    return {
      ...(swipeProps?.style || {}),
      height: height === "full" ? "80vh" : "auto",
    };
  }, [isBottom, swipeProps?.style, height]);

  return (
    <Portal>
      <AnimatePresence onExitComplete={restoreScrollPosition}>
        {/* Backdrop */}
        {isOpen && (
          <motion.div
            key="drawer-backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={overlayMotion.backdrop}
            style={{ opacity: computedBackdropOpacity }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-overlay-heavy sm:backdrop-blur-sm"
            aria-hidden="true"
            data-testid="drawer-backdrop"
          />
        )}

        {/* Drawer Content */}
        {isOpen && (
          <motion.div
            key="drawer-content"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            className={cn(
              "fixed z-50",
              // Glassmorphism matching CartBar
              "bg-surface-primary/80 dark:bg-gray-900/75 backdrop-blur-3xl border border-white/20 dark:border-white/10",
              "shadow-xl",
              "outline-none",
              // Side drawer styles
              !isBottom && [
                "inset-y-0",
                position === "left" ? "left-0" : "right-0",
                widthClasses[width],
                "flex flex-col",
              ],
              // Bottom sheet styles
              isBottom && [
                "inset-x-0 bottom-0",
                "rounded-t-3xl",
              ],
              className
            )}
            {...(isBottom && !prefersReducedMotion ? swipeProps : {})}
            style={bottomSheetStyle}
            initial={isBottom ? "hidden" : { x: slideFrom }}
            animate={isBottom ? "visible" : { x: 0 }}
            exit={isBottom ? "exit" : { x: slideFrom }}
            variants={isBottom ? variants : undefined}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : isBottom
                  ? overlayMotion.sheetOpen
                  : overlayMotion.drawerOpen
            }
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            data-testid="drawer"
          >
            {/* Drag Handle for bottom sheet */}
            {isBottom && showDragHandle && (
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
                    "bg-border-default dark:bg-border-default",
                    "transition-all duration-150",
                    isDragging && [
                      "bg-border-strong dark:bg-border-strong",
                      "scale-x-110",
                    ]
                  )}
                />
              </div>
            )}

            {/* Content wrapper for bottom sheet scroll behavior */}
            {isBottom ? (
              <div
                className={cn(
                  "overflow-y-auto overscroll-contain",
                  "max-h-[calc(80vh-3rem)]",
                  "pb-safe"
                )}
                style={{ touchAction: "pan-y" }}
              >
                {children}
              </div>
            ) : (
              children
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}

// ============================================
// BACKWARDS COMPATIBILITY ALIAS
// ============================================

/**
 * BottomSheet alias for backwards compatibility.
 * Use Drawer with position="bottom" instead.
 *
 * @deprecated Use Drawer with position="bottom" instead
 */
export function BottomSheet(props: Omit<DrawerProps, "position">) {
  return <Drawer {...props} position="bottom" />;
}

// Re-export DrawerProps as BottomSheetProps for backwards compatibility
export type BottomSheetProps = Omit<DrawerProps, "position">;
