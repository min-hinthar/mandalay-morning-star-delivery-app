"use client";

import {
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

/**
 * V5 Sprint 2.6 - OverlayBase Component
 *
 * Foundation for modals, drawers, and bottom sheets.
 * Handles: focus trapping, escape key, scroll locking, backdrop click.
 *
 * @example
 * <OverlayBase
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   position="center"
 * >
 *   <div>Modal content</div>
 * </OverlayBase>
 */

// ============================================
// TYPES
// ============================================

export type OverlayPosition = "center" | "bottom" | "right" | "left" | "fullscreen";

export interface OverlayBaseProps {
  /** Control overlay visibility */
  isOpen: boolean;
  /** Called when overlay should close */
  onClose: () => void;
  /** Overlay content */
  children: ReactNode;
  /** Position on screen */
  position?: OverlayPosition;
  /** Show close button */
  showCloseButton?: boolean;
  /** Close on backdrop click */
  closeOnBackdropClick?: boolean;
  /** Close on escape key */
  closeOnEscape?: boolean;
  /** Lock body scroll when open */
  lockScroll?: boolean;
  /** Trap focus within overlay */
  trapFocus?: boolean;
  /** Backdrop opacity (0-1) */
  backdropOpacity?: number;
  /** Blur backdrop */
  backdropBlur?: boolean;
  /** ARIA label for accessibility */
  ariaLabel?: string;
  /** ARIA description ID */
  ariaDescribedBy?: string;
  /** Additional container class */
  className?: string;
  /** Backdrop class */
  backdropClassName?: string;
  /** Content wrapper class */
  contentClassName?: string;
  /** Portal target (defaults to document.body) */
  portalTarget?: HTMLElement | null;
  /** Z-index layer */
  zIndex?: number;
}

// ============================================
// FOCUS TRAP HOOK
// ============================================

function useFocusTrap(
  containerRef: React.RefObject<HTMLDivElement | null>,
  isActive: boolean
) {
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Store previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Get all focusable elements
    const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element
    if (firstElement) {
      firstElement.focus();
    }

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus to previous element
      previousActiveElement.current?.focus();
    };
  }, [isActive, containerRef]);
}

// ============================================
// SCROLL LOCK HOOK
// ============================================

function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    const originalStyle = window.getComputedStyle(document.body).overflow;
    const originalPaddingRight = window.getComputedStyle(document.body).paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    // Prevent layout shift from scrollbar removal
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isLocked]);
}

// ============================================
// ANIMATION VARIANTS
// ============================================

const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const getContentVariants = (position: OverlayPosition): Variants => {
  switch (position) {
    case "center":
      return {
        hidden: { opacity: 0, scale: 0.95, y: 10 },
        visible: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.95, y: 10 },
      };
    case "bottom":
      return {
        hidden: { opacity: 0, y: "100%" },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: "100%" },
      };
    case "right":
      return {
        hidden: { opacity: 0, x: "100%" },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: "100%" },
      };
    case "left":
      return {
        hidden: { opacity: 0, x: "-100%" },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: "-100%" },
      };
    case "fullscreen":
      return {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 },
      };
    default:
      return {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 },
      };
  }
};

const getPositionClasses = (position: OverlayPosition): string => {
  switch (position) {
    case "center":
      return "items-center justify-center p-4";
    case "bottom":
      return "items-end justify-center";
    case "right":
      return "items-stretch justify-end";
    case "left":
      return "items-stretch justify-start";
    case "fullscreen":
      return "items-stretch justify-center";
    default:
      return "items-center justify-center p-4";
  }
};

const getContentBaseClasses = (position: OverlayPosition): string => {
  switch (position) {
    case "center":
      return "max-h-[90vh] max-w-lg w-full rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-[var(--elevation-5)]";
    case "bottom":
      return "max-h-[90vh] w-full rounded-t-[var(--radius-xl)] bg-[var(--color-surface)] shadow-[var(--elevation-5)] pb-safe";
    case "right":
      return "h-full w-full max-w-md bg-[var(--color-surface)] shadow-[var(--elevation-5)]";
    case "left":
      return "h-full w-full max-w-md bg-[var(--color-surface)] shadow-[var(--elevation-5)]";
    case "fullscreen":
      return "h-full w-full bg-[var(--color-surface)]";
    default:
      return "bg-[var(--color-surface)]";
  }
};

// ============================================
// OVERLAY BASE COMPONENT
// ============================================

