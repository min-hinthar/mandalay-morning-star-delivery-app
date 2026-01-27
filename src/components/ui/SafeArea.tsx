/**
 * SafeArea Component
 *
 * Handles safe area insets for modern mobile devices:
 * - iOS notch and Dynamic Island
 * - iPhone home indicator
 * - Android punch-holes and gesture navigation
 *
 * Requires viewport-fit=cover in the viewport meta tag.
 *
 * @example
 * // Full safe area wrapper
 * <SafeArea edges={['top', 'bottom']}>
 *   <AppContent />
 * </SafeArea>
 *
 * @example
 * // Bottom safe area for fixed footer
 * <SafeArea edges={['bottom']} min="space-4">
 *   <BottomNav />
 * </SafeArea>
 *
 * @example
 * // Header with top safe area
 * <SafeArea edges={['top']} as="header">
 *   <Header />
 * </SafeArea>
 */

import { type ElementType, type ReactNode, forwardRef, useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import type { SpacingToken } from "@/types/layout";

// ============================================
// TYPES
// ============================================

export type SafeAreaEdge = "top" | "bottom" | "left" | "right";

export interface SafeAreaProps {
  /** Which edges to apply safe area insets */
  edges?: SafeAreaEdge[];
  /** Apply as padding or margin */
  mode?: "padding" | "margin";
  /** Minimum spacing even without safe area */
  min?: SpacingToken;
  /** HTML element to render as */
  as?: ElementType;
  /** Additional CSS classes */
  className?: string;
  /** Child content */
  children?: ReactNode;
}

// ============================================
// SPACING MAP
// ============================================

const spacingMap: Record<SpacingToken, string> = {
  "space-0": "0px",
  "space-1": "0.25rem",
  "space-2": "0.5rem",
  "space-3": "0.75rem",
  "space-4": "1rem",
  "space-5": "1.25rem",
  "space-6": "1.5rem",
  "space-8": "2rem",
  "space-10": "2.5rem",
  "space-12": "3rem",
  "space-16": "4rem",
  "space-20": "5rem",
  "space-24": "6rem",
};

// ============================================
// COMPONENT
// ============================================

export const SafeArea = forwardRef<HTMLElement, SafeAreaProps>(
  function SafeArea(
    {
      edges = ["top", "bottom", "left", "right"],
      mode = "padding",
      min,
      as = "div",
      className,
      children,
      ...props
    },
    ref
  ) {
    const Component = as as "div";
    // Build style object for safe area insets
    const safeAreaStyle = useMemo(() => {
      const style: Record<string, string> = {};
      const minValue = min ? spacingMap[min] : "0px";
      const prefix = mode === "padding" ? "padding" : "margin";

      if (edges.includes("top")) {
        style[`${prefix}Top`] = `max(env(safe-area-inset-top, 0px), ${minValue})`;
      }
      if (edges.includes("bottom")) {
        style[`${prefix}Bottom`] = `max(env(safe-area-inset-bottom, 0px), ${minValue})`;
      }
      if (edges.includes("left")) {
        style[`${prefix}Left`] = `max(env(safe-area-inset-left, 0px), ${minValue})`;
      }
      if (edges.includes("right")) {
        style[`${prefix}Right`] = `max(env(safe-area-inset-right, 0px), ${minValue})`;
      }

      return style;
    }, [edges, mode, min]);

    return (
      <Component
        ref={ref as React.Ref<HTMLDivElement>}
        className={cn(className)}
        style={safeAreaStyle}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

SafeArea.displayName = "SafeArea";

// ============================================
// UTILITY HOOKS
// ============================================

/**
 * Get safe area inset values as CSS custom properties.
 * Useful for custom positioning calculations.
 *
 * @example
 * const insets = useSafeAreaInsets();
 * // Returns: { top: 'env(safe-area-inset-top)', ... }
 */
export function getSafeAreaInsets() {
  return {
    top: "env(safe-area-inset-top, 0px)",
    bottom: "env(safe-area-inset-bottom, 0px)",
    left: "env(safe-area-inset-left, 0px)",
    right: "env(safe-area-inset-right, 0px)",
  };
}

// ============================================
// CSS UTILITY CLASSES
// ============================================

/**
 * Tailwind-compatible safe area utility class names.
 * These require the safe-area utilities in tokens.css.
 *
 * Usage: className={safeAreaClasses.paddingTop}
 */
export const safeAreaClasses = {
  // Padding
  paddingTop: "pt-safe",
  paddingBottom: "pb-safe",
  paddingLeft: "pl-safe",
  paddingRight: "pr-safe",
  paddingX: "px-safe",
  paddingY: "py-safe",
  padding: "p-safe",
  // Margin
  marginTop: "mt-safe",
  marginBottom: "mb-safe",
  marginLeft: "ml-safe",
  marginRight: "mr-safe",
  marginX: "mx-safe",
  marginY: "my-safe",
  margin: "m-safe",
} as const;
