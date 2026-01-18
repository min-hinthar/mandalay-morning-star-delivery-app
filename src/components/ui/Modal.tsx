/**
 * V3 Sprint 5: Modal Component
 *
 * Accessible modal with responsive animations:
 * - Desktop: Scale + fade
 * - Mobile: Slide up from bottom with swipe-to-close
 *
 * Features: Focus trap, escape close, backdrop click, body scroll lock
 */

"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, PanInfo, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { cn } from "@/lib/utils/cn";

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal title for accessibility */
  title: string;
  /** Modal content */
  children: ReactNode;
  /** Whether to show close button */
  showCloseButton?: boolean;
  /** Whether clicking backdrop closes modal */
  closeOnBackdropClick?: boolean;
  /** Whether pressing Escape closes modal */
  closeOnEscape?: boolean;
  /** Whether swipe down closes modal (mobile only) */
  closeOnSwipeDown?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /** Additional class names for modal content */
  className?: string;
  /** Additional class names for backdrop */
  backdropClassName?: string;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-full mx-4",
};

const SWIPE_CLOSE_THRESHOLD = 100;
const SWIPE_VELOCITY_THRESHOLD = 500;

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  closeOnSwipeDown = true,
  size = "md",
  className,
  backdropClassName,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isMobile = useMediaQuery("(max-width: 640px)");
  const prefersReducedMotion = useReducedMotion();

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Calculate scrollbar width to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);

  // Store last active element and focus management
  useEffect(() => {
    if (isOpen) {
      lastActiveElementRef.current = document.activeElement as HTMLElement | null;
      // Focus close button or first focusable element
      setTimeout(() => {
        if (closeButtonRef.current) {
          closeButtonRef.current.focus();
        } else {
          const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          firstFocusable?.focus();
        }
      }, 0);
    } else if (lastActiveElementRef.current) {
      // Restore focus on close
      lastActiveElementRef.current.focus();
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  // Focus trap
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
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
    },
    []
  );

  // Handle swipe to close (mobile)
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (!closeOnSwipeDown || !isMobile) return;

      const shouldClose =
        info.offset.y > SWIPE_CLOSE_THRESHOLD ||
        info.velocity.y > SWIPE_VELOCITY_THRESHOLD;

      if (shouldClose) {
        onClose();
      }
    },
    [closeOnSwipeDown, isMobile, onClose]
  );

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (event: React.MouseEvent) => {
      if (closeOnBackdropClick && event.target === event.currentTarget) {
        onClose();
      }
    },
    [closeOnBackdropClick, onClose]
  );

  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const getModalVariants = () => {
    if (prefersReducedMotion) {
      return {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 },
      };
    }

    if (isMobile) {
      return {
        hidden: { y: "100%", opacity: 0 },
        visible: {
          y: 0,
          opacity: 1,
          transition: { type: "spring" as const, damping: 25, stiffness: 300 },
        },
        exit: {
          y: "100%",
          opacity: 0,
          transition: { duration: 0.2 },
        },
      };
    }

    return {
      hidden: { scale: 0.95, opacity: 0 },
      visible: {
        scale: 1,
        opacity: 1,
        transition: { type: "spring" as const, damping: 25, stiffness: 300 },
      },
      exit: {
        scale: 0.95,
        opacity: 0,
        transition: { duration: 0.2 },
      },
    };
  };

  // Don't render on server
  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            onClick={handleBackdropClick}
            className={cn(
              "fixed inset-0 z-50 bg-[rgba(26,26,26,0.5)] backdrop-blur-sm",
              backdropClassName
            )}
            aria-hidden="true"
          />

          {/* Modal */}
          <div
            className={cn(
              "fixed inset-0 z-50 flex items-center justify-center",
              isMobile && "items-end"
            )}
            onClick={handleBackdropClick}
          >
            <motion.div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              variants={getModalVariants()}
              initial="hidden"
              animate="visible"
              exit="exit"
              drag={isMobile && closeOnSwipeDown ? "y" : false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={handleDragEnd}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "relative w-full bg-[var(--color-surface)]",
                "shadow-[var(--shadow-xl)]",
                "focus:outline-none",
                isMobile
                  ? "rounded-t-[var(--radius-2xl)] max-h-[90vh]"
                  : cn("rounded-[var(--radius-lg)] mx-4", sizeClasses[size]),
                className
              )}
            >
              {/* Mobile drag handle */}
              {isMobile && closeOnSwipeDown && (
                <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
                  <div className="w-10 h-1 rounded-full bg-[var(--color-border)]" />
                </div>
              )}

              {/* Header with close button */}
              {showCloseButton && (
                <div className="absolute top-3 right-3 z-10">
                  <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={onClose}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full",
                      "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]",
                      "hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]",
                      "transition-colors duration-[var(--duration-fast)]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-cta)]"
                    )}
                    aria-label="Close modal"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}

              {/* Hidden title for accessibility */}
              <span id="modal-title" className="sr-only">
                {title}
              </span>

              {/* Content */}
              <div className={cn("overflow-y-auto", isMobile ? "max-h-[calc(90vh-40px)]" : "max-h-[80vh]")}>
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

/**
 * Hook to manage modal state
 */
export function useModal(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle };
}
