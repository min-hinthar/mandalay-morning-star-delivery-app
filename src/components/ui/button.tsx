"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils/cn";

/**
 * V5 Button System
 * High contrast design with bold interactive colors
 * Features continuous subtle shimmer on primary CTAs
 *
 * Sizes: sm (32px), md (40px), lg (48px), xl (56px - driver)
 * Variants: primary, secondary, ghost, danger, outline, link, success
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold",
    "transition-all duration-[var(--duration-fast)] ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-interactive-primary)]",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-[0.98]",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        // Primary: Saffron/Gold CTA - main actions with shimmer
        primary: [
          "bg-[var(--color-interactive-primary)] text-[var(--color-text-inverse)]",
          "shadow-[var(--elevation-2)]",
          "hover:bg-[var(--color-interactive-hover)] hover:shadow-[var(--elevation-3)] hover:-translate-y-0.5",
          "active:bg-[var(--color-interactive-active)] active:shadow-[var(--elevation-2)] active:translate-y-0",
          "animate-cta-shimmer",
        ].join(" "),

        // Secondary: Surface with interactive border
        secondary: [
          "bg-[var(--color-surface-primary)] text-[var(--color-text-primary)]",
          "border border-[var(--color-interactive-primary)]",
          "shadow-[var(--elevation-1)]",
          "hover:bg-[var(--color-interactive-primary-light)] hover:shadow-[var(--elevation-2)] hover:-translate-y-0.5",
          "active:shadow-[var(--elevation-1)] active:translate-y-0",
        ].join(" "),

        // Ghost: Transparent, subtle
        ghost: [
          "text-[var(--color-text-primary)]",
          "hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-interactive-primary)]",
          "active:bg-[var(--color-surface-tertiary)]",
        ].join(" "),

        // Danger: Destructive actions
        danger: [
          "bg-[var(--color-status-error)] text-[var(--color-text-inverse)]",
          "shadow-[var(--elevation-2)]",
          "hover:brightness-110 hover:shadow-[var(--elevation-3)] hover:-translate-y-0.5",
          "active:shadow-[var(--elevation-2)] active:translate-y-0",
        ].join(" "),

        // Success: Positive confirmation
        success: [
          "bg-[var(--color-status-success)] text-[var(--color-text-inverse)]",
          "shadow-[var(--elevation-2)]",
          "hover:bg-[var(--color-accent-secondary-hover)] hover:shadow-[var(--elevation-3)] hover:-translate-y-0.5",
          "active:bg-[var(--color-accent-secondary-active)] active:shadow-[var(--elevation-2)] active:translate-y-0",
        ].join(" "),

        // Outline: Border only
        outline: [
          "border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)]",
          "hover:border-[var(--color-interactive-primary)] hover:bg-[var(--color-interactive-primary)]/5 hover:text-[var(--color-interactive-primary)]",
          "active:bg-[var(--color-interactive-primary)]/10",
        ].join(" "),

        // Link: Text-only with underline
        link: [
          "text-[var(--color-interactive-primary)] underline-offset-4",
          "hover:underline hover:text-[var(--color-interactive-hover)]",
        ].join(" "),

        // Default: Maps to primary for backwards compatibility
        default: [
          "bg-[var(--color-interactive-primary)] text-[var(--color-text-inverse)]",
          "shadow-[var(--elevation-2)]",
          "hover:bg-[var(--color-interactive-hover)] hover:shadow-[var(--elevation-3)] hover:-translate-y-0.5",
          "active:bg-[var(--color-interactive-active)] active:shadow-[var(--elevation-2)] active:translate-y-0",
          "animate-cta-shimmer",
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
