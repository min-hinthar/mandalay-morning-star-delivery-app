"use client";

/**
 * ValidatedTextarea Component
 *
 * Textarea with built-in validation, shake animation, and character count.
 */

import {
  useState,
  useCallback,
  useEffect,
  useId,
  forwardRef,
} from "react";
import { m, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import type { ValidationRule, ValidationState } from "./types";
import { ValidationMessage } from "./ValidationMessage";

// ============================================
// ANIMATION VARIANTS
// ============================================

const shakeVariants = {
  shake: {
    x: [0, -6, 6, -4, 4, -2, 2, 0],
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

// ============================================
// VALIDATED TEXTAREA
// ============================================

export interface ValidatedTextareaProps
  extends Omit<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    "onChange"
  > {
  /** Validation rules to apply */
  rules?: ValidationRule[];
  /** External validation state (controlled) */
  validationState?: ValidationState;
  /** External error message (controlled) */
  errorMessage?: string | null;
  /** Show success state */
  showSuccess?: boolean;
  /** Shake on error */
  shakeOnError?: boolean;
  /** Label text */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Character count display */
  showCharCount?: boolean;
  /** Max characters for count display */
  maxChars?: number;
  /** Callback when value changes */
  onChange?: (value: string) => void;
  /** Callback when validation state changes */
  onValidationChange?: (state: ValidationState, message: string | null) => void;
  /** Container class name */
  containerClassName?: string;
}

export const ValidatedTextarea = forwardRef<
  HTMLTextAreaElement,
  ValidatedTextareaProps
>((props, ref) => {
  const {
    rules = [],
    validationState: externalState,
    errorMessage: externalMessage,
    showSuccess = true,
    shakeOnError = true,
    label,
    helperText,
    showCharCount = false,
    maxChars,
    onChange,
    onValidationChange,
    containerClassName,
    className,
    onBlur,
    disabled,
    id: providedId,
    value,
    defaultValue,
    ...rest
  } = props;

  const generatedId = useId();
  const textareaId = providedId ?? generatedId;
  const errorId = `${textareaId}-error`;
  const helperId = `${textareaId}-helper`;

  const [internalState, setInternalState] = useState<ValidationState>("idle");
  const [internalMessage, setInternalMessage] = useState<string | null>(null);
  const [hasBlurred, setHasBlurred] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);
  const [charCount, setCharCount] = useState(
    () => (value?.toString() ?? defaultValue?.toString() ?? "").length
  );

  const prefersReducedMotion = useReducedMotion();

  const state = externalState ?? internalState;
  const message = externalMessage ?? internalMessage;

  useEffect(() => {
    if (state === "invalid" && shakeOnError && !prefersReducedMotion) {
      setShouldShake(true);
      const timer = setTimeout(() => setShouldShake(false), 400);
      return () => clearTimeout(timer);
    }
  }, [state, shakeOnError, prefersReducedMotion, message]);

  const validate = useCallback(
    (val: string): boolean => {
      for (const rule of rules) {
        if (!rule.validate(val)) {
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
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setCharCount(val.length);
      onChange?.(val);

      if (hasBlurred && state === "invalid") {
        validate(val);
      }
    },
    [onChange, hasBlurred, state, validate]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLTextAreaElement>) => {
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

  const describedBy = [
    message ? errorId : null,
    helperText && !message ? helperId : null,
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  const isOverLimit = maxChars ? charCount > maxChars : false;

  return (
    <div className={cn("w-full", containerClassName)}>
      {label && (
        <label
          htmlFor={textareaId}
          className={cn(
            "block text-sm font-medium mb-1.5",
            disabled
              ? "text-[var(--color-text-secondary)]"
              : "text-[var(--color-text-primary)]"
          )}
        >
          {label}
          {rest.required && (
            <span
              className="text-[var(--color-status-error)] ml-0.5"
              aria-hidden="true"
            >
              *
            </span>
          )}
        </label>
      )}

      <m.div
        className="relative"
        animate={shouldShake ? "shake" : undefined}
        variants={shakeVariants}
      >
        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={state === "invalid"}
          aria-describedby={describedBy}
          className={cn(
            "w-full rounded-[var(--radius-md)] px-3 py-2.5",
            "text-[var(--color-text-primary)] text-base",
            "border-2 transition-all duration-[var(--duration-fast)]",
            "focus:outline-none focus:ring-4",
            "placeholder:text-[var(--color-text-secondary)]",
            "resize-y min-h-[100px]",
            getBorderClass(),
            getBackgroundClass(),
            disabled && "cursor-not-allowed opacity-60",
            className
          )}
          {...rest}
        />
      </m.div>

      {/* Footer row: error/helper + char count */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div id={errorId}>
            <ValidationMessage message={message} type="error" />
          </div>
          {helperText && !message && (
            <p
              id={helperId}
              className="mt-1.5 text-sm text-[var(--color-text-secondary)]"
            >
              {helperText}
            </p>
          )}
        </div>

        {showCharCount && (
          <span
            className={cn(
              "mt-1.5 text-sm flex-shrink-0",
              isOverLimit
                ? "text-[var(--color-status-error)]"
                : "text-[var(--color-text-secondary)]"
            )}
          >
            {charCount}
            {maxChars && ` / ${maxChars}`}
          </span>
        )}
      </div>
    </div>
  );
});

ValidatedTextarea.displayName = "ValidatedTextarea";
