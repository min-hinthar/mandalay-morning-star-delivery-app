"use client";

/**
 * Tooltip Component (V8)
 * Hover info tooltips with delay and fade animation
 *
 * Uses z-[70] layer - pointer-events-none prevents click interference
 */

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
  type ReactElement,
  cloneElement,
  isValidElement,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { zIndex } from "@/design-system/tokens/z-index";
import { overlayMotion } from "@/design-system/tokens/motion";
import { cn } from "@/lib/utils/cn";

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
  delayDuration?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface TooltipTriggerProps {
  children: ReactNode;
  asChild?: boolean;
}

interface TooltipContentProps {
  children: ReactNode;
  side?: "top" | "bottom";
  sideOffset?: number;
  className?: string;
}

const TooltipContext = createContext<TooltipContextValue | null>(null);

function useTooltipContext() {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error("Tooltip components must be used within a Tooltip");
  }
  return context;
}

export function TooltipProvider({ children }: TooltipProviderProps) {
  return <>{children}</>;
}

export function Tooltip({
  children,
  delayDuration = 200,
  open,
  onOpenChange,
}: TooltipProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);

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

  const contextValue = useMemo<TooltipContextValue>(() => ({
    isOpen,
    setIsOpen,
    triggerRef,
    delayDuration,
  }), [isOpen, setIsOpen, delayDuration]);

  return (
    <TooltipContext.Provider value={contextValue}>
      <span className="relative inline-block">{children}</span>
    </TooltipContext.Provider>
  );
}

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

  const handleFocus = useCallback(() => {
    clearTimer();
    setIsOpen(true);
  }, [setIsOpen, clearTimer]);

  const handleBlur = useCallback(() => {
    clearTimer();
    setIsOpen(false);
  }, [setIsOpen, clearTimer]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const eventHandlers = {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onFocus: handleFocus,
    onBlur: handleBlur,
  };

  if (asChild && isValidElement(children)) {
    const childType = (children as ReactElement).type;
    if (childType === React.Fragment) {
      return (
        <span ref={triggerRef} {...eventHandlers} tabIndex={0} className="cursor-default">
          {children}
        </span>
      );
    }
    return cloneElement(children as ReactElement<Record<string, unknown>>, {
      ...eventHandlers,
      ref: triggerRef,
    });
  }

  return (
    <span ref={triggerRef} {...eventHandlers} tabIndex={0} className="cursor-default">
      {children}
    </span>
  );
}

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
            "pointer-events-none",
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
