/**
 * V5 Layout Type Definitions
 *
 * Shared types for layout primitive components.
 */

/**
 * Spacing token values that map to CSS custom properties.
 * Use these with Stack, Cluster, and Grid components.
 */
export type SpacingToken =
  | "space-0"
  | "space-1"
  | "space-2"
  | "space-3"
  | "space-4"
  | "space-5"
  | "space-6"
  | "space-8"
  | "space-10"
  | "space-12"
  | "space-16"
  | "space-20"
  | "space-24";

/**
 * Alignment options for flex layouts
 */
export type FlexAlign = "start" | "center" | "end" | "stretch" | "baseline";

/**
 * Justification options for flex layouts
 */
export type FlexJustify = "start" | "center" | "end" | "between" | "around" | "evenly";

/**
 * Responsive column configuration for Grid
 */
export type ResponsiveCols = {
  /** Base columns (mobile-first) */
  base?: number;
  /** 640px and up */
  sm?: number;
  /** 768px and up */
  md?: number;
  /** 1024px and up */
  lg?: number;
  /** 1280px and up */
  xl?: number;
};
