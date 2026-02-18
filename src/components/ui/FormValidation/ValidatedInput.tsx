"use client";

/**
 * ValidatedInput Component
 *
 * Input with built-in validation, animated error/success icons,
 * shake animation, and accessibility support.
 */

import {
  useState,
  useCallback,
  useEffect,
  useId,
  forwardRef,
  useRef,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { m, AnimatePresence, useReducedMotion } from "framer-motion";
import { AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { ValidationRule, ValidationState } from "./types";
import { ValidationMessage } from "./ValidationMessage";

// ============================================
// ANIMATION VARIANTS
// ============================================

const iconVariants = {
  hidden: { opacity: 0, scale: 0.6 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 20,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.1 },
  },
};

const shakeVariants = {
  shake: {
    x: [0, -6, 6, -4, 4, -2, 2, 0],
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

// ============================================
// VALIDATED INPUT
// ============================================

export interface ValidatedInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange"
> {
  /** Validation rules to apply */
  rules?: ValidationRule[];
  /** External validation state (controlled) */
  validationState?: ValidationState;
  /** External error message (controlled) */
  errorMessage?: string | null;
  /** Show success state with check icon */
  showSuccess?: boolean;
  /** Shake input on error */
  shakeOnError?: boolean;
  /** Label text */
  label?: string;
  /** Helper text shown below input */
  helperText?: string;
  /** Icon to show on the left side */
  leftIcon?: ReactNode;
  /** Callback when value changes */
  onChange?: (value: string) => void;
  /** Callback when validation state changes */
  onValidationChange?: (state: ValidationState, message: string | null) => void;
  /** Container class name */
  containerClassName?: string;
  /** Input wrapper class name (for relative positioning) */
  wrapperClassName?: string;
}

export const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
  (
    {
      rules = [],
      validationState: externalState,
      errorMessage: externalMessage,
      showSuccess = true,
      shakeOnError = true,
      label,
      helperText,
      leftIcon,
      onChange,
      onValidationChange,
      containerClassName,
      wrapperClassName,
      className,
      onBlur,
      disabled,
      id: providedId,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = providedId ?? generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const [internalState, setInternalState] = useState<ValidationState>("idle");
    const [internalMessage, setInternalMessage] = useState<string | null>(null);
    const [hasBlurred, setHasBlurred] = useState(false);
    const [shouldShake, setShouldShake] = useState(false);

    const prefersReducedMotion = useReducedMotion();
    const inputRef = useRef<HTMLInputElement | null>(null);

    // Use external state if provided, otherwise internal
    const state = externalState ?? internalState;
    const message = externalMessage ?? internalMessage;

    // Trigger shake animation on error
    useEffect(() => {
      if (state === "invalid" && shakeOnError && !prefersReducedMotion) {
        setShouldShake(true);
        const timer = setTimeout(() => setShouldShake(false), 400);
        return () => clearTimeout(timer);
      }
    }, [state, shakeOnError, prefersReducedMotion, message]);

    const validate = useCallback(
      (value: string): boolean => {
        for (const rule of rules) {
          if (!rule.validate(value)) {
            setInternalState("invalid");
            setInternalMessage(rule.message);
            onValidationChange?.("invalid", rule.message);
            return false;
          }
        }
        setInternalState("valid");
        setInternalMessage(null);
        onValidationChange?.("valid", null);
        return true;
      },
      [rules, onValidationChange]
    );

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        onChange?.(value);

        // Re-validate on change only if we've already shown an error
        if (hasBlurred && state === "invalid") {
          validate(value);
        }
      },
      [onChange, hasBlurred, state, validate]
    );

    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        setHasBlurred(true);
        if (rules.length > 0) {
          validate(e.target.value);
        }
        onBlur?.(e);
      },
      [rules, validate, onBlur]
    );

    const getBorderClass = () => {
      if (disabled) return "border-[var(--color-border)]";
      switch (state) {
        case "invalid":
          return "border-[var(--color-status-error)] focus:border-[var(--color-status-error)] focus:ring-[var(--color-status-error)]/20";
        case "valid":
          return showSuccess
            ? "border-[var(--color-accent-secondary)] focus:border-[var(--color-accent-secondary)] focus:ring-[var(--color-accent-secondary)]/20"
            : "border-[var(--color-border)] focus:border-[var(--color-accent-tertiary)] focus:ring-[var(--color-accent-tertiary)]/20";
        default:
          return "border-[var(--color-border)] focus:border-[var(--color-accent-tertiary)] focus:ring-[var(--color-accent-tertiary)]/20";
      }
    };

    const getBackgroundClass = () => {
      if (disabled) return "bg-[var(--color-surface-muted)]";
      if (state === "invalid") return "bg-[var(--color-status-error-bg)]";
      return "bg-[var(--color-surface)]";
    };

    // Build aria-describedby
    const describedBy =
      [message ? errorId : null, helperText && !message ? helperId : null]
        .filter(Boolean)
        .join(" ") || undefined;

    return (
      <div className={cn("w-full", containerClassName)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "block text-sm font-medium mb-1.5",
              disabled ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-primary)]"
            )}
          >
            {label}
            {props.required && (
              <span className="text-[var(--color-status-error)] ml-0.5" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        {/* Input wrapper */}
        <m.div
          className={cn("relative", wrapperClassName)}
          animate={shouldShake ? "shake" : undefined}
          variants={shakeVariants}
        >
          {/* Left icon */}
          {leftIcon && (
            <div
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] pointer-events-none"
              aria-hidden="true"
            >
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={(node) => {
              inputRef.current = node;
              if (typeof ref === "function") {
                ref(node);
              } else if (ref) {
                ref.current = node;
              }
            }}
            id={inputId}
            disabled={disabled}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={state === "invalid"}
            aria-describedby={describedBy}
            className={cn(
              // Base styles
              "w-full rounded-[var(--radius-md)] px-3 py-2.5",
              "text-[var(--color-text-primary)] text-base",
              "border-2 transition-all duration-[var(--duration-fast)]",
              "focus:outline-none focus:ring-4",
              "placeholder:text-[var(--color-text-secondary)]",
              // Dynamic styles
              getBorderClass(),
              getBackgroundClass(),
              // Conditional padding
              leftIcon && "pl-10",
              (state === "invalid" || (state === "valid" && showSuccess)) && "pr-10",
              // Disabled state
              disabled && "cursor-not-allowed opacity-60",
              className
            )}
            {...props}
          />

          {/* Status icons */}
          <AnimatePresence mode="wait">
            {state === "invalid" && (
              <m.div
                key="error-icon"
                variants={iconVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              >
                <AlertCircle className="h-5 w-5 text-[var(--color-status-error)]" />
              </m.div>
            )}
            {state === "valid" && showSuccess && (
              <m.div
                key="success-icon"
                variants={iconVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              >
                <Check className="h-5 w-5 text-[var(--color-accent-secondary)]" />
              </m.div>
            )}
          </AnimatePresence>
        </m.div>

        {/* Error message */}
        <div id={errorId}>
          <ValidationMessage message={message} type="error" />
        </div>

        {/* Helper text (only show when no error) */}
        {helperText && !message && (
          <p id={helperId} className="mt-1.5 text-sm text-[var(--color-text-secondary)]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

ValidatedInput.displayName = "ValidatedInput";
