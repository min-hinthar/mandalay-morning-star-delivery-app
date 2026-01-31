"use client";

/**
 * DriverLayout uses intentional high-contrast mode with raw black/white colors
 * for WCAG accessibility compliance. The design tokens (bg-surface-inverse, etc.)
 * don't provide the exact pure black/white contrast ratios needed for driver UI.
 */
/* eslint-disable no-restricted-syntax */

import { type ReactNode, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Settings, WifiOff, Star } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { spring, variants } from "@/lib/motion-tokens";
import { useServiceWorker } from "@/lib/hooks/useServiceWorker";
import { useOfflineSync } from "@/lib/hooks/useOfflineSync";

interface DriverLayoutProps {
  children: ReactNode;
  /** Primary action button config */
  primaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    variant?: "default" | "success" | "warning";
  };
  /** Secondary action buttons (max 2) */
  secondaryActions?: Array<{
    label: string;
    onClick: () => void;
    disabled?: boolean;
  }>;
  /** Hide the action area */
  hideActions?: boolean;
}

/**
 * Driver App Shell
 * Mobile PWA layout optimized for one-handed use while driving
 *
 * Structure:
 * - Header (48px) - logo, high-contrast toggle, settings
 * - Main Content (scrollable)
 * - Action Area (80px) - primary + secondary buttons
 *
 * Features:
 * - Large touch targets (56px primary, 44px secondary)
 * - Offline indicator
 * - High-contrast mode toggle
 * - iOS safe area support
 */