export function OverlayBase({
  isOpen,
  onClose,
  children,
  position = "center",
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  lockScroll = true,
  trapFocus = true,
  backdropOpacity = 0.5,
  backdropBlur = true,
  ariaLabel,
  ariaDescribedBy,
  className,
  backdropClassName,
  contentClassName,
  portalTarget,
  zIndex = 50,
}: OverlayBaseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Custom hooks
  useFocusTrap(containerRef, isOpen && trapFocus);
  useScrollLock(isOpen && lockScroll);

  // Escape key handler
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Backdrop click handler
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (closeOnBackdropClick && e.target === e.currentTarget) {
        onClose();
      }
    },
    [closeOnBackdropClick, onClose]
  );

  // Get animation variants
  const contentVariants = getContentVariants(position);
  const positionClasses = getPositionClasses(position);
  const contentBaseClasses = getContentBaseClasses(position);

  // Transition config
  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.2, ease: "easeOut" as const };

  // Portal target
  const target = portalTarget ?? (typeof document !== "undefined" ? document.body : null);

  if (!target) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          ref={containerRef}
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          className={cn("fixed inset-0", className)}
          style={{ zIndex }}
        >
          {/* Backdrop */}
          <motion.div
            variants={prefersReducedMotion ? undefined : backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={transition}
            onClick={handleBackdropClick}
            className={cn(
              "absolute inset-0",
              backdropBlur && "backdrop-blur-sm",
              backdropClassName
            )}
            style={{ backgroundColor: `rgba(0, 0, 0, ${backdropOpacity})` }}
          />

          {/* Content container */}
          <div
            className={cn(
              "absolute inset-0 flex overflow-hidden",
              positionClasses
            )}
            onClick={handleBackdropClick}
          >
            {/* Content */}
            <motion.div
              variants={prefersReducedMotion ? undefined : contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={transition}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "relative overflow-auto",
                contentBaseClasses,
                contentClassName
              )}
            >
              {/* Close button */}
              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  className={cn(
                    "absolute top-3 right-3 z-10",
                    "flex h-8 w-8 items-center justify-center",
                    "rounded-full bg-[var(--color-surface-secondary)]",
                    "text-[var(--color-text-secondary)]",
                    "transition-colors hover:bg-[var(--color-surface-tertiary)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-interactive-primary)]"
                  )}
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {children}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    target
  );
}

// ============================================
// CONVENIENCE COMPONENTS
// ============================================

/**
 * Modal - Centered overlay with max width
 */
export interface ModalProps extends Omit<OverlayBaseProps, "position"> {
  /** Title for the modal header */
  title?: string;
  /** Description text */
  description?: string;
}

export function Modal({
  title,
  description,
  children,
  ...props
}: ModalProps) {
  return (
    <OverlayBase position="center" ariaLabel={title} {...props}>
      <div className="p-6">
        {(title || description) && (
          <div className="mb-4 pr-8">
            {title && (
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                {description}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </OverlayBase>
  );
}

/**
 * BottomSheet - Mobile-friendly bottom drawer
 */
export interface BottomSheetProps extends Omit<OverlayBaseProps, "position"> {
  /** Title for the sheet header */
  title?: string;
}

export function BottomSheet({
  title,
  children,
  ...props
}: BottomSheetProps) {
  return (
    <OverlayBase position="bottom" ariaLabel={title} {...props}>
      <div className="pt-4 pb-safe">
        {/* Drag handle indicator */}
        <div className="flex justify-center pb-3">
          <div className="h-1 w-12 rounded-full bg-[var(--color-border-default)]" />
        </div>

        {title && (
          <div className="px-4 pb-3 border-b border-[var(--color-border-default)]">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {title}
            </h2>
          </div>
        )}

        <div className="px-4 py-4">{children}</div>
      </div>
    </OverlayBase>
  );
}

/**
 * SideDrawer - Side panel overlay
 */
export interface SideDrawerProps extends Omit<OverlayBaseProps, "position"> {
  /** Which side to open from */
  side?: "left" | "right";
  /** Title for the drawer header */
  title?: string;
}

export function SideDrawer({
  side = "right",
  title,
  children,
  ...props
}: SideDrawerProps) {
  return (
    <OverlayBase position={side} ariaLabel={title} {...props}>
      <div className="flex h-full flex-col">
        {title && (
          <div className="flex items-center justify-between border-b border-[var(--color-border-default)] px-4 py-3">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {title}
            </h2>
          </div>
        )}
        <div className="flex-1 overflow-auto p-4">{children}</div>
      </div>
    </OverlayBase>
  );
}

export default OverlayBase;
