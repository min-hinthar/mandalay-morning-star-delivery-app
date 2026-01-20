"use client";

/**
 * V7 Push Toast - Motion-First Design
 *
 * Sprint 7: Tracking & Driver
 * Features: Stacked toasts, slide + spring animations, auto-dismiss with progress
 */

import React, { useState, useEffect, useCallback, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  AlertCircle,
  Info,
  Truck,
  Home,
  X,
  ChefHat,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { v7Spring } from "@/lib/motion-tokens-v7";
import { useAnimationPreferenceV7 } from "@/lib/hooks/useAnimationPreferenceV7";

// ============================================
// TYPES
// ============================================

export type ToastType = "success" | "error" | "info" | "order_update";

export interface ToastV7 {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextValue {
  toasts: ToastV7[];
  addToast: (toast: Omit<ToastV7, "id">) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

// ============================================
// CONTEXT
// ============================================

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToastV7() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToastV7 must be used within ToastProviderV7");
  }
  return context;
}

// ============================================
// TOAST ITEM COMPONENT
// ============================================

interface ToastItemV7Props {
  toast: ToastV7;
  index: number;
  onRemove: (id: string) => void;
}

function ToastItemV7({ toast, index, onRemove }: ToastItemV7Props) {
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();
  const [progress, setProgress] = useState(100);
  const duration = toast.duration ?? 5000;

  // Auto-dismiss timer
  useEffect(() => {
    if (duration <= 0) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onRemove(toast.id);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [duration, toast.id, onRemove]);

  // Icon based on type
  const getIcon = () => {
    if (toast.icon) return toast.icon;

    switch (toast.type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-v6-green" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-v6-status-error" />;
      case "info":
        return <Info className="w-5 h-5 text-v6-primary" />;
      case "order_update":
        return <Truck className="w-5 h-5 text-v6-secondary" />;
      default:
        return <Info className="w-5 h-5 text-v6-primary" />;
    }
  };

  // Background color based on type
  const getBgColor = () => {
    switch (toast.type) {
      case "success":
        return "bg-v6-green/5 border-v6-green/20";
      case "error":
        return "bg-v6-status-error/5 border-v6-status-error/20";
      case "info":
        return "bg-v6-primary/5 border-v6-primary/20";
      case "order_update":
        return "bg-v6-secondary/5 border-v6-secondary/20";
      default:
        return "bg-v6-surface-primary border-v6-border";
    }
  };

  // Progress bar color
  const getProgressColor = () => {
    switch (toast.type) {
      case "success":
        return "bg-v6-green";
      case "error":
        return "bg-v6-status-error";
      case "info":
        return "bg-v6-primary";
      case "order_update":
        return "bg-v6-secondary";
      default:
        return "bg-v6-primary";
    }
  };

  // Haptic feedback on mount
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(toast.type === "error" ? [50, 30, 50] : 15);
    }
  }, [toast.type]);

  return (
    <motion.div
      layout
      initial={shouldAnimate ? { opacity: 0, x: 100, scale: 0.9 } : undefined}
      animate={
        shouldAnimate
          ? {
              opacity: 1 - index * 0.1,
              x: 0,
              scale: 1 - index * 0.05,
              y: index * 10,
            }
          : undefined
      }
      exit={shouldAnimate ? { opacity: 0, x: 100, scale: 0.9 } : undefined}
      transition={getSpring(v7Spring.snappy)}
      style={{ zIndex: 100 - index }}
      className={cn(
        "relative w-80 rounded-xl border shadow-lg overflow-hidden",
        "backdrop-blur-sm",
        getBgColor()
      )}
    >
      {/* Content */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <motion.div
            initial={shouldAnimate ? { scale: 0 } : undefined}
            animate={shouldAnimate ? { scale: 1 } : undefined}
            transition={{ ...getSpring(v7Spring.ultraBouncy), delay: 0.1 }}
            className="flex-shrink-0 mt-0.5"
          >
            {getIcon()}
          </motion.div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-v6-text-primary text-sm">{toast.title}</p>
            {toast.message && (
              <p className="text-xs text-v6-text-secondary mt-0.5 line-clamp-2">
                {toast.message}
              </p>
            )}

            {/* Action button */}
            {toast.action && (
              <motion.button
                type="button"
                onClick={toast.action.onClick}
                whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
                whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
                className={cn(
                  "mt-2 text-xs font-semibold",
                  toast.type === "success" && "text-v6-green",
                  toast.type === "error" && "text-v6-status-error",
                  toast.type === "info" && "text-v6-primary",
                  toast.type === "order_update" && "text-v6-secondary"
                )}
              >
                {toast.action.label}
              </motion.button>
            )}
          </div>

          {/* Close button */}
          <motion.button
            type="button"
            onClick={() => onRemove(toast.id)}
            whileHover={shouldAnimate ? { scale: 1.1 } : undefined}
            whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
            className="flex-shrink-0 p-1 rounded-full hover:bg-v6-surface-tertiary transition-colors"
          >
            <X className="w-4 h-4 text-v6-text-muted" />
          </motion.button>
        </div>
      </div>

      {/* Progress bar */}
      {duration > 0 && (
        <motion.div
          className={cn("h-1 origin-left", getProgressColor())}
          initial={{ scaleX: 1 }}
          animate={{ scaleX: progress / 100 }}
          transition={{ duration: 0.05, ease: "linear" }}
        />
      )}
    </motion.div>
  );
}

