/**
 * V5 Sprint 5: Modal Component
 *
 * Production-grade accessible modal with responsive animations.
 * - Desktop: Scale + fade centered dialog
 * - Mobile: Slide up bottom sheet with swipe-to-close
 *
 * Features:
 * - Focus trap with automatic focus management
 * - Escape key and backdrop click close
 * - Body scroll lock (preserves scroll position)
 * - Swipe to close on mobile via useSwipeToClose
 * - Nested modal support with z-index stacking
 * - Full reduced motion support
 */

"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useId,
  createContext,
  useContext,
  type ReactNode,
  type KeyboardEvent,
} from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Portal } from "./Portal";
import { X } from "lucide-react";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { useSwipeToClose, triggerHaptic } from "@/lib/swipe-gestures";
import { cn } from "@/lib/utils/cn";
import { zIndex as zIndexTokens } from "@/lib/design-system/tokens/z-index";

// ============================================
// CONTEXT FOR NESTED MODALS
// ============================================

const ModalStackContext = createContext<number>(0);

function useModalStack() {
  return useContext(ModalStackContext);
}

// ============================================
// TYPES
// ============================================

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal title for accessibility (visually hidden) */
  title: string;
  /** Modal content */
  children: ReactNode;
  /** Whether to show close button (default: true) */
  showCloseButton?: boolean;
  /** Whether clicking backdrop closes modal (default: true) */
  closeOnBackdropClick?: boolean;
  /** Whether pressing Escape closes modal (default: true) */
  closeOnEscape?: boolean;
  /** Whether swipe down closes modal on mobile (default: true) */
  closeOnSwipeDown?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /** Additional class names for modal content */
  className?: string;
  /** Additional class names for backdrop */
  backdropClassName?: string;
  /** Optional header content (replaces default) */
  header?: ReactNode;
  /** Optional footer content */
  footer?: ReactNode;
  /** Initial focus element ref */
  initialFocusRef?: React.RefObject<HTMLElement>;
}

// ============================================
// SIZE CONFIGURATIONS
// ============================================

