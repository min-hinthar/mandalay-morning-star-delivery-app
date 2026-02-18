/**
 * V8 Empty State Components - Enhanced with Page Personality
 *
 * Contextual empty state displays when no data is available.
 * Each variant includes animated icon, playful message, and action to resolve.
 * Phase 22: Enhanced with staggered animations and page-specific personality.
 * Phase 57: Added admin/driver emoji variants with floating animation.
 */

"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { spring, staggerDelay } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { type EmptyStateVariant, variantConfigs } from "./empty-state-variants";

export type { EmptyStateVariant };

// ============================================
// ANIMATED ICON WRAPPER
// ============================================

interface AnimatedIconProps {
  Icon?: LucideIcon;
  emoji?: string;
  isPositive?: boolean;
  gradientStyle: React.CSSProperties;
  shouldAnimate: boolean;
}

function AnimatedIcon({
  Icon,
  emoji,
  isPositive,
  gradientStyle,
  shouldAnimate,
}: AnimatedIconProps) {
  // Emoji composition variant
  if (emoji) {
    return (
      <m.div
        initial={shouldAnimate ? { opacity: 0, scale: 0.6 } : undefined}
        animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
        transition={shouldAnimate ? { ...spring.ultraBouncy, delay: 0 } : undefined}
        className="relative mb-6"
      >
        <div className="absolute inset-0 rounded-full blur-xl opacity-70" style={gradientStyle} />
        <m.span
          animate={shouldAnimate ? { y: [0, -6, 0] } : undefined}
          transition={shouldAnimate ? { duration: 3, repeat: 5, ease: "easeInOut" } : undefined}
          className="relative text-5xl select-none"
          role="img"
          aria-hidden="true"
        >
          {emoji}
        </m.span>
      </m.div>
    );
  }

  // Lucide icon variant (original)
  if (!Icon) return null;

  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, scale: 0.6 } : undefined}
      animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
      transition={shouldAnimate ? { ...spring.ultraBouncy, delay: 0 } : undefined}
      className="relative mb-6"
    >
      <div className="absolute inset-0 rounded-full blur-xl opacity-70" style={gradientStyle} />
      <div
        className={cn(
          "relative flex h-20 w-20 items-center justify-center rounded-full",
          isPositive
            ? "bg-green/10 text-green"
            : // MOBILE CRASH PREVENTION: No backdrop-blur on mobile (causes Safari crashes)
              "bg-surface-tertiary sm:bg-surface-tertiary/80 sm:backdrop-blur-sm text-text-muted"
        )}
      >
        <Icon className="h-10 w-10" strokeWidth={1.5} />
      </div>
    </m.div>
  );
}

// ============================================
// EMPTY STATE COMPONENT
// ============================================

export interface EmptyStateProps {
  variant?: EmptyStateVariant;
  icon?: LucideIcon;
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  searchQuery?: string;
  children?: ReactNode;
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
  const emoji = config.emoji;
  const title = customTitle ?? config.title;
  const description = customDescription ?? config.description;
  const actionLabel = customActionLabel ?? config.actionLabel;
  const actionHref = customActionHref ?? config.actionHref;
  const isPositive = config.isPositive;

  const displayDescription =
    variant === "search" && searchQuery
      ? `No results for "${searchQuery}". ${description}`
      : description;

  const springConfig = getSpring(spring.default);

  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0 } : undefined}
      animate={shouldAnimate ? { opacity: 1 } : undefined}
      transition={springConfig}
      className={cn("flex flex-col items-center justify-center px-4 py-12 text-center", className)}
    >
      <AnimatedIcon
        Icon={Icon}
        emoji={emoji}
        isPositive={isPositive}
        gradientStyle={config.gradientStyle}
        shouldAnimate={shouldAnimate}
      />

      <m.h2
        initial={shouldAnimate ? { opacity: 0, y: 16 } : undefined}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
        transition={{ ...springConfig, delay: staggerDelay(1) }}
        className={cn(
          "mb-2 font-display text-xl font-bold",
          isPositive ? "text-green" : "text-text-primary"
        )}
      >
        {title}
      </m.h2>

      <m.p
        initial={shouldAnimate ? { opacity: 0, y: 16 } : undefined}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
        transition={{ ...springConfig, delay: staggerDelay(2) }}
        className="mb-8 max-w-sm font-body text-text-secondary"
      >
        {displayDescription}
      </m.p>

      {actionLabel && (
        <m.div
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
        </m.div>
      )}

      {children && (
        <m.div
          initial={shouldAnimate ? { opacity: 0, y: 16 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={{ ...springConfig, delay: staggerDelay(4) }}
        >
          {children}
        </m.div>
      )}
    </m.div>
  );
}

// ============================================
// SPECIALIZED EMPTY STATES
// ============================================

export function CartEmptyState() {
  return <EmptyState variant="cart" />;
}

export function SearchEmptyState({ query, onClear }: { query?: string; onClear?: () => void }) {
  return (
    <EmptyState variant="search" searchQuery={query} onAction={onClear}>
      <div className="mt-6 font-body text-sm text-text-muted">
        <p className="mb-3 font-medium text-text-secondary">Popular searches:</p>
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

export function OrdersEmptyState() {
  return <EmptyState variant="orders" />;
}

export function FavoritesEmptyState() {
  return <EmptyState variant="favorites" />;
}

export function DriverRouteEmptyState() {
  return <EmptyState variant="driver-route" />;
}

export function AdminOrdersEmptyState({ onAdjustFilter }: { onAdjustFilter?: () => void }) {
  return <EmptyState variant="admin-orders" onAction={onAdjustFilter} />;
}

export function ExceptionsEmptyState() {
  return <EmptyState variant="exceptions" />;
}

export function AdminDriversEmptyState({ onAddDriver }: { onAddDriver?: () => void }) {
  return <EmptyState variant="admin-drivers" onAction={onAddDriver} />;
}

export function AdminRoutesEmptyState({ onCreateRoute }: { onCreateRoute?: () => void }) {
  return <EmptyState variant="admin-routes" onAction={onCreateRoute} />;
}

export function DriverHistoryEmptyState() {
  return <EmptyState variant="driver-history" />;
}

export function AdminOrdersFilteredEmptyState({ onClearFilters }: { onClearFilters?: () => void }) {
  return <EmptyState variant="admin-orders-filtered" onAction={onClearFilters} />;
}

export function AdminDriversFilteredEmptyState({ onClearSearch }: { onClearSearch?: () => void }) {
  return <EmptyState variant="admin-drivers-filtered" onAction={onClearSearch} />;
}

export function AdminRoutesFilteredEmptyState({ onClearFilters }: { onClearFilters?: () => void }) {
  return <EmptyState variant="admin-routes-filtered" onAction={onClearFilters} />;
}
