"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils/cn";

/**
 * V6 Button System - Pepper Aesthetic
 * Playful pill-shaped buttons with spring animations
 * Deep Rich Red primary, Golden Yellow secondary
 *
 * Sizes: sm (36px), md (44px), lg (52px), xl (60px - driver)
 * Variants: primary, secondary, ghost, danger, outline, link, success
 */
const buttonVariants = cva(
  [
    // Base styles
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "font-body font-semibold",
    // V6 Motion: Spring-based transitions
    "transition-all duration-normal ease-spring",
    // Focus ring
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary",
    // Disabled state
    "disabled:pointer-events-none disabled:opacity-40 disabled:cursor-not-allowed",
    // Active press scale
    "active:scale-[0.98]",
    // Icon sizing
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        // V6 Primary: Deep Rich Red - main actions
        primary: [
          "bg-primary text-text-inverse",
          "shadow-md",
          "hover:bg-primary-hover hover:shadow-button-hover hover:-translate-y-0.5",
          "active:bg-primary-active active:shadow-sm active:translate-y-0",
        ].join(" "),

        // V6 Secondary: Golden Yellow - secondary CTAs
        secondary: [
          "bg-secondary text-text-primary",
          "shadow-md",
          "hover:bg-secondary-hover hover:shadow-card hover:-translate-y-0.5",
          "active:bg-secondary-active active:shadow-sm active:translate-y-0",
        ].join(" "),

        // V6 Ghost: Transparent with primary text
        ghost: [
          "text-primary bg-transparent",
          "border border-transparent",
          "hover:bg-primary-light hover:border-primary/20",
          "active:bg-primary/10",
        ].join(" "),

        // V6 Danger: Error red for destructive actions
        danger: [
          "bg-status-error text-text-inverse",
          "shadow-md",
          "hover:brightness-110 hover:shadow-card-hover hover:-translate-y-0.5",
          "active:shadow-sm active:translate-y-0",
        ].join(" "),

        // V6 Success: Green for positive confirmation
        success: [
          "bg-green text-text-inverse",
          "shadow-md",
          "hover:bg-green-hover hover:shadow-card-hover hover:-translate-y-0.5",
          "active:shadow-sm active:translate-y-0",
        ].join(" "),

        // V6 Outline: Border with primary accent
        outline: [
          "bg-surface-primary text-primary",
          "border-2 border-primary",
          "hover:bg-primary-light hover:-translate-y-0.5",
          "active:bg-primary/10 active:translate-y-0",
        ].join(" "),

        // V6 Link: Text-only with underline
        link: [
          "text-primary underline-offset-4 p-0 h-auto",
          "hover:underline hover:text-primary-hover",
          "active:text-primary-active",
        ].join(" "),

        // V5 Default: Maps to V6 primary for backwards compatibility
        default: [
          "bg-primary text-text-inverse",
          "shadow-md",
          "hover:bg-primary-hover hover:shadow-button-hover hover:-translate-y-0.5",
          "active:bg-primary-active active:shadow-sm active:translate-y-0",
        ].join(" "),
      },

      size: {
        // V6 Sizes: Generous padding, pill radius
        sm: "h-9 px-4 py-2 text-sm rounded-button [&_svg]:h-4 [&_svg]:w-4",
        md: "h-11 px-6 py-3 text-base rounded-button [&_svg]:h-4 [&_svg]:w-4",
        lg: "h-[52px] px-8 py-3.5 text-base rounded-button [&_svg]:h-5 [&_svg]:w-5",
        xl: "h-[60px] px-10 py-4 text-lg rounded-button [&_svg]:h-5 [&_svg]:w-5", // Driver size

        // Icon-only variants (square with pill radius)
        icon: "h-11 w-11 rounded-button [&_svg]:h-5 [&_svg]:w-5",
        "icon-sm": "h-9 w-9 rounded-button [&_svg]:h-4 [&_svg]:w-4",
        "icon-lg": "h-[52px] w-[52px] rounded-button [&_svg]:h-5 [&_svg]:w-5",
        "icon-xl": "h-[60px] w-[60px] rounded-button [&_svg]:h-6 [&_svg]:w-6", // Driver icon

        // Default maps to md
        default: "h-11 px-6 py-3 text-base rounded-button [&_svg]:h-4 [&_svg]:w-4",
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