export function DriverLayout({
  children,
  primaryAction,
  secondaryActions = [],
  hideActions = false,
}: DriverLayoutProps) {
  const [highContrast, setHighContrast] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Register service worker and sync
  useServiceWorker();
  const { syncNow } = useOfflineSync();

  // Listen for sync requests from service worker
  useEffect(() => {
    const handleSyncRequest = () => {
      syncNow();
    };

    window.addEventListener("sw-sync-request", handleSyncRequest);
    return () => {
      window.removeEventListener("sw-sync-request", handleSyncRequest);
    };
  }, [syncNow]);

  // Track online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const toggleHighContrast = useCallback(() => {
    setHighContrast((prev) => !prev);
    // Persist preference
    localStorage.setItem("driver-high-contrast", String(!highContrast));
  }, [highContrast]);

  // Load high contrast preference
  useEffect(() => {
    const saved = localStorage.getItem("driver-high-contrast");
    if (saved === "true") {
      setHighContrast(true);
    }
  }, []);

  const showActions = !hideActions && (primaryAction || secondaryActions.length > 0);

  return (
    <div
      className={cn(
        "flex min-h-screen flex-col",
        highContrast
          ? "bg-black text-white"
          : "bg-[var(--color-background)] text-[var(--color-text-primary)]"
      )}
    >
      {/* Header */}
      <header
        className={cn(
          "sticky top-0 z-20 h-12",
            highContrast
            ? "bg-black border-b border-white"
            : "bg-[var(--color-cream)] border-b border-[var(--color-border)]"
        )}
      >
        <div className="flex h-full items-center justify-between px-4">
          {/* Logo */}
          <Link
            href="/driver"
            className={cn(
              "flex items-center gap-2",
              "font-display text-base font-bold",
                    highContrast ? "text-white" : "text-[var(--color-primary)]"
            )}
          >
            <Star className="h-5 w-5" />
            <span>Mandalay</span>
          </Link>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Offline Indicator */}
            <AnimatePresence>
              {!isOnline && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={spring.snappy}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-2.5 py-1",
                    "text-xs font-semibold",
                                highContrast
                      ? "bg-yellow-400 text-black"
                      : "bg-[var(--color-warning)] text-white"
                  )}
                >
                  <WifiOff className="h-3.5 w-3.5" />
                  <span>Offline</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* High Contrast Toggle */}
            <motion.button
              onClick={toggleHighContrast}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full",
                "transition-colors",
                        highContrast
                  ? "bg-white text-black"
                  : "bg-[var(--color-cream-darker)] text-[var(--color-charcoal)]"
              )}
              aria-label={highContrast ? "Disable high contrast" : "Enable high contrast"}
            >
              {highContrast ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </motion.button>

            {/* Settings */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full",
                "transition-colors",
                        highContrast
                  ? "bg-white/10 text-white hover:bg-white/20"
                  : "bg-[var(--color-cream-darker)] text-[var(--color-charcoal)] hover:bg-[var(--color-border)]"
              )}
              aria-label="Settings"
            >
              <Settings className="h-5 w-5" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{
          paddingBottom: showActions
            ? "calc(80px + env(safe-area-inset-bottom, 0px) + 16px)"
            : undefined,
        }}
      >
        {children}
      </main>

      {/* Action Area */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={variants.fadeIn}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-30",
                    highContrast
                ? "bg-black border-t border-white"
                : "bg-[var(--color-cream-darker)] border-t border-[var(--color-border)]"
            )}
            style={{
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            <div className="flex flex-col gap-2 p-4">
              {/* Primary Action */}
              {primaryAction && (
                <motion.button
                  onClick={primaryAction.onClick}
                  disabled={primaryAction.disabled || primaryAction.loading}
                  whileHover={!primaryAction.disabled && !primaryAction.loading ? { scale: 1.01 } : undefined}
                  whileTap={!primaryAction.disabled && !primaryAction.loading ? { scale: 0.99 } : undefined}
                  className={cn(
                    "flex h-14 w-full items-center justify-center rounded-xl",
                    "text-lg font-bold",
                    "transition-all duration-[var(--duration-fast)]",
                    "focus-visible:outline-none focus-visible:ring-2",
                    primaryAction.disabled || primaryAction.loading
                      ? highContrast
                        ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                        : "bg-[var(--color-border)] text-[var(--color-charcoal-muted)] cursor-not-allowed"
                      : primaryAction.variant === "success"
                        ? "bg-[var(--color-jade)] text-white shadow-glow-success hover:brightness-110"
                        : primaryAction.variant === "warning"
                          ? "bg-[var(--color-warning)] text-white hover:brightness-110"
                          : highContrast
                            ? "bg-white text-black hover:bg-gray-200"
                            : "bg-[var(--color-primary)] text-white shadow-glow-primary hover:brightness-110"
                  )}
                >
                  {primaryAction.loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: 20, ease: "linear" }}
                      className="h-6 w-6 rounded-full border-2 border-current border-t-transparent"
                    />
                  ) : (
                    primaryAction.label
                  )}
                </motion.button>
              )}

              {/* Secondary Actions */}
              {secondaryActions.length > 0 && (
                <div className="flex gap-2">
                  {secondaryActions.slice(0, 2).map((action) => (
                    <motion.button
                      key={action.label}
                      onClick={action.onClick}
                      disabled={action.disabled}
                      whileHover={!action.disabled ? { scale: 1.02 } : undefined}
                      whileTap={!action.disabled ? { scale: 0.98 } : undefined}
                      className={cn(
                        "flex h-11 flex-1 items-center justify-center rounded-lg",
                        "text-base font-semibold",
                        "transition-all duration-[var(--duration-fast)]",
                        "focus-visible:outline-none focus-visible:ring-2",
                                        action.disabled
                          ? highContrast
                            ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                            : "bg-[var(--color-border)] text-[var(--color-charcoal-muted)] cursor-not-allowed"
                          : highContrast
                            ? "bg-white/20 text-white border border-white hover:bg-white/30"
                            : "bg-[var(--color-surface)] text-[var(--color-charcoal)] border border-[var(--color-border)] hover:bg-[var(--color-cream-darker)]"
                      )}
                    >
                      {action.label}
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DriverLayout;
