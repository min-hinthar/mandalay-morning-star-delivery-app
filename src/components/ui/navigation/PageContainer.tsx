/**
 * V8 PageContainer Component
 * Consistent page spacing wrapper with responsive padding and max-width
 *
 * Features:
 * - Responsive horizontal padding (px-4 sm:px-6 lg:px-8)
 * - Configurable max-width with centering
 * - Optional top/bottom padding
 * - Extra mobile bottom padding for bottom nav clearance
 * - Polymorphic component (renders as any element via `as` prop)
 */

import { type ReactNode, type ElementType, type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils/cn";

// ============================================
// TYPES
// ============================================

const maxWidthConfig = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "7xl": "max-w-7xl",
  full: "max-w-full",
} as const;

type MaxWidthOption = keyof typeof maxWidthConfig;

export interface PageContainerProps<T extends ElementType = "div"> {
  /** Page content */
  children: ReactNode;
  /** Additional container classes */
  className?: string;
  /** Add top padding (default: true) */
  padTop?: boolean;
  /** Add bottom padding (default: true) */
  padBottom?: boolean;
  /** Max width variant (default: "7xl") */
  maxWidth?: MaxWidthOption;
  /** Element type to render (default: "div") */
  as?: T;
}

type PolymorphicProps<T extends ElementType> = PageContainerProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof PageContainerProps<T>>;

// ============================================
// PAGECONTAINER COMPONENT
// ============================================

export function PageContainer<T extends ElementType = "div">({
  children,
  className,
  padTop = true,
  padBottom = true,
  maxWidth = "7xl",
  as,
  ...restProps
}: PolymorphicProps<T>) {
  const Component = (as || "div") as "div";

  return (
    <Component
      className={cn(
        // Horizontal padding - responsive
        "px-4 sm:px-6 lg:px-8",
        // Centering
        "mx-auto",
        // Max width
        maxWidthConfig[maxWidth],
        // Vertical padding
        padTop && "pt-6 sm:pt-8",
        padBottom && "pb-20 sm:pb-8", // Extra mobile padding for bottom nav
        className
      )}
      {...(restProps as React.ComponentPropsWithoutRef<"div">)}
    >
      {children}
    </Component>
  );
}
