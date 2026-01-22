"use client";

/**
 * Tooltip Component
 * Hover info tooltips with delay and fade animation
 *
 * Uses z-tooltip layer (70) - highest for info overlays
 * pointer-events-none prevents click interference
 *
 * @example
 * <TooltipProvider>
 *   <Tooltip>
 *     <TooltipTrigger>Hover me</TooltipTrigger>
 *     <TooltipContent>Tooltip text</TooltipContent>
 *   </Tooltip>
 * </TooltipProvider>
 */

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
  type ReactElement,
  cloneElement,
  isValidElement,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { zIndex } from "@/design-system/tokens/z-index";
import { overlayMotion } from "@/design-system/tokens/motion";
import { cn } from "@/lib/utils/cn";

// ============================================
// TYPES
// ============================================

interface TooltipContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLSpanElement | null>;
  delayDuration: number;
}

interface TooltipProviderProps {
  children: ReactNode;
}

interface TooltipProps {
  children: ReactNode;
  /** Delay before showing tooltip (ms) */
  delayDuration?: number;
  /** Controlled open state */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
}

interface TooltipTriggerProps {
  children: ReactNode;
  /** Render as child element instead of wrapper span */
  asChild?: boolean;
}

interface TooltipContentProps {
  children: ReactNode;
  /** Position relative to trigger */
  side?: "top" | "bottom";
  /** Distance from trigger (px) */
  sideOffset?: number;
  /** Additional class names */
  className?: string;
}

// ============================================
// CONTEXT
// ============================================

const TooltipContext = createContext<TooltipContextValue | null>(null);

function useTooltipContext() {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error("Tooltip components must be used within a Tooltip");
  }
  return context;
}

// ============================================
// TOOLTIP PROVIDER
// ============================================

/**
 * TooltipProvider - Optional wrapper for API compatibility
 * Just passes children through (no-op)
 */
export function TooltipProvider({ children }: TooltipProviderProps) {
  return <>{children}</>;
}

// ============================================
// TOOLTIP (ROOT)
// ============================================

/**
 * Tooltip - Root component managing open state
 */
export function Tooltip({
  children,
  delayDuration = 200,
  open,
  onOpenChange,
}: TooltipProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);

  // Support controlled and uncontrolled modes
  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = useCallback(
    (newOpen: boolean) => {
      if (open === undefined) {
        setInternalOpen(newOpen);
      }
      onOpenChange?.(newOpen);
    },
    [open, onOpenChange]
  );

  const contextValue: TooltipContextValue = {
    isOpen,
    setIsOpen,
    triggerRef,
    delayDuration,
  };

  return (
    <TooltipContext.Provider value={contextValue}>
      <span className="relative inline-block">{children}</span>
    </TooltipContext.Provider>
  );
}

// ============================================
// TOOLTIP TRIGGER
// ============================================

/**
 * TooltipTrigger - Element that activates tooltip on hover/focus
 */
export function TooltipTrigger({ children, asChild = false }: TooltipTriggerProps) {
  const { setIsOpen, triggerRef, delayDuration } = useTooltipContext();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      setIsOpen(true);
    }, delayDuration);
  }, [setIsOpen, delayDuration, clearTimer]);

  const handleMouseLeave = useCallback(() => {
    clearTimer();
    setIsOpen(false);
  }, [setIsOpen, clearTimer]);

  // Keyboard users get immediate tooltip
  const handleFocus = useCallback(() => {
    clearTimer();
    setIsOpen(true);
  }, [setIsOpen, clearTimer]);

  const handleBlur = useCallback(() => {
    clearTimer();
    setIsOpen(false);
  }, [setIsOpen, clearTimer]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const eventHandlers = {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onFocus: handleFocus,
    onBlur: handleBlur,
  };

  // asChild mode: clone child with handlers
  if (asChild && isValidElement(children)) {
    return cloneElement(children as ReactElement<Record<string, unknown>>, {
      ...eventHandlers,
      ref: triggerRef,
    });
  }

  // Default: wrap in span
  return (
    <span
      ref={triggerRef}
      {...eventHandlers}
      tabIndex={0}
      className="cursor-default"
    >
      {children}
    </span>
  );
}

// ============================================
// TOOLTIP CONTENT
// ============================================

/**
 * TooltipContent - The tooltip popup
 * Uses z-tooltip (70) and pointer-events-none
 */
export function TooltipContent({
  children,
  side = "bottom",
  sideOffset = 6,
  className,
}: TooltipContentProps) {
  const { isOpen } = useTooltipContext();

  const positionClasses = cn(
    "absolute left-1/2 -translate-x-1/2",
    side === "top" && "bottom-full",
    side === "bottom" && "top-full"
  );

  const positionStyle = {
    marginTop: side === "bottom" ? sideOffset : undefined,
    marginBottom: side === "top" ? sideOffset : undefined,
    zIndex: zIndex.tooltip,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.span
          role="tooltip"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={overlayMotion.tooltip}
          className={cn(
            positionClasses,
            // CRITICAL: pointer-events-none prevents click interference
            "pointer-events-none",
            // Styling
            "bg-zinc-900 dark:bg-zinc-100",
            "text-white dark:text-zinc-900",
            "text-xs px-2 py-1 rounded-md shadow-md",
            "w-max max-w-xs",
            className
          )}
          style={positionStyle}
        >
          {children}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
