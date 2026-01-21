/**
 * Dynamic Import Utilities for TTI Optimization
 *
 * Centralizes dynamic imports for heavy components to improve
 * Time to Interactive (TTI) by deferring non-critical JavaScript.
 */

import dynamic from "next/dynamic";
import type { ComponentType, ReactElement } from "react";

/**
 * Loading fallback component for dynamic imports
 */
function LoadingFallback() {
  return (
    <div className="animate-pulse bg-muted rounded-lg h-48 w-full" />
  );
}

/**
 * Chart loading skeleton - taller for charts
 */
function ChartLoadingFallback() {
  return (
    <div className="animate-pulse bg-muted rounded-lg h-64 w-full" />
  );
}

/**
 * Map loading skeleton
 */
function MapLoadingFallback() {
  return (
    <div className="animate-pulse bg-muted rounded-lg h-80 w-full flex items-center justify-center">
      <span className="text-muted-foreground text-sm">Loading map...</span>
    </div>
  );
}

// ============================================
// Admin Components (heavy, admin-only)
// ============================================

/**
 * Revenue Chart - Recharts based
 * Only loaded on admin analytics pages
 */
export const DynamicRevenueChart = dynamic(
  () => import("@/components/admin/RevenueChart").then(mod => mod.RevenueChart),
  {
    loading: () => <ChartLoadingFallback />,
    ssr: false, // Charts don't benefit from SSR
  }
);

/**
 * Popular Items Chart
 */
export const DynamicPopularItems = dynamic(
  () => import("@/components/admin/PopularItems").then(mod => mod.PopularItems),
  {
    loading: () => <ChartLoadingFallback />,
    ssr: false,
  }
);

// ============================================
// Tracking Components (heavy, tracking-only)
// ============================================

/**
 * Delivery Map - Google Maps based
 * Only loaded on order tracking pages
 */
export const DynamicDeliveryMap = dynamic(
  () => import("@/components/tracking/DeliveryMap").then(mod => mod.DeliveryMap),
  {
    loading: () => <MapLoadingFallback />,
    ssr: false, // Maps require client-side rendering
  }
);

// ============================================
// Modal Components (lazy loaded)
// ============================================

/**
 * Item Detail Modal - heavy with animations
 * Lazy loaded when user clicks on menu item
 */
export const DynamicItemDetailModal = dynamic(
  () => import("@/components/menu/item-detail-modal").then(mod => mod.ItemDetailModal),
  {
    loading: () => null, // Modal shows instantly, no skeleton needed
    ssr: false,
  }
);

/**
 * Cart Drawer - heavy with animations
 * Lazy loaded when cart is first opened
 */
export const DynamicCartDrawer = dynamic(
  () => import("@/components/cart/CartDrawer").then(mod => mod.CartDrawer),
  {
    loading: () => null,
    ssr: false,
  }
);

// ============================================
// Utility Types
// ============================================

/**
 * Create a dynamic import with standard loading behavior
 */
export function createDynamicComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options?: {
    ssr?: boolean;
    loading?: () => ReactElement | null;
  }
) {
  return dynamic(importFn, {
    loading: options?.loading ?? (() => <LoadingFallback />),
    ssr: options?.ssr ?? true,
  });
}

/**
 * Prefetch a dynamic component
 * Call this on hover or viewport entry to warm the cache
 */
export function prefetchComponent(
  importFn: () => Promise<unknown>
): void {
  if (typeof window !== "undefined") {
    // Use requestIdleCallback for non-blocking prefetch
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(() => {
        importFn();
      });
    } else {
      // Fallback for Safari
      setTimeout(() => {
        importFn();
      }, 1);
    }
  }
}

/**
 * Prefetch functions for common components
 */
export const prefetch = {
  itemDetailModal: () => prefetchComponent(() => import("@/components/menu/item-detail-modal")),
  cartDrawer: () => prefetchComponent(() => import("@/components/cart/CartDrawer")),
  deliveryMap: () => prefetchComponent(() => import("@/components/tracking/DeliveryMap")),
};
