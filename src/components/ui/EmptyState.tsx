/**
 * V6 Empty State Components - Pepper Aesthetic
 *
 * Contextual empty state displays when no data is available.
 * Each variant includes icon, message, and action to resolve.
 * V6 colors, typography, and spring animations.
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
import { v6Spring } from "@/lib/motion";

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

  // V6 animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: v6Spring,
    },
  };

  const iconVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { ...v6Spring, delay: 0.1 },
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
      {/* V6 Icon with colored background */}
      <motion.div
        variants={prefersReducedMotion ? undefined : iconVariants}
        className={cn(
          "mb-6 flex h-20 w-20 items-center justify-center rounded-full",
          isPositive
            ? "bg-green/10 text-green"
            : "bg-surface-tertiary text-text-muted"
        )}
      >
        <Icon className="h-10 w-10" strokeWidth={1.5} />
      </motion.div>

      {/* V6 Title */}
      <h2
        className={cn(
          "mb-2 font-display text-xl font-bold",
          isPositive
            ? "text-green"
            : "text-text-primary"
        )}
      >
        {title}
      </h2>

      {/* V6 Description */}
      <p className="mb-8 max-w-sm font-body text-text-secondary">
        {displayDescription}
      </p>

      {/* V6 Action Button */}
      {actionLabel && (
        <>
          {actionHref ? (
            <Button asChild variant="primary" size="lg" className="shadow-elevated">
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
          ) : onAction ? (
            <Button variant="primary" size="lg" onClick={onAction} className="shadow-elevated">
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
      {/* V6 Popular searches */}
      <div className="mt-6 font-body text-sm text-text-muted">
        <p className="mb-3 font-medium text-text-secondary">
          Popular searches:
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {["Mohinga", "Curry", "Noodles", "Seafood"].map((term) => (
            <span
              key={term}
              className="rounded-pill bg-surface-tertiary px-4 py-1.5 text-text-primary transition-colors hover:bg-primary-light"
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