const sizeConfig = {
  sm: { maxWidth: "max-w-sm", padding: "p-4" },
  md: { maxWidth: "max-w-md", padding: "p-5" },
  lg: { maxWidth: "max-w-lg", padding: "p-6" },
  xl: { maxWidth: "max-w-xl", padding: "p-6" },
  full: { maxWidth: "max-w-[calc(100vw-2rem)]", padding: "p-6" },
};

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
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 300,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 8,
    transition: {
      duration: 0.2,
      ease: "easeIn",
    },
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
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 300,
    },
  },
  exit: {
    y: "100%",
    opacity: 0.8,
    transition: {
      duration: 0.2,
      ease: "easeIn",
    },
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
  closeOnSwipeDown = true,
  size = "md",
  className,
  backdropClassName,
  header,
  footer,
  initialFocusRef,
}: ModalProps) {
  // State-based mounting for SSR safety - prevents hydration mismatch
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const modalRef = useRef<HTMLDivElement>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const titleId = useId();
  const stackLevel = useModalStack();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const prefersReducedMotion = useReducedMotion();

  // Swipe to close hook for mobile
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
    disabled: !isMobile || !closeOnSwipeDown || prefersReducedMotion === true,
  });

  // ============================================
  // SCROLL LOCK
  // ============================================

  useEffect(() => {
    if (!isOpen) return;

    // Store scroll position and lock
    const scrollY = window.scrollY;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";

      // Restore scroll position
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  // ============================================
  // FOCUS MANAGEMENT
  // ============================================

  useEffect(() => {
    if (isOpen) {
      // Store last active element
      lastActiveElementRef.current = document.activeElement as HTMLElement | null;

      // Focus initial element, close button, or first focusable
      const timer = setTimeout(() => {
        if (initialFocusRef?.current) {
          initialFocusRef.current.focus();
        } else if (closeButtonRef.current) {
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
  }, [isOpen, initialFocusRef]);

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

  // ============================================
  // BACKDROP CLICK
  // ============================================

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent) => {
      if (closeOnBackdropClick && event.target === event.currentTarget) {
        onClose();
      }
    },
    [closeOnBackdropClick, onClose]
  );

  // ============================================
  // RENDER
  // ============================================

  // SSR safety: don't render portal until mounted on client
  if (!isMounted) return null;

  const modalZIndex = zIndexTokens.modal + stackLevel * 10;
  const config = sizeConfig[size];

  const variants = prefersReducedMotion
    ? reducedMotionVariants
    : isMobile
      ? mobileVariants
      : desktopVariants;

  // Calculate backdrop opacity based on swipe
  const computedBackdropOpacity = isDragging ? backdropOpacity : 1;

  return (
    <Portal>
      <ModalStackContext.Provider value={stackLevel + 1}>
        <AnimatePresence>
        {/* Backdrop - rendered separately to avoid Fragment inside AnimatePresence */}
        {isOpen && (
          <motion.div
            key="modal-backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            style={{
              zIndex: modalZIndex,
              opacity: computedBackdropOpacity,
            }}
            onClick={handleBackdropClick}
            className={cn(
              "fixed inset-0",
              "bg-overlay backdrop-blur-sm",
              backdropClassName
            )}
            aria-hidden="true"
            data-testid="modal-backdrop"
          />
        )}

        {/* Modal Container - rendered separately to avoid Fragment inside AnimatePresence */}
        {isOpen && (
          <motion.div
            key="modal-container"
            className={cn(
              "fixed inset-0 flex overflow-hidden",
              isMobile ? "items-end" : "items-center justify-center p-4"
            )}
            style={{ zIndex: modalZIndex + 1 }}
            onClick={handleBackdropClick}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Modal Content */}
            <motion.div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              variants={variants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              {...(isMobile && closeOnSwipeDown && !prefersReducedMotion ? swipeProps : {})}
              style={{
                y: isDragging ? dragOffset : 0,
              }}
              className={cn(
                // Base styles
                "relative w-full",
                "bg-[var(--color-surface,#fff)] dark:bg-[var(--color-surface-primary-dark,#1A1918)]",
                "shadow-[var(--shadow-xl,0_25px_50px_-12px_rgba(0,0,0,0.25))]",
                "focus:outline-none",
                // Mobile styles
                isMobile && [
                  "rounded-t-[1.5rem]",
                  "max-h-[90vh]",
                  "pb-safe",
                ],
                // Desktop styles
                !isMobile && [
                  "rounded-[var(--radius-lg,0.75rem)]",
                  config.maxWidth,
                  "max-h-[85vh]",
                ],
                className
              )}
              data-testid="modal-content"
            >
              {/* Mobile Drag Handle */}
              {isMobile && closeOnSwipeDown && (
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
                      "bg-[var(--color-border,#e5e5e5)] dark:bg-[var(--color-border-dark,#3a3837)]",
                      "transition-colors duration-150",
                      isDragging && "bg-[var(--color-text-muted,#9ca3af)]"
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
                    "bg-[var(--color-surface-secondary,#f8f7f6)] dark:bg-[var(--color-surface-secondary-dark,#2a2827)]",
                    "text-[var(--color-text-secondary,#4a4845)] dark:text-[var(--color-text-secondary-dark,#b5b3b0)]",
                    "hover:bg-[var(--color-surface-tertiary,#f0eeec)] dark:hover:bg-[var(--color-surface-tertiary-dark,#3a3837)]",
                    "hover:text-[var(--color-text-primary,#1a1918)] dark:hover:text-[var(--color-text-primary-dark,#f8f7f6)]",
                    "transition-colors duration-150",
                    "focus-visible:outline-none focus-visible:ring-2",
                    "focus-visible:ring-[var(--color-interactive-primary,#D4A853)] focus-visible:ring-offset-2"
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

              {/* Custom Header */}
              {header && (
                <div className={cn(
                  "border-b border-[var(--color-border,#e5e5e5)] dark:border-[var(--color-border-dark,#3a3837)]",
                  config.padding,
                  showCloseButton && "pr-14"
                )}>
                  {header}
                </div>
              )}

              {/* Content */}
              <div
                className={cn(
                  "overflow-y-auto overscroll-contain",
                  config.padding,
                  showCloseButton && !header && "pt-14",
                  isMobile
                    ? "max-h-[calc(90vh-3rem)]"
                    : "max-h-[calc(85vh-2rem)]",
                  footer && "pb-0"
                )}
              >
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div className={cn(
                  "border-t border-[var(--color-border,#e5e5e5)] dark:border-[var(--color-border-dark,#3a3837)]",
                  config.padding,
                  "bg-[var(--color-surface-secondary,#f8f7f6)] dark:bg-[var(--color-surface-secondary-dark,#2a2827)]",
                  isMobile && "rounded-b-none"
                )}>
                  {footer}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>
      </ModalStackContext.Provider>
    </Portal>
  );
}

// ============================================
// MODAL STATE HOOK
// ============================================

export interface UseModalReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setIsOpen: (value: boolean) => void;
}

/**
 * Hook to manage modal state with convenient methods.
 *
 * @example
 * const { isOpen, open, close } = useModal();
 *
 * <button onClick={open}>Open Modal</button>
 * <Modal isOpen={isOpen} onClose={close} title="Example">
 *   Content here
 * </Modal>
 */
export function useModal(initialOpen = false): UseModalReturn {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle, setIsOpen };
}

// ============================================
// MODAL HEADER COMPONENT
// ============================================

export interface ModalHeaderProps {
  children: ReactNode;
  className?: string;
}

/**
 * Styled header for modal content.
 */
export function ModalHeader({ children, className }: ModalHeaderProps) {
  return (
    <div className={cn(
      "text-lg font-semibold",
      "text-[var(--color-text-primary,#1a1918)] dark:text-[var(--color-text-primary-dark,#f8f7f6)]",
      className
    )}>
      {children}
    </div>
  );
}

// ============================================
// MODAL FOOTER COMPONENT
// ============================================

export interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

/**
 * Styled footer for modal actions.
 */
export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={cn(
      "flex items-center justify-end gap-3",
      className
    )}>
      {children}
    </div>
  );
}

// ============================================
// CONFIRMATION MODAL COMPONENT
// ============================================

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  isLoading?: boolean;
}

