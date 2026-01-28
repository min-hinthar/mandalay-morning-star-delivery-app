"use client";

/**
 * Dropdown Component
 * Positioned menu that does NOT swallow form submission events
 *
 * CRITICAL FIX from V7: No stopPropagation on content/root.
 * Only DropdownItem handles its own clicks without blocking event bubbling.
 *
 * Features:
 * - Spring animation with scale+fade
 * - Closes on outside click and Escape
 * - Proper z-index layering with z-[60]
 * - Form submissions and parent click handlers work correctly
 *
 * @example
 * <Dropdown>
 *   <DropdownTrigger>
 *     <Button>Open Menu</Button>
 *   </DropdownTrigger>
 *   <DropdownContent>
 *     <DropdownItem onClick={handleAction}>Action</DropdownItem>
 *     <DropdownSeparator />
 *     <DropdownItem onClick={handleDelete}>Delete</DropdownItem>
 *   </DropdownContent>
 * </Dropdown>
 */

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
  type ReactElement,
  cloneElement,
  isValidElement,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { zIndex } from "@/lib/design-system/tokens/z-index";
import { overlayMotion } from "@/lib/design-system/tokens/motion";
import { cn } from "@/lib/utils/cn";

// ============================================================================
// Context
// ============================================================================

interface DropdownContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

const DropdownContext = createContext<DropdownContextType | null>(null);

function useDropdown() {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error("Dropdown components must be used within <Dropdown>");
  }
  return context;
}

// ============================================================================
// Dropdown (Root)
// ============================================================================

export interface DropdownProps {
  /** Dropdown content (trigger and content) */
  children: ReactNode;
  /** Initial open state */
  defaultOpen?: boolean;
  /** Controlled open state callback */
  onOpenChange?: (open: boolean) => void;
}

export function Dropdown({
  children,
  defaultOpen = false,
  onOpenChange,
}: DropdownProps) {
  const [isOpen, setIsOpenInternal] = useState(defaultOpen);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const setIsOpen = useCallback((open: boolean) => {
    setIsOpenInternal(open);
    onOpenChange?.(open);
  }, [onOpenChange]);

  // Memoize context value to prevent infinite re-renders
  const contextValue = useMemo(() => ({
    isOpen,
    setIsOpen,
    triggerRef,
  }), [isOpen, setIsOpen]);

  return (
    <DropdownContext.Provider value={contextValue}>
      <div className="relative inline-block">{children}</div>
    </DropdownContext.Provider>
  );
}

// ============================================================================
// DropdownTrigger
// ============================================================================

export interface DropdownTriggerProps {
  /** Trigger element */
  children: ReactNode;
  /** Render as child element instead of wrapping button */
  asChild?: boolean;
}

export function DropdownTrigger({ children, asChild }: DropdownTriggerProps) {
  const { isOpen, setIsOpen, triggerRef } = useDropdown();

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  if (asChild && isValidElement(children)) {
    const childType = (children as ReactElement).type;

    // Fragment can't accept props - wrap in button
    if (childType === React.Fragment) {
      return (
        <button
          ref={triggerRef}
          type="button"
          onClick={handleClick}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          {children}
        </button>
      );
    }

    return cloneElement(
      children as ReactElement<{
        onClick?: () => void;
        ref?: React.Ref<HTMLButtonElement>;
      }>,
      {
        onClick: handleClick,
        ref: triggerRef,
      }
    );
  }

  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={handleClick}
      aria-expanded={isOpen}
      aria-haspopup="true"
    >
      {children}
    </button>
  );
}

// ============================================================================
// DropdownContent
// ============================================================================

export interface DropdownContentProps {
  /** Menu items */
  children: ReactNode;
  /** Horizontal alignment relative to trigger */
  align?: "start" | "end" | "center";
  /** Additional CSS classes */
  className?: string;
}

export function DropdownContent({
  children,
  align = "end",
  className,
}: DropdownContentProps) {
  const { isOpen, setIsOpen, triggerRef } = useDropdown();
  const contentRef = useRef<HTMLDivElement>(null);

  // Outside click detection
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutsideContent =
        contentRef.current && !contentRef.current.contains(target);
      const isOutsideTrigger =
        triggerRef.current && !triggerRef.current.contains(target);

      if (isOutsideContent && isOutsideTrigger) {
        setIsOpen(false);
      }
    };

    // Use mousedown to catch click before it propagates
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, setIsOpen, triggerRef]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        // Return focus to trigger
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setIsOpen, triggerRef]);

  const alignmentClasses = {
    start: "left-0",
    end: "right-0",
    center: "left-1/2 -translate-x-1/2",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={contentRef}
          role="menu"
          aria-orientation="vertical"
          className={cn(
            "absolute top-full mt-1",
            alignmentClasses[align],
            "min-w-[8rem]",
            "bg-white dark:bg-zinc-900",
            "rounded-md border border-border",
            "shadow-lg",
            "p-1",
            "origin-top",
            className
          )}
          style={{ zIndex: zIndex.popover }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={overlayMotion.dropdown}
          data-testid="dropdown-content"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// DropdownItem
// ============================================================================

export interface DropdownItemProps {
  /** Item content */
  children: ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Render as child element (for links) */
  asChild?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

export function DropdownItem({
  children,
  onClick,
  asChild,
  className,
  disabled,
}: DropdownItemProps) {
  const { setIsOpen } = useDropdown();

  const handleClick = () => {
    if (disabled) return;
    onClick?.();
    setIsOpen(false);
  };

  const itemClasses = cn(
    "relative flex cursor-pointer select-none items-center",
    "rounded-sm px-2 py-1.5 text-sm",
    "outline-none transition-colors",
    "hover:bg-muted focus:bg-muted",
    disabled && "pointer-events-none opacity-50",
    className
  );

  if (asChild && isValidElement(children)) {
    return (
      <div role="menuitem" className={itemClasses} onClick={handleClick}>
        {children}
      </div>
    );
  }

  return (
    <div
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
      className={itemClasses}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {children}
    </div>
  );
}

// ============================================================================
// DropdownSeparator
// ============================================================================

export interface DropdownSeparatorProps {
  /** Additional CSS classes */
  className?: string;
}

export function DropdownSeparator({ className }: DropdownSeparatorProps) {
  return (
    <div
      role="separator"
      className={cn("h-px bg-muted -mx-1 my-1", className)}
    />
  );
}
