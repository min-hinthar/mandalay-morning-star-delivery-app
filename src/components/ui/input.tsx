"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils/cn";
import { spring, inputFocus } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

/**
 * V7 Input System - Pepper Aesthetic with Framer Motion
 * Rounded corners, animated focus glow, V6 color palette
 *
 * Height: 44px default, 12px border radius
 * Variants: default, error, success
 *
 * Motion: Focus animates contextual glow (amber/red/green)
 */
const inputVariants = cva(
  [
    "flex w-full",
    // V6 Surface and text
    "bg-surface-primary text-text-primary",
    // V6 Border
    "border border-border",
    // V6 Typography
    "font-body text-base",
    // V6 Border radius
    "rounded-input",
    // Placeholder
    "placeholder:text-text-muted",
    // V6 Motion (CSS fallback for color transitions)
    "transition-colors duration-normal ease-default",
    // V6 Focus: Primary red ring (CSS fallback)
    "focus-visible:outline-none focus-visible:border-primary",
    // Disabled state
    "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-tertiary",
    // File input styling
    "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-primary",
  ].join(" "),
  {
    variants: {
      size: {
        default: "h-11 px-4 py-3",
        sm: "h-9 px-3 py-2 text-sm",
        lg: "h-12 px-4 py-3",
        xl: "h-14 px-5 py-4 text-lg", // Driver size
      },
      variant: {
        default: "",
        error: [
          "border-status-error",
          "focus-visible:border-status-error",
          "bg-status-error-bg",
        ].join(" "),
        success: [
          "border-green",
          "focus-visible:border-green",
          "bg-green-light",
        ].join(" "),
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
);

// Omit conflicting event handlers from React's InputHTMLAttributes
type InputHTMLProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size" | "onDrag" | "onDragEnd" | "onDragStart" | "onAnimationStart"
>;

export interface InputProps
  extends InputHTMLProps,
    VariantProps<typeof inputVariants> {
  /** Error message to display below input */
  error?: string;
  /** Helper text to display below input */
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, size, variant, error, helperText, onFocus, onBlur, ...props }, ref) => {
    const { shouldAnimate } = useAnimationPreference();
    const [isFocused, setIsFocused] = React.useState(false);

    const hasError = Boolean(error);
    const effectiveVariant = hasError ? "error" : variant;

    // Determine the appropriate glow color based on variant
    const getGlowStyle = () => {
      if (!isFocused) return inputFocus.initial;
      if (effectiveVariant === "error") return inputFocus.error;
      if (effectiveVariant === "success") return inputFocus.success;
      return inputFocus.focus;
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    return (
      <div className="w-full">
        <motion.input
          type={type}
          className={cn(inputVariants({ size, variant: effectiveVariant, className }))}
          ref={ref}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined}
          onFocus={handleFocus}
          onBlur={handleBlur}
          animate={shouldAnimate ? getGlowStyle() : undefined}
          transition={shouldAnimate ? spring.snappyButton : undefined}
          {...props}
        />
        {error && (
          <p
            id={`${props.id}-error`}
            className="mt-1.5 text-sm text-status-error flex items-center gap-1"
            role="alert"
          >
            <svg
              className="h-4 w-4 shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
        {!error && helperText && (
          <p
            id={`${props.id}-helper`}
            className="mt-1.5 text-sm text-text-secondary"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input, inputVariants };
