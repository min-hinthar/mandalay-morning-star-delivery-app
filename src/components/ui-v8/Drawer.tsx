"use client";

/**
 * Drawer Component
 * Animated side drawer with focus management and route-aware closing
 *
 * Features:
 * - Spring animation slide from left or right
 * - Focus trap keeping Tab within drawer
 * - Closes on Escape, backdrop click, route change
 * - Proper DOM removal when closed
 *
 * @example
 * <Drawer isOpen={isOpen} onClose={onClose} side="right">
 *   <DrawerContent />
 * </Drawer>
 */

import { useEffect, useRef, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Portal } from "./overlay";
import { useRouteChangeClose } from "@/lib/hooks/useRouteChangeClose";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";
import { zIndex } from "@/design-system/tokens/z-index";
import { overlayMotion } from "@/design-system/tokens/motion";
import { cn } from "@/lib/utils/cn";

export interface DrawerProps {
  /** Whether drawer is open */
  isOpen: boolean;
  /** Callback to close drawer */
  onClose: () => void;
  /** Drawer content */
  children: ReactNode;
  /** Which side drawer slides from */
  side?: "left" | "right";
  /** Drawer width */
  width?: "sm" | "md" | "lg";
  /** Accessible label for drawer */
  title?: string;
  /** Additional CSS classes */
  className?: string;
}

const widthClasses = {
  sm: "w-64",
  md: "w-80",
  lg: "w-96",
} as const;

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function Drawer({
  isOpen,
  onClose,
  children,
  side = "right",
  width = "md",
  title,
  className,
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);

  // Route change closes drawer
  useRouteChangeClose(isOpen, onClose);

  // Lock body scroll when open
  useBodyScrollLock(isOpen);

  // Store last active element and focus first focusable on open
  useEffect(() => {
    if (isOpen) {
      // Store currently focused element
      lastActiveElementRef.current = document.activeElement as HTMLElement;

      // Focus first focusable element after animation starts
      const timeoutId = setTimeout(() => {
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

      return () => clearTimeout(timeoutId);
    } else {
      // Restore focus on close
      if (lastActiveElementRef.current) {
        lastActiveElementRef.current.focus();
        lastActiveElementRef.current = null;
      }
    }
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
      // Shift+Tab: if on first, go to last
      if (document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus();
      }
    } else {
      // Tab: if on last, go to first
      if (document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
      }
    }
  };

  const slideFrom = side === "left" ? "-100%" : "100%";

  return (
    <Portal>
      <AnimatePresence>
        {/* Backdrop - rendered separately to avoid Fragment inside AnimatePresence */}
        {isOpen && (
          <motion.div
            key="drawer-backdrop"
            className={cn(
              "fixed inset-0",
              "bg-black/50 backdrop-blur-sm"
            )}
            style={{ zIndex: zIndex.modalBackdrop }}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={overlayMotion.backdrop}
            aria-hidden="true"
            data-testid="drawer-backdrop"
          />
        )}

        {/* Drawer - rendered separately to avoid Fragment inside AnimatePresence */}
        {isOpen && (
          <motion.div
            key="drawer-content"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            className={cn(
              "fixed inset-y-0",
              side === "left" ? "left-0" : "right-0",
              widthClasses[width],
              "bg-white dark:bg-zinc-900",
              "shadow-xl",
              "flex flex-col",
              "outline-none",
              className
            )}
            style={{ zIndex: zIndex.modal }}
            initial={{ x: slideFrom }}
            animate={{ x: 0 }}
            exit={{ x: slideFrom }}
            transition={overlayMotion.drawerOpen}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            data-testid="drawer"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
