"use client";

/**
 * V8 Modal Component
 * Accessible modal dialog with responsive behavior
 *
 * Desktop: Centered scale+fade dialog
 * Mobile: Bottom sheet with swipe-to-dismiss
 *
 * Features:
 * - Closes on Escape, backdrop click, close button, and route change
 * - AnimatePresence removes from DOM when closed (no click blocking)
 * - Spring animation on open, ease-out on close
 * - Focus trap with automatic focus management
 * - Body scroll lock preserves scroll position
 */

import {
  useEffect,
  useRef,
  useCallback,
  useId,
  type ReactNode,
  type KeyboardEvent,
} from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { Portal } from "./overlay";
import { useRouteChangeClose, useBodyScrollLock, useMediaQuery } from "@/lib/hooks";
import { useSwipeToClose, triggerHaptic } from "@/lib/swipe-gestures";
import { zIndex } from "@/design-system/tokens/z-index";
import { overlayMotion } from "@/design-system/tokens/motion";
import { cn } from "@/lib/utils/cn";

// ============================================
// TYPES
// ============================================

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal title for accessibility (aria-label) */
  title: string;
  /** Modal content */
  children: ReactNode;
  /** Whether to show close button (default: true) */
  showCloseButton?: boolean;
  /** Whether clicking backdrop closes modal (default: true) */
  closeOnBackdropClick?: boolean;
  /** Whether pressing Escape closes modal (default: true) */
  closeOnEscape?: boolean;
  /** Size variant (default: "md") */
  size?: "sm" | "md" | "lg" | "xl";
  /** Additional class names for modal content */
  className?: string;
}

// ============================================
// SIZE CONFIGURATION
// ============================================

const sizeConfig = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
} as const;

// ============================================
// ANIMATION VARIANTS
// ============================================

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const desktopVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 8,
  },
};

const mobileVariants = {
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
// MODAL COMPONENT
// ============================================

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  size = "md",
  className,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const titleId = useId();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const prefersReducedMotion = useReducedMotion();

  // Route-aware close
  useRouteChangeClose(isOpen, onClose);

  // Body scroll lock
  useBodyScrollLock(isOpen);

  // Swipe to close for mobile
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
    threshold: 100,
    disabled: !isMobile || prefersReducedMotion === true,
  });

  // ============================================
  // FOCUS MANAGEMENT
  // ============================================

  useEffect(() => {
    if (isOpen) {
      // Store last active element
      lastActiveElementRef.current = document.activeElement as HTMLElement | null;

      // Focus close button or first focusable element
      const timer = setTimeout(() => {
        if (closeButtonRef.current && showCloseButton) {
          closeButtonRef.current.focus();
        } else {
          const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          firstFocusable?.focus();
        }
      }, 50);

      return () => clearTimeout(timer);
    } else if (lastActiveElementRef.current) {
      // Restore focus on close
      lastActiveElementRef.current.focus();
      lastActiveElementRef.current = null;
    }
  }, [isOpen, showCloseButton]);

  // ============================================
  // KEYBOARD HANDLING
  // ============================================

  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, closeOnEscape, onClose]);

  // Focus trap
  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;

    const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (!focusableElements || focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement as HTMLElement;

    if (event.shiftKey && activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }, []);

  // ============================================
  // RENDER
  // ============================================

  const variants = prefersReducedMotion
    ? reducedMotionVariants
    : isMobile
      ? mobileVariants
      : desktopVariants;

  // Calculate backdrop opacity based on swipe
  const computedBackdropOpacity = isDragging ? backdropOpacity : 1;

  return (
    <Portal>
      <AnimatePresence mode="wait">
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="modal-backdrop"
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={overlayMotion.backdrop}
              style={{
                zIndex: zIndex.modalBackdrop,
                opacity: computedBackdropOpacity,
              }}
              onClick={closeOnBackdropClick ? onClose : undefined}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              aria-hidden="true"
              data-testid="modal-backdrop"
            />

            {/* Modal Container */}
            <div
              className={cn(
                "fixed inset-0 flex overflow-hidden",
                isMobile ? "items-end" : "items-center justify-center p-4"
              )}
              style={{ zIndex: zIndex.modal }}
              onClick={closeOnBackdropClick ? onClose : undefined}
            >
              {/* Modal Content */}
              <motion.div
                ref={modalRef}
                key="modal-content"
                role="dialog"
                aria-modal="true"
                aria-label={title}
                variants={variants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : variants === mobileVariants || variants === desktopVariants
                      ? overlayMotion.modalOpen
                      : undefined
                }
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                {...(isMobile && !prefersReducedMotion ? swipeProps : {})}
                style={{
                  y: isDragging ? dragOffset : 0,
                }}
                className={cn(
                  // Base styles
                  "relative w-full",
                  "bg-white dark:bg-zinc-900",
                  "shadow-xl",
                  "focus:outline-none",
                  // Mobile styles
                  isMobile && [
                    "rounded-t-2xl",
                    "max-h-[90vh]",
                    "pb-safe",
                  ],
                  // Desktop styles
                  !isMobile && [
                    "rounded-lg",
                    sizeConfig[size],
                    "max-h-[85vh]",
                  ],
                  className
                )}
                data-testid="modal-content"
              >
                {/* Mobile Drag Handle */}
                {isMobile && (
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
                        "transition-colors duration-150",
                        isDragging && "bg-zinc-400 dark:bg-zinc-500"
                      )}
                    />
                  </div>
                )}

                {/* Close Button */}
                {showCloseButton && (
                  <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={onClose}
                    className={cn(
                      "absolute z-10",
                      isMobile ? "top-4 right-4" : "top-3 right-3",
                      "flex h-10 w-10 items-center justify-center rounded-full",
                      "bg-zinc-100 dark:bg-zinc-800",
                      "text-zinc-600 dark:text-zinc-400",
                      "hover:bg-zinc-200 dark:hover:bg-zinc-700",
                      "hover:text-zinc-900 dark:hover:text-zinc-100",
                      "transition-colors duration-150",
                      "focus-visible:outline-none focus-visible:ring-2",
                      "focus-visible:ring-amber-500 focus-visible:ring-offset-2"
                    )}
                    aria-label="Close modal"
                    data-testid="modal-close-button"
                  >
                    <X className="h-5 w-5" strokeWidth={2.5} />
                  </button>
                )}

                {/* Hidden Title for Accessibility */}
                <h2 id={titleId} className="sr-only">
                  {title}
                </h2>

                {/* Content */}
                <div
                  className={cn(
                    "overflow-y-auto overscroll-contain p-5",
                    showCloseButton && "pt-14",
                    isMobile && showCloseButton && "pt-4",
                    isMobile
                      ? "max-h-[calc(90vh-3rem)]"
                      : "max-h-[calc(85vh-2rem)]"
                  )}
                >
                  {children}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </Portal>
  );
}
