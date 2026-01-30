/**
 * V8 Empty State Components - Enhanced with Page Personality
 *
 * Contextual empty state displays when no data is available.
 * Each variant includes animated icon, playful message, and action to resolve.
 * Phase 22: Enhanced with staggered animations and page-specific personality.
 */

"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
import { spring, staggerDelay } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

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
  /** CSS variable-based gradient style for icon area */
  gradientStyle: React.CSSProperties;
}

const variantConfigs: Record<EmptyStateVariant, EmptyStateConfig> = {
  cart: {
    icon: ShoppingBag,
    title: "Your cart is feeling lonely",
    description: "Add some delicious items from our menu to fill it up!",
    actionLabel: "Browse Menu",
    actionHref: "/menu",
    gradientStyle: {
      background: "linear-gradient(to bottom right, var(--color-secondary-light), var(--color-accent-orange-light))",
    },
  },
  search: {
    icon: Search,
    title: "No results found",
    description: "Try different keywords or browse our categories",
    actionLabel: "Clear Search",
    gradientStyle: {
      background: "linear-gradient(to bottom right, var(--color-accent-teal-light), var(--color-accent-magenta-light))",
    },
  },
  orders: {
    icon: Receipt,
    title: "No orders yet",
    description: "Your culinary journey awaits! Place your first order to begin.",
    actionLabel: "Start Your Journey",
    actionHref: "/menu",
    gradientStyle: {
      background: "linear-gradient(to bottom right, var(--color-accent-green-light), var(--color-accent-teal-light))",
    },
  },
  favorites: {
    icon: Heart,
    title: "No favorites saved",
    description: "Tap the heart on items you love to save them here",
    actionLabel: "Discover favorites",
    actionHref: "/menu",
    gradientStyle: {
      background: "linear-gradient(to bottom right, var(--color-accent-magenta-light), var(--color-primary-light))",
    },
  },
  "driver-route": {
    icon: Calendar,
    title: "No route assigned today",
    description: "Check back later for your delivery assignments",
    gradientStyle: {
      background: "linear-gradient(to bottom right, var(--color-surface-tertiary), var(--color-surface-secondary))",
    },
  },
  "admin-orders": {
    icon: Inbox,
    title: "No orders for this period",
    description: "Try adjusting your date filter to see more results",
    actionLabel: "Adjust filter",
    gradientStyle: {
      background: "linear-gradient(to bottom right, var(--color-accent-magenta-light), var(--color-primary-light))",
    },
  },
  exceptions: {
    icon: CheckCircle,
    title: "No exceptions - all good!",
    description: "All deliveries are running smoothly",
    isPositive: true,
    gradientStyle: {
      background: "linear-gradient(to bottom right, var(--color-accent-green-light), var(--color-status-success-bg))",
    },
  },
};

// ============================================
// ANIMATED ICON WRAPPER
// ============================================

interface AnimatedIconProps {
  Icon: LucideIcon;
  isPositive?: boolean;
  gradientStyle: React.CSSProperties;
  shouldAnimate: boolean;
}

function AnimatedIcon({
  Icon,
  isPositive,
  gradientStyle,
  shouldAnimate,
}: AnimatedIconProps) {
  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, scale: 0.6 } : undefined}
      animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
      transition={shouldAnimate ? { ...spring.ultraBouncy, delay: 0 } : undefined}
      className="relative mb-6"
    >
      {/* Static gradient blob background - removed infinite animation to prevent mobile crashes */}
      <div
        className="absolute inset-0 rounded-full blur-xl opacity-70"
        style={gradientStyle}
      />

      {/* Static icon container - removed infinite animations to prevent mobile crashes */}
      <div
        className={cn(
          "relative flex h-20 w-20 items-center justify-center rounded-full",
          isPositive
            ? "bg-green/10 text-green"
            : "bg-surface-tertiary/80 backdrop-blur-sm text-text-muted"
        )}
      >
        <Icon className="h-10 w-10" strokeWidth={1.5} />
      </div>
    </motion.div>
  );
}

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
  const { shouldAnimate, getSpring } = useAnimationPreference();
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

  const springConfig = getSpring(spring.default);

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0 } : undefined}
      animate={shouldAnimate ? { opacity: 1 } : undefined}
      transition={springConfig}
      className={cn(
        "flex flex-col items-center justify-center px-4 py-12 text-center",
        className
      )}
    >
      {/* Icon (fades in first) */}
      <AnimatedIcon
        Icon={Icon}
        isPositive={isPositive}
        gradientStyle={config.gradientStyle}
        shouldAnimate={shouldAnimate}
      />

      {/* Title (slides up second) */}
      <motion.h2
        initial={shouldAnimate ? { opacity: 0, y: 16 } : undefined}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
        transition={{ ...springConfig, delay: staggerDelay(1) }}
        className={cn(
          "mb-2 font-display text-xl font-bold",
          isPositive ? "text-green" : "text-text-primary"
        )}
      >
        {title}
      </motion.h2>

      {/* Description (slides up third) */}
      <motion.p
        initial={shouldAnimate ? { opacity: 0, y: 16 } : undefined}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
        transition={{ ...springConfig, delay: staggerDelay(2) }}
        className="mb-8 max-w-sm font-body text-text-secondary"
      >
        {displayDescription}
      </motion.p>

      {/* Action Button (scales in last) */}
      {actionLabel && (
        <motion.div
          initial={shouldAnimate ? { opacity: 0, scale: 0.9 } : undefined}
          animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
          transition={{ ...springConfig, delay: staggerDelay(3) }}
        >
          {actionHref ? (
            <Button asChild variant="primary" size="lg" className="shadow-elevated">
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
          ) : onAction ? (
            <Button variant="primary" size="lg" onClick={onAction} className="shadow-elevated">
              {actionLabel}
            </Button>
          ) : null}
        </motion.div>
      )}

      {/* Additional content */}
      {children && (
        <motion.div
          initial={shouldAnimate ? { opacity: 0, y: 16 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={{ ...springConfig, delay: staggerDelay(4) }}
        >
          {children}
        </motion.div>
      )}
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
