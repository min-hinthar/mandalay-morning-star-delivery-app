"use client";

import { useMediaQuery } from "./useMediaQuery";

/**
 * V5 Sprint 2.2 - Responsive Hooks
 *
 * Semantic responsive hooks that abstract away breakpoint values.
 * Uses CSS custom property values for consistency with design tokens.
 *
 * Breakpoints (matching Tailwind defaults):
 * - Mobile: < 640px (sm)
 * - Tablet: 640px - 1023px (sm to lg)
 * - Desktop: >= 1024px (lg+)
 */

// Breakpoint values (matches tokens.css and tailwind.config.ts)
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export type Breakpoint = keyof typeof breakpoints;

/**
 * Check if viewport is mobile (< 640px)
 * Use for mobile-specific layouts, bottom sheets, full-width drawers
 */
export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${breakpoints.sm - 1}px)`);
}

/**
 * Check if viewport is tablet (640px - 1023px)
 * Use for tablet-specific layouts, side-by-side content
 */
export function useIsTablet(): boolean {
  return useMediaQuery(
    `(min-width: ${breakpoints.sm}px) and (max-width: ${breakpoints.lg - 1}px)`
  );
}

/**
 * Check if viewport is desktop (>= 1024px)
 * Use for desktop layouts, multi-column content
 */
export function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${breakpoints.lg}px)`);
}

/**
 * Check if viewport is at least a certain breakpoint
 * @param breakpoint - Minimum breakpoint to check
 */
export function useBreakpoint(breakpoint: Breakpoint): boolean {
  return useMediaQuery(`(min-width: ${breakpoints[breakpoint]}px)`);
}

/**
 * Check if viewport is below a certain breakpoint
 * @param breakpoint - Maximum breakpoint to check
 */
export function useBreakpointDown(breakpoint: Breakpoint): boolean {
  return useMediaQuery(`(max-width: ${breakpoints[breakpoint] - 1}px)`);
}

/**
 * Check if viewport is between two breakpoints (inclusive of min)
 * @param minBreakpoint - Minimum breakpoint
 * @param maxBreakpoint - Maximum breakpoint (exclusive)
 */
export function useBreakpointBetween(
  minBreakpoint: Breakpoint,
  maxBreakpoint: Breakpoint
): boolean {
  return useMediaQuery(
    `(min-width: ${breakpoints[minBreakpoint]}px) and (max-width: ${breakpoints[maxBreakpoint] - 1}px)`
  );
}

/**
 * Get current breakpoint name
 * Returns the smallest breakpoint that the viewport is at or above
 */
export function useCurrentBreakpoint(): Breakpoint | "xs" {
  const isSm = useBreakpoint("sm");
  const isMd = useBreakpoint("md");
  const isLg = useBreakpoint("lg");
  const isXl = useBreakpoint("xl");
  const is2xl = useBreakpoint("2xl");

  if (is2xl) return "2xl";
  if (isXl) return "xl";
  if (isLg) return "lg";
  if (isMd) return "md";
  if (isSm) return "sm";
  return "xs";
}

/**
 * Check if device prefers touch input
 * Use for touch-optimized interactions (larger tap targets, swipe gestures)
 */
export function useIsTouchDevice(): boolean {
  return useMediaQuery("(pointer: coarse)");
}

/**
 * Check if device has hover capability
 * Use for hover-dependent interactions
 */
export function useCanHover(): boolean {
  return useMediaQuery("(hover: hover)");
}
