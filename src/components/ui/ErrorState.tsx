/**
 * V3 Sprint 6: Error State Component
 *
 * Full-page error display for 404, payment failed, server errors.
 * Includes retry and home navigation options.
 */

"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  WifiOff,
  CreditCard,
  FileQuestion,
  ServerCrash,
  RefreshCw,
  Home,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

// ============================================
// TYPES
// ============================================

export type ErrorStateVariant =
  | "generic"
  | "not-found"
  | "payment-failed"
  | "network"
  | "server";

interface ErrorStateConfig {
  icon: LucideIcon;
  title: string;
  description: string;
}

const variantConfigs: Record<ErrorStateVariant, ErrorStateConfig> = {
  generic: {
    icon: AlertTriangle,
    title: "Something went wrong",
    description: "We couldn't process your request. Please try again.",
  },
  "not-found": {
    icon: FileQuestion,
    title: "Page not found",
    description: "The page you're looking for doesn't exist or has been moved.",
  },
  "payment-failed": {
    icon: CreditCard,
    title: "Payment failed",
    description: "We couldn't process your payment. Please check your payment details and try again.",
  },
  network: {
    icon: WifiOff,
    title: "Connection lost",
    description: "Please check your internet connection and try again.",
  },
  server: {
    icon: ServerCrash,
    title: "Server error",
    description: "Our servers are experiencing issues. Please try again later.",
  },
};

// ============================================
// ERROR STATE COMPONENT
// ============================================

export interface ErrorStateProps {
  /** Predefined variant or custom */
  variant?: ErrorStateVariant;
  /** Custom icon (overrides variant) */
  icon?: LucideIcon;
  /** Custom title (overrides variant) */
  title?: string;
  /** Custom description (overrides variant) */
  description?: string;
  /** Error code to display (e.g., "404", "500") */
  errorCode?: string;
  /** Show retry button */
  showRetry?: boolean;
  /** Retry callback */
  onRetry?: () => void;
  /** Is retry in progress */
  isRetrying?: boolean;
  /** Show home button */
  showHome?: boolean;
  /** Home URL */
  homeHref?: string;
  /** Additional class names */
  className?: string;
}

export function ErrorState({
  variant = "generic",
  icon: customIcon,
  title: customTitle,
  description: customDescription,
  errorCode,
  showRetry = true,
  onRetry,
  isRetrying = false,
  showHome = true,
  homeHref = "/",
  className,
}: ErrorStateProps) {
  const prefersReducedMotion = useReducedMotion();
  const config = variantConfigs[variant];

  const Icon = customIcon ?? config.icon;
  const title = customTitle ?? config.title;
  const description = customDescription ?? config.description;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3, staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" as const },
    },
  };

  const iconVariants = {
    hidden: { opacity: 0, scale: 0.8, rotate: -10 },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: { duration: 0.4, ease: "easeOut" as const },
    },
  };

  return (
    <motion.div
      variants={prefersReducedMotion ? undefined : containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "flex min-h-[400px] flex-col items-center justify-center px-4 py-12 text-center",
        className
      )}
    >
      {/* Error code badge */}
      {errorCode && (
        <motion.div
          variants={prefersReducedMotion ? undefined : itemVariants}
          className="mb-4"
        >
          <span className="inline-block rounded-full bg-[var(--color-error)]/10 px-3 py-1 text-sm font-mono font-bold text-[var(--color-error)]">
            {errorCode}
          </span>
        </motion.div>
      )}

      {/* Icon */}
      <motion.div
        variants={prefersReducedMotion ? undefined : iconVariants}
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-error)]/10"
      >
        <Icon className="h-10 w-10 text-[var(--color-error)]" strokeWidth={1.5} />
      </motion.div>

      {/* Title */}
      <motion.h1
        variants={prefersReducedMotion ? undefined : itemVariants}
        className="mb-2 text-2xl font-bold text-[var(--color-text-primary)]"
      >
        {title}
      </motion.h1>

      {/* Description */}
      <motion.p
        variants={prefersReducedMotion ? undefined : itemVariants}
        className="mb-8 max-w-md text-[var(--color-text-muted)]"
      >
        {description}
      </motion.p>

      {/* Actions */}
      <motion.div
        variants={prefersReducedMotion ? undefined : itemVariants}
        className="flex flex-wrap items-center justify-center gap-3"
      >
        {showRetry && onRetry && (
          <Button
            onClick={onRetry}
            disabled={isRetrying}
            variant="primary"
            className="min-w-[120px]"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </>
            )}
          </Button>
        )}

        {showHome && (
          <Button asChild variant="secondary">
            <Link href={homeHref}>
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
        )}
      </motion.div>
    </motion.div>
  );
}

// ============================================
// SPECIALIZED ERROR STATES
// ============================================

/**
 * 404 Not Found error state
 */
export function NotFoundError({ homeHref = "/" }: { homeHref?: string }) {
  return (
    <ErrorState
      variant="not-found"
      errorCode="404"
      showRetry={false}
      homeHref={homeHref}
    />
  );
}

/**
 * Payment failed error state
 */
export function PaymentError({
  onRetry,
  isRetrying,
}: {
  onRetry?: () => void;
  isRetrying?: boolean;
}) {
  return (
    <ErrorState
      variant="payment-failed"
      onRetry={onRetry}
      isRetrying={isRetrying}
      showHome={true}
      homeHref="/checkout"
    />
  );
}

/**
 * Network error state
 */
export function NetworkError({
  onRetry,
  isRetrying,
}: {
  onRetry?: () => void;
  isRetrying?: boolean;
}) {
  return (
    <ErrorState
      variant="network"
      onRetry={onRetry}
      isRetrying={isRetrying}
    />
  );
}

/**
 * Server error state (500)
 */
export function ServerError({
  onRetry,
  isRetrying,
}: {
  onRetry?: () => void;
  isRetrying?: boolean;
}) {
  return (
    <ErrorState
      variant="server"
      errorCode="500"
      onRetry={onRetry}
      isRetrying={isRetrying}
    />
  );
}