/**
 * Pre-built confirmation dialog modal.
 *
 * @example
 * <ConfirmModal
 *   isOpen={showConfirm}
 *   onClose={() => setShowConfirm(false)}
 *   onConfirm={handleDelete}
 *   title="Delete Item"
 *   message="Are you sure you want to delete this item?"
 *   variant="danger"
 * />
 */
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  isLoading = false,
}: ConfirmModalProps) {
  const handleConfirm = useCallback(() => {
    onConfirm();
    onClose();
  }, [onConfirm, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      closeOnSwipeDown={false}
    >
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary,#1a1918)] dark:text-[var(--color-text-primary-dark,#f8f7f6)]">
            {title}
          </h3>
          <p className="mt-2 text-sm text-[var(--color-text-secondary,#4a4845)] dark:text-[var(--color-text-secondary-dark,#b5b3b0)]">
            {message}
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className={cn(
              "flex-1 px-4 py-2.5 rounded-lg",
              "text-sm font-medium",
              "bg-[var(--color-surface-secondary,#f8f7f6)] dark:bg-[var(--color-surface-secondary-dark,#2a2827)]",
              "text-[var(--color-text-primary,#1a1918)] dark:text-[var(--color-text-primary-dark,#f8f7f6)]",
              "hover:bg-[var(--color-surface-tertiary,#f0eeec)] dark:hover:bg-[var(--color-surface-tertiary-dark,#3a3837)]",
              "transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              "flex-1 px-4 py-2.5 rounded-lg",
              "text-sm font-medium",
              "transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              variant === "danger"
                ? [
                    "bg-[var(--color-status-error,#C45C4A)]",
                    "text-text-inverse",
                    "hover:bg-[var(--color-accent-tertiary,#b54a3a)]",
                    "focus-visible:ring-[var(--color-status-error,#C45C4A)]",
                  ]
                : [
                    "bg-[var(--color-interactive-primary,#D4A853)]",
                    "text-text-inverse",
                    "hover:bg-[var(--color-interactive-hover,#C49843)]",
                    "focus-visible:ring-[var(--color-interactive-primary,#D4A853)]",
                  ]
            )}
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Loading...
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
