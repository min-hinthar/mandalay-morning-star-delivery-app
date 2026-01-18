"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils/cn";

/**
 * V3 Button System
 * Premium Burmese aesthetic with saffron CTAs
 *
 * Sizes: sm (32px), md (40px), lg (48px), xl (56px - driver)
 * Variants: primary, secondary, ghost, danger, outline, link
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold",
    "transition-all duration-[var(--duration-fast)] ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-cta)]",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-[0.98]",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        // Primary: Saffron/Gold CTA - main actions
        primary: [
          "bg-[var(--color-cta)] text-white",
          "shadow-[var(--shadow-md)]",
          "hover:brightness-110 hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5",
          "active:shadow-[var(--shadow-md)] active:translate-y-0",
        ].join(" "),

        // Secondary: White with saffron border
        secondary: [
          "bg-white text-[var(--color-charcoal)]",
          "border border-[var(--color-cta)]",
          "shadow-[var(--shadow-sm)]",
          "hover:bg-[var(--color-cta-light)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5",
          "active:shadow-[var(--shadow-sm)] active:translate-y-0",
        ].join(" "),

        // Ghost: Transparent, subtle
        ghost: [
          "text-[var(--color-charcoal)]",
          "hover:bg-[var(--color-cream-darker)] hover:text-[var(--color-primary)]",
          "active:bg-[var(--color-cream-darker)]/80",
        ].join(" "),

        // Danger: Destructive actions
        danger: [
          "bg-[var(--color-error)] text-white",
          "shadow-[var(--shadow-md)]",
          "hover:brightness-110 hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5",
          "active:shadow-[var(--shadow-md)] active:translate-y-0",
        ].join(" "),

        // Outline: Border only (legacy compatibility)
        outline: [
          "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-charcoal)]",
          "hover:border-[var(--color-cta)]/50 hover:bg-[var(--color-cta)]/5 hover:text-[var(--color-primary)]",
          "active:bg-[var(--color-cta)]/10",
        ].join(" "),

        // Link: Text-only with underline
        link: [
          "text-[var(--color-primary)] underline-offset-4",
          "hover:underline hover:text-[var(--color-primary)]/80",
        ].join(" "),

        // Default: Maps to primary for backwards compatibility
        default: [
          "bg-[var(--color-cta)] text-white",
          "shadow-[var(--shadow-md)]",
          "hover:brightness-110 hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5",
          "active:shadow-[var(--shadow-md)] active:translate-y-0",
        ].join(" "),
      },

      size: {
        // V3 Sizes with exact pixel heights
        sm: "h-8 px-4 py-1.5 text-sm rounded-[var(--radius-sm)] [&_svg]:h-4 [&_svg]:w-4",
        md: "h-10 px-5 py-2 text-base rounded-[var(--radius-sm)] [&_svg]:h-4 [&_svg]:w-4",
        lg: "h-12 px-6 py-3 text-base rounded-[var(--radius-md)] [&_svg]:h-5 [&_svg]:w-5",
        xl: "h-14 px-8 py-4 text-lg rounded-[var(--radius-md)] [&_svg]:h-5 [&_svg]:w-5", // Driver size

        // Icon-only variants
        icon: "h-10 w-10 rounded-[var(--radius-sm)] [&_svg]:h-5 [&_svg]:w-5",
        "icon-sm": "h-8 w-8 rounded-[var(--radius-sm)] [&_svg]:h-4 [&_svg]:w-4",
        "icon-lg": "h-12 w-12 rounded-[var(--radius-md)] [&_svg]:h-5 [&_svg]:w-5",

        // Default maps to md
        default: "h-10 px-5 py-2 text-base rounded-[var(--radius-sm)] [&_svg]:h-4 [&_svg]:w-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render as a different element using Radix Slot */
  asChild?: boolean;
  /** Show loading spinner and disable button */
  isLoading?: boolean;
  /** Loading text to show (defaults to children) */
  loadingText?: string;
  /** Icon to show on the left side */
  leftIcon?: React.ReactNode;
  /** Icon to show on the right side */
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || isLoading;

    // For icon-only buttons, ensure we have an aria-label
    const isIconOnly = size?.toString().startsWith("icon");
    if (isIconOnly && !props["aria-label"] && process.env.NODE_ENV === "development") {
      console.warn("Button: Icon-only buttons should have an aria-label for accessibility");
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" aria-hidden="true" />
            <span className={loadingText ? undefined : "sr-only"}>
              {loadingText || "Loading..."}
            </span>
            {/* Keep original content in DOM but hidden to maintain width */}
            {!loadingText && <span className="invisible">{children}</span>}
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
