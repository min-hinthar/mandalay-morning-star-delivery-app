/**
 * V3 Sprint 6: Error Banner Component
 *
 * Dismissable top banner for inline error display.
 * Supports offline, error, and warning variants.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { AlertTriangle, WifiOff, AlertCircle, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// ============================================
// TYPES
// ============================================

export type ErrorBannerVariant = "offline" | "error" | "warning";

export interface ErrorBannerProps {
  /** Banner variant */
  variant?: ErrorBannerVariant;
  /** Message to display */
  message: string;
  /** Secondary description */
  description?: string;
  /** Whether the banner is visible */
  isVisible?: boolean;
  /** Whether the banner can be dismissed */
  dismissible?: boolean;
  /** Callback when dismissed */
  onDismiss?: () => void;
  /** Callback when retry is clicked */
  onRetry?: () => void;
  /** Whether retry is in progress */
  isRetrying?: boolean;
  /** Auto-dismiss after milliseconds (0 to disable) */
  autoDismiss?: number;
  /** Additional class names */
  className?: string;
}

const variantStyles: Record<ErrorBannerVariant, {
  bg: string;
  text: string;
  icon: typeof AlertCircle;
}> = {
  offline: {
    bg: "bg-[var(--color-charcoal)] dark:bg-[var(--color-charcoal)]",
    text: "text-white",
    icon: WifiOff,
  },
  error: {
    bg: "bg-[var(--color-error)]",
    text: "text-white",
    icon: AlertCircle,
  },
  warning: {
    bg: "bg-[var(--color-warning)]",
    text: "text-[var(--color-charcoal)]",
    icon: AlertTriangle,
  },
};

// ============================================
// ERROR BANNER COMPONENT
// ============================================

export function ErrorBanner({
  variant = "error",
  message,
  description,
  isVisible = true,
  dismissible = true,
  onDismiss,
  onRetry,
  isRetrying = false,
  autoDismiss = 0,
  className,
}: ErrorBannerProps) {
  const [internalVisible, setInternalVisible] = useState(isVisible);
  const prefersReducedMotion = useReducedMotion();

  const styles = variantStyles[variant];
  const Icon = styles.icon;

  // Sync with external visibility
  useEffect(() => {
    setInternalVisible(isVisible);
  }, [isVisible]);

  // Auto-dismiss
  useEffect(() => {
    if (autoDismiss > 0 && internalVisible) {
      const timer = setTimeout(() => {
        setInternalVisible(false);
        onDismiss?.();
      }, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, internalVisible, onDismiss]);

  const handleDismiss = useCallback(() => {
    setInternalVisible(false);
    onDismiss?.();
  }, [onDismiss]);

  const bannerVariants = {
    hidden: { height: 0, opacity: 0 },
    visible: {
      height: "auto",
      opacity: 1,
      transition: { duration: 0.2, ease: "easeOut" as const },
    },
    exit: {
      height: 0,
      opacity: 0,
      transition: { duration: 0.15 },
    },
  };

  return (
    <AnimatePresence>
      {internalVisible && (
        <motion.div
          role="alert"
          variants={prefersReducedMotion ? undefined : bannerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(
            "overflow-hidden",
            styles.bg,
            styles.text,
            className
          )}
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Icon className="h-5 w-5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{message}</p>
                {description && (
                  <p className="text-xs opacity-80 truncate">{description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {onRetry && (
                <button
                  onClick={onRetry}
                  disabled={isRetrying}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full",
                    "bg-white/20 hover:bg-white/30 transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
                    isRetrying && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <RefreshCw
                    className={cn("h-3.5 w-3.5", isRetrying && "animate-spin")}
                  />
                  {isRetrying ? "Retrying..." : "Retry"}
                </button>
              )}

              {dismissible && (
                <button
                  onClick={handleDismiss}
                  className={cn(
                    "p-1.5 rounded-full",
                    "hover:bg-white/20 transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                  )}
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// OFFLINE BANNER (with auto-reconnect)
// ============================================

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    // Check initial state
    setIsOffline(!navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      // Attempt to fetch a small resource to check connectivity
      await fetch("/api/health", { method: "HEAD" });
      setIsOffline(false);
    } catch {
      // Still offline
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <ErrorBanner
      variant="offline"
      message="You're offline"
      description="Some features may be limited"
      isVisible={isOffline}
      dismissible={false}
      onRetry={handleRetry}
      isRetrying={isRetrying}
    />
  );
}
