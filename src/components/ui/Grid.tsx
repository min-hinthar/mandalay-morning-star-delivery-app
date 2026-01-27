/**
 * Grid Component
 *
 * CSS Grid layout with responsive column support and auto-fit capability.
 *
 * @example
 * // Fixed columns
 * <Grid cols={3} gap="space-6">
 *   <Card /><Card /><Card />
 * </Grid>
 *
 * @example
 * // Responsive columns
 * <Grid cols={{ base: 1, sm: 2, lg: 3 }} gap="space-4">
 *   <MenuItem /><MenuItem /><MenuItem />
 * </Grid>
 *
 * @example
 * // Auto-fit (responsive without breakpoints)
 * <Grid autoFit minChildWidth="280px" gap="space-4">
 *   {items.map(item => <Card key={item.id} />)}
 * </Grid>
 */

import { type ElementType, type ReactNode, forwardRef, useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import type { SpacingToken, ResponsiveCols } from "@/types/layout";

// ============================================
// TYPES
// ============================================

export interface GridProps {
  /** Number of columns (fixed or responsive) */
  cols?: number | ResponsiveCols;
  /** Gap between grid items */
  gap?: SpacingToken;
  /** Row gap (defaults to gap) */
  rowGap?: SpacingToken;
  /** Column gap (defaults to gap) */
  colGap?: SpacingToken;
  /** Use auto-fit with minmax for fluid responsive */
  autoFit?: boolean;
  /** Minimum child width for autoFit (e.g., "280px") */
  minChildWidth?: string;
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

const rowGapMap: Record<SpacingToken, string> = {
  "space-0": "gap-y-0",
  "space-1": "gap-y-1",
  "space-2": "gap-y-2",
  "space-3": "gap-y-3",
  "space-4": "gap-y-4",
  "space-5": "gap-y-5",
  "space-6": "gap-y-6",
  "space-8": "gap-y-8",
  "space-10": "gap-y-10",
  "space-12": "gap-y-12",
  "space-16": "gap-y-16",
  "space-20": "gap-y-20",
  "space-24": "gap-y-24",
};

const colGapMap: Record<SpacingToken, string> = {
  "space-0": "gap-x-0",
  "space-1": "gap-x-1",
  "space-2": "gap-x-2",
  "space-3": "gap-x-3",
  "space-4": "gap-x-4",
  "space-5": "gap-x-5",
  "space-6": "gap-x-6",
  "space-8": "gap-x-8",
  "space-10": "gap-x-10",
  "space-12": "gap-x-12",
  "space-16": "gap-x-16",
  "space-20": "gap-x-20",
  "space-24": "gap-x-24",
};

// Column classes for each breakpoint
const colsClasses: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
  7: "grid-cols-7",
  8: "grid-cols-8",
  9: "grid-cols-9",
  10: "grid-cols-10",
  11: "grid-cols-11",
  12: "grid-cols-12",
};

const smColsClasses: Record<number, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
  5: "sm:grid-cols-5",
  6: "sm:grid-cols-6",
};

const mdColsClasses: Record<number, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
  6: "md:grid-cols-6",
};

const lgColsClasses: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
};

const xlColsClasses: Record<number, string> = {
  1: "xl:grid-cols-1",
  2: "xl:grid-cols-2",
  3: "xl:grid-cols-3",
  4: "xl:grid-cols-4",
  5: "xl:grid-cols-5",
  6: "xl:grid-cols-6",
};

// ============================================
// HELPERS
// ============================================

function getResponsiveColsClasses(cols: ResponsiveCols): string {
  const classes: string[] = [];

  if (cols.base && colsClasses[cols.base]) {
    classes.push(colsClasses[cols.base]);
  }
  if (cols.sm && smColsClasses[cols.sm]) {
    classes.push(smColsClasses[cols.sm]);
  }
  if (cols.md && mdColsClasses[cols.md]) {
    classes.push(mdColsClasses[cols.md]);
  }
  if (cols.lg && lgColsClasses[cols.lg]) {
    classes.push(lgColsClasses[cols.lg]);
  }
  if (cols.xl && xlColsClasses[cols.xl]) {
    classes.push(xlColsClasses[cols.xl]);
  }

  return classes.join(" ");
}

// ============================================
// COMPONENT
// ============================================

export const Grid = forwardRef<HTMLElement, GridProps>(function Grid(
  {
    cols,
    gap = "space-4",
    rowGap,
    colGap,
    autoFit = false,
    minChildWidth = "250px",
    as = "div",
    className,
    children,
    ...props
  },
  ref
) {
  const Component = as as "div";
  // Determine gap classes
  const gapClasses = useMemo(() => {
    if (rowGap || colGap) {
      return cn(
        rowGap ? rowGapMap[rowGap] : rowGapMap[gap],
        colGap ? colGapMap[colGap] : colGapMap[gap]
      );
    }
    return gapMap[gap];
  }, [gap, rowGap, colGap]);

  // Determine column classes
  const colClasses = useMemo(() => {
    if (autoFit) return ""; // Handled via inline style
    if (!cols) return colsClasses[1]; // Default to 1 column

    if (typeof cols === "number") {
      return colsClasses[cols] || colsClasses[1];
    }

    return getResponsiveColsClasses(cols);
  }, [cols, autoFit]);

  // Auto-fit style
  const autoFitStyle = autoFit
    ? {
        gridTemplateColumns: `repeat(auto-fit, minmax(min(${minChildWidth}, 100%), 1fr))`,
      }
    : undefined;

  return (
    <Component
      ref={ref as React.Ref<HTMLDivElement>}
      className={cn(
        // Base styles
        "grid",
        // Gap
        gapClasses,
        // Columns (if not autoFit)
        !autoFit && colClasses,
        // Custom classes
        className
      )}
      style={autoFitStyle}
      {...props}
    >
      {children}
    </Component>
  );
});

Grid.displayName = "Grid";