// ============================================
// TOAST CONTAINER
// ============================================

interface ToastContainerV7Props {
  toasts: ToastV7[];
  onRemove: (id: string) => void;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

function ToastContainerV7({
  toasts,
  onRemove,
  position = "top-right",
}: ToastContainerV7Props) {
  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
  };

  return (
    <div className={cn("fixed z-50", positionClasses[position])}>
      <AnimatePresence mode="popLayout">
        {toasts.slice(0, 5).map((toast, index) => (
          <ToastItemV7
            key={toast.id}
            toast={toast}
            index={index}
            onRemove={onRemove}
          />
        ))}
      </AnimatePresence>

      {/* More indicator */}
      {toasts.length > 5 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mt-2"
        >
          <span className="text-xs text-v6-text-muted">
            +{toasts.length - 5} more notifications
          </span>
        </motion.div>
      )}
    </div>
  );
}

// ============================================
// PROVIDER COMPONENT
// ============================================

interface ToastProviderV7Props {
  children: React.ReactNode;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

export function ToastProviderV7({
  children,
  position = "top-right",
}: ToastProviderV7Props) {
  const [toasts, setToasts] = useState<ToastV7[]>([]);

  const addToast = useCallback((toast: Omit<ToastV7, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [{ ...toast, id }, ...prev]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAll }}>
      {children}
      <ToastContainerV7 toasts={toasts} onRemove={removeToast} position={position} />
    </ToastContext.Provider>
  );
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Pre-built toast for order status updates
 */
export function createOrderUpdateToast(
  status: "confirmed" | "preparing" | "out_for_delivery" | "delivered"
): Omit<ToastV7, "id"> {
  const configs = {
    confirmed: {
      title: "Order Confirmed!",
      message: "Your payment has been processed successfully.",
      icon: <CheckCircle className="w-5 h-5 text-v6-green" />,
    },
    preparing: {
      title: "Preparing Your Order",
      message: "Our kitchen has started preparing your delicious food.",
      icon: <ChefHat className="w-5 h-5 text-v6-primary" />,
    },
    out_for_delivery: {
      title: "On the Way!",
      message: "Your driver has picked up your order and is heading your way.",
      icon: <Truck className="w-5 h-5 text-v6-secondary" />,
    },
    delivered: {
      title: "Delivered!",
      message: "Enjoy your meal! Don't forget to rate your experience.",
      icon: <Home className="w-5 h-5 text-v6-green" />,
    },
  };

  return {
    type: "order_update",
    ...configs[status],
    duration: 6000,
  };
}

// ============================================
// STANDALONE TOAST COMPONENT (for direct use)
// ============================================

export interface PushToastV7Props extends ToastV7 {
  onDismiss?: () => void;
  className?: string;
}

export function PushToastV7({
  id,
  type,
  title,
  message,
  duration = 5000,
  icon,
  action,
  onDismiss,
  className,
}: PushToastV7Props) {
  const handleRemove = useCallback(() => {
    onDismiss?.();
  }, [onDismiss]);

  return (
    <div className={className}>
      <ToastItemV7
        toast={{ id, type, title, message, duration, icon, action }}
        index={0}
        onRemove={handleRemove}
      />
    </div>
  );
}

export default ToastProviderV7;
