"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

/**
 * V6 Input System - Pepper Aesthetic
 * Rounded corners, clear focus states, V6 color palette
 *
 * Height: 44px default, 12px border radius
 * Variants: default, error, success
 */
const inputVariants = cva(
  [
    "flex w-full",
    // V6 Surface and text
    "bg-v6-surface-primary text-v6-text-primary",
    // V6 Border
    "border border-v6-border",
    // V6 Typography
    "font-v6-body text-base",
    // V6 Border radius
    "rounded-v6-input",
    // Placeholder
    "placeholder:text-v6-text-muted",
    // V6 Motion
    "transition-all duration-v6-normal ease-v6-default",
    // V6 Focus: Primary red ring
    "focus-visible:outline-none focus-visible:border-v6-primary focus-visible:ring-2 focus-visible:ring-v6-primary/20",
    // Disabled state
    "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-v6-surface-tertiary",
    // File input styling
    "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-v6-primary",
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
          "border-v6-status-error",
          "focus-visible:border-v6-status-error focus-visible:ring-v6-status-error/20",
          "bg-v6-status-error-bg",
        ].join(" "),
        success: [
          "border-v6-green",
          "focus-visible:border-v6-green focus-visible:ring-v6-green/20",
          "bg-v6-green-light",
        ].join(" "),
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  /** Error message to display below input */
  error?: string;
  /** Helper text to display below input */
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, size, variant, error, helperText, ...props }, ref) => {
    const hasError = Boolean(error);
    const effectiveVariant = hasError ? "error" : variant;

    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(inputVariants({ size, variant: effectiveVariant, className }))}
          ref={ref}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined}
          {...props}
        />
        {error && (
          <p
            id={`${props.id}-error`}
            className="mt-1.5 text-sm text-v6-status-error flex items-center gap-1"
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
            className="mt-1.5 text-sm text-v6-text-secondary"
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
