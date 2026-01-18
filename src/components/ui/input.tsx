"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

/**
 * V5 Input System
 * High contrast design with V5 semantic tokens
 *
 * Height: 44px, refined styling with V5 design tokens
 * Variants: default, error, success
 */
const inputVariants = cva(
  [
    "flex w-full",
    "bg-[var(--color-surface-primary)] text-[var(--color-text-primary)]",
    "border border-[var(--color-border-default)]",
    "font-[var(--font-body)] text-base",
    "placeholder:text-[var(--color-text-secondary)]",
    "transition-all duration-[var(--duration-fast)]",
    "focus-visible:outline-none focus-visible:border-[var(--color-interactive-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-interactive-primary)]/20",
    "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--color-surface-tertiary)]",
    "file:border-0 file:bg-transparent file:text-sm file:font-medium",
  ].join(" "),
  {
    variants: {
      size: {
        default: "h-11 px-4 py-3 rounded-[var(--radius-sm)]",
        sm: "h-9 px-3 py-2 text-sm rounded-[var(--radius-sm)]",
        lg: "h-12 px-4 py-3 rounded-[var(--radius-md)]",
      },
      variant: {
        default: "",
        error: [
          "border-[var(--color-status-error)]",
          "focus-visible:border-[var(--color-status-error)] focus-visible:ring-[var(--color-status-error)]/20",
          "bg-[var(--color-status-error-bg)]",
        ].join(" "),
        success: [
          "border-[var(--color-status-success)]",
          "focus-visible:border-[var(--color-status-success)] focus-visible:ring-[var(--color-status-success)]/20",
          "bg-[var(--color-status-success-bg)]",
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
            className="mt-1.5 text-sm text-[var(--color-status-error)] flex items-center gap-1"
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
            className="mt-1.5 text-sm text-[var(--color-text-secondary)]"
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
