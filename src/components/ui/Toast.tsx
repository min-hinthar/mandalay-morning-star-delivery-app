"use client";

/**
 * Toast Component (V8)
 * Premium floating card toasts with stacking, swipe dismiss, and type icons.
 *
 * Uses z-[80] layer - highest z-index for notifications
 * Position: top-right (per CONTEXT.md)
 */

import { m, AnimatePresence, type PanInfo } from "framer-motion";
import {
  X,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Bell,
  AlertOctagon,
} from "lucide-react";
import { zIndex } from "@/lib/design-system/tokens/z-index";
import { cn } from "@/lib/utils/cn";
import { Portal } from "./Portal";
import { useToast, type Toast as ToastType, type ToastType as ToastVariant } from "@/lib/hooks/useToastV8";

// ============================================
// ICON + COLOR MAP
// ============================================

const toastConfig: Record<ToastVariant, { icon: typeof CheckCircle; color: string; borderColor: string }> = {
  success: {
    icon: CheckCircle,
    color: "text-green-600 dark:text-green-400",
    borderColor: "border-l-green-500",
  },
  error: {
    icon: XCircle,
    color: "text-status-error",
    borderColor: "border-l-status-error",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-500 dark:text-amber-400",
    borderColor: "border-l-amber-500",
  },
  info: {
    icon: Info,
    color: "text-blue-500 dark:text-blue-400",
    borderColor: "border-l-blue-500",
  },
  order: {
    icon: Bell,
    color: "text-accent-teal",
    borderColor: "border-l-accent-teal",
  },
  exception: {
    icon: AlertOctagon,
    color: "text-status-error",
    borderColor: "border-l-status-error",
  },
};

const SWIPE_DISMISS_THRESHOLD = 100;

// ============================================
// SINGLE TOAST
// ============================================

interface ToastCardProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

function ToastCard({ toast, onDismiss }: ToastCardProps) {
  const config = toastConfig[toast.type];
  const Icon = config.icon;

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (info.offset.x > SWIPE_DISMISS_THRESHOLD) {
      onDismiss(toast.id);
    }
  }

  return (
    <m.div
      layout
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0, right: 0.5 }}
      onDragEnd={handleDragEnd}
      role="alert"
      aria-live="polite"
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl shadow-lg",
        "bg-surface-primary border border-border border-l-4",
        "pointer-events-auto cursor-grab active:cursor-grabbing",
        "min-w-[280px] max-w-[380px]",
        config.borderColor
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", config.color)} />
      <span className="flex-1 text-sm font-medium text-text-primary leading-snug">
        {toast.message}
      </span>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className={cn(
          "flex-shrink-0 p-1 rounded-full",
          "text-text-muted hover:text-text-primary hover:bg-surface-tertiary",
          "transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-accent-teal/30"
        )}
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </m.div>
  );
}

// ============================================
// COLLAPSED BADGE
// ============================================

interface CollapsedBadgeProps {
  count: number;
  onClick: () => void;
}

function CollapsedBadge({ count, onClick }: CollapsedBadgeProps) {
  return (
    <m.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-xl shadow-md",
        "bg-surface-secondary border border-border",
        "pointer-events-auto",
        "text-sm font-medium text-text-secondary",
        "hover:bg-surface-tertiary transition-colors"
      )}
    >
      +{count} more
    </m.button>
  );
}

// ============================================
// CONTAINER
// ============================================

export function ToastContainer() {
  const { toasts, dismiss, expanded, toggleExpanded } = useToast();

  const visibleToasts = expanded ? toasts : toasts.slice(0, 1);
  const hiddenCount = expanded ? 0 : Math.max(0, toasts.length - 1);

  return (
    <Portal>
      <div
        aria-label="Notifications"
        className={cn(
          "fixed top-4 right-4",
          "max-sm:left-4 max-sm:right-4",
          "flex flex-col gap-2 items-end",
          "pointer-events-none"
        )}
        style={{ zIndex: zIndex.toast }}
      >
        <AnimatePresence mode="popLayout">
          {visibleToasts.map((t) => (
            <ToastCard key={t.id} toast={t} onDismiss={dismiss} />
          ))}

          {hiddenCount > 0 && (
            <CollapsedBadge
              key="collapsed-badge"
              count={hiddenCount}
              onClick={toggleExpanded}
            />
          )}
        </AnimatePresence>
      </div>
    </Portal>
  );
}

// Re-export Toast card for standalone use
export { ToastCard as Toast };
