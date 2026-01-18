/**
 * V3 Sprint 6: Empty State Components
 *
 * Contextual empty state displays when no data is available.
 * Each variant includes icon, message, and action to resolve.
 */

"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ShoppingBag,
  Search,
  Receipt,
  Heart,
  Calendar,
  Inbox,
  CheckCircle,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

// ============================================
// TYPES
// ============================================

export type EmptyStateVariant =
  | "cart"
  | "search"
  | "orders"
  | "favorites"
  | "driver-route"
  | "admin-orders"
  | "exceptions";

interface EmptyStateConfig {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  isPositive?: boolean;
}

const variantConfigs: Record<EmptyStateVariant, EmptyStateConfig> = {
  cart: {
    icon: ShoppingBag,
    title: "Your cart is empty",
    description: "Add items from the menu to get started",
    actionLabel: "Browse Menu",
    actionHref: "/menu",
  },
  search: {
    icon: Search,
    title: "No results found",
    description: "Try different keywords or browse our categories",
    actionLabel: "Clear Search",
  },
  orders: {
    icon: Receipt,
    title: "No orders yet",
    description: "Your order history will appear here",
    actionLabel: "Place your first order",
    actionHref: "/menu",
  },
  favorites: {
    icon: Heart,
    title: "No favorites saved",
    description: "Tap the heart on items you love to save them here",
    actionLabel: "Browse menu",
    actionHref: "/menu",
  },
  "driver-route": {
    icon: Calendar,
    title: "No route assigned today",
    description: "Check back later for your delivery assignments",
  },
  "admin-orders": {
    icon: Inbox,
    title: "No orders for this period",
    description: "Try adjusting your date filter to see more results",
    actionLabel: "Adjust filter",
  },
  exceptions: {
    icon: CheckCircle,
    title: "No exceptions - all good!",
    description: "All deliveries are running smoothly",
    isPositive: true,
  },
};

// ============================================
// EMPTY STATE COMPONENT
// ============================================

export interface EmptyStateProps {
  /** Predefined variant or custom configuration */
  variant?: EmptyStateVariant;
  /** Custom icon (overrides variant) */
  icon?: LucideIcon;
  /** Custom title (overrides variant) */
  title?: string;
  /** Custom description (overrides variant) */
  description?: string;
  /** Custom action label (overrides variant) */
  actionLabel?: string;
  /** Action href for Link (overrides variant) */
  actionHref?: string;
  /** Action click handler (for button without href) */
  onAction?: () => void;
  /** Search query for display (used with search variant) */
  searchQuery?: string;
  /** Additional content below the action */
  children?: ReactNode;
  /** Additional class names */
  className?: string;
}

export function EmptyState({
  variant = "cart",
  icon: customIcon,
  title: customTitle,
  description: customDescription,
  actionLabel: customActionLabel,
  actionHref: customActionHref,
  onAction,
  searchQuery,
  children,
  className,
}: EmptyStateProps) {
  const prefersReducedMotion = useReducedMotion();
  const config = variantConfigs[variant];

  const Icon = customIcon ?? config.icon;
  const title = customTitle ?? config.title;
  const description = customDescription ?? config.description;
  const actionLabel = customActionLabel ?? config.actionLabel;
  const actionHref = customActionHref ?? config.actionHref;
  const isPositive = config.isPositive;

  // Handle search query display
  const displayDescription =
    variant === "search" && searchQuery
      ? `No results for "${searchQuery}". ${description}`
      : description;

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" as const },
    },
  };

  const iconVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { delay: 0.1, duration: 0.3, ease: "easeOut" as const },
    },
  };

  return (
    <motion.div
      variants={prefersReducedMotion ? undefined : containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "flex flex-col items-center justify-center px-4 py-12 text-center",
        className
      )}
    >
      {/* Icon */}
      <motion.div
        variants={prefersReducedMotion ? undefined : iconVariants}
        className={cn(
          "mb-4 flex h-16 w-16 items-center justify-center rounded-full",
          isPositive
            ? "bg-[var(--color-jade)]/10 text-[var(--color-jade)]"
            : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"
        )}
      >
        <Icon className="h-8 w-8" strokeWidth={1.5} />
      </motion.div>

      {/* Title */}
      <h2
        className={cn(
          "mb-2 text-lg font-semibold",
          isPositive
            ? "text-[var(--color-jade)]"
            : "text-[var(--color-text-primary)]"
        )}
      >
        {title}
      </h2>

      {/* Description */}
      <p className="mb-6 max-w-sm text-[var(--color-text-muted)]">
        {displayDescription}
      </p>

      {/* Action */}
      {actionLabel && (
        <>
          {actionHref ? (
            <Button asChild variant="secondary">
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
          ) : onAction ? (
            <Button variant="secondary" onClick={onAction}>
              {actionLabel}
            </Button>
          ) : null}
        </>
      )}

      {/* Additional content */}
      {children}
    </motion.div>
  );
}

// ============================================
// SPECIALIZED EMPTY STATES
// ============================================

/**
 * Cart empty state with browse menu CTA
 */
export function CartEmptyState() {
  return <EmptyState variant="cart" />;
}

/**
 * Search empty state with clear action
 */
export function SearchEmptyState({
  query,
  onClear,
}: {
  query?: string;
  onClear?: () => void;
}) {
  return (
    <EmptyState variant="search" searchQuery={query} onAction={onClear}>
      {/* Popular searches */}
      <div className="mt-6 text-sm text-[var(--color-text-muted)]">
        <p className="mb-2 font-medium text-[var(--color-text-primary)]/80">
          Popular searches:
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {["Mohinga", "Curry", "Noodles", "Seafood"].map((term) => (
            <span
              key={term}
              className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1"
            >
              {term}
            </span>
          ))}
        </div>
      </div>
    </EmptyState>
  );
}

/**
 * Orders empty state
 */
export function OrdersEmptyState() {
  return <EmptyState variant="orders" />;
}

/**
 * Favorites empty state
 */
export function FavoritesEmptyState() {
  return <EmptyState variant="favorites" />;
}

/**
 * Driver no route empty state
 */
export function DriverRouteEmptyState() {
  return <EmptyState variant="driver-route" />;
}

/**
 * Admin no orders empty state
 */
export function AdminOrdersEmptyState({ onAdjustFilter }: { onAdjustFilter?: () => void }) {
  return <EmptyState variant="admin-orders" onAction={onAdjustFilter} />;
}

/**
 * Exceptions all-clear state (positive)
 */
export function ExceptionsEmptyState() {
  return <EmptyState variant="exceptions" />;
}
