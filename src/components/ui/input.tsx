"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

/**
 * V3 Input System
 * Premium Burmese aesthetic with warm tones
 *
 * Height: 44px, refined styling with V3 design tokens
 */
const inputVariants = cva(
  [
    "flex w-full",
    "bg-[var(--color-surface)] text-[var(--color-charcoal)]",
    "border border-[var(--color-border)]",
    "font-[var(--font-body)] text-base",
    "placeholder:text-[var(--color-charcoal-muted)]",
    "transition-all duration-[var(--duration-fast)]",
    "focus-visible:outline-none focus-visible:border-[var(--color-cta)] focus-visible:ring-2 focus-visible:ring-[var(--color-cta)]/20",
    "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--color-cream-darker)]",
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
          "border-[var(--color-error)]",
          "focus-visible:border-[var(--color-error)] focus-visible:ring-[var(--color-error)]/20",
          "bg-[var(--color-error-light)]",
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
            className="mt-1.5 text-sm text-[var(--color-error)] flex items-center gap-1"
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
            className="mt-1.5 text-sm text-[var(--color-charcoal-muted)]"
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
