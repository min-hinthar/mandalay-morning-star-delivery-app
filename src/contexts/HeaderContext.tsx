"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useScrollDirection } from "@/lib/hooks/useScrollDirection";

/**
 * V5 Sprint 2.7 - HeaderContext Provider
 *
 * Unified header height and collapse state management.
 * Provides consistent header behavior across all layouts.
 *
 * Features:
 * - Dynamic header height tracking
 * - Scroll-direction-aware collapse
 * - Force expand/collapse API
 * - CSS variable sync
 *
 * @example
 * // Wrap app with provider
 * <HeaderProvider>
 *   <CustomerLayout>...</CustomerLayout>
 * </HeaderProvider>
 *
 * @example
 * // Use in components
 * const { height, isCollapsed, forceExpand } = useHeader();
 */

// ============================================
// TYPES
// ============================================

export type HeaderVariant = "customer" | "driver" | "admin" | "checkout";

export interface HeaderConfig {
  /** Height in pixels */
  height: number;
  /** Whether header can collapse on scroll */
  collapsible: boolean;
  /** Scroll threshold before collapse */
  collapseThreshold: number;
}

const headerConfigs: Record<HeaderVariant, HeaderConfig> = {
  customer: {
    height: 56,
    collapsible: true,
    collapseThreshold: 100,
  },
  driver: {
    height: 48,
    collapsible: false,
    collapseThreshold: 0,
  },
  admin: {
    height: 64,
    collapsible: false,
    collapseThreshold: 0,
  },
  checkout: {
    height: 56,
    collapsible: false,
    collapseThreshold: 0,
  },
};

interface HeaderContextValue {
  /** Current header variant */
  variant: HeaderVariant;
  /** Header height in pixels */
  height: number;
  /** Whether header is currently collapsed */
  isCollapsed: boolean;
  /** Whether user is at top of page */
  isAtTop: boolean;
  /** Current scroll position */
  scrollY: number;
  /** Whether header can collapse */
  isCollapsible: boolean;
  /** Force header to expand */
  forceExpand: () => void;
  /** Force header to collapse */
  forceCollapse: () => void;
  /** Reset to scroll-based behavior */
  resetCollapse: () => void;
  /** Set header variant */
  setVariant: (variant: HeaderVariant) => void;
  /** CSS offset value (for sticky content below header) */
  offsetTop: string;
}

// ============================================
// CONTEXT
// ============================================

const HeaderContext = createContext<HeaderContextValue | null>(null);

// ============================================
// PROVIDER
// ============================================

interface HeaderProviderProps {
  children: ReactNode;
  /** Initial header variant */
  initialVariant?: HeaderVariant;
}

export function HeaderProvider({
  children,
  initialVariant = "customer",
}: HeaderProviderProps) {
  const [variant, setVariant] = useState<HeaderVariant>(initialVariant);
  const [forceState, setForceState] = useState<"expanded" | "collapsed" | null>(null);

  const config = headerConfigs[variant];

  // Scroll direction tracking
  const { isCollapsed: scrollCollapsed, isAtTop, scrollY } = useScrollDirection({
    threshold: config.collapseThreshold > 0 ? config.collapseThreshold : 10,
  });

  // Determine actual collapse state
  const isCollapsed = useMemo(() => {
    // Force states override scroll behavior
    if (forceState === "expanded") return false;
    if (forceState === "collapsed") return true;

    // Non-collapsible headers never collapse
    if (!config.collapsible) return false;

    // Use scroll-based collapse
    return scrollCollapsed;
  }, [forceState, config.collapsible, scrollCollapsed]);

  // API methods
  const forceExpand = useCallback(() => {
    setForceState("expanded");
  }, []);

  const forceCollapse = useCallback(() => {
    if (config.collapsible) {
      setForceState("collapsed");
    }
  }, [config.collapsible]);

  const resetCollapse = useCallback(() => {
    setForceState(null);
  }, []);

  // CSS offset value
  const offsetTop = `${config.height}px`;

  // Sync CSS variable
  // Note: This could also be done in useEffect for SSR compatibility
  if (typeof document !== "undefined") {
    document.documentElement.style.setProperty("--header-height", offsetTop);
  }

  const value = useMemo<HeaderContextValue>(
    () => ({
      variant,
      height: config.height,
      isCollapsed,
      isAtTop,
      scrollY,
      isCollapsible: config.collapsible,
      forceExpand,
      forceCollapse,
      resetCollapse,
      setVariant,
      offsetTop,
    }),
    [
      variant,
      config.height,
      config.collapsible,
      isCollapsed,
      isAtTop,
      scrollY,
      forceExpand,
      forceCollapse,
      resetCollapse,
      offsetTop,
    ]
  );

  return (
    <HeaderContext.Provider value={value}>{children}</HeaderContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

/**
 * Access header context values
 * Must be used within HeaderProvider
 */
export function useHeader(): HeaderContextValue {
  const context = useContext(HeaderContext);
  if (!context) {
    throw new Error("useHeader must be used within HeaderProvider");
  }
  return context;
}

/**
 * Get header height without full context
 * Safe to use outside provider (returns default)
 */
export function useHeaderHeight(variant: HeaderVariant = "customer"): number {
  const context = useContext(HeaderContext);
  if (context) {
    return context.height;
  }
  return headerConfigs[variant].height;
}

/**
 * Get header offset for sticky positioning
 * Returns CSS value like "56px" or "var(--header-height)"
 */
export function useHeaderOffset(): string {
  const context = useContext(HeaderContext);
  if (context) {
    return context.offsetTop;
  }
  return "var(--header-height, 56px)";
}

// ============================================
// HOOK FOR HEADER COMPONENT
// ============================================

/**
 * Hook for header components to get styling props
 *
 * @example
 * const { style, className, ariaHidden } = useHeaderStyles();
 *
 * return (
 *   <motion.header
 *     style={style}
 *     className={className}
 *     aria-hidden={ariaHidden}
 *     animate={{ y: isCollapsed ? -height : 0 }}
 *   >
 *     ...
 *   </motion.header>
 * );
 */
export function useHeaderStyles() {
  const { height, isCollapsed, isCollapsible } = useHeader();

  return {
    style: {
      height: `${height}px`,
      "--header-height": `${height}px`,
    } as React.CSSProperties,
    className: isCollapsible
      ? "transition-transform duration-200 ease-out"
      : "",
    isCollapsed,
    ariaHidden: isCollapsed,
    transformY: isCollapsed ? -height : 0,
  };
}

// ============================================
// EXPORTS
// ============================================

export { headerConfigs };
