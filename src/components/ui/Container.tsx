/**
 * Container Component
 *
 * A responsive container with CSS Container Queries support.
 * Children can use @container queries to respond to container width.
 *
 * @example
 * // Basic usage
 * <Container size="lg">
 *   <Content />
 * </Container>
 *
 * @example
 * // Named container for nested queries
 * <Container size="lg" name="main">
 *   <div className="@container/main:flex">...</div>
 * </Container>
 *
 * @example
 * // Full width with no padding
 * <Container size="full" flush>
 *   <HeroSection />
 * </Container>
 */

import { type ElementType, type ReactNode, forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

// ============================================
// TYPES
// ============================================

export type ContainerSize = "sm" | "md" | "lg" | "xl" | "full";

export interface ContainerProps {
  /** Container max-width size */
  size?: ContainerSize;
  /** Remove horizontal padding */
  flush?: boolean;
  /** Center the container horizontally (default: true) */
  center?: boolean;
  /** Enable CSS container queries on this element */
  query?: boolean;
  /** Named container for targeted @container queries */
  name?: string;
  /** HTML element to render as */
  as?: ElementType;
  /** Additional CSS classes */
  className?: string;
  /** Child content */
  children?: ReactNode;
}

// ============================================
// SIZE CONFIGURATION
// ============================================

const sizeConfig: Record<ContainerSize, string> = {
  sm: "max-w-[640px]", // Prose, narrow content
  md: "max-w-[768px]", // Forms, cards
  lg: "max-w-[1024px]", // Default, most pages
  xl: "max-w-[1280px]", // Wide layouts
  full: "max-w-full", // Edge-to-edge
};

// ============================================
// COMPONENT
// ============================================

export const Container = forwardRef<HTMLElement, ContainerProps>(
  function Container(
    {
      size = "lg",
      flush = false,
      center = true,
      query = true,
      name,
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
          "w-full",
          // Max width based on size
          sizeConfig[size],
          // Horizontal padding (responsive)
          !flush && "px-4 sm:px-6 lg:px-8",
          // Center horizontally
          center && "mx-auto",
          // Custom classes
          className
        )}
        // CSS Container Query support
        style={{
          containerType: query ? "inline-size" : undefined,
          containerName: name || undefined,
        }}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Container.displayName = "Container";

// ============================================
// UTILITY CLASSES FOR CONTAINER QUERIES
// ============================================

/**
 * Container query breakpoints (use in Tailwind classes)
 *
 * These match the container sizes and can be used with @container syntax:
 * - @xs: 320px  (mobile small)
 * - @sm: 384px  (mobile)
 * - @md: 448px  (mobile large)
 * - @lg: 512px  (tablet small)
 * - @xl: 576px  (tablet)
 * - @2xl: 672px (tablet large)
 * - @3xl: 768px (desktop small)
 * - @4xl: 896px (desktop)
 * - @5xl: 1024px (desktop large)
 *
 * Usage in className:
 * "@md:grid-cols-2 @lg:grid-cols-3"
 *
 * For named containers:
 * "@md/main:grid-cols-2"
 */
export const containerBreakpoints = {
  xs: "320px",
  sm: "384px",
  md: "448px",
  lg: "512px",
  xl: "576px",
  "2xl": "672px",
  "3xl": "768px",
  "4xl": "896px",
  "5xl": "1024px",
} as const;
