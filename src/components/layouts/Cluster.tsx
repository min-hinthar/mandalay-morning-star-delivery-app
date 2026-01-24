/**
 * V5 Cluster Component
 *
 * Horizontal flex layout with wrap support and consistent gap.
 * Perfect for tags, buttons, chips, and inline elements.
 *
 * @example
 * // Basic horizontal cluster
 * <Cluster gap="space-2">
 *   <Tag>Category</Tag>
 *   <Tag>Popular</Tag>
 *   <Tag>New</Tag>
 * </Cluster>
 *
 * @example
 * // Space between items
 * <Cluster gap="space-4" justify="between">
 *   <Logo />
 *   <Navigation />
 * </Cluster>
 *
 * @example
 * // No wrap (single line)
 * <Cluster gap="space-2" wrap={false}>
 *   <Button>Cancel</Button>
 *   <Button>Save</Button>
 * </Cluster>
 */

import { type ElementType, type ReactNode, forwardRef } from "react";
import { cn } from "@/lib/utils/cn";
import type { SpacingToken, FlexAlign, FlexJustify } from "@/types/layout";

// ============================================
// TYPES
// ============================================

export interface ClusterProps {
  /** Gap between children (spacing token) */
  gap?: SpacingToken;
  /** Vertical alignment of children */
  align?: Exclude<FlexAlign, "stretch">;
  /** Horizontal distribution of children */
  justify?: FlexJustify;
  /** Allow items to wrap to next line */
  wrap?: boolean;
  /** HTML element to render as */
  as?: ElementType;
  /** Additional CSS classes */
  className?: string;
  /** Child content */
  children?: ReactNode;
}

// ============================================
// MAPPING
// ============================================

const gapMap: Record<SpacingToken, string> = {
  "space-0": "gap-0",
  "space-1": "gap-1",
  "space-2": "gap-2",
  "space-3": "gap-3",
  "space-4": "gap-4",
  "space-5": "gap-5",
  "space-6": "gap-6",
  "space-8": "gap-8",
  "space-10": "gap-10",
  "space-12": "gap-12",
  "space-16": "gap-16",
  "space-20": "gap-20",
  "space-24": "gap-24",
};

const alignMap: Record<Exclude<FlexAlign, "stretch">, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  baseline: "items-baseline",
};

const justifyMap: Record<FlexJustify, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
  evenly: "justify-evenly",
};

// ============================================
// COMPONENT
// ============================================

export const Cluster = forwardRef<HTMLElement, ClusterProps>(function Cluster(
  {
    gap = "space-4",
    align = "center",
    justify = "start",
    wrap = true,
    as = "div",
    className,
    children,
    ...props
  },
  ref
) {
  const Component = as as "div";
  return (
    <Component
      ref={ref as React.Ref<HTMLDivElement>}
      className={cn(
        // Base styles
        "flex",
        // Wrap behavior
        wrap ? "flex-wrap" : "flex-nowrap",
        // Gap
        gapMap[gap],
        // Alignment
        alignMap[align],
        // Justification
        justifyMap[justify],
        // Custom classes
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
});

Cluster.displayName = "Cluster";
