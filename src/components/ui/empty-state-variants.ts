/**
 * EmptyState variant configuration data
 * Extracted from EmptyState.tsx to stay under 400-line limit
 */

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
  | "exceptions"
  | "admin-drivers"
  | "admin-routes"
  | "driver-history"
  | "admin-orders-filtered"
  | "admin-drivers-filtered"
  | "admin-routes-filtered";

export interface EmptyStateConfig {
  icon?: LucideIcon;
  /** Emoji composition (for admin/driver variants) */
  emoji?: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  isPositive?: boolean;
  /** CSS variable-based gradient style for icon area */
  gradientStyle: React.CSSProperties;
}

// ============================================
// VARIANT CONFIGS
// ============================================

export const variantConfigs: Record<EmptyStateVariant, EmptyStateConfig> = {
  cart: {
    icon: ShoppingBag,
    title: "Your cart is feeling lonely",
    description: "Add some delicious items from our menu to fill it up!",
    actionLabel: "Browse Menu",
    actionHref: "/menu",
    gradientStyle: {
      background:
        "linear-gradient(to bottom right, var(--color-secondary-light), var(--color-accent-orange-light))",
    },
  },
  search: {
    icon: Search,
    title: "No results found",
    description: "Try different keywords or browse our categories",
    actionLabel: "Clear Search",
    gradientStyle: {
      background:
        "linear-gradient(to bottom right, var(--color-accent-teal-light), var(--color-accent-magenta-light))",
    },
  },
  orders: {
    icon: Receipt,
    title: "No orders yet",
    description: "Your culinary journey awaits! Place your first order to begin.",
    actionLabel: "Start Your Journey",
    actionHref: "/menu",
    gradientStyle: {
      background:
        "linear-gradient(to bottom right, var(--color-accent-green-light), var(--color-accent-teal-light))",
    },
  },
  favorites: {
    icon: Heart,
    title: "No favorites saved",
    description: "Tap the heart on items you love to save them here",
    actionLabel: "Discover favorites",
    actionHref: "/menu",
    gradientStyle: {
      background:
        "linear-gradient(to bottom right, var(--color-accent-magenta-light), var(--color-primary-light))",
    },
  },
  "driver-route": {
    icon: Calendar,
    title: "No route assigned today",
    description: "Check back later for your delivery assignments",
    gradientStyle: {
      background:
        "linear-gradient(to bottom right, var(--color-surface-tertiary), var(--color-surface-secondary))",
    },
  },
  "admin-orders": {
    icon: Inbox,
    title: "No orders for this period",
    description: "Try adjusting your date filter to see more results",
    actionLabel: "Adjust filter",
    gradientStyle: {
      background:
        "linear-gradient(to bottom right, var(--color-accent-magenta-light), var(--color-primary-light))",
    },
  },
  exceptions: {
    icon: CheckCircle,
    title: "No exceptions - all good!",
    description: "All deliveries are running smoothly",
    isPositive: true,
    gradientStyle: {
      background:
        "linear-gradient(to bottom right, var(--color-accent-green-light), var(--color-status-success-bg))",
    },
  },
  "admin-drivers": {
    emoji: "\u{1F468}\u200D\u{1F373}\u{1F697}\u{1F469}\u200D\u{1F373}",
    title: "No drivers yet",
    description: "Your delivery team is waiting to be assembled",
    actionLabel: "Add Driver",
    gradientStyle: {
      background:
        "linear-gradient(to bottom right, var(--color-accent-teal-light), var(--color-accent-green-light))",
    },
  },
  "admin-routes": {
    emoji: "\u{1F5FA}\uFE0F\u{1F69A}\u{1F4CD}",
    title: "No routes planned",
    description: "Time to map out today's deliveries",
    actionLabel: "Create Route",
    gradientStyle: {
      background:
        "linear-gradient(to bottom right, var(--color-accent-teal-light), var(--color-accent-orange-light))",
    },
  },
  "driver-history": {
    emoji: "\u{1F4CB}\u{1F550}\u{1F4E6}",
    title: "No delivery history yet",
    description: "Your past routes and deliveries will appear here",
    gradientStyle: {
      background:
        "linear-gradient(to bottom right, var(--color-surface-tertiary), var(--color-surface-secondary))",
    },
  },
  "admin-orders-filtered": {
    emoji: "\u{1F50D}\u{1F35C}",
    title: "No matching orders",
    description: "Try adjusting your filters to see more results",
    actionLabel: "Clear Filters",
    gradientStyle: {
      background:
        "linear-gradient(to bottom right, var(--color-accent-magenta-light), var(--color-primary-light))",
    },
  },
  "admin-drivers-filtered": {
    emoji: "\u{1F50D}\u{1F468}\u200D\u{1F373}",
    title: "No matching drivers",
    description: "Try adjusting your search to see more results",
    actionLabel: "Clear Search",
    gradientStyle: {
      background:
        "linear-gradient(to bottom right, var(--color-accent-teal-light), var(--color-accent-magenta-light))",
    },
  },
  "admin-routes-filtered": {
    emoji: "\u{1F50D}\u{1F5FA}\uFE0F",
    title: "No matching routes",
    description: "Try a different date or filter to see routes",
    actionLabel: "Clear Filters",
    gradientStyle: {
      background:
        "linear-gradient(to bottom right, var(--color-accent-orange-light), var(--color-accent-teal-light))",
    },
  },
};
