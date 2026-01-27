/**
 * Stack Component
 *
 * Vertical flex layout with consistent gap between children.
 * Uses CSS gap property (not margins) for reliable spacing.
 *
 * @example
 * // Basic vertical stack
 * <Stack gap="space-4">
 *   <Header />
 *   <Content />
 *   <Footer />
 * </Stack>
 *
 * @example
 * // With dividers between items
 * <Stack gap="space-6" divider>
 *   <Section1 />
 *   <Section2 />
 *   <Section3 />
 * </Stack>
 *
 * @example
 * // Centered content
 * <Stack gap="space-4" align="center">
 *   <Icon />
 *   <Text />
 * </Stack>
 */

import {
  type ElementType,
  type ReactNode,
  forwardRef,
  Children,
  isValidElement,
  Fragment,
} from "react";
import { cn } from "@/lib/utils/cn";
import type { SpacingToken, FlexAlign } from "@/types/layout";

// ============================================
// TYPES
// ============================================

export interface StackProps {
  /** Gap between children (spacing token) */
  gap?: SpacingToken;
  /** Horizontal alignment of children */
  align?: FlexAlign;
  /** Add dividers between children */
  divider?: boolean | ReactNode;
  /** HTML element to render as */
  as?: ElementType;
  /** Additional CSS classes */
  className?: string;
  /** Child content */
  children?: ReactNode;
}

// ============================================
// GAP MAPPING
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

const alignMap: Record<FlexAlign, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
};

// ============================================
// COMPONENT
// ============================================

export const Stack = forwardRef<HTMLElement, StackProps>(function Stack(
  {
    gap = "space-4",
    align = "stretch",
    divider,
    as = "div",
    className,
    children,
    ...props
  },
  ref
) {
  const Component = as as "div";
  // If divider is provided, we need to interleave dividers between children
  const renderChildren = () => {
    if (!divider) return children;

    const childArray = Children.toArray(children).filter(isValidElement);
    const dividerElement =
      divider === true ? (
        <hr className="border-t border-border-default w-full" />
      ) : (
        divider
      );

    return childArray.map((child, index) => (
      <Fragment key={index}>
        {child}
        {index < childArray.length - 1 && dividerElement}
      </Fragment>
    ));
  };

  return (
    <Component
      ref={ref as React.Ref<HTMLDivElement>}
      className={cn(
        // Base styles
        "flex flex-col",
        // Gap
        gapMap[gap],
        // Alignment
        alignMap[align],
        // Custom classes
        className
      )}
      {...props}
    >
      {renderChildren()}
    </Component>
  );
});

Stack.displayName = "Stack";
