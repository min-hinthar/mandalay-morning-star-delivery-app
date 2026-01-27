"use client";

/**
 * Toast Component (V8)
 * Notification toasts with stacking and animations
 *
 * Uses z-[80] layer - highest z-index for notifications
 */

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { zIndex } from "@/design-system/tokens/z-index";
import { overlayMotion } from "@/design-system/tokens/motion";
import { cn } from "@/lib/utils/cn";
import { Portal } from "./Portal";
import { useToast, type Toast as ToastType } from "@/lib/hooks/useToastV8";

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const typeStyles: Record<ToastType["type"], string> = {
    success: "bg-green-500 text-white",
    error: "bg-red-500 text-white",
    warning: "bg-amber-500 text-white",
    info: "bg-blue-500 text-white",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={overlayMotion.toast}
      role="alert"
      aria-live="polite"
      className={cn(
        "flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg",
        "pointer-events-auto",
        "min-w-[200px] max-w-[350px]",
        typeStyles[toast.type]
      )}
    >
      <span className="flex-1 text-sm font-medium">{toast.message}</span>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className={cn(
          "flex-shrink-0 p-1 rounded-full",
          "hover:bg-white/20 transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-white/50"
        )}
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export function ToastContainer() {
  const { toasts, dismiss } = useToast();

  return (
    <Portal>
      <div
        aria-label="Notifications"
        className={cn(
          "fixed bottom-4 right-4",
          "max-sm:left-4 max-sm:right-4",
          "flex flex-col gap-2 items-end",
          "pointer-events-none"
        )}
        style={{ zIndex: zIndex.toast }}
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <Toast key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </Portal>
  );
}
