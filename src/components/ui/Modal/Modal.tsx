"use client";

/**
 * Modal Component
 *
 * Production-grade accessible modal with responsive animations.
 * - Desktop: Scale + fade centered dialog
 * - Mobile: Slide up bottom sheet with swipe-to-close
 */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useId,
  createContext,
  useContext,
  type KeyboardEvent,
} from "react";
import { m, AnimatePresence, useReducedMotion } from "framer-motion";
import { Portal } from "../Portal";
import { X } from "lucide-react";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";
import { useSwipeToClose, triggerHaptic } from "@/lib/swipe-gestures";
import { cn } from "@/lib/utils/cn";
import { zIndex as zIndexTokens } from "@/lib/design-system/tokens/z-index";
import type { ModalProps } from "./types";
import {
  sizeConfig,
  backdropVariants,
  desktopVariants,
  mobileVariants,
  reducedMotionVariants,
} from "./constants";

const ModalStackContext = createContext<number>(0);

function useModalStack() {
  return useContext(ModalStackContext);
}

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

  // Scroll lock (uses shared hook with deferred restore)
  const { restoreScrollPosition } = useBodyScrollLock(isOpen, { deferRestore: true });

  // Focus management
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

  // Keyboard handling (Escape key)
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

  // Backdrop click
  const handleBackdropClick = useCallback(
    (event: React.MouseEvent) => {
      if (closeOnBackdropClick && event.target === event.currentTarget) {
        onClose();
      }
    },
    [closeOnBackdropClick, onClose]
  );

  // willChange optimization
  const handleAnimationStart = useCallback(() => {
    if (modalRef.current) {
      modalRef.current.style.willChange = "transform";
    }
  }, []);

  const handleAnimationComplete = useCallback(() => {
    if (modalRef.current) {
      modalRef.current.style.willChange = "auto";
    }
  }, []);

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
        <AnimatePresence onExitComplete={restoreScrollPosition}>
        {/* Backdrop - rendered separately to avoid Fragment inside AnimatePresence */}
        {isOpen && (
          <m.div
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
              // No backdrop blur on mobile - causes crashes
              "bg-overlay sm:backdrop-blur-sm",
              backdropClassName
            )}
            aria-hidden="true"
            data-testid="modal-backdrop"
          />
        )}

        {/* Modal Container - rendered separately to avoid Fragment inside AnimatePresence */}
        {/* Mobile: No opacity animation on container - prevents transparency issues since blur is disabled */}
        {/* Desktop: Container fades in/out for smooth appearance with backdrop blur */}
        {isOpen && (
          <m.div
            key="modal-container"
            className={cn(
              "fixed inset-0 flex overflow-hidden",
              isMobile ? "items-end" : "items-center justify-center p-4"
            )}
            style={{ zIndex: modalZIndex + 1 }}
            onClick={handleBackdropClick}
            initial={isMobile ? undefined : { opacity: 0 }}
            animate={isMobile ? undefined : { opacity: 1 }}
            exit={isMobile ? undefined : { opacity: 0 }}
            transition={isMobile ? undefined : { duration: 0.15 }}
          >
            {/* Modal Content */}
            <m.div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              variants={variants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onAnimationStart={handleAnimationStart}
              onAnimationComplete={handleAnimationComplete}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              {...(isMobile && closeOnSwipeDown && !prefersReducedMotion ? swipeProps : {})}
              style={{
                y: isDragging ? dragOffset : 0,
              }}
              className={cn(
                // Base styles
                "relative w-full",
                // Solid background - using explicit white/black for mobile reliability
                // eslint-disable-next-line no-restricted-syntax -- explicit colors needed for mobile CSS var resolution
                "bg-white dark:bg-black border border-border",
                "sm:backdrop-blur-xl",
                "shadow-xl",
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
            </m.div>
          </m.div>
        )}
        </AnimatePresence>
      </ModalStackContext.Provider>
    </Portal>
  );
}
